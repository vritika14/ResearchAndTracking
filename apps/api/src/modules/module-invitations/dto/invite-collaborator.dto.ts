// apps/api/src/modules/module-invitations/dto/invite-collaborator.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteCollaboratorDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  email!: string;
}
