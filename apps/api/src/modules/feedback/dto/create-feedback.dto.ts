import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    example:
      'The project dashboard is easy to use, but loading is sometimes slow.',
  })
  @IsString()
  @Length(2, 2000)
  message!: string;

  @ApiProperty({
    required: false,
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
