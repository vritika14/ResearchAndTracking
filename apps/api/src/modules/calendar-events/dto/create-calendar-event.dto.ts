import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Length } from 'class-validator';

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'Lab equipment booking closes' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  eventDate!: string;
}
