# FitHub - Setup Guide

## Stack Tecnológica
- **Frontend**: Next.js 16 + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes (Node.js)
- **Banco de dados**: PostgreSQL via Supabase
- **Autenticação**: Supabase Auth
- **IA Generativa**: OpenAI GPT-4o-mini
- **Hospedagem sugerida**: Vercel (frontend) + Supabase (banco)

---

## 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No painel do projeto, vá em **SQL Editor**
3. Execute o conteúdo de `supabase/migrations/001_initial.sql`
4. Vá em **Settings > API** e copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### Configurar autenticação no Supabase
- Vá em **Authentication > URL Configuration**
- Site URL: `http://localhost:3000` (dev) ou sua URL de produção
- Redirect URLs: adicione `http://localhost:3000/api/auth/callback`

---

## 2. Configurar OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma API Key em **API Keys**
3. Copie a chave → `OPENAI_API_KEY`

> O assistente usa o modelo `gpt-4o-mini` (rápido e econômico).

---

## 3. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## 5. Deploy na Vercel

1. Instale a CLI: `npm i -g vercel`
2. Execute `vercel` na raiz do projeto
3. Configure as variáveis de ambiente no painel da Vercel
4. Atualize as URLs do Supabase para apontar para o domínio de produção

---

## Estrutura do Projeto

```
fitness-hub/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login e Registro
│   │   ├── (dashboard)/     # Área autenticada
│   │   │   ├── dashboard/   # Dashboard principal
│   │   │   ├── treinos/     # Gestão de treinos
│   │   │   ├── alimentacao/ # Controle alimentar
│   │   │   ├── progresso/   # Acompanhamento corporal
│   │   │   ├── ia/          # Assistente IA (FitBot)
│   │   │   └── perfil/      # Perfil do usuário
│   │   └── api/
│   │       ├── ai/chat/     # API do FitBot (OpenAI)
│   │       └── auth/        # Callbacks de autenticação
│   ├── components/
│   │   ├── ui/              # Componentes base (Button, Card, etc.)
│   │   ├── layout/          # Sidebar, Navbar, ThemeToggle
│   │   └── dashboard/       # Componentes do dashboard
│   ├── lib/
│   │   ├── supabase/        # Cliente Supabase (client/server)
│   │   └── utils.ts         # Utilitários (BMI, calorias, datas)
│   ├── store/               # Zustand (estado global)
│   ├── types/               # TypeScript types
│   └── proxy.ts             # Auth middleware (Next.js 16)
└── supabase/
    └── migrations/
        └── 001_initial.sql  # Schema completo do banco
```

---

## Funcionalidades Implementadas

### Dashboard
- Resumo diário (calorias, água, treinos, peso)
- Macros do dia (proteína, carbs, gordura) com gráficos circulares
- Treinos recentes
- Tracker de água interativo
- Ações rápidas
- Metas do dia com progresso

### Gestão de Treinos
- Criação de treinos com exercícios detalhados
- Tipos: A/B/C/D/E, Full Body, HIIT, Cardio, Personalizado
- Registro de séries, reps, carga, descanso
- Histórico de treinos realizados
- Personal Records (PRs)

### Gestão Alimentar
- 6 tipos de refeição (café, almoço, jantar, lanche, pré/pós-treino)
- Registro de alimentos com macros
- Cálculo automático de totais
- Histórico por data
- Resumo de macros diários

### Acompanhamento Corporal
- Peso e % de gordura
- IMC automático com classificação
- 9 medidas corporais
- Gráfico de evolução do peso (Recharts)
- Histórico de medições

### Assistente IA (FitBot)
- Chat com GPT-4o-mini personalizado ao perfil
- Histórico de conversas salvo
- Prompts rápidos pré-configurados
- Contexto do usuário automático
- Sugestões de treinos, dietas, técnicas de exercício

### Perfil do Usuário
- Dados pessoais (nome, idade, sexo, altura, peso)
- Objetivo e nível de experiência
- Dias de treino disponíveis
- Restrições alimentares
- Metas nutricionais com cálculo automático (Harris-Benedict)
