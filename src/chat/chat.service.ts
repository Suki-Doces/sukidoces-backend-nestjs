import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { CupomEntity } from '../database/entities/cupom.entity';
import { ChatMessageDto } from './dto/chat-message.dto';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(ProdutoEntity)
    private readonly produtoRepo: Repository<ProdutoEntity>,
    @InjectRepository(CupomEntity)
    private readonly cupomRepo: Repository<CupomEntity>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async chatWithGemini(dto: ChatMessageDto) {
    try {
      const listaProdutos = await this.produtoRepo.find({ select: ['id_produto', 'nome', 'preco'] });

      const catalogoString = listaProdutos
        .map((p) => `- ${p.nome} (ID: ${p.id_produto}, Preço: R$ ${p.preco})`)
        .join('\n');

      const listaCupons = await this.cupomRepo.find({
        select: ['id_cupom', 'codigo', 'tipo', 'valor', 'validade', 'ativo'],
      });

      const cuponsString = listaCupons
        .map(
          (c) =>
            `- ${c.codigo} (ID: ${c.id_cupom}, Status: ${c.ativo}, Valor de desconto: ${c.valor} de ${c.tipo}), Validade: ${c.validade}`,
        )
        .join('\n');

      const systemInstruction = `Você é o SukiBot, assistente de vendas da SukiDoces.
    
    REGRA CRÍTICA E ABSOLUTA: 
    NUNCA responda o nome de um produto em negrito (ex: **Bolo**). 
    SEMPRE que mencionar um produto, você DEVE EXATAMENTE usar a sintaxe de link Markdown apontando para o ID dele.
    FORMATO OBRIGATÓRIO: [Nome do Produto](/produtos/ID)
    
    CATÁLOGO DE PRODUTOS DISPONÍVEIS:
    ${catalogoString}
    
    Responda qual cupom de desconto está disponível de acordo com a lista a seguir, os descontos podem variar caso for percentual ou valor fixo no total da compra.

    LISTA DE CUPONS DE DESCONTO DISPONÍVEIS:
    ${cuponsString}
    `;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction });
      const chat = model.startChat({ history: dto.history || [] });
      const result = await chat.sendMessage(dto.message);
      const responseText = result.response.text();

      return buildSuccessResponse('Resposta gerada com sucesso', { response: responseText });
    } catch (error) {
      this.logger.error('Erro no chat com Gemini', error?.stack);
      throw new InternalServerErrorException('Erro ao processar mensagem na IA.');
    }
  }
}
