import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'Dr Avery Morgan' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  displayName?: string;

  @ApiProperty({ required: false, example: 'Research Fellow' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiProperty({ required: false, example: 'University of Sydney' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiProperty({ required: false, example: 'School of Medical Sciences' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  department?: string;

  @ApiProperty({ required: false, example: '+61 400 000 000' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({
    required: false,
    example: 'Clinical trials, biomarkers, implementation science',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  researchInterests?: string;
}
