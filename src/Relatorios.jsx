import { useEffect, useState } from "react";
import { adminFetch, adminDownload } from "./api";
import { PageHeader, Card, EmptyState, COLORS } from "./ui";

// Handoff MULTI-CRM 2026-09-02, item 5 (Relatórios) — escopo decidido com o
// usuário: só Exportação CSV + Funil de conversão do profissional aqui.
// Conciliação Asaas×extrato bancário de verdade fica de fora (projeto à
// parte, precisa upload de extrato — sem integração bancária hoje); o que
// já existe nessa linha (Asaas×Supabase, não Asaas×banco) é a rotina
// semanal de /api/admin/reconciliacao-assinaturas, não replicada aqui.

function ExportCard({ titulo, descricao, path, nomeArquivo }) {
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState("");

  const baixar = async () => {
    setBaixando(true);
    setErro("");
    try {
      await adminDownload(path, nomeArquivo);
    } catch (e) {
      setErro(e.message);
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Card style={{ flex: "1 1 220px" }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 12 }}>{descricao}</div>
      {erro && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 8 }}>{erro}</div>}
      <button onClick={baixar} disabled={baixando} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: baixando ? 0.6 : 1 }}>
        {baixando ? "Baixando..." : "Baixar CSV"}
      </button>
    </Card>
  );
}

function FunilConversao() {
  const [etapas, setEtapas] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/funil-conversao-profissional")
      .then(d => setEtapas(d.etapas || []))
      .catch(e => setErro(e.message));
  }, []);

  if (erro) return <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, fontSize: 13 }}>{erro}</div>;
  if (etapas === null) return <div style={{ padding: 24, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>;
  if (!etapas.length || etapas[0].count === 0) return <Card><EmptyState title="Sem dado ainda" description="Nenhum profissional entrou no fluxo de cadastro ainda." /></Card>;

  const maxCount = etapas[0].count;

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {etapas.map((e, i) => (
          <div key={e.etapa}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray700 }}>{e.label}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.gray900 }}>
                {e.count}
                {e.taxa_perda_pct != null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, marginLeft: 8 }}>
                    −{e.taxa_perda_pct}% vs. etapa anterior
                  </span>
                )}
              </span>
            </div>
            <div style={{ background: COLORS.gray100, borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{ background: COLORS.blue, height: "100%", width: `${maxCount ? (e.count / maxCount) * 100 : 0}%`, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Relatorios() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Relatórios" subtitle="Exportação e funil de conversão" />

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Exportação</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <ExportCard titulo="Clientes" descricao="Nome, e-mail, WhatsApp, cidade e data de cadastro." path="/api/admin/export/clientes" nomeArquivo="clientes.csv" />
        <ExportCard titulo="Profissionais" descricao="Dados, categorias, aprovação e status de pagamento." path="/api/admin/export/profissionais" nomeArquivo="profissionais.csv" />
        <ExportCard titulo="Financeiro" descricao="Assinaturas ativas, plano, status e valor atual." path="/api/admin/export/financeiro" nomeArquivo="financeiro.csv" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, marginBottom: 10 }}>Funil de conversão do profissional</div>
      <FunilConversao />

      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.gray700, margin: "24px 0 10px" }}>Conciliação Asaas × extrato bancário</div>
      <Card>
        <EmptyState
          title="Ainda não construído"
          description="Existe conciliação Asaas × Supabase (rotina automática semanal, /api/admin/reconciliacao-assinaturas), mas não Asaas × extrato bancário de verdade — não há integração com o banco hoje, precisaria de upload manual de extrato (CSV/OFX) e lógica pra bater com os repasses da Asaas, que chegam em lote. Projeto à parte, ainda não decidido o formato."
        />
      </Card>
    </div>
  );
}
