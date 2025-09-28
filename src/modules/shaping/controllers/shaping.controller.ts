import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShapingService } from '../services/shaping.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { mapShapingToEntity } from '../mappers/mapShapingToEntity';
import { ShapingAiService } from '../services/shaping-ai.service';

@Controller('shaping')
@UseGuards(JwtAuthGuard)
export class ShapingController {
  constructor(
    private readonly shapingService: ShapingService,
    private readonly shapingAiService: ShapingAiService,
  ) {}

  @Post(':shapingId')
  async addUserMessage(
    @Body() { message }: { message: string },
    @Param('shapingId', ParseUUIDPipe) shapingId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByIdOrThrow({
      shapingId,
      userId: user.id,
    });

    const shapingWithMessage = await this.shapingService.addUserMessage({
      message,
      shaping,
    });

    const { followUpQuestion, score } =
      await this.shapingAiService.processShapingData(shapingWithMessage);

    const updatedShaping = await this.shapingService.addAssistantMessage({
      shaping: shapingWithMessage,
      message: followUpQuestion,
      score,
    });

    return mapShapingToEntity(updatedShaping);
  }

  @Get('/project/:projectId')
  async getShaping(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @AuthUser() user: User,
  ) {
    const shaping = await this.shapingService.getOneByProjectId({
      projectId,
      userId: user.id,
    });

    if (!shaping) {
      const newShaping = await this.shapingService.create({
        projectId,
        userId: user.id,
        score: 0,
        messages: [],
      });

      return mapShapingToEntity(newShaping);
    }

    return mapShapingToEntity(shaping);
  }

  @Delete(':shapingId')
  async deleteShaping(@Param('shapingId', ParseUUIDPipe) shapingId: string) {
    return this.shapingService.softDelete(shapingId);
  }
}
