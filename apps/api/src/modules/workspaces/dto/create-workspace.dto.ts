import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Research' })
  @IsString()
  @Length(2, 100)
  name!: string;
}
