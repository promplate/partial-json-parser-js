import { parse, MalformedJSON } from "../src/index";
import { test, expect } from "vitest";

test("issue #12 - invalid number starting with dot should throw error", () => {
    // This should throw an error instead of silently failing
    expect(() => parse(`{
        "vector": [1, 2, 3, .0516156161551515, 7]
    }`)).toThrow(MalformedJSON);
    
    // Standalone invalid numbers should also throw
    expect(() => parse(".123")).toThrow(MalformedJSON);
    expect(() => parse("[1, .123, 3]")).toThrow(MalformedJSON);
});

test("issue #12 - invalid tokens should throw error instead of returning empty", () => {
    // Should throw error instead of returning []
    expect(() => parse("[abc")).toThrow(MalformedJSON);
    expect(() => parse("[invalid")).toThrow(MalformedJSON);
});

test("issue #12 - empty array with spaces should not stop parsing", () => {
    // This should parse the complete JSON, not stop at the empty array
    const input = `[
        { "id":1,"arr":["hello"]},
        {"id":2, "arr": [        ],"more":"yaya"},
        {"id":3,"arr":["!"]}
    ]`;
    
    const result = parse(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ "id": 1, "arr": ["hello"] });
    expect(result[1]).toEqual({ "id": 2, "arr": [], "more": "yaya" });
    expect(result[2]).toEqual({ "id": 3, "arr": ["!"] });
});

test("valid edge cases should still work", () => {
    // These should continue to work as before
    expect(parse("[]")).toEqual([]);
    expect(parse("[ ]")).toEqual([]);
    expect(parse("[1, 2, 3]")).toEqual([1, 2, 3]);
    expect(parse("0.123")).toBe(0.123);
    expect(parse("[0.123]")).toEqual([0.123]);
});