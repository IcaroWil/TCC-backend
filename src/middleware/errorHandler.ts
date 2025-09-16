import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError, sendInternalError } from '@/utils/response';

/**
 * Middleware global para tratamento de erros
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Erro capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Erro de validação do Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Dados inválidos fornecidos', 400);
    return;
  }

  // Erro de violação de constraint do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Violação de constraint única
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'campo';
        sendError(res, `${field} já existe no sistema`, 409);
        return;
      
      case 'P2025':
        // Registro não encontrado
        sendError(res, 'Registro não encontrado', 404);
        return;
      
      case 'P2003':
        // Violação de foreign key
        sendError(res, 'Referência inválida', 400);
        return;
      
      case 'P2014':
        // Violação de relação
        sendError(res, 'Operação inválida devido a relacionamentos existentes', 400);
        return;
      
      default:
        sendError(res, 'Erro no banco de dados', 500);
        return;
    }
  }

  // Erro de conexão com o banco
  if (error instanceof Prisma.PrismaClientInitializationError) {
    sendInternalError(res, 'Erro de conexão com o banco de dados');
    return;
  }

  // Erro de timeout do banco
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    sendInternalError(res, 'Erro interno do banco de dados');
    return;
  }

  // Erros personalizados da aplicação
  if (error.name === 'ValidationError') {
    sendError(res, error.message, 400);
    return;
  }

  if (error.name === 'UnauthorizedError') {
    sendError(res, error.message, 401);
    return;
  }

  if (error.name === 'ForbiddenError') {
    sendError(res, error.message, 403);
    return;
  }

  if (error.name === 'NotFoundError') {
    sendError(res, error.message, 404);
    return;
  }

  if (error.name === 'ConflictError') {
    sendError(res, error.message, 409);
    return;
  }

  // Erro genérico
  if (process.env.NODE_ENV === 'production') {
    sendInternalError(res, 'Erro interno do servidor');
  } else {
    sendError(res, error.message, 500);
  }
}

/**
 * Middleware para capturar rotas não encontradas
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  sendError(res, `Rota ${req.method} ${req.path} não encontrada`, 404);
}

/**
 * Classes de erro personalizadas
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Wrapper para funções async para capturar erros automaticamente
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}