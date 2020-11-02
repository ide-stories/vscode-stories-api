import {MigrationInterface, QueryRunner} from "typeorm";

export class Cascades1604279137902 implements MigrationInterface {
    name = 'Cascades1604279137902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "text_story" DROP CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_0c6cf745c30c53af97f80d48919"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`ALTER TABLE "text_story" ADD CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_0c6cf745c30c53af97f80d48919" FOREIGN KEY ("textStoryId") REFERENCES "text_story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_0c6cf745c30c53af97f80d48919"`);
        await queryRunner.query(`ALTER TABLE "text_story" DROP CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1"`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_0c6cf745c30c53af97f80d48919" FOREIGN KEY ("textStoryId") REFERENCES "text_story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "text_story" ADD CONSTRAINT "FK_060dfe83d26f3826a1d829e3ac1" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
