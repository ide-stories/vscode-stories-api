import { MigrationInterface, QueryRunner } from "typeorm";

export class Banned1612306192571 implements MigrationInterface {
  name = "Banned1612306192571";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "banned" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" text NOT NULL, "githubId" text NOT NULL, CONSTRAINT "PK_acc9f19a159ce2536a836f51664" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `ALTER TABLE "user" ADD "isBanned" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isBanned"`);

    await queryRunner.query(`DROP TABLE "banned"`);
  }
}
