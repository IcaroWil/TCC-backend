import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { generateToken } from '@/middleware/auth';
import { AuthenticatedRequest, CreateUserDTO, LoginDTO } from '@/types';
import { sendSuccess, sendError, sendUnauthorized, sendConflict } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

class AuthController {
  /**
   * Login do usuário
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginDTO = req.validatedData;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return sendUnauthorized(res, 'Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendUnauthorized(res, 'Credenciais inválidas');
    }

    // Gerar token
    const token = generateToken(user.id);

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    return sendSuccess(res, {
      user: userWithoutPassword,
      token,
    }, 'Login realizado com sucesso');
  });

  /**
   * Registro de novo usuário
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password, role, phone }: CreateUserDTO = req.validatedData;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return sendConflict(res, 'Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: role as UserRole || UserRole.CLIENT,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Gerar token
    const token = generateToken(user.id);

    return sendSuccess(res, {
      user,
      token,
    }, 'Usuário criado com sucesso', 201);
  });

  /**
   * Obter perfil do usuário autenticado
   */
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Usuário não autenticado');
    }

    return sendSuccess(res, req.user, 'Perfil obtido com sucesso');
  });

  /**
   * Atualizar perfil do usuário
   */
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Usuário não autenticado');
    }

    const { name, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, updatedUser, 'Perfil atualizado com sucesso');
  });

  /**
   * Alterar senha
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Usuário não autenticado');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Senha atual e nova senha são obrigatórias');
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Nova senha deve ter pelo menos 6 caracteres');
    }

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.password) {
      return sendError(res, 'Usuário não encontrado ou sem senha definida');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return sendError(res, 'Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    return sendSuccess(res, null, 'Senha alterada com sucesso');
  });

  /**
   * Logout (invalidar token - implementação básica)
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Em uma implementação mais robusta, você poderia:
    // 1. Manter uma lista de tokens inválidos (blacklist)
    // 2. Usar refresh tokens
    // 3. Armazenar tokens no banco com expiração
    
    return sendSuccess(res, null, 'Logout realizado com sucesso');
  });

  /**
   * Verificar token
   */
  verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Token inválido');
    }

    return sendSuccess(res, {
      valid: true,
      user: req.user,
    }, 'Token válido');
  });

  /**
   * Solicitar redefinição de senha (implementação básica)
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email é obrigatório');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    if (user) {
      // Aqui você implementaria:
      // 1. Gerar token de redefinição
      // 2. Salvar token no banco com expiração
      // 3. Enviar email com link de redefinição
      console.log(`Solicitação de redefinição de senha para: ${email}`);
    }

    return sendSuccess(res, null, 'Se o email existir, você receberá instruções para redefinir sua senha');
  });

  /**
   * Redefinir senha (implementação básica)
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 'Token e nova senha são obrigatórios');
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Nova senha deve ter pelo menos 6 caracteres');
    }

    // Aqui você implementaria:
    // 1. Verificar se o token é válido e não expirou
    // 2. Buscar usuário pelo token
    // 3. Atualizar senha
    // 4. Invalidar token

    return sendError(res, 'Funcionalidade de redefinição de senha não implementada', 501);
  });
}

export default new AuthController();