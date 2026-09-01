import { useCallback, useState } from "react";
import { getToken, getIdentity, clearToken } from "./api";
import LoginScreen from "./LoginScreen";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import OperationsCenter from "./OperationsCenter";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";
import ProfessionalList from "./ProfessionalList";
import ProfessionalDetail from "./ProfessionalDetail";
import TeamManagement from "./TeamManagement";

// Máquina de telas simples (sem router). Fase 4 adiciona "operacoes"
// (Central de Operações) e "equipe" (Gestão de Equipe, só administrador —
// Layout já esconde o item de nav pro resto, mas a tela também navega pra
// lá se alguém tentar via estado direto, então o backend que barra de
// verdade com 403).
export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [identity, setIdentity] = useState(() => getIdentity());
  const [screen, setScreen] = useState("dashboard"); // dashboard | operacoes | clientes | profissionais | equipe
  const [selectedClientEmail, setSelectedClientEmail] = useState(null);
  const [selectedProfessionalEmail, setSelectedProfessionalEmail] = useState(null);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    setAuthed(false);
    setIdentity(null);
    setSelectedClientEmail(null);
    setSelectedProfessionalEmail(null);
  }, []);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setIdentity(null);
    setSelectedClientEmail(null);
    setSelectedProfessionalEmail(null);
  };

  const handleLoginSuccess = () => {
    setIdentity(getIdentity());
    setAuthed(true);
  };

  const handleNavigate = (next) => {
    setScreen(next);
    setSelectedClientEmail(null); // sair da ficha ao trocar de seção pelo menu
    setSelectedProfessionalEmail(null);
  };

  // Central de Operações manda direto pra ficha de cliente/profissional,
  // trocando de seção — não é filho de "clientes"/"profissionais" na
  // navegação, então precisa setar os dois (seção + seleção) junto.
  const irParaCliente = (email) => {
    setScreen("clientes");
    setSelectedClientEmail(email);
  };
  const irParaProfissional = (email) => {
    setScreen("profissionais");
    setSelectedProfessionalEmail(email);
  };

  if (!authed) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout active={screen} onNavigate={handleNavigate} onLogout={handleLogout} identity={identity}>
      {screen === "dashboard" && <Dashboard onUnauthorized={handleUnauthorized} />}

      {screen === "operacoes" && (
        <OperationsCenter onSelectClient={irParaCliente} onSelectProfessional={irParaProfissional} onUnauthorized={handleUnauthorized} />
      )}

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

      {screen === "equipe" && <TeamManagement onUnauthorized={handleUnauthorized} />}
    </Layout>
  );
}
