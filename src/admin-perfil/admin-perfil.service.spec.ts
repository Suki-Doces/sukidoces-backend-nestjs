import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AdminPerfilService } from './admin-perfil.service';
import { ADMINISTRADOR_REPOSITORY } from '../common/repositories/interfaces/administrador-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('AdminPerfilService', () => {
  let service: AdminPerfilService;
  let administradorRepository: any;

  beforeEach(async () => {
    administradorRepository = { findByIdSafe: jest.fn(), findById: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPerfilService,
        { provide: ADMINISTRADOR_REPOSITORY, useValue: administradorRepository },
        { provide: CloudinaryService, useValue: { uploadProductImage: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<AdminPerfilService>(AdminPerfilService);
  });

  it('deve exigir senha atual para trocar a senha', async () => {
    administradorRepository.findById.mockResolvedValue({ id_admin: 1, senha: 'hash' });

    await expect(
      service.updatePerfil(1, { novaSenha: 'novaSenha123' } as any),
    ).rejects.toThrow('Digite a senha atual para alterar a senha.');
  });

  it('deve lançar erro quando admin não é encontrado', async () => {
    administradorRepository.findByIdSafe.mockResolvedValue(null);
    await expect(service.getPerfil(999)).rejects.toThrow('Admin não encontrado');
  });
});
