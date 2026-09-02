import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 5. Escopo real construído: só o painel
// "Não Fecharam" migrado pra cá (já existia desde a Fase 1/3 do CRM em
// /api/admin/clientes?status=sem_solicitacao) + disparo de reengajamento
// via push OneSignal. O resto do que o handoff pedia (campanhas/Facebook
// Ads, rastreio de origem/UTM, templates por estágio) continua travado —
// mesmo motivo já documentado em EM_CONSTRUCAO.marketing: não existe
// rastreamento de campanha nem integração com plataforma de anúncio hoje.
const MOTIVO_CAMPANHAS = "Não existe rastreamento de origem/campanha (UTM) nem integração com plataformas de anúncio hoje — pedidos.origem só distingue real/demo/suporte, não é dado de marketing. Precisa de instrumentação nova (UTM nos links de cadastro) e decisão de quais plataformas integrar.";
const MOTIVO_TEMPLATES = "Depende de ter mais de um canal de envio de verdade pra fazer sentido ter \"templates por estágio\" — hoje só existe push (OneSignal), WhatsApp segue travado numa decisão de provedor (ver Inbox). Por enquanto a mensagem de reengajamento é digitada na hora, não hoje um sistema de templates.";

function NaoFecharam() {
  const [clientes, setClientes] = useState(null);
  const [selecionados, setSelecionados] = useState(new Set());
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/clientes?status=sem_solicitacao")
      .then(d => setClientes(d.clientes || []))
      .catch(e => setError(e.message));
  }, []);

  const alternar = (email) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(email)) novo.delete(email); else novo.add(email);
      return novo;
    });
  };

  const selecionarTodosComPush = () => {
    setSelecionados(new Set((clientes || []).filter(c => c.onesignal_player_id).map(c => c.email)));
  };

  const disparar = async () => {
    if (!selecionados.size || !mensagem.trim()) return;
    setEnviando(true);
    setError("");
    setResultado(null);
    try {
      const r = await adminFetch("/api/admin/marketing/reengajamento", {
        method: "POST",
        body: JSON.stringify({ emails: [...selecionados], mensagem }),
      });
      setResultado(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (error) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{error}</div>;
  if (clientes === null) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;
  if (!clientes.length) return <Card><EmptyState title="Ninguém aqui" description="Nenhum cliente sem solicitação no momento." /></Card>;

  const comPush = clientes.filter(c => c.onesignal_player_id).length;

  return (
    <Card>
      <div style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 12 }}>
        {clientes.length} cliente(s) nunca solicitaram nada — {comPush} com push habilitado (só esses conseguem receber a notificação).
      </div>

      <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${COLORS.gray100}`, borderRadius: 10, marginBottom: 14 }}>
        {clientes.map(c => (
          <label key={c.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${COLORS.gray100}`, cursor: "pointer", opacity: c.onesignal_player_id ? 1 : 0.5 }}>
            <input type="checkbox" checked={selecionados.has(c.email)} disabled={!c.onesignal_player_id} onChange={() => alternar(c.email)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name || "Sem nome"}</div>
              <div style={{ fontSize: 11, color: COLORS.gray400 }}>{c.email}{!c.onesignal_player_id && " · sem push habilitado"}</div>
            </div>
          </label>
        ))}
      </div>

      <button onClick={selecionarTodosComPush} style={{ background: "none", border: `1px solid ${COLORS.gray200}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
        Selecionar todos com push
      </button>

      <textarea
        value={mensagem}
        onChange={e => setMensagem(e.target.value)}
        placeholder="Mensagem de reengajamento..."
        rows={3}
        style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", marginBottom: 10, resize: "vertical" }}
      />

      {resultado && (
        <div style={{ background: COLORS.greenBg, color: COLORS.green, padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
          Enviado pra {resultado.enviados} pessoa(s).{resultado.sem_push?.length > 0 && ` ${resultado.sem_push.length} não tinham push habilitado, não recebeu.`}
        </div>
      )}

      <button onClick={disparar} disabled={enviando || !selecionados.size || !mensagem.trim()} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: (enviando || !selecionados.size || !mensagem.trim()) ? 0.6 : 1 }}>
        {enviando ? "Enviando..." : `Disparar pra ${selecionados.size} selecionado(s)`}
      </button>
    </Card>
  );
}

export default function Marketing() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Marketing" subtitle="Reengajamento e aquisição" />

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Não Fecharam — reengajamento</div>
      <div style={{ marginBottom: 24 }}>
        <NaoFecharam />
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Campanhas e rastreio de origem</div>
      <Card style={{ marginBottom: 24 }}>
        <EmptyState title="Ainda não construído" description={MOTIVO_CAMPANHAS} />
      </Card>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Templates de mensagem por estágio</div>
      <Card>
        <EmptyState title="Ainda não construído" description={MOTIVO_TEMPLATES} />
      </Card>
    </div>
  );
}
