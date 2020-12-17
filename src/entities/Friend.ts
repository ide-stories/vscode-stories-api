import {
    BaseEntity,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Friend extends BaseEntity {
    @PrimaryColumn()
    userId: number;

    @ManyToOne(() => User, (s) => s.username, {
        primary: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "userId" })
    textStory: Promise<User>;

    @PrimaryColumn()
    friendsUserId: number;

    @ManyToOne(() => User, (u) => u.username, {
        primary: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "friendsUserId" })
    user: Promise<User>;
}
