import { IContainer } from '@ts-flow/core';
import {OpenAIChatEngine} from '../OpenAIChatEngine'; // Update the import path accordingly

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

describe('OpenAIChatEngine', () => {
  let openAIQueryEngine: OpenAIChatEngine;

  const mockContainer = {
    createInstance: jest.fn(),
    getInstance: jest.fn(),
    getNodeNames: jest.fn(),
    getInstances: jest.fn(),
  };

  beforeEach(() => {
    openAIQueryEngine = new OpenAIChatEngine('test-id', mockContainer as IContainer, {
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

  it('should send a query', () => {
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
    openAIQueryEngine.execute(payload, (result) => {
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

  });

  // Add more test cases as needed
});
