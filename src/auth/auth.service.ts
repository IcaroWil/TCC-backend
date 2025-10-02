import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser (email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, { jwtid: randomUUID() }),
    };
  }

  async register(email: string, password: string, role?: 'ADMIN' | 'CUSTOMER', adminInviteCode?: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }
    const name = email.split('@')[0];
    let finalRole: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER';
    if (role === 'ADMIN') {
      if (!process.env.ADMIN_INVITE_CODE) {
        throw new UnauthorizedException('Server not configured with ADMIN_INVITE_CODE');
      }
      if (!adminInviteCode) {
        throw new UnauthorizedException('Admin invite code is required for ADMIN role');
      }
      if (adminInviteCode !== process.env.ADMIN_INVITE_CODE) {
        throw new UnauthorizedException('Invalid admin invite code');
      }
      finalRole = 'ADMIN';
    }
    const dto: CreateUserDto = { email, password, name };
    const user = await this.usersService.create(dto);
    if (finalRole !== 'CUSTOMER') {
      await this.usersService.updateRole(user.id, finalRole);
    }
    return { id: user.id, email: user.email, name: user.name, role: finalRole };
  }
}