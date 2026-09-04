import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Especificação "Fila de Demandas de Clientes + Triagem do WhatsApp"
// (2026-09-03), Fase 3. Lista demandas_clientes com fila='demanda' — pedidos
// de serviço triados manualmente a partir de uma conversa do WhatsApp (ver
// Inbox.jsx "Mover para fila"). Vendas e Suporte reaproveitam a mesma
// conversa filtrada por fila em vez de uma tela dedicada (ver Inbox.jsx).
// Nada a ver com "Demandas" no menu (Demandas.jsx) — aquela é lista pessoal
// de tarefas da equipe, sem relação com clientes.

const STATUS_TONE = { aberta: "red", em_andamento: "amber", resolvida: "green", cancelada: "gray" };
const STATUS_LABEL = { aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida", cancelada: "Cancelada" };

function tempoEmAberto(criadoEm) {
  const ms = Date.now() - new Date(criadoEm).getTime();
  const horas = Math.floor(ms / 36e5);
  if (horas < 1) return "menos de 1h";
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

function formatarTelefone(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return d;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

function ProfissionaisSugeridos({ demandaId }) {
  const [profissionais, setProfissionais] = useState(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminFetch(`/api/admin/demandas/${demandaId}/profissionais-sugeridos`)
      .then(d => { setProfissionais(d.profissionais || []); setAviso(d.aviso || ""); })
      .catch(e => setErro(e.message));
  }, [demandaId]);

  if (erro) return <div style={{ color: COLORS.red, fontSize: 12 }}>{erro}</div>;
  if (profissionais === null) return <div style={{ fontSize: 12, color: COLORS.gray500 }}>Buscando profissionais...</div>;
  if (aviso) return <div style={{ fontSize: 12, color: COLORS.gray500, fontStyle: "italic" }}>{aviso}</div>;
  if (!profissionais.length) return <div style={{ fontSize: 12, color: COLORS.gray500 }}>Nenhum profissional aprovado compatível com essa região/categoria ainda.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {profissionais.map(p => (
        <div key={p.email} style={{ background: COLORS.gray50, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{p.nome || p.email}</div>
            <div style={{ fontSize: 11, color: COLORS.gray500 }}>{p.cidade || "cidade não informada"} · {(p.categorias || []).join(", ")}</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray700, fontWeight: 700 }}>{p.whatsapp || p.email}</div>
        </div>
      ))}
    </div>
  );
}

function DemandaCard({ demanda, onUnauthorized, onMudou }) {
  const [expandido, setExpandido] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const mudarStatus = async (status) => {
    setAtualizando(true);
    try {
      await adminFetch(`/api/admin/demandas/${demanda.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      onMudou();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, cursor: "pointer" }} onClick={() => setExpandido(v => !v)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{demanda.nome_cliente || formatarTelefone(demanda.telefone_cliente) || "Sem nome"}</span>
            <Badge tone={STATUS_TONE[demanda.status]}>{STATUS_LABEL[demanda.status]}</Badge>
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray500 }}>
            {demanda.regiao || "região não informada"} · {demanda.categoria_servico || "categoria não informada"} · em aberto há {tempoEmAberto(demanda.criado_em)}
          </div>
          {demanda.descricao && <div style={{ fontSize: 13, color: COLORS.gray700, marginTop: 8 }}>{demanda.descricao}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {demanda.status === "aberta" && (
            <button onClick={() => mudarStatus("em_andamento")} disabled={atualizando} style={{ background: COLORS.amberBg, color: COLORS.amber, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Assumir
            </button>
          )}
          {demanda.status === "em_andamento" && (
            <button onClick={() => mudarStatus("resolvida")} disabled={atualizando} style={{ background: COLORS.greenBg, color: COLORS.green, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Marcar resolvida
            </button>
          )}
        </div>
      </div>
      {expandido && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.gray200}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray700, marginBottom: 8 }}>Profissionais sugeridos</div>
          <ProfissionaisSugeridos demandaId={demanda.id} />
        </div>
      )}
    </Card>
  );
}

export default function Atendimentos({ onUnauthorized }) {
  const [demandas, setDemandas] = useState(null);
  const [filtro, setFiltro] = useState("aberta");
  const [erro, setErro] = useState("");

  const carregar = () => {
    const qs = filtro === "todos" ? "" : `&status=${filtro}`;
    adminFetch(`/api/admin/demandas?fila=demanda${qs}`)
      .then(d => { setDemandas(d.demandas || []); setErro(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErro(e.message); });
  };

  useEffect(carregar, [filtro]);

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Atendimentos" subtitle="Pedidos de serviço triados a partir do WhatsApp (Caixa de Entrada → Mover para fila)" />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["aberta", "em_andamento", "resolvida", "cancelada", "todos"].map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            style={{
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${filtro === s ? COLORS.blue : COLORS.gray200}`,
              background: filtro === s ? COLORS.blue : "white",
              color: filtro === s ? "white" : COLORS.gray700,
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            {s === "todos" ? "Todos" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {erro && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{erro}</div>}

      {demandas === null ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
      ) : demandas.length === 0 ? (
        <Card><EmptyState title="Nenhum atendimento" description="Nenhuma demanda de cliente nessa situação. Mova uma conversa do WhatsApp pra fila 'Demanda' na Caixa de Entrada pra começar." /></Card>
      ) : (
        demandas.map(d => <DemandaCard key={d.id} demanda={d} onUnauthorized={onUnauthorized} onMudou={carregar} />)
      )}
    </div>
  );
}
