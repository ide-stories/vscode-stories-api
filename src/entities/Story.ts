import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  mediaId: string;

  @Column("int", { default: 0 })
  numLikes: number;

  @Column("text")
  creatorUsername: string;

  @Column("text")
  creatorAvatarUrl: string;

  @Column("text")
  flair: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;
}
