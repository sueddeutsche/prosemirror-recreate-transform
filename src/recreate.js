import {
    Transform, ReplaceStep
} from "prosemirror-transform"
import {
    applyPatch, createPatch
} from "rfc6902"
import {diffWordsWithSpace, diffChars} from "diff"

function getReplaceStep(fromDoc, toDoc) {
    let start = toDoc.content.findDiffStart(fromDoc.content)
    if (start === null) {
        return false
    }
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
    //this.tr.replace(start, endB, toDoc.slice(start, endA))
    return new ReplaceStep(start, endB, toDoc.slice(start, endA))
}

class RecreateTransform {
    constructor(fromDoc, toDoc, complexSteps, wordDiffs) {
        this.fromDoc = fromDoc
        this.toDoc = toDoc
        this.complexSteps = complexSteps // Whether to return steps other than ReplaceSteps
        this.wordDiffs = wordDiffs // Whether to make text diffs cover entire words
        this.schema = fromDoc.type.schema
        this.tr = new Transform(fromDoc)
    }

    init() {
        if (this.complexSteps) {
            // For First steps: we create versions of the documents without marks as
            // these will only confuse the diffing mechanism and marks won't cause
            // any mapping changes anyway.
            this.currentJSON = this.marklessDoc(this.fromDoc).toJSON()
            this.finalJSON = this.marklessDoc(this.toDoc).toJSON()
            this.ops = createPatch(this.currentJSON, this.finalJSON)
            this.recreateChangeContentSteps()
            this.recreateChangeMarkSteps()
        } else {
            // We don't differentiate between mark changes and other changes.
            this.currentJSON = this.fromDoc.toJSON()
            this.finalJSON = this.toDoc.toJSON()
            this.ops = createPatch(this.currentJSON, this.finalJSON)
            this.recreateChangeContentSteps()
        }

        if (!this.wordDiffs) {
            this.simplifyTr()
        }

        return this.tr
    }

    recreateChangeContentSteps() {
        // First step: find content changing steps.
        while (this.ops.length) {
            let op = this.ops.shift(),
                pathParts = op.path.split('/')

            if (this.complexSteps && (pathParts.includes('attrs') || pathParts.includes('type'))) {
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
            step = getReplaceStep(fromDoc, toDoc)

        if (step) {
            this.currentJSON = afterStepJSON
            this.tr.step(step)
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
            this.currentJSON = this.marklessDoc(this.tr.doc).toJSON()
            // Setting the node markup may have invalidated more ops, so we calculate them again.
            this.ops = createPatch(this.currentJSON, this.finalJSON)
        }
    }

    addReplaceTextSteps(op) {

        // We find the position number of the first character in the string
        let op1 = Object.assign({}, op, {value: 'x'}),
            op2 = Object.assign({}, op, {value: 'y'}),
            afterOP1JSON = JSON.parse(JSON.stringify(this.currentJSON)),
            afterOP2JSON = JSON.parse(JSON.stringify(this.currentJSON))

        applyPatch(afterOP1JSON, [op1])
        applyPatch(afterOP2JSON, [op2])

        let offset = this.schema.nodeFromJSON(afterOP1JSON).content.findDiffStart(
                this.schema.nodeFromJSON(afterOP2JSON).content
            ),
            pathParts = op.path.split('/'),
            obj = this.currentJSON

        pathParts.shift()

        while (pathParts.length) {
            let pathPart = pathParts.shift()
            obj = obj[pathPart]
        }

        let finalText = op.value,
            currentText = obj,
            textDiffs = this.wordDiffs ? diffWordsWithSpace(currentText, finalText) : diffChars(currentText, finalText)

        while(textDiffs.length) {
            let diff = textDiffs.shift()
            if (diff.added) {
                if (textDiffs.length && textDiffs[0].removed) {
                    let nextDiff = textDiffs.shift()
                    this.tr.replaceWith(offset, offset + nextDiff.value.length, this.schema.nodeFromJSON({type: 'text', text: diff.value}))
                } else {
                    this.tr.insert(offset, this.schema.nodeFromJSON({type: 'text', text: diff.value}))
                }
                offset += diff.value.length
            } else if (diff.removed) {
                if (textDiffs.length && textDiffs[0].added) {
                    let nextDiff = textDiffs.shift()
                    this.tr.replaceWith(offset, offset + diff.value.length, this.schema.nodeFromJSON({type: 'text', text: nextDiff.value}))
                    offset += nextDiff.value.length
                } else {
                    this.tr.delete(offset, offset + diff.value.length)
                }
            } else {
                offset += diff.value.length
            }
        }

    }

    // join adjacent ReplaceSteps
    simplifyTr() {
        if (!this.tr.steps.length) {
            return
        }

        let newTr = new Transform(this.tr.docs[0]),
            oldSteps = this.tr.steps.slice()
        while (oldSteps.length) {
            let step = oldSteps.shift()
            while(
                (step instanceof ReplaceStep) &&
                oldSteps.length &&
                (oldSteps[0] instanceof ReplaceStep) &&
                step.getMap().map(step.to) === oldSteps[0].from
            ) {
                let addedStep = oldSteps.shift()
                step = getReplaceStep(newTr.doc, addedStep.apply(step.apply(newTr.doc).doc).doc)
            }
            newTr.step(step)
        }
        this.tr = newTr
    }

}

export function recreateTransform(fromDoc, toDoc, complexSteps = true, wordDiffs = false) {
    let recreator = new RecreateTransform(fromDoc, toDoc, complexSteps, wordDiffs)
    return recreator.init()
}
