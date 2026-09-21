import { describe, expect, it } from "vitest";
import { MalformedJSON, parse } from "./index";

describe("complete document boundary", () => {
    it.each(['true false', 'null garbage', '"hello" "world"', '{} []', '[] trailing', 'Infinityx', 'NaNtail'])("rejects content after the first value: %s", (input) => {
        expect(() => parse(input)).toThrow(MalformedJSON);
    });
    it.each(['true', 'null', '"hello"', '{}', '[]', '123', '-1.5e2'])("accepts trailing whitespace: %s", (input) => {
        expect(parse(`${input} \n\t`)).toEqual(JSON.parse(input));
    });
    it("still accepts incomplete atoms and containers", () => {
        expect(parse('tr')).toBe(true);
        expect(parse('Inf')).toBe(Infinity);
        expect(parse('1e+')).toBe(1);
        expect(parse('[1,')).toEqual([1]);
        expect(parse('{"a":')).toEqual({});
    });
});
