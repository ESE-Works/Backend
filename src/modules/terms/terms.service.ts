import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from './entities/term.entity';
import { UserConsent } from './entities/user-consent.entity';
import { TermType } from './term-type.enum';
import { ConsentItemDto } from './dto/submit-consents.dto';

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(UserConsent)
    private readonly userConsentRepository: Repository<UserConsent>,
  ) {}

  /**
   * 각 약관 종류(TermType)별로 가장 최근 버전(effective_date 기준) 하나씩만 반환한다.
   * @returns 타입별 최신 약관 목록
   */
  async findLatestTerms(): Promise<Term[]> {
    const allTerms = await this.termRepository.find({
      order: { effective_date: 'DESC' },
    });

    const latestByType = new Map<TermType, Term>();
    for (const term of allTerms) {
      if (!latestByType.has(term.type)) {
        latestByType.set(term.type, term);
      }
    }
    return Array.from(latestByType.values());
  }

  /**
   * 유저의 약관 동의를 저장한다. 필수 약관 중 하나라도 agreed:false거나
   * 요청에 빠져 있으면 저장 없이 400을 던진다 (필수 항목은 거부할 수 없음).
   *
   * @param userId 동의하는 유저 id
   * @param items 항목별 동의 목록
   * @param ipAddress 요청자 IP (감사 기록용)
   * @returns 저장된 동의 이력
   */
  async submitConsents(
    userId: string,
    items: ConsentItemDto[],
    ipAddress: string | null,
  ): Promise<UserConsent[]> {
    const latestTerms = await this.findLatestTerms();
    const requiredTypes = latestTerms
      .filter((term) => term.is_required)
      .map((term) => term.type);

    const agreedRequiredTypes = new Set(
      items.filter((item) => item.agreed).map((item) => item.termType),
    );

    const missing = requiredTypes.filter(
      (type) => !agreedRequiredTypes.has(type),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `필수 약관에 동의해야 합니다: ${missing.join(', ')}`,
      );
    }

    const records = items.map((item) =>
      this.userConsentRepository.create({
        user_id: userId,
        term_id:
          latestTerms.find((term) => term.type === item.termType)?.id ?? '',
        term_type: item.termType,
        term_version: item.version,
        agreed: item.agreed,
        ip_address: ipAddress,
      }),
    );

    return this.userConsentRepository.save(records);
  }

  /**
   * @param userId 조회할 유저 id
   * @returns 해당 유저의 전체 동의 이력 (최신순)
   */
  async findConsentHistory(userId: string): Promise<UserConsent[]> {
    return this.userConsentRepository.find({
      where: { user_id: userId },
      order: { agreed_at: 'DESC' },
    });
  }
}
