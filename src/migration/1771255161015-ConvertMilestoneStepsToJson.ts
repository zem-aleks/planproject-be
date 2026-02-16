import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertMilestoneStepsToJson1771255161015
  implements MigrationInterface
{
  name = 'ConvertMilestoneStepsToJson1771255161015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert existing markdown steps to JSON array format
    // Each non-empty line becomes a step with id, title, description, completed
    await queryRunner.query(`
      UPDATE "milestone"
      SET "steps" = (
        SELECT json_agg(
          json_build_object(
            'id', gen_random_uuid()::text,
            'title', trim(regexp_replace(line, '^[-*\\d.]+[\\s)]*', '')),
            'description', '',
            'completed', false
          )
        )::text
        FROM unnest(
          string_to_array("steps", E'\\n')
        ) AS line
        WHERE trim(line) != '' AND trim(line) != '-' AND trim(line) != '*'
      )
      WHERE "steps" IS NOT NULL AND trim("steps") != ''
    `);

    // Set null or empty values to empty array
    await queryRunner.query(`
      UPDATE "milestone"
      SET "steps" = '[]'
      WHERE "steps" IS NULL OR trim("steps") = '' OR "steps" = 'null'
    `);

    // Alter column type from varchar to text, set NOT NULL and default
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" TYPE text
    `);
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" SET DEFAULT '[]'
    `);
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove NOT NULL and default
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" DROP DEFAULT
    `);

    // Convert JSON arrays back to markdown strings
    await queryRunner.query(`
      UPDATE "milestone"
      SET "steps" = (
        SELECT string_agg('- ' || (elem->>'title'), E'\\n')
        FROM json_array_elements("steps"::json) AS elem
      )
      WHERE "steps" != '[]'
    `);

    // Set empty arrays back to null
    await queryRunner.query(`
      UPDATE "milestone"
      SET "steps" = NULL
      WHERE "steps" = '[]'
    `);

    // Change column type back to varchar
    await queryRunner.query(`
      ALTER TABLE "milestone" ALTER COLUMN "steps" TYPE character varying
    `);
  }
}
