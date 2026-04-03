import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ativo: 'bg-green-500/20 text-green-400 border-green-500/30',
    inativo: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
    preparando: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pronto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    entregue: 'bg-green-500/20 text-green-400 border-green-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function getPlanoColor(plano: string): string {
  const colors: Record<string, string> = {
    basico: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    profissional: 'bg-baron-gold/20 text-baron-gold border-baron-gold/30',
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return colors[plano] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateRandomData(count: number, min: number, max: number): number[] {
  return Array.from({ length: count }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}
