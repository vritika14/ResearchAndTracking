import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EnumQueryDto } from '../dto/enum-query.dto';
import { EnumService } from '../services/enum.service';

@ApiTags('enum')
@ApiBearerAuth()
@Controller('api/v1/enum')
export class EnumController {
  constructor(private readonly enumService: EnumService) {}

  @ApiOperation({ summary: 'List dropdown values for a given category' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query() query: EnumQueryDto) {
    return this.enumService.listByCategory(query.category);
  }
}
