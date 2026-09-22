import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IAdministradorRepository, ADMINISTRADOR_REPOSITORY } from '../common/repositories/interfaces/administrador-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateAdminPerfilDto } from './dto/update-admin-perfil.dto';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class AdminPerfilService {
  private readonly saltRounds: number;

  constructor(
    @Inject(ADMINISTRADOR_REPOSITORY) private readonly administradorRepository: IAdministradorRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async getPerfil(adminId: number) {
    try {
      const admin = await this.administradorRepository.findByIdSafe(adminId);
      if (!admin) {
        throw new NotFoundException('Admin não encontrado');
      }
      return buildSuccessResponse('Perfil carregado com sucesso', admin);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar dados do administrador');
    }
  }

  async updatePerfil(adminId: number, dto: UpdateAdminPerfilDto, file?: Express.Multer.File) {
    try {
      const { nome, email, senhaAtual, novaSenha } = dto;

      const adminAtual = await this.administradorRepository.findById(adminId);
      if (!adminAtual) {
        throw new NotFoundException('Admin não encontrado');
      }

      const dadosParaAtualizar: Record<string, any> = {
        ...(nome !== undefined && { nome }),
        ...(email !== undefined && { email }),
      };

      if (file) {
        const fotoUrl = await this.cloudinary.uploadProductImage(file.buffer);
        if (fotoUrl) {
          dadosParaAtualizar.foto_perfil = fotoUrl;
        }
      }

      if (novaSenha && novaSenha.trim() !== '') {
        if (!senhaAtual) {
          throw new HttpException('Digite a senha atual para alterar a senha.', 400);
        }

        const senhaValida = await bcrypt.compare(senhaAtual, adminAtual.senha);
        if (!senhaValida) {
          throw new HttpException('A senha atual está incorreta.', 401);
        }

        dadosParaAtualizar.senha = await bcrypt.hash(novaSenha, this.saltRounds);
      }

      await this.administradorRepository.update(adminId, dadosParaAtualizar);
      return buildSuccessResponse('Perfil atualizado com sucesso!');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar perfil');
    }
  }
}
