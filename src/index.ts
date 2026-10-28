import { Allow } from "./options";
export * from "./options";

class PartialJSON extends Error {}

class MalformedJSON extends Error {}

const literals = [
    ["null", Allow.NULL, null, 1],
    ["true", Allow.BOOL, true, 1],
    ["false", Allow.BOOL, false, 1],
    ["Infinity", Allow.INFINITY, Infinity, 1],
    ["-Infinity", Allow._INFINITY, -Infinity, 2],
    ["NaN", Allow.NAN, NaN, 1],
] as const;

const notLiteral = Symbol("notLiteral");

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
    return _parseJSON(jsonString.trim(), allowPartial);
}

class Parser {
    private index = 0;

    constructor(
        private jsonString: string,
        private allow: number,
    ) {}

    parseAny(): any {
        this.skipBlank();
        if (this.index >= this.jsonString.length) this.markPartialJSON("Unexpected end of input");
        if (this.jsonString[this.index] === '"') return this.parseStr();
        if (this.jsonString[this.index] === "{") return this.parseObj();
        if (this.jsonString[this.index] === "[") return this.parseArr();
        const literal = this.parseLiteral();
        if (literal !== notLiteral) return literal;
        return this.parseNum();
    }

    private parseLiteral() {
        if (!"ntfI-N".includes(this.jsonString[this.index])) return notLiteral;
        const rest = this.jsonString.substring(this.index);
        for (const [text, flag, value, minLength] of literals) {
            if (rest.substring(0, text.length) === text || (flag & this.allow && rest.length < text.length && rest.length >= minLength && text.startsWith(rest))) {
                this.index += text.length;
                return value;
            }
        }
        return notLiteral;
    }

    private parseStr(): string {
        const start = this.index;
        this.index++; // skip initial quote
        const escape = this.scanString();
        if (this.jsonString.charAt(this.index) == '"') {
            try {
                return JSON.parse(this.jsonString.substring(start, ++this.index - Number(escape)));
            } catch (e) {
                this.throwMalformedError(String(e));
            }
        } else if (Allow.STR & this.allow) {
            try {
                return JSON.parse(this.jsonString.substring(start, this.index - Number(escape)) + '"');
            } catch (e) {
                // SyntaxError: Invalid escape sequence
                return JSON.parse(this.jsonString.substring(start, this.jsonString.lastIndexOf("\\")) + '"');
            }
        }
        this.markPartialJSON("Unterminated string literal");
    }

    private scanString() {
        let escape = false;
        while (this.index < this.jsonString.length && (this.jsonString[this.index] !== '"' || (escape && this.jsonString[this.index - 1] === "\\"))) {
            escape = this.jsonString[this.index] === "\\" ? !escape : false;
            this.index++;
        }
        return escape;
    }

    private parseObj() {
        this.index++; // skip initial brace
        this.skipBlank();
        const obj: Record<string, any> = {};
        try {
            while (this.jsonString[this.index] !== "}") {
                if (this.parseObjEntry(obj)) return obj;
                this.skipBlank();
                if (this.jsonString[this.index] === ",") this.index++; // skip comma
            }
        } catch (e) {
            if (Allow.OBJ & this.allow) return obj;
            else this.markPartialJSON("Expected '}' at end of object");
        }
        this.index++; // skip final brace
        return obj;
    }

    private parseObjEntry(obj: Record<string, any>) {
        this.skipBlank();
        if (this.index >= this.jsonString.length && Allow.OBJ & this.allow) return true;
        const key = this.parseStr();
        this.skipBlank();
        this.index++; // skip colon
        try {
            obj[key] = this.parseAny();
        } catch (e) {
            if (Allow.OBJ & this.allow) return true;
            else throw e;
        }
        return false;
    }

    private parseArr() {
        this.index++; // skip initial bracket
        const arr = [];
        try {
            while (this.jsonString[this.index] !== "]") {
                arr.push(this.parseAny());
                this.skipBlank();
                if (this.jsonString[this.index] === ",") {
                    this.index++; // skip comma
                }
            }
        } catch (e) {
            if (Allow.ARR & this.allow) {
                return arr;
            }
            this.markPartialJSON("Expected ']' at end of array");
        }
        this.index++; // skip final bracket
        return arr;
    }

    private parseNum() {
        return this.index === 0 ? this.parseRootNum() : this.parseNestedNum();
    }

    private parseRootNum() {
        if (this.jsonString === "-") this.throwMalformedError("Not sure what '-' is");
        try {
            return JSON.parse(this.jsonString);
        } catch (e) {
            if (Allow.NUM & this.allow) {
                try {
                    return this.parseNumBeforeExponent(0);
                } catch (e) {}
            }
            this.throwMalformedError(String(e));
        }
    }

    private parseNestedNum() {
        const start = this.index;
        if (this.jsonString[this.index] === "-") this.index++;
        while (this.jsonString[this.index] && ",]}".indexOf(this.jsonString[this.index]) === -1) this.index++;
        if (this.index == this.jsonString.length && !(Allow.NUM & this.allow)) this.markPartialJSON("Unterminated number literal");
        try {
            return JSON.parse(this.jsonString.substring(start, this.index));
        } catch (e) {
            if (this.jsonString.substring(start, this.index) === "-") this.markPartialJSON("Not sure what '-' is");
            return this.parseNumBeforeExponent(start);
        }
    }

    private parseNumBeforeExponent(start: number) {
        try {
            return JSON.parse(this.jsonString.substring(start, this.jsonString.lastIndexOf("e")));
        } catch (e) {
            this.throwMalformedError(String(e));
        }
    }

    private skipBlank() {
        while (this.index < this.jsonString.length && " \n\r\t".includes(this.jsonString[this.index])) {
            this.index++;
        }
    }

    private markPartialJSON(msg: string): never {
        throw new PartialJSON(`${msg} at position ${this.index}`);
    }

    private throwMalformedError(msg: string): never {
        throw new MalformedJSON(`${msg} at position ${this.index}`);
    }
}

const _parseJSON = (jsonString: string, allow: number) => new Parser(jsonString, allow).parseAny();

const parse = parseJSON;

export { parse, parseJSON, PartialJSON, MalformedJSON, Allow };
