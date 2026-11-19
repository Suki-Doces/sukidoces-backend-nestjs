import { Module } from '@nestjs/common';
import {
  GetAdminProfileUseCase,
  GetDashboardUseCase,
  UpdateAdminProfileUseCase,
} from '@application/use-cases/admin';

import { LoginUseCase } from '@application/use-cases/auth';
import { AdminSettingsController, AdminController } from '@presentation/http/controllers';

@Module({
  controllers: [AdminController, AdminSettingsController],
  providers: [LoginUseCase, GetDashboardUseCase, GetAdminProfileUseCase, UpdateAdminProfileUseCase],
})
export class AdminModule {}
