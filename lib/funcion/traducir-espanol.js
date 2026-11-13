const CACHE_MAX = 300;
const TRANSLATE_TIMEOUT_MS = 8000;
const cache = new Map();

function shouldTranslate(text) {
  const value = String(text || '').trim();
  return value.length > 1 && /[A-Za-z\u00C0-\u024F]/.test(value);
}

function remember(key, value) {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

async function translateChunk(text) {
  const cached = cache.get(text);
  if (cached) return cached;

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', 'es');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const response = await fetch(url, { signal: AbortSignal.timeout(TRANSLATE_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map(part => part?.[0] || '').join('')
    : '';
  const result = translated.trim() ? translated : text;
  remember(text, result);
  return result;
}

/** Traduce cada línea para que un fallo aislado no descarte las demás traducciones. */
export async function traducirAlEspanol(text) {
  const original = String(text || '');
  if (!shouldTranslate(original)) return original;

  const lines = original.split('\n');
  const translated = [];
  for (const line of lines) {
    if (!shouldTranslate(line) || /^\s*(?:https?:\/\/|[/.!#@][\w-]+\s*$)/i.test(line)) {
      translated.push(line);
      continue;
    }
    try {
      translated.push(await translateChunk(line));
    } catch (error) {
      console.warn(`[traduccion-es] No se pudo traducir una línea: ${error.message}`);
      translated.push(line);
    }
  }
  return translated.join('\n');
}

