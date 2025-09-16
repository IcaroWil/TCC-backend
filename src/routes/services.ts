import { Router } from 'express';
import servicesController from '@/controllers/servicesController';
import { validateBody, validateParams, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requireAdmin, optionalAuth } from '@/middleware/auth';
import { createServiceSchema, updateServiceSchema } from '@/utils/validation';

const router = Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar serviços
 *     tags: [Serviços]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo (apenas admin)
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', optionalAuth, servicesController.getServices);

/**
 * @swagger
 * /api/services/categories:
 *   get:
 *     summary: Obter categorias de serviços
 *     tags: [Serviços]
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get('/categories', servicesController.getCategories);

/**
 * @swagger
 * /api/services/stats:
 *   get:
 *     summary: Obter estatísticas dos serviços
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Estatísticas dos serviços
 */
router.get('/stats', authenticateToken, requireAdmin, servicesController.getServicesStats);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obter um serviço específico
 *     tags: [Serviços]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Dados do serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Serviço não encontrado
 */
router.get('/:id', validateParams(commonSchemas.id), optionalAuth, servicesController.getService);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Criar novo serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *                 example: Consulta Geral
 *               description:
 *                 type: string
 *                 example: Consulta médica geral
 *               duration:
 *                 type: integer
 *                 example: 30
 *                 description: Duração em minutos
 *               price:
 *                 type: number
 *                 example: 150.00
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               category:
 *                 type: string
 *                 example: Consultas
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/', authenticateToken, requireAdmin, validateBody(createServiceSchema), servicesController.createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Atualizar serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               price:
 *                 type: number
 *               color:
 *                 type: string
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  validateBody(updateServiceSchema), 
  servicesController.updateService
);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Excluir serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Serviço excluído com sucesso
 *       400:
 *         description: Não é possível excluir serviço com agendamentos ativos
 *       404:
 *         description: Serviço não encontrado
 */
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  servicesController.deleteService
);

/**
 * @swagger
 * /api/services/{id}/toggle-status:
 *   patch:
 *     summary: Ativar/Desativar serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status do serviço alterado com sucesso
 *       404:
 *         description: Serviço não encontrado
 */
router.patch('/:id/toggle-status', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  servicesController.toggleServiceStatus
);

export default router;