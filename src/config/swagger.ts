import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Timelyfy API',
      version: '1.0.0',
      description: 'API completa para sistema de agendamentos online',
      contact: {
        name: 'Timelyfy Support',
        email: 'support@timelyfy.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.timelyfy.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr123456789',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'João Silva',
            },
            role: {
              type: 'string',
              enum: ['CLIENT', 'ADMIN', 'SUPER_ADMIN'],
              example: 'CLIENT',
            },
            phone: {
              type: 'string',
              example: '(11) 99999-9999',
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr123456789',
            },
            name: {
              type: 'string',
              example: 'Consulta Geral',
            },
            description: {
              type: 'string',
              example: 'Consulta médica geral com duração de 30 minutos',
            },
            duration: {
              type: 'integer',
              example: 30,
              description: 'Duração em minutos',
            },
            price: {
              type: 'number',
              example: 150.00,
            },
            color: {
              type: 'string',
              example: '#3B82F6',
            },
            category: {
              type: 'string',
              example: 'Consultas',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            creator: {
              $ref: '#/components/schemas/User',
            },
            _count: {
              type: 'object',
              properties: {
                appointments: {
                  type: 'integer',
                },
              },
            },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr123456789',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
              example: 'SCHEDULED',
            },
            notes: {
              type: 'string',
              example: 'Primeira consulta',
            },
            clientName: {
              type: 'string',
              example: 'João Silva',
            },
            clientEmail: {
              type: 'string',
              example: 'joao@email.com',
            },
            clientPhone: {
              type: 'string',
              example: '(11) 99999-9999',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            service: {
              $ref: '#/components/schemas/Service',
            },
            client: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            pages: {
              type: 'integer',
              example: 10,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
            },
            error: {
              type: 'string',
            },
            pagination: {
              $ref: '#/components/schemas/Pagination',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            data: {
              type: 'object',
              description: 'Dados adicionais do erro (opcional)',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso necessário',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Dados de entrada inválidos',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Error' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            field: {
                              type: 'string',
                            },
                            message: {
                              type: 'string',
                            },
                            code: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e gerenciamento de usuários',
      },
      {
        name: 'Serviços',
        description: 'Gerenciamento de serviços oferecidos',
      },
      {
        name: 'Agendamentos',
        description: 'Sistema de agendamentos',
      },
      {
        name: 'Disponibilidade',
        description: 'Consulta de horários disponíveis',
      },
      {
        name: 'Administração',
        description: 'Funcionalidades administrativas',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './dist/routes/*.js',
  ],
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: Application): void {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #3B82F6 }
    `,
    customSiteTitle: 'Timelyfy API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api/docs');
}

export { specs };