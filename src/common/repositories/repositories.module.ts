import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEntity } from '../../database/entities/usuario.entity';
import { AdministradorEntity } from '../../database/entities/administrador.entity';
import { ProdutoEntity } from '../../database/entities/produto.entity';
import { CategoriaEntity } from '../../database/entities/categoria.entity';
import { PedidoEntity } from '../../database/entities/pedido.entity';
import { UsuarioRepository } from './usuario.repository';
import { AdministradorRepository } from './administrador.repository';
import { ProdutoRepository } from './produto.repository';
import { CategoriaRepository } from './categoria.repository';
import { PedidoRepository } from './pedido.repository';
import { USUARIO_REPOSITORY } from './interfaces/usuario-repository.interface';
import { ADMINISTRADOR_REPOSITORY } from './interfaces/administrador-repository.interface';
import { PRODUTO_REPOSITORY } from './interfaces/produto-repository.interface';
import { CATEGORIA_REPOSITORY } from './interfaces/categoria-repository.interface';
import { PEDIDO_REPOSITORY } from './interfaces/pedido-repository.interface';

// Este módulo é o único lugar do projeto que conhece a implementação
// CONCRETA (TypeORM) por trás de cada porta. Todo o resto do código
// (services) só enxerga a interface + o token — nunca `UsuarioRepository`
// diretamente. `useClass` é quem faz o "encaixe": quando alguém pede
// USUARIO_REPOSITORY, o Nest entrega uma instância de UsuarioRepository.
//
// As classes concretas continuam exportadas por compatibilidade (alguns
// specs ainda podem querer instanciar a classe diretamente em testes de
// unidade do próprio repositório), mas todo consumo por outros módulos
// deve passar pelo token.
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioEntity,
      AdministradorEntity,
      ProdutoEntity,
      CategoriaEntity,
      PedidoEntity,
    ]),
  ],
  providers: [
    UsuarioRepository,
    AdministradorRepository,
    ProdutoRepository,
    CategoriaRepository,
    PedidoRepository,
    { provide: USUARIO_REPOSITORY, useClass: UsuarioRepository },
    { provide: ADMINISTRADOR_REPOSITORY, useClass: AdministradorRepository },
    { provide: PRODUTO_REPOSITORY, useClass: ProdutoRepository },
    { provide: CATEGORIA_REPOSITORY, useClass: CategoriaRepository },
    { provide: PEDIDO_REPOSITORY, useClass: PedidoRepository },
  ],
  exports: [
    USUARIO_REPOSITORY,
    ADMINISTRADOR_REPOSITORY,
    PRODUTO_REPOSITORY,
    CATEGORIA_REPOSITORY,
    PEDIDO_REPOSITORY,
  ],
})
export class RepositoriesModule {}
