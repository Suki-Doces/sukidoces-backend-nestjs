import { MigrationInterface, QueryRunner } from 'typeorm';

interface LegacyAddressRow {
  id_endereco: number;
  id_usuario: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

export class ExtendLegacyExpressSchema1760000001000 implements MigrationInterface {
  name = 'ExtendLegacyExpressSchema1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('pedidos');
    const users = await queryRunner.getTable('usuario');
    const notifications = await queryRunner.getTable('notificacoes');

    if (!orders || !users || !notifications || !(await queryRunner.hasTable('administradores'))) {
      throw new Error(
        'Expected the legacy Suki Doces tables before applying the compatibility migration',
      );
    }

    const addresses = await queryRunner.getTable('enderecos');
    if (addresses) {
      const requiredColumns = [
        'id_endereco',
        'id_usuario',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado',
      ];
      const missingColumns = requiredColumns.filter((name) => !addresses.findColumnByName(name));
      if (missingColumns.length > 0) {
        throw new Error(
          `Cannot migrate legacy addresses; missing columns: ${missingColumns.join(', ')}`,
        );
      }
    }

    if (!orders.findColumnByName('idempotency_key')) {
      await queryRunner.query('ALTER TABLE `pedidos` ADD `idempotency_key` varchar(255) NULL');
    }
    if (!orders.findColumnByName('request_hash')) {
      await queryRunner.query('ALTER TABLE `pedidos` ADD `request_hash` varchar(64) NULL');
    }

    const refreshedOrders = await queryRunner.getTable('pedidos');
    if (
      refreshedOrders &&
      !refreshedOrders.indices.some((index) => index.name === 'uq_pedidos_user_idempotency_key')
    ) {
      await queryRunner.query(
        'CREATE UNIQUE INDEX `uq_pedidos_user_idempotency_key` ON `pedidos` (`id_usuario`, `idempotency_key`)',
      );
    }

    const addEmailVerificationColumn = !users.findColumnByName('email_verificado');
    if (addEmailVerificationColumn) {
      await queryRunner.query(
        'ALTER TABLE `usuario` ADD `email_verificado` tinyint NOT NULL DEFAULT 0',
      );
      await queryRunner.query('UPDATE `usuario` SET `email_verificado` = 1');
    }
    if (!users.findColumnByName('enderecos')) {
      await queryRunner.query('ALTER TABLE `usuario` ADD `enderecos` json NULL');
    }

    if (addresses) {
      const rows = (await queryRunner.query(
        'SELECT `id_endereco`, `id_usuario`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado` FROM `enderecos` ORDER BY `id_usuario`, `id_endereco`',
      )) as LegacyAddressRow[];
      const byUser = new Map<number, LegacyAddressRow[]>();

      for (const address of rows) {
        const userAddresses = byUser.get(address.id_usuario) ?? [];
        userAddresses.push(address);
        byUser.set(address.id_usuario, userAddresses);
      }

      for (const [userId, userAddresses] of byUser) {
        await queryRunner.query(
          'UPDATE `usuario` SET `enderecos` = ? WHERE `id_usuario` = ? AND `enderecos` IS NULL',
          [JSON.stringify(userAddresses), userId],
        );
      }
    }

    if (!notifications.findColumnByName('id_admin')) {
      await queryRunner.query('ALTER TABLE `notificacoes` ADD `id_admin` int NULL');
    }

    const refreshedNotifications = await queryRunner.getTable('notificacoes');
    if (
      refreshedNotifications &&
      !refreshedNotifications.indices.some((index) => index.name === 'idx_notificacoes_admin_lido')
    ) {
      await queryRunner.query(
        'CREATE INDEX `idx_notificacoes_admin_lido` ON `notificacoes` (`id_admin`, `lido`)',
      );
    }
    if (
      refreshedNotifications &&
      !refreshedNotifications.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.includes('id_admin') &&
          foreignKey.referencedTableName === 'administradores',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `notificacoes` ADD CONSTRAINT `fk_notificacoes_admin` FOREIGN KEY (`id_admin`) REFERENCES `administradores` (`id_admin`) ON DELETE NO ACTION ON UPDATE NO ACTION',
      );
    }

    if (!(await queryRunner.hasTable('webhooks'))) {
      await queryRunner.query(`
        CREATE TABLE \`webhooks\` (
          \`id_webhook\` int NOT NULL AUTO_INCREMENT,
          \`url\` varchar(255) NOT NULL,
          \`eventos\` text NOT NULL,
          \`ativo\` tinyint NOT NULL DEFAULT 1,
          \`criado_em\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id_webhook\`)
        ) ENGINE=InnoDB
      `);
    }
    if (!(await queryRunner.hasTable('featureFlags'))) {
      await queryRunner.query(`
        CREATE TABLE \`featureFlags\` (
          \`chave\` varchar(255) NOT NULL,
          \`ativo\` tinyint NOT NULL DEFAULT 0,
          \`atualizado\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`chave\`)
        ) ENGINE=InnoDB
      `);
    }
    if (!(await queryRunner.hasTable('refresh_sessions'))) {
      await queryRunner.query(`
        CREATE TABLE \`refresh_sessions\` (
          \`token_hash\` varchar(64) NOT NULL,
          \`user_id\` int NOT NULL,
          \`role\` varchar(255) NULL,
          \`expires_at\` datetime NOT NULL,
          INDEX \`idx_refresh_sessions_expires_at\` (\`expires_at\`),
          PRIMARY KEY (\`token_hash\`)
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(): Promise<void> {
    throw new Error(
      'This compatibility migration preserves legacy data and cannot be safely reverted automatically',
    );
  }
}
