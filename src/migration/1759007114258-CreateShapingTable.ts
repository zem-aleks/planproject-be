import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShapingTable1759007114258 implements MigrationInterface {
  name = 'CreateShapingTable1759007114258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "shaping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "projectId" character varying NOT NULL, "messages" text NOT NULL, "score" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_275bf04461cdc42b272d6576a5e" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "shaping"`);
  }
}
