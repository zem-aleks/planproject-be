import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competitor } from '../entities/competitor.entity';
import { Project } from '../../plans/projects/entities/project.entity';
import { CompetitorsAiService } from './competitors-ai.service';

@Injectable()
export class CompetitorsService {
  constructor(
    @InjectRepository(Competitor)
    private readonly repository: Repository<Competitor>,
    private readonly competitorsAiService: CompetitorsAiService,
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

  async updatePartial(id: string, data: Partial<Competitor>) {
    return this.repository.update(id, data);
  }

  async generateForProject(project: Project): Promise<Competitor[]> {
    const competitorsData =
      await this.competitorsAiService.generateCompetitorsContent({ project });

    return this.createMany(
      competitorsData.map((competitorData) => ({
        ...competitorData,
        projectId: project.id,
      })),
    );
  }
}
