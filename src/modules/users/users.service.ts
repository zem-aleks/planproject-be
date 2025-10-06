import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  create(data: { email: string; id: string }) {
    return this.userRepository.save(data);
  }

  // createAdmin(email: string) {
  //   return this.userRepository.save({
  //     email: email,
  //     role: 'admin',
  //   });
  // }

  // createByEmail({ email, newsletter }: { email: string; newsletter: boolean }) {
  //   return this.userRepository.save({
  //     email,
  //     newsletter: newsletter,
  //   });
  // }

  update(data: Partial<User>) {
    return this.userRepository.save(data);
  }
}
