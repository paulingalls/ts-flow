import { EventBus, IQueryEngine, QueryEngine } from "../coreNodes";
import { IContainer, JSONObject } from "../Container";
import { getJSONObjectFromPath } from "../utils";

describe("QueryEngine", () => {
  let queryEngine: QueryEngine;
  let mockEngine: IQueryEngine;
  let mockContainer: IContainer;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockEngine = {
      execute: jest.fn(),
    };

    mockEventBus = {
      addListener: jest.fn(),
      sendEvent: jest.fn(),
    } as unknown as EventBus;

    mockContainer = {
      createInstance: jest.fn().mockReturnValue(mockEngine),
      getInstance: jest.fn().mockReturnValue(mockEventBus),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
    } as unknown as IContainer;
  });

  it("should initialize with proper configuration", () => {
    const config = {
      engineType: "MockEngine",
      engineId: "mock-engine",
      engineConfig: {},
      inputEventName: "test-event",
    };
    queryEngine = new QueryEngine("test-id", mockContainer, config);

    // EventBus listener should be registered
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEventBus.addListener).toHaveBeenCalledWith(
      "test-event",
      queryEngine,
    );
  });

  it("should pass the full payload when no engineDataRoot is specified", async () => {
    const config = {
      engineType: "MockEngine",
      engineId: "mock-engine",
      engineConfig: {},
      inputEventName: "test-event",
    };
    queryEngine = new QueryEngine("test-id", mockContainer, config);

    const payload = { test: "value" };
    await queryEngine.eventTriggered(payload);

    // Without engineDataRoot, the entire payload is passed to execute
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEngine.execute).toHaveBeenCalledWith(
      payload,
      expect.any(Function),
    );
  });

  it("should extract data at the specified path when engineDataRoot is provided", async () => {
    const config = {
      engineType: "MockEngine",
      engineId: "mock-engine",
      engineConfig: {},
      inputEventName: "test-event",
      engineDataRoot: "test.root",
    };
    queryEngine = new QueryEngine("test-id", mockContainer, config);

    const payload = {
      test: {
        root: {
          value: "test",
        },
      },
    };
    await queryEngine.eventTriggered(payload);

    // With engineDataRoot, only the specified path is passed to execute
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEngine.execute).toHaveBeenCalledWith(
      { value: "test" },
      expect.any(Function),
    );
  });

  it("should merge result with payload when no engineDataRoot is specified", async () => {
    const config = {
      engineType: "MockEngine",
      engineId: "mock-engine",
      engineConfig: {},
      inputEventName: "test-event",
    };
    queryEngine = new QueryEngine("test-id", mockContainer, config);

    const payload = { test: "value" };
    const result = { result: "success" };

    // We need to capture the callback from the execute call and manually invoke it
    (mockEngine.execute as jest.Mock).mockImplementation(
      (
        data: JSONObject,
        callback: (eventName: string, result: JSONObject) => void,
      ) => {
        callback("output-event", result);
      },
    );

    await queryEngine.eventTriggered(payload);

    // When no engineDataRoot is specified, the result is merged with the original payload
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEventBus.sendEvent).toHaveBeenCalledWith("output-event", {
      test: "value",
      result: "success",
    });
  });

  it("should merge result at the specified path when engineDataRoot is used", async () => {
    const config = {
      engineType: "MockEngine",
      engineId: "mock-engine",
      engineConfig: {},
      inputEventName: "test-event",
      engineDataRoot: "test.root",
    };
    queryEngine = new QueryEngine("test-id", mockContainer, config);

    const payload = {
      test: {
        root: {
          value: "test",
        },
        other: "data",
      },
    };

    // We need to capture the callback from the execute call and manually invoke it
    (mockEngine.execute as jest.Mock).mockImplementation(
      (
        data: JSONObject,
        callback: (eventName: string, result: JSONObject) => void,
      ) => {
        callback("output-event", { value: "updated", newField: "added" });
      },
    );

    await queryEngine.eventTriggered(payload);

    // When engineDataRoot is specified, the result is merged at the specified path
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockEventBus.sendEvent).toHaveBeenCalledWith("output-event", {
      test: {
        root: {
          value: "updated",
          newField: "added"
        },
        other: "data",
      }
    });
  });

  it("should understand how getJSONObjectFromPath behaves", () => {
    // Check how getJSONObjectFromPath actually behaves with proper expectations
    expect(getJSONObjectFromPath("", { a: 1 })).toEqual({});

    // getJSONObjectFromPath returns objects, not primitives,
    // that's why this test was failing
    expect(getJSONObjectFromPath("a", { a: 1 })).toEqual({});

    // It only returns objects or arrays, not primitives
    expect(getJSONObjectFromPath("a", { a: { b: 2 } })).toEqual({ b: 2 });
    expect(getJSONObjectFromPath("a.b", { a: { b: { c: 3 } } })).toEqual({
      c: 3,
    });
    expect(getJSONObjectFromPath("a.b", { a: { b: 2 } })).toEqual({});

    // Arrays are returned as-is
    expect(getJSONObjectFromPath("arr", { arr: [1, 2, 3] })).toEqual([1, 2, 3]);

    // Non-existent paths return empty object
    expect(getJSONObjectFromPath("nonexistent", { a: 1 })).toEqual({});
  });

  describe("engineDataIndex functionality", () => {
    it("should extract data from array at specified index when both engineDataRoot and engineDataIndex are provided", async () => {
      const config = {
        engineType: "MockEngine",
        engineId: "mock-engine",
        engineConfig: {},
        inputEventName: "test-event",
        engineDataRoot: "test.items",
        engineDataIndex: 1
      };
      queryEngine = new QueryEngine("test-id", mockContainer, config);

      const payload = {
        test: {
          items: [
            { id: 1, value: "first" },
            { id: 2, value: "second" },
            { id: 3, value: "third" }
          ]
        }
      };
      await queryEngine.eventTriggered(payload);

      // With engineDataRoot and engineDataIndex, only the specified array item is passed to execute
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEngine.execute).toHaveBeenCalledWith(
        { id: 2, value: "second" },
        expect.any(Function),
      );
    });

    it("should merge result back into array at specified index", async () => {
      const config = {
        engineType: "MockEngine",
        engineId: "mock-engine",
        engineConfig: {},
        inputEventName: "test-event",
        engineDataRoot: "test.items",
        engineDataIndex: 1
      };
      queryEngine = new QueryEngine("test-id", mockContainer, config);

      const payload = {
        test: {
          items: [
            { id: 1, value: "first" },
            { id: 2, value: "second" },
            { id: 3, value: "third" }
          ]
        }
      };

      // We need to capture the callback from the execute call and manually invoke it
      (mockEngine.execute as jest.Mock).mockImplementation(
        (
          data: JSONObject,
          callback: (eventName: string, result: JSONObject) => void,
        ) => {
          callback("output-event", { value: "updated", newField: "added" });
        },
      );

      await queryEngine.eventTriggered(payload);

      // The result should replace the array item at the specified index
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEventBus.sendEvent).toHaveBeenCalledWith("output-event", {
        test: {
          items: [
            { id: 1, value: "first" },
            { value: "updated", newField: "added" },
            { id: 3, value: "third" }
          ]
        },
        engineDataIndexUsed: 1,
        engineDataRootUsed: "test.items"
      });
    });

    it("should handle out-of-bounds array index gracefully", async () => {
      const config = {
        engineType: "MockEngine",
        engineId: "mock-engine",
        engineConfig: {},
        inputEventName: "test-event",
        engineDataRoot: "test.items",
        engineDataIndex: 5  // Index beyond array length
      };
      queryEngine = new QueryEngine("test-id", mockContainer, config);

      const payload = {
        test: {
          items: [
            { id: 1, value: "first" },
            { id: 2, value: "second" }
          ]
        }
      };
      await queryEngine.eventTriggered(payload);

      // When index is out of bounds, undefined should be passed to execute
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEngine.execute).toHaveBeenCalledWith(
        undefined,
        expect.any(Function),
      );
    });

    it("should ignore engineDataIndex when engineDataRoot points to non-array", async () => {
      const config = {
        engineType: "MockEngine",
        engineId: "mock-engine",
        engineConfig: {},
        inputEventName: "test-event",
        engineDataRoot: "test.root",
        engineDataIndex: 1  // This should be ignored since root is not an array
      };
      queryEngine = new QueryEngine("test-id", mockContainer, config);

      const payload = {
        test: {
          root: {
            value: "test"
          }
        }
      };
      await queryEngine.eventTriggered(payload);

      // engineDataIndex should be ignored when root is not an array
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEngine.execute).toHaveBeenCalledWith(
        { value: "test" },
        expect.any(Function),
      );
    });

    it("should handle empty array at engineDataRoot", async () => {
      const config = {
        engineType: "MockEngine",
        engineId: "mock-engine",
        engineConfig: {},
        inputEventName: "test-event",
        engineDataRoot: "test.items",
        engineDataIndex: 0
      };
      queryEngine = new QueryEngine("test-id", mockContainer, config);

      const payload = {
        test: {
          items: []
        }
      };
      await queryEngine.eventTriggered(payload);

      // When array is empty, undefined should be passed to execute
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockEngine.execute).toHaveBeenCalledWith(
        undefined,
        expect.any(Function),
      );
    });
  });
});
