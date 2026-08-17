// apps/api/src/modules/module-collaborators/dto/update-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Supervisor' })
  @IsString()
  role!: string;
}
