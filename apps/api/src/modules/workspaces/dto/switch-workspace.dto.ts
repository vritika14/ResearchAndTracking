import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SwitchWorkspaceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;
}
