import { mapDbError } from './db-error-mapper';

describe('mapDbError', () => {
  it('retorna null para erros sem código reconhecido', () => {
    expect(mapDbError(new Error('erro genérico'))).toBeNull();
    expect(mapDbError({})).toBeNull();
  });

  it('mapeia ER_DUP_ENTRY (violação de unicidade) para 409, extraindo o nome do campo', () => {
    const result = mapDbError({
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'maria@email.com' for key 'usuario.email'",
    });
    expect(result).not.toBeNull();
    expect(result!.getStatus()).toBe(409);
    expect(result!.getResponse()).toEqual({ error: 'Já existe um registro com esse email.' });
  });

  it('mapeia ER_DUP_ENTRY sem sqlMessage reconhecível com fallback genérico', () => {
    const result = mapDbError({ code: 'ER_DUP_ENTRY' });
    expect(result!.getResponse()).toEqual({ error: 'Já existe um registro com esse campo único.' });
  });

  it('mapeia ER_NO_REFERENCED_ROW (chave estrangeira inválida) para 400', () => {
    expect(mapDbError({ code: 'ER_NO_REFERENCED_ROW' })!.getStatus()).toBe(400);
    expect(mapDbError({ code: 'ER_NO_REFERENCED_ROW_2' })!.getStatus()).toBe(400);
  });

  it('mapeia ER_ROW_IS_REFERENCED_2 (delete bloqueado por FK) para 409', () => {
    expect(mapDbError({ code: 'ER_ROW_IS_REFERENCED_2' })!.getStatus()).toBe(409);
  });

  it('mapeia ER_BAD_NULL_ERROR para 400', () => {
    expect(mapDbError({ code: 'ER_BAD_NULL_ERROR' })!.getStatus()).toBe(400);
  });
});
