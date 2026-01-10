import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AuditoryAgeSegment,
  AuditoryCharacter,
  AuditorySegment,
} from '../types/entity';

@Entity()
export class Auditory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: false, type: 'simple-json' })
  ageSeparation: Array<AuditoryAgeSegment>;

  @Column({ nullable: false, type: 'simple-json' })
  mainSegments: Array<AuditorySegment>;

  @Column({ nullable: false, type: 'simple-json' })
  characters: Array<AuditoryCharacter>;

  @Column({ nullable: true, type: 'int' })
  menPercentage: number | null; // 0-100

  @Column({ nullable: true, type: 'varchar' })
  tam: string | null;

  @Column({ nullable: true, type: 'varchar' })
  sam: string | null;

  @Column({ nullable: true, type: 'varchar' })
  som: string | null;

  @Column({ nullable: true, type: 'varchar' })
  auditoryDemands: string | null;

  @Column({ nullable: true, type: 'varchar' })
  auditoryPains: string | null;

  @Column({ nullable: true, type: 'varchar' })
  differentiation: string | null;

  @Column({ nullable: true, type: 'varchar' })
  auditoryChannels: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
