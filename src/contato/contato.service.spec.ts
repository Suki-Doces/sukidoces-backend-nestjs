import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContatoService } from './contato.service';
import { ContatoMensagemEntity } from '../database/entities/contato-mensagem.entity';

describe('ContatoService', () => {
  let service: ContatoService;
  let repo: any;

  beforeEach(async () => {
    repo = { create: jest.fn((data) => data), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContatoService, { provide: getRepositoryToken(ContatoMensagemEntity), useValue: repo }],
    }).compile();

    service = module.get<ContatoService>(ContatoService);
  });

  it('deve associar id_usuario quando quem envia é um cliente logado', async () => {
    repo.save.mockResolvedValue({ id_contato: 1 });

    await service.criar(
      { nome: 'Maria', email: 'maria@email.com', telefone: '11999999999', assunto: 'Dúvida', mensagem: 'Olá, tenho uma dúvida' },
      { id: 5, email: 'maria@email.com', role: 'cliente' },
    );

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id_usuario: 5 }));
  });

  it('NÃO deve associar id_usuario quando quem envia é um admin', async () => {
    repo.save.mockResolvedValue({ id_contato: 1 });

    await service.criar(
      { nome: 'Admin', email: 'admin@email.com', telefone: '11999999999', assunto: 'Teste', mensagem: 'Mensagem de teste' },
      { id: 1, email: 'admin@email.com', role: 'admin' },
    );

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id_usuario: undefined }));
  });

  it('deve rejeitar histórico para visitante não autenticado', async () => {
    await expect(service.meuHistorico(undefined)).rejects.toThrow('Acesso negado.');
  });

  it('deve rejeitar responder mensagem inexistente com 404', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.responder('999', 'Resposta de teste')).rejects.toThrow('Mensagem não encontrada.');
  });
});
