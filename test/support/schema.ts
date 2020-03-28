import { Schema } from "prosemirror-model";

export default {
    create() {
        return new Schema({
            nodes: this.nodes,
            marks: this.marks
        });
    },
    marks: {},
    nodes: {
        doc: {
            content: "(block)+"
        },
        text: {
            group: "inline"
        },
        paragraph: {
            content: "text*",
            group: "block",
            draggable: false,
            parseDOM: [{ tag: "p" }],
            toDOM: () => ["p", 0]
        },
        widget_a: {
            content: "text*",
            group: "block",
            marks: "",
            code: true,
            defining: true,
            attrs: {
                first: { default: "" },
                aSecond: { default: "" }
            }
        },
        widget_b: {
            content: "text*",
            group: "block",
            marks: "",
            code: true,
            defining: true,
            attrs: {
                first: { default: "" },
                bSecond: { default: "" },
                third: { default: "" }
            }
        }
    }
};
