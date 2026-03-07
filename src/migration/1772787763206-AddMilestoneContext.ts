import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneContext1772787763206 implements MigrationInterface {
  name = 'AddMilestoneContext1772787763206';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "milestone" ADD "context" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "context"`);
  }
}
