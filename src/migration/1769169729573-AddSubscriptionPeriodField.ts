import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPeriodField1769169729573
  implements MigrationInterface
{
  name = 'AddSubscriptionPeriodField1769169729573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscriptionperiod_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "subscriptionPeriod" "public"."user_subscriptionperiod_enum" NOT NULL DEFAULT 'monthly'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "subscriptionPeriod"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscriptionperiod_enum"`,
    );
  }
}
