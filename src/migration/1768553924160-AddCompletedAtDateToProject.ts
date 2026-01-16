import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompletedAtDateToProject1768553924160
  implements MigrationInterface
{
  name = 'AddCompletedAtDateToProject1768553924160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "completedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "completedAt"`);
  }
}
