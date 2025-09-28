import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: false, type: 'varchar', default: 'notStarted' })
  status: 'notStarted' | 'inProgress' | 'completed';

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
