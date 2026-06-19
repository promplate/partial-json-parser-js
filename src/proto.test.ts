import { describe, expect, it } from "vitest";
import { parse } from "./index";

describe("object key parsing", () => {
    it("preserves __proto__ as an own enumerable key", () => {
        const value = parse('{"__proto__":0}');
        const descriptor = Object.getOwnPropertyDescriptor(value, "__proto__");

        expect(descriptor).toMatchObject({
            value: 0,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    });
});
