// apps/api/src/modules/module-pipeline-stages-pool/dto/update-pipeline-stage.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Length } from 'class-validator';

export class UpdateStageVisibilityDto {
  @ApiProperty({ example: 'Lit Review' })
  @IsString()
  @Length(2, 100)
  value!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  hidden!: boolean;
}
