import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from './usuario.service';
import { USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let usuarioRepository: any;
  let pedidoRepository: any;
  let cloudinary: any;

  beforeEach(async () => {
    usuarioRepository = { findByIdSafe: jest.fn(), findById: jest.fn(), updatePerfil: jest.fn(), updateSenha: jest.fn() };
    pedidoRepository = { findByUsuario: jest.fn() };
    cloudinary = { uploadProductImage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('4') } },
      ],
    }).compile();

    service = module.get(UsuarioService);
  });

  it('retorna o perfil quando existir', async () => {
    usuarioRepository.findByIdSafe.mockResolvedValue({ id_usuario: 1, nome: 'Maria' });
    const result = await service.getPerfil(1);
    expect(result.data.user.nome).toBe('Maria');
  });

  it('lança 404 quando o usuário não existe', async () => {
    usuarioRepository.findByIdSafe.mockResolvedValue(null);
    await expect(service.getPerfil(999)).rejects.toThrow('Usuário não encontrado');
  });

  it('atualiza o perfil enviando a foto ao Cloudinary quando há arquivo', async () => {
    cloudinary.uploadProductImage.mockResolvedValue('https://img/x.png');
    usuarioRepository.updatePerfil.mockResolvedValue({ id_usuario: 1 });

    await service.updatePerfil(1, { nome: ' Maria ' } as any, { buffer: Buffer.from('x') } as any);

    expect(usuarioRepository.updatePerfil).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nome: 'Maria', foto_perfil: 'https://img/x.png' }),
    );
  });

  it('faz o JSON.parse de enderecos vindos como string (multipart)', async () => {
    usuarioRepository.updatePerfil.mockResolvedValue({});
    await service.updatePerfil(1, { enderecos: '[{"rua":"A"}]' } as any);
    expect(usuarioRepository.updatePerfil).toHaveBeenCalledWith(1, { enderecos: [{ rua: 'A' }] });
  });

  it('troca a senha quando a senha atual confere e rejeita quando não', async () => {
    usuarioRepository.findById.mockResolvedValue({ id_usuario: 1, senha: bcrypt.hashSync('atual123', 4) });

    await service.changeSenha(1, { senhaAtual: 'atual123', novaSenha: 'nova1234' });
    expect(usuarioRepository.updateSenha).toHaveBeenCalledWith(1, expect.stringMatching(/^\$2[aby]\$/));

    await expect(service.changeSenha(1, { senhaAtual: 'errada', novaSenha: 'nova1234' })).rejects.toThrow(
      'Senha atual incorreta',
    );
  });

  it('lista os pedidos do usuário', async () => {
    pedidoRepository.findByUsuario.mockResolvedValue([{ id_pedido: 1 }]);
    const result = await service.getMeusPedidos(1);
    expect(result.data).toHaveLength(1);
  });
});
