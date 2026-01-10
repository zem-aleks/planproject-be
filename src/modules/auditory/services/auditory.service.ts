import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditory } from '../entities/auditory.entity';

@Injectable()
export class AuditoryService {
  constructor(
    @InjectRepository(Auditory)
    private readonly repository: Repository<Auditory>,
  ) {}

  async find(projectId: string) {
    return this.repository.findOne({
      where: { projectId },
    });
  }

  async getOrCreate(projectId: string) {
    const auditory = await this.repository.findOne({
      where: { projectId },
    });

    if (auditory) {
      return auditory;
    }

    return this.repository.save({
      projectId,
      ageSeparation: [],
      mainSegments: [],
      characters: [],
    });
  }

  async update(id: string, auditory: Partial<Auditory>) {
    return this.repository.update(id, auditory);
  }
}
