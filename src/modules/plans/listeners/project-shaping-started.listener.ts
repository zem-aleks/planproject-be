import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Project } from '../projects/entities/project.entity';
import { ProjectsService } from '../projects/services/projects.service';
import { PhasesService } from '../phases/services/phases.service';
import { notReachable } from '../../../shared/utils/notReachable';
import { ProjectsAiService } from '../projects/services/projects-ai.service';
import { SupabaseStorageService } from '../../supabase/supabase-storage.service';

@Injectable()
export class ProjectShapingStartedListener {
  constructor(
    private readonly phasesService: PhasesService,
    private readonly projectsService: ProjectsService,
    private readonly projectsAiService: ProjectsAiService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: SupabaseStorageService,
  ) {}

  @OnEvent('project.shaping.started')
  async generatePhases({ project }: { project: Project }) {
    const phases = await this.phasesService.generateForProject(project);
    const endOfTimeline = Math.max(...phases.map((p) => p.timelineEndDay), 0);
    await this.projectsService.updatePartial(project.id, {
      daysNeeded: endOfTimeline,
      status: 'analyzing',
    });
    this.eventEmitter.emit('project.analyzing.started', { project });
  }

  @OnEvent('project.shaping.started')
  async generateLogo({ project }: { project: Project }) {
    await this.projectsService.updatePartial(project.id, {
      logoUrl: 'loading',
    });

    const base64 = await this.projectsAiService.generateLogo(project);
    if (!base64) {
      await this.projectsService.updatePartial(project.id, { logoUrl: null });
      return;
    }

    const buffer = Buffer.from(base64, 'base64');
    const imageName = `${project.id}-${Math.floor(Math.random() * 10000)}.png`;
    const uploadState = await this.storageService.upload({
      bucketId: 'logo',
      contentType: 'image/png',
      name: imageName,
      fileBody: buffer,
    });

    switch (uploadState.type) {
      case 'error': {
        await this.projectsService.updatePartial(project.id, { logoUrl: null });
        return;
      }

      case 'success': {
        await this.projectsService.updatePartial(project.id, {
          logoUrl: uploadState.url,
        });
        return;
      }

      default:
        return notReachable(uploadState);
    }
  }
}
