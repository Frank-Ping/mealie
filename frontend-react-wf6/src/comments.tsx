import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import type { Recipe, RecipeCommentOut } from '../../frontend/app/lib/api/types/recipe.ts';
import { SessionError, type RecipeApi } from './api.ts';
interface Props { api: RecipeApi; recipe: Recipe; onSessionFailure: (error: SessionError) => void }
export function RecipeComments({ api, recipe, onSessionFailure }: Props) {
  const [items, setItems] = useState<RecipeCommentOut[]>([]); const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true); const [text, setText] = useState(''); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); const [reload, setReload] = useState(0); const submitAbort = useRef<AbortController | null>(null); const submitLock = useRef(false);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError(null); setEnabled(false); setItems([]); setText(''); setSubmitting(false);
    void api.comments(recipe, abort.signal).then(result => { if (!abort.signal.aborted) { setItems(result.items); setEnabled(result.enabled); } }).catch(failure => {
      if (abort.signal.aborted) return;
      if (failure instanceof SessionError) onSessionFailure(failure); else setError(failure instanceof Error ? failure.message : 'Comment request failed');
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => { abort.abort(); submitAbort.current?.abort(); };
  }, [api, recipe, onSessionFailure, reload]);
  async function submit() {
    if (!text.trim() || !enabled || submitLock.current) return;
    const draft = text; submitLock.current = true; setText('');
    const abort = new AbortController(); submitAbort.current = abort; setSubmitting(true); setError(null);
    try {
      const saved = await api.submitComment(recipe, draft, abort.signal);
      if (!abort.signal.aborted) { setItems(current => [...current, saved]); setText(''); }
    } catch (failure) {
      if (abort.signal.aborted) return;
      setText(draft);
      if (failure instanceof SessionError) onSessionFailure(failure); else setError(failure instanceof Error ? failure.message : 'Comment submission failed');
    } finally { submitLock.current = false; if (!abort.signal.aborted) setSubmitting(false); }
  }
  return <Stack spacing={2} data-wf6-comments="server">
    <Typography component="h2" variant="h5">Comments</Typography>
    {loading && <Typography role="status">Loading comments…</Typography>}
    {!loading && !enabled && !error && <Typography>Comments are disabled</Typography>}
    {error && <Alert severity="error">{error} <Button onClick={() => setReload(value => value + 1)} disabled={submitting}>Reload comments</Button></Alert>}
    {!loading && enabled && <>{!submitting && <TextField label="Join the Conversation" multiline value={text} disabled={submitting} onChange={event => setText(event.target.value)} />}
      <Button onClick={() => { void submit(); }} disabled={submitting || !text.trim()}>Submit</Button>{submitting && <Typography role="status">Submitting comment…</Typography>}
      <Stack data-wf6-published-comments="server-saved">{items.map(comment => <Stack key={comment.id}><Typography>{comment.user.fullName ?? 'User'}</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{comment.text}</Typography></Stack>)}</Stack>
    </>}
  </Stack>;
}
