import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TimelinePoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: false, type: 'int' })
  projectDay: number;

  @Column({ nullable: false, type: 'varchar' })
  comment: string;

  @Column({ nullable: false, type: 'simple-array' })
  taskIds: string[];

  @Column({ nullable: false, default: false })
  completed: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
