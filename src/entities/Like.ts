import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { TextStory } from "./TextStory";
import { User } from "./User";

@Entity()
export class Like extends BaseEntity {
  @PrimaryColumn()
  textStoryId: number;

  @ManyToOne(() => TextStory, (s) => s.likes, {
    primary: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "textStoryId" })
  textStory: Promise<TextStory>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (u) => u.likes, {
    primary: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: Promise<User>;
}
