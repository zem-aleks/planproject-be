import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../types/entity';

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

  @Column({ nullable: false, type: 'int' })
  orderIndex: number;

  @Column({ nullable: false, type: 'varchar', default: 'notStarted' })
  status: TaskStatus;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
