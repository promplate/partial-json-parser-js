/**
 * Sometimes you don't allow every type to be partially parsed.
 * For example, you may not want a partial number because it may increase its size gradually before it's complete.
 * In this case, you can use the `Allow` object to control what types you allow to be partially parsed.
 * @module
 */

/**
 * allow partial strings like `"hello \u12` to be parsed as `"hello "`
 */
export const STR = 0b000000001;

/**
 * allow partial numbers like `123.` to be parsed as `123`
 */
export const NUM = 0b000000010;

/**
 * allow partial arrays like `[1, 2,` to be parsed as `[1, 2]`
 */
export const ARR = 0b000000100;

/**
 * allow partial objects like `{"a": 1, "b":` to be parsed as `{"a": 1}`
 */
export const OBJ = 0b000001000;

/**
 * allow `nu` to be parsed as `null`
 */
export const NULL = 0b000010000;

/**
 * allow `tr` to be parsed as `true`, and `fa` to be parsed as `false`
 */
export const BOOL = 0b000100000;

/**
 * allow `Na` to be parsed as `NaN`
 */
export const NAN = 0b001000000;

/**
 * allow `Inf` to be parsed as `Infinity`
 */
export const INFINITY = 0b010000000;

/**
 * allow `-Inf` to be parsed as `-Infinity`
 */
export const _INFINITY = 0b100000000;

export const INF = INFINITY | _INFINITY;
export const SPECIAL = NULL | BOOL | INF | NAN;
export const ATOM = STR | NUM | SPECIAL;
export const COLLECTION = ARR | OBJ;
export const ALL = ATOM | COLLECTION;

/** 
 * Control what types you allow to be partially parsed.
 * The default is to allow all types to be partially parsed, which in most casees is the best option.
 * @example
 * If you don't want to allow partial objects, you can use the following code:
 * ```ts
 * import { Allow, parse } from "partial-json";
 * parse(`[{"a": 1, "b": 2}, {"a": 3,`, Allow.ARR); // [ { a: 1, b: 2 } ]
 * ```
 * Or you can use `~` to disallow a type:
 * ```ts
 * parse(`[{"a": 1, "b": 2}, {"a": 3,`, ~Allow.OBJ); // [ { a: 1, b: 2 } ]
 * ```
 * @example
 * If you don't want to allow partial strings, you can use the following code:
 * ```ts
 * import { Allow, parse } from "partial-json";
 * parse(`["complete string", "incompl`, ~Allow.STR); // [ 'complete string' ]
 * ```
 */
export const Allow = { STR, NUM, ARR, OBJ, NULL, BOOL, NAN, INFINITY, _INFINITY, INF, SPECIAL, ATOM, COLLECTION, ALL };

export default Allow;
