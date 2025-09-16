import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Middlewares
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Routes
import authRoutes from '@/routes/auth';
import servicesRoutes from '@/routes/services';
import appointmentsRoutes from '@/routes/appointments';
import availabilityRoutes from '@/routes/availability';
import adminRoutes from '@/routes/admin';

// Config
import { setupSwagger } from '@/config/swagger';

// Services
import emailService from '@/services/emailService';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar serviço de email (opcional)
    const emailStatus = await emailService.verifyConnection();
    
    res.status(200).json({
      success: true,
      message: 'API funcionando corretamente',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        email: emailStatus ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Serviço indisponível',
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Timelyfy API - Sistema de Agendamentos',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      appointments: '/api/appointments',
      availability: '/api/availability',
      admin: '/api/admin',
    },
  });
});

// Configurar documentação Swagger
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/admin', adminRoutes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware global de tratamento de erros
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Received ${signal}. Shutting down gracefully...`);
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Inicializar servidor
const startServer = async () => {
  try {
    // Verificar conexão com banco
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Verificar configuração de email
    const emailConnected = await emailService.verifyConnection();
    if (emailConnected) {
      console.log('✅ Email service connected');
    } else {
      console.log('⚠️  Email service not configured or failed to connect');
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🚀 Timelyfy API Server Started');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`📚 Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📋 Available Endpoints:');
      console.log('   • POST   /api/auth/login');
      console.log('   • POST   /api/auth/register');
      console.log('   • GET    /api/services');
      console.log('   • POST   /api/appointments');
      console.log('   • GET    /api/availability/slots');
      console.log('   • GET    /api/admin/dashboard');
      console.log('\n🔧 For complete API documentation, visit /api/docs');
      console.log('─'.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Tratar erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicação
startServer();

export default app;