import { describe, expect, it } from "vitest";
import { Allow, parse } from "./index";

describe("whitespace inside unfinished strings", () => {
    it.each([" ", "  ", "\u00a0", "\u2003"])("preserves a trailing %j", (suffix) => {
        expect(parse('"text' + suffix)).toBe("text" + suffix);
        expect(parse('["text' + suffix)).toEqual(["text" + suffix]);
        expect(parse('{"key":"text' + suffix)).toEqual({ key: "text" + suffix });
    });
    it("still ignores surrounding whitespace outside a complete value", () => {
        expect(parse('  "text "  \n')).toBe("text ");
        expect(parse('  [1,2]  \n')).toEqual([1,2]);
    });
    it("retains the partial-string opt-out", () => {
        expect(parse('["text ', Allow.ARR)).toEqual([]);
    });
});
