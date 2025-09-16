# 🚀 Guia de Configuração - Timelyfy Backend

Este guia irá ajudá-lo a configurar e executar o backend do Timelyfy em seu ambiente.

## ✅ Pré-requisitos

- [x] Node.js 18+ instalado
- [x] PostgreSQL 12+ instalado e rodando
- [x] npm ou pnpm instalado

## 🔧 Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# ⚠️  IMPORTANTE: Configure estas variáveis antes de prosseguir

# Database - Configure com seus dados do PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/timelyfy?schema=public"

# JWT - Use uma chave secreta forte em produção
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=3001
NODE_ENV="development"

# CORS - URL do seu frontend
CORS_ORIGIN="http://localhost:3000"

# Email - Configure para envio de notificações
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@timelyfy.com"
FROM_NAME="Timelyfy"

# Admin - Credenciais do administrador inicial
ADMIN_EMAIL="admin@timelyfy.com"
ADMIN_PASSWORD="admin123"
```

### 3. Configurar Banco de Dados

#### Opção A: PostgreSQL Local
```bash
# Criar banco de dados
createdb timelyfy

# Aplicar schema
npm run db:push

# Popular com dados iniciais
npm run db:seed
```

#### Opção B: Docker (PostgreSQL + Redis)
```bash
# Iniciar banco de dados
docker-compose up postgres redis -d

# Aplicar schema
npm run db:push

# Popular com dados iniciais
npm run db:seed
```

### 4. Iniciar Servidor
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## 🌐 Endpoints Principais

Após iniciar o servidor, você terá acesso a:

- **API Base**: http://localhost:3001
- **Documentação Swagger**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

### Principais Rotas

```
🔐 Autenticação
├── POST /api/auth/login
├── POST /api/auth/register
└── GET  /api/auth/profile

📋 Serviços
├── GET  /api/services
├── POST /api/services (admin)
└── PUT  /api/services/:id (admin)

📅 Agendamentos
├── GET  /api/appointments
├── POST /api/appointments
└── PATCH /api/appointments/:id/cancel

⏰ Disponibilidade
├── GET  /api/availability/slots
├── GET  /api/availability/range
└── GET  /api/availability/check

⚙️  Administração
├── GET  /api/admin/dashboard
├── GET  /api/admin/users
└── GET  /api/admin/settings
```

## 👤 Usuário Administrador

Após executar o seed, você pode fazer login com:
- **Email**: admin@timelyfy.com
- **Senha**: admin123

## 🧪 Testando a API

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Login do Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@timelyfy.com",
    "password": "admin123"
  }'
```

### 3. Listar Serviços
```bash
curl http://localhost:3001/api/services
```

### 4. Verificar Disponibilidade
```bash
curl "http://localhost:3001/api/availability/slots?serviceId=SERVICE_ID&date=2024-01-15"
```

## 🔄 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor com hot reload
npm run build        # Build para produção
npm start            # Servidor de produção

# Banco de dados
npm run db:generate  # Gerar cliente Prisma
npm run db:push      # Aplicar schema ao banco
npm run db:migrate   # Executar migrations
npm run db:seed      # Popular banco com dados
npm run db:studio    # Interface visual do banco

# Docker
docker-compose up -d              # Todos os serviços
docker-compose --profile dev up   # Ambiente desenvolvimento
docker-compose --profile prod up  # Ambiente produção
```

## 🔧 Integração com Frontend

Para integrar com o frontend Next.js mencionado no TCC:

### 1. Configure o CORS
```env
CORS_ORIGIN="http://localhost:3000"
```

### 2. Use os endpoints da API
```javascript
// No seu frontend Next.js
const API_BASE = 'http://localhost:3001/api';

// Exemplo: Listar serviços
const services = await fetch(`${API_BASE}/services`);

// Exemplo: Criar agendamento
const appointment = await fetch(`${API_BASE}/appointments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId: 'service-id',
    date: '2024-01-15',
    startTime: '14:30',
    clientName: 'João Silva',
    clientEmail: 'joao@email.com'
  })
});
```

### 3. Autenticação JWT
```javascript
// Armazenar token após login
localStorage.setItem('token', response.token);

// Usar token nas requisições
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

## ⚠️ Troubleshooting

### Erro de Conexão com Banco
```
Error: Can't reach database server
```
**Solução**: Verifique se o PostgreSQL está rodando e a URL do banco está correta.

### Erro de Prisma Client
```
Error: Prisma Client is not configured
```
**Solução**: Execute `npx prisma generate`

### Erro de CORS
```
Access to fetch blocked by CORS policy
```
**Solução**: Configure `CORS_ORIGIN` no `.env` com a URL do seu frontend.

### Emails não são enviados
**Solução**: Configure as variáveis SMTP no `.env`. Para Gmail, use uma senha de aplicativo.

## 📚 Documentação Completa

- **Swagger UI**: http://localhost:3001/api/docs
- **Schema do Banco**: `prisma/schema.prisma`
- **README**: Documentação detalhada no README.md

## 🚀 Deploy

Para deploy em produção, consulte o README.md para instruções completas de deploy com Docker, Heroku, Vercel ou outros provedores.

---

**Pronto!** 🎉 Seu backend do Timelyfy está configurado e pronto para uso!