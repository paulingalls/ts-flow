import { IContainer, JSONObject, NodeBase } from "../Container"; // Replace with the actual path to your module

// Mock fs module methods used in the Container class
jest.mock("fs");

describe("NodeBase", () => {
  const mockContainer: IContainer = {
    getInstance: jest.fn(),
    getInstances: jest.fn(),
    getNodeNames: jest.fn(),
    createInstance: jest.fn(),
  };

  const mockConfig: JSONObject = {
    // Define your mock config here
  };

  const nodeBase = new NodeBase("node-id", mockContainer, mockConfig);

  it("should return the correct ID", () => {
    expect(nodeBase.getId()).toBe("node-id");
  });
});
