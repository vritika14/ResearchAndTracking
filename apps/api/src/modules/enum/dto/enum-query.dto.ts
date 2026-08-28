import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EnumQueryDto {
  @ApiProperty({ example: 'project_status' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({
    description:
      "Scopes the pool to shared defaults plus this tenant's own custom additions. Omit to get defaults only.",
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
