import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { PendingProposal } from '../types/entity';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: false })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  chat: Chat;

  @Column({ nullable: false, type: 'varchar' })
  role: 'user' | 'assistant';

  @Column({ nullable: false, type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'simple-json', default: null })
  proposals: Record<string, PendingProposal> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
