import {
    Transform, Mapping
} from "prosemirror-transform"
import {
    ChangeSet
} from "prosemirror-changeset"

export function mergeTransforms(doc, tr1, tr2) {
    let conflicts = findConflicts(doc, tr1, tr2),
        tr = new Transform(doc),
        changes = ChangeSet.create(doc),
        conflictSteps1 = [...new Set(conflicts.map(conflict => conflict[0]))],
        conflictSteps2 = [...new Set(conflicts.map(conflict => conflict[1]))],
        removedSteps1Map = new Mapping(),
        removedSteps2Map = new Mapping(),
        conflictingSteps1 = [],
        conflictingSteps2 = []

    tr1.steps.forEach((step, index) => {
        if (conflictSteps1.includes(index)) {
            removedSteps1Map.appendMap(step.invert(tr.doc).getMap())
            conflictingSteps1.push([index, step])
        } else {
            let mapped = step.map(removedSteps1Map)
            tr.step(mapped)
            let stepMap = mapped.getMap()
            conflictingSteps1 = conflictingSteps1.map(([id, step]) => [id, step.map(stepMap)])
        }
    })
    let numberSteps1 = tr.steps.length
    changes = changes.addSteps(tr.doc, tr.mapping.maps, {user: 1})
    tr2.steps.forEach((step, index) => {
        if (conflictSteps2.includes(index)) {
            removedSteps2Map.appendMap(step.invert(tr.doc).getMap())
            conflictingSteps2.push([index, step])
        } else {
            let mapped = step.map(tr.mapping.slice(0, numberSteps1)).map(removedSteps2Map)
            tr.step(mapped)
            let stepMap = mapped.getMap()
            conflictingSteps1 = conflictingSteps1.map(([id, step]) => [id, step.map(stepMap)])
            conflictingSteps2 = conflictingSteps2.map(([id, step]) => [id, step.map(stepMap)])
        }

    })
    changes = changes.addSteps(tr.doc, tr.mapping.maps.slice(numberSteps1), {user: 2})

    return {tr, changes, conflicts, conflictingSteps1, conflictingSteps2}
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
