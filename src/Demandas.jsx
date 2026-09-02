import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 4. ATENÇÃO: apesar do nome (mantido
// por decisão do Thiago), isto NÃO tem relação com pedidos de serviço do
// marketplace — é uma lista de tarefas pessoal de quem está logado.
// Backend exige login por pessoa (crm_equipe) — quem usa o token antigo
// (senha única) recebe 400 explicando isso, tratado abaixo como aviso, não
// como erro genérico.
export default function Demandas({ onUnauthorized }) {
  const [tarefas, setTarefas] = useState(null);
  const [texto, setTexto] = useState("");
  const [prazo, setPrazo] = useState("");
  const [error, setError] = useState("");
  const [precisaLoginPorPessoa, setPrecisaLoginPorPessoa] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    adminFetch("/api/admin/demandas-pessoais")
      .then(d => setTarefas(d.demandas || []))
      .catch(e => {
        if (e.unauthorized) return onUnauthorized?.();
        if (e.message?.includes("login por pessoa")) return setPrecisaLoginPorPessoa(true);
        setError(e.message);
      });
  };

  useEffect(carregar, []);

  const adicionar = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    setError("");
    try {
      await adminFetch("/api/admin/demandas-pessoais", { method: "POST", body: JSON.stringify({ texto, prazo: prazo || null }) });
      setTexto("");
      setPrazo("");
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarConcluida = async (t) => {
    try {
      await adminFetch(`/api/admin/demandas-pessoais/${t.id}`, { method: "PATCH", body: JSON.stringify({ concluida: !t.concluida }) });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    }
  };

  const remover = async (id) => {
    try {
      await adminFetch(`/api/admin/demandas-pessoais/${id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setError(e.message);
    }
  };

  if (precisaLoginPorPessoa) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <PageHeader title="Demandas" subtitle="Lista pessoal de tarefas" />
        <Card><EmptyState title="Login por pessoa necessário" description="Essa lista é pessoal, uma por pessoa da equipe — faça login com seu usuário (não a senha única antiga) pra usar." /></Card>
      </div>
    );
  }

  const pendentes = (tarefas || []).filter(t => !t.concluida);
  const concluidas = (tarefas || []).filter(t => t.concluida);

  const Item = ({ t }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COLORS.gray100}` }}>
      <input type="checkbox" checked={t.concluida} onChange={() => alternarConcluida(t)} style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: t.concluida ? COLORS.gray400 : COLORS.gray900, textDecoration: t.concluida ? "line-through" : "none" }}>{t.texto}</div>
        {t.prazo && <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>Prazo: {new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR")}</div>}
      </div>
      <button onClick={() => remover(t.id)} style={{ background: "none", border: "none", color: COLORS.red, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
        Remover
      </button>
    </div>
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Demandas" subtitle="Lista pessoal de tarefas — só suas, não é sobre pedido de serviço" />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") adicionar(); }}
            placeholder="Nova tarefa..."
            style={{ flex: "1 1 240px", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box" }}
          />
          <input
            type="date"
            value={prazo}
            onChange={e => setPrazo(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13 }}
          />
          <button onClick={adicionar} disabled={salvando || !texto.trim()} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: (salvando || !texto.trim()) ? 0.6 : 1 }}>
            Adicionar
          </button>
        </div>
      </Card>

      {error && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {tarefas === null ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
      ) : tarefas.length === 0 ? (
        <Card><EmptyState title="Nenhuma tarefa" description="Adicione uma pendência acima." /></Card>
      ) : (
        <Card>
          {pendentes.length === 0 && concluidas.length > 0 && (
            <div style={{ fontSize: 13, color: COLORS.gray500, padding: "8px 0" }}>Tudo feito por aqui 🎉</div>
          )}
          {pendentes.map(t => <Item key={t.id} t={t} />)}
          {concluidas.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, textTransform: "uppercase", marginTop: pendentes.length ? 16 : 0, marginBottom: 4 }}>
                Concluídas ({concluidas.length})
              </div>
              {concluidas.map(t => <Item key={t.id} t={t} />)}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
