import { Body, Controller, Get, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Usuario } from '../common/decorators/usuario.decorator';
import { multerOptions } from '../common/upload/multer.config';
import { AdminPerfilService } from './admin-perfil.service';
import { UpdateAdminPerfilDto } from './dto/update-admin-perfil.dto';

@ApiTags('admin-perfil')
@Controller('admin/configuracoes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPerfilController {
  constructor(private readonly adminPerfilService: AdminPerfilService) {}

  @Get()
  getPerfil(@Usuario('id') adminId: number) {
    return this.adminPerfilService.getPerfil(adminId);
  }

  @Put()
  @UseInterceptors(FileInterceptor('foto_perfil', multerOptions))
  updatePerfil(
    @Usuario('id') adminId: number,
    @Body() body: UpdateAdminPerfilDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminPerfilService.updatePerfil(adminId, body, file);
  }
}
