// apps/api/src/modules/project-modules/dto/create-module.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
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

  @ApiProperty({
    required: false,
    type: [String],
    description:
      'Ordered pipeline stages configured specifically for this module',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 100, { each: true })
  pipelineStages?: string[];

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
