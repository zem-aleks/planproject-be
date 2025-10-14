import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneCompletionFields1760443537340
  implements MigrationInterface
{
  name = 'AddMilestoneCompletionFields1760443537340';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "completeMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "completedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" DROP COLUMN "completedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" DROP COLUMN "completeMessage"`,
    );
  }
}
