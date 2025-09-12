import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiProperty({ required: false, enum: ['ADMIN', 'CUSTOMER'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'CUSTOMER'] as const)
  role?: 'ADMIN' | 'CUSTOMER';
  @ApiProperty({ required: false, description: 'Required if role = ADMIN' })
  @IsOptional()
  @IsString()
  adminInviteCode?: string;
}