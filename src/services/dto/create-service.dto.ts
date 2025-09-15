import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export class CreateServiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ required: false, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @ApiProperty({ required: false, example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false, example: '18:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ required: false, description: 'Interval in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interval?: number;

  @ApiProperty({ 
    required: false, 
    type: [String], 
    enum: DayOfWeek,
    example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek?: DayOfWeek[];
}