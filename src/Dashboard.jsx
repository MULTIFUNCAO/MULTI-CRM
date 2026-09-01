import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { adminFetch } from "./api";

const BLUE = "#0066FF";
const STATUS_COLORS = {
  aberto: "#F59E0B",
  confirmado: "#0EA5E9",
  em_andamento: "#7C3AED",
  executando: "#7C3AED",
  concluido: "#059669",
  cancelado: "#9CA3AF",
  em_disputa: "#DC2626",
};

function formatMoney(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDiaCurto(iso) {
  // "2026-08-15" -> "15/08"
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function Card({ label, value, icon }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 18, flex: "1 1 180px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#111827" }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children, height = 280 }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 20, flex: "1 1 420px", minWidth: 0 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px", color: "#111827" }}>{title}</h3>
      <div style={{ width: "100%", height }}>{children}</div>
    </div>
  );
}

// Dashboard — Fase 2. Todos os números vêm de rotas já existentes no
// MULTI-BACKEND (/api/admin/stats, /api/admin/categorias, /api/admin/funil),
// nenhuma métrica simulada — sem tracking de visitas/cliques, não dá pra
// mostrar isso ainda (ver auditoria da Fase 1).
export default function Dashboard({ onUnauthorized }) {
  const [stats, setStats] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [funil, setFunil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleErr = (err) => {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    };
    adminFetch("/api/admin/stats").then(setStats).catch(handleErr);
    adminFetch("/api/admin/categorias").then((d) => setCategorias(d.categorias || [])).catch(handleErr);
    adminFetch("/api/admin/funil").then((d) => setFunil(d.funil || [])).catch(handleErr);
  }, [onUnauthorized]);

  const carregando = !stats || !categorias || !funil;
  const topCategorias = (categorias || []).slice(0, 8);
  const funilComDados = (funil || []).filter((f) => f.count > 0);

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>Visão geral com dado real da plataforma</p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {carregando && !error && (
        <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>
      )}

      {stats && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
          <Card label="Clientes" value={stats.totalClients} icon="👥" />
          <Card label="Profissionais" value={stats.totalPros} icon="🛠️" />
          <Card label="Pedidos" value={stats.totalPedidos} icon="📋" />
          <Card label="Fechados" value={stats.pedidosFechados} icon="🤝" />
          <Card label="Valor movimentado" value={formatMoney(stats.valorMovimentado)} icon="💰" />
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {stats && (
          <ChartCard title="Cadastros de clientes por dia (últimos 30 dias)">
            <ResponsiveContainer>
              <LineChart data={stats.cadastrosPorDia} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="data" tickFormatter={formatDiaCurto} tick={{ fontSize: 11, fill: "#9CA3AF" }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <Tooltip labelFormatter={formatDiaCurto} formatter={(v) => [v, "cadastros"]} />
                <Line type="monotone" dataKey="count" stroke={BLUE} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {categorias && (
          <ChartCard title="Pedidos por categoria">
            {topCategorias.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer>
                <BarChart data={topCategorias} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis dataKey="categoria" type="category" width={110} tick={{ fontSize: 11, fill: "#374151" }} />
                  <Tooltip formatter={(v) => [v, "solicitações"]} />
                  <Bar dataKey="solicitacoes" fill={BLUE} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )}

        {funil && (
          <ChartCard title="Status dos pedidos">
            {funilComDados.length === 0 ? (
              <EmptyState />
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
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
      Sem dados suficientes ainda.
    </div>
  );
}
