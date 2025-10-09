import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStartingDates1759954154863 implements MigrationInterface {
  name = 'AddStartingDates1759954154863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "startedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ADD "startedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "phase" DROP COLUMN "startedAt"`);
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "startedAt"`);
  }
}
