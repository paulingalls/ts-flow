import { getJSONObjectFromPath, keywordReplacement } from "../utils";
import { JSONObject } from "../Container";

describe("keywordReplacement", () => {
  const testPayload: JSONObject = {
    simple: "value",
    nested: {
      property: "nestedValue",
      number: 42,
      bool: true,
      deep: {
        veryDeep: {
          extremelyDeep: {
            property: "deepValue",
          },
        },
      },
    },
    array: ["one", "two", "three"],
    nullValue: "null",
  };

  // Type assertions for nested properties to help TypeScript
  const nestedObj = testPayload.nested as JSONObject;
  const deepObj = nestedObj.deep as JSONObject;
  const veryDeepObj = deepObj.veryDeep as JSONObject;
  const extremelyDeepObj = veryDeepObj.extremelyDeep as JSONObject;

  // Environment variable handling
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save environment variables
    envBackup = { ...process.env };
    // Set test environment variable
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.ENV_VAR = "environment-value";
  });

  afterEach(() => {
    // Restore environment variables
    process.env = envBackup;
  });

  describe("keywordReplacement function", () => {
    it("should replace simple keywords", () => {
      const template = "Hello ${simple}!";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Hello value!");
    });

    it("should replace nested keywords", () => {
      const template = "Property: ${nested.property}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Property: nestedValue");
    });

    it("should replace multiple keywords in the same template", () => {
      const template = "Hello ${simple}, your property is ${nested.property}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Hello value, your property is nestedValue");
    });

    it("should stringify non-string values", () => {
      const template = "Number: ${nested.number}, Boolean: ${nested.bool}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Number: 42, Boolean: true");
    });

    it("should handle arrays by stringifying them", () => {
      const template = "Array: ${array}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe('Array: ["one","two","three"]');
    });

    it("should handle properties with up to 3 levels of nesting", () => {
      const template = "Deep value: ${nested.deep.veryDeep}";
      const result = keywordReplacement(template, testPayload);
      // The veryDeep object will be stringified to JSON
      expect(result).toContain("Deep value:");
      expect(result).toContain("extremelyDeep");
    });

    it("should use environment variables as fallback", () => {
      const template = "Environment: ${ENV_VAR}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Environment: environment-value");
    });

    it("should handle non-existent keywords gracefully", () => {
      const template = "Missing: ${missing.property}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Missing: undefined");
    });

    it("should handle null-like values", () => {
      const template = "Null: ${nullValue}";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Null: null");
    });

    it("should not replace malformed keywords", () => {
      const template = "Not a keyword: $simple";
      const result = keywordReplacement(template, testPayload);
      expect(result).toBe("Not a keyword: $simple");
    });
  });

  describe("getJSONObjectFromPath function", () => {
    it("should return the object at the specified path (1 level)", () => {
      const result = getJSONObjectFromPath("nested", testPayload);
      expect(result).toEqual(testPayload.nested);
    });

    it("should return the object at the specified path (2 levels)", () => {
      const result = getJSONObjectFromPath("nested.deep", testPayload);
      expect(result).toEqual(deepObj);
    });

    it("should return the object at the specified path (3 levels)", () => {
      const result = getJSONObjectFromPath("nested.deep.veryDeep", testPayload);
      expect(result).toEqual(veryDeepObj);
    });

    it("should return the object at the specified path (4 levels)", () => {
      const result = getJSONObjectFromPath(
        "nested.deep.veryDeep.extremelyDeep",
        testPayload,
      );
      expect(result).toEqual(extremelyDeepObj);
    });

    it("should return an empty object for non-existent paths", () => {
      const result = getJSONObjectFromPath("nonexistent.path", testPayload);
      expect(result).toEqual({});
    });

    it("should return an empty object for partially non-existent paths", () => {
      const result = getJSONObjectFromPath(
        "nested.nonexistent.path",
        testPayload,
      );
      expect(result).toEqual({});
    });

    it("should return an empty object when a non-object is in the path", () => {
      const result = getJSONObjectFromPath("simple.something", testPayload);
      expect(result).toEqual({});
    });

    it("should support array indices in paths", () => {
      // Create test object with array
      const arrayPayload: JSONObject = {
        items: [
          { id: 1, name: "first" },
          { id: 2, name: "second" },
        ],
      };

      const result = getJSONObjectFromPath("items.0", arrayPayload);
      expect(result).toEqual({ id: 1, name: "first" });
    });
  });
});
