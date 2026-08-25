// apps/api/src/modules/module-pipeline-stages/dto/update-pipeline-stage.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePipelineStageDto } from './create-pipeline-stage.dto';

export class UpdatePipelineStageDto extends PartialType(
  CreatePipelineStageDto,
) {}
