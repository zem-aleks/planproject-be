import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1759779501121 implements MigrationInterface {
  name = 'CreateUsersTable1759779501121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL, "email" character varying NOT NULL, "phone" character varying, "avatarUrl" character varying, "bio" text, "firstName" character varying, "lastName" character varying, "linkedIn" character varying, "website" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "shaping" ADD "status" character varying NOT NULL DEFAULT 'started'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "clientId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "project" ADD "daysNeeded" integer`);
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "userId" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "daysNeeded"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "clientId"`);
    await queryRunner.query(`ALTER TABLE "shaping" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
