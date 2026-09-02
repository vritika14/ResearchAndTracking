import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateWorkspacePreferencesDto {
  @ApiProperty({
    required: false,
    example: { order: ['summary', 'tasks'], hidden: ['conferences'] },
  })
  @IsOptional()
  @IsObject()
  dashboardLayout?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    example: { projects: ['project', 'status', 'due'] },
  })
  @IsOptional()
  @IsObject()
  tableColumns?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    example: { 'projects:all': ['Review'] },
  })
  @IsOptional()
  @IsObject()
  pipelineHiddenStages?: Record<string, unknown>;
}
