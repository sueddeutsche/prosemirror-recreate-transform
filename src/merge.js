import {
    Transform, Mapping
} from 'prosemirror-transform'
import {
    ChangeSet
} from 'prosemirror-changeset'
import {
    recreateTransform
} from './recreate'

export function mergeTransforms(tr1, tr2, automerge = true, rebase = false, wordDiffs = false) {
    // Create conflicting steps. Make sure the steps are only ReplaceSteps so they can easily
    // be presented as alternatives to the user.
    const { tr, changes, tr1NoConflicts, tr2NoConflicts } =
        automerge
            ? automergeTransforms(tr1, tr2)
            : noAutomergeTransforms(tr1, tr2),
        // Find TRs that move from the docs that come out of the non-conflicting docs to the actual final docs, then map
        // them to the ending of tr.
        tr1Conflict = mapTransform(
            recreateTransform(
                tr1NoConflicts.doc,
                tr1.doc,
                false,
                wordDiffs
            ),
            tr.doc,
            new Mapping(tr1NoConflicts.mapping.invert().maps.concat(tr.mapping.maps))
        ),
        tr2Conflict = mapTransform(
            recreateTransform(
                tr2NoConflicts.doc,
                tr2.doc,
                false,
                wordDiffs
            ),
            tr.doc,
            new Mapping(tr2NoConflicts.mapping.invert().maps.concat(tr.mapping.maps))
        )
    if (rebase) {
        // rebase on tr1.doc -- makes all changes relative to user 1
        return rebaseMergedTransform(tr1.doc, tr1Conflict.doc, tr2Conflict.doc, wordDiffs)
    } else {
        const conflicts = findConflicts(tr1Conflict, tr2Conflict),
            { conflictingChanges, conflictingSteps1, conflictingSteps2 } = createConflictingChanges(tr1Conflict, tr2Conflict)

        return { tr, merge: new Merge(tr.doc, changes, conflicts, conflictingSteps1, conflictingSteps2, conflictingChanges) }
    }
}

function rebaseMergedTransform(doc, nonConflictingDoc, conflictingDoc, wordDiffs) {
    const trNonConflict = recreateTransform(doc, nonConflictingDoc, true, wordDiffs),
        changes = ChangeSet.create(doc).addSteps(nonConflictingDoc, trNonConflict.mapping.maps, { user: 2 }),
        trConflict = recreateTransform(nonConflictingDoc, conflictingDoc, false, wordDiffs),
        {
            conflictingChanges,
            conflictingSteps2
        } = createConflictingChanges(
            new Transform(trNonConflict.doc),
            trConflict
        )

    return {
        tr: trNonConflict,
        merge: new Merge(
            trNonConflict.doc, changes, [], [], conflictingSteps2, conflictingChanges
        )
    }
}

export class Merge {
    constructor(
        doc,
        changes,
        conflicts = [],
        conflictingSteps1 = [],
        conflictingSteps2 = [],
        conflictingChanges = []
    ) {
        this.doc = doc
        this.changes = changes
        this.conflicts = conflicts
        this.conflictingSteps1 = conflictingSteps1
        this.conflictingSteps2 = conflictingSteps2
        this.conflictingChanges = conflictingChanges
    }

    map(mapping, doc) {
        let conflictingSteps1 = this.conflictingSteps1,
            conflictingSteps2 = this.conflictingSteps2,
            conflicts = this.conflicts,
            conflictingChanges = this.conflictingChanges
        const changes = this.changes.addSteps(doc, mapping.maps, { user: 2 })

        conflictingSteps1 = conflictingSteps1.map(
            ([index, conflictStep]) => {
                const mapped = conflictStep.map(mapping)
                if (mapped) {
                    conflictingChanges = conflictingChanges.map(
                        change => ({ inserted: change.inserted, deleted: change.deleted, fromA: mapping.map(change.fromA), toA: mapping.map(change.toA), fromB: mapping.map(change.fromB), toB: mapping.map(change.toB) })
                    )
                    return [index, mapped]
                } else {
                    conflicts = conflicts.filter(conflict => conflict[0] !== index)
                    conflictingChanges = conflictingChanges.filter(change => {
                        change.deleted = change.deleted.filter(deleted => deleted.data.user !== 1 || deleted.data.index !== index)
                        change.inserted = change.inserted.filter(inserted => inserted.data.user !== 1 || inserted.data.index !== index)
                        return change.deleted.length || change.inserted.length
                    })
                    return false
                }
            }
        ).filter(step => step)

        conflictingSteps2 = conflictingSteps2.map(
            ([index, conflictStep]) => {
                const mapped = conflictStep.map(mapping)
                if (mapped) {
                    conflictingChanges = conflictingChanges.map(
                        change => ({ inserted: change.inserted, deleted: change.deleted, fromA: mapping.map(change.fromA), toA: mapping.map(change.toA), fromB: mapping.map(change.fromB), toB: mapping.map(change.toB) })
                    )
                    return [index, mapped]
                } else {
                    conflicts = conflicts.filter(conflict => conflict[1] !== index)
                    conflictingChanges = conflictingChanges.filter(change => {
                        change.deleted = change.deleted.filter(deleted => deleted.data.user !== 2 || deleted.data.index !== index)
                        change.inserted = change.inserted.filter(inserted => inserted.data.user !== 2 || inserted.data.index !== index)
                        return change.deleted.length || change.inserted.length
                    })
                    return false
                }
            }
        ).filter(step => step)

        return new Merge(doc, changes, conflicts, conflictingSteps1, conflictingSteps2, conflictingChanges)
    }

    apply(user, index) {
        const step = user === 1
                ? this.conflictingSteps1.find(([conflictIndex, conflictStep]) => conflictIndex === index)[1]
                : this.conflictingSteps2.find(([conflictIndex, conflictStep]) => conflictIndex === index)[1],
            map = step.getMap(),
            tr = new Transform(this.doc)
        let conflictingSteps1 = this.conflictingSteps1,
            conflictingSteps2 = this.conflictingSteps2,
            conflicts = this.conflicts

        tr.step(step)

        const changes = this.changes.addSteps(tr.doc, [map], { user })

        if (user === 1) {
            conflictingSteps1 = conflictingSteps1.map(
                ([conflictIndex, conflictStep]) => conflictIndex === index ? false : [conflictIndex, conflictStep.map(map)]
            ).filter(step => step)
            conflicts = conflicts.filter(conflict => conflict[0] !== index)
        } else {
            conflictingSteps2 = conflictingSteps2.map(
                ([conflictIndex, conflictStep]) => conflictIndex === index ? false : [conflictIndex, conflictStep.map(map)]
            ).filter(step => step)
            conflicts = conflicts.filter(conflict => conflict[1] !== index)
        }

        const conflictingChanges = conflictingChanges.filter(change => {
            change.deleted = change.deleted.filter(deleted => deleted.data.user !== user || deleted.data.index !== index)
            change.inserted = change.inserted.filter(inserted => inserted.data.user !== user || inserted.data.index !== index)
            return change.deleted.length || change.inserted.length
        })

        return { tr, merge: new Merge(tr.doc, changes, conflicts, conflictingSteps1, conflictingSteps2, conflictingChanges) }
    }

    reject(user, index) {
        let conflictingSteps1 = this.conflictingSteps1,
            conflictingSteps2 = this.conflictingSteps2,
            conflicts = this.conflicts

        if (user === 1) {
            conflictingSteps1 = conflictingSteps1.map(
                ([conflictIndex, conflictStep]) => conflictIndex === index ? false : [conflictIndex, conflictStep]
            ).filter(step => step)
            conflicts = conflicts.filter(conflict => conflict[0] !== index)
        } else {
            conflictingSteps2 = conflictingSteps2.map(
                ([conflictIndex, conflictStep]) => conflictIndex === index ? false : [conflictIndex, conflictStep]
            ).filter(step => step)
            conflicts = conflicts.filter(conflict => conflict[1] !== index)
        }

        const conflictingChanges = conflictingChanges.filter(change => {
            change.deleted = change.deleted.filter(deleted => deleted.data.user !== user || deleted.data.index !== index)
            change.inserted = change.inserted.filter(inserted => inserted.data.user !== user || inserted.data.index !== index)
            return change.deleted.length || change.inserted.length
        })

        return { merge: new Merge(this.doc, this.changes, conflicts, conflictingSteps1, conflictingSteps2, conflictingChanges) }
    }

    applyAll(user) {
        const steps = this.conflictingSteps.map(([index, step]) => step),
            tr = new Transform(this.doc)
        let changes = this.changes
        while (steps.length) {
            const mapped = steps.pop().map(tr.mapping)
            if (mapped && !tr.maybeStep(mapped).failed) {
                changes = this.changes.addSteps(tr.doc, [tr.mapping.maps[tr.mapping.maps.length - 1]], { user })
            }
        }
        return { tr, merge: new Merge(tr.doc, changes) }
    }
}

function mapTransform(tr, doc, map) {
    const newTr = new Transform(doc)
    const trMap = new Mapping()
    const failMap = new Mapping()
    tr.steps.forEach(step => {
        const mapped = step.map(trMap.invert()).map(map).map(trMap).map(failMap)
        trMap.appendMap(step.getMap())
        if (mapped) {
            try {
                newTr.maybeStep(mapped)
            } catch (error) {
                if (!error.name === 'ReplaceError') {
                    throw error
                }
            }
        } else {
            failMap.appendMap(step.getMap().invert())
        }
    })
    return newTr
}

function trDoc(tr, index = 0) {
    return tr.docs.length > index ? tr.docs[index] : tr.doc
}

function noAutomergeTransforms(tr1, tr2) {
    const doc = trDoc(tr1)
    return {
        tr: new Transform(doc),
        changes: ChangeSet.create(doc, { compare: (a, b) => false }),
        tr1NoConflicts: new Transform(doc),
        tr2NoConflicts: new Transform(doc)
    }
}

function automergeTransforms(tr1, tr2) {
    // Merge all non-conflicting steps with changes marked.
    const doc = trDoc(tr1),
        conflicts = findConflicts(tr1, tr2),
        tr = new Transform(doc)
    let changes = ChangeSet.create(doc)
    const tr1NoConflicts = removeConflictingSteps(tr1, conflicts.map(conflict => conflict[0])),
        tr2NoConflicts = removeConflictingSteps(tr2, conflicts.map(conflict => conflict[1]))
    tr1NoConflicts.steps.forEach(step => tr.maybeStep(step))
    const numberSteps1 = tr.steps.length
    changes = changes.addSteps(tr.doc, tr.mapping.maps, { user: 1 })
    tr2NoConflicts.steps.forEach(step => {
        const mapped = step.map(tr.mapping.slice(0, numberSteps1))
        if (mapped) {
            tr.maybeStep(mapped)
        }
    })
    changes = changes.addSteps(tr.doc, tr.mapping.maps.slice(numberSteps1), { user: 2 })
    return { tr, changes, tr1NoConflicts, tr2NoConflicts }
}

function removeConflictingSteps(tr, conflicts) {
    const doc = trDoc(tr),
        newTr = new Transform(doc),
        removedStepsMap = new Mapping()

    tr.steps.forEach((step, index) => {
        const mapped = step.map(removedStepsMap)
        if (!mapped) {
            return null // returning null to make linter happy (no-useless-return).
        } else if (conflicts.includes(index)) {
            removedStepsMap.appendMap(mapped.invert(newTr.doc).getMap())
        } else {
            newTr.maybeStep(mapped)
        }
    })
    return newTr
}

function findConflicts(tr1, tr2) {
    const changes1 = findContentChanges(tr1),
        changes2 = findContentChanges(tr2)
    let conflicts = []
    changes1.forEach(change1 => {
        changes2.forEach(change2 => {
            if (!(change1.toA < change2.fromA || change1.fromA > change2.toA)) {
                change1.inserted.forEach(span1 => {
                    change2.inserted.forEach(span2 => conflicts.push([span1.data.step, span2.data.step]))
                    change2.deleted.forEach(span2 => conflicts.push([span1.data.step, span2.data.step]))
                })
                change1.deleted.forEach(span1 => {
                    change2.inserted.forEach(span2 => conflicts.push([span1.data.step, span2.data.step]))
                    change2.deleted.forEach(span2 => conflicts.push([span1.data.step, span2.data.step]))
                })
            }
        })
    })
    // Remove duplicates
    const combinations = []
    conflicts = conflicts.filter(conflict => {
        if (combinations.includes(conflict[0]+'-'+conflict[1])) {
            return false
        }
        combinations.push(conflict[0]+'-'+conflict[1])
        return true
    })

    return conflicts
}

function findContentChanges(tr) {
    const doc = trDoc(tr)
    let changes = ChangeSet.create(doc)
    tr.steps.forEach((step, index) => {
        const doc = trDoc(tr, index + 1)
        changes = changes.addSteps(doc, [tr.mapping.maps[index]], { step: index })
    })

    return changes.changes
}

function createConflictingChanges(tr1Conflict, tr2Conflict) {
    const doc = trDoc(tr1Conflict),
        // We map the steps so that the positions are all at the level of the current
        // doc as there is no guarantee for the order in which they will be applied.
        // If one of them is being applied, the other ones will have to be remapped.
        conflictingSteps1 = tr1Conflict.steps.map((step, index) => [index, step.map(new Mapping(tr1Conflict.mapping.maps.slice(0, index)).invert())]),
        conflictingSteps2 = tr2Conflict.steps.map((step, index) => [index, step.map(new Mapping(tr2Conflict.mapping.maps.slice(0, index)).invert())])
    let conflictingChanges = []
    const iter = [
        { steps: conflictingSteps1, user: 1 },
        { steps: conflictingSteps2, user: 2 }
    ]

    iter.forEach(({ steps, user }) =>
        steps.forEach(([index, step]) => {
            if (!step) {
                return
            }
            const stepResult = step.apply(doc)
            // We need the potential changes if this step was to be applied. We find
            // the inversion of the change so that we can place it in the current doc.
            const invertedStepChanges = ChangeSet.create(stepResult.doc).addSteps(doc, [step.invert(doc).getMap()], { index, user })
            conflictingChanges = conflictingChanges.concat(invertedStepChanges.changes)
        })
    )
    return { conflictingChanges, conflictingSteps1, conflictingSteps2 }
}
