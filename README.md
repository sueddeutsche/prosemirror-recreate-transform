# prosemirror-recreate-steps

This is a non-core module of [ProseMirror](http://prosemirror.net).
ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

Every change to the document is recorded by ProseMirror as a step. 
This module allows recreating the steps needed to go from document 
A to B should these not be available otherwise, and it allows merging
two different `Transforms` (sets of steps) whose steps may be 
conflicting.

Recreating steps can be interesting for example in order to show the 
changes between two document versions without having access to the
original steps. Merging `Transforms` can be of iinterest should two
users have worked on the same document over time without any means 
for synchronizing their work.

Recreating a `Transform` works this way:

```js
import {recreateTransform} from "prosemirror-recreate-steps"

let tr = recreateTransform(
    startDoc, 
    endDoc, 
    complexSteps = true, // Whether step types other than ReplaceStep are allowed.
    wordDiffs = false // Whether diffs in text nodes should cover entire words.
)
```

Merging `Transforms` works this way:

```js
import {mergeTransform} from "prosemirror-recreate-steps"

let {
    tr, 
    merge
} = mergeTransform(
    tr1, 
    tr2, 
    automerge = true, // Whether to try to auto-merge conflicting changes 
    rebase = false, // Whether to rebase the changes in tr2 on top of those in tr1.
    wordDiffs = false // Whether diffs in text nodes should cover entire words.
)
```

The `tr` is a `Tranform` of all combined changes of `tr1` and `tr2` that are not 
conflicting if automerge is enabled (otherwise it's a `Transform` with 0 steps).

The `merge` is a `Merge` object that contains information about all conflicting steps
and how they conflict with oneanother. Look at the examples in the demo folder on
how to make use of it. 
