import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeFields1769117778506 implements MigrationInterface {
  name = 'AddStripeFields1769117778506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "stripeCustomerId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "stripeSubscriptionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "stripePriceId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "subscriptionStatus" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "subscriptionPeriodEnd" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "subscriptionPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "subscriptionStatus"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "stripePriceId"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "stripeSubscriptionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "stripeCustomerId"`,
    );
  }
}
