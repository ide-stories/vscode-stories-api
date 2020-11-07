import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { GifStory } from "./GifStory";
import { User } from "./User";

@Entity()
export class Favorite extends BaseEntity {
  @PrimaryColumn()
  gifStoryId: number;

  @ManyToOne(() => GifStory, (s) => s.favorites, {
    primary: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "gifStoryId" })
  gifStory: Promise<GifStory>;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (u) => u.favorites, {
    primary: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: Promise<User>;
}
