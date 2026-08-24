// apps/api/src/modules/project-pipeline-stages/dto/update-pipeline-stage.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePipelineStageDto } from './create-pipeline-stage.dto';

export class UpdatePipelineStageDto extends PartialType(CreatePipelineStageDto) {}
