import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationBetweenTasksAndMilestones1760215862722
  implements MigrationInterface
{
  name = 'AddRelationBetweenTasksAndMilestones1760215862722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  ALTER TABLE "task"
  ALTER COLUMN "milestoneId" TYPE uuid
  USING "milestoneId"::uuid
`);
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_0b1e6e6f89e39e84933d144890b" FOREIGN KEY ("milestoneId") REFERENCES "milestone"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_0b1e6e6f89e39e84933d144890b"`,
    );
    await queryRunner.query(`
  ALTER TABLE "task"
  ALTER COLUMN "milestoneId" SET DATA character varying
`);
  }
}
