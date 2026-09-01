import { useState } from "react";
import { COLORS } from "./ui";
import { useAlerts } from "./useAlerts";

const ROLE_LABEL = {
  administrador: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  atendimento: "Atendimento",
  operacao: "Operação",
};

// Estrutura obrigatória do MULTI Command Center (documento "COMANDO MASTER",
// seção 1) — 12 módulos, nessa ordem exata. "pronto: true" = já tem tela
// real com dado real; os outros mostram ComingSoon (App.jsx) até ganharem
// infra de verdade, em fases futuras aprovadas uma de cada vez.
export const NAV_ITEMS = [
  { id: "visao-geral", label: "Visão Geral", icon: "🏠", pronto: true },
  { id: "inbox", label: "Inbox", icon: "💬", pronto: false },
  { id: "vendas", label: "Vendas", icon: "💼", pronto: false },
  { id: "demandas", label: "Demandas", icon: "🏠", pronto: false },
  { id: "profissionais", label: "Profissionais", icon: "👷", pronto: true },
  { id: "clientes", label: "Clientes", icon: "👥", pronto: true },
  { id: "financeiro", label: "Financeiro", icon: "💰", pronto: false },
  { id: "marketing", label: "Marketing", icon: "📢", pronto: false },
  { id: "metas", label: "Metas & Performance", icon: "🎯", pronto: false },
  { id: "inteligencia", label: "Inteligência MULTI", icon: "🧠", pronto: false },
  { id: "relatorios", label: "Relatórios", icon: "📊", pronto: false },
];

function NavButton({ item, active, onClick }) {
  const isActive = active === item.id;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "none",
        background: isActive ? "#EFF4FF" : "transparent",
        color: isActive ? COLORS.blue : COLORS.gray700,
        fontWeight: isActive ? 800 : 600,
        fontSize: 14,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        opacity: item.pronto === false ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: 15 }}>{item.icon}</span>
      {item.label}
      {item.pronto === false && (
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, color: COLORS.gray400, border: `1px solid ${COLORS.gray200}`, borderRadius: 6, padding: "2px 5px" }}>
          EM BREVE
        </span>
      )}
    </button>
  );
}

function NotificationBell({ onSelectClient, onSelectProfessional, onUnauthorized }) {
  const [aberto, setAberto] = useState(false);
  const { carregando, tipos, contagem, itensDoTipo, total } = useAlerts(onUnauthorized);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{ position: "relative", border: "none", background: "transparent", cursor: "pointer", fontSize: 20, padding: 6 }}
        title="Notificações"
      >
        🔔
        {!carregando && total > 0 && (
          <span
            style={{
              position: "absolute", top: 0, right: 0, background: COLORS.red, color: "white",
              fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            }}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, maxHeight: 420, overflowY: "auto",
            background: "white", border: `1px solid ${COLORS.gray200}`, borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 20,
          }}
        >
          <div style={{ padding: "12px 16px", fontWeight: 800, fontSize: 13, borderBottom: `1px solid ${COLORS.gray100}` }}>Precisa de atenção</div>
          {carregando && <div style={{ padding: 16, fontSize: 13, color: COLORS.gray500 }}>Carregando...</div>}
          {!carregando &&
            tipos.map((t) => {
              const count = contagem(t.id);
              if (!count) return null;
              return (
                <div key={t.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${COLORS.gray100}` }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900, cursor: "pointer" }}
                    onClick={() => {
                      const item = itensDoTipo(t.id)[0];
                      if (!item) return;
                      setAberto(false);
                      if (t.id === "role_divergente" || t.id === "entrando_mensalidade") onSelectProfessional(item.email);
                      else if (item.cliente_email) onSelectClient(item.cliente_email);
                    }}
                  >
                    {t.emoji} {count} {t.label.toLowerCase()}
                  </div>
                </div>
              );
            })}
          {!carregando && !total && <div style={{ padding: 16, fontSize: 13, color: COLORS.gray500 }}>Nada precisando de atenção agora.</div>}
        </div>
      )}
    </div>
  );
}

function UserMenu({ identity, onLogout }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 999, background: COLORS.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
          {(identity?.nome || "?")[0].toUpperCase()}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray900, lineHeight: 1.2 }}>{identity?.nome || "—"}</div>
          <div style={{ fontSize: 11, color: COLORS.gray400, lineHeight: 1.2 }}>{ROLE_LABEL[identity?.role] || identity?.role || ""}</div>
        </div>
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", width: 200,
            background: "white", border: `1px solid ${COLORS.gray200}`, borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 20, overflow: "hidden",
          }}
        >
          {["Meu perfil", "Preferências"].map((label) => (
            <div key={label} style={{ padding: "10px 14px", fontSize: 13, color: COLORS.gray400, cursor: "default" }}>
              {label} <span style={{ fontSize: 10 }}>(em breve)</span>
            </div>
          ))}
          <button
            onClick={onLogout}
            style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 700, color: COLORS.red, border: "none", background: "white", borderTop: `1px solid ${COLORS.gray100}`, cursor: "pointer" }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

// Casca de navegação — Etapa 1-5 do MULTI Command Center (ver memória do
// projeto). Sidebar fixa (só logo+nav) + header global (busca, sino,
// usuário) — antes o bloco de identidade/Sair vivia no rodapé da sidebar,
// mudou pro header porque a estrutura obrigatória (seção 3 do documento)
// pede USUÁRIO ali. "Administrativo" (Equipe/Monetização) só aparece pra
// quem é administrador — mesmo gating de antes, só que agora é 1 item só
// (leva pra uma tela de escolha) em vez de 2 soltos na sidebar.
export default function Layout({ active, onNavigate, onLogout, identity, onSelectClient, onSelectProfessional, onGlobalSearch, onUnauthorized, children }) {
  const [busca, setBusca] = useState("");
  const isAdmin = identity?.role === "administrador";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: COLORS.bg }}>
      <aside
        style={{
          width: 232, flexShrink: 0, background: "white", borderRight: `1px solid ${COLORS.gray200}`,
          display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
        }}
      >
        <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${COLORS.blue},${COLORS.blueDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            🛠️
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: COLORS.gray900 }}>MULTI</div>
        </div>

        <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.id} item={item} active={active} onClick={() => onNavigate(item.id)} />
          ))}
          {isAdmin && (
            <NavButton item={{ id: "administrativo", label: "Administrativo", icon: "⚙️", pronto: true }} active={active} onClick={() => onNavigate("administrativo")} />
          )}
        </nav>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
        <header
          style={{
            height: 64, flexShrink: 0, background: "white", borderBottom: `1px solid ${COLORS.gray200}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16,
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (busca.trim()) onGlobalSearch(busca.trim());
            }}
            style={{ flex: 1, maxWidth: 420 }}
          >
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar na MULTI... (clientes, profissionais)"
              style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: `1px solid ${COLORS.gray200}`, fontSize: 13, boxSizing: "border-box", background: COLORS.gray50 }}
            />
          </form>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <NotificationBell onSelectClient={onSelectClient} onSelectProfessional={onSelectProfessional} onUnauthorized={onUnauthorized} />
            <UserMenu identity={identity} onLogout={onLogout} />
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
