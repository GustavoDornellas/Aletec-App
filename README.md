# Controle de Inventário Aletec

## Sobre o projeto

Este projeto surgiu a partir de uma necessidade real.

No dia a dia, o controle de produtos era feito manualmente em caderno, o que tornava o processo mais lento, mais sujeito a erro e difícil de manter atualizado. A proposta desta aplicação é substituir esse fluxo manual por uma ferramenta digital simples, direta e confiável.

O objetivo não é criar um ERP ou um sistema empresarial complexo. A ideia é entregar uma solução prática para controle de estoque de placas e unidades, com boa usabilidade, clareza e manutenção fácil.

## Problema que o sistema resolve

O sistema foi pensado para ajudar no controle de:

- modelos de produto
- unidades individuais
- estoque disponível para venda
- itens vendidos ou utilizados
- importação e exportação por CSV

## Solução adotada

A aplicação foi construída com Next.js no frontend e Supabase para autenticação e persistência. O código foi organizado para manter a simplicidade do projeto, mas com padrão profissional:

- interface separada da lógica de dados
- acesso ao banco centralizado em services
- validação antes de gravar dados
- feedback claro para sucesso, erro e carregamento

## Stack

- Next.js 15
- React 19
- JavaScript
- Tailwind CSS 4
- Supabase
- Lucide React
- Motion

## Arquitetura

```text
app/
  layout.jsx
  page.jsx

src/
  components/
  hooks/
  services/
  utils/
  views/

supabase/
  migrations/
```

### Responsabilidade de cada pasta

- `app/`: entrada de rotas e layout global
- `src/views/`: composição das telas principais
- `src/components/`: componentes reutilizáveis de interface
- `src/hooks/`: lógica de estado e orquestração do inventário
- `src/services/`: autenticação e acesso ao Supabase
- `src/utils/`: validações, constantes, CSV e helpers
- `supabase/migrations/`: histórico de evolução do banco

## Funcionalidades

- autenticação com Supabase
- cadastro, edição e remoção de produtos
- cadastro e remoção de unidades
- atualização de status das unidades
- dashboard com visão geral do estoque
- importação e exportação CSV
- validação antes de persistir dados
- feedback visual de carregamento, sucesso, erro e vazio

## Qualidade de código aplicada

- service layer centralizada
- respostas padronizadas de sucesso e erro
- separação clara entre UI, estado e persistência
- validações explícitas para produto e unidade
- limpeza de código legado e arquivos obsoletos
- configuração segura de ambiente
- estrutura preparada para crescer sem ficar complexa

## Variáveis de ambiente

Use o arquivo `.env.example` como referência:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Crie um `.env.local` apenas no ambiente local e não o envie para o repositório.

## Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie o arquivo `.env.local` com as credenciais do seu projeto Supabase.

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

### 4. Rodar lint

```bash
npm run lint
```

### 5. Gerar build de produção

```bash
npm run build
npm run start
```

## Banco de dados

As migrações SQL ficam em:

```text
supabase/migrations
```

Elas devem ser aplicadas no projeto Supabase antes de usar a aplicação em um ambiente novo.

## Segurança dentro do escopo do projeto

Foram aplicadas melhorias leves, mas reais, para o escopo da aplicação:

- validação de payload antes de gravar no banco
- acesso ao banco centralizado
- ausência de segredos versionados
- mensagens de erro amigáveis na interface
- estrutura preparada para funcionar bem com políticas RLS do Supabase

## Autor

Gustavo Dornellas

## Licença

Projeto privado. Todos os direitos reservados.
