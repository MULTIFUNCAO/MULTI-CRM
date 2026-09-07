import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { CICLO_LABEL, OnboardingBadge } from "./ProfessionalList";

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

function formatarTelefoneCliente(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return d;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

const STATUS_LABEL_DEMANDA = { aberta: "Aberta", em_andamento: "Em andamento", aguardando_resposta: "Aguardando resposta" };

// View reversa (Profissional → Demandas), 2026-09-07 — espelho do match
// direto que já existe em Atendimentos.jsx (ProfissionaisSugeridos), só
// que a partir da ficha do profissional. Reaproveita o mesmo POST /api/
// admin/demandas/:id/repasses (não duplica lógica de repasse) — aqui o
// profissional já é fixo (a pessoa cuja ficha está aberta), só a demanda
// muda por linha. Estilo inline igual ao resto deste arquivo, de
// propósito (ver nota em ui.jsx — Profissionais não foi migrado pro
// design system novo ainda).
function DemandasCompativeis({ email, nome, whatsapp, onUnauthorized }) {
  const [demandas, setDemandas] = useState(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  const carregar = () => {
    adminFetch(`/api/admin/professionals/${encodeURIComponent(email)}/demandas-compativeis`)
      .then((d) => { setDemandas(d.demandas || []); setAviso(d.aviso || ""); })
      .catch((e) => { if (e.unauthorized) return onUnauthorized?.(); setErro(e.message); });
  };

  useEffect(carregar, [email]);

  const repassar = async (demandaId) => {
    try {
      await adminFetch(`/api/admin/demandas/${demandaId}/repasses`, {
        method: "POST",
        body: JSON.stringify({ fonte: "usuarios", id: email, nome, whatsapp }),
      });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setErro(e.message);
    }
  };

  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px", color: "#111827" }}>Demandas compatíveis</h3>
      {erro && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 8 }}>{erro}</div>}
      {demandas === null && !erro && <div style={{ color: "#9CA3AF", fontSize: 13 }}>Buscando demandas...</div>}
      {aviso && <div style={{ color: "#9CA3AF", fontSize: 13, fontStyle: "italic" }}>{aviso}</div>}
      {demandas && demandas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {demandas.map((d) => (
            <div
              key={d.id}
              style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
                  {d.nome_cliente || formatarTelefoneCliente(d.telefone_cliente) || "Sem nome"}
                  {d.mesma_regiao && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>mesma região</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  {d.regiao || "região não informada"} · {d.categoria_servico || "categoria não informada"} · {STATUS_LABEL_DEMANDA[d.status] || d.status}
                </div>
                {d.descricao && <div style={{ fontSize: 12, color: "#374151", marginTop: 6, maxWidth: 480 }}>{d.descricao}</div>}
              </div>
              {d.repasse ? (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: "#ECFDF5", color: "#059669", whiteSpace: "nowrap" }}>
                  Repassado
                </span>
              ) : (
                <button
                  onClick={() => repassar(d.id)}
                  style={{ background: "#0066FF", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Repassar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ficha do profissional — Fase 3, mesmo espírito da Ficha do Cliente (Fase
// 1): só dado real. Sem timeline/score aqui de propósito (não foi pedido
// pra profissional nessa fase, evita inventar o que não existe).
export default function ProfessionalDetail({ email, onBack, onUnauthorized }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    adminFetch("/api/admin/professionals/" + encodeURIComponent(email))
      .then(setData)
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  }, [email, onUnauthorized]);

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
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
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Ficha do profissional</h1>
      </div>

      <div style={{ maxWidth: 900 }}>
        {error && (
          <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!data && !error && <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>}

        {data && (
          <>
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#111827" }}>
                {data.profissional.name || "(sem nome)"}
              </h2>
              <p style={{ margin: 0, color: "#6B7280", fontSize: 13 }}>{data.profissional.email}</p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14, fontSize: 13 }}>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Telefone</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{data.profissional.whatsapp || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Cidade</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{data.profissional.city || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Categoria(s)</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>
                    {data.profissional.categories?.length ? data.profissional.categories.join(", ") : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Status</div>
                  <div style={{ color: data.profissional.approved ? "#059669" : "#B45309", fontWeight: 700 }}>
                    {data.profissional.approved ? "Aprovado" : "Pendente"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Cadastro</div>
                  <div style={{ color: "#111827", fontWeight: 600 }}>{formatDateTime(data.profissional.created_at)}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Onboarding</div>
                  <OnboardingBadge step={data.profissional.onboardingStep} />
                </div>
              </div>
            </div>

            <DemandasCompativeis
              email={data.profissional.email}
              nome={data.profissional.name}
              whatsapp={data.profissional.whatsapp}
              onUnauthorized={onUnauthorized}
            />

            {/* Ciclo financeiro — correção do modelo financeiro, só existe pra
                quem tem plano "acesso" de verdade */}
            {data.ciclo_financeiro && (() => {
              const info = CICLO_LABEL[data.ciclo_financeiro.status] || { emoji: "⚪", label: data.ciclo_financeiro.status };
              return (
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#111827" }}>Ciclo financeiro — Taxa de Acesso</h3>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{info.emoji} {info.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
                    <div>
                      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Plano atual</div>
                      <div style={{ color: "#111827", fontWeight: 600, textTransform: "capitalize" }}>{data.ciclo_financeiro.plano_atual}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Data de entrada</div>
                      <div style={{ color: "#111827", fontWeight: 600 }}>{formatDateTime(data.ciclo_financeiro.data_entrada)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Fim da promoção</div>
                      <div style={{ color: "#111827", fontWeight: 600 }}>{formatDateTime(data.ciclo_financeiro.fim_promocao)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Próxima cobrança</div>
                      <div style={{ color: "#111827", fontWeight: 600 }}>
                        {formatDateTime(data.ciclo_financeiro.proxima_cobranca)} — {formatMoney(data.ciclo_financeiro.valor_proxima_cobranca)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                ["Pedidos aceitos", data.resumo.pedidos_aceitos],
                ["Concluídos", data.resumo.concluidos],
                ["Faturamento", formatMoney(data.resumo.faturamento)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px", color: "#111827" }}>Pedidos aceitos</h3>
              {data.pedidos.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>Nenhum pedido aceito ainda.</p>}
              {data.pedidos.map((p) => (
                <div
                  key={p.id}
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
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{p.categoria || "Sem categoria"}</div>
                    <div style={{ color: "#9CA3AF", fontSize: 12 }}>
                      {p.cliente_nome || "Cliente"} · {formatDateTime(p.created_at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: "#111827", fontWeight: 700 }}>{formatMoney(p.valor)}</span>
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
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
