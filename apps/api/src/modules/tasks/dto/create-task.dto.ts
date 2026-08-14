import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumberString,
  Length,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Draft introduction section' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({ required: false, example: 'To_do' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'High' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  workingWith?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  estimatedHours?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
