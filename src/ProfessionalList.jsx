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

const STATUS_LABEL = {
  approved: { label: "Aprovado", bg: "#ECFDF5", fg: "#059669" },
  pendente: { label: "Pendente", bg: "#FFFBEB", fg: "#B45309" },
};

// Correção do modelo financeiro (2026-09-01) — status do ciclo da Taxa de
// Acesso, só existe pra quem tem plano='acesso'. Mesmos 4 estados usados na
// Ficha do Profissional e no 7º alerta da Central de Operações.
export const CICLO_LABEL = {
  promocao_ativa: { emoji: "🟢", label: "Promoção ativa", bg: "#ECFDF5", fg: "#059669" },
  promocao_terminando: { emoji: "🟡", label: "Promoção terminando", bg: "#FFFBEB", fg: "#B45309" },
  mensalidade_ativa: { emoji: "🟢", label: "Mensalidade ativa", bg: "#ECFDF5", fg: "#059669" },
  em_atraso: { emoji: "🔴", label: "Em atraso", bg: "#FEF2F2", fg: "#DC2626" },
};

function CicloBadge({ ciclo }) {
  if (!ciclo) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>;
  const info = CICLO_LABEL[ciclo.status] || { emoji: "⚪", label: ciclo.status, bg: "#F3F4F6", fg: "#6B7280" };
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: info.bg, color: info.fg, whiteSpace: "nowrap" }}>
      {info.emoji} {info.label}
    </span>
  );
}

// Fase 3 — mesmo padrão visual/estrutural de ClientList.jsx. Filtros de
// cidade/categoria/status batem no backend (GET /api/admin/professionals
// com query params); busca por texto continua no cliente.
//
// initialFiltroStatus (Fase 1 do diagnóstico de estrutura do CRM,
// 2026-09-06): mesmo padrão de "initialBusca" em ClientList.jsx — permite a
// Visão Geral abrir esta tela já filtrada ao clicar num StatTile (ex:
// "Receita recorrente" → status=pago). Quem chama precisa trocar a `key` do
// componente (ver App.jsx) pra esse valor inicial ser respeitado de novo em
// cliques seguidos com status diferente.
export default function ProfessionalList({ onSelectProfessional, onUnauthorized, initialFiltroStatus }) {
  const [profissionais, setProfissionais] = useState(null);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState(initialFiltroStatus || "");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [opcoes, setOpcoes] = useState({ cidades: [], categorias: [] });

  useEffect(() => {
    adminFetch("/api/admin/professionals-filtros")
      .then(setOpcoes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroCidade) params.set("cidade", filtroCidade);
    if (filtroCategoria) params.set("categoria", filtroCategoria);
    if (filtroStatus) params.set("status", filtroStatus);
    const qs = params.toString();
    adminFetch("/api/admin/professionals" + (qs ? "?" + qs : ""))
      .then((d) => setProfissionais(d.professionals || []))
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  }, [filtroCidade, filtroCategoria, filtroStatus, onUnauthorized]);

  const filtrados = useMemo(() => {
    if (!profissionais) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return profissionais;
    return profissionais.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(termo) ||
        (p.email || "").toLowerCase().includes(termo) ||
        (p.city || "").toLowerCase().includes(termo)
    );
  }, [profissionais, busca]);

  const algumFiltroAtivo = busca || filtroCidade || filtroCategoria || filtroStatus;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Profissionais</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
          {!profissionais
            ? "Carregando..."
            : algumFiltroAtivo
            ? `${filtrados.length} de ${profissionais.length} profissional(is)`
            : `${profissionais.length} profissional(is) cadastrado(s)`}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar por nome, e-mail ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: "1 1 240px", padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14 }}
        />
        <FilterSelect value={filtroCidade} onChange={setFiltroCidade} options={opcoes.cidades} placeholder="Todas as cidades" />
        <FilterSelect value={filtroCategoria} onChange={setFiltroCategoria} options={opcoes.categorias} placeholder="Todas as categorias" />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, background: "white" }}
        >
          <option value="">Todos os status</option>
          <option value="approved">Aprovado</option>
          <option value="pendente">Pendente</option>
          <option value="role_divergente">Divergência de role (debug)</option>
          {/* "pago"/"pagamento_pendente" são sobre PAGAMENTO, eixo diferente
              de aprovado/pendente acima (que é sobre aprovação de cadastro)
              — ver comentário em GET /api/admin/professionals. */}
          <option value="pago">Pagamento confirmado</option>
          <option value="pagamento_pendente">Pagamento pendente</option>
        </select>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!profissionais && !error && (
        <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando profissionais...</div>
      )}

      {profissionais && (
        <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                  {["Nome", "Contato", "Categoria(s)", "Cidade", "Cadastro", "Pedidos aceitos", "Status", "Ciclo (Acesso)"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const status = STATUS_LABEL[p.approved ? "approved" : "pendente"];
                  return (
                    <tr
                      key={p.email}
                      onClick={() => onSelectProfessional(p.email)}
                      style={{ borderTop: "1px solid #F3F4F6", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{p.name || "(sem nome)"}</td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>
                        <div>{p.email}</div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>{p.whatsapp || "sem telefone"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>
                        {p.categories && p.categories.length ? p.categories.join(", ") : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{p.city || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#374151", whiteSpace: "nowrap" }}>{formatDate(p.created_at)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>{p.services_count}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: status.bg,
                            color: status.fg,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <CicloBadge ciclo={p.ciclo_financeiro} />
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
                      Nenhum profissional encontrado.
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
