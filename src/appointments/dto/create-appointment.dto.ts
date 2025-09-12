import { IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  scheduleId: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  serviceId: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  addToCalendar?: boolean; // Consentimento explícito para adicionar ao calendário
}