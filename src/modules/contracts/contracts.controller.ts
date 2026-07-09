import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {}
