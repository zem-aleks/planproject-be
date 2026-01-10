import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditoryTable1767957074097 implements MigrationInterface {
  name = 'CreateAuditoryTable1767957074097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auditory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "menPercentage" integer, "ageSeparation" text NOT NULL, "mainSegments" text NOT NULL, "characters" text NOT NULL, "tam" character varying, "sam" character varying, "som" character varying, "auditoryDemands" character varying, "auditoryPains" character varying, "differentiation" character varying, "auditoryChannels" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_deea93886e1f58308f095d2a57d" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auditory"`);
  }
}
