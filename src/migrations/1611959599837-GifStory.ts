import { MigrationInterface, QueryRunner } from "typeorm";

export class GifStory1611959599837 implements MigrationInterface {
  name = "GifStory1611959599837";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "gif_story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "flagged" text, "filename" text NOT NULL DEFAULT 'untitled', "mediaId" text NOT NULL, "programmingLanguageId" text, "numLikes" integer NOT NULL DEFAULT 0, "creatorId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9db510e005acaa0d4e8ca0bafd0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "gif_story" ADD CONSTRAINT "FK_a3e4fdf2a422a65b24361ce36d1" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "friend" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`
    );
    await queryRunner.query(
      `ALTER TABLE "friend" DROP CONSTRAINT "FK_0c6cf745c30c53af97f80d48919"`
    );
    await queryRunner.query(`DROP TABLE "friend"`);
    await queryRunner.query(`DROP TABLE "story"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gif_story" DROP CONSTRAINT "FK_a3e4fdf2a422a65b24361ce36d1"`
    );
    await queryRunner.query(`DROP TABLE "gif_story"`);
    await queryRunner.query(
      `CREATE TABLE "friend" ("userId" uuid NOT NULL, "friendsUserId" uuid NOT NULL, CONSTRAINT "PK_c6b2f8cb0931bd5cf7006c9ff24" PRIMARY KEY ("userId", "friendsUserId"))`
    );
    await queryRunner.query(
      `ALTER TABLE "friend" ADD CONSTRAINT "FK_0c6cf745c30c53af97f80d48919" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "friend" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("friendsUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `CREATE TABLE "story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mediaId" text NOT NULL, "numLikes" integer NOT NULL DEFAULT 0, "creatorUsername" text NOT NULL, "creatorAvatarUrl" text NOT NULL, "flair" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`
    );
  }
}
