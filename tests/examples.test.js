import { parse, PartialJSON, MalformedJSON } from "../src/index";
import { STR, NUM, ARR, OBJ, NULL, BOOL, NAN, INFINITY, _INFINITY } from "../src/options";
import { test, expect } from "vitest";

test("str", () => {
    expect(parse('"', STR)).toBe("");
    expect(parse('" \\x12', STR)).toBe(" ");
    expect(() => parse('"', ~STR)).toThrow(PartialJSON);
});

test("arr", () => {
    expect(parse('["', ARR)).toEqual([]);
    expect(parse('["', ARR | STR)).toEqual([""]);

    expect(() => parse("[", STR)).toThrow(PartialJSON);
    expect(() => parse('["', STR)).toThrow(PartialJSON);
    expect(() => parse('[""', STR)).toThrow(PartialJSON);
    expect(() => parse('["",', STR)).toThrow(PartialJSON);
});

test("obj", () => {
    expect(parse('{"": "', OBJ)).toEqual({});
    expect(parse('{"": "', OBJ | STR)).toEqual({ "": "" });

    expect(() => parse("{", STR)).toThrow(PartialJSON);
    expect(() => parse('{"', STR)).toThrow(PartialJSON);
    expect(() => parse('{""', STR)).toThrow(PartialJSON);
    expect(() => parse('{"":', STR)).toThrow(PartialJSON);
    expect(() => parse('{"":"', STR)).toThrow(PartialJSON);
    expect(() => parse('{"":""', STR)).toThrow(PartialJSON);
});

test("singletons", () => {
    expect(parse("n", NULL)).toBe(null);
    expect(() => parse("n", ~NULL)).toThrow(MalformedJSON);

    expect(parse("t", BOOL)).toBe(true);
    expect(() => parse("t", ~BOOL)).toThrow(MalformedJSON);

    expect(parse("f", BOOL)).toBe(false);
    expect(() => parse("f", ~BOOL)).toThrow(MalformedJSON);

    expect(parse("I", INFINITY)).toBe(Infinity);
    expect(() => parse("I", ~INFINITY)).toThrow(MalformedJSON);

    expect(parse("-I", _INFINITY)).toBe(-Infinity);
    expect(() => parse("-I", ~_INFINITY)).toThrow(MalformedJSON);

    expect(Number.isNaN(parse("N", NAN))).toBe(true);
    expect(() => parse("N", ~NAN)).toThrow(MalformedJSON);
});

test("num", () => {
    expect(parse("0", ~NUM)).toBe(0);
    expect(parse("-1.25e+4", ~NUM)).toBe(-1.25e4);
    expect(parse("-1.25e+", NUM)).toBe(-1.25);
    expect(parse("-1.25e", NUM)).toBe(-1.25);
});

test("require", () => {
    expect(require("partial-json").STR).toBe(STR);
});
