import { AggregatorNode } from "../coreNodes";
import { IContainer } from "../Container";
import { EventBus } from "../coreNodes";

jest.mock("../coreNodes/EventBus");

describe("AggregatorNode", () => {
  let aggregatorNode: AggregatorNode;
  let mockEventBus: jest.Mocked<EventBus>;
  const mockContainer: IContainer = {
    getInstance: jest.fn(),
    getInstances: jest.fn(),
    getNodeNames: jest.fn(),
    createInstance: jest.fn(),
  };

  beforeEach(() => {
    mockEventBus = {
      sendEvent: jest.fn(() => {}),
      addListener: jest.fn(() => {}),
    } as unknown as jest.Mocked<EventBus>;
    (mockContainer.getInstance as jest.Mock).mockReturnValue(mockEventBus);
  });

  describe("constructor", () => {
    it("should throw error if inputEventName or outputEventName is missing", () => {
      expect(() => {
        new AggregatorNode("test-id", mockContainer, {
          inputEventName: "test-input"
        });
      }).toThrow("inputEventName and outputEventName are required for AggregatorNode");

      expect(() => {
        new AggregatorNode("test-id", mockContainer, {
          outputEventName: "test-output"
        });
      }).toThrow("inputEventName and outputEventName are required for AggregatorNode");
    });

    it("should initialize with default requiredEvents of 1", () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output"
      });
      // @ts-expect-error - accessing private property for testing
      expect(aggregatorNode.requiredEvents).toBe(1);
    });

    it("should initialize with specified requiredEvents", () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 3
      });
      // @ts-expect-error - accessing private property for testing
      expect(aggregatorNode.requiredEvents).toBe(3);
    });
  });

  describe("eventTriggered", () => {
    it("should not send event until required number of events is received", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 3
      });

      const event1 = { data: "first" };
      const event2 = { data: "second" };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).not.toHaveBeenCalled();
    });

    it("should send aggregated event when required number of events is received", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 3
      });

      const event1 = { data: "first", count: 1 };
      const event2 = { data: "second", count: 2 };
      const event3 = { data: "third", count: 3 };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);
      await aggregatorNode.eventTriggered(event3);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith(
        "test-output",
        expect.objectContaining({
          data: "first",
          count: 1
        })
      );
    });

    it("should reset after sending aggregated event", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 2
      });

      const event1 = { data: "first" };
      const event2 = { data: "second" };
      const event3 = { data: "third" };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);
      await aggregatorNode.eventTriggered(event3);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith(
        "test-output",
        expect.objectContaining({
          data: "first"
        })
      );
    });

    it("should handle engineDataIndex and engineDataRoot in aggregation", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 2
      });

      const event1 = {
        items: [
          { id: 1, value: "first" },
          { id: 2, value: "second" }
        ]
      };

      const event2 = {
        items: [
          { id: 1, value: "first" },
          { id: 2, value: "updated" }
        ],
        engineDataIndexUsed: 1,
        engineDataRootUsed: "items"
      };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith(
        "test-output",
        expect.objectContaining({
          items: [
            { id: 1, value: "first" },
            { id: 2, value: "updated" }
          ]
        })
      );
    });

    it("should handle multiple engineDataIndex updates in sequence", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 3
      });

      const event1 = {
        items: [
          { id: 1, value: "first" },
          { id: 2, value: "second" },
          { id: 3, value: "third" }
        ]
      };

      const event2 = {
        items: [
          { id: 1, value: "first" },
          { id: 2, value: "updated1" },
          { id: 3, value: "third" }
        ],
        engineDataIndexUsed: 1,
        engineDataRootUsed: "items"
      };

      const event3 = {
        items: [
          { id: 1, value: "first" },
          { id: 2, value: "updated1" },
          { id: 3, value: "updated2" }
        ],
        engineDataIndexUsed: 2,
        engineDataRootUsed: "items"
      };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);
      await aggregatorNode.eventTriggered(event3);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith(
        "test-output",
        expect.objectContaining({
          items: [
            { id: 1, value: "first" },
            { id: 2, value: "updated1" },
            { id: 3, value: "updated2" }
          ]
        })
      );
    });

    it("should handle nested paths in engineDataRoot", async () => {
      aggregatorNode = new AggregatorNode("test-id", mockContainer, {
        inputEventName: "test-input",
        outputEventName: "test-output",
        requiredEvents: 2
      });

      const event1 = {
        test: {
          data: {
            items: [
              { id: 1, value: "first" },
              { id: 2, value: "second" }
            ]
          }
        }
      };

      const event2 = {
        test: {
          data: {
            items: [
              { id: 1, value: "first" },
              { id: 2, value: "updated" }
            ]
          }
        },
        engineDataIndexUsed: 1,
        engineDataRootUsed: "test.data.items"
      };

      await aggregatorNode.eventTriggered(event1);
      await aggregatorNode.eventTriggered(event2);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith(
        "test-output",
        expect.objectContaining({
          test: {
            data: {
              items: [
                { id: 1, value: "first" },
                { id: 2, value: "updated" }
              ]
            }
          }
        })
      );
    });
  });
}); 