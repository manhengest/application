import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's events (calendar)" })
  @ApiResponse({ status: 200, description: 'List of user events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyEvents(@CurrentUser() user: User) {
    return this.users.getMyEvents(user);
  }
}
