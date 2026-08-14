import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumberString,
  IsDateString,
  Length,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Novel Biomarkers in Early-Stage Detection' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  researchArea?: string;

  @ApiProperty({ required: false, example: 'Active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'Concept & Ideation' })
  @IsOptional()
  @IsString()
  pipelineStage?: string;

  @ApiProperty({ required: false, example: 'High' })
  @IsOptional()
  @IsString()
  importance?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  totalBudget?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetJournals?: string;
}
