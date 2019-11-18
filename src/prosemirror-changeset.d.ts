declare module 'prosemirror-changeset' {
    import { StepMap } from "prosemirror-transform"
    import { Slice } from "prosemirror-model"
    import { Node } from "prosemirror-model"

    export class Span {
        readonly length: number
        readonly data: any
    }

    export class Change {
        readonly fromA: number
        readonly toA: number
        readonly fromB: number
        readonly toB: number
        readonly deleted: Span[]
        readonly added: Span[]
    }

    export type Metadata = any[] | {[key: string]: any}

    export class ChangeSet {
        readonly changes: Change[]
        addSteps (newDoc: Node<any>, maps: ReadonlyArray<StepMap>, data: Metadata): ChangeSet
        static create (doc: Node)
    }
}

