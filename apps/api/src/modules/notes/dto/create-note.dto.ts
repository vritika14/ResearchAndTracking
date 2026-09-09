// apps/api/src/modules/notes/dto/create-note.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';

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
  projectId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({ required: false, example: 'Private' })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiProperty({
    required: false,
    description:
      'A follow-up date shown on the Calendar page as a reminder for this note.',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
