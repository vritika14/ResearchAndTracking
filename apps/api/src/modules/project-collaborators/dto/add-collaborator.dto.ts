// apps/api/src/modules/project-collaborators/dto/add-collaborator.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class AddCollaboratorDto {
  @ApiProperty({ description: 'The internal user ID to add as a collaborator' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'Collaborator' })
  @IsString()
  role!: string;
}
