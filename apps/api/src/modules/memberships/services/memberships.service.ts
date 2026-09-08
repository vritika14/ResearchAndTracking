import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '../repositories/memberships.repository';
import {
  buildPaginationMeta,
  paginationOffset,
} from '../../../common/pagination';

@Injectable()
export class MembershipsService {
  constructor(private readonly repository: MembershipsRepository) {}

  async listMembers(tenantId: string, page: number, pageSize: number) {
    const offset = paginationOffset(page, pageSize);

    const { data, totalItems } =
      await this.repository.findActiveMembersPageByTenant(
        tenantId,
        offset,
        pageSize,
      );

    return {
      data,
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  }
}
