import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '@/types';
import { sendUnauthorized, sendForbidden } from '@/utils/response';

const prisma = new PrismaClient();

/**
 * Middleware para verificar autenticação JWT
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      sendUnauthorized(res, 'Token de acesso requerido');
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'Usuário não encontrado');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Token inválido');
      return;
    }
    
    console.error('Erro na autenticação:', error);
    sendUnauthorized(res, 'Erro na verificação do token');
  }
}

/**
 * Middleware para verificar se o usuário é administrador
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendUnauthorized(res, 'Usuário não autenticado');
    return;
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    sendForbidden(res, 'Acesso restrito a administradores');
    return;
  }

  next();
}

/**
 * Middleware para verificar se o usuário é super administrador
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendUnauthorized(res, 'Usuário não autenticado');
    return;
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    sendForbidden(res, 'Acesso restrito a super administradores');
    return;
  }

  next();
}

/**
 * Middleware para verificar se o usuário pode acessar o recurso
 * (próprio usuário ou admin)
 */
export function requireOwnershipOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendUnauthorized(res, 'Usuário não autenticado');
    return;
  }

  const resourceUserId = req.params.userId || req.params.id;
  const isOwner = req.user.id === resourceUserId;
  const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;

  if (!isOwner && !isAdmin) {
    sendForbidden(res, 'Acesso negado');
    return;
  }

  next();
}

/**
 * Middleware opcional de autenticação (não falha se não autenticado)
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignora erros de autenticação no modo opcional
    next();
  }
}

/**
 * Gerar token JWT
 */
export function generateToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET não configurado');
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

/**
 * Verificar token JWT sem middleware
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    return jwt.verify(token, jwtSecret) as { userId: string };
  } catch (error) {
    return null;
  }
}