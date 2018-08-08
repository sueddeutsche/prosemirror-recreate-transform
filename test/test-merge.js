const {doc, blockquote, h1, h2, p, em, strong} = require("prosemirror-test-builder")
const ist = require("ist")

const {recreateTransform, mergeTransforms} = require("../dist/index")


function testMerge(startDoc, endDoc1, endDoc2, automergeSteps, conflictingSteps1, conflictingSteps2, options = {}) {
    const tr1 = recreateTransform(startDoc, endDoc1, options.complexSteps, options.wordDiffs),
        tr2 = recreateTransform(startDoc, endDoc2, options.complexSteps, options.wordDiffs)
        merge = mergeTransforms(tr1, tr2, options.automerge, options.rebase, options.wordDiffs)
    ist(JSON.stringify(merge.tr.steps.map(step => step.toJSON())), JSON.stringify(automergeSteps))
    ist(JSON.stringify(merge.merge.conflictingSteps1.map(step => step[1].toJSON())), JSON.stringify(conflictingSteps1))
    ist(JSON.stringify(merge.merge.conflictingSteps2.map(step => step[1].toJSON())), JSON.stringify(conflictingSteps2))
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
