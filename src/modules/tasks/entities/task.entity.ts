import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../types/entity';
import { Milestone } from '../../milestones/entities/milestone.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  phaseId: string;

  @Column({ nullable: false })
  milestoneId: string;

  @Column({ nullable: false })
  projectId: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false, type: 'varchar' })
  description: string;

  @Column({ nullable: false, type: 'varchar' })
  definitionOfDone: string;

  @Column({ nullable: true, type: 'varchar' })
  usefulResources: string | null;

  @Column({ nullable: true, type: 'varchar' })
  examples: string | null;

  @Column({ nullable: false, type: 'int', default: 0 })
  day: number;

  @Column({ nullable: false, type: 'int' })
  orderIndex: number;

  @Column({ nullable: false, type: 'varchar', default: 'notStarted' })
  status: TaskStatus;

  @Column({ nullable: true, type: 'text', default: null })
  completeMessage: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => Milestone, (milestone) => milestone.tasks, {
    onDelete: 'CASCADE', // delete messages when their chat is deleted
    nullable: false,
  })
  @JoinColumn({ name: 'milestoneId' })
  milestone: Milestone;
}
