import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnnecessaryTimelineFields1768814592929
  implements MigrationInterface
{
  name = 'RemoveUnnecessaryTimelineFields1768814592929';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" DROP COLUMN "comment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_point" DROP COLUMN "completed"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "timeline_point" ADD "completed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_point" ADD "comment" character varying NOT NULL`,
    );
  }
}
