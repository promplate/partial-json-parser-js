import { expect, it } from "vitest";
import { Allow, MalformedJSON, parse } from "./index";

it.each(["[oops", "[01", "[1evil"])("rejects malformed array numbers with NUM disabled: %s", (input) => {
    expect(() => parse(input, Allow.ARR)).toThrow(MalformedJSON);
});
it.each(['{"value":oops', '{"value":01', '{"value":1evil'])("rejects malformed object numbers with NUM disabled: %s", (input) => {
    expect(() => parse(input, Allow.OBJ)).toThrow(MalformedJSON);
});
it("preserves strict root whitespace and streaming numeric opt-out", () => {
    expect(parse(" 1", 0)).toBe(1);
    expect(parse("\n-1.5\t", 0)).toBe(-1.5);
    expect(parse("[1.25", Allow.ARR)).toEqual([]);
    expect(parse("[1e+", Allow.ARR)).toEqual([]);
});
