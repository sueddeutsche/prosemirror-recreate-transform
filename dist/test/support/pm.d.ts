import { Node } from "prosemirror-model";
import { AnyObject } from "../../src/types";
export declare function doc(...content: any[]): Node<import("prosemirror-model").Schema<any, any>>;
export declare function node(type: string, attrs: AnyObject, ...content: any[]): {
    type: string;
    attrs: AnyObject;
    content: any[];
};
export declare function p(...content: any[]): {
    type: string;
    content: any[];
};
export declare function t(text: string): {
    type: string;
    text: string;
};
