import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Contract } from './entities/contract.entity';
import { Repository } from 'typeorm';
import { ContractsAnalysisService } from './analysis/contracts-analysis.service';
import { ContractAnalysisResult, InputSource } from './analysis/analysis.types';
import { SAMPLE_ANALYSIS_RESULT } from './analysis/sample-analysis.const';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    private readonly analysisService: ContractsAnalysisService,
  ) {}

  async create(userId: string | null): Promise<Contract> {
    const contract = this.contractsRepository.create({ user_id: userId });
    return this.contractsRepository.save(contract);
  }

  /**
   * 계약서 전체 텍스트 또는 특약 조항을 분석하고, 원문/결과를 함께 저장한다.
   * 분석이 실패하면 status를 FAILED로 남기고 예외를 그대로 던진다.
   *
   * @param userId 로그인한 유저 id (비로그인 사용은 null)
   * @param text 계약서 원문 또는 특약 조항
   * @param inputSource 입력 방식 (text_paste | text_special_terms)
   * @returns 저장된 Contract 레코드 (analysis_result 포함)
   */
  async analyzeAndSave(
    userId: string | null,
    text: string,
    inputSource: InputSource,
  ): Promise<Contract> {
    const contract = this.contractsRepository.create({
      user_id: userId,
      original_text: text,
      input_source: inputSource,
      status: 'ANALYZING',
    });
    await this.contractsRepository.save(contract);

    try {
      const result = await this.analysisService.analyze([text], inputSource);
      contract.analysis_result = result;
      contract.status = 'COMPLETED';
      return this.contractsRepository.save(contract);
    } catch (error) {
      contract.status = 'FAILED';
      await this.contractsRepository.save(contract);
      throw error;
    }
  }

  /**
   * 계약서 사진을 분석하고 결과를 저장한다. 이미지 자체는 저장하지 않는다
   * (분석 요청 중에만 메모리에 존재하고 응답 후 버려짐).
   *
   * @param userId 로그인한 유저 id
   * @param imageBuffer 업로드된 이미지 파일 버퍼
   * @param mimeType 이미지 mime 타입
   * @param inputSource 입력 방식 (image_camera | image_gallery | image_file)
   */
  async analyzeImageAndSave(
    userId: string,
    imageBuffer: Buffer,
    mimeType: string,
    inputSource: InputSource,
  ): Promise<Contract> {
    const contract = this.contractsRepository.create({
      user_id: userId,
      original_text: null,
      input_source: inputSource,
      status: 'ANALYZING',
    });
    await this.contractsRepository.save(contract);

    try {
      const result = await this.analysisService.analyzeImage(
        imageBuffer.toString('base64'),
        mimeType,
        inputSource,
      );
      contract.analysis_result = result;
      contract.status = 'COMPLETED';
      return this.contractsRepository.save(contract);
    } catch (error) {
      contract.status = 'FAILED';
      await this.contractsRepository.save(contract);
      throw error;
    }
  }

  /**
   * @returns 캐싱된 샘플 분석 결과 (GPT 호출 없음)
   */
  getSampleAnalysis(): ContractAnalysisResult {
    return SAMPLE_ANALYSIS_RESULT;
  }

  /**
   * @param id 조회할 계약 id
   * @param userId 요청한 유저 id (본인 소유가 아니면 404)
   */
  async findByIdForUser(id: string, userId: string): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!contract) {
      throw new NotFoundException('계약 분석 결과를 찾을 수 없습니다.');
    }
    return contract;
  }

  /**
   * @param userId 조회할 유저 id
   * @returns 해당 유저의 계약 분석 이력 (최신순)
   */
  async findAllForUser(userId: string): Promise<Contract[]> {
    return this.contractsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }
}
