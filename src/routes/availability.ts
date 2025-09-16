import { Router } from 'express';
import availabilityController from '@/controllers/availabilityController';
import { validateQuery, validateBody } from '@/middleware/validation';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { availabilityQuerySchema, timeSlotSchema } from '@/utils/validation';

const router = Router();

/**
 * @swagger
 * /api/availability/slots:
 *   get:
 *     summary: Obter horários disponíveis para um serviço
 *     tags: [Disponibilidade]
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do serviço
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data desejada (YYYY-MM-DD)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Horários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     serviceId:
 *                       type: string
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "09:00"
 *                     totalSlots:
 *                       type: integer
 *       400:
 *         description: Parâmetros obrigatórios não fornecidos
 */
router.get('/slots', availabilityController.getAvailableSlots);

/**
 * @swagger
 * /api/availability/range:
 *   get:
 *     summary: Obter disponibilidade para um período
 *     tags: [Disponibilidade]
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Disponibilidade do período
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                     availability:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get('/range', 
  validateQuery(availabilityQuerySchema), 
  availabilityController.getAvailabilityRange
);

/**
 * @swagger
 * /api/availability/check:
 *   get:
 *     summary: Verificar se um horário específico está disponível
 *     tags: [Disponibilidade]
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *         example: "14:30"
 *     responses:
 *       200:
 *         description: Resultado da verificação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     date:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     isAvailable:
 *                       type: boolean
 */
router.get('/check', availabilityController.checkSlotAvailability);

/**
 * @swagger
 * /api/availability/next:
 *   get:
 *     summary: Obter próximos horários disponíveis
 *     tags: [Disponibilidade]
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de horários a retornar
 *     responses:
 *       200:
 *         description: Próximos horários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     nextAvailableSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           time:
 *                             type: string
 *                           datetime:
 *                             type: string
 *                     totalFound:
 *                       type: integer
 */
router.get('/next', availabilityController.getNextAvailableSlots);

/**
 * @swagger
 * /api/availability/block:
 *   post:
 *     summary: Bloquear horários (apenas admin)
 *     tags: [Disponibilidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               startTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "14:00"
 *               endTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "15:00"
 *               reason:
 *                 type: string
 *                 example: "Manutenção do equipamento"
 *     responses:
 *       200:
 *         description: Horários bloqueados com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/block', 
  authenticateToken, 
  requireAdmin, 
  validateBody(timeSlotSchema), 
  availabilityController.blockTimeSlots
);

/**
 * @swagger
 * /api/availability/unblock:
 *   post:
 *     summary: Desbloquear horários (apenas admin)
 *     tags: [Disponibilidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *     responses:
 *       200:
 *         description: Horários desbloqueados com sucesso
 */
router.post('/unblock', 
  authenticateToken, 
  requireAdmin, 
  availabilityController.unblockTimeSlots
);

/**
 * @swagger
 * /api/availability/stats:
 *   get:
 *     summary: Obter estatísticas de disponibilidade (apenas admin)
 *     tags: [Disponibilidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estatísticas de disponibilidade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                         endDate:
 *                           type: string
 *                     totalSlots:
 *                       type: integer
 *                     availableSlots:
 *                       type: integer
 *                     bookedSlots:
 *                       type: integer
 *                     occupancyRate:
 *                       type: number
 */
router.get('/stats', 
  authenticateToken, 
  requireAdmin, 
  availabilityController.getAvailabilityStats
);

export default router;