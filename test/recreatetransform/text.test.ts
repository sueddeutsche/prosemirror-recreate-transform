import pmTestBuilder from "prosemirror-test-builder";
import { strict as assert } from "assert";
import { recreateTransform, Options } from "../../src/recreateTransform";
const { doc, blockquote, p } = pmTestBuilder;


function testRecreate(startDoc, endDoc, steps = [], options: Options = {}) {
    const tr = recreateTransform(startDoc, endDoc, options);
    assert.equal(JSON.stringify(tr.steps.map(step => step.toJSON())), JSON.stringify(steps));
}


describe("recreate transform - text diffs", () => {
    it("find text diff in one text node", () =>
        testRecreate(
            doc(blockquote(p("The start text"))),
            doc(blockquote(p("The end text"))),
            [{ stepType: "replace", from: 6, to: 11, slice: { content: [{ type: "text", text: "end" }] } }]
        )
    );

    it("find text diffs in several nodes", () =>
        testRecreate(
            doc(blockquote(p("The start text"), p("The second text"))),
            doc(blockquote(p("The end text"), p("The second sentence"))),
            [{
                stepType: "replace",
                from: 6,
                to: 11,
                slice: {
                    content: [{
                        type: "text",
                        text: "end"
                    }]
                }
            }, {
                stepType: "replace",
                from: 27,
                to: 27,
                slice: {
                    content: [{
                        type: "text",
                        text: "sen"
                    }]
                }
            }, {
                stepType: "replace",
                from: 32,
                to: 34,
                slice: {
                    content: [{
                        type: "text",
                        text: "nce"
                    }]
                }
            }]
        )
    );

    it("find text diffs in several nodes using word diffs", () =>
        testRecreate(
            doc(blockquote(p("The start text"), p("The second text"))),
            doc(blockquote(p("The end text"), p("The second sentence"))),
            [{
                stepType: "replace",
                from: 6,
                to: 11,
                slice: {
                    content: [{
                        type: "text",
                        text: "end"
                    }]
                }
            }, {
                stepType: "replace",
                from: 27,
                to: 31,
                slice: {
                    content: [{
                        type: "text",
                        text: "sentence"
                    }]
                }
            }],
            { wordDiffs: true }
        )
    );

    it("find several diffs in same text node", () =>
        testRecreate(
            doc(blockquote(p("The cat is barking at the house"))),
            doc(blockquote(p("The dog is meauwing in the ship"))),
            [{
                stepType: "replace",
                from: 6,
                to: 9,
                slice: {
                    content: [{
                        type: "text",
                        text: "dog"
                    }]
                }
            }, {
                stepType: "replace",
                from: 13,
                to: 14,
                slice: {
                    content: [{
                        type: "text",
                        text: "me"
                    }]
                }
            }, {
                stepType: "replace",
                from: 16,
                to: 18,
                slice: {
                    content: [{
                        type: "text",
                        text: "uw"
                    }]
                }
            }, {
                stepType: "replace",
                from: 22,
                to: 24,
                slice: {
                    content: [{
                        type: "text",
                        text: "in"
                    }]
                }
            }, {
                stepType: "replace",
                from: 29,
                to: 29,
                slice: {
                    content: [{
                        type: "text",
                        text: "s"
                    }]
                }
            }, {
                stepType: "replace",
                from: 31,
                to: 35,
                slice: {
                    content: [{
                        type: "text",
                        text: "ip"
                    }]
                }
            }]
        )
    );

    it("find several diffs in same text using word diffs", () =>
        testRecreate(
            doc(blockquote(p("The cat is barking at the house"))),
            doc(blockquote(p("The dog is meauwing in the ship"))),
            [{
                stepType: "replace",
                from: 6,
                to: 9,
                slice: {
                    content: [{
                        type: "text",
                        text: "dog"
                    }]
                }
            }, {
                stepType: "replace",
                from: 13,
                to: 20,
                slice: {
                    content: [{
                        type: "text",
                        text: "meauwing"
                    }]
                }
            }, {
                stepType: "replace",
                from: 22,
                to: 24,
                slice: {
                    content: [{
                        type: "text",
                        text: "in"
                    }]
                }
            }, {
                stepType: "replace",
                from: 29,
                to: 34,
                slice: {
                    content: [{
                        type: "text",
                        text: "ship"
                    }]
                }
            }],
            { wordDiffs: true }
        )
    );
});
