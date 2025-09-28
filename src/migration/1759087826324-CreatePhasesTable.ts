import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhasesTable1759087826324 implements MigrationInterface {
  name = 'CreatePhasesTable1759087826324';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "phase" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying, "minDaysNeeded" integer, "maxDaysNeeded" integer, "expertiseNeeded" character varying NOT NULL, "timelineStartDay" integer, "timelineEndDay" integer, "status" character varying NOT NULL DEFAULT 'notStarted', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_a9cac5076fb19818ed0f871bea8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "status" character varying NOT NULL DEFAULT 'shaping'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "startedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "startedAt"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TABLE "phase"`);
  }
}
