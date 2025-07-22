import { IContainer, JSONObject } from "@ts-flow/core";
import pg from "pg";
import { PGSelectQueryEngine } from "../PGSelectQueryEngine";

// Define QueryResult type to match pg's interface
type QueryResult = {
  rows: Record<string, string | number>[];
  rowCount?: number;
  command?: string;
  oid?: number;
  fields?: string[];
};

// Create a properly typed mock client
type MockClient = {
  connect: jest.Mock<Promise<void>>;
  query: jest.Mock<Promise<QueryResult>>;
};

// Mock dependencies with proper typing
jest.mock("pg", () => {
  const mockClient: MockClient = {
    connect: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
    query: jest.fn<Promise<QueryResult>, []>().mockResolvedValue({ rows: [] }),
  };
  return {
    Client: jest.fn(() => mockClient),
  };
});

describe("PGSelectQueryEngine", () => {
  let container: IContainer;
  let completeCallback: jest.Mock;
  let mockClient: MockClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mocks
    container = {} as IContainer;
    completeCallback = jest.fn();

    // Get the mock client with proper typing
    mockClient = new pg.Client() as unknown as MockClient;
  });

  it("should correctly initialize with config", () => {
    // Arrange
    const config: JSONObject = {
      connectionString: "postgres://user:password@localhost:5432/database",
      sqlSelectTemplate: "SELECT * FROM users WHERE id = {{userId}}",
      outputEventName: "queryComplete",
      outputProperty: "users",
    };

    // Act
    const engine = new PGSelectQueryEngine("test-id", container, config);

    // Assert
    expect(engine["id"]).toBe("test-id");
    expect(engine["connectionString"]).toBe(config.connectionString);
    expect(engine["sqlSelectTemplate"]).toBe(config.sqlSelectTemplate);
    expect(engine["outputEventName"]).toBe(config.outputEventName);
    expect(engine["outputProperty"]).toBe(config.outputProperty);
    expect(engine["client"]).toBeNull();
  });

  it("should create and connect to client on first execution", async () => {
    // Arrange
    const config: JSONObject = {
      connectionString: "postgres://user:password@localhost:5432/database",
      sqlSelectTemplate: "SELECT * FROM users",
      outputEventName: "queryComplete",
      outputProperty: "users",
    };
    const engine = new PGSelectQueryEngine("test-id", container, config);
    const payload: JSONObject = {};

    // Create a properly typed query result
    const queryResult: QueryResult = {
      rows: [{ id: 1, name: "Test User" }],
    };

    // Mock with proper typing
    mockClient.query.mockResolvedValueOnce(queryResult);

    // Act
    await engine.execute(payload, completeCallback);

    // Assert
    expect(pg.Client).toHaveBeenCalledWith({
      connectionString: config.connectionString,
    });
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith(config.sqlSelectTemplate);
  });

  it("should store query results in the specified output property", async () => {
    // Arrange
    const config: JSONObject = {
      connectionString: "postgres://user:password@localhost:5432/database",
      sqlSelectTemplate: "SELECT * FROM users",
      outputEventName: "queryComplete",
      outputProperty: "users",
    };
    const engine = new PGSelectQueryEngine("test-id", container, config);
    const payload: JSONObject = { existingProp: "value" };

    const queryResult: QueryResult = {
      rows: [{ id: 1, name: "Test User" }],
    };

    mockClient.query.mockResolvedValueOnce(queryResult);

    // Act
    await engine.execute(payload, completeCallback);

    // Assert
    const expectedPayload = {
      existingProp: "value",
      users: queryResult.rows,
    };

    expect(completeCallback).toHaveBeenCalledWith(
      config.outputEventName,
      expect.objectContaining(expectedPayload),
    );
  });

  it("should merge query results directly into payload when no outputProperty is specified", async () => {
    // Arrange
    const config: JSONObject = {
      connectionString: "postgres://user:password@localhost:5432/database",
      sqlSelectTemplate: "SELECT * FROM users",
      outputEventName: "queryComplete",
      outputProperty: "", // Empty string means merge directly
    };
    const engine = new PGSelectQueryEngine("test-id", container, config);
    const payload: JSONObject = { existingProp: "value" };

    const queryResult: QueryResult = {
      rows: [{ id: 1, name: "Test User" }],
    };

    mockClient.query.mockResolvedValueOnce(queryResult);

    // Act
    await engine.execute(payload, completeCallback);

    // Assert
    const expectedPayload = {
      existingProp: "value",
      ...queryResult.rows,
    };

    expect(completeCallback).toHaveBeenCalledWith(
      config.outputEventName,
      expect.objectContaining(expectedPayload),
    );
  });

  it("should handle query errors gracefully", async () => {
    // Arrange
    const config: JSONObject = {
      connectionString: "postgres://user:password@localhost:5432/database",
      sqlSelectTemplate: "SELECT * FROM users",
      outputEventName: "queryComplete",
      outputProperty: "users",
    };
    const engine = new PGSelectQueryEngine("test-id", container, config);
    const payload: JSONObject = {};
    const error = new Error("Query failed");

    mockClient.query.mockRejectedValueOnce(error);
    console.error = jest.fn(); // Mock console.error

    // Act
    await engine.execute(payload, completeCallback);

    // Assert
    expect(completeCallback).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("error running query", error);
  });
});
