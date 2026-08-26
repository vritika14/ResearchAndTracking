// apps/api/src/modules/module-pipeline-stages-pool/dto/create-pipeline-stage.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Length } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty({ example: 'Testing' })
  @IsString()
  @Length(2, 100)
  value!: string;

  @ApiProperty({ required: false, example: 7 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
