# Baron Control - Painel Administrativo Master

![Baron Control](https://via.placeholder.com/800x400/1a1a2e/D4AF37?text=Baron+Control+Admin+Panel)

## 🎯 Sobre

Painel administrativo master para monitoramento completo de todos os estabelecimentos cadastrados no sistema Baron Control. Desenvolvido para os proprietários do sistema terem visão completa de:

- 📊 **Dashboard** - Visão geral com métricas e gráficos
- 🏪 **Clientes** - Todos os estabelecimentos cadastrados
- 🛒 **Pedidos** - Todos os pedidos de todos os estabelecimentos
- 💰 **Faturamento** - Análise financeira detalhada
- 📦 **Produtos** - Produtos mais vendidos
- 🗺️ **Mapa** - Distribuição geográfica dos clientes

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **React Router** - Navegação
- **Supabase** - Backend (banco de dados PostgreSQL)
- **Lucide React** - Ícones
- **Radix UI** - Componentes acessíveis

## 📦 Instalação

### 1. Clone o repositório
```bash
cd baron-admin-panel
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

Crie um projeto no [Supabase](https://supabase.com) e execute o script SQL:
```bash
# O arquivo está em database/schema.sql
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 5. Execute o projeto
```bash
npm run dev
```

O painel estará disponível em `http://localhost:3001`

## 🔐 Credenciais de Acesso (Demo)

- **Email:** admin@baroncontrol.com
- **Senha:** baron2024master

> ⚠️ Em produção, implemente autenticação segura via Supabase Auth.

## 📁 Estrutura do Projeto

```
baron-admin-panel/
├── database/
│   └── schema.sql          # Script SQL para Supabase
├── public/
├── src/
│   ├── components/
│   │   ├── ui/             # Componentes reutilizáveis
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── mockData.ts     # Dados de demonstração
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── utils.ts        # Funções utilitárias
│   ├── pages/
│   │   ├── Clientes.tsx
│   │   ├── ClienteDetalhes.tsx
│   │   ├── Configuracoes.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Faturamento.tsx
│   │   ├── Login.tsx
│   │   ├── Mapa.tsx
│   │   ├── Pedidos.tsx
│   │   └── Produtos.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env                    # Variáveis de ambiente
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Features

### Dashboard
- Cards com métricas principais
- Gráfico de faturamento mensal
- Distribuição de planos (pizza)
- Pedidos por dia da semana
- Últimos clientes cadastrados
- Últimos pedidos

### Clientes
- Lista completa de estabelecimentos
- Filtros por status e plano
- Busca por nome, email ou cidade
- Visualização detalhada de cada cliente
- Estatísticas individuais

### Pedidos
- Todos os pedidos do sistema
- Filtros por status e estabelecimento
- Detalhes dos itens de cada pedido
- Status em tempo real

### Faturamento
- Gráfico de evolução mensal
- Faturamento por estado
- Top 10 estabelecimentos
- Exportação de relatórios

### Produtos
- Produtos mais vendidos
- Análise por categoria
- Estatísticas de vendas

### Mapa
- Distribuição geográfica
- Agrupamento por estado
- Marcadores interativos

## 🔧 Personalização

### Cores do Tema

Edite o arquivo `tailwind.config.js` para personalizar as cores:

```javascript
baron: {
  gold: "#D4AF37",    // Cor principal
  dark: "#1a1a2e",    // Fundo escuro
  darker: "#0f0f1a",  // Fundo mais escuro
  purple: "#4a1d96",  // Acentos
  blue: "#1e40af",    // Acentos
}
```

### Integração com Supabase Real

1. Configure suas credenciais no `.env`
2. Execute o script `database/schema.sql` no Supabase
3. Remova os dados mock e use as funções do `src/lib/supabase.ts`

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção
- `npm run lint` - Executa linter

## 🤝 Contribuição

Este é um projeto interno do Baron Control. Para sugestões ou melhorias, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Propriedade exclusiva do Baron Control. Todos os direitos reservados.

---

Desenvolvido com ❤️ para **Baron Control**
