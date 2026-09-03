import { useEffect, useRef, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 2 (Caixa de Entrada). Duas abas: Suporte
// (real, dado real) e WhatsApp — 2026-09-03: sai do "ainda travado" (motivo
// abaixo era o texto original, ver App.jsx/EM_CONSTRUCAO.inbox antigo).
// Provedor Z-API (QR code, sem aprovação Meta) — decisão do usuário pra MVP,
// ver handoff. Consome MULTI-BACKEND /api/admin/whatsapp/*.

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
function WhatsApp({ onUnauthorized }) {
  const [conversas, setConversas] = useState(null);
  const [erroConversas, setErroConversas] = useState("");
  const [ativa, setAtiva] = useState(null); // telefone selecionado
  const [mensagens, setMensagens] = useState(null);
  const [erroMensagens, setErroMensagens] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const threadRef = useRef(null);

  const carregarConversas = () => {
    adminFetch("/api/admin/whatsapp/conversas")
      .then(d => { setConversas(d.conversas || []); setErroConversas(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErroConversas(e.message); });
  };

  const carregarMensagens = (telefone) => {
    adminFetch(`/api/admin/whatsapp/mensagens/${telefone}`)
      .then(d => { setMensagens(d.mensagens || []); setErroMensagens(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErroMensagens(e.message); });
  };

  useEffect(carregarConversas, []);

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
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.gray200}`, fontWeight: 800, fontSize: 13 }}>
              {conversaAtiva?.nomeContato || formatarTelefone(ativa)}
              <span style={{ fontWeight: 500, color: COLORS.gray400, marginLeft: 8, fontSize: 12 }}>{formatarTelefone(ativa)}</span>
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
      {tab === "whatsapp" && <WhatsApp onUnauthorized={onUnauthorized} />}
    </div>
  );
}
