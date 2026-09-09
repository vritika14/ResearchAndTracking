// apps/api/src/modules/module-pipeline-stages-pool/dto/reorder-stages.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderStagesDto {
  @ApiProperty({
    type: [String],
    description:
      'Every pipeline stage value, in the desired order — validated against the fixed stage catalog',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  order!: string[];
}
