declare module 'prosemirror-changeset' {
  import { StepMap } from "prosemirror-transform"
  import { Slice } from "prosemirror-model"
  import { Node } from "prosemirror-model"
  
    export class Span {
    readonly from: number
    readonly to: number
    readonly data: any
  }
  
  export class DeletedSpan extends Span {
    readonly pos: number
    readonly slice: Slice
  }
  
  export type Metadata = any[] | {[key: string]: any}
  
  export class ChangeSet {
    readonly inserted: Span[]
    readonly deleted: DeletedSpan[]
    addSteps (newDoc: Node<any>, maps: ReadonlyArray<StepMap>, data: Metadata): ChangeSet
    static create (doc: Node, object ?: { compare: (a: Metadata, b: Metadata) => boolean, combine ?: (a: Metadata) => Metadata})
  }
}

