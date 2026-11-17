import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from '../../../application/use-cases/customers/create-customer.use-case';
import { DeleteCustomerUseCase } from '../../../application/use-cases/customers/delete-customer.use-case';
import { GetNewCustomersStatsUseCase } from '../../../application/use-cases/customers/get-new-customers-stats.use-case';
import { ListCustomersUseCase } from '../../../application/use-cases/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from '../../../application/use-cases/customers/update-customer.use-case';
import { CustomersController } from '../controllers/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [ListCustomersUseCase, GetNewCustomersStatsUseCase, CreateCustomerUseCase, UpdateCustomerUseCase, DeleteCustomerUseCase],
})
export class CustomersModule {}
