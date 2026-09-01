import { useCallback, useState } from "react";
import { getToken, clearToken } from "./api";
import LoginScreen from "./LoginScreen";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";

// Máquina de telas simples (sem router — Fase 2 adiciona Dashboard como
// home, mas ainda são poucas telas pra justificar uma lib de rota).
export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [screen, setScreen] = useState("dashboard"); // "dashboard" | "clientes"
  const [selectedEmail, setSelectedEmail] = useState(null);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    setAuthed(false);
    setSelectedEmail(null);
  }, []);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setSelectedEmail(null);
  };

  const handleNavigate = (next) => {
    setScreen(next);
    setSelectedEmail(null); // sair da ficha ao trocar de seção pelo menu
  };

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Layout active={screen} onNavigate={handleNavigate} onLogout={handleLogout}>
      {screen === "dashboard" && <Dashboard onUnauthorized={handleUnauthorized} />}

      {screen === "clientes" &&
        (selectedEmail ? (
          <ClientDetail email={selectedEmail} onBack={() => setSelectedEmail(null)} onUnauthorized={handleUnauthorized} />
        ) : (
          <ClientList onSelectClient={setSelectedEmail} onUnauthorized={handleUnauthorized} />
        ))}
    </Layout>
  );
}
