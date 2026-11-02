import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProdutoDto } from './create-produto.dto';
import { UpdateProdutoDto } from './update-produto.dto';

const validar = async (Dto: any, plain: Record<string, any>) => {
  const instancia: any = plainToInstance(Dto, plain);
  const errors = await validate(instancia as object);
  return { errors, instancia };
};

describe('CreateProdutoDto (multipart: tudo chega como string)', () => {
  it('converte strings numéricas do multipart para number e valida', async () => {
    const { errors, instancia } = await validar(CreateProdutoDto, {
      nome: '  Bolo de Chocolate ',
      preco: '45.90',
      quantidade: '10',
      id_categoria: '2',
    });

    expect(errors).toHaveLength(0);
    expect(instancia.nome).toBe('Bolo de Chocolate');
    expect(instancia.preco).toBe(45.9);
    expect(instancia.quantidade).toBe(10);
    expect(instancia.id_categoria).toBe(2);
  });

  it('rejeita preço não numérico, zero ou negativo', async () => {
    expect((await validar(CreateProdutoDto, { nome: 'Bolo', preco: 'abc' })).errors.length).toBeGreaterThan(0);
    expect((await validar(CreateProdutoDto, { nome: 'Bolo', preco: '0' })).errors.length).toBeGreaterThan(0);
    expect((await validar(CreateProdutoDto, { nome: 'Bolo', preco: '-5' })).errors.length).toBeGreaterThan(0);
  });

  it('rejeita quantidade negativa/decimal e nome curto', async () => {
    expect((await validar(CreateProdutoDto, { nome: 'Bolo', preco: '5', quantidade: '-1' })).errors.length).toBeGreaterThan(0);
    expect((await validar(CreateProdutoDto, { nome: 'Bolo', preco: '5', quantidade: '1.5' })).errors.length).toBeGreaterThan(0);
    expect((await validar(CreateProdutoDto, { nome: 'B', preco: '5' })).errors.length).toBeGreaterThan(0);
  });

  it('remove tags HTML do nome e da descrição (@Sanitize)', async () => {
    const { instancia } = await validar(CreateProdutoDto, {
      nome: 'Bolo<script>alert(1)</script>',
      descricao: '<b>Delicioso</b>',
      preco: '10',
    });
    expect(instancia.nome).toBe('Bolo');
    expect(instancia.descricao).toBe('Delicioso');
  });
});

describe('UpdateProdutoDto (campos opcionais, mas válidos quando presentes)', () => {
  it('aceita body vazio e atualização parcial', async () => {
    expect((await validar(UpdateProdutoDto, {})).errors).toHaveLength(0);
    expect((await validar(UpdateProdutoDto, { preco: '12.5' })).errors).toHaveLength(0);
  });

  it('continua validando o que vier', async () => {
    expect((await validar(UpdateProdutoDto, { preco: '-1' })).errors.length).toBeGreaterThan(0);
  });
});
