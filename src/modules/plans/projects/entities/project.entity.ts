import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectSoul, ProjectStatus, SoulOperation } from '../types/entity';

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

  @Column({ nullable: true, type: 'real' })
  daysNeeded: number | null;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  summary: string | null;

  @Column({ nullable: true, type: 'simple-json', default: null })
  soul: ProjectSoul | null;

  @Column({ type: 'simple-json', default: '[]' })
  soulQueue: SoulOperation[];

  @Column({ type: 'timestamp', nullable: true, default: null })
  soulQueueStartedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  soulQueueApplying: boolean;

  @Column({ nullable: true, type: 'varchar', default: null })
  soulQueueError: string | null;

  @Column({ nullable: true, type: 'varchar' })
  logoUrl: string | null;

  @Column({ nullable: false, type: 'varchar', default: 'shaping' })
  status: ProjectStatus;

  @Column({ nullable: false, type: 'boolean', default: false })
  activated: boolean;

  @Column({ type: 'boolean', default: false })
  competitorsUnlocked: boolean;

  @Column({ type: 'boolean', default: false })
  auditoryUnlocked: boolean;

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
