import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PhaseStatus } from '../types/entity';
import { Milestone } from '../../milestones/entities/milestone.entity';

@Entity()
export class Phase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  projectId: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true, type: 'varchar' })
  description: string;

  @Column({ nullable: true, type: 'int' })
  minDaysNeeded: number;

  @Column({ nullable: true, type: 'int' })
  maxDaysNeeded: number;

  @Column({ nullable: false })
  expertiseNeeded: string;

  @Column({ nullable: true, type: 'int' })
  timelineStartDay: number;

  @Column({ nullable: true, type: 'int' })
  timelineEndDay: number;

  @Column({ nullable: false, type: 'varchar', default: 'building' })
  status: PhaseStatus;

  @Column({
    name: 'startedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @Column({ type: 'timestamp', default: null, nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Milestone, (milestone) => milestone.phase, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  milestones: Milestone[];
}
