import { parse, PartialJSON, MalformedJSON } from "../src/index";
import {
  STR,
  NUM,
  ARR,
  OBJ,
  NULL,
  BOOL,
  NAN,
  INFINITY,
  _INFINITY,
  OUTERMOST_OBJ,
  OUTERMOST_ARR,
} from "../src/options";
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
test("outermost_obj_partial with obj equals obj", () => {
  const obj = parse('{"z": 0, "a": {"b": 2, "c": 3', OBJ);
  expect(parse('{"z": 0, "a": {"b": 2, "c": 3', OUTERMOST_OBJ | OBJ)).toEqual(
    obj
  );
});

test("nested_objects_with_outermost_obj", () => {
  expect(parse('{"z": 0, "a": {"b": 2, "c": 3', OUTERMOST_OBJ)).toEqual({
    z: 0,
  });
});

test("outermost_arr_partial with arr equals arr", () => {
  const arr = parse("[1, 2, [3, 4], [5,", ARR);
  expect(parse("[1, 2, [3, 4], [5,", OUTERMOST_ARR | ARR)).toEqual(arr);
});

test("nested_arrays_with_outermost_arr", () => {
  const result = parse("[1, 2, [3, 4], [5,", OUTERMOST_ARR);
  expect(result).toEqual([1, 2, [3, 4]]);
});

test("simple_partial_array_with_object", () => {
  expect(parse('[{"a":1},', ARR)).toEqual([{ a: 1 }]);
});

test("outermost_arr_with_nested_objects", () => {
  expect(parse('[{"a": 1}, {"b": 2}, {"c":', OUTERMOST_ARR)).toEqual([
    { a: 1 },
    { b: 2 },
  ]);
});

test("outermost_arr_with_incomplete_nested_array", () => {
  expect(parse("[1, 2, [3,", OUTERMOST_ARR)).toEqual([1, 2]);
});

test("outermost_arr_with_complete_nested_array", () => {
  expect(parse("[1, 2, [3, 4], [5,", OUTERMOST_ARR)).toEqual([1, 2, [3, 4]]);
});

test("interleaved_partial_objects_and_arrays", () => {
  expect(
    parse(
      '{"outer1": "yes", "outer2": [{"inner1":"yes"}, {"inner2": "no"',
      OUTERMOST_OBJ | OBJ | ARR
    )
  ).toEqual({ outer1: "yes", outer2: [{ inner1: "yes" }, { inner2: "no" }] });
});

test("complex_example", () => {
  const obj = '{"init": 1, "out": ["a1", "b", [{ "c": 2, "d": 3, "e": 4 }]';
  console.log(
    "Parsed: ",
    JSON.stringify(parse(obj, OUTERMOST_OBJ | OUTERMOST_ARR))
  );
  expect(parse(obj, OUTERMOST_OBJ | OUTERMOST_ARR)).toEqual({
    init: 1,
    out: ["a1", "b", [{ c: 2, d: 3, e: 4 }]],
  });
});
