import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneFieldToTimeline1767612818889
  implements MigrationInterface
{
  name = 'AddMilestoneFieldToTimeline1767612818889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" RENAME COLUMN "taskIds" TO "milestoneIds"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" RENAME COLUMN "milestoneIds" TO "taskIds"`,
    );
  }
}
