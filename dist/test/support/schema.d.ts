import { Schema } from "prosemirror-model";
declare const _default: {
    create(): Schema<any, any>;
    marks: {};
    nodes: {
        doc: {
            content: string;
        };
        text: {
            group: string;
        };
        paragraph: {
            content: string;
            group: string;
            draggable: boolean;
            parseDOM: {
                tag: string;
            }[];
            toDOM: () => (string | number)[];
        };
        widget_a: {
            content: string;
            group: string;
            marks: string;
            code: boolean;
            defining: boolean;
            attrs: {
                first: {
                    default: string;
                };
                aSecond: {
                    default: string;
                };
            };
        };
        widget_b: {
            content: string;
            group: string;
            marks: string;
            code: boolean;
            defining: boolean;
            attrs: {
                first: {
                    default: string;
                };
                bSecond: {
                    default: string;
                };
                third: {
                    default: string;
                };
            };
        };
    };
};
export default _default;
