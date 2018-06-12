import {
    Transform
} from "prosemirror-transform"

export function mergeTransforms(doc, tr1, tr2) {
    let tr = new Transform(doc)
    tr1.steps.forEach(step => tr.step(step))
    tr2.steps.forEach(step => {
        let mapped = step.map(tr1.mapping)
        if (!mapped) {
            console.log({error: 'step not mapped!', step})
            return
        }
        tr.step(mapped)
    })

    return tr
}
