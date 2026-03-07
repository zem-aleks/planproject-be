import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompetitorsAuditoryUnlockedFlags1772635500090
  implements MigrationInterface
{
  name = 'AddCompetitorsAuditoryUnlockedFlags1772635500090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "competitorsUnlocked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "auditoryUnlocked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "auditoryUnlocked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "competitorsUnlocked"`,
    );
  }
}
