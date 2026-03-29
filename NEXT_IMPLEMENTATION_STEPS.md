# 🎬 Próximas Implementações - Módulo Comercial

**Documento de Referência para Desenvolvimento Futuro**  
**Status**: Pronto para ação  
**Data**: Fevereiro 2026

---

## 🎯 Ordem de Implementação (Recomendada)

### Fase 1: Componentes de Forms (2-3 horas)

#### 1.1 LeadForm.tsx
**Localização**: `src/components/comercial/LeadForm.tsx`

```typescript
interface LeadFormProps {
  initialData?: Lead;
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  loading?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ initialData, onSubmit, loading }) => {
  // Campos:
  // - nome_estabelecimento (text)
  // - tipo (select: bar, balada, restaurante, etc)
  // - responsavel_nome (text)
  // - responsavel_telefone (tel)
  // - responsavel_whatsapp (tel, optional)
  // - responsavel_email (email)
  // - instagram (text, optional)
  // - cidade (text)
  // - estado (select)
  // - faturamento_estimado (number)
  // - origem_lead (select)
  
  // Validações:
  // - Campos obrigatórios
  // - Formato de telefone
  // - Email válido
};
```

**Componentes Reutilizados**:
- Input (do ui/)
- Button
- Card
- Badge

#### 1.2 MeetingForm.tsx
**Localização**: `src/components/comercial/MeetingForm.tsx`

```typescript
interface MeetingFormProps {
  leadId: string;
  onSubmit: (data: CreateMeetingInput) => Promise<void>;
  closers?: AdminUser[];
}

// Campos:
// - closer_id (select - listar closers)
// - data_reuniao (datetime)
// - local (text)
// - observacoes (textarea, optional)

// Para update (resultado):
// - status (select: realizada, cancelada, nao_compareceu)
// - resultado (text)
// - observacoes (textarea)
```

#### 1.3 ObjectionForm.tsx
**Localização**: `src/components/comercial/ObjectionForm.tsx`

```typescript
interface ObjectionFormProps {
  leadId: string;
  phase: ObjectionPhase; // 'sdr' or 'closer'
  onSubmit: (data: CreateLeadObjectionInput) => Promise<void>;
}

// Campos:
// - tipo_objecao (select)
// - descricao (textarea)
// - fase_objecao (hidden - já sabe SDR ou Closer)
```

---

### Fase 2: Páginas Principais (4-5 horas)

#### 2.1 Leads.tsx
**Localização**: `src/pages/Comercial/Leads.tsx`

```typescript
export default function Leads() {
  // Features:
  // 1. Lista de leads com tabela
  // 2. Filtros: status, origem, cidade, sdr
  // 3. Busca por texto (nome, responsável)
  // 4. Paginação
  // 5. Ações: editar, converter, ver detalhes
  // 6. Criar novo lead (modal/sidebar)
  // 7. Bulk actions (mudar status)

  // Layout:
  // - Header com título e botão "Novo Lead"
  // - Filtros (sidebar ou collapse)
  // - Tabela com leads
  // - Pagination
}
```

**Colunas da Tabela**:
```
| Nome | Tipo | Responsável | Cidade | Status | Origem | Ações |
```

#### 2.2 LeadDetalhes.tsx
**Localização**: `src/pages/Comercial/LeadDetalhes.tsx`

```typescript
export default function LeadDetalhes({ leadId }: { leadId: string }) {
  // Layout em abas:
  
  // Tab 1: Informações
  // - Dados do lead
  // - SDR responsável
  // - Status e timeline
  
  // Tab 2: Contatos
  // - Histórico de contatos
  // - Botão "Novo contato"
  // - Listar: data, tipo, resultado, observações
  
  // Tab 3: Reuniões
  // - Reuniões agendadas/realizadas
  // - Botão "Agendar reunião"
  // - Cards ou tabela
  
  // Tab 4: Objeções
  // - Objeções registradas
  // - Status (resolvida/não resolvida)
  // - Botão "Registrar objeção"
  
  // Tab 5: Ações
  // - Atualizar status
  // - Converter para cliente
  // - Adicionar observação
  // - Arquivar/deletar
}
```

#### 2.3 Reunioes.tsx
**Localização**: `src/pages/Comercial/Reunioes.tsx`

```typescript
export default function Reunioes() {
  // Tipo: Timeline/Calendar view
  
  // Features:
  // 1. Visualizar reuniões em calendário (opcional)
  // 2. Lista filtrada por período
  // 3. Filtros: status, sdr, closer, período
  // 4. Próximas reuniões (em destaque)
  // 5. Ações: editar, registrar resultado, cancelar
  
  // Para Closer:
  // - Apenas suas reuniões
  // - Botão "Registrar Resultado" em destaque

  // Para Admin:
  // - Todas as reuniões
  // - Filtros completos
}
```

#### 2.4 Comissoes.tsx
**Localização**: `src/pages/Comercial/Comissoes.tsx`

```typescript
export default function Comissoes() {
  // Features:
  // 1. Tabela de comissões
  // 2. Filtros: status, período, sdr/closer
  // 3. Resumo (total, paga, pendente)
  // 4. Ações: marcar como paga, visualizar detalhes
  
  // Campos da Tabela:
  // | Estabelecimento | SDR | Closer | Plano | Valor | Status | Data |
  
  // Para Closer:
  // - Apenas suas comissões
  // - Não pode mudar status
  
  // Para Admin:
  // - Todas as comissões
  // - Ação: marcar como paga
}
```

---

### Fase 3: Integração no Menu (1 hora)

#### 3.1 Atualizar Sidebar
**Arquivo**: `src/components/layout/AppSidebar.tsx`

```typescript
// Adicionar seção "COMERCIAL" com subitens:
{
  icon: '🎯',
  label: 'Comercial',
  submenu: [
    { label: 'Dashboard', path: '/comercial' },
    { label: 'Leads', path: '/comercial/leads' },
    { label: 'Reuniões', path: '/comercial/reunioes' },
    { label: 'Comissões', path: '/comercial/comissoes' },
  ]
}

// Mostrar/ocultar com base no role:
if (userRole === 'admin' || userRole === 'sdr' || userRole === 'closer') {
  // Mostrar seção Comercial
}
```

#### 3.2 Atualizar Rotas
**Arquivo**: `src/App.tsx`

```typescript
import { Routes, Route } from 'react-router-dom';
import DashboardComercial from './pages/Comercial/DashboardComercial';
import Leads from './pages/Comercial/Leads';
import LeadDetalhes from './pages/Comercial/LeadDetalhes';
import Reunioes from './pages/Comercial/Reunioes';
import Comissoes from './pages/Comercial/Comissoes';

// Adicionar rotas:
<Route path="/comercial" element={<DashboardComercial />} />
<Route path="/comercial/leads" element={<Leads />} />
<Route path="/comercial/leads/:id" element={<LeadDetalhes />} />
<Route path="/comercial/reunioes" element={<Reunioes />} />
<Route path="/comercial/comissoes" element={<Comissoes />} />
```

---

### Fase 4: Gráficos e Dashboards (4-6 horas)

#### 4.1 PipelineChart.tsx
**Localização**: `src/components/comercial/PipelineChart.tsx`

```typescript
// Usar Recharts para visualizar:
// - Leads por status (BarChart ou PieChart)
// - Tendência de conversão (LineChart)
// - Pipeline funnel (Sankey ou custom)

interface PipelineChartProps {
  data: Lead[];
  period?: 'week' | 'month' | 'year';
}
```

#### 4.2 PerformanceTable.tsx
**Localização**: `src/components/comercial/PerformanceTable.tsx`

```typescript
// Tabela de performance para SDRs e Closers
interface PerformanceTableProps {
  type: 'sdr' | 'closer';
  data: SDRPerformance[] | CloserPerformance[];
}

// Colunas:
// SDR: Nome | Leads | Convertidos | Taxa % | Comissão | Reuniões
// Closer: Nome | Reuniões | Realizadas | Vendas | Comissão | Status
```

#### 4.3 LeadTimeline.tsx
**Localização**: `src/components/comercial/LeadTimeline.tsx`

```typescript
// Timeline visual de progresso do lead
interface LeadTimelineProps {
  lead: Lead;
  contacts: LeadContact[];
  meetings: Meeting[];
  objections: LeadObjection[];
}

// Mostrar ordem cronológica de eventos
```

---

### Fase 5: Testes e Validações (3-4 horas)

#### 5.1 Testes Funcionais
```bash
Test Cases:

1. Criar Lead
   - [x] Lead criado com status "novo"
   - [x] Preenchido com sdr_responsavel_id
   - [x] Validações funcionam

2. Filtrar Leads
   - [x] Por status
   - [x] Por SDR
   - [x] Por cidade
   - [x] Busca de texto

3. Registrar Contato
   - [x] Contato adicionado ao lead
   - [x] Timestamp correto
   - [x] Usuário correto

4. Agendar Reunião
   - [x] Reunião criada
   - [x] Closer atribuído
   - [x] Data e local salvos

5. Registrar Resultado
   - [x] Status muda para "realizada"
   - [x] Resultado salvo
   - [x] Observações salvas

6. Converter Lead
   - [x] Establishment criado
   - [x] Lead vinculado
   - [x] Comissão criada
   - [x] Status = "convertido"

7. RLS Permissions
   - [x] SDR só vê seus leads
   - [x] Closer só vê suas reuniões
   - [x] Admin acesso total
```

#### 5.2 Validações de Input
```typescript
// Implementar em cada form:

const validateLead = (data: CreateLeadInput) => {
  const errors: Record<string, string> = {};
  
  if (!data.nome_estabelecimento) errors.nome = 'Required';
  if (!data.responsavel_nome) errors.responsavel = 'Required';
  if (!isValidPhone(data.responsavel_telefone)) errors.telefone = 'Invalid';
  if (data.responsavel_email && !isValidEmail(data.responsavel_email)) 
    errors.email = 'Invalid';
  
  return Object.keys(errors).length === 0 ? null : errors;
};
```

---

## 📋 Checklist de Implementação

```
FASE 1: FORMS (2-3h)
- [ ] LeadForm.tsx
- [ ] MeetingForm.tsx
- [ ] ObjectionForm.tsx

FASE 2: PÁGINAS (4-5h)
- [ ] Leads.tsx com lista e filtros
- [ ] LeadDetalhes.tsx com abas
- [ ] Reunioes.tsx com timeline
- [ ] Comissoes.tsx com tabela

FASE 3: INTEGRAÇÃO (1h)
- [ ] Atualizar Sidebar.tsx
- [ ] Adicionar rotas em App.tsx
- [ ] Testar navegação

FASE 4: GRÁFICOS (4-6h)
- [ ] PipelineChart.tsx
- [ ] PerformanceTable.tsx
- [ ] LeadTimeline.tsx
- [ ] DashboardComercial melhorado

FASE 5: TESTES (3-4h)
- [ ] Testes funcionais
- [ ] Validação de inputs
- [ ] Testes de RLS
- [ ] Verificação de erros

TOTAL: 14-19 horas de desenvolvimento
```

---

## 🔗 Referências e Padrões

### Padrão de Componente
```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as commercialService from '@/lib/commercialServices';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ComponentProps {
  // Props aqui
}

export default function Component({ }: ComponentProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Chamada para service
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* JSX aqui */}
    </div>
  );
}
```

### Padrão de Tratamento de Erro
```typescript
const handleSubmit = async (formData: any) => {
  try {
    setLoading(true);
    const { data, error } = await commercialService.createLead(formData, userId);
    
    if (error) {
      toast.error(`Erro: ${error.message}`);
      return;
    }
    
    toast.success('Lead criado com sucesso!');
    // Atualizar UI
  } catch (err) {
    toast.error('Erro inesperado');
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

---

## 🚀 Deployment Checklist

### Antes de Deploy
- [ ] Build sem erros: `npm run build`
- [ ] Lint passando: `npm run lint`
- [ ] Todas as rotas funcionando
- [ ] RLS testada com diferentes usuários
- [ ] Variáveis de ambiente configuradas
- [ ] Documentação atualizada

### Procedimento
1. Commit e push das mudanças
2. Pull request review
3. Merge para main
4. Deploy automático (CI/CD)
5. Testes em staging
6. Deploy em produção

---

## 📚 Recursos Úteis

### Documentação
- [React Hooks](https://react.dev/reference/react)
- [TypeScript React](https://www.typescriptlang.org/docs/handbook/react.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Recharts](https://recharts.org/en-US/)

### Padrões
- [React Best Practices](https://react.dev/learn/keeping-components-pure)
- [TypeScript Patterns](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💡 Dicas de Desenvolvimento

1. **Use o tipo `Lead` sempre que possível**
   - Importar de `src/types/commercial.ts`
   - Evita erros em runtime

2. **Reutilize componentes UI**
   - Button, Card, Input, Badge já existem
   - Manter consistência visual

3. **Teste RLS localmente**
   - Criar usuários diferentes
   - Verificar permissões com cada role

4. **Documente componentes complexos**
   - Adicionar comentários
   - Listar props e comportamentos

5. **Use o Supabase Dashboard**
   - Testar queries diretamente
   - Debugar RLS policies
   - Ver logs de erro

---

## 🎓 Conclusão

O backend está **100% pronto**. Agora falta implementar a camada de apresentação (UI/UX).

**Estimativa Total**: 15-20 horas de desenvolvimento  
**Recomendação**: Implementar por fase  
**Próximo Check-in**: Após Fase 2 (páginas principais)

---

**Document Version**: 1.0  
**Last Updated**: Fevereiro 9, 2026  
**Ready for Development**: ✅ YES
