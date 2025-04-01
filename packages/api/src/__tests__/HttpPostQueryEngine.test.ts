import axios from "axios";
import { HttpPostQueryEngine } from "../HttpPostQueryEngine";
import { IContainer, IQueryEngine, JSONObject, JSONValue } from "@ts-flow/core";

// Mock axios for the test
jest.mock("axios");

describe("HttpPostQueryEngine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("sends a query and returns the result for non-array payload", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api";
        const payload: JSONObject = { query: "test" };
        const response = { data: { result: "test result" } };
        (axios.post as jest.Mock).mockResolvedValue(response);

        const queryEngine: IQueryEngine = new HttpPostQueryEngine(
            "id",
            {} as IContainer,
            {
                urlTemplate,
                bodyType: "json",
                bodySchema: { query: "query" },
                bodyAdditionsFromPayload: {},
                outputEventName: "outputEvent",
                outputProperty: "result"
            }
        );

        // Act
        await queryEngine.execute(payload, (_, result) => {
            expect(result).toEqual({ query: "test", result: { result: "test result" } });
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.post).toHaveBeenCalledWith(
                "http://example.com/api",
                { query: "query" },
                expect.any(Object)
            );
        });
    });

    it("handles array payload correctly", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api";
        const payload: JSONValue = [
            { query: "test1" },
            { query: "test2" }
        ]

        const response1 = { data: { result: "test result 1" } };
        const response2 = { data: { result: "test result 2" } };
        (axios.post as jest.Mock)
            .mockResolvedValueOnce(response1)
            .mockResolvedValueOnce(response2);

        const queryEngine: IQueryEngine = new HttpPostQueryEngine(
            "id",
            {} as IContainer,
            {
                urlTemplate,
                bodyType: "json",
                bodySchema: { query: "query" },
                bodyAdditionsFromPayload: {},
                outputEventName: "outputEvent",
                outputProperty: "result"
            }
        );

        // Act
        await queryEngine.execute(payload as unknown as JSONObject, (_, result) => {
            expect(result).toEqual([
                { query: "test1", result: { result: "test result 1" } },
                { query: "test2", result: { result: "test result 2" } }
            ]);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.post).toHaveBeenCalledTimes(2);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                "http://example.com/api",
                { query: "query" },
                expect.any(Object)
            );
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.post).toHaveBeenNthCalledWith(
                2,
                "http://example.com/api",
                { query: "query" },
                expect.any(Object)
            );
        });
    });

    it("handles errors gracefully for array items", async () => {
        // Arrange
        const urlTemplate = "http://example.com/api";
        const payload: JSONValue = [
            { query: "test1" },
            { query: "test2" },
            { query: "test3" }
        ]

        const response1 = { data: { result: "test result 1" } };
        const error = new Error("Network error");
        const response3 = { data: { result: "test result 3" } };
        (axios.post as jest.Mock)
            .mockResolvedValueOnce(response1)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(response3);

        const queryEngine: IQueryEngine = new HttpPostQueryEngine(
            "id",
            {} as IContainer,
            {
                urlTemplate,
                bodyType: "json",
                bodySchema: { query: "query" },
                bodyAdditionsFromPayload: {},
                outputEventName: "outputEvent",
                outputProperty: "result"
            }
        );

        // Act
        await queryEngine.execute(payload as unknown as JSONObject, (_, result) => {
            expect(result).toEqual([
                { query: "test1", result: { result: "test result 1" } },
                { query: "test2", },
                { query: "test3", result: { result: "test result 3" } }
            ]);
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(axios.post).toHaveBeenCalledTimes(3);
        });
    });
}); 