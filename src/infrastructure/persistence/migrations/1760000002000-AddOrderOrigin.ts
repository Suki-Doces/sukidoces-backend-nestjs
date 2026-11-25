import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Records which client (website or mobile app) placed each order. Existing rows stay NULL. */
export class AddOrderOrigin1760000002000 implements MigrationInterface {
  name = 'AddOrderOrigin1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('pedidos');
    if (orders && !orders.findColumnByName('origem')) {
      await queryRunner.addColumn(
        'pedidos',
        new TableColumn({ name: 'origem', type: 'varchar', length: '20', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('pedidos');
    if (orders?.findColumnByName('origem')) {
      await queryRunner.dropColumn('pedidos', 'origem');
    }
  }
}
