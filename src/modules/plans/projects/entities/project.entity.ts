import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '../types/entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'varchar' })
  userId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  clientId: string | null;

  @Column({ nullable: false, type: 'varchar' })
  shapingId: string;

  @Column({ nullable: true, type: 'int' })
  daysNeeded: number | null;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  summary: string | null;

  @Column({ nullable: true, type: 'varchar' })
  logoUrl: string | null;

  @Column({ nullable: false, type: 'varchar', default: 'shaping' })
  status: ProjectStatus;

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

  @Column({ type: 'timestamp', nullable: true, default: null })
  completedAt: Date | null;
}
