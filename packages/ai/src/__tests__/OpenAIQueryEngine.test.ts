import { IContainer } from '@ai-flow/core';
import {OpenAIQueryEngine} from '../OpenAIQueryEngine'; // Update the import path accordingly

jest.mock('openai', () => {
  class MockOpenAI {
    // Mock the constructor and any methods you need
    constructor() {
      // Mock constructor behavior if needed
    }

    // Mock any methods used within OpenAIQueryEngine
    chat = {
      completions: {
        create: jest.fn(),
      },
    };
  }
  return {
    OpenAI: MockOpenAI,
  };
});

describe('OpenAIQueryEngine', () => {
  let openAIQueryEngine: OpenAIQueryEngine;

  const mockContainer = {
    createInstance: jest.fn(),
    getInstance: jest.fn(),
    getNodeNames: jest.fn(),
    getInstances: jest.fn(),
  };

  beforeEach(() => {
    openAIQueryEngine = new OpenAIQueryEngine('test-id', mockContainer as IContainer, {
      systemPrompt: 'system prompt with ${keyword}',
      userPrompt: 'user prompt with ${keyword}',
      modelName: 'test-model',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize properly', () => {
    expect(openAIQueryEngine).toBeDefined();
    expect(openAIQueryEngine['systemPrompt']).toEqual('system prompt with ${keyword}');
    expect(openAIQueryEngine['userPrompt']).toEqual('user prompt with ${keyword}');
    expect(openAIQueryEngine['modelName']).toEqual('test-model');
  });

  it('should send a query', async () => {
    const payload = {
      keyword: 'value',
    };

    (openAIQueryEngine['openAI']!.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'response content',
            function_call: 'function_call',
          },
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await openAIQueryEngine.sendQuery(payload);

    expect(result).toEqual({
      role: 'assistant',
      content: 'response content',
      function_call: 'function_call',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(openAIQueryEngine['openAI']!.chat.completions.create).toHaveBeenCalledWith({
      model: 'test-model',
      messages: [
        { role: 'user', content: 'user prompt with value' },
        { role: 'system', content: 'system prompt with value' },
      ],
    });
  });

  it('should handle error when sending a query', async () => {
    (openAIQueryEngine['openAI']!.chat.completions.create as jest.Mock).mockRejectedValue(new Error('Test error'));

    await expect(openAIQueryEngine.sendQuery({})).rejects.toThrowError('Test error');

  });

  // Add more test cases as needed
});
