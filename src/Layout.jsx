const BLUE = "#0066FF";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "profissionais", label: "Profissionais", icon: "🛠️" },
];

// Casca de navegação compartilhada por todas as telas autenticadas (Fase 2
// — antes só existia a Lista de Clientes, sem chrome nenhum). Sidebar fixa
// à esquerda, conteúdo rola independente. "Clientes" fica destacado tanto
// na lista quanto na ficha do cliente (é a mesma seção, só um nível a mais).
export default function Layout({ active, onNavigate, onLogout, children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F8F9FA" }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "white",
          borderRight: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `linear-gradient(135deg,${BLUE},#0055d4)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🛠️
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>MULTI CRM</div>
        </div>

        <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: isActive ? "#EFF4FF" : "transparent",
                  color: isActive ? BLUE : "#4B5563",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "white",
              color: "#374151",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>{children}</main>
    </div>
  );
}
