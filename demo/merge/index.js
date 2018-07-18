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
    recreateTransform,
    mergeTransforms,
    applyConflictingStep,
    rejectConflictingStep
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

window.view1 = new EditorView(document.querySelector("#editor1"), {
    state
})
window.view2 = new EditorView(document.querySelector("#editor2"), {
    state
})

function updateEditor3(mergeData) {
    let decos = DecorationSet.empty

    document.getElementById('editor3').innerHTML = ''
    if (document.getElementById('automerge_show').checked) {
        mergeData.changes.inserted.forEach(insertion => {
            decos = decos.add(mergeData.tr.doc, [
                Decoration.inline(insertion.from, insertion.to, {class: `automerged insertion user-${insertion.data.user}`}, {})
            ])
        })
        mergeData.changes.deleted.forEach(deletion => {

            let dom = document.createElement('span')
            dom.setAttribute('class', `automerged deletion user-${deletion.data.user}`)

            dom.appendChild(
                DOMSerializer.fromSchema(mySchema).serializeFragment(deletion.slice.content)
            )

            decos = decos.add(mergeData.tr.doc, [
                Decoration.widget(deletion.pos, dom, {marks: []})
            ])
        })
    }

    mergeData.conflictingChanges.inserted.forEach(insertion => {
        let dom = document.createElement('span')
        dom.setAttribute('class', `proposed insertion user-${insertion.data.user}`)

        dom.appendChild(
            DOMSerializer.fromSchema(mySchema).serializeFragment(insertion.slice.content)
        )

        let selector = document.createElement('span')
        selector.innerHTML =
            `<button class="accept" data-index="${insertion.data.index}" data-user="${insertion.data.user}">Accept</button>
            <button class="reject" data-index="${insertion.data.index}" data-user="${insertion.data.user}">Reject</button>`

        dom.appendChild(
            selector
        )

        decos = decos.add(mergeData.tr.doc, [
            Decoration.widget(insertion.pos, dom, {marks: []})
        ])
    })

    mergeData.conflictingChanges.deleted.forEach(deletion => {

        let selector = document.createElement('span')
        selector.innerHTML =
            `<button class="accept" data-index="${deletion.data.index}" data-user="${deletion.data.user}">Accept</button>
            <button class="reject" data-index="${deletion.data.index}" data-user="${deletion.data.user}">Reject</button>`

        decos = decos.add(mergeData.tr.doc, [
            Decoration.inline(deletion.from, deletion.to, {class: `proposed deletion user-${deletion.data.user}`}, {}),
            Decoration.widget(deletion.to, selector, {marks: []})
        ])

    })

    let mergedState = EditorState.create({
        doc: mergeData.tr.doc,
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
    })

    window.view3 = new EditorView(document.querySelector("#editor3"), {
        state: mergedState
    })

    document.querySelectorAll("#editor3 .accept").forEach(
        el => el.addEventListener('click', () => {
            let user = parseInt(el.dataset.user),
                index = parseInt(el.dataset.index)
            mergeData = applyConflictingStep(user, index, mergeData)
            updateEditor3(mergeData)
        })
    )

    document.querySelectorAll("#editor3 .reject").forEach(
        el => el.addEventListener('click', () => {
            let user = parseInt(el.dataset.user),
                index = parseInt(el.dataset.index)
            mergeData = rejectConflictingStep(user, index, mergeData)
            updateEditor3(mergeData)
        })
    )
}


document.getElementById('compare').addEventListener('click', () => {
    let tr1 = recreateTransform(state.doc, view1.state.doc),
        tr2 = recreateTransform(state.doc, view2.state.doc),
        mergeData = mergeTransforms(tr1, tr2, document.getElementById('rebase').checked)
    updateEditor3(mergeData)
})
