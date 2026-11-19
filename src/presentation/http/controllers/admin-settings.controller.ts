import {
  Body,
  Controller,
  Get,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { GetAdminProfileUseCase, UpdateAdminProfileUseCase } from '@application/use-cases/admin';

import { CurrentUser } from '@presentation/http/decorators';
import { UpdateAdminSettingsDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, multerOptions, presentAdminProfile } from '@presentation/http/support';

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
    return successResponse(
      'Profile loaded successfully',
      presentAdminProfile(await this.getProfile.execute(adminId)),
    );
  }

  @Put()
  @UseInterceptors(FileInterceptor('foto_perfil', multerOptions))
  async editProfile(
    @CurrentUser('id') adminId: number,
    @Body() dto: UpdateAdminSettingsDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    await this.updateProfile.execute({ adminId, ...dto, photo: photo?.buffer });
    return successResponse('Profile updated successfully!');
  }
}
