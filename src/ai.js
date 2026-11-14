export const PROVIDERS = { gemini: 'Google Gemini', openai: 'OpenAI', claude: 'Anthropic Claude', ollama: 'Ollama (local)' };
const base = (c) => (c.baseUrl || 'http://localhost:11434').replace(/\/$/, '');

function listReq(c) {
  if (c.provider === 'gemini') return ['https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { 'x-goog-api-key': c.key }];
  if (c.provider === 'openai') return ['https://api.openai.com/v1/models', { Authorization: `Bearer ${c.key}` }];
  if (c.provider === 'claude') return ['https://api.anthropic.com/v1/models', { 'x-api-key': c.key, 'anthropic-version': '2023-06-01' }];
  return [`${base(c)}/api/tags`, {}];
}
function modelsOf(c, d) {
  if (c.provider === 'gemini') return (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
  if (c.provider === 'openai') return (d.data || []).map((m) => m.id).filter((id) => /^(gpt|o\d)/.test(id));
  if (c.provider === 'claude') return (d.data || []).map((m) => m.id);
  return (d.models || []).map((m) => m.name);
}

// Live check: real round trip to the provider's model list
export async function validate(c) {
  const [url, headers] = listReq(c);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers });
    const ms = Date.now() - t0;
    if (!r.ok) {
      const bad = [400, 401, 403].includes(r.status);
      return { color: 'red', ms, models: [], message: bad ? `Key rejected (HTTP ${r.status}).` : r.status === 429 ? 'Rate limit or quota exceeded (HTTP 429).' : `Provider error (HTTP ${r.status}).` };
    }
    return { color: 'green', ms, message: 'Valid and active.', models: modelsOf(c, await r.json()) };
  } catch {
    return { color: 'yellow', ms: Date.now() - t0, models: [], message: 'Network problem. Could not reach the provider.' };
  }
}

export async function callAi(c, system, user) {
  const headers = { 'Content-Type': 'application/json' };
  let url, body, pick;
  if (c.provider === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent`;
    headers['x-goog-api-key'] = c.key;
    body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }] };
    pick = (d) => (d.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('');
  } else if (c.provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers.Authorization = `Bearer ${c.key}`;
    body = { model: c.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
    pick = (d) => d.choices?.[0]?.message?.content;
  } else if (c.provider === 'claude') {
    url = 'https://api.anthropic.com/v1/messages';
    headers['x-api-key'] = c.key;
    headers['anthropic-version'] = '2023-06-01';
    body = { model: c.model, max_tokens: 3000, system, messages: [{ role: 'user', content: user }] };
    pick = (d) => (d.content || []).map((p) => p.text).join('');
  } else {
    url = `${base(c)}/api/chat`;
    body = { model: c.model, stream: false, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
    pick = (d) => d.message?.content;
  }
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`AI request failed (HTTP ${r.status}). Check your key and model.`);
  const out = pick(await r.json());
  if (!out) throw new Error('The model returned no text.');
  return out;
}
