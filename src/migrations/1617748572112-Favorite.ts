import {MigrationInterface, QueryRunner} from "typeorm";

export class Favorite1617748572112 implements MigrationInterface {
    name = 'Favorite1617748572112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "favorite" ("gifStoryId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_43f32fcd289a552b04727dbe223" PRIMARY KEY ("gifStoryId", "userId"))`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "FK_71ca25fe85cc34f7e3ab66cfae7" FOREIGN KEY ("gifStoryId") REFERENCES "gif_story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "FK_83b775fdebbe24c29b2b5831f2d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "FK_83b775fdebbe24c29b2b5831f2d"`);
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "FK_71ca25fe85cc34f7e3ab66cfae7"`);
        await queryRunner.query(`DROP TABLE "favorite"`);
    }

}
