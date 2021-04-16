import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Favorite } from "./Favorite";
import { User } from "./User";

@Entity()
export class GifStory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { nullable: true })
  flagged: "adult" | "racy" | "gore" | null;

  @Column("text", { default: "untitled" })
  filename: string;

  @Column("text")
  mediaId: string;

  @Column("text", { nullable: true })
  programmingLanguageId: string | null;

  @Column("int", { default: 0 })
  numLikes: number;

  @Column("text")
  creatorId: string;

  @ManyToOne(() => User, (u) => u.textStories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creatorId" })
  creator: Promise<User>;

  @OneToMany(() => Favorite, (s) => s.gifStory)
  favorites: Promise<Favorite>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
