import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Competitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: false, type: 'varchar' })
  title: string;

  @Column({ nullable: false, type: 'varchar' })
  description: string;

  @Column({ nullable: false, type: 'varchar' })
  whyCompetitor: string;

  @Column({ nullable: true, type: 'varchar' })
  url: string | null;

  @Column({ nullable: true, type: 'varchar' })
  usp: string | null; // unqiue selling proposition

  @Column({ nullable: false, type: 'varchar' })
  usersStats: string | null;

  @Column({ nullable: false, type: 'varchar' })
  experienceToReuse: string | null;

  @Column({ nullable: false, type: 'int' })
  competitionRating: number; // 0-100

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
