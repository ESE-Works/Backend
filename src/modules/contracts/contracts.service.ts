import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Contract } from './entities/contract.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
  ) {}

  async create(userId: string | null): Promise<Contract> {
    const contract = this.contractsRepository.create({ user_id: userId });
    return this.contractsRepository.save(contract);
  }
}
