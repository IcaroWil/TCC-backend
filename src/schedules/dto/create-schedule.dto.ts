import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  serviceId: number;

  @ApiProperty({ description: 'ISO date string (e.g., 2025-12-31T00:00:00.000Z)' })
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'HH:mm format, 24h' })
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ description: 'HH:mm format, 24h' })
  @IsNotEmpty()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;
}