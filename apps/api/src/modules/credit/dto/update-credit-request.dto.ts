import { PartialType } from '@nestjs/swagger';
import { CreateCreditRequestDto } from './create-credit-request.dto';

export class UpdateCreditRequestDto extends PartialType(CreateCreditRequestDto) {}
