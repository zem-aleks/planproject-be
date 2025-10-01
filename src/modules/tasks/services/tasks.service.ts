import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async create(
    data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Task[]> {
    return this.repository.save(data);
  }

  async update(data: Task): Promise<Task> {
    return this.repository.save(data);
  }

  async getAll(milestoneId: string) {
    return this.repository.find({
      where: { milestoneId },
      order: { orderIndex: 'ASC' },
    });
  }

  async getOneById(taskId: string) {
    return this.repository.findOne({ where: { id: taskId } });
  }

  async softDelete(taskId: string) {
    return this.repository.softDelete(taskId);
  }
}
