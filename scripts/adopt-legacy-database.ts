import AppDataSource from '../src/infrastructure/persistence/data-source';

const initialMigrationName = 'InitialSchema1760000000000';
const initialMigrationTimestamp = 1760000000000;

const requiredColumns: Record<string, string[]> = {
  usuario: ['id_usuario', 'email'],
  pedidos: ['id_pedido', 'id_usuario', 'valor_total', 'status', 'data_pedido'],
  itens_pedido: ['id_item', 'id_pedido', 'id_produto', 'quantidade', 'preco_unitario'],
  produtos: ['id_produto', 'preco', 'quantidade'],
};

async function adoptLegacyDatabase(): Promise<void> {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    for (const [tableName, columns] of Object.entries(requiredColumns)) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        throw new Error(
          `Table ${tableName} was not found. Use migration:run for a new database instead.`,
        );
      }
      const missingColumns = columns.filter((name) => !table.findColumnByName(name));
      if (missingColumns.length > 0) {
        throw new Error(
          `Table ${tableName} is not the expected Express schema; missing columns: ${missingColumns.join(', ')}`,
        );
      }
    }

    if (await queryRunner.hasTable('migrations')) {
      const rows = (await queryRunner.query('SELECT `name` FROM `migrations`')) as {
        name: string;
      }[];
      if (rows.some((row) => row.name === initialMigrationName)) {
        console.log('The initial TypeORM migration is already recorded; no baseline was needed.');
        return;
      }
      if (rows.length > 0) {
        throw new Error(
          'The database already has a different TypeORM migration history. Review it manually before adopting the legacy schema.',
        );
      }
    } else {
      await queryRunner.query(`
        CREATE TABLE \`migrations\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`timestamp\` bigint NOT NULL,
          \`name\` varchar(255) NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
      `);
    }

    await queryRunner.query('INSERT INTO `migrations` (`timestamp`, `name`) VALUES (?, ?)', [
      initialMigrationTimestamp,
      initialMigrationName,
    ]);
    console.log(
      'Legacy schema baseline recorded. Back up the database, then run npm run migration:run.',
    );
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

adoptLegacyDatabase().catch((error: unknown) => {
  console.error('Could not adopt the legacy database:', error);
  process.exitCode = 1;
});
