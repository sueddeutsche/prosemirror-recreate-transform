import {
    EditorState,
    Plugin,
    PluginKey
} from "prosemirror-state"
import {
    EditorView
} from "prosemirror-view"
import {
    Schema,
    DOMParser,
    DOMSerializer
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
    Decoration,
    DecorationSet
} from "prosemirror-view"
import {
    ChangeSet
} from "prosemirror-changeset"
import {
    recreateTransform
} from "../../src"

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

window.view = new EditorView(document.querySelector("#editor"), {
    state
})

window.historyViews = []

document.getElementById('make_diff').addEventListener('click', () => {
    let tr = recreateTransform(state.doc, view.state.doc),
        decos = DecorationSet.empty,
        changes = ChangeSet.create(state.doc).addSteps(tr.doc, tr.mapping.maps)

    changes.inserted.forEach(insertion => {
        decos = decos.add(tr.doc, [
            Decoration.inline(insertion.from, insertion.to, {class: 'insertion'}, {})
        ])
    })
    changes.deleted.forEach(deletion => {

        let dom = document.createElement('span')
        dom.setAttribute('class', 'deletion')

        dom.appendChild(
            DOMSerializer.fromSchema(mySchema).serializeFragment(deletion.slice.content)
        )

        decos = decos.add(tr.doc, [
            Decoration.widget(deletion.pos, dom, {marks: []})
        ])
    })

    let historyState = EditorState.create({
            doc: tr.doc,
            plugins: [
                new Plugin({
                    key: new PluginKey('diffs'),
                    props: {
                        decorations(state) {
                            return decos
            			}
                    },
                    filterTransaction: tr => false
                })
            ]
        }),
        historyViewDiv = document.createElement('div'),
        historyDiv = document.getElementById('history')

    historyDiv.insertBefore(historyViewDiv, historyDiv.firstElementChild)

    window.historyViews.push(new EditorView(historyViewDiv, {
        state: historyState
    }))

    state = view.state

})
