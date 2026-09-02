import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { adminFetch } from "./api";
import { useAlerts } from "./useAlerts";
import { COLORS, PageHeader, Card, StatTile, EmptyState } from "./ui";

const STATUS_COLORS = {
  aberto: "#F59E0B", confirmado: "#0EA5E9", em_andamento: "#7C3AED",
  executando: "#7C3AED", concluido: "#059669", cancelado: "#9CA3AF", em_disputa: "#DC2626",
};

function formatMoney(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDiaCurto(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
function formatHoras(h) {
  if (h == null) return "";
  return h < 24 ? `${h}h parado` : `${Math.round(h / 24)}d parado`;
}

// Visão Geral — o Command Center (Etapa 4 do plano aprovado). Funde o que
// antes eram duas telas separadas (Dashboard + Central de Operações, Fases
// 2 e 4) numa só, como a estrutura obrigatória pede — nada duplicado, só
// reorganizado. Nenhuma métrica nova inventada; "Meta" fica com estado
// vazio honesto porque não existe config de meta ainda (regra 35 do
// documento: zero dado fictício).
export default function Overview({ onSelectClient, onSelectProfessional, onUnauthorized }) {
  const [stats, setStats] = useState(null);
  const [funil, setFunil] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [error, setError] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const alertas = useAlerts(onUnauthorized);

  useEffect(() => {
    const handleErr = (err) => {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    };
    adminFetch("/api/admin/stats").then(setStats).catch(handleErr);
    adminFetch("/api/admin/funil").then((d) => setFunil(d.funil || [])).catch(handleErr);
    adminFetch("/api/admin/categorias").then((d) => setCategorias(d.categorias || [])).catch(handleErr);
  }, [onUnauthorized]);

  const carregando = !stats || !funil || !categorias || alertas.carregando;
  const topCategorias = (categorias || []).slice(0, 8);
  const funilComDados = (funil || []).filter((f) => f.count > 0);
  const itensDoTipo = useMemo(
    () => (tipoSelecionado ? alertas.itensDoTipo(tipoSelecionado) : []),
    [tipoSelecionado, alertas]
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Visão Geral" subtitle="Como a MULTI está agora — dado real, sem enfeite" />

      {(error || alertas.error) && (
        <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 14, borderRadius: 12, marginBottom: 16 }}>{error || alertas.error}</div>
      )}

      {carregando && !error && <div style={{ color: COLORS.gray500, padding: 24, textAlign: "center" }}>Carregando...</div>}

      {!carregando && (
        <>
          {/* Bloco 1 — Resumo */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            <StatTile label="Clientes" value={stats.totalClients} icon="👥" />
            <StatTile label="Profissionais" value={stats.totalPros} icon="🛠️" />
            <StatTile label="Receita recorrente" value={formatMoney(stats.mrr)} icon="🔁" sub={`${stats.proAtivos} assinantes ativos`} />
            <StatTile label="Pedidos" value={stats.totalPedidos} icon="📋" />
            <StatTile label="Fechados" value={stats.pedidosFechados} icon="🤝" />
          </div>

          {/* Bloco 2 — Dinheiro na Mesa. Texto/valor trocam sozinhos conforme
              o modelo de cobrança ativo (comissao_ativa em config_monetizacao)
              — ver useAlerts.js e /api/admin/oportunidades. Correção do
              modelo financeiro, MULTI-CRM, 2026-09-01: enquanto comissão
              estiver desligada (hoje), isso é mensalidade de profissional
              pendente, não valor de serviço. */}
          <Card style={{ background: `linear-gradient(135deg,${COLORS.green},#047857)`, color: "white", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>💰 Dinheiro na mesa</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>{formatMoney(alertas.dinheiroNaMesa)}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {alertas.dinheiroNaMesaModo === "servico"
                ? "Soma de pedidos sem proposta + proposta sem resposta + parado pós-aceite"
                : `Mensalidade pendente de ${alertas.dinheiroNaMesaQtd ?? 0} profissional(is) sem pagamento confirmado`}
            </div>
          </Card>

          {/* Bloco 3 — Precisa de Atenção */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px", color: COLORS.gray900 }}>⚡ Precisa de atenção</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {alertas.tipos.map((t) => {
                const count = alertas.contagem(t.id);
                const ativo = tipoSelecionado === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTipoSelecionado(ativo ? null : t.id)}
                    style={{ textAlign: "left", background: "white", border: ativo ? `2px solid ${t.cor}` : `1px solid ${COLORS.gray200}`, borderRadius: 14, padding: 16, cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 12, color: COLORS.gray500, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{t.emoji}</span> {t.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.gray900, marginTop: 6 }}>{count}</div>
                  </button>
                );
              })}
            </div>

            {tipoSelecionado && (
              <Card style={{ marginTop: 12 }}>
                {itensDoTipo.length === 0 && <p style={{ color: COLORS.gray400, fontSize: 13, margin: 0 }}>Nada aqui agora.</p>}
                {itensDoTipo.map((item, i) => (
                  <div
                    key={item.pedido_id || item.email || i}
                    onClick={() => {
                      if (tipoSelecionado === "role_divergente" || tipoSelecionado === "entrando_mensalidade") onSelectProfessional(item.email);
                      else if (item.cliente_email) onSelectClient(item.cliente_email);
                    }}
                    style={{ borderTop: i ? `1px solid ${COLORS.gray100}` : "none", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", cursor: "pointer", fontSize: 13 }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: COLORS.gray900 }}>{item.name || item.cliente_nome || `${item.cliente_nome || ""} ${item.categoria || ""}`}</div>
                      <div style={{ color: COLORS.gray400, fontSize: 12 }}>{item.email || item.cliente_email}</div>
                    </div>
                    {item.valor != null && (
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <span style={{ fontWeight: 700 }}>{formatMoney(item.valor)}</span>
                        <span style={{ color: COLORS.gray400 }}>{formatHoras(item.horas_parado)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Bloco 4 — Comercial + Operação (o "Cadastros por dia" já existia
              no Dashboard da Fase 2 — mantido aqui, não descartado, só
              reorganizado junto do resto) */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <Card style={{ flex: "1 1 420px", minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>Cadastros de clientes por dia (últimos 30 dias)</h3>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={stats.cadastrosPorDia} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100} />
                    <XAxis dataKey="data" tickFormatter={formatDiaCurto} tick={{ fontSize: 11, fill: COLORS.gray400 }} interval={4} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.gray400 }} />
                    <Tooltip labelFormatter={formatDiaCurto} formatter={(v) => [v, "cadastros"]} />
                    <Line type="monotone" dataKey="count" stroke={COLORS.blue} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card style={{ flex: "1 1 420px", minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>📊 Comercial — pedidos por categoria</h3>
              <div style={{ width: "100%", height: 260 }}>
                {topCategorias.length === 0 ? (
                  <EmptyState title="Sem dados no período" />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={topCategorias} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.gray400 }} />
                      <YAxis dataKey="categoria" type="category" width={110} tick={{ fontSize: 11, fill: COLORS.gray700 }} />
                      <Tooltip formatter={(v) => [v, "solicitações"]} />
                      <Bar dataKey="solicitacoes" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card style={{ flex: "1 1 420px", minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>🔧 Operação — pedidos por status</h3>
              <div style={{ width: "100%", height: 260 }}>
                {funilComDados.length === 0 ? (
                  <EmptyState title="Sem dados no período" />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={funilComDados} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {funilComDados.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#9CA3AF"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Bloco 5 — Meta (sem config ainda, estado vazio honesto) */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>🎯 Meta</h3>
            <EmptyState title="Meta ainda não configurada" description="Vai poder ser definida em Administrativo → Metas quando esse módulo existir. Nenhum número aqui até lá." />
          </Card>
        </>
      )}
    </div>
  );
}
