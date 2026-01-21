import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionTypeToUser1769024035032
  implements MigrationInterface
{
  name = 'AddSubscriptionTypeToUser1769024035032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_enum" AS ENUM('basic', 'pro', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "subscription" "public"."user_subscription_enum" NOT NULL DEFAULT 'basic'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "subscription"`);
    await queryRunner.query(`DROP TYPE "public"."user_subscription_enum"`);
  }
}
