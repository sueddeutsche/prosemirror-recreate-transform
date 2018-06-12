import {
    Transform
} from "prosemirror-transform"
import {
    ChangeSet
} from "prosemirror-changeset"

export function mergeTransforms(doc, tr1, tr2) {
    let tr = new Transform(doc),
        changes = ChangeSet.create(doc)

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
