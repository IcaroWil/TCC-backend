import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'CUSTOMER'] })
  @IsEnum(['ADMIN', 'CUSTOMER'] as const)
  role: 'ADMIN' | 'CUSTOMER';
}


