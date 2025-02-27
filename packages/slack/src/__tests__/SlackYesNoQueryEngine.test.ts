import { SlackYesNoQueryEngine } from "../SlackYesNoQueryEngine";
import { IContainer, JSONObject } from "@ts-flow/core";

describe("SlackYesNoQueryEngine", () => {
  let slackYesNoQueryEngine: SlackYesNoQueryEngine;
  let mockContainer: IContainer;
  let mockConfig: JSONObject;

  beforeEach(() => {
    mockConfig = {
      userPrompt: "Test prompt",
      channel: "test-channel",
      yesOutputEventName: "yes-event",
      noOutputEventName: "no-event",
      interactiveEndpoint: "test-endpoint",
    };

    mockContainer = {
      getInstance: jest.fn(),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
      createInstance: jest.fn().mockReturnValue({
        addListener: jest.fn(),
      }),
    };

    slackYesNoQueryEngine = new SlackYesNoQueryEngine(
      "testId",
      mockContainer,
      mockConfig,
    );
  });

  it("should create an instance of SlackYesNoQueryEngine", () => {
    expect(slackYesNoQueryEngine).toBeInstanceOf(SlackYesNoQueryEngine);
  });

  // Add more tests for other scenarios and error cases if needed
});
