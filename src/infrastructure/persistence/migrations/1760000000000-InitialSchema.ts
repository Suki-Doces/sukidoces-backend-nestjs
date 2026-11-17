import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`usuario\` (
        \`id_usuario\` int NOT NULL AUTO_INCREMENT,
        \`nome\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`senha\` varchar(255) NOT NULL,
        \`telefone\` varchar(255) NULL,
        \`cpf\` varchar(255) NULL,
        \`enderecos\` json NULL,
        \`data_nascimento\` date NULL,
        \`foto_perfil\` varchar(255) NULL,
        \`role\` varchar(255) NULL,
        \`status_id\` tinyint NULL,
        \`email_verificado\` tinyint NOT NULL DEFAULT 0,
        \`data_criacao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX \`uq_usuario_email\` (\`email\`),
        PRIMARY KEY (\`id_usuario\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`administradores\` (
        \`id_admin\` int NOT NULL AUTO_INCREMENT,
        \`nome\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`senha\` varchar(255) NOT NULL,
        \`foto_perfil\` varchar(255) NULL,
        UNIQUE INDEX \`uq_administradores_email\` (\`email\`),
        PRIMARY KEY (\`id_admin\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`categorias\` (
        \`id_categoria\` int NOT NULL AUTO_INCREMENT,
        \`nome\` varchar(255) NOT NULL,
        \`descricao\` varchar(255) NULL,
        PRIMARY KEY (\`id_categoria\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`cupons\` (
        \`id_cupom\` int NOT NULL AUTO_INCREMENT,
        \`codigo\` varchar(255) NOT NULL,
        \`tipo\` varchar(255) NOT NULL,
        \`valor\` decimal(10,2) NOT NULL,
        \`validade\` datetime NULL,
        \`ativo\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`uq_cupons_codigo\` (\`codigo\`),
        PRIMARY KEY (\`id_cupom\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`produtos\` (
        \`id_produto\` int NOT NULL AUTO_INCREMENT,
        \`nome\` varchar(255) NOT NULL,
        \`descricao\` varchar(255) NULL,
        \`preco\` decimal(10,2) NOT NULL,
        \`quantidade\` int NOT NULL DEFAULT 0,
        \`imagem\` varchar(255) NULL,
        \`ativo\` tinyint NOT NULL DEFAULT 1,
        \`id_categoria\` int NULL,
        \`data_criacao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_produtos_ativo\` (\`ativo\`),
        INDEX \`idx_produtos_categoria\` (\`id_categoria\`),
        INDEX \`idx_produtos_data_criacao\` (\`data_criacao\`),
        PRIMARY KEY (\`id_produto\`),
        CONSTRAINT \`fk_produtos_categoria\` FOREIGN KEY (\`id_categoria\`) REFERENCES \`categorias\`(\`id_categoria\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`pedidos\` (
        \`id_pedido\` int NOT NULL AUTO_INCREMENT,
        \`id_usuario\` int NOT NULL,
        \`valor_total\` decimal(10,2) NOT NULL,
        \`status\` varchar(255) NOT NULL,
        \`metodo_pagamento\` varchar(255) NULL,
        \`id_cupom\` int NULL,
        \`idempotency_key\` varchar(255) NULL,
        \`request_hash\` varchar(64) NULL,
        \`data_pedido\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_pedidos_usuario\` (\`id_usuario\`),
        INDEX \`idx_pedidos_status\` (\`status\`),
        INDEX \`idx_pedidos_data_pedido\` (\`data_pedido\`),
        UNIQUE INDEX \`uq_pedidos_user_idempotency_key\` (\`id_usuario\`, \`idempotency_key\`),
        PRIMARY KEY (\`id_pedido\`),
        CONSTRAINT \`fk_pedidos_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`fk_pedidos_cupom\` FOREIGN KEY (\`id_cupom\`) REFERENCES \`cupons\`(\`id_cupom\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`itens_pedido\` (
        \`id_item\` int NOT NULL AUTO_INCREMENT,
        \`id_pedido\` int NOT NULL,
        \`id_produto\` int NOT NULL,
        \`quantidade\` int NOT NULL,
        \`preco_unitario\` decimal(10,2) NOT NULL,
        INDEX \`idx_itens_pedido_produto\` (\`id_produto\`),
        PRIMARY KEY (\`id_item\`),
        CONSTRAINT \`fk_itens_pedido_pedido\` FOREIGN KEY (\`id_pedido\`) REFERENCES \`pedidos\`(\`id_pedido\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`fk_itens_pedido_produto\` FOREIGN KEY (\`id_produto\`) REFERENCES \`produtos\`(\`id_produto\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`carrinho_itens\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`usuario_id\` int NOT NULL,
        \`id_produto\` int NOT NULL,
        \`quantidade\` int NOT NULL,
        \`data_adicionado\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_carrinho_itens_usuario\` (\`usuario_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_carrinho_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`fk_carrinho_produto\` FOREIGN KEY (\`id_produto\`) REFERENCES \`produtos\`(\`id_produto\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`notificacoes\` (
        \`id_notificacao\` int NOT NULL AUTO_INCREMENT,
        \`id_usuario\` int NULL,
        \`id_admin\` int NULL,
        \`titulo\` varchar(255) NOT NULL,
        \`mensagem\` varchar(255) NOT NULL,
        \`tipo\` varchar(255) NOT NULL,
        \`lido\` tinyint NOT NULL DEFAULT 0,
        \`data_criacao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_notificacoes_usuario_lido\` (\`id_usuario\`, \`lido\`),
        INDEX \`idx_notificacoes_admin_lido\` (\`id_admin\`, \`lido\`),
        PRIMARY KEY (\`id_notificacao\`),
        CONSTRAINT \`fk_notificacoes_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`fk_notificacoes_admin\` FOREIGN KEY (\`id_admin\`) REFERENCES \`administradores\`(\`id_admin\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`contatoMensagens\` (
        \`id_contato\` int NOT NULL AUTO_INCREMENT,
        \`nome\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`telefone\` varchar(255) NOT NULL,
        \`assunto\` varchar(255) NOT NULL,
        \`mensagem\` varchar(255) NOT NULL,
        \`id_usuario\` int NULL,
        \`respondido\` tinyint NOT NULL DEFAULT 0,
        \`resposta\` varchar(255) NULL,
        \`data_resposta\` datetime NULL,
        \`data_criacao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_contato_mensagens_usuario\` (\`id_usuario\`),
        PRIMARY KEY (\`id_contato\`),
        CONSTRAINT \`fk_contato_mensagens_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

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

    await queryRunner.query(`
      CREATE TABLE \`featureFlags\` (
        \`chave\` varchar(255) NOT NULL,
        \`ativo\` tinyint NOT NULL DEFAULT 0,
        \`atualizado\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`chave\`)
      ) ENGINE=InnoDB
    `);

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `refresh_sessions`');
    await queryRunner.query('DROP TABLE `featureFlags`');
    await queryRunner.query('DROP TABLE `webhooks`');
    await queryRunner.query('DROP TABLE `contatoMensagens`');
    await queryRunner.query('DROP TABLE `notificacoes`');
    await queryRunner.query('DROP TABLE `carrinho_itens`');
    await queryRunner.query('DROP TABLE `itens_pedido`');
    await queryRunner.query('DROP TABLE `pedidos`');
    await queryRunner.query('DROP TABLE `produtos`');
    await queryRunner.query('DROP TABLE `cupons`');
    await queryRunner.query('DROP TABLE `categorias`');
    await queryRunner.query('DROP TABLE `administradores`');
    await queryRunner.query('DROP TABLE `usuario`');
  }
}
