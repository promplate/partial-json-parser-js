export const STR = 0b000000001;
export const NUM = 0b000000010;
export const ARR = 0b000000100;
export const OBJ = 0b000001000;
export const NULL = 0b000010000;
export const BOOL = 0b000100000;
export const NAN = 0b001000000;
export const INFINITY = 0b010000000;
export const _INFINITY = 0b100000000;

export const INF = INFINITY | _INFINITY;
export const SPECIAL = NULL | BOOL | INF | NAN;
export const ATOM = STR | NUM | SPECIAL;
export const COLLECTION = ARR | OBJ;
export const ALL = ATOM | COLLECTION;

export const Allow = { STR, NUM, ARR, OBJ, NULL, BOOL, NAN, INFINITY, _INFINITY, INF, SPECIAL, ATOM, COLLECTION, ALL };

export default Allow;
