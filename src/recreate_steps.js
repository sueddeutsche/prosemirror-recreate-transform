import {
    Transform
} from "prosemirror-transform"
import {
    applyPatch, createPatch
} from "rfc6902"
import DiffMatchPatch from "diff-match-patch"

class RecreateSteps {
    constructor(fromDoc, toDoc) {
        this.fromDoc = fromDoc
        this.toDoc = toDoc
        this.schema = fromDoc.type.schema
        this.tr = new Transform(fromDoc)

        // For First step: we create versions of the documents without marks as
        // these will only confuse the diffing mechanism and marks won't cause
        // any mapping changes anyway.
        this.currentJSON = this.marklessDoc(this.fromDoc).toJSON()
        this.finalJSON = this.marklessDoc(this.toDoc).toJSON()
        this.ops = createPatch(this.currentJSON, this.finalJSON)
        console.log({ops: JSON.stringify(this.ops)})
    }

    init() {
        this.recreateChangeContentSteps()
        this.recreateChangeMarkSteps()
        return this.tr
    }

    recreateChangeContentSteps() {
        // First step: find content changing steps.
        while (this.ops.length) {
            let op = this.ops.shift(),
                pathParts = op.path.split('/')

            pathParts.shift() // remove initial ""
            // TODO:
            // * footnotes and other inline items in middle of texts:
            //     OneTwoThree<fn>Four => OneTwoThreeFour
            if (pathParts.includes('attrs') || pathParts.includes('type')) {
                // Node markup is changing
                this.addSetNodeMarkup()
            } else if (op.op === 'replace' && pathParts[pathParts.length-1] === 'text') {
                // Text is being replaced, we apply text diffing to find the smallest possible diffs.
                this.addReplaceTextSteps(op)
            } else {
                this.addReplaceStep(op)
            }

        }
    }

    recreateChangeMarkSteps() {
        // Now the documents should be the same, except their marks, so everything should map 1:1.
        // Second step: Iterate through the toDoc and make sure all marks are the same in tr.doc

        this.toDoc.descendants((node, pos) => {
            if (!node.isInline) {
                return true
            }
            Object.values(this.schema.marks).forEach(mark => {
                let nodeMarks = node.marks.filter(nodeMark => nodeMark.type === mark)
                if (nodeMarks.length) {
                    nodeMarks.forEach(nodeMark => this.tr.addMark(pos, pos + node.nodeSize, nodeMark))
                } else {
                    this.tr.removeMark(pos, pos + node.nodeSize, mark)
                }
            })
            let newNode = this.tr.doc.nodeAt(pos)
            if (newNode.marks.length !== node.marks.length) {
                // At least one mark is only on the newNode, remove it.
                newNode.marks.forEach(nodeMark => {
                    if (!nodeMark.isInSet(node.marks)) {
                        tr.removeMark(pos, pos + node.nodeSize, nodeMark)
                    }
                })
            }
        })
    }

    marklessDoc(doc) {
        let tr = new Transform(doc)
        tr.removeMark(0, doc.nodeSize - 2)
        return tr.doc
    }

    // From http://prosemirror.net/examples/footnote/
    addReplaceStep(op) {
        let afterStepJSON = JSON.parse(JSON.stringify(this.currentJSON))
        applyPatch(afterStepJSON, [op])
        let fromDoc = this.schema.nodeFromJSON(this.currentJSON),
            toDoc = this.schema.nodeFromJSON(afterStepJSON),
            start = toDoc.content.findDiffStart(fromDoc.content)
        if (start != null) {
            let {
                a: endA,
                b: endB
            } = toDoc.content.findDiffEnd(fromDoc.content)
            let overlap = start - Math.min(endA, endB)
            if (overlap > 0) {
                if (
                    // If there is an overlap, there is some freedom of choise in how to calculate the start/end boundary.
                    // for an inserted/removed slice. We choose the extreme with the lowest depth value.
                    fromDoc.resolve(start - overlap).depth < toDoc.resolve(endA + overlap).depth
                ) {
                    start -= overlap
                } else {
                    endA += overlap
                    endB += overlap
                }
            }
            this.tr.replace(start, endB, toDoc.slice(start, endA))
            this.currentJSON = afterStepJSON
        }
    }

    addSetNodeMarkup() {
        let fromDoc = this.schema.nodeFromJSON(this.currentJSON),
            toDoc = this.schema.nodeFromJSON(this.finalJSON),
            start = toDoc.content.findDiffStart(fromDoc.content),
            fromNode = fromDoc.nodeAt(start),
            toNode = toDoc.nodeAt(start)
        if (start != null) {
            this.tr.setNodeMarkup(start, fromNode.type === toNode.type ? null : toNode.type, toNode.attrs, toNode.marks)
            this.currentJSON = this.marklessDoc(tr.doc).toJSON()
            // Setting the node markup may have invalidated more ops, so we calculate them again.
            this.ops = createPatch(this.currentJSON, this.finalJSON)
        }
    }

    addReplaceTextSteps(op) {

        let finalText = op.value,
            pathParts = op.path.split('/'),
            obj = this.currentJSON,
            dmp = new DiffMatchPatch()

        pathParts.shift()

        while (pathParts.length) {
            let pathPart = pathParts.shift()
            obj = obj[pathPart]
        }

        let currentText = obj,
            textDiffs = dmp.diff_main(currentText, finalText),
            textPatches = dmp.patch_make(textDiffs)

        textPatches.forEach(patch => {
            [currentText] = dmp.patch_apply([patch], currentText)
            let partialOp = Object.assign({}, op, {value: currentText})

            this.addReplaceStep(partialOp)
        })
    }

}

export function recreateSteps(fromDoc, toDoc) {
    let recreator = new RecreateSteps(fromDoc, toDoc)
    return recreator.init()
}
