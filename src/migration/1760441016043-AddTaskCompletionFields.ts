import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskCompletionFields1760441016043
  implements MigrationInterface
{
  name = 'AddTaskCompletionFields1760441016043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" ADD "completeMessage" text`);
    await queryRunner.query(`ALTER TABLE "task" ADD "completedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "completedAt"`);
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "completeMessage"`);
  }
}
