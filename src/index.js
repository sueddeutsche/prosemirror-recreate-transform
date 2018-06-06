import {
    EditorState
} from "prosemirror-state"
import {
    applyOperation,
    compare
} from "fast-json-patch"

export function recreateSteps(fromState, toState) {
    // First step: we create versions of the documents without marks as these will only confuse the diffing mechanism and marks won't cause any mapping changes anyway.
    let fromDocMarkless = marklessDoc(fromState).toJSON(),
        toDocMarkless = marklessDoc(toState).toJSON(),
        ops = compare(fromDocMarkless, toDocMarkless),
        tr = fromState.tr,
        beforeDoc = fromDocMarkless

    while (ops.length) {
        let op = ops.shift()
        let pathParts = op.path.split('/')
        pathParts.shift() // remove initial ""
        // TODO:
        // * text nodes with changes in multiple places
        // * footnotes and other inline items in middle of texts:
        //     OneTwoThree<fn>Four => OneTwoThreeFour
        if (pathParts.includes('attrs') || pathParts.includes('type')) {
            // Node markup is changing
            addSetNodeMarkup(tr, fromState.schema.nodeFromJSON(beforeDoc), fromState.schema.nodeFromJSON(toDocMarkless))
            beforeDoc = marklessDoc(EditorState.create({
                schema: fromState.schema,
                doc: tr.doc
            })).toJSON()
            ops = compare(beforeDoc, toDocMarkless)
        } else {
            let afterDoc = applyOperation(JSON.parse(JSON.stringify(beforeDoc)), op).newDocument

            addReplaceStep(tr, fromState.schema.nodeFromJSON(beforeDoc), fromState.schema.nodeFromJSON(afterDoc))
            beforeDoc = afterDoc
        }

    }

    // Now the documents should be the same, except their marks, so everything should map 1:1.
    // Second step: Iterate through the toState document and make sure all marks are the same in tr.doc

    toState.doc.descendants((node, pos) => {
        if (!node.isInline) {
            return true
        }
        Object.values(fromState.schema.marks).forEach(mark => {
            let nodeMarks = node.marks.filter(nodeMark => nodeMark.type === mark)
            if (nodeMarks.length) {
                nodeMarks.forEach(nodeMark => tr.addMark(pos, pos + node.nodeSize, nodeMark))
            } else {
                tr.removeMark(pos, pos + node.nodeSize, mark)
            }
        })
        let newNode = tr.doc.nodeAt(pos)
        if (newNode.marks.length !== node.marks.length) {
            // At least one mark is only on the newNode, remove it.
            newNode.marks.forEach(nodeMark => {
                if (!nodeMark.isInSet(node.marks)) {
                    tr.removeMark(pos, pos + node.nodeSize, nodeMark)
                }
            })
        }
    })

    return tr
}

function marklessDoc(state) {
    let tr = state.tr
    tr.removeMark(0, state.doc.nodeSize - 2)
    return tr.doc
}


// From http://prosemirror.net/examples/footnote/
function addReplaceStep(tr, fromDoc, toDoc) {
    let start = toDoc.content.findDiffStart(fromDoc.content)
    if (start != null) {
        let {
            a: endA,
            b: endB
        } = toDoc.content.findDiffEnd(fromDoc.content)
        let overlap = start - Math.min(endA, endB)
        if (overlap > 0) {
            endA += overlap
            endB += overlap
        }
        tr.replace(start, endB, toDoc.slice(start, endA))
    }
}

function addSetNodeMarkup(tr, fromDoc, toDoc) {
    let start = toDoc.content.findDiffStart(fromDoc.content),
        fromNode = fromDoc.nodeAt(start),
        toNode = toDoc.nodeAt(start)
    if (start != null) {
        tr.setNodeMarkup(start, fromNode.type === toNode.type ? null : toNode.type, toNode.attrs, toNode.marks)
    }
}
