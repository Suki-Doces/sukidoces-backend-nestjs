import { Module } from '@nestjs/common';
import { GetAdminProfileUseCase } from '../../../application/use-cases/admin/get-admin-profile.use-case';
import { GetDashboardUseCase } from '../../../application/use-cases/admin/get-dashboard.use-case';
import { UpdateAdminProfileUseCase } from '../../../application/use-cases/admin/update-admin-profile.use-case';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
import { AdminSettingsController } from '../controllers/admin-settings.controller';
import { AdminController } from '../controllers/admin.controller';

@Module({
  controllers: [AdminController, AdminSettingsController],
  providers: [LoginUseCase, GetDashboardUseCase, GetAdminProfileUseCase, UpdateAdminProfileUseCase],
})
export class AdminModule {}
