import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateAccountPreferencesDto {
  @ApiProperty({ required: false, enum: ['light', 'dark'] })
  @IsOptional()
  @IsIn(['light', 'dark'])
  appearanceTheme?: string;

  @ApiProperty({ required: false, enum: ['modern', 'minimal', 'executive'] })
  @IsOptional()
  @IsIn(['modern', 'minimal', 'executive'])
  designTheme?: string;

  @ApiProperty({
    required: false,
    enum: ['ocean', 'violet', 'emerald', 'rose'],
  })
  @IsOptional()
  @IsIn(['ocean', 'violet', 'emerald', 'rose'])
  colorTheme?: string;

  @ApiProperty({ required: false, enum: ['small', 'default', 'large'] })
  @IsOptional()
  @IsIn(['small', 'default', 'large'])
  textSize?: string;
}
