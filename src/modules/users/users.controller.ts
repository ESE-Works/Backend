import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Post('me/profile')
  @ApiOperation({ summary: '회원가입 추가정보 등록 (region/age/income_range)' })
  completeProfile(@Request() req, @Body() dto: CompleteProfileDto) {
    return this.usersService.completeProfile(req.user.userId, dto);
  }
}
