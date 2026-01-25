import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMilestoneUserIdField1769350143142
  implements MigrationInterface
{
  name = 'RemoveMilestoneUserIdField1769350143142';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "userId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "userId" character varying NOT NULL DEFAULT ''`,
    );
  }
}
