import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1772377093497 implements MigrationInterface {
  name = 'CreateChatTables1772377093497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chatId" uuid NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d2db5b1118d92e561f5ebc1af" ON "chat_message" ("chatId") `,
    );
    await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "messages"`);
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_6d2db5b1118d92e561f5ebc1af0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD "messages" text NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d2db5b1118d92e561f5ebc1af"`,
    );
    await queryRunner.query(`DROP TABLE "chat_message"`);
  }
}
