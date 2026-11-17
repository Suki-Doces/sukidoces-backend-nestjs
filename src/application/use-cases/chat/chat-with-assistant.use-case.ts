import { Injectable } from '@nestjs/common';
import { CouponRepository, ProductRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';
import { AppLogger, ChatAssistant } from '../../ports';

export interface ChatInput {
  message: string;
  history?: unknown[];
}

@Injectable()
export class ChatWithAssistantUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly coupons: CouponRepository,
    private readonly assistant: ChatAssistant,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: ChatInput): Promise<string> {
    try {
      const products = await this.products.findAllBasicInfo();
      const catalog = products.map((p) => `- ${p.name} (ID: ${p.id}, Price: R$ ${p.price})`).join('\n');

      const coupons = await this.coupons.findAll();
      const couponList = coupons
        .map((c) => `- ${c.code} (ID: ${c.id}, Active: ${c.active}, Discount value: ${c.value} of type ${c.type}), Expires: ${c.expiresAt}`)
        .join('\n');

      const systemInstruction = `You are SukiBot, the sales assistant of Suki Doces.
Reply in the language the customer writes in (Brazilian Portuguese by default).

CRITICAL AND ABSOLUTE RULE:
NEVER write a product name in bold (e.g. **Cake**).
ALWAYS mention a product with a Markdown link pointing to its ID.
MANDATORY FORMAT: [Product Name](/produtos/ID)

AVAILABLE PRODUCT CATALOG:
${catalog}

When asked about discounts, answer which coupon is available according to the list below.
Discounts may be a percentage or a fixed amount applied to the order total.

AVAILABLE DISCOUNT COUPONS:
${couponList}
`;

      return await this.assistant.reply({ systemInstruction, history: input.history || [], message: input.message });
    } catch (error) {
      this.logger.error('Chat assistant failure', error);
      throw new InternalError('Error processing the message with the AI.');
    }
  }
}
