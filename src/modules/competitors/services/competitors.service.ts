import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competitor } from '../entities/competitor.entity';

@Injectable()
export class CompetitorsService {
  constructor(
    @InjectRepository(Competitor)
    private readonly repository: Repository<Competitor>,
  ) {}

  async getAll(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { competitionRating: 'DESC' },
    });
  }

  async createMany(
    data: Array<
      Omit<Competitor, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Competitor[]> {
    return this.repository.save(data);
  }
}
