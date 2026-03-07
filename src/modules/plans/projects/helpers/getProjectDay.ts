import * as dayjs from 'dayjs';
import { Project } from '../entities/project.entity';

export const getProjectDay = (project: Project): number => {
  return getProjectDayByDate(project.startedAt);
};

export const getProjectDayByDate = (startedAt: Date): number => {
  return (
    dayjs().startOf('day').diff(dayjs(startedAt).startOf('day'), 'days') + 1
  );
};
