import axios from "axios";
import { HttpGetQueryEngine } from "../HttpGetQueryEngine";
import { IContainer, IQueryEngine, JSONObject, JSONValue } from "@ts-flow/core";

// Mock axios for the test
jest.mock("axios");

describe("HttpGetQueryEngine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("sends a query and returns the result", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api?q=${query}";
        const payload = { query: "test" };
        const response = { data: { result: "test result" } };
        (axios.get as jest.Mock).mockResolvedValue(response);

        const queryEngine: IQueryEngine = new HttpGetQueryEngine(
            "id",
            {} as IContainer,
            { urlTemplate, outputEventName: "outputEvent", outputProperty: "result" },
        );

        // Act
        await queryEngine.execute(payload, (_, result) => {
            expect(result).toEqual({ query: "test", result: { result: "test result" } });
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenCalledWith(
                "http://example.com/api?q=test",
                { headers: { "Content-Type": "application/json" } }
            );
        });
    });

    it("handles array payload correctly", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api?q=${query}";
        const payload: JSONValue = [
            { query: "test1" },
            { query: "test2" }
        ];
        const response1 = { data: { result: "test result 1" } };
        const response2 = { data: { result: "test result 2" } };
        (axios.get as jest.Mock)
            .mockResolvedValueOnce(response1)
            .mockResolvedValueOnce(response2);

        const queryEngine: IQueryEngine = new HttpGetQueryEngine(
            "id",
            {} as IContainer,
            { urlTemplate, outputEventName: "outputEvent", outputProperty: "result" },
        );

        // Act
        await queryEngine.execute(payload as unknown as JSONObject, (_, result) => {
            expect(result).toEqual([
                { query: "test1", result: { result: "test result 1" } },
                { query: "test2", result: { result: "test result 2" } }
            ]);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenCalledTimes(2);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenNthCalledWith(
                1,
                "http://example.com/api?q=test1",
                { headers: { "Content-Type": "application/json" } }
            );
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenNthCalledWith(
                2,
                "http://example.com/api?q=test2",
                { headers: { "Content-Type": "application/json" } }
            );
        });
    });

    it("handles errors gracefully for array items", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api?q=${query}";
        const payload: JSONValue = [
            { query: "test1" },
            { query: "test2" },
            { query: "test3" }
        ];
        const response1 = { data: { result: "test result 1" } };
        const error = new Error("Network error");
        const response3 = { data: { result: "test result 3" } };
        (axios.get as jest.Mock)
            .mockResolvedValueOnce(response1)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(response3);

        const queryEngine: IQueryEngine = new HttpGetQueryEngine(
            "id",
            {} as IContainer,
            { urlTemplate, outputEventName: "outputEvent", outputProperty: "result" },
        );

        // Act
        await queryEngine.execute(payload as unknown as JSONObject, (_, result) => {
            expect(result).toEqual([
                { query: "test1", result: { result: "test result 1" } },
                { query: "test2" },
                { query: "test3", result: { result: "test result 3" } }
            ]);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.get).toHaveBeenCalledTimes(3);
        });
    });
});
