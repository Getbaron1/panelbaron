import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, RefreshCw, Send, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, formatDate, formatDateTime, truncateText } from '@/lib/utils'

type ChatSender = 'bar' | 'admin'

interface ChatMessage {
  id: string
  sender: ChatSender
  content: string
  timestamp: string
  user_id: string
  admin_id: string | null
}

interface ConversationSummary {
  userId: string
  userName: string
  lastMessage: ChatMessage
}

interface EstablishmentInfo {
  id: string
  name: string
  slug: string | null
  phone: string | null
  status: string | null
  created_at: string
  logo_url: string | null
  owner_id: string
}

interface DiagnosticsState {
  totalMessages: number | null
  lastError: string | null
  lastUpdatedAt: string | null
}

function getAdminId(): string {
  try {
    const raw = localStorage.getItem('baron_admin_user')
    if (!raw) return 'painel'
    const data = JSON.parse(raw) as { id?: string }
    return data.id || 'painel'
  } catch {
    return 'painel'
  }
}

async function fetchEstablishmentNames(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>()
  const { data, error } = await supabase
    .from('establishments')
    .select('id, name, owner_id')
    .in('owner_id', userIds)

  if (error) {
    return new Map<string, string>()
  }

  const nameMap = new Map<string, string>()
  for (const row of data || []) {
    if (row.owner_id && row.name) {
      nameMap.set(row.owner_id, row.name)
    }
  }
  return nameMap
}

export default function Suporte() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    totalMessages: null,
    lastError: null,
    lastUpdatedAt: null,
  })
  const [establishments, setEstablishments] = useState<Record<string, EstablishmentInfo>>({})

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const greetedUsersRef = useRef<Set<string>>(new Set())
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const lastMessageTsRef = useRef<string | null>(null)
  const isAtBottomRef = useRef(true)

  const selectedConversation = useMemo(
    () => conversations.find(item => item.userId === selectedUserId) || null,
    [conversations, selectedUserId]
  )

  useEffect(() => {
    loadConversations()
    loadDiagnostics()
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([])
      setShowProfileInfo(false)
      lastMessageTsRef.current = null
      return
    }
    loadMessages(selectedUserId)
    setShowProfileInfo(false)
  }, [selectedUserId])

  useEffect(() => {
    if (messages.length === 0) return
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  useEffect(() => {
    if (!selectedUserId) return
    const interval = setInterval(() => {
      loadNewMessages(selectedUserId)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedUserId])

  useEffect(() => {
    if (!selectedUserId) return
    const channel = supabase
      .channel(`chat_messages_${selectedUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${selectedUserId}`,
        },
        payload => {
          const incoming = payload.new as ChatMessage
          setMessages(prev => {
            if (prev.some(msg => msg.id === incoming.id)) {
              return prev
            }
            return [...prev, incoming]
          })
          setConversations(prev => updateConversationList(prev, incoming))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUserId])

  useEffect(() => {
    const channel = supabase
      .channel('chat_messages_all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        payload => {
          const incoming = payload.new as ChatMessage
          setConversations(prev => updateConversationList(prev, incoming))
          if (selectedUserId && incoming.user_id === selectedUserId) {
            setMessages(prev => {
              if (prev.some(msg => msg.id === incoming.id)) {
                return prev
              }
              return [...prev, incoming]
            })
          }
          if (incoming.sender === 'bar') {
            maybeSendWelcomeMessage(incoming.user_id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUserId])


  async function loadConversations() {
    try {
      setLoadingConversations(true)
      setError(null)
      const primary = await fetchConversations('timestamp')
      if (primary.error) {
        const fallback = await fetchConversations('created_at')
        if (fallback.error) {
          throw fallback.error
        }
        await applyConversationData(fallback.data || [])
        return
      }
      await applyConversationData(primary.data || [])

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar conversas')
    } finally {
      setLoadingConversations(false)
    }
  }

  async function fetchConversations(orderBy: 'timestamp' | 'created_at') {
    return supabase
      .from('chat_messages')
      .select('id, sender, content, timestamp, user_id, admin_id')
      .order(orderBy, { ascending: false })
      .limit(500)
  }

  async function applyConversationData(data: ChatMessage[]) {
    const userIds = Array.from(new Set(data.map(item => item.user_id)))
    const nameMap = await fetchEstablishmentNames(userIds)
    const establishmentsMap = await fetchEstablishmentDetails(userIds)
    const summaries: ConversationSummary[] = []
    const seen = new Set<string>()
    for (const message of data) {
      if (seen.has(message.user_id)) continue
      seen.add(message.user_id)
      summaries.push({
        userId: message.user_id,
        userName: nameMap.get(message.user_id) || message.user_id,
        lastMessage: message,
      })
    }

    if (establishmentsMap.size > 0) {
      const next: Record<string, EstablishmentInfo> = {}
      for (const [userId, info] of establishmentsMap.entries()) {
        next[userId] = info
      }
      setEstablishments(prev => ({ ...prev, ...next }))
    }

    setConversations(summaries)

    if (!selectedUserId && summaries.length > 0) {
      setSelectedUserId(summaries[0].userId)
    }
  }

  async function fetchEstablishmentDetails(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, EstablishmentInfo>()
    const { data, error } = await supabase
      .from('establishments')
      .select('id, name, slug, phone, status, created_at, logo_url, owner_id')
      .in('owner_id', userIds)

    if (error) {
      return new Map<string, EstablishmentInfo>()
    }

    const infoMap = new Map<string, EstablishmentInfo>()
    for (const row of data || []) {
      if (row.owner_id) {
        infoMap.set(row.owner_id, row as EstablishmentInfo)
      }
    }
    return infoMap
  }

  async function loadDiagnostics() {
    try {
      const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })

      if (countError) {
        setDiagnostics({
          totalMessages: null,
          lastError: countError.message,
          lastUpdatedAt: new Date().toISOString(),
        })
        return
      }

      setDiagnostics({
        totalMessages: count ?? 0,
        lastError: null,
        lastUpdatedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      setDiagnostics({
        totalMessages: null,
        lastError: err.message || 'Falha ao consultar diagnostico',
        lastUpdatedAt: new Date().toISOString(),
      })
    }
  }

  async function loadMessages(userId: string) {
    try {
      setLoadingMessages(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('id, sender, content, timestamp, user_id, admin_id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const next = (data || []) as ChatMessage[]
      setMessages(next)
      if (next.length > 0) {
        lastMessageTsRef.current = next[next.length - 1].timestamp
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mensagens')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function loadNewMessages(userId: string) {
    try {
      const lastTs = lastMessageTsRef.current
      const query = supabase
        .from('chat_messages')
        .select('id, sender, content, timestamp, user_id, admin_id')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })

      const { data, error: fetchError } = lastTs
        ? await query.gt('timestamp', lastTs)
        : await query

      if (fetchError) {
        return
      }

      const incoming = (data || []) as ChatMessage[]
      if (incoming.length === 0) return

      setMessages(prev => {
        const existingIds = new Set(prev.map(item => item.id))
        const merged = [...prev, ...incoming.filter(item => !existingIds.has(item.id))]
        if (merged.length > 0) {
          lastMessageTsRef.current = merged[merged.length - 1].timestamp
        }
        return merged
      })
    } catch {
      // Ignorar falhas do polling
    }
  }

  async function handleSendMessage() {
    if (!selectedUserId) return
    const content = messageText.trim()
    if (!content) return

    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert([
          {
            sender: 'admin',
            content,
            timestamp: new Date().toISOString(),
            user_id: selectedUserId,
            admin_id: getAdminId(),
          },
        ])
        .select('id, sender, content, timestamp, user_id, admin_id')
        .single()

      if (insertError) {
        throw insertError
      }

      if (data) {
        setMessages(prev => [...prev, data as ChatMessage])
        setConversations(prev => updateConversationList(prev, data as ChatMessage))
      }
      setMessageText('')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem')
    }
  }

  async function handleFinalizeChat() {
    if (!selectedUserId) return
    try {
      setError(null)
      const fechamento =
        'Obrigado pelo contato! Esperamos ter ajudado. Avalie nosso suporte quando puder.'
      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert([
          {
            sender: 'admin',
            content: fechamento,
            timestamp: new Date().toISOString(),
            user_id: selectedUserId,
            admin_id: getAdminId(),
          },
        ])
        .select('id, sender, content, timestamp, user_id, admin_id')
        .single()

      if (insertError) {
        throw insertError
      }

      if (data) {
        setMessages(prev => [...prev, data as ChatMessage])
        setConversations(prev => updateConversationList(prev, data as ChatMessage))
      }

      const userIdToDelete = selectedUserId
      setTimeout(async () => {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', userIdToDelete)
      }, 15 * 60 * 1000)
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar chat')
    }
  }

  async function maybeSendWelcomeMessage(userId: string) {
    if (greetedUsersRef.current.has(userId)) return

    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('sender', 'admin')

      if (error) return
      if ((count || 0) > 0) {
        greetedUsersRef.current.add(userId)
        return
      }

      const content =
        'Ola! Tudo bem? 😊\nLogo um atendente entrara em contato.\nPara agilizar, me informe seu nome, nome do estabelecimento e descreva o que aconteceu, por favor.'

      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert([
          {
            sender: 'admin',
            content,
            timestamp: new Date().toISOString(),
            user_id: userId,
            admin_id: getAdminId(),
          },
        ])

      if (!insertError) {
        greetedUsersRef.current.add(userId)
      }
    } catch {
      // Se falhar, tentamos novamente no proximo evento
    }
  }

  function updateConversationList(
    current: ConversationSummary[],
    lastMessage: ChatMessage
  ) {
      const updated = current.filter(item => item.userId !== lastMessage.user_id)
    return [
      {
        userId: lastMessage.user_id,
        userName: current.find(item => item.userId === lastMessage.user_id)?.userName || lastMessage.user_id,
        lastMessage
      },
      ...updated,
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-muted-foreground">Atendimento 1:1 com os bares</p>
        </div>
        <Button variant="outline" onClick={loadConversations}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Conversas</p>
              <p className="text-xs text-muted-foreground">{conversations.length} usuarios</p>
            </div>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="border-b border-border/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p>Msgs no banco: {diagnostics.totalMessages ?? '-'}</p>
            <p>Ultima verificacao: {diagnostics.lastUpdatedAt ? formatDateTime(diagnostics.lastUpdatedAt) : '-'}</p>
            {diagnostics.lastError && (
              <p className="text-destructive">Erro: {diagnostics.lastError}</p>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loadingConversations && (
              <div className="px-4 py-6 text-sm text-muted-foreground">Carregando conversas...</div>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma conversa encontrada
              </div>
            )}
            {!loadingConversations && conversations.map(conversation => {
              const isActive = conversation.userId === selectedUserId
              return (
                <button
                  key={conversation.userId}
                  onClick={() => setSelectedUserId(conversation.userId)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/30 hover:bg-muted/40 transition-colors',
                    isActive && 'bg-muted/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {establishments[conversation.userId]?.logo_url ? (
                      <img
                        src={establishments[conversation.userId].logo_url as string}
                        alt={conversation.userName}
                        className={cn(
                          'h-9 w-9 rounded-xl object-cover border',
                          isActive ? 'border-primary/60' : 'border-border/60'
                        )}
                      />
                    ) : (
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{conversation.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {truncateText(conversation.lastMessage.content || '', 48)}
                      </p>
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(conversation.lastMessage.timestamp)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-0 flex flex-col h-[70vh] min-h-0">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Conversa</p>
              <p className="text-xs text-muted-foreground">
                {selectedConversation ? `Bar: ${selectedConversation.userName}` : 'Selecione uma conversa'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedConversation && (
                <p className="text-xs text-muted-foreground">
                  Ultima: {formatDateTime(selectedConversation.lastMessage.timestamp)}
                </p>
              )}
              {selectedUserId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfileInfo(prev => !prev)}
                >
                  {showProfileInfo ? 'Ocultar perfil' : 'Ver perfil'}
                </Button>
              )}
            </div>
          </div>

          {showProfileInfo && selectedUserId && establishments[selectedUserId] && (
            <div className="border-b border-border/50 px-4 py-4">
              <div className="flex items-center gap-4">
                {establishments[selectedUserId].logo_url ? (
                  <img
                    src={establishments[selectedUserId].logo_url as string}
                    alt={establishments[selectedUserId].name}
                    className="h-12 w-12 rounded-2xl object-cover border border-border/60"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{establishments[selectedUserId].name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {establishments[selectedUserId].slug || 'Sem slug'}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Status: {establishments[selectedUserId].status || 'indefinido'}</p>
                  <p>Cadastro: {formatDate(establishments[selectedUserId].created_at)}</p>
                </div>
              </div>
              {establishments[selectedUserId].phone && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Telefone: {establishments[selectedUserId].phone}
                </p>
              )}
            </div>
          )}

          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4"
            onScroll={() => {
              const el = messagesContainerRef.current
              if (!el) return
              const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
              isAtBottomRef.current = distanceToBottom < 80
            }}
          >
            {!selectedUserId && (
              <div className="text-sm text-muted-foreground">Escolha uma conversa para visualizar.</div>
            )}
            {selectedUserId && loadingMessages && (
              <div className="text-sm text-muted-foreground">Carregando mensagens...</div>
            )}
            {selectedUserId && !loadingMessages && messages.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
            )}
            {selectedUserId && !loadingMessages && messages.map(message => {
              const isAdmin = message.sender === 'admin'
              return (
                <div key={message.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                      isAdmin
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px]',
                        isAdmin ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}
                    >
                      {formatDateTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/50 px-4 py-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                handleSendMessage()
              }}
            >
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={3}
                placeholder={selectedUserId ? 'Digite sua mensagem...' : 'Selecione uma conversa'}
                disabled={!selectedUserId}
                className="flex-1 resize-none rounded-2xl border border-border/50 bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <div className="flex gap-2 sm:flex-col">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!selectedUserId || messageText.trim().length === 0}
                  className="sm:self-stretch"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedUserId}
                  onClick={handleFinalizeChat}
                  className="sm:self-stretch"
                >
                  Finalizar
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
