import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntToReal1772899030032 implements MigrationInterface {
  name = 'IntToReal1772899030032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "minDaysNeeded" TYPE real`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "maxDaysNeeded" TYPE real`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "timelineStartDay" TYPE real`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "timelineEndDay" TYPE real`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "orderIndex" TYPE real`,
    );
    await queryRunner.query(`ALTER TABLE "task" ALTER COLUMN "day" TYPE real`);
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "orderIndex" TYPE real`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "orderIndex" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "day" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "orderIndex" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "timelineEndDay" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "timelineStartDay" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "maxDaysNeeded" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "minDaysNeeded" TYPE integer`,
    );
  }
}
