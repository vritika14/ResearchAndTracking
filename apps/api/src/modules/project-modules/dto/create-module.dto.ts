import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Draft Manuscript' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'Research Paper' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ required: false, example: 'Active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;
}
