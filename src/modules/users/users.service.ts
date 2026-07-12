import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 소셜 로그인 제공자 + 제공자 쪽 유저 id로 기존 가입 유저를 조회한다.
   *
   * @param provider 소셜 로그인 제공자 ('kakao' | 'google')
   * @param providerId 제공자 쪽 고유 유저 식별자
   * @returns 일치하는 유저, 없으면 null
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, provider_id: providerId },
    });
  }

  /**
   * @param id 유저 uuid
   * @returns 일치하는 유저, 없으면 null
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * @param data 생성할 유저 필드 (provider, provider_id, nickname 등)
   * @returns 생성된 유저
   */
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  /**
   * 회원가입 추가정보(region/age/income_range)를 부분 업데이트한다.
   * dto에 담긴 필드만 덮어쓰고 나머지 기존 값은 유지한다.
   *
   * @param userId 업데이트할 유저 id
   * @param dto 갱신할 필드만 담긴 부분 프로필 정보
   * @returns 업데이트된 유저
   * @throws NotFoundException 유저가 존재하지 않을 때
   */
  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }
}
