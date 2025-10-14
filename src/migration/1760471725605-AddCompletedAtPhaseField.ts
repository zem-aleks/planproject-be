import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompletedAtPhaseField1760471725605
  implements MigrationInterface
{
  name = 'AddCompletedAtPhaseField1760471725605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "phase" ADD "completedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "phase" DROP COLUMN "completedAt"`);
  }
}
