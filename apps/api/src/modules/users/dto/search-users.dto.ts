import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchUsersDto {
  @ApiProperty({ example: 'ann' })
  @IsString()
  @MinLength(1)
  q!: string;
}
