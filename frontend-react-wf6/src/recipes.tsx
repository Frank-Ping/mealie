import { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router';
import { Alert, Button, Card, CardActionArea, CardContent, Chip, Pagination, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Recipe, RecipeSummary } from '../../frontend/app/lib/api/types/recipe.ts';
import { SessionError, type RecipeApi } from './api.ts';
import { ingredientText, recipeLink } from './model.ts';

type Load<T> = { kind: 'loading' } | { kind: 'ready'; value: T } | { kind: 'error'; message: string };
interface Props { api: RecipeApi; group: string; onSessionFailure: (reason: string) => void }

function RecipeList({ api, group, onSessionFailure }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [reload, setReload] = useState(0);
  const [state, setState] = useState<Load<{ items: RecipeSummary[]; total_pages: number }>>({ kind: 'loading' });
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setState({ kind: 'loading' });
      void api.list(search, page, abort.signal).then(value => { if (!abort.signal.aborted) setState({ kind: 'ready', value }); }).catch(error => {
        if (abort.signal.aborted) return;
        if (error instanceof SessionError) onSessionFailure(error.message);
        else setState({ kind: 'error', message: error instanceof Error ? error.message : 'Recipe request failed' });
      });
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [api, search, page, reload, onSessionFailure]);
  return <Stack spacing={2} data-wf6-business="list">
    <Typography component="h1" variant="h4">{t('recipes')}</Typography>
    <TextField label={t('search')} placeholder={t('search')} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
    {state.kind === 'loading' && <Typography role="status">{t('loadingRecipes')}</Typography>}
    {state.kind === 'error' && <Alert severity="error" role="alert">{state.message} <Button onClick={() => setReload(value => value + 1)}>Retry</Button></Alert>}
    {state.kind === 'ready' && state.value.items.length === 0 && <Typography role="status">{t('empty')}</Typography>}
    {state.kind === 'ready' && state.value.items.map(recipe => recipe.slug && <Card key={recipe.id ?? recipe.slug}>
      <CardActionArea component={Link} to={recipeLink(group, recipe.slug)} aria-label={recipe.name ?? 'Untitled recipe'}>
        <CardContent><Typography component="h2" variant="h6">{recipe.name ?? 'Untitled recipe'}</Typography>{recipe.description && <Typography>{recipe.description}</Typography>}</CardContent>
      </CardActionArea>
    </Card>)}
    {state.kind === 'ready' && state.value.total_pages > 1 && <Pagination count={state.value.total_pages} page={page} onChange={(_, value) => setPage(value)} />}
  </Stack>;
}

function RecipeDetail({ api, group, onSessionFailure }: Props) {
  const { slug } = useParams(); const { t } = useTranslation(); const [reload, setReload] = useState(0);
  const [state, setState] = useState<Load<Recipe>>({ kind: 'loading' });
  useEffect(() => {
    const abort = new AbortController();
    setState({ kind: 'loading' });
    void api.detail(slug ?? '', abort.signal).then(value => { if (!abort.signal.aborted) setState({ kind: 'ready', value }); }).catch(error => {
      if (abort.signal.aborted) return;
      if (error instanceof SessionError) onSessionFailure(error.message);
      else setState({ kind: 'error', message: error instanceof Error ? error.message : 'Recipe request failed' });
    });
    return () => abort.abort();
  }, [api, slug, reload, onSessionFailure]);
  return <Stack spacing={2} data-wf6-business="detail">
    <Button component={Link} to={`/g/${group}`}>{t('back')}</Button>
    {state.kind === 'loading' && <Typography role="status">{t('loadingRecipe')}</Typography>}
    {state.kind === 'error' && <Alert severity="error" role="alert">{state.message} <Button onClick={() => setReload(value => value + 1)}>Retry</Button></Alert>}
    {state.kind === 'ready' && <>
      <Typography component="h1" variant="h4">{state.value.name ?? 'Untitled recipe'}</Typography>
      {state.value.description && <Typography>{state.value.description}</Typography>}
      <Typography component="h2" variant="h5">{t('ingredients')}</Typography>
      {(state.value.recipeIngredient ?? []).length === 0 && <Typography>No ingredients provided</Typography>}
      <ul>{state.value.recipeIngredient?.map((ingredient, index) => <li key={ingredient.referenceId ?? index}>{ingredient.title && <Typography component="h3">{ingredient.title}</Typography>}{ingredientText(ingredient)}</li>)}</ul>
      <Typography component="h2" variant="h5">{t('instructions')}</Typography>
      {(state.value.recipeInstructions ?? []).length === 0 && <Typography>No instructions provided</Typography>}
      <ol>{state.value.recipeInstructions?.map((step, index) => <li key={step.id ?? index}>{step.title && <Typography component="h3">{step.title}</Typography>}<Typography sx={{ whiteSpace: 'pre-wrap' }}>{step.text}</Typography></li>)}</ol>
      {([['tools', state.value.tools], ['categories', state.value.recipeCategory], ['tags', state.value.tags]] as const).map(([label, values]) => <Stack key={label} spacing={1}>
        <Typography component="h2" variant="h5">{t(label)}</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{values?.map(value => <Chip key={value.id} label={value.name} />)}</Stack>
      </Stack>)}
    </>}
  </Stack>;
}

export function RecipePages(props: Props) {
  return <Routes><Route path="/g/:groupSlug" element={<RecipeList {...props} />} /><Route path="/g/:groupSlug/r/:slug" element={<RecipeDetail {...props} />} /></Routes>;
}
