import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";
import { useAlerts } from "./useAlerts";

// Handoff MULTI-CRM 2026-09-02, item 5 (Inteligência MULTI) — desbloqueado
// porque dependia de Vendas/Marketing existirem (já existem). "Resumo
// diário" reaproveita os mesmos alertas do sino (useAlerts.js, mesma fonte
// que já existia desde a Fase 4) + 2 sinais de padrão novos
// (aprovação parada, pagante sem serviço). NÃO é um resumo gerado por
// IA/LLM — é agregação de dado real. "Score de churn" é heurística de
// regras, não machine learning (ver metodologia devolvida pelo backend).

function ResumoDiario({ onUnauthorized }) {
  const { carregando, tipos, contagem, total } = useAlerts(onUnauthorized);
  const [padroes, setPadroes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/alertas-padrao").then(setPadroes).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{error}</div>;
  if (carregando || !padroes) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;

  const linhas = [
    ...tipos.map(t => ({ label: t.label, count: contagem(t.id), emoji: t.emoji })),
    { label: `Aprovação parada há ${padroes.aprovacao_parada.limite_dias}+ dias`, count: padroes.aprovacao_parada.count, emoji: "⏳" },
    { label: `Pagante sem serviço há ${padroes.pagante_sem_servico.limite_dias}+ dias`, count: padroes.pagante_sem_servico.count, emoji: "💤" },
  ].filter(l => l.count > 0);

  const totalGeral = total + padroes.aprovacao_parada.count + padroes.pagante_sem_servico.count;

  if (!linhas.length) return <Card><EmptyState title="Tudo em dia 🎉" description="Nenhum sinal de atenção hoje." /></Card>;

  return (
    <Card>
      <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 12 }}>{totalGeral} coisa(s) pra olhar hoje:</div>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < linhas.length - 1 ? `1px solid ${COLORS.gray100}` : "none" }}>
          <span style={{ fontSize: 16 }}>{l.emoji}</span>
          <span style={{ flex: 1, fontSize: 13 }}>{l.label}</span>
          <Badge tone={l.count > 5 ? "red" : "amber"}>{l.count}</Badge>
        </div>
      ))}
    </Card>
  );
}

function ScoreChurn() {
  const [dados, setDados] = useState(null);
  const [error, setError] = useState("");
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    adminFetch("/api/admin/score-churn").then(setDados).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{error}</div>;
  if (!dados) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;

  const alto = dados.profissionais.filter(p => p.nivel === "alto");
  const medio = dados.profissionais.filter(p => p.nivel === "medio");

  if (!dados.profissionais.length) return <Card><EmptyState title="Sem dado ainda" description="Nenhum profissional pagante (ou vencido) pra calcular risco." /></Card>;

  return (
    <>
      <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 10 }}>{dados.metodologia}</div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {[...alto, ...medio].length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: COLORS.gray500, fontSize: 13 }}>Ninguém em risco médio/alto agora 🎉</div>
        ) : (
          [...alto, ...medio].map((p, i, arr) => (
            <div key={p.email}>
              <div
                onClick={() => setExpandido(expandido === p.email ? null : p.email)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < arr.length - 1 || expandido === p.email ? `1px solid ${COLORS.gray100}` : "none", cursor: "pointer" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nome || "Sem nome"}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray400 }}>{p.email}</div>
                </div>
                <Badge tone={p.nivel === "alto" ? "red" : "amber"}>{p.nivel === "alto" ? "Alto" : "Médio"} · {p.score}</Badge>
              </div>
              {expandido === p.email && (
                <div style={{ padding: "0 16px 12px", fontSize: 12, color: COLORS.gray700 }}>
                  {p.fatores.map((f, j) => <div key={j}>• {f}</div>)}
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </>
  );
}

export default function Inteligencia({ onUnauthorized }) {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Inteligência MULTI" subtitle="Resumo do dia e risco de cancelamento" />

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Resumo diário</div>
      <div style={{ marginBottom: 24 }}><ResumoDiario onUnauthorized={onUnauthorized} /></div>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Score de risco de cancelamento</div>
      <ScoreChurn />
    </div>
  );
}
