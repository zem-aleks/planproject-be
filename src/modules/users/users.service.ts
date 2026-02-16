import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionType } from './types/entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  findOneBySubscriptionId(subscriptionId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });
  }

  findOneByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { stripeCustomerId },
    });
  }

  create(data: { email: string; id: string; subscription: SubscriptionType }) {
    return this.userRepository.save(data);
  }

  update(data: Partial<User>) {
    return this.userRepository.save(data);
  }

  updatePartial(userId: string, data: Partial<User>) {
    return this.userRepository.update(userId, data);
  }
}
