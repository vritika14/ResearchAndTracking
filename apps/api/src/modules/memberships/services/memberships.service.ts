import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from '../repositories/memberships.repository';

@Injectable()
export class MembershipsService {
  constructor(private readonly repository: MembershipsRepository) {}

  async listMembers(tenantId: string) {
    return this.repository.findActiveMembersByTenant(tenantId);
  }
}
