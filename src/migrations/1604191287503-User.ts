import {MigrationInterface, QueryRunner} from "typeorm";

export class User1604191287503 implements MigrationInterface {
    name = 'User1604191287503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "githubId" text NOT NULL, "username" text NOT NULL, "displayName" text NOT NULL, "profileUrl" text NOT NULL, "photoUrl" text NOT NULL, "githubAccessToken" text NOT NULL, "githubRefreshToken" text NOT NULL, "other" jsonb NOT NULL, "tokenVersion" integer NOT NULL DEFAULT 1, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0d84cc6a830f0e4ebbfcd6381dd" UNIQUE ("githubId"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
