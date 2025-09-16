# 📅 Sistema de Agendamento Online - Backend

Sistema completo de agendamento online construído com **NestJS**, **Prisma**, **PostgreSQL** e **Clean Architecture**.

## 🚀 Funcionalidades

### ✅ **Autenticação e Autorização**
- Login e registro de usuários
- JWT para autenticação
- RBAC (Role-Based Access Control)
- Roles: ADMIN e CUSTOMER
- Código de convite para registro de ADMINs

### ✅ **Gestão de Serviços**
- CRUD completo de serviços
- Geração automática de horários baseada na configuração
- Apenas ADMINs podem gerenciar
- CUSTOMERs podem visualizar

### ✅ **Gestão de Horários**
- CRUD de horários disponíveis
- Filtros por data, serviço e disponibilidade
- Geração automática baseada em dias da semana, horários e intervalos
- Apenas ADMINs podem gerenciar

### ✅ **Sistema de Agendamentos**
- Criação de agendamentos (autenticados e públicos)
- Validação de conflitos
- Status de agendamento (PENDING, CONFIRMED, CANCELLED)
- Criação automática de usuários para agendamentos públicos

### ✅ **Área Pública (Sem Login)**
- Visualização de serviços disponíveis
- Consulta de horários por serviço e data
- Criação de agendamentos sem necessidade de cadastro
- Notificações automáticas por email

### ✅ **Notificações**
- **Email**: Confirmação para cliente e notificação para admin (Nodemailer/Gmail SMTP)
- **Templates HTML**: Profissionais, responsivos e com links de calendário
- **Anexos ICS**: Para integração com Apple Calendar

### ✅ **Integração com Calendários**
- Links para Google Calendar e Outlook
- Anexo ICS para Apple Calendar
- **LGPD Compliant**: Consentimento explícito para integração

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

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# Admin notifications
ADMIN_NOTIFICATIONS_ENABLED=true

# (Opcional) N8N para orquestração de WhatsApp (desabilitado)
# N8N_WHATSAPP_WEBHOOK_URL="https://seu-n8n/webhook/agendamento-online"
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

## 🔗 Endpoints da API

### **🔓 Públicos (Sem Autenticação)**

#### **Serviços**
```bash
GET /public/services
```
- Lista todos os serviços disponíveis
- Retorna: id, name, description, price, duration

#### **Horários**
```bash
GET /public/services/:id/schedules?date=YYYY-MM-DD&available=true
```
- Lista horários disponíveis para um serviço
- Parâmetros opcionais: date, available
- Retorna horários com informações do serviço

#### **Agendamentos Públicos**
```bash
POST /public/appointments
```
- Cria agendamento sem necessidade de login
- Body: `{ serviceId, scheduleId, name, email, phone, addToCalendar }`
- Cria usuário automaticamente se não existir

### **🔐 Autenticação**

#### **Login e Registro**
```bash
POST /auth/login
POST /auth/register
GET  /auth/profile
```

### **👑 Administração (ADMIN)**

#### **Usuários**
```bash
GET    /users
POST   /users
GET    /users/:id
DELETE /users/:id
PATCH  /users/:id/role
```

#### **Serviços**
```bash
GET    /services
POST   /services
GET    /services/:id
PATCH  /services/:id
DELETE /services/:id
POST   /services/:id/generate-schedules
```

#### **Horários**
```bash
GET    /schedules
POST   /schedules
GET    /schedules/:id
PATCH  /schedules/:id
DELETE /schedules/:id
```

#### **Agendamentos**
```bash
GET  /appointments
POST /appointments
GET  /appointments/:id
```

## 🔐 Autenticação

### 1. Registre um usuário
```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "+5511999999999",
  "role": "CUSTOMER"
}
```

### 2. Registre um ADMIN
```bash
POST /auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin Name",
  "phone": "+5511999999999",
  "role": "ADMIN",
  "adminInviteCode": "admin123"
}
```

### 3. Faça login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. Use o token nas requisições
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
├── app.controller.ts          # Controller principal
├── app.module.ts             # Módulo principal
├── app.service.ts            # Serviço principal
├── main.ts                   # Ponto de entrada
├── auth/                     # Autenticação e autorização
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── users/                    # Gestão de usuários
│   ├── users.controller.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-role.dto.ts
│   └── entities/
│       └── user.entity.ts
├── services/                 # Gestão de serviços
│   ├── services.controller.ts
│   ├── services.module.ts
│   ├── services.service.ts
│   ├── dto/
│   │   ├── create-service.dto.ts
│   │   └── generate-schedules.dto.ts
│   └── entities/
├── schedules/                # Gestão de horários
│   ├── schedules.controller.ts
│   ├── schedules.module.ts
│   ├── schedules.service.ts
│   ├── dto/
│   │   └── create-schedule.dto.ts
│   └── entities/
├── appointments/             # Sistema de agendamentos
│   ├── appointments.controller.ts
│   ├── appointments.module.ts
│   ├── appointments.service.ts
│   ├── dto/
│   │   └── create-appointment.dto.ts
│   └── entities/
│       └── appointment.entity.ts
├── public/                   # Área pública (sem autenticação)
│   ├── public.controller.ts
│   ├── public.module.ts
│   ├── public.service.ts
│   └── dto/
│       └── create-guest-appointment.dto.ts
└── common/                   # Utilitários compartilhados
    ├── prisma/              # Configuração do Prisma
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── notifications/       # Serviço de notificações
    │   └── notification.service.ts
    ├── decorators/          # Decorators customizados
    │   └── roles.decorator.ts
    ├── guards/              # Guards de autenticação
    │   └── roles.guard.ts
    ├── filters/             # Filtros de exceção
    └── interceptors/        # Interceptadores
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

### Render.com
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Use os comandos:
   - **Build**: `npm install && npm run prisma:generate && npm run build`
   - **Start**: `npx prisma migrate deploy && npm run start:prod`

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