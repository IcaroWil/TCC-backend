import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGuestAppointmentDto {
  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  serviceId: number;

  @ApiProperty({ description: 'Schedule ID' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  scheduleId: number;

  @ApiProperty({ description: 'Customer full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Customer email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ 
    description: 'Whether to add appointment to calendar', 
    required: false,
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  addToCalendar?: boolean;
}
