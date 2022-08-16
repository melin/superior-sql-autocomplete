import { Interval } from "antlr4ts/misc/Interval";
export declare class CaseChangingStream {
    _stream: any;
    _upper: any;
    get index(): any;
    get size(): any;
    get sourceName(): any;
    constructor(stream: any, upper: any);
    LA(offset: any): any;
    reset(): any;
    consume(): any;
    LT(offset: any): any;
    mark(): any;
    release(marker: any): any;
    seek(_index: any): any;
    getText(interval: Interval): string;
    toString(): any;
}
