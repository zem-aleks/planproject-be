import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectSummaryColumn1759133587611
  implements MigrationInterface
{
  name = 'AddProjectSummaryColumn1759133587611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "summary" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "summary"`);
  }
}
