import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateAnalyticsEventDto {
  @ApiProperty({
    example: 'project_created',
    description:
      'A short, snake_case event name (e.g. "page_view", "task_completed").',
  })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ required: false, example: '/projects' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @ApiProperty({
    required: false,
    description: 'Small, flat set of extra properties describing the event.',
    example: { projectId: 'a1b2c3' },
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, string | number | boolean | null>;
}
