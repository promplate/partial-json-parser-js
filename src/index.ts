import { Allow } from "./options";
export * from "./options";

class PartialJSON extends Error {}

class MalformedJSON extends Error {}

/**
 * Parse incomplete JSON
 * @param {string} jsonString Partial JSON to be parsed
 * @param {number} allowPartial Specify what types are allowed to be partial, see {@link Allow} for details
 * @returns The parsed JSON
 * @throws {PartialJSON} If the JSON is incomplete (related to the `allow` parameter)
 * @throws {MalformedJSON} If the JSON is malformed
 */
function parseJSON(jsonString: string, allowPartial: number = Allow.ALL): any {
  if (typeof jsonString !== "string") {
    throw new TypeError(`expecting string, got ${typeof jsonString}`);
  }
  if (!jsonString.trim()) {
    throw new Error(`Input is empty`);
  }
  return _parseJSON(jsonString.trim(), allowPartial);
}

const _parseJSON = (jsonString: string, allow: number) => {
  const length = jsonString.length;
  let index = 0;
  let objectDepth = 0; // Track the current depth of objects
  let arrayDepth = 0; // Track the current depth of arrays

  const markPartialJSON = (msg: string) => {
    throw new PartialJSON(`${msg} at position ${index}`);
  };

  const throwMalformedError = (msg: string) => {
    throw new MalformedJSON(`${msg} at position ${index}`);
  };

  const parseAny: () => any = () => {
    skipBlank();
    if (index >= length) markPartialJSON("Unexpected end of input");
    const currentChar = jsonString[index];

    // Handle string
    if (currentChar === '"') return parseStr();

    // Handle object
    if (currentChar === "{") {
      objectDepth++;
      const result = parseObj();
      objectDepth--;
      return result;
    }

    // Handle array
    if (currentChar === "[") {
      arrayDepth++;
      const result = parseArr();
      arrayDepth--;
      return result;
    }

    // Handle literals and numbers
    if (
      jsonString.substring(index, index + 4) === "null" ||
      (Allow.NULL & allow &&
        length - index < 4 &&
        "null".startsWith(jsonString.substring(index)))
    ) {
      index += 4;
      return null;
    }
    if (
      jsonString.substring(index, index + 4) === "true" ||
      (Allow.BOOL & allow &&
        length - index < 4 &&
        "true".startsWith(jsonString.substring(index)))
    ) {
      index += 4;
      return true;
    }
    if (
      jsonString.substring(index, index + 5) === "false" ||
      (Allow.BOOL & allow &&
        length - index < 5 &&
        "false".startsWith(jsonString.substring(index)))
    ) {
      index += 5;
      return false;
    }
    if (
      jsonString.substring(index, index + 8) === "Infinity" ||
      (Allow.INFINITY & allow &&
        length - index < 8 &&
        "Infinity".startsWith(jsonString.substring(index)))
    ) {
      index += 8;
      return Infinity;
    }
    if (
      jsonString.substring(index, index + 9) === "-Infinity" ||
      (Allow._INFINITY & allow &&
        1 < length - index &&
        length - index < 9 &&
        "-Infinity".startsWith(jsonString.substring(index)))
    ) {
      index += 9;
      return -Infinity;
    }
    if (
      jsonString.substring(index, index + 3) === "NaN" ||
      (Allow.NAN & allow &&
        length - index < 3 &&
        "NaN".startsWith(jsonString.substring(index)))
    ) {
      index += 3;
      return NaN;
    }
    return parseNum();
  };

  const parseStr: () => string = () => {
    const start = index;
    let escape = false;
    index++; // skip initial quote
    while (index < length) {
      const char = jsonString[index];
      if (char === '"' && !escape) {
        index++; // include the closing quote
        try {
          return JSON.parse(jsonString.substring(start, index));
        } catch (e) {
          throwMalformedError(`Invalid string: ${e}`);
        }
      }
      if (char === "\\" && !escape) {
        escape = true;
      } else {
        escape = false;
      }
      index++;
    }
    // If we reach here, the string was unterminated
    if (Allow.STR & allow) {
      try {
        // Attempt to close the string by adding the closing quote
        return JSON.parse(jsonString.substring(start, index) + '"');
      } catch (e) {
        // Attempt to recover by removing trailing backslashes
        const lastBackslash = jsonString.lastIndexOf("\\");
        if (lastBackslash > start) {
          try {
            return JSON.parse(jsonString.substring(start, lastBackslash) + '"');
          } catch (_) {}
        }
        throwMalformedError("Unterminated string literal");
      }
    }
    markPartialJSON("Unterminated string literal");
  };

  const parseObj = () => {
    const isOutermost = objectDepth === 1;
    index++; // skip initial brace
    skipBlank();
    const obj: Record<string, any> = {};
    try {
      while (jsonString[index] !== "}") {
        skipBlank();
        if (index >= length) {
          if (
            (isOutermost && allow & Allow.OUTERMOST_OBJ) ||
            allow & Allow.OBJ
          ) {
            return obj;
          }
          markPartialJSON("Unexpected end of object");
        }
        // Parse key
        const key = parseStr();
        skipBlank();
        if (jsonString[index] !== ":") {
          throwMalformedError(`Expected ':' after key "${key}"`);
        }
        index++; // skip colon
        skipBlank();
        // Parse value
        try {
          const value = parseAny();
          obj[key] = value;
        } catch (e) {
          if (
            (isOutermost && allow & Allow.OUTERMOST_OBJ) ||
            allow & Allow.OBJ
          ) {
            return obj;
          }
          throw e;
        }
        skipBlank();
        // Handle comma or end of object
        if (jsonString[index] === ",") {
          index++; // skip comma
          skipBlank();
          // If next character is '}', it's the end of the object
          if (jsonString[index] === "}") {
            break;
          }
        }
      }
    } catch (e) {
      if ((isOutermost && allow & Allow.OUTERMOST_OBJ) || allow & Allow.OBJ) {
        return obj;
      } else {
        markPartialJSON("Expected '}' at end of object");
      }
    }
    if (jsonString[index] === "}") {
      index++; // skip final brace
      return obj;
    }
    // If we reach here, the object was not properly closed
    if ((isOutermost && allow & Allow.OUTERMOST_OBJ) || allow & Allow.OBJ) {
      return obj;
    }
    markPartialJSON("Expected '}' at end of object");
  };

  const parseArr = () => {
    const isOutermost = arrayDepth === 1;
    index++; // skip initial bracket
    const arr: any[] = [];
    try {
      while (jsonString[index] !== "]") {
        skipBlank();
        if (index >= length) {
          if (
            (isOutermost && allow & Allow.OUTERMOST_ARR) ||
            allow & Allow.ARR
          ) {
            return arr;
          }
          markPartialJSON("Unexpected end of array");
        }
        // Parse value
        const value = parseAny();
        arr.push(value);
        skipBlank();
        // Handle comma or end of array
        if (jsonString[index] === ",") {
          index++; // skip comma
          skipBlank();
          // If next character is ']', it's the end of the array
          if (jsonString[index] === "]") {
            break;
          }
        }
      }
    } catch (e) {
      if ((isOutermost && allow & Allow.OUTERMOST_ARR) || allow & Allow.ARR) {
        return arr;
      }
      throw e;
    }
    if (jsonString[index] === "]") {
      index++; // skip final bracket
      return arr;
    }
    // If we reach here, the array was not properly closed
    if ((isOutermost && allow & Allow.OUTERMOST_ARR) || allow & Allow.ARR) {
      return arr;
    }
    markPartialJSON("Expected ']' at end of array");
  };

  const parseNum = () => {
    const start = index;

    // Handle negative sign
    if (jsonString[index] === "-") index++;

    // Integral part
    while (index < length && /[0-9]/.test(jsonString[index])) {
      index++;
    }

    // Fractional part
    if (jsonString[index] === ".") {
      index++;
      while (index < length && /[0-9]/.test(jsonString[index])) {
        index++;
      }
    }

    // Exponent part
    if (jsonString[index] === "e" || jsonString[index] === "E") {
      index++;
      if (jsonString[index] === "+" || jsonString[index] === "-") {
        index++;
      }
      while (index < length && /[0-9]/.test(jsonString[index])) {
        index++;
      }
    }

    const numStr = jsonString.substring(start, index);

    try {
      return JSON.parse(numStr);
    } catch (e) {
      if (Allow.NUM & allow) {
        // Attempt to parse the valid part of the number
        const validMatch = numStr.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
        if (validMatch && validMatch[0]) {
          try {
            return JSON.parse(validMatch[0]);
          } catch (_) {}
        }
      }
      throwMalformedError(`Invalid number '${numStr}'`);
    }
  };

  const skipBlank = () => {
    while (index < length && " \n\r\t".includes(jsonString[index])) {
      index++;
    }
  };

  const result = parseAny();
  skipBlank();

  if (index < length) {
    throwMalformedError(`Unexpected token '${jsonString[index]}'`);
  }

  return result;
};

const parse = parseJSON;

export { parse, parseJSON, PartialJSON, MalformedJSON, Allow };
