import {
    Transform, Mapping
} from "prosemirror-transform"
import {
    ChangeSet
} from "prosemirror-changeset"

export function mergeTransforms(doc, tr1, tr2) {
    let conflicts = findConflicts(doc, tr1, tr2),
        tr = new Transform(doc),
        changes = ChangeSet.create(doc)
        
    console.log({conflicts})
    tr1.steps.forEach(step => tr.step(step))
    changes = changes.addSteps(tr.doc, tr.mapping.maps, {user: 1})
    tr2.steps.forEach(step => {
        let mapped = step.map(tr1.mapping)
        if (!mapped) {
            console.log({error: 'step not mapped!', step})
            return
        }
        tr.step(mapped)
    })
    changes = changes.addSteps(tr.doc, tr.mapping.maps.slice(tr1.steps.length), {user: 2})

    return {tr, changes}
}

function findConflicts(doc, tr1, tr2) {
    let changes1 = findContentChanges(doc, tr1),
        changes2 = findContentChanges(doc, tr2),
        conflicts = []
    changes1.deleted.forEach(deleted => {
        changes2.inserted.forEach(inserted => {
            if (inserted.pos > deleted.from && inserted.pos < deleted.to) {
                conflicts.push([deleted.data.step, inserted.data.step])
            }
        })
    })

    changes2.deleted.forEach(deleted => {
        changes1.inserted.forEach(inserted => {
            if (inserted.pos > deleted.from && inserted.pos < deleted.to) {
                conflicts.push([inserted.data.step, deleted.data.step])
            }
        })
    })
    return conflicts
}

function findContentChanges(doc, tr) {
    let changes = ChangeSet.create(doc)
    tr.steps.forEach((step, index) => {
        let doc = tr.docs[index+1] ? tr.docs[index+1] : tr.doc
        changes = changes.addSteps(doc, [tr.mapping.maps[index]], {step: index})
    })
    let invertedMapping = new Mapping()
    invertedMapping.appendMappingInverted(tr.mapping)
    let inserted = changes.inserted.map(inserted => ({pos: invertedMapping.map(inserted.from), data: inserted.data}))
    let deleted = changes.deleted.map(deleted => ({from: deleted.from, to: deleted.to, data: deleted.data}))

    return {inserted, deleted}
}
