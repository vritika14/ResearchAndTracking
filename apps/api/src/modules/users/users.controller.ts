import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchUsersDto } from './dto/search-users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Search users by name or email, across all workspaces',
  })
  @ApiQuery({ name: 'q', required: true, type: String })
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(@Query() query: SearchUsersDto) {
    return this.usersService.search(query.q);
  }
}
