export interface Withdrawal {
  id: string
  establishment_id: string
  establishment_name: string
  requested_amount: number
  pix_key: string
  requested_at: string
  paid_at?: string
  status: 'pending' | 'paid' | 'rejected'
  proof_url?: string
  notes?: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  withdrawal_id?: string
  establishment_id?: string
  created_at: string
  details?: Record<string, any>
}

export interface FinancialSummary {
  totalRevenue: number
  retentionBalance: number
  pendingWithdrawals: number
  baronCommission: number
}
