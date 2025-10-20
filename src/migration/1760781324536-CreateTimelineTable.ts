import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimelineTable1760781324536 implements MigrationInterface {
  name = 'CreateTimelineTable1760781324536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "timeline_point" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "projectDay" integer NOT NULL, "comment" character varying NOT NULL, "taskIds" text NOT NULL, "completed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_52a3c7fc45a49a1802c565724b3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "timeline_point"`);
  }
}
