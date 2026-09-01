import { useCallback, useState } from "react";
import { getToken, clearToken } from "./api";
import LoginScreen from "./LoginScreen";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";

// Máquina de telas simples (sem router — só 3 telas na Fase 1, mesmo
// espírito do App.jsx principal que também evita libs de rota).
export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
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

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  if (selectedEmail) {
    return (
      <ClientDetail
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onUnauthorized={handleUnauthorized}
      />
    );
  }

  return (
    <ClientList
      onSelectClient={setSelectedEmail}
      onUnauthorized={handleUnauthorized}
      onLogout={handleLogout}
    />
  );
}
