import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Banned extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    userId: string;

    @JoinColumn({ name: "userId" })
    user: Promise<User>;

    @Column("text")
    githubId: string;
}
