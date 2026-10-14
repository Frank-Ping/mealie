import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router';
import { Alert, Box, Button, Container, CssBaseline, Stack, Typography } from '@mui/material';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { explicitVue, ownsReact, type RouteMap } from '../../wf6/route-policy.mjs';

declare const __WF6_REACT_SOURCE__: string;
import { createRecipeApi, type Identity } from './api.ts';
import { RecipePages } from './recipes.tsx';
import { recipeStrings } from './strings.ts';
type Session = { kind: 'loading' } | { kind: 'allowed'; user: Identity; map: RouteMap } | { kind: 'vue'; reason: string; map?: RouteMap };
void i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false }, resources: { en: { translation: {
  ...recipeStrings, title: 'Recipes', scope: 'Read-only recipes. Editing and other features remain available through the Vue entry.',
  loading: 'Checking the real session…', shopping: 'Open Vue shopping lists', list: 'Open React list probe', detail: 'Open React detail probe', vue: 'Use explicit Vue entry', login: 'Use Vue login',
} } } });

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const target = location.pathname + location.search + location.hash;
  const [session, setSession] = useState<Session>({ kind: 'loading' });
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      const mapResponse = await fetch('/_wf6/route-map.json', { signal: abort.signal });
      if (!mapResponse.ok) throw new Error('Route configuration unavailable');
      const map = await mapResponse.json() as RouteMap;
      const cookie = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('mealie.access_token='));
      const token = cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : null;
      const headers: HeadersInit = token ? { authorization: `Bearer ${token}` } : {};
      const response = await fetch('/api/users/self', { headers, credentials: 'same-origin', signal: abort.signal });
      if (response.status === 401) return setSession({ kind: 'vue', reason: 'Anonymous or expired session (401)', map });
      if (!response.ok) return setSession({ kind: 'vue', reason: `Session API failed (${response.status})`, map });
      const user = await response.json() as Identity;
      if (!user.id || !user.groupId || user.groupSlug !== map.groupSlug) return setSession({ kind: 'vue', reason: 'Session group does not match the configured pilot', map });
      setSession({ kind: 'allowed', user, map });
    })().catch(error => { if (!abort.signal.aborted) setSession({ kind: 'vue', reason: error instanceof Error ? error.message : 'Session unavailable' }); });
    return () => abort.abort();
  }, []);
  const map = session.kind !== 'loading' && session.map ? session.map : { explicitVueQuery: { name: 'wf6', value: 'vue' }, takeoverEnabled: false, groupSlug: null, version: 1, excludedSlugs: [], vueModes: [] };
  const vue = explicitVue(target, map);
  const user = session.kind === 'allowed' ? session.user : null;
  const api = useMemo(() => user ? createRecipeApi(user) : null, [user]);
  const sessionFailure = useCallback((reason: string) => setSession(current => ({ kind: 'vue', reason, ...(current.kind !== 'loading' && current.map ? { map: current.map } : {}) })), []);
  useEffect(() => { if (session.kind === 'allowed' && !ownsReact(target, session.map)) window.location.assign(target); }, [session, target]);
  return <Container component="main" maxWidth="md" data-wf6-frontend="react" data-wf6-react-source={__WF6_REACT_SOURCE__}>
    <CssBaseline /><Box sx={{ py: 4 }}><Stack spacing={2}>
      <Alert severity="info">{t('scope')}</Alert>
      {session.kind === 'loading' && <Typography role="status">{t('loading')}</Typography>}
      {session.kind === 'vue' && <Alert severity="warning" data-wf6-session="vue-required">{session.reason}</Alert>}
      {session.kind === 'allowed' && <>
        <Box data-wf6-session="authenticated" data-wf6-user-id={session.user.id} data-wf6-group={session.user.groupSlug}>
          <Typography>Authenticated as {session.user.fullName}</Typography><Typography>Group: {session.user.groupSlug}</Typography>
        </Box>
        {api && ownsReact(target, session.map) && <RecipePages api={api} group={session.user.groupSlug} onSessionFailure={sessionFailure} />}
        <Button component="a" href="/shopping-lists?disableRedirect=true">{t('shopping')}</Button>
      </>}
      <Button component="a" href={vue}>{t('vue')}</Button>
      {session.kind === 'vue' && <Button component="a" href={`/login?redirect=${encodeURIComponent(vue)}`}>{t('login')}</Button>}
    </Stack></Box>
  </Container>;
}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
