import { Transform } from "prosemirror-transform";
import { Node } from "prosemirror-model";


export function removeMarks(doc: Node) {
    const tr = new Transform(doc);
    tr.removeMark(0, doc.nodeSize - 2);
    return tr.doc;
}
