import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 5 (Metas e Desempenho). 3 seções, todas
// com dado real (sem meta histórica por mês ainda — config singleton
// editável, "realizado" sempre calculado contra o mês corrente na hora da
// consulta).

function BarraMeta({ label, meta, realizado }) {
  const pct = meta > 0 ? Math.min(100, Math.round((realizado / meta) * 100)) : null;
  return (
    <Card style={{ flex: "1 1 220px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray500, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
        {realizado} <span style={{ fontSize: 14, color: COLORS.gray400, fontWeight: 700 }}>/ {meta || "sem meta"}</span>
      </div>
      {meta > 0 && (
        <div style={{ background: COLORS.gray100, borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{ background: pct >= 100 ? COLORS.green : COLORS.blue, height: "100%", width: `${pct}%`, borderRadius: 6 }} />
        </div>
      )}
    </Card>
  );
}

function MetasDoMes() {
  const [dados, setDados] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ profissionaisAprovados: 0, mensalidadesPagas: 0, clientesAtivos: 0 });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = () => {
    adminFetch("/api/admin/metas")
      .then(d => {
        setDados(d);
        setForm({
          profissionaisAprovados: d.meta.profissionais_aprovados,
          mensalidadesPagas: d.meta.mensalidades_pagas,
          clientesAtivos: d.meta.clientes_ativos,
        });
      })
      .catch(e => setErro(e.message));
  };

  useEffect(carregar, []);

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      await adminFetch("/api/admin/metas", { method: "PATCH", body: JSON.stringify(form) });
      setEditando(false);
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (erro) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{erro}</div>;
  if (!dados) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;

  if (editando) {
    const campo = (label, key) => (
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>{label}</label>
        <input type="number" min="0" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: 140, padding: 8, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13 }} />
      </div>
    );
    return (
      <Card>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Editar metas do mês</div>
        {campo("Profissionais aprovados", "profissionaisAprovados")}
        {campo("Mensalidades pagas", "mensalidadesPagas")}
        {campo("Clientes ativos", "clientesAtivos")}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={salvar} disabled={salvando} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button onClick={() => setEditando(false)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <BarraMeta label="Profissionais aprovados" meta={dados.meta.profissionais_aprovados} realizado={dados.realizado.profissionais_aprovados} />
        <BarraMeta label="Mensalidades pagas" meta={dados.meta.mensalidades_pagas} realizado={dados.realizado.mensalidades_pagas} />
        <BarraMeta label="Clientes ativos" meta={dados.meta.clientes_ativos} realizado={dados.realizado.clientes_ativos} />
      </div>
      <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 10 }}>{dados.limitacao}</div>
      <button onClick={() => setEditando(true)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        Editar metas
      </button>
    </>
  );
}

function DesempenhoEquipe() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/desempenho-equipe").then(setDados).catch(e => setErro(e.message));
  }, []);

  if (erro) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{erro}</div>;
  if (!dados) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;
  if (!dados.desempenho.length) return <Card><EmptyState title="Sem dado ainda" description="Ninguém da equipe tem lead atribuído no funil de Vendas ainda." /></Card>;

  return (
    <>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {dados.desempenho.map((d, i) => (
          <div key={d.responsavel_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: i < dados.desempenho.length - 1 ? `1px solid ${COLORS.gray100}` : "none" }}>
            <div style={{ fontWeight: 800, fontSize: 14, flex: 1 }}>{d.responsavel_nome || "Sem nome"}</div>
            <div style={{ fontSize: 12, color: COLORS.gray500 }}>{d.total_no_funil} no funil</div>
            <Badge tone="green">{d.fechados} fechado(s)</Badge>
            <div style={{ fontSize: 12, color: COLORS.gray500, minWidth: 130, textAlign: "right" }}>
              {d.tempo_medio_fechamento_dias != null ? `${d.tempo_medio_fechamento_dias}d médio` : "sem dado de tempo"}
            </div>
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 8 }}>{dados.limitacao}</div>
    </>
  );
}

function RankingCategorias() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/ranking-categorias").then(setDados).catch(e => setErro(e.message));
  }, []);

  if (erro) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{erro}</div>;
  if (!dados) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;
  if (!dados.ranking.length) return <Card><EmptyState title="Sem dado ainda" description="Nenhum profissional com categoria cadastrada." /></Card>;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {dados.ranking.map((r, i) => (
        <div key={r.categoria} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", borderBottom: i < dados.ranking.length - 1 ? `1px solid ${COLORS.gray100}` : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.gray400, width: 24 }}>{i + 1}º</div>
          <div style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{r.categoria}</div>
          <div style={{ fontSize: 12, color: COLORS.gray500 }}>{r.pagando}/{r.cadastrados} pagando</div>
          <Badge tone={r.taxa_conversao_pct >= 30 ? "green" : r.taxa_conversao_pct >= 10 ? "amber" : "gray"}>{r.taxa_conversao_pct}%</Badge>
        </div>
      ))}
    </Card>
  );
}

export default function Metas() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Metas e Desempenho" subtitle="Meta do mês, desempenho da equipe e conversão por categoria" />

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Metas do mês</div>
      <div style={{ marginBottom: 24 }}><MetasDoMes /></div>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Desempenho por pessoa da equipe</div>
      <div style={{ marginBottom: 24 }}><DesempenhoEquipe /></div>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Ranking de categorias que mais convertem</div>
      <RankingCategorias />
    </div>
  );
}
