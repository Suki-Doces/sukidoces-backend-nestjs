import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Stores the shipping part of each order (`valor_frete`). `valor_total` now includes it.
 * Existing rows get 0: they were created before shipping was charged, so their total is unchanged.
 */
export class AddOrderShipping1760000003000 implements MigrationInterface {
  name = 'AddOrderShipping1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('pedidos');
    if (orders && !orders.findColumnByName('valor_frete')) {
      await queryRunner.addColumn(
        'pedidos',
        new TableColumn({
          name: 'valor_frete',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: false,
          default: 0,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('pedidos');
    if (orders?.findColumnByName('valor_frete')) {
      await queryRunner.dropColumn('pedidos', 'valor_frete');
    }
  }
}
