// Cliente HTTP pro MULTI-BACKEND (mesmo backend do app cliente/profissional
// — ver auditoria Fase 1). O Admin/CRM não conecta direto no Supabase: usa
// as mesmas rotas /api/admin/* que o AdminDashboard.jsx antigo já usa,
// autenticadas pelo mesmo esquema de token HMAC (POST /api/admin/login).

export const API_BASE =
  import.meta.env.VITE_API_URL || "https://multi-backend-lfwp.onrender.com";

const TOKEN_KEY = "multi_crm_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Faz um GET/POST/etc autenticado em /api/admin/*. Em 401 (token ausente,
// expirado ou inválido) limpa o token guardado — quem chama decide navegar
// de volta pro login (ver App.jsx).
export async function adminFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-key": token } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    const err = new Error("Sessão expirada. Faça login novamente.");
    err.unauthorized = true;
    throw err;
  }
  let body = null;
  try { body = await res.json(); } catch { /* resposta sem corpo JSON */ }
  if (!res.ok) {
    throw new Error(body?.error || `Erro ${res.status} ao chamar ${path}`);
  }
  return body;
}

export async function login(password) {
  const res = await fetch(API_BASE + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Falha no login");
  setToken(body.token);
  return body.token;
}
