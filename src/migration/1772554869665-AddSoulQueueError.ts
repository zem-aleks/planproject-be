import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoulQueueError1772554869665 implements MigrationInterface {
  name = 'AddSoulQueueError1772554869665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "soulQueueError" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "soulQueueError"`,
    );
  }
}
