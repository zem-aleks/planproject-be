import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimelinePointDate1772888610630 implements MigrationInterface {
  name = 'AddTimelinePointDate1772888610630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "timeline_point" ADD "date" date`);
    await queryRunner.query(
      `UPDATE "timeline_point" SET "date" = ("createdAt")::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_point" ALTER COLUMN "date" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "timeline_point" DROP COLUMN "date"`);
  }
}
