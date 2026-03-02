import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoulQueueApplying1772449296119 implements MigrationInterface {
  name = 'AddSoulQueueApplying1772449296119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "soulQueueApplying" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "soulQueueApplying"`,
    );
  }
}
