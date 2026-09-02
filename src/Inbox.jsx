import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 2 (Caixa de Entrada). Duas abas: Suporte
// (real, dado real) e WhatsApp (ainda travado — ver motivo abaixo, mesmo
// texto que já existia em App.jsx/EM_CONSTRUCAO.inbox antes desta tela
// existir). Regra 35 do documento "COMANDO MASTER": nunca fingir que o
// WhatsApp já funciona só porque o resto da Caixa de Entrada agora é real.
const MOTIVO_WHATSAPP = "Não existe integração de mensageria hoje (WhatsApp Business API/provedor) — só links wa.me no app do cliente, sem histórico nem envio pelo CRM. Precisa de um provedor contratado e decisão sua antes de existir de verdade.";

const PRIORIDADE_TONE = { baixa: "gray", normal: "blue", alta: "red" };
const STATUS_TONE = { aberto: "red", em_andamento: "amber", resolvido: "green" };
const STATUS_LABEL = { aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido" };

function Tabs({ active, onChange }) {
  const tabs = [
    { id: "suporte", label: "Suporte" },
    { id: "whatsapp", label: "WhatsApp" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${COLORS.gray200}` }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: active === t.id ? `2px solid ${COLORS.blue}` : "2px solid transparent",
            color: active === t.id ? COLORS.blue : COLORS.gray500,
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function NovoTicketForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ profissionalEmail: "", profissionalNome: "", assunto: "", descricao: "", prioridade: "normal" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    try {
      await adminFetch("/api/admin/suporte-tickets", { method: "POST", body: JSON.stringify(form) });
      onCreated();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const campo = (label, key, placeholder, multiline = false) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>{label}</label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
        />
      ) : (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box" }}
        />
      )}
    </div>
  );

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Novo ticket</div>
      {campo("E-mail do profissional", "profissionalEmail", "profissional@email.com")}
      {campo("Nome do profissional", "profissionalNome", "Nome completo")}
      {campo("Assunto", "assunto", "Resumo do problema")}
      {campo("Descrição", "descricao", "Detalhe o problema...", true)}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Prioridade</label>
        <select
          value={form.prioridade}
          onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
          style={{ padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13 }}
        >
          <option value="baixa">Baixa</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      {erro && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 10 }}>{erro}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={salvando} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
          {salvando ? "Salvando..." : "Criar ticket"}
        </button>
        <button onClick={onCancel} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </Card>
  );
}

function TicketCard({ ticket, onAssumir, onResolver }) {
  const [notaResolucao, setNotaResolucao] = useState("");
  const [resolvendo, setResolvendo] = useState(false);

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{ticket.assunto}</span>
            <Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
            <Badge tone={PRIORIDADE_TONE[ticket.prioridade]}>{ticket.prioridade}</Badge>
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray500 }}>
            {ticket.profissional_nome} · {ticket.profissional_email}
          </div>
          <div style={{ fontSize: 13, color: COLORS.gray700, marginTop: 8 }}>{ticket.descricao}</div>
          <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 8 }}>
            Aberto {new Date(ticket.created_at).toLocaleString("pt-BR")}
            {ticket.criado_por_nome && ` por ${ticket.criado_por_nome}`}
            {ticket.atendido_por_nome && ` · Atendido por ${ticket.atendido_por_nome}`}
          </div>
          {ticket.status === "resolvido" && ticket.resolucao_nota && (
            <div style={{ fontSize: 12, color: COLORS.green, marginTop: 6, fontStyle: "italic" }}>
              Resolução: {ticket.resolucao_nota}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {ticket.status === "aberto" && (
            <button onClick={() => onAssumir(ticket.id)} style={{ background: COLORS.amberBg, color: COLORS.amber, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Assumir
            </button>
          )}
          {ticket.status === "em_andamento" && !resolvendo && (
            <button onClick={() => setResolvendo(true)} style={{ background: COLORS.greenBg, color: COLORS.green, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Resolver
            </button>
          )}
        </div>
      </div>
      {resolvendo && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.gray200}` }}>
          <textarea
            value={notaResolucao}
            onChange={e => setNotaResolucao(e.target.value)}
            placeholder="O que foi feito pra resolver (opcional)"
            rows={2}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 12, boxSizing: "border-box", marginBottom: 8, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onResolver(ticket.id, notaResolucao)} style={{ background: COLORS.green, color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Confirmar resolução
            </button>
            <button onClick={() => setResolvendo(false)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Suporte({ onUnauthorized }) {
  const [tickets, setTickets] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");

  const carregar = () => {
    adminFetch("/api/admin/suporte-tickets")
      .then(d => setTickets(d.tickets || []))
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setError(e.message); });
  };

  useEffect(carregar, []);

  const acao = async (id, body) => {
    try {
      await adminFetch(`/api/admin/suporte-tickets/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    }
  };

  const filtrados = (tickets || []).filter(t => filtro === "todos" || t.status === filtro);
  const contagem = (s) => (tickets || []).filter(t => s === "todos" || t.status === s).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["todos", "aberto", "em_andamento", "resolvido"].map(s => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px solid ${filtro === s ? COLORS.blue : COLORS.gray200}`,
                background: filtro === s ? COLORS.blue : "white",
                color: filtro === s ? "white" : COLORS.gray700,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {s === "todos" ? "Todos" : STATUS_LABEL[s]} ({contagem(s)})
            </button>
          ))}
        </div>
        <button onClick={() => setMostrarForm(v => !v)} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          {mostrarForm ? "Fechar" : "+ Novo ticket"}
        </button>
      </div>

      {error && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {mostrarForm && (
        <NovoTicketForm
          onCreated={() => { setMostrarForm(false); carregar(); }}
          onCancel={() => setMostrarForm(false)}
        />
      )}

      {tickets === null ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
      ) : filtrados.length === 0 ? (
        <Card><EmptyState title="Nenhum ticket" description={filtro === "todos" ? "Nenhum ticket de suporte aberto ainda." : `Nenhum ticket com status "${STATUS_LABEL[filtro] || filtro}".`} /></Card>
      ) : (
        filtrados.map(t => (
          <TicketCard
            key={t.id}
            ticket={t}
            onAssumir={(id) => acao(id, { assumir: true })}
            onResolver={(id, nota) => acao(id, { status: "resolvido", resolucaoNota: nota })}
          />
        ))
      )}
    </div>
  );
}

export default function Inbox({ onUnauthorized }) {
  const [tab, setTab] = useState("suporte");
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Caixa de Entrada" subtitle="Suporte a profissionais e mensageria" />
      <Tabs active={tab} onChange={setTab} />
      {tab === "suporte" && <Suporte onUnauthorized={onUnauthorized} />}
      {tab === "whatsapp" && <Card><EmptyState title="Ainda não construído" description={MOTIVO_WHATSAPP} /></Card>}
    </div>
  );
}
