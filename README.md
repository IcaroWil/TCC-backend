# 📅 Sistema de Agendamento Online - Backend

Sistema completo de agendamento online construído com **NestJS**, **Prisma**, **PostgreSQL** e **Clean Architecture**.

## 🚀 Funcionalidades

### ✅ **Autenticação e Autorização**
- Login e registro de usuários
- JWT para autenticação
- RBAC (Role-Based Access Control)
- Roles: ADMIN e CUSTOMER

### ✅ **Gestão de Serviços**
- CRUD completo de serviços
- Apenas ADMINs podem gerenciar
- CUSTOMERs podem visualizar

### ✅ **Gestão de Horários**
- CRUD de horários disponíveis
- Filtros por data e disponibilidade
- Apenas ADMINs podem gerenciar

### ✅ **Sistema de Agendamentos**
- Criação de agendamentos
- Validação de conflitos
- Status de agendamento (PENDING, CONFIRMED, CANCELLED)

### ✅ **Notificações**
- **Email**: Confirmação para cliente e notificação para admin (Nodemailer/Gmail SMTP)
- **Templates HTML**: Profissionais, responsivos e com links de calendário

### ✅ **Integração com Calendários**
- Links para Google/Outlook e anexo ICS (Apple)
- **LGPD Compliant**: Consentimento explícito

### ✅ **API Documentation**
- Swagger/OpenAPI completo
- Exemplos de uso
- Autenticação integrada

## 🛠️ Tecnologias

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT
- **Email**: Nodemailer + Gmail SMTP
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/IcaroWil/TCC-backend.git
cd TCC-backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduling_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
ADMIN_INVITE_CODE="admin123"

# Email (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# (Opcional) N8N para orquestração de WhatsApp (desabilitado)
# N8N_WHATSAPP_WEBHOOK_URL="https://seu-n8n/webhook/agendamento-online"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

### 4. Configure o banco de dados
```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Popular com dados iniciais
npm run prisma:seed
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

## 📚 Uso da API

### Acesse a documentação
- **Swagger UI**: http://localhost:3000/api-docs
- **API Base**: http://localhost:3000

### Endpoints Principais

#### **Autenticação**
```bash
POST /auth/login
POST /auth/register
GET  /auth/profile
```

#### **Serviços** (ADMIN)
```bash
GET    /services
POST   /services
PATCH  /services/:id
DELETE /services/:id
```

#### **Horários** (ADMIN)
```bash
GET    /schedules
POST   /schedules
PATCH  /schedules/:id
DELETE /schedules/:id
```

#### **Agendamentos**
```bash
GET  /appointments
POST /appointments
GET  /appointments/:id
```

#### **Usuários** (ADMIN)
```bash
GET    /users
POST   /users
PATCH  /users/:id/role
DELETE /users/:id
```

## 🔐 Autenticação

### 1. Registre um usuário
```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "+5511999999999"
}
```

### 2. Faça login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Use o token nas requisições
```bash
Authorization: Bearer <seu-token>
```

## 📧 Configuração de Email

### Gmail SMTP
1. Ative 2FA na sua conta Google
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use a senha de 16 caracteres no `EMAIL_PASS`

## 📱 WhatsApp (Opcional)

Neste momento, o envio por WhatsApp está desabilitado no backend.
Se desejar orquestrar via n8n no futuro, habilite a variável `N8N_WHATSAPP_WEBHOOK_URL` e implemente o fluxo no n8n.

## 🗓️ Integração com Calendários

### Com Consentimento
```bash
POST /appointments
{
  "scheduleId": 1,
  "serviceId": 2,
  "addToCalendar": true
}
```

### Sem Consentimento
```bash
POST /appointments
{
  "scheduleId": 1,
  "serviceId": 2
}
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📁 Estrutura do Projeto

```
src/
├── auth/                 # Autenticação e autorização
├── users/               # Gestão de usuários
├── services/            # Gestão de serviços
├── schedules/           # Gestão de horários
├── appointments/        # Sistema de agendamentos
├── common/              # Utilitários compartilhados
│   ├── prisma/         # Configuração do Prisma
│   ├── notifications/  # Serviço de notificações
│   ├── decorators/     # Decorators customizados
│   └── guards/         # Guards de autenticação
└── main.ts             # Ponto de entrada
```

## 🔒 Segurança

- ✅ **Helmet** para headers de segurança
- ✅ **Rate Limiting** para prevenir spam
- ✅ **CORS** configurado
- ✅ **Validação** de dados com class-validator
- ✅ **JWT** para autenticação
- ✅ **RBAC** para controle de acesso
- ✅ **LGPD Compliant** para integração com calendários

## 🚀 Deploy

### Docker
```bash
docker build -t scheduling-backend .
docker run -p 3000:3000 scheduling-backend
```

### Variáveis de Produção
- Configure `DATABASE_URL` para seu banco de produção
- Use `JWT_SECRET` forte e único
- Configure `CORS_ORIGIN` para seus domínios
- Configure credenciais de email

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório.

---

**Desenvolvido com ❤️ usando NestJS e Clean Architecture**