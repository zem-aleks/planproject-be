import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TimelineEvent } from '../types/entity';

@Entity()
export class TimelinePoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: false, type: 'int' })
  projectDay: number;

  @Column({ nullable: false, type: 'date' })
  date: string;

  @Column({ nullable: false, type: 'simple-json' })
  events: TimelineEvent[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
