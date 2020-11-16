import {MigrationInterface, QueryRunner} from "typeorm";

export class Friend1604279137905 implements MigrationInterface {
    name = 'Friend1604279137905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "friend" ("userId" uuid NOT NULL, "friendsUserId" uuid NOT NULL, CONSTRAINT "PK_c6b2f8cb0931bd5cf7006c9ff24" PRIMARY KEY ("userId", "friendsUserId"))`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_0c6cf745c30c53af97f80d48919" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("friendsUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_0c6cf745c30c53af97f80d48919"`);
        await queryRunner.query(`DROP TABLE "friend"`);
    }

}