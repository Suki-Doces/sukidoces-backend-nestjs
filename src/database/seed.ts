import { AppDataSource } from './data-source';
import { UsuarioEntity } from './entities/usuario.entity';
import { AdministradorEntity } from './entities/administrador.entity';
import { CategoriaEntity } from './entities/categoria.entity';
import { ProdutoEntity } from './entities/produto.entity';
import { FeatureFlagEntity } from './entities/feature-flag.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();

  const adminRepo = AppDataSource.getRepository(AdministradorEntity);
  const categoriaRepo = AppDataSource.getRepository(CategoriaEntity);
  const produtoRepo = AppDataSource.getRepository(ProdutoEntity);
  const flagRepo = AppDataSource.getRepository(FeatureFlagEntity);

  const senhaHash = await bcrypt.hash('senha123', 12);

  let admin = await adminRepo.findOne({ where: { email: 'admin@sukidoces.com' } });
  if (!admin) {
    admin = await adminRepo.save(
      adminRepo.create({ nome: 'Admin Suki Doces', email: 'admin@sukidoces.com', senha: senhaHash }),
    );
  }
  console.log('Admin seedado:', admin.email);

  let categoriaBolos = await categoriaRepo.findOne({ where: { nome: 'Bolos' } });
  if (!categoriaBolos) {
    categoriaBolos = await categoriaRepo.save(
      categoriaRepo.create({ nome: 'Bolos', descricao: 'Bolos artesanais' }),
    );
  }

  let categoriaDoces = await categoriaRepo.findOne({ where: { nome: 'Doces' } });
  if (!categoriaDoces) {
    categoriaDoces = await categoriaRepo.save(
      categoriaRepo.create({ nome: 'Doces', descricao: 'Doces variados' }),
    );
  }

  const produtoExistente = await produtoRepo.findOne({ where: { nome: 'Bolo de Chocolate' } });
  if (!produtoExistente) {
    await produtoRepo.save(
      produtoRepo.create({
        nome: 'Bolo de Chocolate',
        descricao: 'Bolo de chocolate com cobertura de brigadeiro',
        preco: 45.9,
        quantidade: 10,
        ativo: true,
        id_categoria: categoriaBolos.id_categoria,
      }),
    );
    await produtoRepo.save(
      produtoRepo.create({
        nome: 'Brigadeiro Gourmet (unidade)',
        descricao: 'Brigadeiro artesanal',
        preco: 4.5,
        quantidade: 100,
        ativo: true,
        id_categoria: categoriaDoces.id_categoria,
      }),
    );
  }

  await flagRepo.upsert({ chave: 'webhooks', ativo: false }, ['chave']);

  console.log('Seed concluído.');
  await AppDataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
