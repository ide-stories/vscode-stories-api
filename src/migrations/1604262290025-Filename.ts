import { MigrationInterface, QueryRunner } from "typeorm";

export class Filename1604262290025 implements MigrationInterface {
  name = "Filename1604262290025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "text_story" ADD "filename" text NOT NULL DEFAULT 'untitled'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "text_story" DROP COLUMN "filename"`);
  }
}
