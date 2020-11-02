import {MigrationInterface, QueryRunner} from "typeorm";

export class RecordingSteps1604271193905 implements MigrationInterface {
    name = 'RecordingSteps1604271193905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "text_story" ADD "recordingSteps" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "text_story" DROP COLUMN "recordingSteps"`);
    }

}
