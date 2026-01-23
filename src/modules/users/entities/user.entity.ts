import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SUBSCRIPTION_PERIODS,
  SUBSCRIPTION_TYPES,
  SubscriptionPeriod,
  SubscriptionType,
} from '../types/entity';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  stripeCustomerId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  stripeSubscriptionId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  stripePriceId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  subscriptionStatus: string | null;

  @Column({ nullable: true, type: 'date' })
  subscriptionPeriodEnd: Date | null;

  @Column({
    nullable: false,
    type: 'enum',
    enum: SUBSCRIPTION_TYPES,
    default: 'basic',
  })
  subscription: SubscriptionType;

  @Column({
    nullable: false,
    type: 'enum',
    enum: SUBSCRIPTION_PERIODS,
    default: 'monthly',
  })
  subscriptionPeriod: SubscriptionPeriod;

  @Column({ nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ nullable: true, type: 'varchar' })
  avatarUrl: string | null;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ nullable: true, type: 'varchar' })
  firstName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  lastName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  linkedIn: string | null;

  @Column({ nullable: true, type: 'varchar' })
  website: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
