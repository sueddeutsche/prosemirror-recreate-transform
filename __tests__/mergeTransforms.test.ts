/* eslint max-len: "off" */
import pmTestBuilder from "prosemirror-test-builder";
import { strict as assert } from "assert";
import { recreateTransform } from "../src/recreateTransform";
import { mergeTransforms } from "../src/mergeTransforms";
const { doc, h1, h2, p, em, strong } = pmTestBuilder;

interface Options {
    complexSteps?: boolean;
    wordDiffs?: boolean;
    automerge?: boolean;
    rebase?: boolean;
}


function testMerge(startDoc, endDoc1, endDoc2, automergeSteps, conflictingSteps1, conflictingSteps2, options: Options = {}) {
    const tr1 = recreateTransform(startDoc, endDoc1, options);
    const tr2 = recreateTransform(startDoc, endDoc2, options);

    const merge = mergeTransforms(tr1, tr2, options.automerge, options.rebase, options.wordDiffs);

    assert.equal(
        JSON.stringify(merge.tr.steps.map(step => step.toJSON()), null, 2),
        JSON.stringify(automergeSteps, null, 2)
    );

    assert.equal(
        JSON.stringify(merge.merge.conflictingSteps1.map(step => (step[1] ? step[1].toJSON() : false)).filter(step => step), null, 2),
        JSON.stringify(conflictingSteps1, null, 2)
    );

    assert.equal(
        JSON.stringify(merge.merge.conflictingSteps2.map(step => (step[1] ? step[1].toJSON() : false)).filter(step => step), null, 2),
        JSON.stringify(conflictingSteps2, null, 2)
    );
}


describe("mergeTransforms", () => {

    describe("textMerges", () => {

        it("default options", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [{
                    stepType: "replace",
                    from: 30,
                    to: 30,
                    slice: {
                        content: [{
                            type: "text",
                            text: "."
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 1,
                    to: 2,
                    slice: {
                        content: [{
                            type: "text",
                            text: "t"
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 14,
                    slice: {
                        content: [{
                            type: "text",
                            text: "cha"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 15,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "ged"
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 18,
                    slice: {
                        content: [{
                            type: "text",
                            text: "s"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 19,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "me"
                        }]
                    }
                }]
            )
        );

        it("no automerge", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 14,
                    slice: {
                        content: [{
                            type: "text",
                            text: "cha"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 15,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "ged"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 30,
                    to: 30,
                    slice: {
                        content: [{
                            type: "text",
                            text: "."
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 1,
                    to: 2,
                    slice: {
                        content: [{
                            type: "text",
                            text: "t"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 13,
                    to: 18,
                    slice: {
                        content: [{
                            type: "text",
                            text: "s"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 19,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "me"
                        }]
                    }
                }],
                { automerge: false }
            )
        );

        it("worddiffs", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [{
                    stepType: "replace",
                    from: 30,
                    to: 30,
                    slice: {
                        content: [{
                            type: "text",
                            text: "."
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 1,
                    to: 5,
                    slice: {
                        content: [{
                            type: "text",
                            text: "this"
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "changed"
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "same"
                        }]
                    }
                }],
                { wordDiffs: true }
            )
        );

        it("rebase", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [{
                    stepType: "replace",
                    from: 1,
                    to: 2,
                    slice: {
                        content: [{
                            type: "text",
                            text: "t"
                        }]
                    }
                }],
                [],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 15,
                    slice: {
                        content: [{
                            type: "text",
                            text: "s"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 16,
                    to: 18,
                    slice: {
                        content: [{
                            type: "text",
                            text: "m"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 19,
                    to: 20
                }],
                { rebase: true }
            )
        );

        it("rebase & wordDiff", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [{
                    stepType: "replace",
                    from: 1,
                    to: 5,
                    slice: {
                        content: [{
                            type: "text",
                            text: "this"
                        }]
                    }
                }],
                [],
                [{
                    stepType: "replace",
                    from: 13,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "same"
                        }]
                    }
                }],
                { rebase: true, wordDiffs: true }
            )
        );

        it("rebase, wordDiff & no automerge", () =>
            testMerge(
                doc(p("This is the initial text line")),
                doc(p("This is the changed text line.")),
                doc(p("this is the same text line")),
                [],
                [],
                [{
                    stepType: "replace",
                    from: 1,
                    to: 5,
                    slice: {
                        content: [{
                            type: "text",
                            text: "this"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 13,
                    to: 20,
                    slice: {
                        content: [{
                            type: "text",
                            text: "same"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 30,
                    to: 31
                }],
                { rebase: true, wordDiffs: true, automerge: false }
            )
        );
    });

    describe("complex merges", () => {
        // prosemirror changeset had a major change, thus mapping (deletions and insertions)
        // have to be figured out again. But we can ignore this currently, since mergeTransforms is not used.
        it.skip("Change of contents and structure", () =>
            testMerge(
                doc(h1("The title"), p("The fish are ", em("great!"))),
                doc(h2("A different title"), p("A ", strong("different"), " sentence.")),
                doc(p("Yet another ", em("first"), " line."), p("With a second line that is not styled.")),
                [{
                    stepType: "removeMark",
                    mark: {
                        type: "em"
                    },
                    from: 27,
                    to: 28
                }, {
                    stepType: "removeMark",
                    mark: {
                        type: "em"
                    },
                    from: 29,
                    to: 30
                }, {
                    stepType: "replace",
                    from: 5,
                    to: 6,
                    slice: {
                        content: [{
                            type: "text",
                            text: "f"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 7,
                    to: 7,
                    slice: {
                        content: [{
                            type: "text",
                            text: "rs"
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 10,
                    to: 10,
                    slice: {
                        content: [{
                            type: "text",
                            text: " "
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 12,
                    to: 12,
                    slice: {
                        content: [{
                            type: "text",
                            text: "in"
                        }]
                    }
                }, {
                    stepType: "addMark",
                    mark: {
                        type: "em"
                    },
                    from: 5,
                    to: 10
                }, {
                    stepType: "removeMark",
                    mark: {
                        type: "em"
                    },
                    from: 32,
                    to: 33
                }, {
                    stepType: "removeMark",
                    mark: {
                        type: "em"
                    },
                    from: 33,
                    to: 35
                }],
                [{
                    stepType: "replace",
                    from: 0,
                    to: 16,
                    slice: {
                        content: [{
                            type: "heading",
                            attrs: {
                                level: 2
                            },
                            content: [{
                                type: "text",
                                text: "The title"
                            }]
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 22,
                    to: 34,
                    slice: {
                        content: [{
                            type: "text",
                            text: "A"
                        }]
                    }
                }],
                [{
                    stepType: "replace",
                    from: 0,
                    to: 16,
                    slice: {
                        content: [{
                            type: "paragraph",
                            content: [{
                                type: "text",
                                text: "The "
                            }, {
                                type: "text",
                                marks: [{
                                    type: "em"
                                }],
                                text: "first"
                            }, {
                                type: "text",
                                text: " line"
                            }]
                        }]
                    }
                }, {
                    stepType: "replace",
                    from: 17,
                    to: 36,
                    slice: {
                        content: [{
                            type: "text",
                            text: "With a second line that is not styled."
                        }]
                    }
                }]
            )
        );
    });
});
