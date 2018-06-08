import {
    Transform
} from "prosemirror-transform"
import {
    applyOperation,
    compare
} from "fast-json-patch"
import DiffMatchPatch from "diff-match-patch"

export function recreateSteps(fromDoc, toDoc) {
    // First step: we create versions of the documents without marks as these will only confuse the diffing mechanism and marks won't cause any mapping changes anyway.
    let currentDoc = marklessDoc(fromDoc).toJSON(),
        finalDocNoMarks = marklessDoc(toDoc).toJSON(),
        ops = compare(currentDoc, finalDocNoMarks),
        tr = new Transform(fromDoc),
        schema = fromDoc.type.schema

    while (ops.length) {
        let op = ops.shift()
        let pathParts = op.path.split('/')
        pathParts.shift() // remove initial ""
        // TODO:
        // * footnotes and other inline items in middle of texts:
        //     OneTwoThree<fn>Four => OneTwoThreeFour
        if (pathParts.includes('attrs') || pathParts.includes('type')) {
            // Node markup is changing
            addSetNodeMarkup(tr, schema.nodeFromJSON(currentDoc), schema.nodeFromJSON(finalDocNoMarks))
            currentDoc = marklessDoc(tr.doc).toJSON()
            // Setting the node markup may have invalidated more ops, so we calculate them again.
            ops = compare(currentDoc, finalDocNoMarks)
        } else if (op.op === 'replace' && pathParts[pathParts.length-1] === 'text') {
            // Text is being replaced, we apply text diffing to find the smallest possible diffs.
            addReplaceTextSteps(tr, op, ops, schema, currentDoc, finalDocNoMarks)
        } else {
            let afterDoc = applyOperation(JSON.parse(JSON.stringify(currentDoc)), op).newDocument

            addReplaceStep(tr, schema.nodeFromJSON(currentDoc), schema.nodeFromJSON(afterDoc))
            currentDoc = afterDoc
        }

    }

    // Now the documents should be the same, except their marks, so everything should map 1:1.
    // Second step: Iterate through the toDoc and make sure all marks are the same in tr.doc

    toDoc.descendants((node, pos) => {
        if (!node.isInline) {
            return true
        }
        Object.values(schema.marks).forEach(mark => {
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

function marklessDoc(doc) {
    console.log({doc})
    let tr = new Transform(doc)
    tr.removeMark(0, doc.nodeSize - 2)
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

function addReplaceTextSteps(tr, op, ops, schema, beforeDoc, afterDoc) {

    let finalText = op.value,
        pathParts = op.path.split('/'),
        obj = beforeDoc
    pathParts.shift()

    while (pathParts.length) {
        let pathPart = pathParts.shift()
        obj = obj[pathPart]
    }

    let currentText = obj,
        dmp = new DiffMatchPatch(),
        textPatches = dmp.patch_make(currentText, finalText)

    textPatches.forEach(patch => {
        [currentText] = dmp.patch_apply([patch], currentText)
        let partialOp = Object.assign({}, op, {value: currentText}),
            afterDoc = applyOperation(JSON.parse(JSON.stringify(beforeDoc)), partialOp).newDocument

        addReplaceStep(tr, schema.nodeFromJSON(beforeDoc), schema.nodeFromJSON(afterDoc))
        beforeDoc = afterDoc
    })

    console.log({textPatches})

}
