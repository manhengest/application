import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AssistantService } from './assistant.service';
import { AskAssistantDto, AskAssistantResponse } from './dto/ask-assistant.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('assistant')
@Controller('assistant')
@Throttle({ default: { ttl: 60_000, limit: 20 } })
export class AssistantController {
  constructor(private assistant: AssistantService) {}

  @Post('ask')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ask a natural-language question about events' })
  @ApiBody({ type: AskAssistantDto })
  @ApiResponse({ status: 200, description: 'Assistant answer' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async ask(
    @Body() dto: AskAssistantDto,
    @CurrentUser() user: User | null,
  ): Promise<AskAssistantResponse> {
    return this.assistant.ask(dto, user);
  }
}
