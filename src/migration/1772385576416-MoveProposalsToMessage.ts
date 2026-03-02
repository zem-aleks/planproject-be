import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveProposalsToMessage1772385576416 implements MigrationInterface {
  name = 'MoveProposalsToMessage1772385576416';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat" DROP COLUMN "pendingProposals"`,
    );
    await queryRunner.query(`ALTER TABLE "chat_message" ADD "proposals" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP COLUMN "proposals"`,
    );
    await queryRunner.query(`ALTER TABLE "chat" ADD "pendingProposals" text`);
  }
}
