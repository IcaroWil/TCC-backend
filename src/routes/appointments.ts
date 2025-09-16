import { Router } from 'express';
import appointmentsController from '@/controllers/appointmentsController';
import { validateBody, validateParams, validateQuery, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requireAdmin, optionalAuth } from '@/middleware/auth';
import { createAppointmentSchema, updateAppointmentSchema, appointmentQuerySchema } from '@/utils/validation';

const router = Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Listar agendamentos
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Apenas para administradores
 *     responses:
 *       200:
 *         description: Lista de agendamentos
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
 *                     $ref: '#/components/schemas/Appointment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  authenticateToken, 
  validateQuery(appointmentQuerySchema), 
  appointmentsController.getAppointments
);

/**
 * @swagger
 * /api/appointments/today:
 *   get:
 *     summary: Obter agendamentos de hoje
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agendamentos de hoje
 */
router.get('/today', authenticateToken, requireAdmin, appointmentsController.getTodayAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Obter um agendamento específico
 *     tags: [Agendamentos]
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
 *         description: Dados do agendamento
 *       404:
 *         description: Agendamento não encontrado
 */
router.get('/:id', 
  authenticateToken, 
  validateParams(commonSchemas.id), 
  appointmentsController.getAppointment
);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Criar novo agendamento
 *     tags: [Agendamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - date
 *               - startTime
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: "clr123456789"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               startTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "14:30"
 *               clientName:
 *                 type: string
 *                 example: "João Silva"
 *                 description: Obrigatório se não autenticado
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 example: "joao@email.com"
 *                 description: Obrigatório se não autenticado
 *               clientPhone:
 *                 type: string
 *                 example: "(11) 99999-9999"
 *               notes:
 *                 type: string
 *                 example: "Primeira consulta"
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       400:
 *         description: Horário não disponível ou dados inválidos
 */
router.post('/', 
  optionalAuth, 
  validateBody(createAppointmentSchema), 
  appointmentsController.createAppointment
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Atualizar agendamento
 *     tags: [Agendamentos]
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
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agendamento atualizado com sucesso
 *       404:
 *         description: Agendamento não encontrado
 */
router.put('/:id', 
  authenticateToken, 
  validateParams(commonSchemas.id), 
  validateBody(updateAppointmentSchema), 
  appointmentsController.updateAppointment
);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancelar agendamento
 *     tags: [Agendamentos]
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
 *         description: Agendamento cancelado com sucesso
 *       400:
 *         description: Não é possível cancelar este agendamento
 *       404:
 *         description: Agendamento não encontrado
 */
router.patch('/:id/cancel', 
  authenticateToken, 
  validateParams(commonSchemas.id), 
  appointmentsController.cancelAppointment
);

/**
 * @swagger
 * /api/appointments/{id}/confirm:
 *   patch:
 *     summary: Confirmar agendamento
 *     tags: [Agendamentos]
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
 *         description: Agendamento confirmado com sucesso
 *       400:
 *         description: Apenas agendamentos "agendado" podem ser confirmados
 *       404:
 *         description: Agendamento não encontrado
 */
router.patch('/:id/confirm', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  appointmentsController.confirmAppointment
);

/**
 * @swagger
 * /api/appointments/{id}/complete:
 *   patch:
 *     summary: Marcar agendamento como concluído
 *     tags: [Agendamentos]
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
 *         description: Agendamento marcado como concluído
 *       400:
 *         description: Não é possível concluir este agendamento
 *       404:
 *         description: Agendamento não encontrado
 */
router.patch('/:id/complete', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  appointmentsController.completeAppointment
);

export default router;