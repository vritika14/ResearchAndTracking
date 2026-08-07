import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'limited_member', enum: ['owner', 'limited_member'] })
  @IsIn(['owner', 'limited_member'])
  role!: string;
}
