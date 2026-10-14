import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router';
import { Alert, Box, Button, Container, CssBaseline, Menu, MenuItem, Stack, Typography } from '@mui/material';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { explicitVue, ownsReact, type RouteMap } from '../../wf6/route-policy.mjs';
import { accessToken, clearAccessToken, createRecipeApi, logoutRequest, SessionError, type Identity } from './api.ts';
import { RecipePages } from './recipes.tsx';
import { recipeStrings } from './strings.ts';
declare const __WF6_REACT_SOURCE__: string;
type Session = { kind: 'loading' } | { kind: 'allowed'; user: Identity; map: RouteMap } | { kind: 'vue' | 'error'; reason: string; map?: RouteMap };
void i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false }, resources: { en: { translation: {
  ...recipeStrings, title: 'Recipes', scope: 'Recipes, search and comments are available here. Settings pages, editing and other features use Vue.',
  loading: 'Checking the real session…', shopping: 'Open Vue shopping lists', vue: 'Use explicit Vue entry', login: 'Use Vue login',
} } } });
function App() {
  const { t } = useTranslation(); const location = useLocation(); const target = location.pathname + location.search + location.hash;
  const [session, setSession] = useState<Session>({ kind: 'loading' }); const [settings, setSettings] = useState<HTMLElement | null>(null);
  const [signingOut, setSigningOut] = useState(false); const bootstrap = useRef<AbortController | null>(null);
  const login = useCallback(() => { clearAccessToken(); const current = window.location.pathname + window.location.search + window.location.hash; window.location.assign(`/login?redirect=${encodeURIComponent(current)}`); }, []);
  useEffect(() => {
    const abort = new AbortController(); bootstrap.current = abort;
    void (async () => {
      const mapResponse = await fetch('/_wf6/route-map.json', { signal: abort.signal, cache: 'no-store' });
      if (!mapResponse.ok) throw new Error(`Route configuration unavailable (${mapResponse.status})`);
      const map = await mapResponse.json() as RouteMap;
      const token = accessToken(); const headers: HeadersInit = token ? { authorization: `Bearer ${token}` } : {};
      const response = await fetch('/api/users/self', { headers, credentials: 'same-origin', signal: abort.signal, cache: 'no-store' });
      if (response.status === 401) { login(); return; }
      if (!response.ok) throw new Error(`Session API failed (${response.status})`);
      const user = await response.json() as Identity; abort.signal.throwIfAborted();
      if (!user.id || !user.groupId || user.groupSlug !== map.groupSlug) { setSession({ kind: 'vue', reason: 'Session group does not match the configured pilot', map }); return; }
      setSession({ kind: 'allowed', user, map });
    })().catch(error => { if (!abort.signal.aborted) setSession({ kind: 'error', reason: error instanceof Error ? error.message : 'Session unavailable' }); });
    return () => abort.abort();
  }, [login]);
  const map = session.kind !== 'loading' && session.map ? session.map : { explicitVueQuery: { name: 'wf6', value: 'vue' }, takeoverEnabled: false, groupSlug: null, version: 1, excludedSlugs: [], vueModes: [] };
  const vue = explicitVue(target, map); const user = session.kind === 'allowed' ? session.user : null;
  const api = useMemo(() => user ? createRecipeApi(user) : null, [user]);
  const sessionFailure = useCallback((error: SessionError) => {
    api?.cancel(); setSettings(null);
    if (error.status === 401) { setSession({ kind: 'loading' }); login(); }
    else setSession(current => ({ kind: 'vue', reason: error.message, ...(current.kind !== 'loading' && current.map ? { map: current.map } : {}) }));
  }, [api, login]);
  useEffect(() => { if (session.kind === 'allowed' && !ownsReact(target, session.map)) window.location.assign(target); }, [session, target]);
  async function logout() {
    if (signingOut) return;
    const token = accessToken(); setSigningOut(true); api?.cancel(); bootstrap.current?.abort(); setSettings(null); setSession({ kind: 'loading' });
    try { await logoutRequest(fetch, token); clearAccessToken(); window.location.assign('/login?direct=1'); }
    catch (error) { clearAccessToken(); setSigningOut(false); setSession({ kind: 'error', reason: error instanceof Error ? error.message : 'Logout failed; local session cleared' }); }
  }
  return <Container component="main" maxWidth="md" data-wf6-frontend="react" data-wf6-react-source={__WF6_REACT_SOURCE__}>
    <CssBaseline /><Box sx={{ py: 4 }}><Stack spacing={2}>
      <Alert severity="info">{t('scope')}</Alert>
      {session.kind === 'loading' && <Typography role="status">{signingOut ? 'Signing out…' : t('loading')}</Typography>}
      {(session.kind === 'vue' || session.kind === 'error') && <Alert severity={session.kind === 'error' ? 'error' : 'warning'} data-wf6-session={session.kind === 'error' ? 'error' : 'vue-required'}>{session.reason}</Alert>}
      {session.kind === 'allowed' && <>
        <Box data-wf6-session="authenticated" data-wf6-user-id={session.user.id} data-wf6-group={session.user.groupSlug}>
          <Typography>Authenticated as {session.user.fullName}</Typography><Typography>Group: {session.user.groupSlug}</Typography>
        </Box>
        <Stack direction="row" spacing={2}><Button onClick={event => setSettings(event.currentTarget)}>Settings</Button><Button onClick={() => { void logout(); }} disabled={signingOut}>Logout</Button></Stack>
        <Menu anchorEl={settings} open={Boolean(settings)} onClose={() => setSettings(null)}>
          <MenuItem component="a" href="/user/profile">User Settings (Vue)</MenuItem>
          {session.user.householdId && <MenuItem component="a" href="/household">Household Settings (Vue)</MenuItem>}
          {session.user.canManage === true && <MenuItem component="a" href="/group/data">Data Management (Vue)</MenuItem>}
          {session.user.admin === true && <MenuItem component="a" href="/admin/site-settings">Admin Settings (Vue)</MenuItem>}
        </Menu>
        {api && ownsReact(target, session.map) && <RecipePages api={api} group={session.user.groupSlug} onSessionFailure={sessionFailure} />}
        <Button component="a" href="/shopping-lists?disableRedirect=true">{t('shopping')}</Button>
      </>}
      <Button component="a" href={vue}>{t('vue')}</Button>
      {(session.kind === 'vue' || session.kind === 'error') && <Button component="a" href={`/login?redirect=${encodeURIComponent(vue)}`}>{t('login')}</Button>}
    </Stack></Box>
  </Container>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
