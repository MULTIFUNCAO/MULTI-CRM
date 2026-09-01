import { useCallback, useState } from "react";
import { getToken, clearToken } from "./api";
import LoginScreen from "./LoginScreen";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";
import ProfessionalList from "./ProfessionalList";
import ProfessionalDetail from "./ProfessionalDetail";

// Máquina de telas simples (sem router). Fase 3 adiciona "profissionais"
// ao lado de "clientes" — mesmo padrão de seleção (lista -> ficha) pras
// duas seções.
export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [screen, setScreen] = useState("dashboard"); // "dashboard" | "clientes" | "profissionais"
  const [selectedClientEmail, setSelectedClientEmail] = useState(null);
  const [selectedProfessionalEmail, setSelectedProfessionalEmail] = useState(null);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    setAuthed(false);
    setSelectedClientEmail(null);
    setSelectedProfessionalEmail(null);
  }, []);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setSelectedClientEmail(null);
    setSelectedProfessionalEmail(null);
  };

  const handleNavigate = (next) => {
    setScreen(next);
    setSelectedClientEmail(null); // sair da ficha ao trocar de seção pelo menu
    setSelectedProfessionalEmail(null);
  };

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Layout active={screen} onNavigate={handleNavigate} onLogout={handleLogout}>
      {screen === "dashboard" && <Dashboard onUnauthorized={handleUnauthorized} />}

      {screen === "clientes" &&
        (selectedClientEmail ? (
          <ClientDetail email={selectedClientEmail} onBack={() => setSelectedClientEmail(null)} onUnauthorized={handleUnauthorized} />
        ) : (
          <ClientList onSelectClient={setSelectedClientEmail} onUnauthorized={handleUnauthorized} />
        ))}

      {screen === "profissionais" &&
        (selectedProfessionalEmail ? (
          <ProfessionalDetail
            email={selectedProfessionalEmail}
            onBack={() => setSelectedProfessionalEmail(null)}
            onUnauthorized={handleUnauthorized}
          />
        ) : (
          <ProfessionalList onSelectProfessional={setSelectedProfessionalEmail} onUnauthorized={handleUnauthorized} />
        ))}
    </Layout>
  );
}
