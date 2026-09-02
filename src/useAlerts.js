import { useEffect, useState } from "react";
import { adminFetch } from "./api";

// Fonte única dos alertas "Precisa de Atenção" — usada pelo sino do Header
// E pelo bloco da Visão Geral (Etapa 4), pra não duplicar a mesma lógica de
// busca/derivação em dois lugares. Mesmos 7 tipos que já existiam em
// OperationsCenter.jsx (Fase 4) — nenhum dado novo, só reorganizado aqui
// pra virar reaproveitável. Todo número vem do backend, nada calculado do
// zero no frontend além de filtro simples.
const TIPOS = [
  { id: "sem_proposta", label: "Sem proposta", emoji: "🔴", cor: "#DC2626" },
  { id: "proposta_sem_resposta", label: "Proposta sem resposta", emoji: "🟠", cor: "#F59E0B" },
  { id: "parado_pos_aceite", label: "Parado pós-aceite", emoji: "🟣", cor: "#7C3AED" },
  { id: "clientes_reativaveis", label: "Clientes reativáveis", emoji: "🔄", cor: "#0EA5E9" },
  { id: "role_divergente", label: "Profissional preso (role)", emoji: "⚠️", cor: "#B45309" },
  { id: "entrando_mensalidade", label: "Entrando na mensalidade", emoji: "🔔", cor: "#7C3AED" },
];
export { TIPOS as TIPOS_ALERTA };

export function useAlerts(onUnauthorized) {
  const [oportunidades, setOportunidades] = useState(null);
  const [divergentes, setDivergentes] = useState(null);
  const [profissionais, setProfissionais] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleErr = (err) => {
      if (err.unauthorized) return onUnauthorized?.();
      setError(err.message);
    };
    adminFetch("/api/admin/oportunidades").then(setOportunidades).catch(handleErr);
    adminFetch("/api/admin/professionals?status=role_divergente")
      .then((d) => setDivergentes(d.professionals || []))
      .catch(handleErr);
    adminFetch("/api/admin/professionals")
      .then((d) => setProfissionais(d.professionals || []))
      .catch(handleErr);
  }, [onUnauthorized]);

  const carregando = !oportunidades || !divergentes || !profissionais;
  const entrandoNaMensalidade = (profissionais || []).filter((p) => p.ciclo_financeiro?.status === "promocao_terminando");

  const contagem = (tipoId) => {
    if (carregando) return null;
    if (tipoId === "clientes_reativaveis") return oportunidades.resumo.clientes_reativaveis.count;
    if (tipoId === "role_divergente") return divergentes.length;
    if (tipoId === "entrando_mensalidade") return entrandoNaMensalidade.length;
    return oportunidades.resumo[tipoId]?.count ?? 0;
  };

  const itensDoTipo = (tipoId) => {
    if (!oportunidades) return [];
    if (tipoId === "clientes_reativaveis") return oportunidades.reativaveis || [];
    if (tipoId === "role_divergente") return divergentes || [];
    if (tipoId === "entrando_mensalidade") return entrandoNaMensalidade;
    return (oportunidades.itens || []).filter((i) => i.tipo === tipoId);
  };

  const total = carregando ? null : TIPOS.reduce((s, t) => s + (contagem(t.id) || 0), 0);
  const dinheiroNaMesa = oportunidades?.resumo?.dinheiro_na_mesa;
  // "modo" decide o texto do card (Correção do modelo financeiro, MULTI-CRM,
  // 2026-09-01) — "servico" só volta a fazer sentido quando o modelo de
  // comissão for ligado (config_monetizacao.comissao_ativa); até lá o
  // backend já manda "mensalidade" e o valor calculado certo pra isso.
  const dinheiroNaMesaModo = oportunidades?.resumo?.dinheiro_na_mesa_modo || "mensalidade";
  const dinheiroNaMesaQtd = oportunidades?.resumo?.dinheiro_na_mesa_mensalidade_qtd;

  return { carregando, error, tipos: TIPOS, contagem, itensDoTipo, total, dinheiroNaMesa, dinheiroNaMesaModo, dinheiroNaMesaQtd };
}
