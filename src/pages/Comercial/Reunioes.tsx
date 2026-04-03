import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Plus, Filter, Search, Clock, MapPin, User, Phone, ArrowLeft,
  ChevronLeft, ChevronRight, X, Video, Building2, Check, XCircle, AlertCircle,
  Edit2, Trash2, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Lead {
  id: string;
  nome_estabelecimento: string;
  responsavel_nome: string;
  responsavel_telefone: string;
}

interface MeetingData {
  id: string;
  lead_id: string;
  leads?: Lead;
  sdr_id: string;
  sdr?: { nome: string } | null;
  closer_id: string;
  closer?: { nome: string } | null;
  data_reuniao: string;
  tipo_reuniao: 'presencial' | 'online';
  local: string;
  link_reuniao?: string;
  status: 'agendada' | 'realizada' | 'cancelada' | 'nao_compareceu';
  resultado: string;
  observacoes: string;
}

interface NewMeetingForm {
  lead_id: string;
  data_reuniao: string;
  hora_reuniao: string;
  tipo_reuniao: 'presencial' | 'online';
  local: string;
  link_reuniao: string;
  observacoes: string;
}

// Função para pegar usuário logado
const getCurrentUserId = (): string | null => {
  try {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || null;
    }
  } catch { return null; }
  return null;
};

export default function Reunioes() {
  const navigate = useNavigate();
  const meetingRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  
  // Calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modais
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingData | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form nova reunião
  const [newMeeting, setNewMeeting] = useState<NewMeetingForm>({
    lead_id: '',
    data_reuniao: '',
    hora_reuniao: '',
    tipo_reuniao: 'online',
    local: '',
    link_reuniao: '',
    observacoes: ''
  });

  useEffect(() => {
    loadMeetings();
    loadLeads();
  }, [filterStatus]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('meetings')
        .select(`
          *,
          leads(id, nome_estabelecimento, responsavel_nome, responsavel_telefone),
          sdr:sdr_id(nome),
          closer:closer_id(nome)
        `)
        .order('data_reuniao', { ascending: true });

      if (filterStatus !== 'todos') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMeetings(data || []);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome_estabelecimento, responsavel_nome, responsavel_telefone')
        .order('nome_estabelecimento', { ascending: true });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  // === CALENDÁRIO FUNCTIONS ===
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getMeetingsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return meetings.filter(m => m.data_reuniao.startsWith(dateStr));
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayClick = (day: number) => {
    if (!day) return;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    
    // Scroll para as reuniões desse dia
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayMeetings = meetings.filter(m => m.data_reuniao.startsWith(dateStr));
    if (dayMeetings.length > 0 && meetingRefs.current[dayMeetings[0].id]) {
      meetingRefs.current[dayMeetings[0].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMeetingClick = (meeting: MeetingData) => {
    setSelectedMeeting(meeting);
    setShowDetailModal(true);
  };

  // === NOVA REUNIÃO ===
  const handleCreateMeeting = async () => {
    if (!newMeeting.lead_id || !newMeeting.data_reuniao || !newMeeting.hora_reuniao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const dataReuniao = `${newMeeting.data_reuniao}T${newMeeting.hora_reuniao}:00`;
      const userId = getCurrentUserId();

      const { error } = await supabase
        .from('meetings')
        .insert({
          lead_id: newMeeting.lead_id,
          data_reuniao: dataReuniao,
          tipo_reuniao: newMeeting.tipo_reuniao,
          local: newMeeting.tipo_reuniao === 'presencial' ? newMeeting.local : null,
          link_reuniao: newMeeting.tipo_reuniao === 'online' ? newMeeting.link_reuniao : null,
          observacoes: newMeeting.observacoes,
          status: 'agendada',
          sdr_id: userId,
          criada_por: userId
        });

      if (error) throw error;

      // Atualizar status do lead para reunião marcada
      await supabase
        .from('leads')
        .update({ status: 'reuniao_marcada' })
        .eq('id', newMeeting.lead_id);

      setShowNewMeetingModal(false);
      setNewMeeting({
        lead_id: '',
        data_reuniao: '',
        hora_reuniao: '',
        tipo_reuniao: 'online',
        local: '',
        link_reuniao: '',
        observacoes: ''
      });
      loadMeetings();
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      alert('Erro ao criar reunião');
    } finally {
      setSaving(false);
    }
  };

  // === ATUALIZAR STATUS ===
  const updateMeetingStatus = async (meetingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: newStatus })
        .eq('id', meetingId);

      if (error) throw error;

      // Se realizada, atualizar lead
      if (newStatus === 'realizada' && selectedMeeting?.lead_id) {
        await supabase
          .from('leads')
          .update({ status: 'reuniao_realizada' })
          .eq('id', selectedMeeting.lead_id);
      }

      loadMeetings();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // === DELETE ===
  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) return;
    
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
      loadMeetings();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
    }
  };

  // === HELPERS ===
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendada: 'bg-blue-100 text-blue-800 border-blue-200',
      realizada: 'bg-green-100 text-green-800 border-green-200',
      cancelada: 'bg-red-100 text-red-800 border-red-200',
      nao_compareceu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      agendada: 'Agendada',
      realizada: 'Realizada',
      cancelada: 'Cancelada',
      nao_compareceu: 'Não Compareceu',
    };
    return labels[status] || status;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate || !day) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const filteredMeetings = meetings.filter((m) => {
    const leadName = m.leads?.nome_estabelecimento || '';
    const responsavel = m.leads?.responsavel_nome || '';
    return leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           responsavel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Agrupar reuniões por data
  const groupedMeetings = filteredMeetings.reduce((groups, meeting) => {
    const date = meeting.data_reuniao.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(meeting);
    return groups;
  }, {} as Record<string, MeetingData[]>);

  const sortedDates = Object.keys(groupedMeetings).sort();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/comercial')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📅 Agenda de Reuniões</h1>
              <p className="text-gray-600 mt-1">Gerencie suas reuniões comerciais</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewMeetingModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-lg touch-manipulation"
          >
            <Plus size={20} /> Nova Reunião
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CALENDÁRIO */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            {/* Header do calendário */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="font-bold text-lg">{monthNames[currentDate.getMonth()]}</h2>
                <p className="text-sm text-gray-500">{currentDate.getFullYear()}</p>
              </div>
              <button 
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={goToToday}
              className="w-full mb-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Ir para Hoje
            </button>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((day, index) => {
                const dayMeetings = day ? getMeetingsForDay(day) : [];
                const hasAgendada = dayMeetings.some(m => m.status === 'agendada');
                const hasRealizada = dayMeetings.some(m => m.status === 'realizada');
                
                return (
                  <button
                    key={index}
                    onClick={() => day && handleDayClick(day)}
                    disabled={!day}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                      ${!day ? 'invisible' : 'hover:bg-gray-100 cursor-pointer'}
                      ${isToday(day!) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      ${isSelected(day!) && !isToday(day!) ? 'bg-blue-100 border-2 border-blue-500' : ''}
                    `}
                  >
                    <span className="font-medium">{day}</span>
                    {dayMeetings.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasAgendada && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        {hasRealizada && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">Reunião agendada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Reunião realizada</span>
              </div>
            </div>

            {/* Resumo do mês */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Este mês</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-blue-600">
                    {meetings.filter(m => {
                      const mDate = new Date(m.data_reuniao);
                      return mDate.getMonth() === currentDate.getMonth() && 
                             mDate.getFullYear() === currentDate.getFullYear() &&
                             m.status === 'agendada';
                    }).length}
                  </p>
                  <p className="text-xs text-blue-600">Agendadas</p>
                </div>
                <div className="bg-green-50 rounded-lg py-2">
                  <p className="text-xl font-bold text-green-600">
                    {meetings.filter(m => {
                      const mDate = new Date(m.data_reuniao);
                      return mDate.getMonth() === currentDate.getMonth() && 
                             mDate.getFullYear() === currentDate.getFullYear() &&
                             m.status === 'realizada';
                    }).length}
                  </p>
                  <p className="text-xs text-green-600">Realizadas</p>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE REUNIÕES */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <Search size={18} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar estabelecimento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-sm"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:border-gray-300 text-sm"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="nao_compareceu">Não Compareceu</option>
                </select>
              </div>
            </div>

            {/* Reuniões agrupadas por data */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Carregando reuniões...</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Nenhuma reunião encontrada</p>
                <p className="text-gray-400 text-sm mt-1">Clique em "Nova Reunião" para agendar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {sortedDates.map(date => (
                  <div key={date}>
                    {/* Data header */}
                    <div className="sticky top-0 bg-gray-100 px-4 py-2 rounded-lg mb-2 z-10">
                      <p className="font-semibold text-gray-700">
                        {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long'
                        })}
                      </p>
                    </div>
                    
                    {/* Reuniões do dia */}
                    <div className="space-y-2">
                      {groupedMeetings[date].map((meeting) => (
                        <div
                          key={meeting.id}
                          ref={(el) => { meetingRefs.current[meeting.id] = el; }}
                          onClick={() => handleMeetingClick(meeting)}
                          className={`
                            bg-white border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all
                            ${meeting.status === 'agendada' ? 'border-l-blue-500' : ''}
                            ${meeting.status === 'realizada' ? 'border-l-green-500' : ''}
                            ${meeting.status === 'cancelada' ? 'border-l-red-500' : ''}
                            ${meeting.status === 'nao_compareceu' ? 'border-l-yellow-500' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {meeting.leads?.nome_estabelecimento || 'Lead não encontrado'}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {meeting.leads?.responsavel_nome}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(meeting.status)}`}>
                              {getStatusLabel(meeting.status)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={14} className="text-blue-500" />
                              {formatTime(meeting.data_reuniao)}
                            </div>
                            <div className="flex items-center gap-1">
                              {meeting.tipo_reuniao === 'online' ? (
                                <>
                                  <Video size={14} className="text-purple-500" />
                                  Online
                                </>
                              ) : (
                                <>
                                  <MapPin size={14} className="text-green-500" />
                                  {meeting.local || 'Presencial'}
                                </>
                              )}
                            </div>
                            {meeting.leads?.responsavel_telefone && (
                              <div className="flex items-center gap-1">
                                <Phone size={14} className="text-orange-500" />
                                {meeting.leads.responsavel_telefone}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVA REUNIÃO */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                <h2 className="font-bold text-lg">Nova Reunião</h2>
              </div>
              <button onClick={() => setShowNewMeetingModal(false)} className="p-1 hover:bg-blue-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estabelecimento *
                </label>
                <select
                  value={newMeeting.lead_id}
                  onChange={(e) => setNewMeeting({ ...newMeeting, lead_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um lead</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.nome_estabelecimento} - {lead.responsavel_nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newMeeting.data_reuniao}
                    onChange={(e) => setNewMeeting({ ...newMeeting, data_reuniao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={newMeeting.hora_reuniao}
                    onChange={(e) => setNewMeeting({ ...newMeeting, hora_reuniao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Reunião
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMeeting({ ...newMeeting, tipo_reuniao: 'online' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      newMeeting.tipo_reuniao === 'online'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video size={20} />
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMeeting({ ...newMeeting, tipo_reuniao: 'presencial' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      newMeeting.tipo_reuniao === 'presencial'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={20} />
                    Presencial
                  </button>
                </div>
              </div>

              {/* Link ou Local */}
              {newMeeting.tipo_reuniao === 'online' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link da Reunião (Google Meet, Zoom, etc)
                  </label>
                  <input
                    type="url"
                    value={newMeeting.link_reuniao}
                    onChange={(e) => setNewMeeting({ ...newMeeting, link_reuniao: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Local da Reunião
                  </label>
                  <input
                    type="text"
                    value={newMeeting.local}
                    onChange={(e) => setNewMeeting({ ...newMeeting, local: e.target.value })}
                    placeholder="Endereço ou local do encontro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newMeeting.observacoes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Anotações sobre a reunião..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowNewMeetingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Salvando...' : 'Agendar Reunião'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {showDetailModal && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className={`px-6 py-4 flex items-center justify-between ${
              selectedMeeting.status === 'agendada' ? 'bg-blue-600' :
              selectedMeeting.status === 'realizada' ? 'bg-green-600' :
              selectedMeeting.status === 'cancelada' ? 'bg-red-600' : 'bg-yellow-600'
            } text-white`}>
              <div>
                <h2 className="font-bold text-lg">Detalhes da Reunião</h2>
                <p className="text-sm opacity-90">{getStatusLabel(selectedMeeting.status)}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Estabelecimento */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold">{selectedMeeting.leads?.nome_estabelecimento}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{selectedMeeting.leads?.responsavel_nome}</span>
                </div>
                {selectedMeeting.leads?.responsavel_telefone && (
                  <div className="flex items-center gap-3 text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{selectedMeeting.leads?.responsavel_telefone}</span>
                    <a
                      href={`https://wa.me/55${selectedMeeting.leads.responsavel_telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-green-600 hover:text-green-700"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Data e Hora */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium capitalize">
                  {formatFullDate(selectedMeeting.data_reuniao)}
                </span>
              </div>

              {/* Tipo */}
              <div className="flex items-center gap-3">
                {selectedMeeting.tipo_reuniao === 'online' ? (
                  <>
                    <Video className="w-5 h-5 text-purple-500" />
                    <span>Reunião Online</span>
                    {selectedMeeting.link_reuniao && (
                      <a
                        href={selectedMeeting.link_reuniao}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                      >
                        Acessar Link
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 text-green-500" />
                    <span>{selectedMeeting.local || 'Presencial'}</span>
                  </>
                )}
              </div>

              {/* SDR/Closer */}
              {(selectedMeeting.sdr?.nome || selectedMeeting.closer?.nome) && (
                <div className="flex gap-4 text-sm">
                  {selectedMeeting.sdr?.nome && (
                    <div className="bg-blue-50 px-3 py-2 rounded-lg">
                      <span className="text-blue-600">SDR: {selectedMeeting.sdr.nome}</span>
                    </div>
                  )}
                  {selectedMeeting.closer?.nome && (
                    <div className="bg-green-50 px-3 py-2 rounded-lg">
                      <span className="text-green-600">Closer: {selectedMeeting.closer.nome}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {selectedMeeting.observacoes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Observações</p>
                  <p className="text-gray-600">{selectedMeeting.observacoes}</p>
                </div>
              )}

              {/* Ações de Status */}
              {selectedMeeting.status === 'agendada' && (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Atualizar Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateMeetingStatus(selectedMeeting.id, 'realizada')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                    >
                      <Check size={18} />
                      Realizada
                    </button>
                    <button
                      onClick={() => updateMeetingStatus(selectedMeeting.id, 'nao_compareceu')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
                    >
                      <AlertCircle size={18} />
                      No-show
                    </button>
                    <button
                      onClick={() => updateMeetingStatus(selectedMeeting.id, 'cancelada')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium col-span-2"
                    >
                      <XCircle size={18} />
                      Cancelar Reunião
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => deleteMeeting(selectedMeeting.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={18} />
                Excluir
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
