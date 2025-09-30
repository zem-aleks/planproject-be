import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMilestonesTable1759174395992 implements MigrationInterface {
  name = 'CreateMilestonesTable1759174395992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "milestone" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phaseId" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying, "definitionOfDone" character varying, "daysNeeded" integer, "orderIndex" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'building', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f8372abce331f60ba7b33fe23a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "status" SET DEFAULT 'building'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "phase" ALTER COLUMN "status" SET DEFAULT 'notStarted'`,
    );
    await queryRunner.query(`DROP TABLE "milestone"`);
  }
}
