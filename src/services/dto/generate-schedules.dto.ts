import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator';
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

export class GenerateSchedulesDto {
  @ApiProperty({ example: '2025-09-15' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-10-15' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format'
  })
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format'
  })
  endTime: string;

  @ApiProperty({ description: 'Duration in minutes', example: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  duration: number;

  @ApiProperty({ description: 'Interval in minutes', example: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  interval: number;

  @ApiProperty({ 
    type: [String], 
    enum: DayOfWeek,
    example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];
}
