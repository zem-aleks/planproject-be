import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskDay1760039499280 implements MigrationInterface {
  name = 'AddTaskDay1760039499280';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD "day" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "day"`);
  }
}
