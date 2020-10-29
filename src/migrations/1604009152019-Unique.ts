import {MigrationInterface, QueryRunner} from "typeorm";

export class Unique1604009152019 implements MigrationInterface {
    name = 'Unique1604009152019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "story" ADD CONSTRAINT "UQ_30be622de69279f913ca062de3d" UNIQUE ("mediaId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "story" DROP CONSTRAINT "UQ_30be622de69279f913ca062de3d"`);
    }

}
