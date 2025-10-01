import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1759261782593 implements MigrationInterface {
  name = 'CreateTasksTable1759261782593';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phaseId" character varying NOT NULL, "milestoneId" character varying NOT NULL, "projectId" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "definitionOfDone" character varying NOT NULL, "usefulResources" character varying, "examples" character varying, "orderIndex" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'notStarted', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "definitionOfDone" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "daysNeeded" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "status" SET DEFAULT 'notStarted'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "status" SET DEFAULT 'building'`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "daysNeeded" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "definitionOfDone" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "task"`);
  }
}
