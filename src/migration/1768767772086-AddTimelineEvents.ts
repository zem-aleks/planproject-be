import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimelineEvents1768767772086 implements MigrationInterface {
  name = 'AddTimelineEvents1768767772086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" RENAME COLUMN "milestoneIds" TO "events"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" RENAME COLUMN "events" TO "milestoneIds"`,
    );
  }
}
