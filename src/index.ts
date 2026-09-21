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
        throw new TypeError(`expecting str, got ${typeof jsonString}`);
    }
    if (!jsonString.trim()) {
        throw new Error(`${jsonString} is empty`);
    }
    // Trailing whitespace may belong to an unfinished string value.
    return _parseJSON(jsonString.trimStart(), allowPartial);
}

const _parseJSON = (jsonString: string, allow: number) => {
    const length = jsonString.length;
    let index = 0;

    const markPartialJSON = (msg: string) => {
        throw new PartialJSON(`${msg} at position ${index}`);
    };

    const throwMalformedError = (msg: string) => {
        throw new MalformedJSON(`${msg} at position ${index}`);
    };

    const isPartialJSON = (e: unknown) => e instanceof PartialJSON;

    const parseAny: () => any = () => {
        skipBlank();
        if (index >= length) markPartialJSON("Unexpected end of input");
        if (jsonString[index] === '"') return parseStr();
        if (jsonString[index] === "{") return parseObj();
        if (jsonString[index] === "[") return parseArr();
        if (jsonString.substring(index, index + 4) === "null" || (Allow.NULL & allow && length - index < 4 && "null".startsWith(jsonString.substring(index)))) {
            index += 4;
            return null;
        }
        if (jsonString.substring(index, index + 4) === "true" || (Allow.BOOL & allow && length - index < 4 && "true".startsWith(jsonString.substring(index)))) {
            index += 4;
            return true;
        }
        if (jsonString.substring(index, index + 5) === "false" || (Allow.BOOL & allow && length - index < 5 && "false".startsWith(jsonString.substring(index)))) {
            index += 5;
            return false;
        }
        if (jsonString.substring(index, index + 8) === "Infinity" || (Allow.INFINITY & allow && length - index < 8 && "Infinity".startsWith(jsonString.substring(index)))) {
            index += 8;
            return Infinity;
        }
        if (jsonString.substring(index, index + 9) === "-Infinity" || (Allow._INFINITY & allow && 1 < length - index && length - index < 9 && "-Infinity".startsWith(jsonString.substring(index)))) {
            index += 9;
            return -Infinity;
        }
        if (jsonString.substring(index, index + 3) === "NaN" || (Allow.NAN & allow && length - index < 3 && "NaN".startsWith(jsonString.substring(index)))) {
            index += 3;
            return NaN;
        }
        return parseNum();
    };

    const parseStr: () => string = () => {
        const start = index;
        let escape = false;
        index++; // skip initial quote
        while (index < length && (jsonString[index] !== '"' || (escape && jsonString[index - 1] === "\\"))) {
            escape = jsonString[index] === "\\" ? !escape : false;
            index++;
        }
        if (jsonString.charAt(index) == '"') {
            try {
                return JSON.parse(jsonString.substring(start, ++index - Number(escape)));
            } catch (e) {
                throwMalformedError(String(e));
            }
        } else if (Allow.STR & allow) {
            try {
                return JSON.parse(jsonString.substring(start, index - Number(escape)) + '"');
            } catch (e) {
                // SyntaxError: Invalid escape sequence
                return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("\\")) + '"');
            }
        }
        markPartialJSON("Unterminated string literal");
    };

    const parseObj = () => {
        index++; // skip initial brace
        skipBlank();
        const obj: Record<string, any> = {};
        try {
            while (jsonString[index] !== "}") {
                skipBlank();
                if (index >= length) markPartialJSON("Expected an object key");
                if (jsonString[index] !== '"') throwMalformedError("Expected a quoted object key");
                const key = parseStr();
                skipBlank();
                if (index >= length) markPartialJSON("Expected ':' after object key");
                if (jsonString[index] !== ":") throwMalformedError("Expected ':' after object key");
                index++; // skip colon
                try {
                    const value = parseAny();
                    obj[key] = value;
                } catch (e) {
                    if (Allow.OBJ & allow && isPartialJSON(e)) return obj;
                    throw e;
                }
                skipBlank();
                if (jsonString[index] === ",") {
                    index++; // skip comma
                    skipBlank();
                } else if (index < length && jsonString[index] !== "}") {
                    throwMalformedError("Expected ',' or '}' after object value");
                }
            }
        } catch (e) {
            if (!isPartialJSON(e)) throw e;
            if (Allow.OBJ & allow) return obj;
            markPartialJSON("Expected '}' at end of object");
        }
        index++; // skip final brace
        return obj;
    };

    const parseArr = () => {
        index++; // skip initial bracket
        skipBlank();
        const arr = [];
        try {
            while (jsonString[index] !== "]") {
                arr.push(parseAny());
                skipBlank();
                if (jsonString[index] === ",") {
                    index++; // skip comma
                    skipBlank();
                } else if (index < length && jsonString[index] !== "]") {
                    throwMalformedError("Expected ',' or ']' after array value");
                }
            }
        } catch (e) {
            if (!isPartialJSON(e)) throw e;
            if (Allow.ARR & allow) {
                return arr;
            }
            markPartialJSON("Expected ']' at end of array");
        }
        index++; // skip final bracket
        return arr;
    };

    const parseNum = () => {
        const start = index;
        while (index < length && !",]} \n\r\t".includes(jsonString[index])) index++;
        const token = jsonString.substring(start, index);
        const atEnd = index === length;

        let value;
        try {
            value = JSON.parse(token);
        } catch (e) {
            if (token === "-" && atEnd && start > 0) markPartialJSON("Not sure what '-' is");
            if (atEnd) {
                const partial = token.match(/^(-?(?:0|[1-9]\d*)(?:\.\d+)?)[eE][+-]?$/)
                    ?? token.match(/^(-?(?:0|[1-9]\d*))\.$/);
                if (partial) {
                    if (Allow.NUM & allow) return JSON.parse(partial[1]);
                    if (start > 0) markPartialJSON("Unterminated number literal");
                }
            }
            throwMalformedError(String(e));
        }
        // Only valid numeric tokens can be incomplete streaming numbers.
        if (start > 0 && atEnd && !(Allow.NUM & allow)) markPartialJSON("Unterminated number literal");
        return value;
    };

    const skipBlank = () => {
        while (index < length && " \n\r\t".includes(jsonString[index])) {
            index++;
        }
    };
    const value = parseAny();
    skipBlank();
    if (index < length) throwMalformedError("Unexpected content after JSON value");
    return value;
};

const parse = parseJSON;

export { parse, parseJSON, PartialJSON, MalformedJSON, Allow };
