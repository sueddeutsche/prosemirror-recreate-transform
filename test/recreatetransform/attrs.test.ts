import { strict as assert } from "assert";
import { recreateTransform, Options } from "../../src/recreateTransform";
import { doc, node, p, t } from "../support/pm";

function testRecreate(startDoc, endDoc, steps = [], options: Options = {}) {
    // console.log(startDoc.toJSON(), endDoc.toJSON());
    const tr = recreateTransform(startDoc, endDoc, options);
    assert.equal(
        JSON.stringify(tr.steps.map(step => step.toJSON()), null, 2),
        JSON.stringify(steps, null, 2)
    );
}

describe.only("recreateTransform - node attrs", () => {
    it("should update node attrs", () => {
        testRecreate(
            doc(node("widget_a", { first: "", aSecond: "" })),
            doc(node("widget_a", { first: "first", aSecond: "" })),
            [
                {
                    stepType: "replaceAround",
                    from: 0,
                    to: 2,
                    gapFrom: 1,
                    gapTo: 1,
                    insert: 1,
                    slice: {
                        content: [
                            {
                                type: "widget_a",
                                attrs: { first: "first", aSecond: "" }
                            }
                        ]
                    },
                    structure: true
                }
            ]
        );
    });

    it("should update all node attrs", () => {
        testRecreate(
            doc(node("widget_a", { first: "", aSecond: "" })),
            doc(node("widget_a", { first: "first", aSecond: "second" })),
            [
                {
                    stepType: "replaceAround",
                    from: 0,
                    to: 2,
                    gapFrom: 1,
                    gapTo: 1,
                    insert: 1,
                    slice: {
                        content: [
                            {
                                type: "widget_a",
                                attrs: { first: "first", aSecond: "second" }
                            }
                        ]
                    },
                    structure: true
                }
            ]
        );
    });

    it("should update all node attrs, when changing position", () => {
        testRecreate(
            doc(p(t("Lorem Ipsum")), p(t("Dolor sit")), node("widget_a", { first: "", aSecond: "" })),
            doc(p(t("Dolor sit")), node("widget_a", { first: "first", aSecond: "second" })),
            [
                {
                    stepType: "replace",
                    from: 0,
                    to: 13
                },
                {
                    stepType: "replaceAround",
                    from: 11,
                    to: 13,
                    gapFrom: 12,
                    gapTo: 12,
                    insert: 1,
                    slice: {
                        content: [
                            {
                                type: "widget_a",
                                attrs: { first: "first", aSecond: "second" }
                            }
                        ]
                    },
                    structure: true
                }
            ]
        );
    });

    it("should update node attrs and type in one change", () => {
        testRecreate(
            doc(node("widget_a", { first: "a-first", aSecond: "a-second" })),
            doc(node("widget_b", { first: "b-first", bSecond: "b-second", third: "b-third" })),
            [
                {
                    stepType: "replaceAround",
                    from: 0,
                    to: 2,
                    gapFrom: 1,
                    gapTo: 1,
                    insert: 1,
                    slice: {
                        content: [
                            {
                                type: "widget_b",
                                attrs: { first: "b-first", bSecond: "b-second", third: "b-third" }
                            }
                        ]
                    },
                    structure: true
                }
            ]
        );
    });

    it("should update node attrs and type, when changing", () => {
        testRecreate(
            doc(p(t("Lorem Ipsum")), p(t("Dolor sit")), node("widget_a", { first: "a-first", aSecond: "a-second" })),
            doc(p(t("Dolor sit")), node("widget_b", { first: "b-first", bSecond: "b-second", third: "b-third" })),
            [
                {
                    stepType: "replace",
                    from: 0,
                    to: 13
                },
                {
                    stepType: "replaceAround",
                    from: 11,
                    to: 13,
                    gapFrom: 12,
                    gapTo: 12,
                    insert: 1,
                    slice: {
                        content: [
                            {
                                type: "widget_b",
                                attrs: { first: "b-first", bSecond: "b-second", third: "b-third" }
                            }
                        ]
                    },
                    structure: true
                }
            ]
        );
    });
});
