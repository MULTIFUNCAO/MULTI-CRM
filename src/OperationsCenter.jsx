import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "./api";

function formatMoney(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatHoras(h) {
  if (h == null) return "";
  if (h < 24) return `${h}h parado`;
  return `${Math.round(h / 24)}d parado`;
}

// 7 tipos de alerta — os 5 primeiros já vêm prontos de /api/admin/oportunidades
// (rota que já existia desde a Fase 1 do CRM antigo, dado 100% real), o 6º é
// o achado da Fase 3 (/api/admin/professionals?status=role_divergente), o 7º
// é da correção do modelo financeiro (ciclo_financeiro.status ===
// 'promocao_terminando' — últimos 7 dias antes do fim da promoção, calculado
// no backend, não aqui). Nenhum número é calculado no frontend.
const TIPOS = [
  { id: "sem_proposta", label: "Sem proposta", emoji: "🔴", cor: "#DC2626" },
  { id: "proposta_sem_resposta", label: "Proposta sem resposta", emoji: "🟠", cor: "#F59E0B" },
  { id: "parado_pos_aceite", label: "Parado pós-aceite", emoji: "🟣", cor: "#7C3AED" },
  { id: "clientes_reativaveis", label: "Clientes reativáveis", emoji: "🔄", cor: "#0EA5E9" },
  { id: "role_divergente", label: "Profissional preso (role)", emoji: "⚠️", cor: "#B45309" },
  { id: "entrando_mensalidade", label: "Entrando na mensalidade", emoji: "🔔", cor: "#7C3AED" },
];

// Central de Operações + Alertas — Fase 4. "O que entrou, o que está
// atrasado, o que precisa ser feito, onde está o dinheiro" — sem gráfico
// decorativo, só o que precisa de ação (pedido explícito do prompt
// original, seção 26).
export default function OperationsCenter({ onSelectClient, onSelectProfessional, onUnauthorized }) {
  const [oportunidades, setOportunidades] = useState(null);
  const [divergentes, setDivergentes] = useState(null);
  const [profissionais, setProfissionais] = useState(null);
  const [error, setError] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState(null);

  useEffect(() => {
    const handleErr = (err) => {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    };
    adminFetch("/api/admin/oportunidades").then(setOportunidades).catch(handleErr);
    adminFetch("/api/admin/professionals?status=role_divergente")
      .then((d) => setDivergentes(d.professionals || []))
      .catch(handleErr);
    // Lista completa só pra achar quem tá terminando a promoção (ciclo
    // financeiro vem embutido em cada profissional, calculado no backend).
    adminFetch("/api/admin/professionals")
      .then((d) => setProfissionais(d.professionals || []))
      .catch(handleErr);
  }, [onUnauthorized]);

  const carregando = !oportunidades || !divergentes || !profissionais;

  const dinheiroNaMesa = oportunidades?.resumo?.dinheiro_na_mesa;

  const entrandoNaMensalidade = useMemo(
    () => (profissionais || []).filter((p) => p.ciclo_financeiro?.status === "promocao_terminando"),
    [profissionais]
  );

  const itensDoTipo = useMemo(() => {
    if (!tipoSelecionado || !oportunidades) return [];
    if (tipoSelecionado === "clientes_reativaveis") return oportunidades.reativaveis || [];
    if (tipoSelecionado === "role_divergente") return divergentes || [];
    if (tipoSelecionado === "entrando_mensalidade") return entrandoNaMensalidade;
    return (oportunidades.itens || []).filter((i) => i.tipo === tipoSelecionado);
  }, [tipoSelecionado, oportunidades, divergentes, entrandoNaMensalidade]);

  const contagem = (tipoId) => {
    if (!oportunidades || !divergentes || !profissionais) return null;
    if (tipoId === "clientes_reativaveis") return oportunidades.resumo.clientes_reativaveis.count;
    if (tipoId === "role_divergente") return divergentes.length;
    if (tipoId === "entrando_mensalidade") return entrandoNaMensalidade.length;
    return oportunidades.resumo[tipoId]?.count ?? 0;
  };

  const valorDoTipo = (tipoId) => oportunidades?.resumo?.[tipoId]?.valor;

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Central de Operações</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>O que precisa de atenção agora, com dado real</p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>{error}</div>
      )}

      {carregando && !error && <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>}

      {!carregando && (
        <>
          {/* Dinheiro na mesa — o número mais importante, em destaque */}
          <div
            style={{
              background: "linear-gradient(135deg,#059669,#047857)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              color: "white",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>💰 Dinheiro na mesa</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>{formatMoney(dinheiroNaMesa)}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Soma de pedidos sem proposta + proposta sem resposta + parado pós-aceite</div>
          </div>

          {/* Cards de alerta, clicáveis */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
            {TIPOS.map((t) => {
              const count = contagem(t.id);
              const valor = valorDoTipo(t.id);
              const ativo = tipoSelecionado === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTipoSelecionado(ativo ? null : t.id)}
                  style={{
                    textAlign: "left",
                    background: "white",
                    border: ativo ? `2px solid ${t.cor}` : "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: 16,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{t.emoji}</span> {t.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", marginTop: 6 }}>{count}</div>
                  {valor != null && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{formatMoney(valor)}</div>}
                </button>
              );
            })}
          </div>

          {/* Lista do tipo selecionado */}
          {tipoSelecionado && (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 12px", color: "#111827" }}>
                {TIPOS.find((t) => t.id === tipoSelecionado)?.label}
              </h3>
              {itensDoTipo.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>Nada aqui agora.</p>}
              {itensDoTipo.map((item, i) => (
                <div
                  key={item.pedido_id || item.email || i}
                  onClick={() => {
                    if (tipoSelecionado === "role_divergente" || tipoSelecionado === "entrando_mensalidade") onSelectProfessional(item.email);
                    else if (item.cliente_email) onSelectClient(item.cliente_email);
                  }}
                  style={{
                    borderTop: "1px solid #F3F4F6",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    cursor: "pointer",
                  }}
                >
                  {tipoSelecionado === "entrando_mensalidade" ? (
                    <>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{item.name || "(sem nome)"}</div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>{item.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12 }}>
                        <span style={{ color: "#6B7280" }}>vira R$ {item.ciclo_financeiro.valor_proxima_cobranca} em {new Date(item.ciclo_financeiro.fim_promocao).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </>
                  ) : tipoSelecionado === "role_divergente" ? (
                    <>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{item.name || "(sem nome)"}</div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>{item.email}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "#B45309", fontWeight: 700 }}>role: {item.role}</span>
                    </>
                  ) : tipoSelecionado === "clientes_reativaveis" ? (
                    <>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{item.cliente_nome}</div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>{item.cliente_email}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{item.dias_parado}d sem novo pedido</span>
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{item.cliente_nome} — {item.categoria}</div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>{item.cliente_email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12 }}>
                        <span style={{ color: "#111827", fontWeight: 700 }}>{formatMoney(item.valor)}</span>
                        <span style={{ color: "#9CA3AF" }}>{formatHoras(item.horas_parado)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
