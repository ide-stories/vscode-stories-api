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
import { Like } from "./Like";
import { User } from "./User";

@Entity()
export class TextStory extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { default: "untitled" })
  filename: string;

  @Column("text")
  text: string;

  @Column("text", { nullable: true })
  programmingLanguageId: string | null;

  @Column("int", { default: 0 })
  numLikes: number;

  @Column("text")
  creatorId: string;

  @ManyToOne(() => User, (u) => u.textStories)
  @JoinColumn({ name: "creatorId" })
  creator: Promise<User>;

  @OneToMany(() => Like, (s) => s.textStory)
  likes: Promise<Like>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
