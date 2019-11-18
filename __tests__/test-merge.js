import {doc, blockquote, h1, h2, p, em, strong} from "prosemirror-test-builder"
import ist from "ist"

import {recreateTransform, mergeTransforms} from "../src/index"


function testMerge(startDoc, endDoc1, endDoc2, automergeSteps, conflictingSteps1, conflictingSteps2, options = {}) {
    const tr1 = recreateTransform(startDoc, endDoc1, options.complexSteps, options.wordDiffs),
        tr2 = recreateTransform(startDoc, endDoc2, options.complexSteps, options.wordDiffs)
    const merge = mergeTransforms(tr1, tr2, options.automerge, options.rebase, options.wordDiffs)
    ist(JSON.stringify(merge.tr.steps.map(step => step.toJSON())), JSON.stringify(automergeSteps))
    ist(JSON.stringify(merge.merge.conflictingSteps1.map(step => step[1] ? step[1].toJSON() : false).filter(step => step)), JSON.stringify(conflictingSteps1))
    ist(JSON.stringify(merge.merge.conflictingSteps2.map(step => step[1] ? step[1].toJSON() : false).filter(step => step)), JSON.stringify(conflictingSteps2))
}


describe("textMerges", () => {

    it("default options", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [{
                "stepType": "replace",
                "from": 30,
                "to": 30,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "."
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 1,
                "to": 2,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "t"
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 14,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "cha"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 15,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "ged"
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 18,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "s"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 19,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "me"
                    }]
                }
            }]
        )
    )

    it("no automerge", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 14,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "cha"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 15,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "ged"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 30,
                "to": 30,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "."
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 1,
                "to": 2,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "t"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 13,
                "to": 18,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "s"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 19,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "me"
                    }]
                }
            }],
            {automerge: false}
        )
    )

    it("worddiffs", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [{
                "stepType": "replace",
                "from": 30,
                "to": 30,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "."
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 1,
                "to": 5,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "this"
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "changed"
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "same"
                    }]
                }
            }],
            {wordDiffs: true}
        )
    )

    it.only("rebase, wordDiff, automerge, complexSteps", () =>
        testMerge(
            doc(p("Money in a big box")),
            doc(p("Money inside a shoe z")),
            doc(p("Money outsiiiide a smaaaaaall box")),
            [],
            [],
            [{
                "stepType": "replace",
                "from": 7,
                "to": 13,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "outsiiiide"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 14,
                "to": 15,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "smaaaaaallig"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 16,
                "to": 21
            }],
            {rebase: true, wordDiffs: true, automerge: true, complexSteps: true}
        )
    )


    it("rebase", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [{
                "stepType": "replace",
                "from": 1,
                "to": 2,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "t"
                    }]
                }
            }],
            [],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 15,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "s"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 16,
                "to": 18,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "m"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 19,
                "to": 20
            }],
            {rebase: true}
        )
    )

    it("rebase & wordDiff", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [{
                "stepType": "replace",
                "from": 1,
                "to": 5,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "this"
                    }]
                }
            }],
            [],
            [{
                "stepType": "replace",
                "from": 13,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "same"
                    }]
                }
            }],
            {rebase: true, wordDiffs: true}
        )
    )

    it("rebase, wordDiff & no automerge", () =>
        testMerge(
            doc(p("This is the initial text line")),
            doc(p("This is the changed text line.")),
            doc(p("this is the same text line")),
            [],
            [],
            [{
                "stepType": "replace",
                "from": 1,
                "to": 5,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "this"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 13,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "same"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 30,
                "to": 31
            }],
            {rebase: true, wordDiffs: true, automerge: false}
        )
    )
})

describe("complex merges", () => {

    it("Change of contents and structure", () =>
        testMerge(
            doc(h1("The title"), p("The fish are ", em("great!"))),
            doc(h2("A different title"), p("A ", strong("different"), " sentence.")),
            doc(p("Yet another ", em("first"), " line."), p("With a second line that is not styled.")),
            [{
                "stepType": "replaceAround",
                "from": 0,
                "to": 11,
                "gapFrom": 1,
                "gapTo": 10,
                "insert": 1,
                "slice": {
                    "content": [{
                        "type": "heading",
                        "attrs": {
                            "level": 2
                        }
                    }]
                },
                "structure": true
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 27,
                "to": 28
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 29,
                "to": 30
            }, {
                "stepType": "replace",
                "from": 5,
                "to": 6,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "f"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 7,
                "to": 7,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "rs"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 10,
                "to": 10,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": " "
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 12,
                "to": 12,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "in"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 15,
                "to": 15,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "."
                    }]
                }
            }, {
                "stepType": "addMark",
                "mark": {
                    "type": "em"
                },
                "from": 5,
                "to": 10
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 33,
                "to": 34
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 34,
                "to": 36
            }],
            [{
                "stepType": "replace",
                "from": 1,
                "to": 3,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "A diff"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 7,
                "to": 7,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "rent"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 18,
                "to": 21,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "A"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 22,
                "to": 33,
                "slice": {
                    "content": [{
                        "type": "text",
                        "marks": [{
                            "type": "strong"
                        }],
                        "text": "gr"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 22,
                "to": 37,
                "slice": {
                    "content": [{
                        "type": "text",
                        "marks": [{
                            "type": "strong"
                        }],
                        "text": "different"
                    }, {
                        "type": "text",
                        "text": " sentence."
                    }]
                }
            }],
            [{
                "stepType": "replace",
                "from": 1,
                "to": 4,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "Yet another"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 18,
                "to": 37,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "With a second line that is not styled."
                    }]
                }
            }]
        )
    )
})
