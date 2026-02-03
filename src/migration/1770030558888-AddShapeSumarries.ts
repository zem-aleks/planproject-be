import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShapeSumarries1770030558888 implements MigrationInterface {
  name = 'AddShapeSumarries1770030558888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shaping" ADD "summaries" text NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shaping" DROP COLUMN "summaries"`);
  }
}
