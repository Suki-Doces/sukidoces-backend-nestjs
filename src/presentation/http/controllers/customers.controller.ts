import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../../application/use-cases/customers/create-customer.use-case';
import { DeleteCustomerUseCase } from '../../../application/use-cases/customers/delete-customer.use-case';
import { GetNewCustomersStatsUseCase } from '../../../application/use-cases/customers/get-new-customers-stats.use-case';
import { ListCustomersUseCase } from '../../../application/use-cases/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from '../../../application/use-cases/customers/update-customer.use-case';
import { CreateCustomerDto, CUSTOMER_STATUS, UpdateCustomerDto } from '../dto/customer.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { presentCustomers, presentUserProfile } from '../support/presenters';

@ApiTags('customers')
@Controller('admin/clientes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CustomersController {
  constructor(
    private readonly listCustomers: ListCustomersUseCase,
    private readonly getNewCustomersStats: GetNewCustomersStatsUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly deleteCustomer: DeleteCustomerUseCase,
  ) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const result = await this.listCustomers.execute({ page: query.page, limit: query.limit });
    return successResponse('Customers loaded successfully', presentCustomers(result));
  }

  @Get('estatisticas/novos')
  async newCustomers() {
    const { totalNew } = await this.getNewCustomersStats.execute();
    return successResponse('Statistics loaded successfully', { totalNovos: totalNew });
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.createCustomer.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      active: dto.status === CUSTOMER_STATUS.ACTIVE,
    });
    return successResponse('Customer created successfully', { cliente: presentUserProfile(customer) });
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    const customer = await this.updateCustomer.execute(id, {
      name: dto.name,
      password: dto.password,
      ...(dto.status !== undefined && { active: dto.status === CUSTOMER_STATUS.ACTIVE }),
    });
    return successResponse('Customer updated successfully', { cliente: customer ? presentUserProfile(customer) : null });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteCustomer.execute(id);
    return successResponse('Customer removed successfully');
  }
}
