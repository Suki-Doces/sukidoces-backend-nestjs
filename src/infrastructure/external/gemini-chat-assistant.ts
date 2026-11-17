import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatAssistant, ChatAssistantRequest } from '../../application/ports/chat-assistant';

@Injectable()
export class GeminiChatAssistant extends ChatAssistant {
  private readonly client: GoogleGenerativeAI;

  constructor(config: ConfigService) {
    super();
    this.client = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY'));
  }

  async reply(request: ChatAssistantRequest): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: request.systemInstruction,
    });
    const chat = model.startChat({ history: request.history as any[] });
    const result = await chat.sendMessage(request.message);
    return result.response.text();
  }
}
