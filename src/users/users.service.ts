import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await (this.prisma as any).user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return (this.prisma as any).user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        phone: createUserDto.phone,
        role: 'CUSTOMER',
      },
    });
  }

  async findByEmail(email: string) {
    return (this.prisma as any).user.findUnique({ where: { email } });
  }

  async findByEmailAndRole(email: string, role: 'ADMIN' | 'CUSTOMER') {
    return (this.prisma as any).user.findFirst({ 
      where: { 
        email, 
        role 
      } 
    });
  }


  async findById(id: number) {
    const user = await (this.prisma as any).user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findAll() {
    return (this.prisma as any).user.findMany();
  }

  async updateRole(id: number, role: 'ADMIN' | 'CUSTOMER') {
    await this.findById(id);
    return (this.prisma as any).user.update({ where: { id }, data: { role } });
  }

  async remove(id: number) {
    await this.findById(id);
    return (this.prisma as any).user.delete({ where: { id } });
  }
}