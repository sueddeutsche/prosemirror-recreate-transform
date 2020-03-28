import { Node } from "prosemirror-model";
import schema from "../support/schema";
import { AnyObject } from "../../src/types";
const testSchema = schema.create();


export function doc(...content) {
    return Node.fromJSON(testSchema, {
        type: "doc",
        content
    });
}

export function node(type: string, attrs: AnyObject, ...content) {
    return { type, attrs, content };
}

export function p(...content) {
    return { type: "paragraph", content };
}

export function t(text: string) {
    return { type: "text", text };
}
