import { HttpException } from '@nestjs/common';

// Função pura e testável isoladamente (veja db-error-mapper.spec.ts).
// TypeORM envolve erros de query em `QueryFailedError`, que copia as
// propriedades do erro original do driver (mysql2) para si mesmo —
// incluindo `code`. Então checar `err.code === 'ER_DUP_ENTRY'` funciona
// tanto para o QueryFailedError do TypeORM quanto para um erro cru do
// mysql2.
export function mapDbError(err: any): HttpException | null {
  if (!err?.code || typeof err.code !== 'string') return null;

  switch (err.code) {
    case 'ER_DUP_ENTRY': {
      const match = /for key '([^']+)'/.exec(err.sqlMessage || '');
      const campo = match?.[1]?.split('.').pop() || 'campo único';
      return new HttpException({ error: `Já existe um registro com esse ${campo}.` }, 409);
    }
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return new HttpException({ error: 'Referência inválida (chave estrangeira).' }, 400);
    case 'ER_ROW_IS_REFERENCED_2':
    case 'ER_ROW_IS_REFERENCED':
      return new HttpException(
        { error: 'Não é possível remover: este registro está vinculado a outro(s).' },
        409,
      );
    case 'ER_BAD_NULL_ERROR':
      return new HttpException({ error: 'Campo obrigatório ausente.' }, 400);
    default:
      return null;
  }
}
