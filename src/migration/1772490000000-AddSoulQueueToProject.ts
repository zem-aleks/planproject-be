import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoulQueueToProject1772490000000 implements MigrationInterface {
  name = 'AddSoulQueueToProject1772490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "soulQueue" text NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "soulQueueStartedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "soulQueueStartedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "soulQueue"`);
  }
}
