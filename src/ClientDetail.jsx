import { useEffect, useState } from "react";
import { adminFetch } from "./api";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function formatMoney(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPO_LABEL = {
  solicitacao: { emoji: "📝", cor: "#0066FF" },
  proposta_recebida: { emoji: "💬", cor: "#F59E0B" },
  aceite_cliente: { emoji: "✅", cor: "#059669" },
  aceite_profissional: { emoji: "🤝", cor: "#059669" },
  inicio: { emoji: "🚧", cor: "#7C3AED" },
  concluido: { emoji: "🏁", cor: "#059669" },
  contestado: { emoji: "⚠️", cor: "#DC2626" },
};

export default function ClientDetail({ email, onBack, onUnauthorized }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    adminFetch("/api/admin/clientes/" + encodeURIComponent(email))
      .then(setData)
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  }, [email, onUnauthorized]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #E5E7EB",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            border: "1px solid #E5E7EB",
            background: "white",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          ← Voltar
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "#111827" }}>
          Ficha do cliente
        </h1>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>
        {error && (
          <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!data && !error && <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>}

        {data && (
          <>
            {/* Dados do cliente */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#111827" }}>
                {data.cliente.name || "(sem nome)"}
              </h2>
              <p style={{ margin: 0, color: "#6B7280", fontSize: 13 }}>{data.cliente.email}</p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14, fontSize: 13 }}>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Telefone</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{data.cliente.whatsapp || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Cidade</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{data.cliente.city || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Cadastro</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{formatDateTime(data.cliente.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                ["Solicitações", data.resumo.solicitacoes_count],
                ["Propostas recebidas", data.resumo.propostas_recebidas],
                ["Fechamentos", data.resumo.fechamentos_count],
                ["Valor movimentado", formatMoney(data.resumo.valor_movimentado)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Solicitações */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px", color: "#111827" }}>Solicitações</h3>
              {data.solicitacoes.length === 0 && (
                <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>Nenhuma solicitação ainda.</p>
              )}
              {data.solicitacoes.map((s) => (
                <div
                  key={s.id}
                  style={{
                    borderTop: "1px solid #F3F4F6",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{s.categoria || "Sem categoria"}</div>
                    <div style={{ color: "#9CA3AF", fontSize: 12 }}>{formatDateTime(s.created_at)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: "#6B7280" }}>{s.propostas.length} proposta(s)</span>
                    <span style={{ color: "#111827", fontWeight: 700 }}>{formatMoney(s.valor)}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "#F3F4F6",
                        color: "#374151",
                        textTransform: "capitalize",
                      }}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px", color: "#111827" }}>Timeline</h3>
              {data.timeline.length === 0 && (
                <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>Sem eventos registrados ainda.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.timeline.map((ev, i) => {
                  const meta = TIPO_LABEL[ev.tipo] || { emoji: "•", cor: "#6B7280" };
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          background: meta.cor + "1A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {meta.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{ev.descricao}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{formatDateTime(ev.data)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
