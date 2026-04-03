// Dados mockados para demonstração
// Em produção, estes dados virão do Supabase

interface Estabelecimento {
  id: string
  nome: string
  email: string
  telefone: string
  documento: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  status: string
  latitude?: number
  longitude?: number
  logo_url?: string
  plano?: string
  data_cadastro?: string
  data_ultimo_acesso?: string
}

interface PedidoItem {
  produto_id: string
  nome: string
  quantidade: number
  preco_unitario: number
}

interface Pedido {
  id: string
  establishment_id: string
  cliente_nome: string
  cliente_telefone: string
  valor_total: number
  status: string
  data_pedido: string
  itens?: PedidoItem[]
  forma_pagamento?: string
}

interface Produto {
  id: string
  establishment_id: string
  nome: string
  preco: number
  categoria: string
  ativo?: boolean
  total_vendas?: number
}

export const mockEstabelecimentos: Estabelecimento[] = [
  {
    id: '1',
    nome: 'Pizzaria Bella Napoli',
    email: 'contato@bellanapoli.com',
    telefone: '11999998888',
    documento: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    latitude: -23.550520,
    longitude: -46.633308,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'profissional',
    status: 'ativo',
    data_cadastro: '2024-01-15T10:00:00Z',
    data_ultimo_acesso: '2024-12-20T14:30:00Z'
  },
  {
    id: '2',
    nome: 'Hamburgueria The Burger',
    email: 'contato@theburger.com',
    telefone: '11988887777',
    documento: '98.765.432/0001-10',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    latitude: -23.561684,
    longitude: -46.655981,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'enterprise',
    status: 'ativo',
    data_cadastro: '2024-02-20T14:00:00Z',
    data_ultimo_acesso: '2024-12-20T16:45:00Z'
  },
  {
    id: '3',
    nome: 'Sushi Nakamura',
    email: 'contato@sushinakamura.com',
    telefone: '11977776666',
    documento: '11.222.333/0001-44',
    endereco: 'Rua Liberdade, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01503-000',
    latitude: -23.558345,
    longitude: -46.632410,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'basico',
    status: 'ativo',
    data_cadastro: '2024-03-10T09:00:00Z',
    data_ultimo_acesso: '2024-12-19T20:15:00Z'
  },
  {
    id: '4',
    nome: 'Cantina Italiana Mamma Mia',
    email: 'contato@mammamia.com',
    telefone: '21966665555',
    documento: '55.666.777/0001-88',
    endereco: 'Rua Copacabana, 200',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '22020-001',
    latitude: -22.971177,
    longitude: -43.182543,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'profissional',
    status: 'ativo',
    data_cadastro: '2024-04-05T11:00:00Z',
    data_ultimo_acesso: '2024-12-20T12:00:00Z'
  },
  {
    id: '5',
    nome: 'Açaí Point',
    email: 'contato@acaipoint.com',
    telefone: '31955554444',
    documento: '22.333.444/0001-55',
    endereco: 'Av. Amazonas, 1500',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30180-001',
    latitude: -19.919052,
    longitude: -43.938573,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'basico',
    status: 'pendente',
    data_cadastro: '2024-12-15T08:00:00Z',
  },
  {
    id: '6',
    nome: 'Churrascaria Fogo de Chão',
    email: 'contato@fogodechao.com',
    telefone: '51944443333',
    documento: '33.444.555/0001-66',
    endereco: 'Av. Borges de Medeiros, 800',
    cidade: 'Porto Alegre',
    estado: 'RS',
    cep: '90020-025',
    latitude: -30.027704,
    longitude: -51.228735,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'enterprise',
    status: 'ativo',
    data_cadastro: '2024-05-20T10:00:00Z',
    data_ultimo_acesso: '2024-12-20T18:30:00Z'
  },
  {
    id: '7',
    nome: 'Padaria Pão Quente',
    email: 'contato@paoquente.com',
    telefone: '41933332222',
    documento: '44.555.666/0001-77',
    endereco: 'Rua XV de Novembro, 300',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80020-310',
    latitude: -25.428954,
    longitude: -49.271232,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'profissional',
    status: 'inativo',
    data_cadastro: '2024-06-10T07:00:00Z',
    data_ultimo_acesso: '2024-11-15T09:00:00Z'
  },
  {
    id: '8',
    nome: 'Tapiocaria Nordeste',
    email: 'contato@tapiocarianordeste.com',
    telefone: '81922221111',
    documento: '66.777.888/0001-99',
    endereco: 'Av. Boa Viagem, 1000',
    cidade: 'Recife',
    estado: 'PE',
    cep: '51011-000',
    latitude: -8.119390,
    longitude: -34.898262,
    logo_url: 'https://via.placeholder.com/100',
    plano: 'basico',
    status: 'ativo',
    data_cadastro: '2024-07-25T13:00:00Z',
    data_ultimo_acesso: '2024-12-20T10:45:00Z'
  }
]

export const mockPedidos: Pedido[] = [
  {
    id: 'PED001',
    establishment_id: '1',
    cliente_nome: 'João Silva',
    cliente_telefone: '11999990001',
    itens: [
      { produto_id: 'p1', nome: 'Pizza Margherita', quantidade: 1, preco_unitario: 45.90 },
      { produto_id: 'p2', nome: 'Refrigerante 2L', quantidade: 1, preco_unitario: 12.00 }
    ],
    valor_total: 57.90,
    status: 'entregue',
    forma_pagamento: 'Cartão de Crédito',
    data_pedido: '2024-12-20T19:30:00Z'
  },
  {
    id: 'PED002',
    establishment_id: '2',
    cliente_nome: 'Maria Santos',
    cliente_telefone: '11999990002',
    itens: [
      { produto_id: 'p3', nome: 'X-Bacon', quantidade: 2, preco_unitario: 32.00 },
      { produto_id: 'p4', nome: 'Batata Frita Grande', quantidade: 1, preco_unitario: 18.00 }
    ],
    valor_total: 82.00,
    status: 'preparando',
    forma_pagamento: 'PIX',
    data_pedido: '2024-12-20T20:15:00Z'
  },
  {
    id: 'PED003',
    establishment_id: '3',
    cliente_nome: 'Pedro Oliveira',
    cliente_telefone: '11999990003',
    itens: [
      { produto_id: 'p5', nome: 'Combo Sushi 30 peças', quantidade: 1, preco_unitario: 89.90 }
    ],
    valor_total: 89.90,
    status: 'pronto',
    forma_pagamento: 'Cartão de Débito',
    data_pedido: '2024-12-20T20:00:00Z'
  },
  {
    id: 'PED004',
    establishment_id: '1',
    cliente_nome: 'Ana Costa',
    cliente_telefone: '11999990004',
    itens: [
      { produto_id: 'p1', nome: 'Pizza Calabresa', quantidade: 1, preco_unitario: 48.90 },
      { produto_id: 'p6', nome: 'Pizza Portuguesa', quantidade: 1, preco_unitario: 52.90 }
    ],
    valor_total: 101.80,
    status: 'pendente',
    forma_pagamento: 'Dinheiro',
    data_pedido: '2024-12-20T20:30:00Z'
  },
  {
    id: 'PED005',
    establishment_id: '4',
    cliente_nome: 'Carlos Ferreira',
    cliente_telefone: '21999990005',
    itens: [
      { produto_id: 'p7', nome: 'Lasanha Bolonhesa', quantidade: 2, preco_unitario: 42.00 },
      { produto_id: 'p8', nome: 'Tiramisu', quantidade: 2, preco_unitario: 18.00 }
    ],
    valor_total: 120.00,
    status: 'entregue',
    forma_pagamento: 'Cartão de Crédito',
    data_pedido: '2024-12-20T18:45:00Z'
  }
]

export const mockProdutos: Produto[] = [
  { id: 'p1', establishment_id: '1', nome: 'Pizza Margherita', preco: 45.90, categoria: 'Pizzas', ativo: true, total_vendas: 1250 },
  { id: 'p2', establishment_id: '1', nome: 'Pizza Calabresa', preco: 48.90, categoria: 'Pizzas', ativo: true, total_vendas: 980 },
  { id: 'p3', establishment_id: '2', nome: 'X-Bacon', preco: 32.00, categoria: 'Hambúrgueres', ativo: true, total_vendas: 2100 },
  { id: 'p4', establishment_id: '2', nome: 'X-Tudo', preco: 38.00, categoria: 'Hambúrgueres', ativo: true, total_vendas: 1850 },
  { id: 'p5', establishment_id: '3', nome: 'Combo Sushi 30 peças', preco: 89.90, categoria: 'Combos', ativo: true, total_vendas: 650 },
  { id: 'p6', establishment_id: '3', nome: 'Temaki Salmão', preco: 28.00, categoria: 'Temakis', ativo: true, total_vendas: 890 },
  { id: 'p7', establishment_id: '4', nome: 'Lasanha Bolonhesa', preco: 42.00, categoria: 'Massas', ativo: true, total_vendas: 720 },
  { id: 'p8', establishment_id: '4', nome: 'Espaguete Carbonara', preco: 38.00, categoria: 'Massas', ativo: true, total_vendas: 580 },
  { id: 'p9', establishment_id: '5', nome: 'Açaí 500ml', preco: 22.00, categoria: 'Açaí', ativo: true, total_vendas: 3200 },
  { id: 'p10', establishment_id: '6', nome: 'Picanha Premium', preco: 89.00, categoria: 'Carnes', ativo: true, total_vendas: 450 }
]

// Dados para gráficos
export const mockFaturamentoMensal = [
  { mes: 'Jan', valor: 125000 },
  { mes: 'Fev', valor: 132000 },
  { mes: 'Mar', valor: 145000 },
  { mes: 'Abr', valor: 138000 },
  { mes: 'Mai', valor: 152000 },
  { mes: 'Jun', valor: 168000 },
  { mes: 'Jul', valor: 175000 },
  { mes: 'Ago', valor: 182000 },
  { mes: 'Set', valor: 178000 },
  { mes: 'Out', valor: 195000 },
  { mes: 'Nov', valor: 210000 },
  { mes: 'Dez', valor: 235000 }
]

export const mockPedidosPorDia = [
  { dia: 'Seg', pedidos: 145 },
  { dia: 'Ter', pedidos: 132 },
  { dia: 'Qua', pedidos: 128 },
  { dia: 'Qui', pedidos: 156 },
  { dia: 'Sex', pedidos: 198 },
  { dia: 'Sáb', pedidos: 245 },
  { dia: 'Dom', pedidos: 210 }
]

export const mockDistribuicaoPlanos = [
  { plano: 'Básico', quantidade: 45, cor: '#64748b' },
  { plano: 'Profissional', quantidade: 32, cor: '#D4AF37' },
  { plano: 'Enterprise', quantidade: 15, cor: '#8b5cf6' }
]

export const mockFaturamentoPorEstado = [
  { estado: 'SP', valor: 450000 },
  { estado: 'RJ', valor: 280000 },
  { estado: 'MG', valor: 185000 },
  { estado: 'RS', valor: 165000 },
  { estado: 'PR', valor: 142000 },
  { estado: 'PE', valor: 98000 },
  { estado: 'BA', valor: 87000 },
  { estado: 'SC', valor: 76000 }
]

export const mockDashboardStats = {
  totalEstabelecimentos: 92,
  estabelecimentosAtivos: 78,
  estabelecimentosNovos: 12,
  totalPedidos: 15420,
  pedidosHoje: 342,
  faturamentoTotal: 1835000,
  faturamentoMes: 235000,
  ticketMedio: 58.50,
  taxaCrescimento: 12.5
}
