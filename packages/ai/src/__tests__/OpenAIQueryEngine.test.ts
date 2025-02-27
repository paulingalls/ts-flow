import { IContainer } from "@ts-flow/core";
import { OpenAIChatEngine } from "../OpenAIChatEngine"; // Update the import path accordingly

jest.mock("openai", () => {
  class MockOpenAI {
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

describe("OpenAIChatEngine", () => {
  let openAIQueryEngine: OpenAIChatEngine;

  const mockContainer = {
    createInstance: jest.fn(),
    getNodeNames: jest.fn(),
    getInstance: jest.fn(),
    getInstances: jest.fn(),
  };

  beforeEach(() => {
    openAIQueryEngine = new OpenAIChatEngine(
      "test-id",
      mockContainer as IContainer,
      {
        systemPrompt: "system prompt with ${keyword}",
        userPrompt: "user prompt with ${keyword}",
        modelName: "test-model",
        outputProperty: "output-property",
        outputEventName: "output-event-name",
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize properly", () => {
    expect(openAIQueryEngine).toBeDefined();
    expect(openAIQueryEngine["systemPrompt"]).toEqual(
      "system prompt with ${keyword}",
    );
    expect(openAIQueryEngine["userPrompt"]).toEqual(
      "user prompt with ${keyword}",
    );
    expect(openAIQueryEngine["modelName"]).toEqual("test-model");
  });

  it("should send a query", async () => {
    const payload = {
      keyword: "value",
    };

    (
      openAIQueryEngine["openAI"].chat.completions.create as jest.Mock
    ).mockResolvedValue({
      choices: [
        {
          message: {
            role: "assistant",
            content: "response content",
            function_call: "function_call",
          },
        },
      ],
    });

    await openAIQueryEngine.execute(payload, (eventName, result) => {
      expect(eventName).toEqual("output-event-name");
      expect(result).toEqual({
        keyword: "value",
        "output-property": "response content",
      });

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        openAIQueryEngine["openAI"].chat.completions.create,
      ).toHaveBeenCalledWith({
        model: "test-model",
        messages: [
          { role: "user", content: "user prompt with value" },
          { role: "system", content: "system prompt with value" },
        ],
      });
    });
  });

  // Add more test cases as needed
});
