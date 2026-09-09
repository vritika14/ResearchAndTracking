// apps/api/src/modules/project-modules/dto/create-module.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Draft Manuscript' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    required: false,
    example: 'Research Paper',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    required: false,
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    required: false,
    example: 'Concept & Ideation',
  })
  @IsOptional()
  @IsString()
  pipelineStage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiProperty({
    required: false,
    example: '2027-06-01',
    description: 'Module due date in ISO date format',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
