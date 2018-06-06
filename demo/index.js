import {
    EditorState
} from "prosemirror-state"
import {
    EditorView
} from "prosemirror-view"
import {
    Schema,
    DOMParser
} from "prosemirror-model"
import {
    schema
} from "prosemirror-schema-basic"
import {
    addListNodes
} from "prosemirror-schema-list"
import {
    exampleSetup
} from "prosemirror-example-setup"

import {
    recreateSteps
} from "../src"

const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
})

let state = EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
    plugins: exampleSetup({
        schema: mySchema
    })
})

window.view1 = new EditorView(document.querySelector("#editor1"), {
    state
})
window.view2 = new EditorView(document.querySelector("#editor2"), {
    state
})

document.getElementById('compare').addEventListener('click', () => {
    let tr = recreateSteps(view1.state, view2.state)
    console.log(tr)
})
