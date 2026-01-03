import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldsToMilestone1767474290671 implements MigrationInterface {
  name = 'AddFieldsToMilestone1767474290671';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "usefulResources" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "steps" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "steps"`);
    await queryRunner.query(
      `ALTER TABLE "milestone" DROP COLUMN "usefulResources"`,
    );
  }
}
