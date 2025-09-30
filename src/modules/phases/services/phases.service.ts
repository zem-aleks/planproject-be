import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../entities/phase.entity';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly repository: Repository<Phase>,
  ) {}

  async create(
    data: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Phase> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Phase[]> {
    return this.repository.save(data);
  }

  async update(data: Phase): Promise<Phase> {
    return this.repository.save(data);
  }

  async getAll(projectId: string) {
    return this.repository.find({
      where: { projectId },
      order: { timelineStartDay: 'ASC' },
    });
  }

  async getOneById(phaseId: string) {
    return this.repository.findOne({ where: { id: phaseId } });
  }

  async getOneByIdOrThrow(phaseId: string) {
    const phase = await this.getOneById(phaseId);
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }
    return phase;
  }

  async softDelete(phaseId: string) {
    return this.repository.softDelete(phaseId);
  }
}
