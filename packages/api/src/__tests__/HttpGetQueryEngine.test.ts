import axios from "axios";
import { HttpGetQueryEngine } from "../HttpGetQueryEngine";
import { IContainer, IQueryEngine } from "@ai-flow/core";

// Mock axios for the test
jest.mock("axios");

describe("HttpGetQueryEngine", () => {
  it("sends a query and returns the result", async () => {
    // Arrange
    const urlTemplate = "http://example.com/api?q=${query}";
    const payload = { query: "test" };
    const response = { data: { result: "test result" } };
    (axios.get as jest.Mock).mockResolvedValue(response);

    const queryEngine: IQueryEngine = new HttpGetQueryEngine(
      "id",
      {} as IContainer,
      { url: urlTemplate }
    );

    // Act
    queryEngine.execute(payload, (result) => {
      expect(result).toEqual({result: { result: "test result" }});
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(axios.get).toHaveBeenCalledWith("http://example.com/api?q=test");
    });
  });
});
