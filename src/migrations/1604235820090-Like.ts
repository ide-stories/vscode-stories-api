import {MigrationInterface, QueryRunner} from "typeorm";

export class Like1604235820090 implements MigrationInterface {
    name = 'Like1604235820090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "text_story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "programmingLanguageId" text, "numLikes" integer NOT NULL DEFAULT 0, "creatorId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7043094abc4acedc8c16f7eee1b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "like" ("textStoryId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_c6b2f8cb0931bd5cf7006c9ff23" PRIMARY KEY ("textStoryId", "userId"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "flair" text`);
        await queryRunner.query(`ALTER TABLE "text_story" ADD CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_0c6cf745c30c53af97f80d48919" FOREIGN KEY ("textStoryId") REFERENCES "text_story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_0c6cf745c30c53af97f80d48919"`);
        await queryRunner.query(`ALTER TABLE "text_story" DROP CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "flair"`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`DROP TABLE "text_story"`);
    }

}
