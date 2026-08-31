import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateConferenceDto {
  @ApiProperty({ example: 'ASM' })
  @IsString()
  @Length(2, 20)
  acronym!: string;

  @ApiProperty({
    example: 'Australasian Society for Microbiology Conference 2027',
  })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ example: 'Sydney, Australia' })
  @IsString()
  @Length(2, 200)
  location!: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  submissionDue!: string;

  @ApiProperty({ example: '2027-06-04' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-06-08' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ required: false, example: 'Abstract' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  submissionType?: string;

  @ApiProperty({
    type: [String],
    description: 'Projects linked to this conference',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  projectIds!: string[];
}
