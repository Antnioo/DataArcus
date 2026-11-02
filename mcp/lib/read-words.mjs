// The tool layer's words for the reading block's coded errors (A1-9, the audit of the reading block: the reader returns
// a code and its data; the tools say it to the user). An error without a code keeps its own message.
export function wordOf(e) {
  const d = (e && e.data) || {};
  switch (e && e.code) {
    case 'MANY_MODELS_NAMED': return `${e.message} Give read_model the path of the one you mean.`;
    case 'MANY_MODELS': return `${e.message} Give read_model the path of the one you mean.`;
    case 'NO_MODEL_NAMED': return `${e.message} ${(d.models || []).length ? 'Give read_model one of these paths, or "." for the working folder itself.' : 'Give read_model the path of a project folder, or "." for the working folder itself.'}`;
    // (0.3.1 MR1, B-271) a model path that does not exist: as a bare wrong name, the tool called again with one listed
    case 'NO_MODEL_AT': return `${e.message} ${(d.models || []).length ? 'Call the tool again with one of these paths (relative to the working folder), or "." for the working folder itself.' : 'Call the tool again with the path of a project folder, or "." for the working folder itself.'}`;
    default: return String((e && e.message) || e);
  }
}
