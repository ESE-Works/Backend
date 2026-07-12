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

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 로그인한 유저의 정보
   */
  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description: `
현재 로그인한 유저의 정보를 조회합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  })
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
  @ApiOperation({
    summary: '회원가입 추가정보 등록 (region/age/income_range)',
    description: `
소셜 로그인으로는 가져올 수 없는 region/age/income_range를 회원가입 추가 화면에서 입력받아 저장합니다.
전달한 필드만 갱신되며, 나머지는 기존 값이 유지됩니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. Try it out → body에 원하는 필드만 채워서 Execute
3. 이후 \`GET /users/me\`로 값이 반영됐는지 확인
`,
  })
  @ApiResponse({ status: 201, description: '업데이트된 유저 정보 반환' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  completeProfile(@Request() req, @Body() dto: CompleteProfileDto) {
    return this.usersService.completeProfile(req.user.userId, dto);
  }
}
