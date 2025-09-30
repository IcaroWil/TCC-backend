import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGuestAppointmentDto {
  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  serviceId: number;

  @ApiProperty({ description: 'Appointment date (YYYY-MM-DD)', example: '2024-01-15' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ description: 'Appointment time (HH:MM)', example: '14:30' })
  @IsNotEmpty()
  @IsString()
  time: string;

  @ApiProperty({ description: 'Customer full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Customer email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    description: 'Whether to add appointment to calendar', 
    required: false,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  addToCalendar?: boolean;
}
