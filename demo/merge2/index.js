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
    mergeTransforms
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

function getDecos(merge, showMergedChanged, popup) {
    let decos = DecorationSet.empty
    if (showMergedChanged) {
        merge.changes.deleted.forEach(deletion => {

            let dom = document.createElement('span')
            dom.setAttribute('class', `automerged deletion user-${deletion.data.user}`)

            dom.appendChild(
                DOMSerializer.fromSchema(mySchema).serializeFragment(deletion.slice.content)
            )

            decos = decos.add(merge.doc, [
                Decoration.widget(deletion.pos, dom, {marks: []})
            ])
        })
        merge.changes.inserted.forEach(insertion => {
            decos = decos.add(merge.doc, [
                Decoration.inline(insertion.from, insertion.to, {class: `automerged insertion user-${insertion.data.user}`}, {})
            ])
        })
    }

    let changes = {} // Don't show the button decos more than once for each change. Last widget wins.

    merge.conflictingChanges.deleted.forEach(deletion => {
        changes[`${deletion.data.user}-${deletion.data.index}`] = {
            pos: [deletion.from, deletion.to],
            user: deletion.data.user,
            index: deletion.data.index,
            deletion: true,
            insertion: false
        }
    })

    merge.conflictingChanges.inserted.forEach(insertion => {

        if (!(`${insertion.data.user}-${insertion.data.index}` in changes)) {
            changes[`${insertion.data.user}-${insertion.data.index}`] = {
                pos: [insertion.pos, insertion.pos],
                user: insertion.data.user,
                index: insertion.data.index,
                deletion: false
            }
        }

        changes[`${insertion.data.user}-${insertion.data.index}`].insertion = insertion.slice.content
    })

    Object.values(changes).forEach(change => {
        let widgetDOM = document.createElement('span')
        widgetDOM.classList.add('merge-widget')
        if (change.deletion) {
            decos = decos.add(merge.doc, [
                Decoration.inline(change.pos[0], change.pos[1], {class: `proposed insertion user-${change.user}`}, {})
            ])
        } else {
            let deleteDOM = document.createElement('span')
            deleteDOM.setAttribute('class', `proposed insertion user-${change.user}`)
            deleteDOM.innerHTML = "[ deleted ]"
            widgetDOM.appendChild(deleteDOM)
        }
        if (popup === `${change.user}-${change.index}`) {
            let insertionDOM = document.createElement('span')
            insertionDOM.setAttribute('class', `proposed alternative user-${change.user}`)
            if (change.insertion) {
                insertionDOM.appendChild(
                    DOMSerializer.fromSchema(mySchema).serializeFragment(change.insertion)
                )
            } else {
                insertionDOM.innerHTML = "[ deleted ]"
            }
            widgetDOM.appendChild(insertionDOM)
        }

        widgetDOM.insertAdjacentHTML(
            'beforeend',
            `<button class="popup" data-index="${change.index}" data-user="${change.user}">^</button>
            <button class="accept" data-index="${change.index}" data-user="${change.user}">Reject</button>
            <button class="reject" data-index="${change.index}" data-user="${change.user}">Accept</button>`
        )
        decos = decos.add(merge.doc, [
            Decoration.widget(change.pos[1], widgetDOM, {marks: []})
        ])
    })

    return decos
}

const key = new PluginKey('diffs')
function createEditor3(merge) {
    let showMergedChanged = document.getElementById('automerge_show').checked

    document.getElementById('editor3').innerHTML = ''

    let mergedState = EditorState.create({
        doc: merge.doc,
        plugins: [
            new Plugin({
                key,
                state: {
                    init() {
                        return {
                            merge,
                            popup: false
                        }
                    },
                    apply(tr, prev, oldState, state) {
                        let meta = tr.getMeta(key)
                        if (meta) {
                            return meta
                        }
                        let {
                            merge,
                            popup
                        } = this.getState(oldState)

                        merge = merge.map(tr.mapping, tr.doc)

                        if (tr.selectionSet) {
                            popup = false
                        }

                        return {
                            merge,
                            popup
                        }
                    }
                },
                props: {
                    decorations(state) {
                        let {merge, popup} = this.getState(state)
                        return getDecos(merge, showMergedChanged, popup)
        			}
                }
            })
        ]
    })

    window.view3 = new EditorView(document.querySelector("#editor3"), {
        state: mergedState
    })

    document.querySelector('#editor3').addEventListener('click', event => {
        if (event.target.closest('.accept')) {
            let el = event.target.closest('.accept'),
                user = parseInt(el.dataset.user),
                index = parseInt(el.dataset.index),
                mergeResult = merge.apply(user, index),
                tr = view3.state.tr.setMeta(key, {
                    popup: false,
                    merge: mergeResult.merge
                })
            mergeResult.tr.steps.forEach(step => tr.step(step))
            view3.dispatch(tr)
        } else if (event.target.closest('.reject')) {
            let el = event.target.closest('.reject'),
                user = parseInt(el.dataset.user),
                index = parseInt(el.dataset.index),
                mergeResult = merge.reject(user, index),
                tr = view3.state.tr.setMeta(key, {
                    popup: false,
                    merge: mergeResult.merge
                })
            view3.dispatch(tr)
        } else if (event.target.closest('.popup')) {
            let el = event.target.closest('.popup'),
                user = el.dataset.user,
                index = el.dataset.index,
                tr = view3.state.tr.setMeta(key, {
                    popup: `${user}-${index}`,
                    merge: key.getState(view3.state).merge
                })
            view3.dispatch(tr)
        }
    })
}



document.getElementById('compare').addEventListener('click', () => {
    let tr1 = recreateTransform(state.doc, view1.state.doc, true, document.getElementById('word-diff').checked),
        tr2 = recreateTransform(state.doc, view2.state.doc, true, document.getElementById('word-diff').checked),
        mergeResult = mergeTransforms(
            tr1,
            tr2,
            true,
            document.getElementById('word-diff').checked
        )
    createEditor3(mergeResult.merge)
})
