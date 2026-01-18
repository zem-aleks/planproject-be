import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditory } from '../entities/auditory.entity';
import { Project } from '../../plans/projects/entities/project.entity';
import { AuditoryAiService } from './auditory-ai.service';

@Injectable()
export class AuditoryService {
  constructor(
    @InjectRepository(Auditory)
    private readonly repository: Repository<Auditory>,
    private readonly auditoryAiService: AuditoryAiService,
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

  // TODO: should be simple save in repo
  async update(id: string, auditory: Partial<Auditory>) {
    return this.repository.update(id, auditory);
  }

  async updatePartial(id: string, auditory: Partial<Auditory>) {
    return this.repository.update(id, auditory);
  }

  async generateForProject(project: Project) {
    const auditory = await this.getOrCreate(project.id);
    const auditoryInfo = await this.auditoryAiService.generateAuditoryInfo({
      project,
    });
    await this.updatePartial(auditory.id, auditoryInfo);

    const auditoryDetails =
      await this.auditoryAiService.generateAuditoryDetails({
        project,
      });
    await this.updatePartial(auditory.id, auditoryDetails);
  }
}
