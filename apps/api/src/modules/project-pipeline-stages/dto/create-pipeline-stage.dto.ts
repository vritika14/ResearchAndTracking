// apps/api/src/modules/project-pipeline-stages/dto/create-pipeline-stage.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Length } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty({ example: 'Peer Review' })
  @IsString()
  @Length(2, 100)
  value!: string;

  @ApiProperty({ required: false, example: 7 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
