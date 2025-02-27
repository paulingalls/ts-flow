import { CronTrigger } from "../CronTrigger"; // Replace with the actual path to CronTrigger
import { EventBus, IContainer, JSONObject } from "@ts-flow/core";
import cron from "node-cron";

// Mock EventBus and cron.schedule
jest.mock("@ts-flow/core");
jest.mock("node-cron");

describe("CronTrigger", () => {
  let cronTrigger: CronTrigger;
  let mockContainer: IContainer;
  let mockConfig: JSONObject;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    // Create a mock instance of EventBus
    mockContainer = {
      getInstance: jest.fn(() => mockEventBus),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
      createInstance: jest.fn(),
    } as IContainer;

    const mockEventBus = new EventBus("mock", mockContainer, {});

    mockConfig = {
      cron: "*/5 * * * *", // Example cron expression
      outputEventName: "exampleEvent",
      triggerOnStart: "true",
      payload: { key: "value" },
    };

    // Mock the execute function
    mockExecute = jest.fn();

    // Create a new CronTrigger instance for each test
    cronTrigger = new CronTrigger("testId", mockContainer, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create an instance of CronTrigger", () => {
    expect(cronTrigger).toBeInstanceOf(CronTrigger);
  });

  it("should register a trigger callback", () => {
    cronTrigger.registerTriggerCallback(mockExecute);

    // Ensure that cron.schedule was called with the correct arguments
    expect(cron.schedule).toHaveBeenCalledWith(
      mockConfig.cron,
      expect.any(Function),
    );

    // Simulate cron job execution
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    (cron.schedule as jest.Mock).mock.calls[0][1]();

    // Ensure that the execute function was called with the expected arguments
    expect(mockExecute).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockConfig.payload,
    );
  });

  it("should trigger the event on startup if triggerOnStart is true", async () => {
    cronTrigger.registerTriggerCallback(mockExecute);

    // Ensure that eventTriggered method triggers the execute function
    await cronTrigger.eventTriggered();

    // Ensure that the execute function was called with the expected arguments
    expect(mockExecute).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockConfig.payload,
    );
  });

  it("should not trigger the event on startup if triggerOnStart is false", async () => {
    // Change the config to set triggerOnStart to false
    mockConfig.triggerOnStart = false;

    // Create a new CronTrigger instance with the updated config
    cronTrigger = new CronTrigger("testId", mockContainer, mockConfig);

    cronTrigger.registerTriggerCallback(mockExecute);

    // Ensure that eventTriggered method does not trigger the execute function
    await cronTrigger.eventTriggered();

    // Ensure that the execute function was not called
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
