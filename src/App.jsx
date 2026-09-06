import { useCallback, useState } from "react";
import { getToken, getIdentity, clearToken } from "./api";
import LoginScreen from "./LoginScreen";
import Layout from "./Layout";
import Overview from "./Overview";
import ClientList from "./ClientList";
import ClientDetail from "./ClientDetail";
import ProfessionalList from "./ProfessionalList";
import ProfessionalDetail from "./ProfessionalDetail";
import TeamManagement from "./TeamManagement";
import MonetizationConfig from "./MonetizationConfig";
import AdminHome from "./AdminHome";
import ComingSoon from "./ComingSoon";
import Inbox from "./Inbox";
import Vendas from "./Vendas";
import Atendimentos from "./Atendimentos";
import Demandas from "./Demandas";
import Relatorios from "./Relatorios";
import Marketing from "./Marketing";
import Metas from "./Metas";
import Inteligencia from "./Inteligencia";

// Textos honestos pro que ainda não existe — nunca dado fictício, só a
// explicação do que falta (regra 35 do documento "COMANDO MASTER").
const EM_CONSTRUCAO = {
  // "inbox" saiu daqui em 2026-09-02 (handoff item 2) — a metade de Suporte
  // já é real (Inbox.jsx). 2026-09-03: a aba WhatsApp também saiu do
  // "honesto sobre o que falta" — Z-API integrada (server.js + Inbox.jsx),
  // a tela inteira agora é real.
  // "vendas" saiu daqui em 2026-09-02 (handoff item 3) — tabela
  // vendas_pipeline + Vendas.jsx já são reais.
  // "demandas" saiu daqui em 2026-09-02 (handoff item 4) — reescopeado:
  // NÃO é o pipeline de pedidos que o motivo antigo descrevia, é lista
  // pessoal de tarefas (Demandas.jsx + tabela demandas_pessoais).
  financeiro: { title: "Financeiro", subtitle: "Receitas, cobranças, inadimplência", motivo: "Monetização (Taxa de Acesso) já existe em Administrativo. Um dashboard financeiro completo (receita/mês/ano, recorrência, inadimplência agregada) ainda não foi construído." },
  // "marketing" saiu daqui em 2026-09-02 (handoff item 5, parcial) — só o
  // painel "Não Fecharam"+reengajamento por push é real (Marketing.jsx);
  // campanhas/UTM e templates continuam honestos sobre o que falta, mas
  // agora numa seção da tela, não bloqueando ela inteira.
  // "metas" saiu daqui em 2026-09-02 (handoff item 5) — tabela
  // metas_mensais + Metas.jsx já são reais.
  // "inteligencia" saiu daqui em 2026-09-02 (handoff item 5) — Vendas e
  // Marketing (o que faltava pra existir) já existem, Inteligencia.jsx já
  // é real.
  // "relatorios" saiu daqui em 2026-09-02 (handoff item 5, parcial) —
  // Exportação CSV + Funil de conversão do profissional já são reais
  // (Relatorios.jsx). Conciliação Asaas×extrato bancário continua honesta
  // sobre o que falta, mas agora só numa seção da tela, não bloqueando ela
  // inteira (mesmo padrão já usado no Marketing pra campanhas/UTM).
};

// Máquina de telas — MULTI Command Center, Etapa 1-5 (ver memória do
// projeto). Sem router: telas simples trocando por estado, mesmo padrão de
// sempre neste projeto.
export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [identity, setIdentity] = useState(() => getIdentity());
  const [screen, setScreen] = useState("visao-geral");
  const [selectedClientEmail, setSelectedClientEmail] = useState(null);
  const [selectedProfessionalEmail, setSelectedProfessionalEmail] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  // Fase 1 do diagnóstico de estrutura do CRM (2026-09-06) — StatTiles
  // clicáveis na Visão Geral abrem Profissionais já filtrado (ex: "Receita
  // recorrente" → pago). Mesmo padrão de globalSearchTerm acima.
  const [professionalFilterStatus, setProfessionalFilterStatus] = useState("");

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
    setSelectedClientEmail(null);
    setSelectedProfessionalEmail(null);
    setProfessionalFilterStatus(""); // navegação "limpa" pela sidebar não deve herdar filtro de um clique anterior na Visão Geral
  };

  const irParaCliente = (email) => {
    setScreen("clientes");
    setSelectedClientEmail(email);
  };
  const irParaProfissional = (email) => {
    setScreen("profissionais");
    setSelectedProfessionalEmail(email);
  };

  // Fase 1 do diagnóstico de estrutura do CRM (2026-09-06) — StatTile/card da
  // Visão Geral clicado abre Profissionais já filtrado por paymentStatus
  // ("pago" = Receita recorrente, "pagamento_pendente" = Dinheiro na mesa em
  // modo mensalidade). Mesma tela/endpoint de sempre, só chega com o filtro
  // já aplicado.
  const irParaProfissionaisComFiltro = (status) => {
    setScreen("profissionais");
    setSelectedProfessionalEmail(null);
    setProfessionalFilterStatus(status);
  };

  // Busca global (header) — Clientes/Profissionais é o que tem dado real
  // pesquisável hoje; Leads/Demandas/Conversas entram quando essas telas
  // existirem. Vai direto pra Clientes com o termo já preenchido.
  const handleGlobalSearch = (termo) => {
    setGlobalSearchTerm(termo);
    setSearchKey((k) => k + 1);
    setScreen("clientes");
    setSelectedClientEmail(null);
  };

  if (!authed) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  const comingSoon = EM_CONSTRUCAO[screen];

  return (
    <Layout
      active={screen}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      identity={identity}
      onSelectClient={irParaCliente}
      onSelectProfessional={irParaProfissional}
      onGlobalSearch={handleGlobalSearch}
      onUnauthorized={handleUnauthorized}
    >
      {screen === "visao-geral" && (
        <Overview
          onSelectClient={irParaCliente}
          onSelectProfessional={irParaProfissional}
          onUnauthorized={handleUnauthorized}
          onNavigate={handleNavigate}
          onFilterProfessionals={irParaProfissionaisComFiltro}
        />
      )}

      {screen === "inbox" && <Inbox onUnauthorized={handleUnauthorized} />}

      {screen === "vendas" && <Vendas onUnauthorized={handleUnauthorized} />}

      {screen === "atendimentos" && <Atendimentos onUnauthorized={handleUnauthorized} />}

      {screen === "demandas" && <Demandas onUnauthorized={handleUnauthorized} />}

      {screen === "relatorios" && <Relatorios />}

      {screen === "marketing" && <Marketing />}

      {screen === "metas" && <Metas />}

      {screen === "inteligencia" && <Inteligencia onUnauthorized={handleUnauthorized} />}

      {screen === "clientes" &&
        (selectedClientEmail ? (
          <ClientDetail email={selectedClientEmail} onBack={() => setSelectedClientEmail(null)} onUnauthorized={handleUnauthorized} />
        ) : (
          <ClientList key={searchKey} onSelectClient={setSelectedClientEmail} onUnauthorized={handleUnauthorized} initialBusca={globalSearchTerm} />
        ))}

      {screen === "profissionais" &&
        (selectedProfessionalEmail ? (
          <ProfessionalDetail
            email={selectedProfessionalEmail}
            onBack={() => setSelectedProfessionalEmail(null)}
            onUnauthorized={handleUnauthorized}
          />
        ) : (
          <ProfessionalList onSelectProfessional={setSelectedProfessionalEmail} onUnauthorized={handleUnauthorized} initialFiltroStatus={professionalFilterStatus} />
        ))}

      {screen === "administrativo" && <AdminHome onNavigate={setScreen} />}
      {screen === "equipe" && <TeamManagement onUnauthorized={handleUnauthorized} />}
      {screen === "monetizacao" && <MonetizationConfig onUnauthorized={handleUnauthorized} />}

      {comingSoon && <ComingSoon title={comingSoon.title} subtitle={comingSoon.subtitle} motivo={comingSoon.motivo} />}
    </Layout>
  );
}
