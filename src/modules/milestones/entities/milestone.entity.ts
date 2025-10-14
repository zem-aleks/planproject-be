import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MilestoneStatus } from '../types/entity';
import { Phase } from '../../phases/entities/phase.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: false })
  phaseId: string;

  @Index()
  @Column({ nullable: false, default: '' })
  projectId: string;

  @Index()
  @Column({ nullable: false, default: '' })
  userId: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false, type: 'varchar' })
  description: string;

  @Column({ nullable: false, type: 'varchar' })
  definitionOfDone: string;

  @Column({ nullable: false, type: 'int' })
  daysNeeded: number;

  @Column({ nullable: false, type: 'int' })
  orderIndex: number;

  @Column({ nullable: false, type: 'varchar', default: 'notStarted' })
  status: MilestoneStatus;

  @Column({
    name: 'startedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => Phase, (phase) => phase.milestones, {
    onDelete: 'CASCADE', // delete messages when their chat is deleted
    nullable: false,
  })
  phase: Phase;

  @OneToMany(() => Task, (task) => task.milestone, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  tasks: Task[];
}
