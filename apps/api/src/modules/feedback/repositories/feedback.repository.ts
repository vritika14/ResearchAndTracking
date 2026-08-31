import { Injectable } from '@nestjs/common';
import { feedback } from '@research-tracker/migrations';
import { and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle.service';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUser(tenantId: string, userId: string) {
    return this.drizzle.db
      .select()
      .from(feedback)
      .where(and(eq(feedback.tenantId, tenantId), eq(feedback.userId, userId)))
      .orderBy(desc(feedback.createdAt));
  }

  async findByIdAndUser(tenantId: string, feedbackId: string, userId: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.id, feedbackId),
          eq(feedback.tenantId, tenantId),
          eq(feedback.userId, userId),
        ),
      );

    return row;
  }

  async create(values: {
    tenantId: string;
    userId: string;
    message: string;
    rating?: number;
  }) {
    const [row] = await this.drizzle.db
      .insert(feedback)
      .values(values)
      .returning();

    return row;
  }

  async update(
    tenantId: string,
    feedbackId: string,
    userId: string,
    values: Partial<{
      message: string;
      rating: number;
    }>,
  ) {
    const [row] = await this.drizzle.db
      .update(feedback)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(feedback.id, feedbackId),
          eq(feedback.tenantId, tenantId),
          eq(feedback.userId, userId),
        ),
      )
      .returning();

    return row;
  }

  async remove(tenantId: string, feedbackId: string, userId: string) {
    const [row] = await this.drizzle.db
      .delete(feedback)
      .where(
        and(
          eq(feedback.id, feedbackId),
          eq(feedback.tenantId, tenantId),
          eq(feedback.userId, userId),
        ),
      )
      .returning();

    return row;
  }
}
