// apps/api/src/modules/task-members/dto/add-member.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'The internal user ID to grant access' })
  @IsUUID()
  userId!: string;
}
