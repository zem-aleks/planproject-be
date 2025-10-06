import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateShapingEntity1759659806089 implements MigrationInterface {
  name = 'UpdateShapingEntity1759659806089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shaping" ADD "clientId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "shaping" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "shaping" ALTER COLUMN "projectId" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shaping" ALTER COLUMN "projectId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "shaping" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "shaping" DROP COLUMN "clientId"`);
  }
}
