import { Controller, Post, Body, Get, Param, Delete, UseGuards, Patch, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  @ApiBody({
    schema: {
      example: {
        email: 'newuser@mail.com',
        password: 'Secret1!',
        name: 'New User',
        phone: '+5511999999999',
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id/role')
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { example: { role: 'ADMIN' } } })
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }
}