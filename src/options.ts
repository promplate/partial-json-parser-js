/**
 * Sometimes you don't allow every type to be partially parsed.
 * For example, you may not want a partial number because it may increase its size gradually before it's complete.
 * In this case, you can use the `Allow` object to control what types you allow to be partially parsed.
 * @module
 */

/**
 * Allow partial strings like `"hello \u12` to be parsed as `"hello "`
 */
export const STR = 0b000000001; // 1

/**
 * Allow partial numbers like `123.` to be parsed as `123`
 */
export const NUM = 0b000000010; // 2

/**
 * Allow partial arrays like `[1, 2,` to be parsed as `[1, 2]`
 */
export const ARR = 0b000000100; // 4

/**
 * Allow partial objects like `{"a": 1, "b":` to be parsed as `{"a": 1}`
 */
export const OBJ = 0b000001000; // 8

/**
 * Allow `nu` to be parsed as `null`
 */
export const NULL = 0b000010000; // 16

/**
 * Allow `tr` to be parsed as `true`, and `fa` to be parsed as `false`
 */
export const BOOL = 0b000100000; // 32

/**
 * Allow `Na` to be parsed as `NaN`
 */
export const NAN = 0b001000000; // 64

/**
 * Allow `Inf` to be parsed as `Infinity`
 */
export const INFINITY = 0b010000000; // 128

/**
 * Allow `-Inf` to be parsed as `-Infinity`
 */
export const _INFINITY = 0b100000000; // 256

/**
 * Allow partial parsing of the outermost JSON object
 */
export const OUTERMOST_OBJ = 0b0000000100000000; // 512

/**
 * Allow partial parsing of the outermost JSON array
 */
export const OUTERMOST_ARR = 0b0000001000000000; // 1024

export const INF = INFINITY | _INFINITY; // 384
export const SPECIAL = NULL | BOOL | INF | NAN; // 432
export const ATOM = STR | NUM | SPECIAL; // 499
export const COLLECTION = ARR | OBJ; // 12
export const ALL = ATOM | COLLECTION; // 511

/**
 * Control what types you allow to be partially parsed.
 * The default is to allow all types to be partially parsed, which in most cases is the best option.
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
export const Allow = {
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
  INF,
  SPECIAL,
  ATOM,
  COLLECTION,
  ALL,
};

export default Allow;
