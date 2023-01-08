import { BaseEditor, Editor, Operation } from "slate"

interface History {
  undos: Operation[][];
  redos: Operation[][];
}

export const MERGING = new WeakMap<Editor, boolean | undefined>();
export const SAVING = new WeakMap<Editor, boolean | undefined>();

export interface HistoryEditor extends BaseEditor {
  history: History
  undo: () => void
  redo: () => void
}

export const HistoryEditor = {
  isSaving(editor: Editor) {
    return SAVING.get(editor);
  },

  undo(editor: HistoryEditor) {
    editor.undo();
  },

  redo(editor: HistoryEditor) {
    editor.redo();
  },

  withoutSaving(editor: Editor, fn: () => void) {
    const prevIsSaving = HistoryEditor.isSaving(editor);
    SAVING.set(editor, false);
    fn();
    SAVING.set(editor, prevIsSaving);
  },

  isMering(editor: Editor) {
    return MERGING.get(editor);
  },

  withoutMering(editor: Editor, fn: () => void) {
    const prevIsMering = HistoryEditor.isMering(editor);
    MERGING.set(editor, false);
    fn();
    MERGING.set(editor, prevIsMering);
  },
};