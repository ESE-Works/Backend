import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BenefitsCacheService } from './cache/benefits-cache.service';
import { BenefitsProviderService } from './benefits-provider.service';
import { FilterBenefitsDto } from './dto/filter-benefits.dto';
import { Benefit } from './interfaces/benefit.interface';

@Injectable()
export class BenefitsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly benefitsProvider: BenefitsProviderService,
    private readonly benefitsCache: BenefitsCacheService,
  ) {}

  /**
   * 외부 API(캐시 경유)에서 혜택 목록을 가져와 필터 조건에 맞는 것만 반환한다.
   * 필터의 각 조건은 값이 있을 때만 적용되며, 혜택 쪽 조건이 null이면
   * (지역/나이/소득 제한이 없는 혜택이면) 항상 매칭된 것으로 간주한다.
   *
   * @param filter region/age/incomeRange 필터 (모두 optional)
   * @returns 조건에 맞는 혜택 목록
   */
  async findAll(filter?: FilterBenefitsDto): Promise<Benefit[]> {
    const benefits = await this.benefitsCache.getOrFetch(() =>
      this.benefitsProvider.fetchAll(),
    );

    if (!filter) return benefits;
    return benefits.filter((benefit) => this.matches(benefit, filter));
  }

  /**
   * 로그인한 유저의 프로필(region/age/income_range)을 기준으로 추천 혜택을 조회한다.
   * 유저가 회원가입 추가정보를 아직 입력하지 않은 항목은 필터에서 제외된다.
   *
   * @param userId 추천 대상 유저 id
   * @returns 유저 프로필에 맞는 혜택 목록
   */
  async findRecommendedForUser(userId: string): Promise<Benefit[]> {
    const user = await this.usersService.findById(userId);
    if (!user) return [];

    return this.findAll({
      region: user.region ?? undefined,
      age: user.age ?? undefined,
      incomeRange: user.income_range ?? undefined,
    });
  }

  /**
   * @param id 조회할 혜택 id
   * @returns 해당 혜택 상세 정보
   * @throws NotFoundException 존재하지 않는 id일 때
   */
  async findOne(id: string): Promise<Benefit> {
    const benefits = await this.benefitsCache.getOrFetch(() =>
      this.benefitsProvider.fetchAll(),
    );

    const benefit = benefits.find((b) => b.id === id);
    if (!benefit) {
      throw new NotFoundException('해당 혜택을 찾을 수 없습니다.');
    }
    return benefit;
  }

  private matches(benefit: Benefit, filter: FilterBenefitsDto): boolean {
    if (filter.region && benefit.region && benefit.region !== filter.region) {
      return false;
    }

    if (filter.age !== undefined) {
      if (benefit.minAge !== null && filter.age < benefit.minAge) return false;
      if (benefit.maxAge !== null && filter.age > benefit.maxAge) return false;
    }

    if (
      filter.incomeRange &&
      benefit.incomeRange &&
      benefit.incomeRange !== filter.incomeRange
    ) {
      return false;
    }

    return true;
  }
}
