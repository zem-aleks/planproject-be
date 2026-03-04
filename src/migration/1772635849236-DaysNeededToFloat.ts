import { MigrationInterface, QueryRunner } from 'typeorm';

export class DaysNeededToFloat1772635849236 implements MigrationInterface {
  name = 'DaysNeededToFloat1772635849236';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "daysNeeded" TYPE real`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "daysNeeded" TYPE real`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "daysNeeded" TYPE integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "daysNeeded" TYPE integer`,
    );
  }
}
