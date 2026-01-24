import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivationPtrojectFlag1769253446704
  implements MigrationInterface
{
  name = 'AddActivationPtrojectFlag1769253446704';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "activated" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "activated"`);
  }
}
