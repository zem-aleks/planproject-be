import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { notReachable } from '../../../shared/utils/notReachable';
import { ProjectsService } from '../../plans/projects/services/projects.service';

@Injectable()
export class MembershipService {
  constructor(private readonly projectsService: ProjectsService) {}

  async canActivateNewProject(user: User) {
    switch (user.subscription) {
      case 'basic': {
        const count = await this.projectsService.activatedProjectsCount(
          user.id,
        );
        return count < 1;
      }

      case 'pro': {
        const count = await this.projectsService.activatedProjectsCount(
          user.id,
        );
        return count < 5;
      }

      case 'business':
        return true;

      default:
        return notReachable(user.subscription);
    }
  }

  async getMembershipDetails(user: User) {
    const count = await this.projectsService.activatedProjectsCount(user.id);
    switch (user.subscription) {
      case 'basic':
        return {
          type: user.subscription,
          period: user.subscriptionPeriod,
          usedProjects: count,
          totalAvailableProjects: 1,
          canActivate: 1 - count > 0,
        };

      case 'pro':
        return {
          type: user.subscription,
          period: user.subscriptionPeriod,
          usedProjects: count,
          totalAvailableProjects: 5,
          canActivate: 5 - count > 0,
        };

      case 'business':
        return {
          type: user.subscription,
          period: user.subscriptionPeriod,
          usedProjects: count,
          totalAvailableProjects: 0,
          canActivate: true,
        };

      default:
        return notReachable(user.subscription);
    }
  }
}
