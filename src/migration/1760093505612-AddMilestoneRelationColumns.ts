import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneRelationColumns1760093505612
  implements MigrationInterface
{
  name = 'AddMilestoneRelationColumns1760093505612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "projectId" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "userId" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edc28a2e0442554afe5eef2bdc" ON "milestone" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da2f55f0cf6617bdc6eac1ef39" ON "milestone" ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da2f55f0cf6617bdc6eac1ef39"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_edc28a2e0442554afe5eef2bdc"`,
    );
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "projectId"`);
  }
}
