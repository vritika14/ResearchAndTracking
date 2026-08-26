import { Injectable, NotFoundException } from '@nestjs/common';
import { EnumRepository } from '../repositories/enum.repository';

@Injectable()
export class EnumService {
  constructor(private readonly repository: EnumRepository) {}

  async listByCategory(category: string, tenantId?: string) {
    const results = await this.repository.findByCategory(category, tenantId);

    if (results.length === 0) {
      throw new NotFoundException(
        `No enum values found for category. Kindly recheck the category provided"${category}"`,
      );
    }
    return results;
  }
}
