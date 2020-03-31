import { ReplaceStep } from "prosemirror-transform";
import { Node } from "prosemirror-model";
export declare function getReplaceStep(fromDoc: Node, toDoc: Node): false | ReplaceStep<any>;
