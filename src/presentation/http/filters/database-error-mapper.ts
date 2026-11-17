export interface MappedError {
  status: number;
  message: string;
}

/**
 * Translates MySQL driver error codes into HTTP errors. It only inspects the
 * `code` property, so it works for TypeORM's QueryFailedError and raw mysql2
 * errors alike, without importing either.
 */
export function mapDatabaseError(error: any): MappedError | null {
  if (!error?.code || typeof error.code !== 'string') return null;

  switch (error.code) {
    case 'ER_DUP_ENTRY': {
      const match = /for key '([^']+)'/.exec(error.sqlMessage || '');
      const field = match?.[1]?.split('.').pop() || 'unique field';
      return { status: 409, message: `A record with this ${field} already exists.` };
    }
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return { status: 400, message: 'Invalid reference (foreign key).' };
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return { status: 409, message: 'Cannot remove: this record is linked to other records.' };
    case 'ER_BAD_NULL_ERROR':
      return { status: 400, message: 'Required field is missing.' };
    default:
      return null;
  }
}
