import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, StatTile, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 2 (Caixa de Entrada). Reorganizada na
// Fase 2 do diagnóstico de estrutura do CRM (2026-09-06), "Caixa de Entrada
// como Triagem": deixa de parecer só "Suporte" e vira a central de triagem
// da MULTI — toda conversa do WhatsApp nasce aqui e é roteada pra Vendas,
// Suporte ou Serviços (Atendimentos.jsx). A integração Z-API (WhatsApp,
// componente abaixo) não muda de comportamento nenhum — só ganhou 2 pontas
// novas (fila='triagem' no menu, prop abrirTelefone) — e continua exportada
// pra Vendas.jsx reaproveitar (filaFiltro="vendas"), como já era.
//
// "Tickets" (problema interno COM UM PROFISSIONAL — pagamento, documento,
// reclamação) é conceito diferente de "Suporte" na Triagem (conversa DE
// CLIENTE roteada pro time) — achado do diagnóstico desta fase: são 2
// modelos de "suporte" que não se sobrepõem (público diferente), por isso
// continuam como abas separadas aqui, nenhum dado migrado entre eles (ver
// memória do projeto — os dois tinham 0 linhas reais até esta fase).

const TICKET_STATUS_TONE = { aberto: "red", em_andamento: "amber", resolvido: "green" };
const TICKET_STATUS_LABEL = { aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido" };

// Achado real (caso Diney, 2026-09-06): "sou de bh atuo como montador de
// móveis e marido de aluguel" foi triado como demanda de cliente em
// Atendimentos — é alguém se OFERECENDO como profissional, não pedindo
// serviço. Heurística simples de texto, só um AVISO visual pra quem está
// triando — nunca decide nem bloqueia sozinha (mensagem de WhatsApp é
// texto livre e bagunçado, a heurística pode errar pros dois lados).
const PADROES_OFERTA_PROFISSIONAL = [
  /\batuo\s+como\b/i,
  /\bsou\s+(um\s+|uma\s+)?profissional\s+(de|em)\b/i,
  /\btrabalho\s+com\b/i,
  /\bfa[çc]o\s+servi[çc]os?\s+de\b/i,
  /\bpresto\s+servi[çc]os?\s+de\b/i,
  /\bsou\s+(montador|eletricista|encanador|pedreiro|pintor|diarista|marceneiro|t[ée]cnico|marido\s+de\s+aluguel)\b/i,
];
function pareceOfertaProfissional(texto) {
  return !!texto && PADROES_OFERTA_PROFISSIONAL.some((p) => p.test(texto));
}

function AvisoOfertaProfissional() {
  return (
    <div style={{ background: COLORS.amberBg, color: COLORS.amber, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
      <span>⚠️</span>
      <span>Isso parece alguém se oferecendo como profissional, não uma demanda de cliente — confirme antes de mover pra Atendimentos/Vendas.</span>
    </div>
  );
}

function Tabs({ active, onChange }) {
  const tabs = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "triagem", label: "Triagem" },
    { id: "encaminhadas", label: "Encaminhadas" },
    { id: "acompanhamento", label: "Acompanhamento" },
    { id: "tickets", label: "Tickets (profissional)" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${COLORS.gray200}`, flexWrap: "wrap" }}>
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
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Pills({ options, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: "6px 12px", borderRadius: 999,
            border: `1px solid ${active === o.id ? COLORS.blue : COLORS.gray200}`,
            background: active === o.id ? COLORS.blue : "white",
            color: active === o.id ? "white" : COLORS.gray700,
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          {o.label} ({o.count})
        </button>
      ))}
    </div>
  );
}

// ── MÉTRICAS DE TRIAGEM (item 4 da Fase 2) ──────────────────────────────
// Painel simples dentro da própria tela — ver origem de cada número em
// GET /api/admin/triagem-metricas (server.js). Sempre visível, não muda
// com a aba selecionada.
function MetricasTriagem({ onUnauthorized, versao }) {
  const [m, setM] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/triagem-metricas")
      .then(d => { setM(d); setErro(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErro(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  if (erro) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{erro}</div>;
  if (!m) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <StatTile label="Leads hoje" value={m.leadsRecebidosHoje} icon="📥" />
        <StatTile label="Triados hoje" value={m.leadsTriadosHoje} icon="🔎" />
        <StatTile label="Ainda não triados" value={m.leadsNaoTriados} icon="⏳" />
        <StatTile label="Pendentes (encaminhados)" value={m.pendentes} icon="📌" />
      </div>
      <div style={{ fontSize: 12, color: COLORS.gray500 }}>
        Enviados hoje: <strong>{m.enviadosHoje.vendas}</strong> vendas · <strong>{m.enviadosHoje.suporte}</strong> suporte · <strong>{m.enviadosHoje.servicos}</strong> serviços
      </div>
    </div>
  );
}

// ── Card genérico de uma linha de demandas_clientes (Fase 2) ────────────
// "acoes" vem pronto de quem chama — cada aba decide o que faz sentido
// oferecer pra cada balde (Triagem/Encaminhadas/Acompanhamento).
function DemandaCard({ demanda, acoes, onVerConversa }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>
            {demanda.nome_cliente || formatarTelefone(demanda.telefone_cliente) || "Sem nome"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray500, marginTop: 2 }}>
            {demanda.telefone_cliente && formatarTelefone(demanda.telefone_cliente)}
            {demanda.regiao && ` · ${demanda.regiao}`}
            {demanda.categoria_servico && ` · ${demanda.categoria_servico}`}
          </div>
          {demanda.descricao && <div style={{ fontSize: 13, color: COLORS.gray700, marginTop: 8 }}>{demanda.descricao}</div>}
          {pareceOfertaProfissional(demanda.descricao) && <div style={{ marginTop: 8 }}><AvisoOfertaProfissional /></div>}
          <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 8 }}>
            Aberta {new Date(demanda.criado_em).toLocaleString("pt-BR")}
            {demanda.atualizado_em !== demanda.criado_em && ` · atualizada ${new Date(demanda.atualizado_em).toLocaleString("pt-BR")}`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {demanda.telefone_cliente && (
            <button onClick={() => onVerConversa(demanda.telefone_cliente)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, color: COLORS.gray700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Ver conversa
            </button>
          )}
          {acoes.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              style={{
                background: a.tone === "green" ? COLORS.greenBg : a.tone === "red" ? COLORS.redBg : COLORS.amberBg,
                color: a.tone === "green" ? COLORS.green : a.tone === "red" ? COLORS.red : COLORS.amber,
                border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Aba "Triagem" — Novas / Em triagem / Retornaram para triagem ────────
function AbaTriagem({ demandas, conversasNovas, erroNovas, onUnauthorized, onVerConversa, onMudou, onAbrirEncaminharModal }) {
  const emTriagem = useMemo(() => demandas.filter(d => d.fila === "triagem" && d.atualizado_em === d.criado_em), [demandas]);
  const retornaram = useMemo(() => demandas.filter(d => d.fila === "triagem" && d.atualizado_em !== d.criado_em), [demandas]);
  const [sub, setSub] = useState("novas");

  const patch = async (id, body) => {
    try {
      await adminFetch(`/api/admin/demandas/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      onMudou();
    } catch (e) { if (e.unauthorized) return onUnauthorized?.(); }
  };

  const abrirParaTriagem = async (conversa) => {
    try {
      await adminFetch("/api/admin/demandas", {
        method: "POST",
        body: JSON.stringify({ telefoneCliente: conversa.telefone, fila: "triagem", nomeCliente: conversa.nomeContato || null, descricao: conversa.ultimaMensagem || null }),
      });
      onMudou();
    } catch (e) { if (e.unauthorized) return onUnauthorized?.(); }
  };

  const acoesEncaminhar = (d) => ([
    { label: "→ Vendas", tone: "amber", onClick: () => patch(d.id, { fila: "vendas" }) },
    { label: "→ Suporte", tone: "amber", onClick: () => patch(d.id, { fila: "suporte" }) },
    { label: "→ Serviços", tone: "amber", onClick: () => patch(d.id, { fila: "demanda" }) },
    { label: "Finalizar", tone: "green", onClick: () => patch(d.id, { status: "resolvida" }) },
  ]);

  return (
    <div>
      <Pills
        options={[
          { id: "novas", label: "Novas", count: conversasNovas === null ? "…" : conversasNovas.length },
          { id: "em_triagem", label: "Em triagem", count: emTriagem.length },
          { id: "retornaram", label: "Retornaram para triagem", count: retornaram.length },
        ]}
        active={sub}
        onChange={setSub}
      />

      {sub === "novas" && (
        erroNovas ? <div style={{ color: COLORS.red, fontSize: 13 }}>{erroNovas}</div> :
        conversasNovas === null ? <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div> :
        conversasNovas.length === 0 ? <Card><EmptyState title="Nenhuma conversa nova" description="Todo mundo que já mandou mensagem foi ao menos aberto pra triagem." /></Card> :
        conversasNovas.map(c => (
          <Card key={c.telefone} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{c.nomeContato || formatarTelefone(c.telefone)}</div>
                <div style={{ fontSize: 12, color: COLORS.gray500, marginTop: 2 }}>{formatarTelefone(c.telefone)}</div>
                <div style={{ fontSize: 13, color: COLORS.gray700, marginTop: 8 }}>{c.ultimaMensagem}</div>
                {pareceOfertaProfissional(c.ultimaMensagem) && <div style={{ marginTop: 8 }}><AvisoOfertaProfissional /></div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <button onClick={() => onVerConversa(c.telefone)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, color: COLORS.gray700, cursor: "pointer" }}>Ver conversa</button>
                <button onClick={() => abrirParaTriagem(c)} style={{ background: COLORS.amberBg, color: COLORS.amber, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Abrir para triagem</button>
                <button onClick={() => onAbrirEncaminharModal(c.telefone, c.ultimaMensagem)} style={{ background: COLORS.gray100, color: COLORS.gray700, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Encaminhar direto ▾</button>
              </div>
            </div>
          </Card>
        ))
      )}

      {sub === "em_triagem" && (
        emTriagem.length === 0 ? <Card><EmptyState title="Nada em triagem" description="Nenhuma conversa aberta pra decidir destino agora." /></Card> :
        emTriagem.map(d => <DemandaCard key={d.id} demanda={d} onVerConversa={onVerConversa} acoes={acoesEncaminhar(d)} />)
      )}

      {sub === "retornaram" && (
        retornaram.length === 0 ? <Card><EmptyState title="Nada retornou" description="Nenhuma conversa encaminhada voltou pra triagem." /></Card> :
        retornaram.map(d => <DemandaCard key={d.id} demanda={d} onVerConversa={onVerConversa} acoes={acoesEncaminhar(d)} />)
      )}
    </div>
  );
}

// ── Aba "Encaminhadas" — Vendas / Suporte / Serviços ─────────────────────
// "Serviços" (fila='demanda') é só visibilidade aqui — a gestão de status
// já existe em Atendimentos.jsx (Fase 3 da especificação original) e
// continua lá, sem duplicar; por isso o card de Serviços só linka pra lá em
// vez de oferecer Assumir/Finalizar direto (evita 2 telas divergindo sobre
// o mesmo registro).
function AbaEncaminhadas({ demandas, onUnauthorized, onVerConversa, onMudou, onNavigate }) {
  const [sub, setSub] = useState("vendas");
  const vendas = useMemo(() => demandas.filter(d => d.fila === "vendas" && d.status === "aberta"), [demandas]);
  const suporte = useMemo(() => demandas.filter(d => d.fila === "suporte" && d.status === "aberta"), [demandas]);
  const servicos = useMemo(() => demandas.filter(d => d.fila === "demanda" && d.status === "aberta"), [demandas]);

  const patch = async (id, body) => {
    try {
      await adminFetch(`/api/admin/demandas/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      onMudou();
    } catch (e) { if (e.unauthorized) return onUnauthorized?.(); }
  };

  const acoesFila = (d) => ([
    { label: "Assumir", tone: "amber", onClick: () => patch(d.id, { assumir: true }) },
    { label: "Aguardando resposta", tone: "amber", onClick: () => patch(d.id, { status: "aguardando_resposta" }) },
    { label: "Finalizar", tone: "green", onClick: () => patch(d.id, { status: "resolvida" }) },
    { label: "Voltar p/ triagem", tone: "red", onClick: () => patch(d.id, { fila: "triagem" }) },
  ]);

  const lista = sub === "vendas" ? vendas : sub === "suporte" ? suporte : servicos;

  return (
    <div>
      <Pills
        options={[
          { id: "vendas", label: "Vendas", count: vendas.length },
          { id: "suporte", label: "Suporte", count: suporte.length },
          { id: "servicos", label: "Serviços", count: servicos.length },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "servicos" && (
        <div style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 10 }}>
          Gerenciado na aba <button onClick={() => onNavigate?.("atendimentos")} style={{ background: "none", border: "none", color: COLORS.blue, fontWeight: 800, cursor: "pointer", padding: 0, fontSize: 12 }}>Atendimentos</button> — aqui é só visibilidade de quem chegou pela Triagem.
        </div>
      )}
      {lista.length === 0 ? (
        <Card><EmptyState title="Nada por aqui" description="Ninguém encaminhado pra essa fila agora." /></Card>
      ) : (
        lista.map(d => (
          <DemandaCard
            key={d.id}
            demanda={d}
            onVerConversa={onVerConversa}
            acoes={sub === "servicos" ? [{ label: "Ver em Atendimentos", tone: "amber", onClick: () => onNavigate?.("atendimentos") }] : acoesFila(d)}
          />
        ))
      )}
    </div>
  );
}

// ── Aba "Acompanhamento" — Em andamento / Aguardando resposta / Finalizadas
function AbaAcompanhamento({ demandas, onUnauthorized, onVerConversa, onMudou, onNavigate }) {
  const [sub, setSub] = useState("em_andamento");
  const emAndamento = useMemo(() => demandas.filter(d => d.fila !== "triagem" && d.status === "em_andamento"), [demandas]);
  const aguardando = useMemo(() => demandas.filter(d => d.fila !== "triagem" && d.status === "aguardando_resposta"), [demandas]);
  const finalizadas = useMemo(() => demandas.filter(d => d.status === "resolvida" || d.status === "cancelada"), [demandas]);

  const patch = async (id, body) => {
    try {
      await adminFetch(`/api/admin/demandas/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      onMudou();
    } catch (e) { if (e.unauthorized) return onUnauthorized?.(); }
  };

  const acoesPara = (d) => {
    if (d.fila === "demanda") return [{ label: "Ver em Atendimentos", tone: "amber", onClick: () => onNavigate?.("atendimentos") }];
    const base = [];
    if (d.status !== "em_andamento") base.push({ label: "Retomar", tone: "amber", onClick: () => patch(d.id, { status: "em_andamento" }) });
    if (d.status !== "aguardando_resposta") base.push({ label: "Aguardando resposta", tone: "amber", onClick: () => patch(d.id, { status: "aguardando_resposta" }) });
    if (d.status !== "resolvida") base.push({ label: "Finalizar", tone: "green", onClick: () => patch(d.id, { status: "resolvida" }) });
    if (d.status === "resolvida" || d.status === "cancelada") base.push({ label: "Reabrir", tone: "amber", onClick: () => patch(d.id, { status: "aberta" }) });
    base.push({ label: "Voltar p/ triagem", tone: "red", onClick: () => patch(d.id, { fila: "triagem" }) });
    return base;
  };

  const lista = sub === "em_andamento" ? emAndamento : sub === "aguardando" ? aguardando : finalizadas;

  return (
    <div>
      <Pills
        options={[
          { id: "em_andamento", label: "Em andamento", count: emAndamento.length },
          { id: "aguardando", label: "Aguardando resposta", count: aguardando.length },
          { id: "finalizadas", label: "Finalizadas", count: finalizadas.length },
        ]}
        active={sub}
        onChange={setSub}
      />
      {lista.length === 0 ? (
        <Card><EmptyState title="Nada por aqui" description="Nenhum item nessa situação agora." /></Card>
      ) : (
        lista.map(d => <DemandaCard key={d.id} demanda={d} onVerConversa={onVerConversa} acoes={sub === "finalizadas" ? (d.fila === "demanda" ? [{ label: "Ver em Atendimentos", tone: "amber", onClick: () => onNavigate?.("atendimentos") }] : [{ label: "Reabrir", tone: "amber", onClick: () => patch(d.id, { status: "aberta" }) }]) : acoesPara(d)} />)
      )}
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
            <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
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

const PRIORIDADE_TONE = { baixa: "gray", normal: "blue", alta: "red" };

// "Tickets (profissional)" — módulo de Suporte original (problema interno
// com um profissional), intocado nesta fase — só saiu de dentro da antiga
// aba "Suporte" (que também tinha uma sub-aba WhatsApp) pra virar uma aba
// própria no nível principal, já que não é mais a mesma coisa que a
// Triagem de conversa de cliente.
function Tickets({ onUnauthorized }) {
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
              {s === "todos" ? "Todos" : TICKET_STATUS_LABEL[s]} ({contagem(s)})
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
        <Card><EmptyState title="Nenhum ticket" description={filtro === "todos" ? "Nenhum ticket de suporte aberto ainda." : `Nenhum ticket com status "${TICKET_STATUS_LABEL[filtro] || filtro}".`} /></Card>
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

// Formata telefone só-dígitos (formato Z-API, ex: "5511999998888") pra
// leitura humana. Fica no melhor-esforço — se não bater no padrão BR
// DDI+DDD+9dígitos, devolve como veio em vez de inventar formatação errada.
function formatarTelefone(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return d;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

function horaCurta(iso) {
  const dt = new Date(iso);
  const hoje = new Date();
  const mesmoDia = dt.toDateString() === hoje.toDateString();
  return mesmoDia
    ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function ConversaItem({ conversa, ativa, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        border: "none",
        borderBottom: `1px solid ${COLORS.gray100}`,
        background: ativa ? COLORS.gray50 : "white",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: COLORS.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conversa.nomeContato || formatarTelefone(conversa.telefone)}
        </span>
        <span style={{ fontSize: 11, color: COLORS.gray400, flexShrink: 0 }}>{horaCurta(conversa.ultimaEm)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 12, color: COLORS.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conversa.ultimaMensagem}
        </span>
        {conversa.naoLidas > 0 && (
          <span style={{ background: COLORS.blue, color: "white", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "2px 6px", flexShrink: 0 }}>
            {conversa.naoLidas}
          </span>
        )}
      </div>
    </button>
  );
}

function Bolha({ mensagem }) {
  const minha = mensagem.direcao === "saida";
  return (
    <div style={{ display: "flex", justifyContent: minha ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div
        style={{
          maxWidth: "72%",
          background: minha ? COLORS.blue : COLORS.gray100,
          color: minha ? "white" : COLORS.gray900,
          borderRadius: 14,
          borderBottomRightRadius: minha ? 4 : 14,
          borderBottomLeftRadius: minha ? 14 : 4,
          padding: "8px 12px",
          fontSize: 13,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {mensagem.conteudo}
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>
          {horaCurta(mensagem.created_at)}
        </div>
      </div>
    </div>
  );
}

// Segunda metade do handoff 2026-09-03 — WhatsApp via Z-API. Layout de duas
// colunas (lista de conversas + thread), mesma ideia de qualquer cliente de
// chat. Sem realtime de verdade (sem websocket/Supabase Realtime plugado
// aqui) — poll simples a cada 10s só na conversa aberta, pra não passar a
// impressão de "ao vivo" quando não é.
// filaFiltro opcional ('vendas' | 'suporte' | 'demanda' | 'triagem' |
// 'novas') — quando presente, só lista conversas já triadas pra essa fila
// (ver "Mover para fila" acima e GET /api/admin/whatsapp/conversas?fila=
// no backend). Sem o parâmetro (aba WhatsApp da Caixa de Entrada), lista
// todas. Exportado pra Vendas.jsx reaproveitar (comportamento intocado
// nesta fase — só ganhou o prop abrirTelefone, aditivo).
// abrirTelefone (Fase 2 do diagnóstico de estrutura do CRM, 2026-09-06):
// quando presente, abre essa conversa automaticamente ao montar — é como as
// abas Triagem/Encaminhadas/Acompanhamento levam pro histórico completo sem
// duplicar a UI de chat.
export function WhatsApp({ onUnauthorized, filaFiltro, abrirTelefone }) {
  const [conversas, setConversas] = useState(null);
  const [erroConversas, setErroConversas] = useState("");
  const [ativa, setAtiva] = useState(null); // telefone selecionado
  const [mensagens, setMensagens] = useState(null);
  const [erroMensagens, setErroMensagens] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [menuFila, setMenuFila] = useState(false); // popover "Mover para fila"
  const [modalFila, setModalFila] = useState(null); // { fila } | null — abre o mini-form
  const threadRef = useRef(null);

  const carregarConversas = () => {
    const qs = filaFiltro ? `?fila=${filaFiltro}` : "";
    adminFetch(`/api/admin/whatsapp/conversas${qs}`)
      .then(d => { setConversas(d.conversas || []); setErroConversas(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErroConversas(e.message); });
  };

  const carregarMensagens = (telefone) => {
    adminFetch(`/api/admin/whatsapp/mensagens/${telefone}`)
      .then(d => { setMensagens(d.mensagens || []); setErroMensagens(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErroMensagens(e.message); });
  };

  useEffect(carregarConversas, [filaFiltro]);

  useEffect(() => {
    if (abrirTelefone) setAtiva(abrirTelefone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirTelefone]);

  useEffect(() => {
    if (!ativa) return;
    setMensagens(null);
    carregarMensagens(ativa);
    const t = setInterval(() => carregarMensagens(ativa), 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativa]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [mensagens]);

  const abrirConversa = (telefone) => {
    setAtiva(telefone);
    // Badge de não lida já é zerada no backend ao buscar as mensagens (GET
    // marca como lida) — atualiza a lista aqui pra badge sumir na hora.
    setConversas(cs => (cs || []).map(c => (c.telefone === telefone ? { ...c, naoLidas: 0 } : c)));
  };

  const enviar = async () => {
    const mensagem = texto.trim();
    if (!mensagem || !ativa) return;
    setErroEnvio("");
    setEnviando(true);
    try {
      await adminFetch("/api/admin/whatsapp/enviar", { method: "POST", body: JSON.stringify({ telefone: ativa, mensagem }) });
      setTexto("");
      carregarMensagens(ativa);
      carregarConversas();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setErroEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const conversaAtiva = (conversas || []).find(c => c.telefone === ativa);

  return (
    <div style={{ display: "flex", gap: 16, height: 560 }}>
      <Card style={{ padding: 0, width: 300, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.gray200}`, fontWeight: 800, fontSize: 13 }}>
          Conversas
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {erroConversas ? (
            <div style={{ padding: 14, color: COLORS.red, fontSize: 12 }}>{erroConversas}</div>
          ) : conversas === null ? (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.gray500, fontSize: 13 }}>Carregando...</div>
          ) : conversas.length === 0 ? (
            <EmptyState title="Nenhuma conversa" description="Nenhuma mensagem trocada ainda por este número." />
          ) : (
            conversas.map(c => (
              <ConversaItem key={c.telefone} conversa={c} ativa={c.telefone === ativa} onClick={() => abrirConversa(c.telefone)} />
            ))
          )}
        </div>
      </Card>

      <Card style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!ativa ? (
          <EmptyState title="Selecione uma conversa" description="Escolha um contato à esquerda pra ver o histórico." />
        ) : (
          <>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                {conversaAtiva?.nomeContato || formatarTelefone(ativa)}
                <span style={{ fontWeight: 500, color: COLORS.gray400, marginLeft: 8, fontSize: 12 }}>{formatarTelefone(ativa)}</span>
              </div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuFila(v => !v)}
                  style={{ background: COLORS.gray100, border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 800, fontSize: 12, color: COLORS.gray700, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Mover para fila ▾
                </button>
                {menuFila && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "white", border: `1px solid ${COLORS.gray200}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.1)", zIndex: 10, overflow: "hidden", minWidth: 160 }}>
                    {[{ id: "triagem", label: "Marcar em triagem" }, { id: "demanda", label: "Serviços" }, { id: "vendas", label: "Vendas" }, { id: "suporte", label: "Suporte" }].map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setMenuFila(false); setModalFila({ fila: f.id }); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "white", fontSize: 13, fontWeight: 700, color: COLORS.gray900, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = COLORS.gray50}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {erroMensagens ? (
                <div style={{ color: COLORS.red, fontSize: 12 }}>{erroMensagens}</div>
              ) : mensagens === null ? (
                <div style={{ textAlign: "center", color: COLORS.gray500, fontSize: 13 }}>Carregando...</div>
              ) : mensagens.length === 0 ? (
                <div style={{ textAlign: "center", color: COLORS.gray500, fontSize: 13 }}>Sem mensagens ainda.</div>
              ) : (
                mensagens.map(m => <Bolha key={m.id} mensagem={m} />)
              )}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.gray200}`, padding: 12 }}>
              {erroEnvio && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 8 }}>{erroEnvio}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, resize: "none", fontFamily: "inherit" }}
                />
                <button
                  onClick={enviar}
                  disabled={enviando || !texto.trim()}
                  style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "0 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: enviando || !texto.trim() ? 0.6 : 1 }}
                >
                  {enviando ? "..." : "Enviar"}
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {modalFila && (
        <MoverParaFilaModal
          fila={modalFila.fila}
          telefone={ativa}
          descricaoSugerida={[...(mensagens || [])].reverse().find(m => m.direcao === "entrada")?.conteudo || ""}
          onClose={() => setModalFila(null)}
          onUnauthorized={onUnauthorized}
        />
      )}
    </div>
  );
}

const FILA_LABEL = { triagem: "Triagem", demanda: "Serviços", vendas: "Vendas", suporte: "Suporte" };

// Mini-formulário da ação "Mover para fila" (especificação "Fila de Demandas
// de Clientes + Triagem do WhatsApp", 2026-09-03) — cria um registro em
// demandas_clientes vinculado à conversa (POST /api/admin/demandas). Região e
// categoria pré-preenchem só quando dá pra sugerir sem inventar (aqui,
// nenhuma — a especificação permite prefill "se o texto da conversa já
// sugerir algo, sem forçar", mas isso exigiria casar texto livre contra as
// 157 categorias reais do produto; deixado de fora nesta primeira versão pra
// não arriscar sugerir categoria errada — só a descrição prefilla, com a
// última mensagem recebida, que é sempre segura de reaproveitar).
function MoverParaFilaModal({ fila, telefone, descricaoSugerida, onClose, onUnauthorized }) {
  const [regiao, setRegiao] = useState("");
  const [categoriaServico, setCategoriaServico] = useState("");
  const [descricao, setDescricao] = useState(descricaoSugerida);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Bug real (2026-09-05): navegar pra outra tela (ex: clicar em "Vendas" na
  // sidebar) enquanto o card de sucesso ainda está visível derrubava a app
  // inteira com "NotFoundError: Failed to execute 'removeChild'". O
  // setTimeout(onClose, 1200) abaixo não tinha cleanup — se o componente
  // desmontasse antes dele disparar, o callback rodava depois sobre uma
  // instância já desmontada, colidindo com a remoção de DOM que o React já
  // tinha feito ao trocar de tela. montadoRef evita setState pós-unmount no
  // fluxo assíncrono do fetch; o useEffect abaixo garante que o temporizador
  // do auto-close é cancelado se o modal sumir antes da hora.
  const montadoRef = useRef(true);
  useEffect(() => () => { montadoRef.current = false; }, []);

  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(onClose, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucesso]);

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    try {
      await adminFetch("/api/admin/demandas", {
        method: "POST",
        body: JSON.stringify({ telefoneCliente: telefone, fila, regiao: regiao.trim() || null, categoriaServico: categoriaServico.trim() || null, descricao: descricao.trim() || null }),
      });
      if (!montadoRef.current) return;
      setSucesso(true);
    } catch (e) {
      if (!montadoRef.current) return;
      if (e.unauthorized) return onUnauthorized?.();
      setErro(e.message);
    } finally {
      if (montadoRef.current) setSalvando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420 }}>
        {sucesso ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Movido para {FILA_LABEL[fila]}</div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Mover para {FILA_LABEL[fila]}</div>
            <div style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 16 }}>{formatarTelefone(telefone)}</div>

            {pareceOfertaProfissional(descricao) && <AvisoOfertaProfissional />}

            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Região (cidade/bairro)</label>
            <input
              value={regiao}
              onChange={e => setRegiao(e.target.value)}
              placeholder="Ex: São Paulo/SP"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", marginBottom: 12 }}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Categoria de serviço</label>
            <input
              value={categoriaServico}
              onChange={e => setCategoriaServico(e.target.value)}
              placeholder="Ex: montador_moveis"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", marginBottom: 12 }}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Descrição</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={3}
              placeholder="O que o cliente precisa..."
              style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", resize: "vertical", marginBottom: 16, fontFamily: "inherit" }}
            />

            {erro && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 12 }}>{erro}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={salvar} disabled={salvando} style={{ flex: 1, background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
                {salvando ? "Salvando..." : "Confirmar"}
              </button>
              <button onClick={onClose} disabled={salvando} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Inbox({ onUnauthorized, onNavigate }) {
  const [tab, setTab] = useState("whatsapp");
  const [demandas, setDemandas] = useState([]);
  const [conversasNovas, setConversasNovas] = useState(null);
  const [erroNovas, setErroNovas] = useState("");
  const [versao, setVersao] = useState(0); // incrementa pra forçar recarga (métricas incluídas)
  const [abrirTelefone, setAbrirTelefone] = useState(null);
  const [modalEncaminhar, setModalEncaminhar] = useState(null); // { telefone, descricaoSugerida } | null

  const recarregar = () => setVersao(v => v + 1);

  useEffect(() => {
    adminFetch("/api/admin/demandas")
      .then(d => setDemandas(d.demandas || []))
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); });
    adminFetch("/api/admin/whatsapp/conversas?fila=novas")
      .then(d => { setConversasNovas(d.conversas || []); setErroNovas(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErroNovas(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  const verConversa = (telefone) => {
    setAbrirTelefone(telefone);
    setTab("whatsapp");
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Caixa de Entrada" subtitle="Central de triagem — toda conversa nova é roteada pra Vendas, Suporte ou Serviços" />
      <MetricasTriagem onUnauthorized={onUnauthorized} versao={versao} />
      <Tabs active={tab} onChange={setTab} />

      {tab === "whatsapp" && <WhatsApp onUnauthorized={onUnauthorized} abrirTelefone={abrirTelefone} />}
      {tab === "triagem" && (
        <AbaTriagem
          demandas={demandas}
          conversasNovas={conversasNovas}
          erroNovas={erroNovas}
          onUnauthorized={onUnauthorized}
          onVerConversa={verConversa}
          onMudou={recarregar}
          onAbrirEncaminharModal={(telefone, descricaoSugerida) => setModalEncaminhar({ telefone, descricaoSugerida })}
        />
      )}
      {tab === "encaminhadas" && (
        <AbaEncaminhadas demandas={demandas} onUnauthorized={onUnauthorized} onVerConversa={verConversa} onMudou={recarregar} onNavigate={onNavigate} />
      )}
      {tab === "acompanhamento" && (
        <AbaAcompanhamento demandas={demandas} onUnauthorized={onUnauthorized} onVerConversa={verConversa} onMudou={recarregar} onNavigate={onNavigate} />
      )}
      {tab === "tickets" && <Tickets onUnauthorized={onUnauthorized} />}

      {modalEncaminhar && (
        <EscolherFilaEDepoisModal
          telefone={modalEncaminhar.telefone}
          descricaoSugerida={modalEncaminhar.descricaoSugerida}
          onClose={() => setModalEncaminhar(null)}
          onUnauthorized={onUnauthorized}
          onConfirmado={recarregar}
        />
      )}
    </div>
  );
}

// "Encaminhar direto ▾" numa conversa "Nova" — precisa escolher A fila antes
// de abrir o MoverParaFilaModal (que já assume a fila decidida). Só isso:
// um mini-menu de 3 opções que abre o modal de sempre.
function EscolherFilaEDepoisModal({ telefone, descricaoSugerida, onClose, onUnauthorized, onConfirmado }) {
  const [filaEscolhida, setFilaEscolhida] = useState(null);
  if (filaEscolhida) {
    return (
      <MoverParaFilaModal
        fila={filaEscolhida}
        telefone={telefone}
        descricaoSugerida={descricaoSugerida}
        onClose={() => { onClose(); onConfirmado(); }}
        onUnauthorized={onUnauthorized}
      />
    );
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Encaminhar para...</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["vendas", "suporte", "demanda"].map(f => (
            <button
              key={f}
              onClick={() => setFilaEscolhida(f)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, background: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}
            >
              {FILA_LABEL[f]}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 14, background: "none", border: "none", color: COLORS.gray500, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}
