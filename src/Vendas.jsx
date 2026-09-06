import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";
import { WhatsApp } from "./Inbox";

// Handoff MULTI-CRM 2026-09-02, item 3. Pipeline dos profissionais "em
// atendimento" — opt-in (a equipe adiciona quem está trabalhando de
// verdade), não confundir com "Dinheiro na Mesa" (volume agregado, sem
// dono). Kanban simples, mover com botões (sem drag-and-drop, mesmo padrão
// do resto do app — sem lib nova só pra isso).
//
// Fase 3 do diagnóstico de estrutura do CRM (2026-09-06), "Corrigir Vendas
// e pipeline": 3 estágios novos (novo_lead/aguardando_resposta/
// pagamento_confirmado) + leads chegando sozinhos da Triagem (fila='vendas'
// da Fase 2, ver demanda_id) + busca de cadastro existente antes de criar
// (backend, ver buscarUsuarioExistente em server.js).
//
// "pagamento_confirmado" NÃO entra em ESTAGIOS_MANUAIS de propósito — é
// sincronizado pelo backend a cada GET (contra assinaturas de verdade),
// nunca um clique. Por isso não tem botão "→" saindo de "Ativo" pra lá, só
// aparece como coluna read-only quando já foi promovido sozinho.
const ESTAGIOS = [
  { id: "novo_lead", label: "Novo lead", cor: "gray" },
  { id: "contato_feito", label: "Contato feito", cor: "blue" },
  { id: "aguardando_resposta", label: "Aguardando resposta", cor: "amber" },
  { id: "documentos_pendentes", label: "Documentos pendentes", cor: "amber" },
  { id: "pagamento_pendente", label: "Pagamento pendente", cor: "purple" },
  { id: "ativo", label: "Ativo", cor: "green" },
  { id: "pagamento_confirmado", label: "Pagamento confirmado", cor: "green" },
];
const ESTAGIOS_MANUAIS = ESTAGIOS.filter(e => e.id !== "pagamento_confirmado");

function NovoLeadForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ profissionalEmail: "", profissionalNome: "", telefone: "", observacoes: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [candidatos, setCandidatos] = useState(null);

  const salvar = async () => {
    setErro("");
    setCandidatos(null);
    setSalvando(true);
    try {
      const r = await adminFetch("/api/admin/vendas-pipeline", { method: "POST", body: JSON.stringify(form) });
      if (r.origemMatch === "ja_no_funil") setErro("Esse profissional já está no funil — não adicionei de novo.");
      onCreated();
    } catch (e) {
      setErro(e.message);
      if (e.candidatos) setCandidatos(e.candidatos);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Adicionar ao funil</div>
      <div style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 10 }}>
        Busca um cadastro existente por e-mail ou telefone antes de criar — se achar, usa o cadastro real (não duplica).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>E-mail do profissional</label>
          <input value={form.profissionalEmail} onChange={e => setForm(f => ({ ...f, profissionalEmail: e.target.value }))} placeholder="profissional@email.com" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Nome</label>
          <input value={form.profissionalNome} onChange={e => setForm(f => ({ ...f, profissionalNome: e.target.value }))} placeholder="Nome completo" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Telefone (opcional, ajuda a achar cadastro existente)</label>
        <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Observações (opcional)</label>
        <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Contexto da conversa, combinados..." rows={2} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
      </div>
      {erro && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 10 }}>{erro}</div>}
      {candidatos && (
        <div style={{ fontSize: 12, color: COLORS.gray700, marginBottom: 10 }}>
          Cadastros encontrados com esse telefone: {candidatos.map(c => `${c.nome} (${c.email})`).join(", ")}. Ajuste o e-mail acima pro correto e tente de novo.
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={salvando} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
          {salvando ? "Salvando..." : "Adicionar"}
        </button>
        <button onClick={onCancel} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </Card>
  );
}

// Card de um lead sem e-mail ainda (chegou pela Triagem, só telefone bateu
// com nenhum cadastro) — a equipe descobre o e-mail na conversa e completa
// aqui; o backend roda a MESMA busca/criação do formulário manual (PATCH
// com profissionalEmail), não duplica.
function CompletarEmailForm({ leadId, onUnauthorized, onSalvo }) {
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [candidatos, setCandidatos] = useState(null);

  const salvar = async () => {
    if (!email.trim()) return;
    setErro(""); setCandidatos(null); setSalvando(true);
    try {
      await adminFetch(`/api/admin/vendas-pipeline/${leadId}`, { method: "PATCH", body: JSON.stringify({ profissionalEmail: email.trim() }) });
      onSalvo();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setErro(e.message);
      if (e.candidatos) setCandidatos(e.candidatos);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.gray200}` }}>
      <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 700, marginBottom: 6 }}>⚠️ Sem e-mail ainda (veio da Triagem) — complete quando descobrir</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.gray200}`, fontSize: 12, boxSizing: "border-box" }} />
        <button onClick={salvar} disabled={salvando || !email.trim()} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
          {salvando ? "..." : "Salvar"}
        </button>
      </div>
      {erro && <div style={{ color: COLORS.red, fontSize: 11, marginTop: 6 }}>{erro}</div>}
      {candidatos && (
        <div style={{ fontSize: 11, color: COLORS.gray700, marginTop: 6 }}>
          Bate com: {candidatos.map(c => `${c.nome} (${c.email})`).join(", ")}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onMover, onRemover, onUnauthorized, onMudou }) {
  const autoSincronizado = lead.estagio === "pagamento_confirmado";
  const idxManual = ESTAGIOS_MANUAIS.findIndex(e => e.id === lead.estagio);
  const anterior = !autoSincronizado ? ESTAGIOS_MANUAIS[idxManual - 1] : null;
  const proximo = !autoSincronizado && idxManual >= 0 ? ESTAGIOS_MANUAIS[idxManual + 1] : null;

  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{lead.profissional_nome}</span>
        {lead.demanda_id && <Badge tone="blue">Triagem</Badge>}
      </div>
      <div style={{ fontSize: 11, color: COLORS.gray500, marginBottom: 6 }}>
        {lead.profissional_email || "sem e-mail ainda"}{lead.telefone && ` · ${lead.telefone}`}
      </div>
      {lead.observacoes && <div style={{ fontSize: 12, color: COLORS.gray700, marginBottom: 8 }}>{lead.observacoes}</div>}
      <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 8 }}>
        {lead.responsavel_nome ? `Com ${lead.responsavel_nome}` : "Sem responsável"}
      </div>

      {autoSincronizado ? (
        <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 700 }}>
          🔒 Sincronizado automaticamente com a assinatura paga — não precisa mover manualmente.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {anterior && (
            <button onClick={() => onMover(lead.id, anterior.id)} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: COLORS.gray500 }}>
              ← {anterior.label}
            </button>
          )}
          {proximo && (
            <button onClick={() => onMover(lead.id, proximo.id)} style={{ background: COLORS.blueDark + "18", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: COLORS.blue }}>
              {proximo.label} →
            </button>
          )}
          <button onClick={() => onRemover(lead.id)} style={{ background: "none", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: COLORS.red, marginLeft: "auto" }}>
            Remover
          </button>
        </div>
      )}

      {!lead.profissional_email && <CompletarEmailForm leadId={lead.id} onUnauthorized={onUnauthorized} onSalvo={onMudou} />}
    </Card>
  );
}

export default function Vendas({ onUnauthorized }) {
  const [aba, setAba] = useState("funil");
  const [leads, setLeads] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");

  const carregar = () => {
    adminFetch("/api/admin/vendas-pipeline")
      .then(d => setLeads(d.leads || []))
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setError(e.message); });
  };

  useEffect(carregar, []);

  const mover = async (id, estagio) => {
    try {
      await adminFetch(`/api/admin/vendas-pipeline/${id}`, { method: "PATCH", body: JSON.stringify({ estagio }) });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    }
  };

  const remover = async (id) => {
    try {
      await adminFetch(`/api/admin/vendas-pipeline/${id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader
        title="Vendas"
        subtitle="Pipeline de profissionais em atendimento"
        actions={
          aba === "funil" && (
            <button onClick={() => setMostrarForm(v => !v)} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              {mostrarForm ? "Fechar" : "+ Adicionar ao funil"}
            </button>
          )
        }
      />

      {/* Sub-abas — "WhatsApp" reaproveita o componente de Inbox.jsx filtrado
          por fila='vendas' (especificação "Fila de Demandas de Clientes",
          2026-09-03): conversas movidas pra cá na Caixa de Entrada. */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${COLORS.gray200}` }}>
        {[{ id: "funil", label: "Funil" }, { id: "whatsapp", label: "WhatsApp" }].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            style={{
              padding: "10px 16px", border: "none", background: "none",
              borderBottom: aba === t.id ? `2px solid ${COLORS.blue}` : "2px solid transparent",
              color: aba === t.id ? COLORS.blue : COLORS.gray500,
              fontWeight: 800, fontSize: 13, cursor: "pointer", marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === "whatsapp" && <WhatsApp onUnauthorized={onUnauthorized} filaFiltro="vendas" />}

      {aba === "funil" && (
        <>
          {error && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

          {mostrarForm && (
            <NovoLeadForm onCreated={() => { setMostrarForm(false); carregar(); }} onCancel={() => setMostrarForm(false)} />
          )}

          {leads === null ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
          ) : leads.length === 0 ? (
            <Card><EmptyState title="Ninguém no funil ainda" description="Adicione um profissional que a equipe esteja trabalhando ativamente, ou encaminhe uma conversa pra 'Vendas' na Caixa de Entrada — Triagem." /></Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
              {ESTAGIOS.map(estagio => {
                const doEstagio = leads.filter(l => l.estagio === estagio.id);
                return (
                  <div key={estagio.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Badge tone={estagio.cor}>{estagio.label}</Badge>
                      <span style={{ fontSize: 12, color: COLORS.gray400, fontWeight: 700 }}>{doEstagio.length}</span>
                    </div>
                    {doEstagio.length === 0 ? (
                      <div style={{ fontSize: 12, color: COLORS.gray400, padding: "12px 0" }}>Vazio</div>
                    ) : (
                      doEstagio.map(lead => (
                        <LeadCard key={lead.id} lead={lead} onMover={mover} onRemover={remover} onUnauthorized={onUnauthorized} onMudou={carregar} />
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
