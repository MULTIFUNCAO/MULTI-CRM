import { PageHeader, Card, EmptyState } from "./ui";

// Placeholder honesto pros módulos que a estrutura obrigatória do MULTI
// Command Center exige na sidebar, mas que ainda não têm infra/dado real
// (Inbox/WhatsApp, Vendas/Leads, Demandas como pipeline dedicado, Marketing,
// Metas, Inteligência MULTI, Relatórios). Aparecem no menu — decisão
// confirmada — mas nunca fingem ter dado. Cada um lista, com transparência,
// o que falta pra existir de verdade, pra não virar "acho que já tem isso"
// pra ninguém da equipe.
export default function ComingSoon({ title, subtitle, motivo }) {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <EmptyState title="Ainda não construído" description={motivo} />
      </Card>
    </div>
  );
}
