import { Router } from 'express';
import adminController from '@/controllers/adminController';
import { validateBody, validateParams, commonSchemas } from '@/middleware/validation';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '@/middleware/auth';
import { updateBusinessHoursSchema, createHolidaySchema } from '@/utils/validation';
import { z } from 'zod';

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obter estatísticas do dashboard
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do dashboard
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
 *                     totalAppointments:
 *                       type: integer
 *                     todayAppointments:
 *                       type: integer
 *                     weekAppointments:
 *                       type: integer
 *                     monthAppointments:
 *                       type: integer
 *                     totalClients:
 *                       type: integer
 *                     totalServices:
 *                       type: integer
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: number
 *                         week:
 *                           type: number
 *                         month:
 *                           type: number
 *                     appointmentsByStatus:
 *                       type: object
 *                     popularServices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar usuários
 *     tags: [Administração]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLIENT, ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Atualizar role do usuário
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CLIENT, ADMIN, SUPER_ADMIN]
 *     responses:
 *       200:
 *         description: Role atualizado com sucesso
 *       400:
 *         description: Não é possível alterar próprio role
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/users/:id/role', 
  authenticateToken, 
  requireSuperAdmin, 
  validateParams(commonSchemas.id), 
  adminController.updateUserRole
);

/**
 * @swagger
 * /api/admin/business-hours:
 *   get:
 *     summary: Obter horários de funcionamento
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Horários de funcionamento
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       dayOfWeek:
 *                         type: integer
 *                       dayName:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
router.get('/business-hours', authenticateToken, requireAdmin, adminController.getBusinessHours);

/**
 * @swagger
 * /api/admin/business-hours/{dayOfWeek}:
 *   put:
 *     summary: Atualizar horário de funcionamento
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dayOfWeek
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: Dia da semana (0=Domingo, 1=Segunda, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *               - isActive
 *             properties:
 *               startTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "08:00"
 *               endTime:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "18:00"
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Horário atualizado com sucesso
 */
const dayOfWeekSchema = z.object({
  dayOfWeek: z.string().transform(val => {
    const num = parseInt(val);
    if (num < 0 || num > 6) throw new Error('Dia da semana inválido');
    return num;
  }),
});

router.put('/business-hours/:dayOfWeek', 
  authenticateToken, 
  requireAdmin, 
  validateParams(dayOfWeekSchema),
  validateBody(updateBusinessHoursSchema), 
  adminController.updateBusinessHours
);

/**
 * @swagger
 * /api/admin/holidays:
 *   get:
 *     summary: Listar feriados
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filtrar por ano
 *     responses:
 *       200:
 *         description: Lista de feriados
 */
router.get('/holidays', authenticateToken, requireAdmin, adminController.getHolidays);

/**
 * @swagger
 * /api/admin/holidays:
 *   post:
 *     summary: Criar feriado
 *     tags: [Administração]
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
 *               - name
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *               name:
 *                 type: string
 *                 example: "Natal"
 *               description:
 *                 type: string
 *                 example: "Feriado nacional"
 *               isRecurring:
 *                 type: boolean
 *                 default: false
 *                 description: Se verdadeiro, repete todos os anos
 *     responses:
 *       201:
 *         description: Feriado criado com sucesso
 */
router.post('/holidays', 
  authenticateToken, 
  requireAdmin, 
  validateBody(createHolidaySchema), 
  adminController.createHoliday
);

/**
 * @swagger
 * /api/admin/holidays/{id}:
 *   delete:
 *     summary: Excluir feriado
 *     tags: [Administração]
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
 *         description: Feriado excluído com sucesso
 *       404:
 *         description: Feriado não encontrado
 */
router.delete('/holidays/:id', 
  authenticateToken, 
  requireAdmin, 
  validateParams(commonSchemas.id), 
  adminController.deleteHoliday
);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Obter configurações do sistema
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações do sistema
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
 *                     settings:
 *                       type: object
 *                       description: Configurações organizadas por chave
 *                     raw:
 *                       type: array
 *                       description: Array com todas as configurações
 */
router.get('/settings', authenticateToken, requireAdmin, adminController.getSettings);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   put:
 *     summary: Atualizar configuração
 *     tags: [Administração]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "business_name"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *               type:
 *                 type: string
 *                 enum: [string, number, boolean, json]
 *                 default: string
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 */
const settingKeySchema = z.object({
  key: z.string().min(1, 'Chave da configuração é obrigatória'),
});

router.put('/settings/:key', 
  authenticateToken, 
  requireAdmin, 
  validateParams(settingKeySchema), 
  adminController.updateSetting
);

export default router;