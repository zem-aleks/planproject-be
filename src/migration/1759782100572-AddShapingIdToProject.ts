import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShapingIdToProject1759782100572 implements MigrationInterface {
  name = 'AddShapingIdToProject1759782100572';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "shapingId" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "shapingId"`);
  }
}
