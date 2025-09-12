import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
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
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User  not found');
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async updateRole(id: number, role: 'ADMIN' | 'CUSTOMER') {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }
}