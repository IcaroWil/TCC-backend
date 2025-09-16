# Timelyfy Backend API

Backend completo para sistema de agendamentos online desenvolvido para complementar o frontend descrito no TCC.

## 🚀 Características

- **Autenticação JWT** - Sistema completo de login, registro e gerenciamento de usuários
- **Gestão de Serviços** - CRUD completo para serviços oferecidos
- **Sistema de Agendamentos** - Criação, consulta, atualização e cancelamento de agendamentos
- **Calendário Inteligente** - Sistema de disponibilidade com horários de funcionamento e feriados
- **Notificações por Email** - Confirmações, lembretes e notificações automáticas
- **Painel Administrativo** - Dashboard com estatísticas e gestão completa
- **API RESTful** - Endpoints bem estruturados seguindo padrões REST
- **Documentação Swagger** - Documentação interativa da API
- **Validação de Dados** - Validação robusta com Zod
- **TypeScript** - Tipagem forte para maior segurança
- **Prisma ORM** - Gerenciamento de banco de dados moderno

## 🛠 Tecnologias Utilizadas

### Core
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Linguagem com tipagem estática
- **Prisma** - ORM moderno para PostgreSQL

### Autenticação & Segurança
- **JWT** - JSON Web Tokens para autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Cabeçalhos de segurança
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Proteção contra spam

### Validação & Documentação
- **Zod** - Validação de esquemas
- **Swagger** - Documentação da API
- **Morgan** - Logging de requisições

### Utilitários
- **Nodemailer** - Envio de emails
- **date-fns** - Manipulação de datas
- **compression** - Compressão de respostas

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou pnpm

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd timelyfy-backend
```

2. **Instale as dependências**
```bash
npm install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/timelyfy?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@timelyfy.com"
FROM_NAME="Timelyfy"

# Admin
ADMIN_EMAIL="admin@timelyfy.com"
ADMIN_PASSWORD="admin123"
```

4. **Configure o banco de dados**
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrations
npx prisma db push

# Popular banco com dados iniciais
npm run db:seed
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:
- **Documentação Swagger**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 🔗 Principais Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil

### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço (admin)
- `PUT /api/services/:id` - Atualizar serviço (admin)
- `DELETE /api/services/:id` - Excluir serviço (admin)

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `PATCH /api/appointments/:id/cancel` - Cancelar agendamento

### Disponibilidade
- `GET /api/availability/slots` - Horários disponíveis
- `GET /api/availability/range` - Disponibilidade por período
- `GET /api/availability/check` - Verificar horário específico

### Administração
- `GET /api/admin/dashboard` - Estatísticas do dashboard
- `GET /api/admin/users` - Gerenciar usuários
- `GET /api/admin/business-hours` - Horários de funcionamento
- `GET /api/admin/settings` - Configurações do sistema

## 🗃 Estrutura do Banco de Dados

### Principais Tabelas

- **users** - Usuários do sistema (clientes e admins)
- **services** - Serviços oferecidos
- **appointments** - Agendamentos
- **business_hours** - Horários de funcionamento
- **holidays** - Feriados e dias não úteis
- **time_slots** - Slots de tempo bloqueados
- **settings** - Configurações do sistema

## 🎯 Funcionalidades Implementadas

### Sistema de Agendamentos
- ✅ Criação de agendamentos para usuários autenticados e não autenticados
- ✅ Verificação automática de disponibilidade
- ✅ Prevenção de conflitos de horários
- ✅ Diferentes status de agendamento (agendado, confirmado, concluído, cancelado)
- ✅ Reagendamento com notificação

### Gestão de Disponibilidade
- ✅ Horários de funcionamento configuráveis por dia da semana
- ✅ Feriados e dias especiais
- ✅ Bloqueio manual de horários
- ✅ Cálculo automático de slots disponíveis
- ✅ Buffer entre agendamentos

### Sistema de Notificações
- ✅ Email de confirmação de agendamento
- ✅ Lembretes automáticos
- ✅ Notificações de cancelamento e reagendamento
- ✅ Templates HTML responsivos

### Painel Administrativo
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gestão completa de usuários e permissões
- ✅ Relatórios de receita e popularidade de serviços
- ✅ Configurações do sistema
- ✅ Gestão de horários e feriados

### Segurança e Performance
- ✅ Autenticação JWT com refresh automático
- ✅ Rate limiting para prevenção de spam
- ✅ Validação robusta de dados
- ✅ Sanitização de entradas
- ✅ Compressão de respostas
- ✅ CORS configurado

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Build para produção
npm start            # Inicia servidor de produção

# Banco de dados
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Aplica schema ao banco
npm run db:migrate   # Executa migrations
npm run db:seed      # Popula banco com dados iniciais
npm run db:studio    # Interface visual do banco

# Testes
npm test             # Executa testes (quando implementados)
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-jwt-token>
```

### Níveis de Acesso
- **CLIENT** - Usuário comum (pode gerenciar próprios agendamentos)
- **ADMIN** - Administrador (acesso total exceto gestão de usuários)
- **SUPER_ADMIN** - Super administrador (acesso completo)

## 📧 Configuração de Email

Para habilitar notificações por email, configure as variáveis SMTP no `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
```

Para Gmail, use uma [senha de aplicativo](https://support.google.com/accounts/answer/185833).

## 🐳 Docker (Opcional)

```dockerfile
# Dockerfile exemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📈 Monitoramento

- Health check endpoint: `/health`
- Logs estruturados com Morgan
- Métricas de performance disponíveis
- Rate limiting com feedback

## 🤝 Integração com Frontend

Este backend foi projetado para integrar perfeitamente com o frontend Next.js descrito no TCC:

### Principais Integrações
- **Autenticação** - Login/logout com JWT
- **Catálogo de Serviços** - Listagem com filtros e categorias  
- **Calendário** - API de disponibilidade para componente de calendário
- **Agendamentos** - CRUD completo para gestão de agendamentos
- **Dashboard Admin** - Dados para gráficos e relatórios
- **Notificações** - Emails automáticos para confirmações

### Exemplo de Uso no Frontend

```javascript
// Obter serviços disponíveis
const services = await fetch('/api/services').then(r => r.json());

// Verificar disponibilidade
const availability = await fetch(
  `/api/availability/slots?serviceId=${serviceId}&date=${date}`
).then(r => r.json());

// Criar agendamento
const appointment = await fetch('/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId,
    date,
    startTime,
    clientName,
    clientEmail
  })
}).then(r => r.json());
```

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="secret-muito-seguro-para-producao"
CORS_ORIGIN="https://seu-frontend.com"
```

### Checklist de Deploy
- [ ] Configurar banco PostgreSQL
- [ ] Definir JWT_SECRET seguro
- [ ] Configurar SMTP para emails
- [ ] Executar migrations
- [ ] Configurar CORS para domínio correto
- [ ] Configurar SSL/HTTPS
- [ ] Monitoramento e logs

## 📞 Suporte

Para dúvidas sobre implementação ou integração com o frontend, consulte:
- Documentação da API: `/api/docs`
- Health check: `/health`
- Logs do servidor para debugging

---

**Timelyfy Backend** - Sistema completo de agendamentos online 🗓️✨