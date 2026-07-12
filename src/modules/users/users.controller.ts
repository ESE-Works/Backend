import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UsersService } from './users.service';
import { USERS_SWAGGER } from './users.swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 로그인한 유저의 정보
   */
  @Get('me')
  @ApiOperation(USERS_SWAGGER.getMe)
  @ApiResponse({ status: 200, description: '유저 정보 반환' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param dto 갱신할 region/age/income_range (부분 업데이트, 전달한 필드만 반영)
   * @returns 업데이트된 유저 정보
   */
  @Post('me/profile')
  @ApiOperation(USERS_SWAGGER.completeProfile)
  @ApiResponse({ status: 201, description: '업데이트된 유저 정보 반환' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  completeProfile(@Request() req, @Body() dto: CompleteProfileDto) {
    return this.usersService.completeProfile(req.user.userId, dto);
  }
}
