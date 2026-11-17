import { Body, Controller, Get, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { GetAdminProfileUseCase } from '../../../application/use-cases/admin/get-admin-profile.use-case';
import { UpdateAdminProfileUseCase } from '../../../application/use-cases/admin/update-admin-profile.use-case';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UpdateAdminSettingsDto } from '../dto/admin.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { multerOptions } from '../support/multer.config';
import { presentAdminProfile } from '../support/presenters';

@ApiTags('admin-settings')
@Controller('admin/configuracoes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(
    private readonly getProfile: GetAdminProfileUseCase,
    private readonly updateProfile: UpdateAdminProfileUseCase,
  ) {}

  @Get()
  async profile(@CurrentUser('id') adminId: number) {
    return successResponse('Profile loaded successfully', presentAdminProfile(await this.getProfile.execute(adminId)));
  }

  @Put()
  @UseInterceptors(FileInterceptor('foto_perfil', multerOptions))
  async editProfile(@CurrentUser('id') adminId: number, @Body() dto: UpdateAdminSettingsDto, @UploadedFile() photo?: Express.Multer.File) {
    await this.updateProfile.execute({ adminId, ...dto, photo: photo?.buffer });
    return successResponse('Profile updated successfully!');
  }
}
