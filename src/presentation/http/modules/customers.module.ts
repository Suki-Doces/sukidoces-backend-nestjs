import { Module } from '@nestjs/common';
import {
  CreateCustomerUseCase,
  DeleteCustomerUseCase,
  GetNewCustomersStatsUseCase,
  ListCustomersUseCase,
  UpdateCustomerUseCase,
} from '@application/use-cases/customers';

import { CustomersController } from '@presentation/http/controllers';

@Module({
  controllers: [CustomersController],
  providers: [
    ListCustomersUseCase,
    GetNewCustomersStatsUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
  ],
})
export class CustomersModule {}
