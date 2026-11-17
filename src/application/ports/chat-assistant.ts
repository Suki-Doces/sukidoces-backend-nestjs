export interface ChatAssistantRequest {
  systemInstruction: string;
  history: unknown[];
  message: string;
}

export abstract class ChatAssistant {
  abstract reply(request: ChatAssistantRequest): Promise<string>;
}
