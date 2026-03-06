import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneFocused1772807754667 implements MigrationInterface {
  name = 'AddMilestoneFocused1772807754667';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone" ADD "focused" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "milestone" DROP COLUMN "focused"`);
  }
}
