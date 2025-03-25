import { IncrementTransform } from "../IncrementTransform";
import { IContainer, JSONObject } from "@ts-flow/core";

describe("IncrementTransform", () => {
  let incrementTransform: IncrementTransform;
  let mockContainer: IContainer;
  let mockConfig: JSONObject;

  beforeEach(() => {
    mockConfig = {
      outputEventName: "incrementedData",
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

  it("should increment numeric data", async () => {
    const mockData: JSONObject = { value: 10 };

    const completeCallback = jest.fn();

    await incrementTransform.execute(mockData, completeCallback);

    // Ensure that the data was correctly incremented
    expect(mockData.value).toEqual(15);

    // Ensure that the completeCallback was called with the expected data
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockData,
    );
  });

  it("should increment date data", async () => {
    mockConfig.dataType = "date";
    mockConfig.dataIncrement = 3; // Increment by 3 days

    const originalDate = new Date("2023-10-01T00:00:00.000Z");
    const mockData: JSONObject = {
      value: originalDate.toISOString(),
    };

    const completeCallback = jest.fn();

    incrementTransform = new IncrementTransform(
      "testId",
      mockContainer,
      mockConfig,
    );
    await incrementTransform.execute(mockData, completeCallback);

    // Ensure that the date was correctly incremented by 3 days
    const expectedDate = new Date("2023-10-04T00:00:00.000Z");
    expect(mockData.value).toEqual(expectedDate.toISOString());

    // Ensure that the completeCallback was called with the expected data
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockData,
    );
  });

  it("should handle an array of data", async () => {
    const mockData = [
      { value: 5 },
      { value: 10 },
      { value: 15 },
    ] as unknown as JSONObject;

    const completeCallback = jest.fn();

    await incrementTransform.execute(mockData, completeCallback);

    // Ensure that each item in the array was correctly incremented
    expect((mockData as unknown as Array<JSONObject>)[0].value).toEqual(10);
    expect((mockData as unknown as Array<JSONObject>)[1].value).toEqual(15);
    expect((mockData as unknown as Array<JSONObject>)[2].value).toEqual(20);

    // Ensure that the completeCallback was called with the expected data
    expect(completeCallback).toHaveBeenCalledWith(
      mockConfig.outputEventName,
      mockData,
    );
  });

  // Add more tests for other scenarios and error cases if needed
});
