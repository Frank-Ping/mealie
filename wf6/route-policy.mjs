export function ownsReact(target, map) {
  const url = new URL(target, 'http://wf6.local');
  if (!map.takeoverEnabled || !map.groupSlug || url.searchParams.get(map.explicitVueQuery.name) === map.explicitVueQuery.value) return false;
  const modes = new Set(map.vueModes);
  for (const [key, value] of url.searchParams) {
    if (modes.has(key) && !['', 'false', '0'].includes(value.toLowerCase())) return false;
    if ((key === 'mode' || key === 'view') && modes.has(value.toLowerCase())) return false;
  }
  let parts;
  try { parts = url.pathname.replace(/\/$/, '').split('/').slice(1).map(decodeURIComponent); } catch { return false; }
  if (parts.some(part => !part || part.includes('/') || part.includes('\\'))) return false;
  if (parts[0] !== 'g' || parts[1] !== map.groupSlug) return false;
  if (parts.length === 2) return true;
  return parts.length === 4 && parts[2] === 'r' && !map.excludedSlugs.includes(parts[3]);
}

export function explicitVue(target, map) {
  const url = new URL(target, 'http://wf6.local');
  url.searchParams.set(map.explicitVueQuery.name, map.explicitVueQuery.value);
  return url.pathname + url.search + url.hash;
}
