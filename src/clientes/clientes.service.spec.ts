import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClientesService } from './clientes.service';
import { USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';

describe('ClientesService', () => {
  let service: ClientesService;
  let usuarioRepository: any;

  beforeEach(async () => {
    usuarioRepository = {
      createCliente: jest.fn(),
      updateCliente: jest.fn(),
      findClientes: jest.fn().mockResolvedValue([]),
      countClientes: jest.fn().mockResolvedValue(0),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  it('NUNCA deve incluir o campo senha na resposta ao criar cliente', async () => {
    usuarioRepository.createCliente.mockResolvedValue({
      id_usuario: 1,
      nome: 'Maria',
      email: 'maria@email.com',
    });

    const result = await service.criar({
      nome: 'Maria',
      email: 'maria@email.com',
      senha: '123456',
      status: 'ativo',
    });

    expect(result.data.cliente).not.toHaveProperty('senha');
  });

  it('deve listar clientes com paginação e estatísticas', async () => {
    usuarioRepository.findClientes.mockResolvedValue([
      { id_usuario: 1, nome: 'Maria', pedidos: [{ valor_total: 100 }], data_criacao: new Date(), status_id: true },
    ]);
    usuarioRepository.countClientes.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const result = await service.listar({ page: '1', limit: '10' });

    expect(result.data.clientes[0].valor_total).toBe(100);
    expect(result.data.pagination.total).toBe(1);
  });
});
