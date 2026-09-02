// Cliente HTTP pro MULTI-BACKEND (mesmo backend do app cliente/profissional
// — ver auditoria Fase 1). O Admin/CRM não conecta direto no Supabase: usa
// as rotas /api/admin/* do MULTI-BACKEND, autenticadas por token HMAC.
//
// Fase 4: login passou a ser por pessoa (POST /api/admin/equipe/login,
// tabela crm_equipe — Thiago administrador, Ana vendedora), não mais a
// senha única do Admin antigo. O backend ainda aceita os dois tipos de
// token nas mesmas rotas (retrocompatível com o Admin antigo em
// AdminDashboard.jsx, que não foi tocado), mas este frontend (MULTI-CRM)
// só usa o login novo daqui pra frente.

export const API_BASE =
  import.meta.env.VITE_API_URL || "https://multi-backend-lfwp.onrender.com";

const TOKEN_KEY = "multi_crm_admin_token";
const IDENTITY_KEY = "multi_crm_identity"; // { nome, role }

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getIdentity() {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY)) || null;
  } catch {
    return null;
  }
}

function setSession(token, identity) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IDENTITY_KEY);
}

// Faz um GET/POST/etc autenticado em /api/admin/*. Em 401 (token ausente,
// expirado ou inválido) limpa a sessão guardada — quem chama decide navegar
// de volta pro login (ver App.jsx). 403 (sem permissão pro role) não limpa
// sessão, só propaga o erro — a pessoa continua logada, só não pode fazer
// aquela ação específica.
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

// Download autenticado (CSV etc.) — não dá pra só usar <a href> porque o
// endpoint exige o header x-admin-key, que um link comum não manda. Busca
// como blob e simula o clique num <a> temporário com URL.createObjectURL.
export async function adminDownload(path, nomeArquivo) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    headers: token ? { "x-admin-key": token } : {},
  });
  if (res.status === 401) {
    clearToken();
    const err = new Error("Sessão expirada. Faça login novamente.");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Erro ${res.status} ao baixar ${path}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function login(email, senha) {
  const res = await fetch(API_BASE + "/api/admin/equipe/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Falha no login");
  setSession(body.token, { nome: body.nome, role: body.role });
  return body;
}
