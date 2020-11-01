import {MigrationInterface, QueryRunner} from "typeorm";

export class DisplayNameNullable1604255812965 implements MigrationInterface {
    name = 'DisplayNameNullable1604255812965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "displayName" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "displayName" SET NOT NULL`);
    }

}
