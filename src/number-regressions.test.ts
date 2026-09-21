import { describe, expect, it } from "vitest";
import { Allow, MalformedJSON, parse } from "./index";

describe("partial number suffixes", () => {
    it.each(["123.", "123e", "123E", "123e+", "123E-", "-123."])("completes only a valid unfinished suffix: %s", (input) => {
        const expected = input.startsWith("-") ? -123 : 123;
        expect(parse(input)).toBe(expected);
        expect(parse(`[${input}`)).toEqual([expected]);
    });
    it.each(["1evil", "1e+oops", "01e", "1.e", "1e2e"])("rejects malformed exponent text: %s", (input) => {
        expect(() => parse(input)).toThrow(MalformedJSON);
        expect(() => parse(`[${input}]`)).toThrow(MalformedJSON);
        expect(() => parse(`{"value":${input}`)).toThrow(MalformedJSON);
    });
    it.each(["[1e,2]", "[1.,2]", "[1E+]", '[1e+2junk]'])("does not repair numbers terminated by a delimiter: %s", (input) => {
        expect(() => parse(input)).toThrow(MalformedJSON);
    });
    it("keeps complete numbers and the partial-number opt-out", () => {
        expect(parse("-1.25E+2", 0)).toBe(-125);
        expect(parse("[1.25", Allow.ARR)).toEqual([]);
    });
});
