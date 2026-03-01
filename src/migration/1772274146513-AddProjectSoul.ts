import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectSoul1772274146513 implements MigrationInterface {
  name = 'AddProjectSoul1772274146513';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" ADD "soul" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "soul"`);
  }
}
