import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1603926831459 implements MigrationInterface {
    name = 'Initial1603926831459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mediaId" text NOT NULL, "numLikes" integer NOT NULL DEFAULT 0, "creatorUsername" text NOT NULL, "creatorAvatarUrl" text NOT NULL, "flair" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "story"`);
    }

}
