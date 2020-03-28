import pmTestBuilder from "prosemirror-test-builder";
import { strict as assert } from "assert";
import { recreateTransform, Options } from "../../src/recreateTransform";
const { doc, blockquote, h1, h2, p, em, strong } = pmTestBuilder;


function testRecreate(startDoc, endDoc, steps = [], options: Options = {}) {
    const tr = recreateTransform(startDoc, endDoc, options);
    assert.equal(JSON.stringify(tr.steps.map(step => step.toJSON())), JSON.stringify(steps));
}


describe("recreate Transform - simple node diffs", () => {
    it("add em", () =>
        testRecreate(
            doc(p("Before textitalicAfter text")),
            doc(p("Before text", em("italic"), "After text")),
            [{
                stepType: "replace",
                from: 12,
                to: 18,
                slice: {
                    content: [{
                        type: "text",
                        marks: [{
                            type: "em"
                        }],
                        text: "italic"
                    }]
                }
            }],
            { complexSteps: false }
        )
    );

    it("remove strong", () =>
        testRecreate(
            doc(p("Before text", strong("bold"), "After text")),
            doc(p("Before textboldAfter text")),
            [{
                stepType: "replace",
                from: 12,
                to: 16,
                slice: {
                    content: [{
                        type: "text",
                        text: "bold"
                    }]
                }
            }],
            { complexSteps: false }
        )
    );

    it("wrap in blockquote", () =>
        testRecreate(
            doc(p("A quoted sentence")),
            doc(blockquote(p("A quoted sentence"))),
            [{
                stepType: "replace",
                from: 0,
                to: 19,
                slice: {
                    content: [{
                        type: "blockquote",
                        content: [{
                            type: "paragraph",
                            content: [{
                                type: "text",
                                text: "A quoted sentence"
                            }]
                        }]
                    }]
                }
            }],
            { complexSteps: false }
        )
    );

    it("unwrap from blockquote", () =>
        testRecreate(
            doc(blockquote(p("A quoted sentence"))),
            doc(p("A quoted sentence")),
            [{
                stepType: "replace",
                from: 0,
                to: 21,
                slice: {
                    content: [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            text: "A quoted sentence"
                        }]
                    }]
                }
            }],
            { complexSteps: false }
        )
    );

    it("change headline type", () =>
        testRecreate(
            doc(h1("A title")),
            doc(h2("A title")),
            [{
                stepType: "replace",
                from: 0,
                to: 9,
                slice: {
                    content: [{
                        type: "heading",
                        attrs: {
                            level: 2
                        },
                        content: [{
                            type: "text",
                            text: "A title"
                        }]
                    }]
                }
            }],
            { complexSteps: false }
        )
    );
});
