import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import { ChatAssistant, ChatAssistantRequest } from '@application/ports';

@Injectable()
export class GeminiChatAssistant extends ChatAssistant {
  private readonly client: GoogleGenerativeAI | null;

  constructor(config: ConfigService) {
    super();
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  async reply(request: ChatAssistantRequest): Promise<string> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is required to use the chat assistant');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: request.systemInstruction,
    });
    const chat = model.startChat({ history: request.history as Content[] });
    const result = await chat.sendMessage(request.message);
    return result.response.text();
  }
}
