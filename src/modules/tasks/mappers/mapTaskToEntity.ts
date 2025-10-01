import { TaskEntity } from '../types/entity';
import { Task } from '../entities/task.entity';

export const mapTaskToEntity = (task: Task): TaskEntity => {
  return {
    ...task,
  };
};
