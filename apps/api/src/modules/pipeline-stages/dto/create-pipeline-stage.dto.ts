// apps/api/src/modules/pipeline-stages/dto/create-pipeline-stage.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Length } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty({ example: 'Peer Review' })
  @IsString()
  @Length(2, 100)
  value!: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
