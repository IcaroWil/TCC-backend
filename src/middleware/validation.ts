import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendValidationError } from '@/utils/response';

/**
 * Middleware de validação genérico
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validar body, query e params
      const data = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        
        sendValidationError(res, errors, 'Dados de entrada inválidos');
        return;
      }

      // Adicionar dados validados ao request
      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error('Erro na validação:', error);
      sendValidationError(res, null, 'Erro interno na validação');
    }
  };
}

/**
 * Middleware para validar apenas o body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        
        sendValidationError(res, errors, 'Dados do corpo da requisição inválidos');
        return;
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error('Erro na validação do body:', error);
      sendValidationError(res, null, 'Erro interno na validação');
    }
  };
}

/**
 * Middleware para validar apenas query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        
        sendValidationError(res, errors, 'Parâmetros de consulta inválidos');
        return;
      }

      req.validatedQuery = result.data;
      next();
    } catch (error) {
      console.error('Erro na validação da query:', error);
      sendValidationError(res, null, 'Erro interno na validação');
    }
  };
}

/**
 * Middleware para validar apenas path parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        
        sendValidationError(res, errors, 'Parâmetros da URL inválidos');
        return;
      }

      req.validatedParams = result.data;
      next();
    } catch (error) {
      console.error('Erro na validação dos params:', error);
      sendValidationError(res, null, 'Erro interno na validação');
    }
  };
}

/**
 * Esquemas de validação para parâmetros comuns
 */
export const commonSchemas = {
  id: z.object({
    id: z.string().min(1, 'ID é obrigatório'),
  }),
  
  pagination: z.object({
    page: z.string().transform(val => parseInt(val) || 1).optional(),
    limit: z.string().transform(val => {
      const num = parseInt(val) || 10;
      return Math.min(Math.max(num, 1), 100); // Entre 1 e 100
    }).optional(),
  }),
  
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida').optional(),
  }),
};

// Estender interface Request para incluir dados validados
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}