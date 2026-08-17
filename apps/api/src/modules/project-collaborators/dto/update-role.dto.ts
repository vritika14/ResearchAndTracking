// apps/api/src/modules/project-collaborators/dto/update-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Supervisor' })
  @IsString()
  role!: string;
}
