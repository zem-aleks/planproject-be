import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatNameContextProposals1772380961066
  implements MigrationInterface
{
  name = 'AddChatNameContextProposals1772380961066';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat" ADD "name" character varying`);
    await queryRunner.query(`ALTER TABLE "chat" ADD "context" text`);
    await queryRunner.query(`ALTER TABLE "chat" ADD "pendingProposals" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat" DROP COLUMN "pendingProposals"`,
    );
    await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "context"`);
    await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "name"`);
  }
}
