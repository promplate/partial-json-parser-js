import { describe, expect, it } from "vitest";
import { Allow, MalformedJSON, PartialJSON, parse } from "./index";

describe("object and array separators", () => {
    it.each(['{"a" 1}', '{"a"::1}', '{foo:1}', '[true false]', '["a" "b"]', '[1 2]', '{"a":1 "b":2}', '[{},{} {}]'])("rejects a missing separator or unquoted key: %s", (input) => {
        expect(() => parse(input)).toThrow(MalformedJSON);
    });
    it.each(['{', '{"a"', '{"a":'])("still recovers unfinished object prefixes: %s", (input) => {
        expect(parse(input)).toEqual({});
        expect(() => parse(input, 0)).toThrow(PartialJSON);
    });
    it("retains valid nesting and permitted incomplete containers", () => {
        expect(parse('{"a":[1,true,{"b":"c"}]}')).toEqual({a:[1,true,{b:"c"}]});
        expect(parse('{"a":1')).toEqual({a:1});
        expect(parse('[1,2', Allow.ARR | Allow.NUM)).toEqual([1,2]);
    });
});
