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

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description:
      '현재 로그인한 유저의 정보를 조회합니다.\n' +
      '테스트 방법: 상단 Authorize에 JWT를 넣은 뒤 바로 Try it out으로 호출하면 됩니다 (별도 파라미터 없음).',
  })
  @ApiResponse({ status: 200, description: '유저 정보 반환' })
  getMe(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Post('me/profile')
  @ApiOperation({
    summary: '회원가입 추가정보 등록 (region/age/income_range)',
    description:
      '소셜 로그인으로는 가져올 수 없는 region/age/income_range를 회원가입 추가 화면에서 입력받아 저장합니다. ' +
      '전달한 필드만 갱신되며, 나머지는 기존 값이 유지됩니다.\n' +
      '테스트 방법: 상단 Authorize에 JWT를 넣은 뒤 Try it out → body에 원하는 필드만 채워서 Execute. ' +
      '이후 GET /users/me로 값이 반영됐는지 확인하세요.',
  })
  @ApiResponse({ status: 201, description: '업데이트된 유저 정보 반환' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  completeProfile(@Request() req, @Body() dto: CompleteProfileDto) {
    return this.usersService.completeProfile(req.user.userId, dto);
  }
}
