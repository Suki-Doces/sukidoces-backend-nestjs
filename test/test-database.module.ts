import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from '../src/database/entities';

// Substitui o DatabaseModule real nos testes E2E via `.overrideModule()`.
// Usa SQLite em memória (better-sqlite3) com `synchronize: true` — ao
// contrário do PrismaClient, o TypeORM não precisa baixar nenhum binário
// para se conectar a um banco, então dá pra testar contra um banco de
// dados DE VERDADE (ainda que temporário/em memória) em vez de mockar
// cada repositório manualmente.
//
// Ressalva: SQLite não é 100% idêntico ao MySQL (tipos DECIMAL/JSON têm
// afinidade diferente) — isso valida a ESTRUTURA e o COMPORTAMENTO
// RELACIONAL do schema, não substitui testar contra um MySQL real antes
// de produção.
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: Object.values(entities),
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
  ],
})
export class TestDatabaseModule {}
