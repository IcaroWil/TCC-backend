import { Response } from 'express';
import { ApiResponse } from '@/types';

/**
 * Enviar resposta de sucesso
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Enviar resposta de sucesso com paginação
 */
export function sendSuccessWithPagination<T>(
  res: Response,
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  },
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Enviar resposta de erro
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400,
  data?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error,
    data,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Enviar resposta de erro de validação
 */
export function sendValidationError(
  res: Response,
  errors: any,
  message: string = 'Dados inválidos'
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    data: errors,
  };
  
  return res.status(422).json(response);
}

/**
 * Enviar resposta de erro não autorizado
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Não autorizado'
): Response {
  return sendError(res, message, 401);
}

/**
 * Enviar resposta de erro proibido
 */
export function sendForbidden(
  res: Response,
  message: string = 'Acesso negado'
): Response {
  return sendError(res, message, 403);
}

/**
 * Enviar resposta de não encontrado
 */
export function sendNotFound(
  res: Response,
  message: string = 'Recurso não encontrado'
): Response {
  return sendError(res, message, 404);
}

/**
 * Enviar resposta de conflito
 */
export function sendConflict(
  res: Response,
  message: string = 'Conflito de dados'
): Response {
  return sendError(res, message, 409);
}

/**
 * Enviar resposta de erro interno do servidor
 */
export function sendInternalError(
  res: Response,
  message: string = 'Erro interno do servidor'
): Response {
  return sendError(res, message, 500);
}

/**
 * Calcular informações de paginação
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
) {
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  return {
    page,
    limit,
    total,
    pages,
    offset,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}