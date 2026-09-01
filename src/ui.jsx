// Design system mínimo — MULTI Command Center, Etapa 3 do plano aprovado.
// Extrai os padrões visuais que já se repetiam em Dashboard/OperationsCenter/
// ClientList/ProfessionalList (cor, raio, espaçamento) pra um lugar só, e é
// o que as peças NOVAS desta etapa (Layout, Overview, ComingSoon) usam.
// Não é retrofit das telas já em produção — Clientes/Profissionais/Equipe/
// Monetização continuam com o estilo próprio delas por enquanto, pra não
// arriscar quebrar o que já está testado e no ar. Consolidar todo o app
// nesse kit é trabalho de limpeza pra uma fase futura, não desta.

export const COLORS = {
  blue: "#0066FF",
  blueDark: "#0055d4",
  green: "#059669",
  greenBg: "#ECFDF5",
  amber: "#B45309",
  amberBg: "#FFFBEB",
  red: "#DC2626",
  redBg: "#FEF2F2",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  gray900: "#111827",
  gray700: "#374151",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  bg: "#F8F9FA",
};

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: COLORS.gray900 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: COLORS.gray500, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "white", border: `1px solid ${COLORS.gray200}`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function StatTile({ label, value, icon, sub }) {
  return (
    <Card style={{ padding: 18, flex: "1 1 180px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{ fontSize: 12, color: COLORS.gray500, fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.gray900 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

const BADGE_TONES = {
  green: { bg: COLORS.greenBg, fg: COLORS.green },
  amber: { bg: COLORS.amberBg, fg: COLORS.amber },
  red: { bg: COLORS.redBg, fg: COLORS.red },
  purple: { bg: COLORS.purpleBg, fg: COLORS.purple },
  gray: { bg: COLORS.gray100, fg: COLORS.gray500 },
};

export function Badge({ tone = "gray", children }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.gray;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// Estado "sem dado ainda" honesto — usado tanto pros módulos "Em construção"
// (seção sem nenhuma infra ainda, seções 6/10/15/16/22/24/25/26/29/37 do
// documento) quanto por blocos dentro de telas que existem mas não têm
// dado no momento (ex: Meta, sem config ainda). Nunca mostra número
// inventado — regra 35 do documento ("zero dados fictícios").
export function EmptyState({ title, description }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: COLORS.gray500 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.gray700, marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, maxWidth: 420, margin: "0 auto" }}>{description}</div>}
    </div>
  );
}
