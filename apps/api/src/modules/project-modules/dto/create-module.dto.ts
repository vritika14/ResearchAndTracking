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
  @ApiProperty({
    example: 'Kinase paper',
    description:
      'The working name used day-to-day, often before a formal title exists.',
  })
  @IsString()
  @Length(1, 200)
  shortTitle!: string;

  @ApiProperty({
    required: false,
    example: 'Draft Manuscript',
    description: 'The formal title, often added later in the process.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 300)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: "The paper's academic abstract.",
  })
  @IsOptional()
  @IsString()
  abstract?: string;

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
