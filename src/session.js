// Sign-in for the read page through login.flisk.si (flisk-sh/login). A token there is "<payload>.<signature>", Ed25519,
// made for one site (aud) and good for 60 seconds; this Worker needs only the PUBLIC key. After that we keep our own
// signed cookie, and only logins listed in ADMIN_LOGINS may read.
const enc = new TextEncoder();
const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const SESSION_DAYS = 7;

export async function verifyLoginToken(token, publicKey, audience, now = Date.now()) {
  try {
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;
    const key = await crypto.subtle.importKey('raw', unb64u(publicKey), 'Ed25519', false, ['verify']);
    if (!(await crypto.subtle.verify('Ed25519', key, unb64u(sig), enc.encode(payload)))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    if (p.aud !== audience || !(p.exp * 1000 > now) || typeof p.login !== 'string' || !Number.isSafeInteger(p.id)) return null;
    return { login: p.login, id: p.id };
  } catch { return null; }
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}
export const mayRead = (env, login) => String(env.ADMIN_LOGINS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean).includes(String(login).toLowerCase());

export async function makeSession(env, login, now = Date.now()) {
  const body = `${login}.${Math.floor(now / 1000) + SESSION_DAYS * 86400}`;
  return `traces_session=${body}.${await hmac(env.SESSION_SECRET, body)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
// The login name when the cookie is ours, not expired and the person may read; otherwise null.
export async function readSession(env, request, now = Date.now()) {
  const raw = /(?:^|;\s*)traces_session=([^;]+)/.exec(request.headers.get('cookie') || '')?.[1] || '';
  if (!raw || !env.SESSION_SECRET) return null;
  const at = raw.lastIndexOf('.');
  const body = raw.slice(0, at);
  if ((await hmac(env.SESSION_SECRET, body)) !== raw.slice(at + 1)) return null;
  const dot = body.lastIndexOf('.');
  const login = body.slice(0, dot);
  if (!(Number(body.slice(dot + 1)) * 1000 > now) || !mayRead(env, login)) return null;
  return login;
}
