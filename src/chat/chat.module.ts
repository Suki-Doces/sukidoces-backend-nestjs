import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { CupomEntity } from '../database/entities/cupom.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProdutoEntity, CupomEntity])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
