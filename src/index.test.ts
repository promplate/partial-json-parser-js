import { describe, expect, it } from "vitest";
import { MalformedJSON, parse } from "./index";

describe("malformed JSON handling", () => {
    it("throws for malformed numbers inside arrays", () => {
        expect(() => parse("[1, .05, 2]")).toThrow(MalformedJSON);
    });

    it("throws for malformed numbers inside objects", () => {
        expect(() => parse('{"a": .05, "b": 2}')).toThrow(MalformedJSON);
    });

    it("keeps parsing after an empty array with spaces", () => {
        expect(parse('[{"id":1,"arr":["hello"]},{"id":2,"arr":[        ],"more":"yaya"},{"id":3,"arr":["!"]}]')).toEqual([
            { id: 1, arr: ["hello"] },
            { id: 2, arr: [], more: "yaya" },
            { id: 3, arr: ["!"] },
        ]);
    });

    it("keeps parsing after an object comma with spaces", () => {
        expect(parse('{"a":1,   }')).toEqual({ a: 1 });
    });

    it("keeps parsing after an array comma with spaces", () => {
        expect(parse("[1,   ]")).toEqual([1]);
    });
});
