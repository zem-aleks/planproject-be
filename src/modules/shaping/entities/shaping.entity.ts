import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShapeMessage } from '../types/entity';

@Entity()
export class Shaping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'varchar' })
  clientId: string;

  @Column({ nullable: true, type: 'varchar' })
  userId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  projectId: string | null;

  @Column({ nullable: false, type: 'simple-json' })
  messages: ShapeMessage[];

  @Column({ nullable: false, type: 'simple-json', default: [] })
  summaries: Array<ShapingSummary>;

  @Column({ nullable: false, default: 0 })
  score: number;

  @Column({ nullable: false, default: 'started' })
  status: 'started' | 'processing' | 'finished' | 'error';

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

export type ShapingSummary = {
  content: string;
  improvements: string;
  onMessagesCount: number;
  createdAt: Date;
};
