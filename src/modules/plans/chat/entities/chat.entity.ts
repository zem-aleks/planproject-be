import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatContext } from '../types/entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: false })
  projectId: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: true, type: 'varchar', default: null })
  name: string | null;

  @Column({ nullable: true, type: 'simple-json', default: null })
  context: ChatContext | null;

  @OneToMany(() => ChatMessage, (message) => message.chat, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  messages: ChatMessage[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
