import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Meeting notes — kickoff' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}
