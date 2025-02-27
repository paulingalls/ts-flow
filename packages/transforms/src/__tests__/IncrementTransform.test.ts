import { IncrementTransform } from "../IncrementTransform";
import { IContainer, JSONObject } from "@ts-flow/core";

describe("IncrementTransform", () => {
  let incrementTransform: IncrementTransform;
  let mockContainer: IContainer;
  let mockConfig: JSONObject;

  beforeEach(() => {
    mockConfig = {
      outputEventName: "incrementedData",
      dataRoot: "data",
      dataTarget: "value",
      dataType: "number",
      dataIncrement: 5,
    };

    mockContainer = {
      getInstance: jest.fn(),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
      createInstance: jest.fn(),
    };

    incrementTransform = new IncrementTransform(
      "testId",
      mockContainer,
      mockConfig,
    );
  });

  it("should create an instance of IncrementTransform", () => {
    expect(incrementTransform).toBeInstanceOf(IncrementTransform);
  });

  it("should increment numeric data in the payload", async () => {
    const mockPayload: JSONObject = {
      data: {},
    };
    mockPayload.data = { value: 10 };

    const completeCallback = jest.fn();

    await incrementTransform.execute(mockPayload, completeCallback);

    // Ensure that the data was correctly incremented
    expect(mockPayload.data.value).toEqual(15);

    // Ensure that the completeCallback was called with the expected payload
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockPayload,
    );
  });

  it("should increment date data in the payload", async () => {
    mockConfig.dataType = "date";
    mockConfig.dataIncrement = 3; // Increment by 3 days

    const originalDate = new Date("2023-10-01T00:00:00.000Z");
    const mockPayload: JSONObject = {
      data: {},
    };
    mockPayload.data = {
      value: originalDate.toISOString(),
    };

    const completeCallback = jest.fn();

    incrementTransform = new IncrementTransform(
      "testId",
      mockContainer,
      mockConfig,
    );
    await incrementTransform.execute(mockPayload, completeCallback);

    // Ensure that the date was correctly incremented by 3 days
    const expectedDate = new Date("2023-10-04T00:00:00.000Z");
    expect(mockPayload.data.value).toEqual(expectedDate.toISOString());

    // Ensure that the completeCallback was called with the expected payload
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockPayload,
    );
  });

  it("should handle an array of data in the payload", async () => {
    const mockPayload: JSONObject = {
      data: [],
    };
    mockPayload.data = [{ value: 5 }, { value: 10 }, { value: 15 }];

    const completeCallback = jest.fn();

    await incrementTransform.execute(mockPayload, completeCallback);

    // Ensure that each item in the array was correctly incremented
    expect((mockPayload.data[0] as JSONObject).value).toEqual(10);
    expect((mockPayload.data[1] as JSONObject).value).toEqual(15);
    expect((mockPayload.data[2] as JSONObject).value).toEqual(20);

    // Ensure that the completeCallback was called with the expected payload
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockPayload,
    );
  });

  // Add more tests for other scenarios and error cases if needed
});
