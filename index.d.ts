import { Transform, ReplaceStep } from "prosemirror-transform"
import { Node, Schema } from "prosemirror-model"

import { applyPatch, Operation } from "rfc6902"
import { ReplaceOperation } from "rfc6902/diff"

import { ChangeSet } from "prosemirror-changeset"

// merge.js

export function mergeTransforms(tr1: Transform, tr2: Transform, rebase ?: boolean, wordDiffs ?: boolean): { tr: Transform, merge: Merge }

export type StepPair = [Step<any>, Step<any>]

export class Merge {
  public readonly doc: Node
  public readonly changes: ChangeSet
  public readonly conflicts: Array<StepPair>
  public readonly conflictingSteps1: Array<Array<Step<any>>>
  public readonly conflictingSteps2: Array<Array<Step<any>>>
  public readonly conflictingChanges: ChangeSetLike

  constructor(
      doc: Node,
      changes: ChangeSet,
      conflicts?: Array<StepPair>,
      conflictingSteps1 ?: Array<Array<Step<any>>>,
      conflictingSteps2 ?: Array<Array<Step<any>>>,
      conflictingChanges ?: ChangeSetLike
  )

  public map(mapping: Mapping, doc: Node): Merge
  public apply(user, index): MergeTransformPair
  public reject(user, index): { merge: Merge }
  public applyAll(user: number): { tr: Transform, merge: Merge }
}
// recreate.js

export function getReplaceStep(fromDoc: Node, toDoc: Node): ReplaceStep | null

export class RecreateTransform {
  readonly fromNode: Node
  readonly toDoc: Node

  readonly complexSteps: boolean
  readonly wordDiffs: boolean

  readonly schema: Schema
  readonly tr: Transform
  readonly currentJSON: { [key: string]: any }
  readonly finalJSON: { [key: string]: any }
  readonly ops: Operation[]

  constructor (fromDoc: Node, toDoc: Node, complexSteps: boolean, wordDiffs: boolean)
  init (): Transform

  recreateChangeContentSteps (): void
  recreateChangeMarkSteps (): void

  marklessDoc: Node<any>

  addReplaceStep (toDoc: Node, afterStepJSON: {[key: string]: any})
  addSetNodeMarkup (): void

  addReplaceTextSteps (op: ReplaceOperation, afterStepJSON: { [key: string]: any })

  public simplifyTr(): void
}

export function recreateTransform(fromDoc: Node, toDoc: Node, complexSteps?: boolean, wordDiffs?: boolean): Transform

