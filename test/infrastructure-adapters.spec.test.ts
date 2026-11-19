import { ConfigService } from '@nestjs/config';
import { GeminiChatAssistant } from '@infrastructure/external';

describe('GeminiChatAssistant configuration', () => {
  it('does not require the optional API key until chat is requested', async () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const assistant = new GeminiChatAssistant(config);

    await expect(
      assistant.reply({
        systemInstruction: 'Be helpful.',
        history: [],
        message: 'Hello',
      }),
    ).rejects.toThrow('GEMINI_API_KEY is required to use the chat assistant');
  });
});
