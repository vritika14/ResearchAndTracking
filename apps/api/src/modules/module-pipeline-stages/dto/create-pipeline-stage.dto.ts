// apps/api/src/modules/module-pipeline-stages/dto/create-pipeline-stage.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Length } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty({ example: 'Internal Review' })
  @IsString()
  @Length(2, 100)
  value!: string;

  @ApiProperty({ required: false, example: 15 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
