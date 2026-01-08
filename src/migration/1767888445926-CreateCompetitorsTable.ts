import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompetitorsTable1767888445926 implements MigrationInterface {
  name = 'CreateCompetitorsTable1767888445926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "competitor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "whyCompetitor" character varying NOT NULL, "url" character varying, "usp" character varying, "usersStats" character varying NOT NULL, "experienceToReuse" character varying NOT NULL, "competitionRating" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6149e19778629247a7a7984e163" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "competitor"`);
  }
}
