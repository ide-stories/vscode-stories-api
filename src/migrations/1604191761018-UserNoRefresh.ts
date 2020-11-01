import {MigrationInterface, QueryRunner} from "typeorm";

export class UserNoRefresh1604191761018 implements MigrationInterface {
    name = 'UserNoRefresh1604191761018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "githubRefreshToken"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "githubRefreshToken" text NOT NULL`);
    }

}
