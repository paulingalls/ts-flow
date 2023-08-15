import axios from "axios";
import { SlackYesNoQueryEngine } from "../SlackYesNoQueryEngine"; // Make sure to provide the correct path
import { IContainer, JSONObject } from "@ai-flow/core";

// Mock Axios
jest.mock("axios");

describe("SlackYesNoQueryEngine", () => {
  it("should send a query", () => {
    // Create a mock instance for Axios
    const axiosMock = axios as jest.Mocked<typeof axios>;

    // Mock the axios.post function to return a successful response
    axiosMock.post.mockImplementation(() => Promise.resolve({ status: 200 }));

    // Create a mock container instance
    const mockContainer = {
      getInstance: jest.fn().mockReturnValue({
        addPostEndpoint: jest.fn()
      }),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
      createInstance: jest.fn()
    };

    // Create an instance of SlackYesNoQueryEngine
    const engine = new SlackYesNoQueryEngine("test-id", mockContainer as IContainer, {
      userPrompt: "Test prompt",
      channel: "test-channel",
      yesOutputEventName: "yes-event",
      noOutputEventName: "no-event",
      interactiveEndpoint: "test-endpoint"
    });

    // Define the payload and complete callback
    const payload = {} as JSONObject;
    const completeCallback = jest.fn();

    // Call the sendQuery method
    engine.sendQuery(payload, completeCallback);

    // Assertions
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axiosMock.post).toHaveBeenCalledWith(
      "https://slack.com/api/chat.postMessage",
      // You can add more detailed payload assertions here if needed
      expect.objectContaining({
        token: expect.any(String) as string,
        channel: "test-channel",
        text: "Test prompt",
        blocks: expect.any(Array) as []
      })
    );
  });
});