import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasService } from './categorias.service';
import { CATEGORIA_REPOSITORY } from '../common/repositories/interfaces/categoria-repository.interface';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let categoriaRepository: any;

  beforeEach(async () => {
    categoriaRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriasService, { provide: CATEGORIA_REPOSITORY, useValue: categoriaRepository }],
    }).compile();

    service = module.get<CategoriasService>(CategoriasService);
  });

  it('deve listar categorias', async () => {
    categoriaRepository.findAll.mockResolvedValue([{ id_categoria: 1, nome: 'Bolos' }]);
    const result = await service.findAll();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('deve rejeitar atualização de categoria inexistente', async () => {
    categoriaRepository.findById.mockResolvedValue(null);
    await expect(service.update(999, { nome: 'X' })).rejects.toThrow('Categoria não encontrada');
  });

  it('deve atualizar categoria existente', async () => {
    categoriaRepository.findById.mockResolvedValue({ id_categoria: 1, nome: 'Bolos' });
    categoriaRepository.update.mockResolvedValue({ id_categoria: 1, nome: 'Bolos e Tortas' });

    const result = await service.update(1, { nome: 'Bolos e Tortas' });
    expect(result.success).toBe(true);
  });
});
