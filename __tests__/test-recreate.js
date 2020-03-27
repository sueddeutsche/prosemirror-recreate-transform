import {doc, blockquote, h1, h2, p, em, strong} from "prosemirror-test-builder"
import ist from "ist"

const {recreateTransform} = require("../dist/index")


function testRecreate(startDoc, endDoc, steps = [], options = {}) {
    let tr = recreateTransform(startDoc, endDoc, options.complexSteps, options.wordDiffs)
    ist(JSON.stringify(tr.steps.map(step => step.toJSON())), JSON.stringify(steps))
}

describe("simpleNodeDiffs", () => {
    it("add em", () =>
        testRecreate(
            doc(p("Before textitalicAfter text")),
            doc(p("Before text", em("italic"), "After text")),
            [{
                "stepType": "replace",
                "from": 12,
                "to": 18,
                "slice": {
                    "content": [{
                        "type": "text",
                        "marks": [{
                            "type": "em"
                        }],
                        "text": "italic"
                    }]
                }
            }],
            {complexSteps: false}
        )
    )

    it("remove strong", () =>
        testRecreate(
            doc(p("Before text", strong("bold"), "After text")),
            doc(p("Before textboldAfter text")),
            [{
                "stepType": "replace",
                "from": 12,
                "to": 16,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "bold"
                    }]
                }
            }],
            {complexSteps: false}
        )
    )

    it("wrap in blockquote", () =>
        testRecreate(
            doc(p("A quoted sentence")),
            doc(blockquote(p("A quoted sentence"))),
            [{
                "stepType": "replace",
                "from": 0,
                "to": 19,
                "slice": {
                    "content": [{
                        "type": "blockquote",
                        "content": [{
                            "type": "paragraph",
                            "content": [{
                                "type": "text",
                                "text": "A quoted sentence"
                            }]
                        }]
                    }]
                }
            }],
            {complexSteps: false}
        )
    )

    it("unwrap from blockquote", () =>
        testRecreate(
            doc(blockquote(p("A quoted sentence"))),
            doc(p("A quoted sentence")),
            [{
                "stepType": "replace",
                "from": 0,
                "to": 21,
                "slice": {
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": "A quoted sentence"
                        }]
                    }]
                }
            }],
            {complexSteps: false}
        )
    )

    it("change headline type", () =>
        testRecreate(
            doc(h1("A title")),
            doc(h2("A title")),
            [{
                "stepType": "replace",
                "from": 0,
                "to": 9,
                "slice": {
                    "content": [{
                        "type": "heading",
                        "attrs": {
                            "level": 2
                        },
                        "content": [{
                            "type": "text",
                            "text": "A title"
                        }]
                    }]
                }
            }],
            {complexSteps: false}
        )
    )
})

describe("complexNodeDiffs", () => {

    it("add em", () =>
        testRecreate(
            doc(p("Before textitalicAfter text")),
            doc(p("Before text", em("italic"), "After text")),
            [{
                "stepType": "addMark",
                "mark": {
                    "type": "em"
                },
                "from": 12,
                "to": 18
            }]
        )
    )

    it("remove strong", () =>
        testRecreate(
            doc(p("Before text", strong("bold"), "After text")),
            doc(p("Before textboldAfter text")),
            [{
                "stepType": "removeMark",
                "mark": {
                    "type": "strong"
                },
                "from": 12,
                "to": 16
            }]
        )
    )

    it("add em and strong", () =>
        testRecreate(
            doc(p("Before textitalic/boldAfter text")),
            doc(p("Before text", strong(em("italic/bold")), "After text")),
            [{
                "stepType": "addMark",
                "mark": {
                    "type": "em"
                },
                "from": 12,
                "to": 23
            },
            {
                "stepType": "addMark",
                "mark": {
                    "type": "strong"
                },
                "from": 12,
                "to": 23
            }]
        )
    )

    it("replace em and strong", () =>
        testRecreate(
            doc(p("Before textitalic/boldAfter text")),
            doc(p("Before text", strong(em("italic/bold")), "After text")),
            [{
                "stepType": "addMark",
                "mark": {
                    "type": "em"
                },
                "from": 12,
                "to": 23
            },
            {
                "stepType": "addMark",
                "mark": {
                    "type": "strong"
                },
                "from": 12,
                "to": 23
            }]
        )
    )

    it("replace em with strong", () =>
        testRecreate(
            doc(p("Before text", em("styled"), "After text")),
            doc(p("Before text", strong("styled"), "After text")),
            [{
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 12,
                "to": 18
            },
            {
                "stepType": "addMark",
                "mark": {
                    "type": "strong"
                },
                "from": 12,
                "to": 18
            }]
        )
    )

    it("replace em with strong in different parts", () =>
        testRecreate(
            doc(p("Before text", em("styledAfter text"))),
            doc(p(strong("Before textstyled"), "After text")),
            [{
                "stepType": "addMark",
                "mark": {
                    "type": "strong"
                },
                "from": 1,
                "to": 12
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 12,
                "to": 18
            }, {
                "stepType": "addMark",
                "mark": {
                    "type": "strong"
                },
                "from": 12,
                "to": 18
            }, {
                "stepType": "removeMark",
                "mark": {
                    "type": "em"
                },
                "from": 18,
                "to": 28
            }]
        )
    )



    it("wrap in blockquote", () =>
        testRecreate(
            doc(p("A quoted sentence")),
            doc(blockquote(p("A quoted sentence"))),
            [{
                "stepType": "replace",
                "from": 0,
                "to": 19,
                "slice": {
                    "content": [{
                        "type": "blockquote",
                        "content": [{
                            "type": "paragraph",
                            "content": [{
                                "type": "text",
                                "text": "A quoted sentence"
                            }]
                        }]
                    }]
                }
            }]
        )
    )

    it("unwrap from blockquote", () =>
        testRecreate(
            doc(blockquote(p("A quoted sentence"))),
            doc(p("A quoted sentence")),
            [{
                "stepType": "replace",
                "from": 0,
                "to": 21,
                "slice": {
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": "A quoted sentence"
                        }]
                    }]
                }
            }]
        )
    )

    it("change headline type", () =>
        testRecreate(
            doc(h1("A title")),
            doc(h2("A title")),
            [{
                "stepType": "replaceAround",
                "from": 0,
                "to": 9,
                "gapFrom": 1,
                "gapTo": 8,
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
            }],
            {complexSteps: true}
        )
    )

})

describe("textDiffs", () => {
    it("find text diff in one text node", () =>
        testRecreate(
            doc(blockquote(p("The start text"))),
            doc(blockquote(p("The end text"))),
            [{"stepType":"replace", "from":6, "to":11, "slice":{"content":[{"type":"text","text":"end"}]}}]
        )
    )

    it("find text diffs in several nodes", () =>
        testRecreate(
            doc(blockquote(p("The start text"), p("The second text"))),
            doc(blockquote(p("The end text"), p("The second sentence"))),
            [{
                "stepType": "replace",
                "from": 6,
                "to": 11,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "end"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 27,
                "to": 27,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "sen"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 32,
                "to": 34,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "nce"
                    }]
                }
            }]
        )
    )

    it("find text diffs in several nodes using word diffs", () =>
        testRecreate(
            doc(blockquote(p("The start text"), p("The second text"))),
            doc(blockquote(p("The end text"), p("The second sentence"))),
            [{
                "stepType": "replace",
                "from": 6,
                "to": 11,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "end"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 27,
                "to": 31,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "sentence"
                    }]
                }
            }],
            {wordDiffs: true}
        )
    )

    it("find several diffs in same text node", () =>
        testRecreate(
            doc(blockquote(p("The cat is barking at the house"))),
            doc(blockquote(p("The dog is meauwing in the ship"))),
            [{
                "stepType": "replace",
                "from": 6,
                "to": 9,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "dog"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 13,
                "to": 14,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "me"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 16,
                "to": 18,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "uw"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 22,
                "to": 24,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "in"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 29,
                "to": 29,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "s"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 31,
                "to": 35,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "ip"
                    }]
                }
            }]
        )
    )

    it("find several diffs in same text using word diffs", () =>
        testRecreate(
            doc(blockquote(p("The cat is barking at the house"))),
            doc(blockquote(p("The dog is meauwing in the ship"))),
            [{
                "stepType": "replace",
                "from": 6,
                "to": 9,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "dog"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 13,
                "to": 20,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "meauwing"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 22,
                "to": 24,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "in"
                    }]
                }
            }, {
                "stepType": "replace",
                "from": 29,
                "to": 34,
                "slice": {
                    "content": [{
                        "type": "text",
                        "text": "ship"
                    }]
                }
            }],
            {wordDiffs: true}
        )
    )
})
