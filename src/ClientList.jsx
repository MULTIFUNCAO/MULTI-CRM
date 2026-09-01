import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "./api";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, background: "white" }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// Conteúdo da seção "Clientes" — o chrome (sidebar, "Sair") mora em
// Layout.jsx desde a Fase 2. Fase 3: filtros de cidade/categoria/status
// são combináveis e batem direto no backend (GET /api/admin/clientes com
// query params) — cada troca de dropdown refaz a busca; só a busca por
// texto (nome/e-mail/cidade) continua no cliente, sobre o resultado que já
// veio filtrado do servidor.
export default function ClientList({ onSelectClient, onUnauthorized }) {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [opcoes, setOpcoes] = useState({ cidades: [], categorias: [] });

  useEffect(() => {
    adminFetch("/api/admin/clientes-filtros")
      .then(setOpcoes)
      .catch(() => {}); // dropdown vazio não pode travar o resto da tela
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroCidade) params.set("cidade", filtroCidade);
    if (filtroCategoria) params.set("categoria", filtroCategoria);
    if (filtroStatus) params.set("status", filtroStatus);
    const qs = params.toString();
    adminFetch("/api/admin/clientes" + (qs ? "?" + qs : ""))
      .then(setClientes)
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  }, [filtroCidade, filtroCategoria, filtroStatus, onUnauthorized]);

  const filtrados = useMemo(() => {
    if (!clientes) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(termo) ||
        (c.email || "").toLowerCase().includes(termo) ||
        (c.city || "").toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  const algumFiltroAtivo = busca || filtroCidade || filtroCategoria || filtroStatus;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Clientes</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
          {!clientes
            ? "Carregando..."
            : algumFiltroAtivo
            ? `${filtrados.length} de ${clientes.length} cliente(s)`
            : `${clientes.length} cliente(s) cadastrado(s)`}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar por nome, e-mail ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: "1 1 240px",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            fontSize: 14,
          }}
        />
        <FilterSelect value={filtroCidade} onChange={setFiltroCidade} options={opcoes.cidades} placeholder="Todas as cidades" />
        <FilterSelect value={filtroCategoria} onChange={setFiltroCategoria} options={opcoes.categorias} placeholder="Todas as categorias" />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, background: "white" }}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="sem_solicitacao">Nunca solicitou</option>
        </select>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!clientes && !error && (
        <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando clientes...</div>
      )}

      {clientes && (
        <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                  {["Nome", "Contato", "Cidade", "Cadastro", "Solicitações", "Propostas", "Fechamentos", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr
                    key={c.email}
                    onClick={() => onSelectClient(c.email)}
                    style={{ borderTop: "1px solid #F3F4F6", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{c.name || "(sem nome)"}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>
                      <div>{c.email}</div>
                      <div style={{ color: "#9CA3AF", fontSize: 12 }}>{c.whatsapp || "sem telefone"}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{c.city || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#374151", whiteSpace: "nowrap" }}>{formatDate(c.created_at)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>{c.services_count}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>{c.propostas_recebidas}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>{c.completed_count}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: c.status_engajamento === "ativo" ? "#ECFDF5" : "#F3F4F6",
                          color: c.status_engajamento === "ativo" ? "#059669" : "#6B7280",
                        }}
                      >
                        {c.status_engajamento === "ativo" ? "Ativo" : "Nunca solicitou"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
