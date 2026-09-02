import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 3. Pipeline dos profissionais "em
// atendimento" — opt-in (a equipe adiciona quem está trabalhando de
// verdade), não confundir com "Dinheiro na Mesa" (volume agregado, sem
// dono). Kanban simples de 4 colunas, mover com botões (sem drag-and-drop,
// mesmo padrão do resto do app — sem lib nova só pra isso).
const ESTAGIOS = [
  { id: "contato_feito", label: "Contato feito", cor: "blue" },
  { id: "documentos_pendentes", label: "Documentos pendentes", cor: "amber" },
  { id: "pagamento_pendente", label: "Pagamento pendente", cor: "purple" },
  { id: "ativo", label: "Ativo", cor: "green" },
];

function NovoLeadForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ profissionalEmail: "", profissionalNome: "", observacoes: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    try {
      await adminFetch("/api/admin/vendas-pipeline", { method: "POST", body: JSON.stringify(form) });
      onCreated();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Adicionar ao funil</div>
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
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, display: "block", marginBottom: 4 }}>Observações (opcional)</label>
        <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Contexto da conversa, combinados..." rows={2} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
      </div>
      {erro && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 10 }}>{erro}</div>}
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

function LeadCard({ lead, onMover, onRemover }) {
  const idxAtual = ESTAGIOS.findIndex(e => e.id === lead.estagio);
  const anterior = ESTAGIOS[idxAtual - 1];
  const proximo = ESTAGIOS[idxAtual + 1];

  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{lead.profissional_nome}</div>
      <div style={{ fontSize: 11, color: COLORS.gray500, marginBottom: 6 }}>{lead.profissional_email}</div>
      {lead.observacoes && <div style={{ fontSize: 12, color: COLORS.gray700, marginBottom: 8 }}>{lead.observacoes}</div>}
      <div style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 8 }}>
        {lead.responsavel_nome ? `Com ${lead.responsavel_nome}` : "Sem responsável"}
      </div>
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
    </Card>
  );
}

export default function Vendas({ onUnauthorized }) {
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
          <button onClick={() => setMostrarForm(v => !v)} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            {mostrarForm ? "Fechar" : "+ Adicionar ao funil"}
          </button>
        }
      />

      {error && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {mostrarForm && (
        <NovoLeadForm onCreated={() => { setMostrarForm(false); carregar(); }} onCancel={() => setMostrarForm(false)} />
      )}

      {leads === null ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
      ) : leads.length === 0 ? (
        <Card><EmptyState title="Ninguém no funil ainda" description="Adicione um profissional que a equipe esteja trabalhando ativamente pra fechar o cadastro." /></Card>
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
                    <LeadCard key={lead.id} lead={lead} onMover={mover} onRemover={remover} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
