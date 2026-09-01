import { PageHeader, Card, COLORS } from "./ui";

const ITENS = [
  { id: "equipe", label: "Equipe", icon: "🔑", desc: "Cadastrar, editar papel e ativar/desativar pessoas com acesso ao CRM." },
  { id: "monetizacao", label: "Monetização", icon: "💵", desc: "Valores e duração da promoção da Taxa de Acesso, modelo de cobrança e comissão." },
];

// Landing de "Administrativo" (seção 27 do documento) — agrupa Equipe e
// Monetização (Fase 4 e correção do modelo financeiro), que já existiam
// como itens soltos na sidebar antiga. O resto da seção 27 (Usuários,
// Permissões, Planos, Promoções, Comissões, Metas, Funis, Automações,
// Tags, Integrações, Auditoria...) ainda não tem nada por trás — não
// listado aqui de propósito, pra não virar uma parede de links mortos.
// Entram um de cada vez, conforme cada peça for construída de verdade.
export default function AdminHome({ onNavigate }) {
  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Administrativo" subtitle="Área restrita — só administrador" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {ITENS.map((item) => (
          <Card
            key={item.id}
            style={{ cursor: "pointer" }}
          >
            <div onClick={() => onNavigate(item.id)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.gray900, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: COLORS.gray500 }}>{item.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
