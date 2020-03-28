import { Transform } from "prosemirror-transform";
import { Node, Schema } from "prosemirror-model";
import { Operation } from "rfc6902";
import { AnyObject } from "./types";
export interface Options {
    complexSteps?: boolean;
    wordDiffs?: boolean;
}
export declare class RecreateTransform {
    fromDoc: Node;
    toDoc: Node;
    complexSteps: boolean;
    wordDiffs: boolean;
    schema: Schema;
    tr: Transform;
    currentJSON: AnyObject;
    finalJSON: AnyObject;
    ops: Array<Operation>;
    constructor(fromDoc: Node, toDoc: Node, options?: Options);
    init(): Transform<any>;
    /** convert json-diff to prosemirror steps */
    recreateChangeContentSteps(): void;
    recreateChangeMarkSteps(): void;
    marklessDoc(doc: any): Node<any>;
    addReplaceStep(toDoc: any, afterStepJSON: any): boolean;
    /** update node with attrs and marks, may also change type */
    addSetNodeMarkup(): void;
    /** perform text diff */
    addReplaceTextSteps(op: any, afterStepJSON: any): void;
    simplifyTr(): void;
}
export declare function recreateTransform(fromDoc: any, toDoc: any, options?: Options): Transform<any>;
