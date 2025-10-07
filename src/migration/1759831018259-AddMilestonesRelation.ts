import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestonesRelation1759831018259 implements MigrationInterface {
  name = 'AddMilestonesRelation1759831018259';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "milestone"`);
    await queryRunner.query(`UPDATE "phase" SET "status" = 'building'`);
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "phaseId"`);
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "phaseId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9db259d4261b726a08031fa64" ON "milestone" ("phaseId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD CONSTRAINT "FK_e9db259d4261b726a08031fa64a" FOREIGN KEY ("phaseId") REFERENCES "phase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" DROP CONSTRAINT "FK_e9db259d4261b726a08031fa64a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9db259d4261b726a08031fa64"`,
    );
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "phaseId"`);
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "phaseId" character varying NOT NULL`,
    );
  }
}
