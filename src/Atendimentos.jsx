import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { PageHeader, Card, Badge, EmptyState, COLORS } from "./ui";

// Especificação "Fila de Demandas de Clientes + Triagem do WhatsApp"
// (2026-09-03), Fase 3. Lista demandas_clientes com fila='demanda' — pedidos
// de serviço triados manualmente a partir de uma conversa do WhatsApp (ver
// Inbox.jsx "Mover para fila"). Vendas e Suporte reaproveitam a mesma
// conversa filtrada por fila em vez de uma tela dedicada (ver Inbox.jsx).
// Nada a ver com "Demandas" no menu (Demandas.jsx) — aquela é lista pessoal
// de tarefas da equipe, sem relação com clientes.
//
// 2026-09-06: feature "Match automático de Demanda x Profissional" (sessão
// separada da Fase 4) — cruza a demanda com "usuarios" (profissional
// aprovado de verdade) E "profissionais_externos" (contato manual da
// equipe, sem cadastro, ver supabase_profissionais_externos_migration.sql).
// Adiciona busca manual (categoria/cidade livres, mesmo padrão de campo
// livre já usado no "Mover para fila" do Inbox.jsx — sem dropdown das 157
// categorias, decisão já tomada lá) e o botão "Marcar como repassado"
// (supabase_demandas_repasses_migration.sql), só rastreabilidade, sem
// status de aceite/recusa nesta fase.

const STATUS_TONE = { aberta: "red", em_andamento: "amber", resolvida: "green", cancelada: "gray" };
const STATUS_LABEL = { aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida", cancelada: "Cancelada" };

function tempoEmAberto(criadoEm) {
  const ms = Date.now() - new Date(criadoEm).getTime();
  const horas = Math.floor(ms / 36e5);
  if (horas < 1) return "menos de 1h";
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

function formatarTelefone(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return d;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

// usuarios.whatsapp já vem mascarado ("(48) 99990-4988"); profissionais_
// externos.telefone vem só dígitos, sem DDI (ver migration) — formata só
// esse segundo caso, deixa o resto como está.
function formatarWhatsappProfissional(w) {
  const raw = String(w || "");
  const d = raw.replace(/\D/g, "");
  if (d !== raw || (d.length !== 10 && d.length !== 11)) return raw;
  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  return `(${ddd}) ${numero.length === 9 ? `${numero.slice(0, 5)}-${numero.slice(5)}` : `${numero.slice(0, 4)}-${numero.slice(4)}`}`;
}

// Uma linha de profissional (sugerido ou achado na busca manual) — mesmo
// visual e mesma ação "repassar" nos dois casos, só muda de onde a lista
// veio. onRepassado deixa quem chama (a lista) atualizar o estado local sem
// precisar recarregar a busca inteira.
function ProfissionalRow({ p, demandaId, onUnauthorized, onRepassado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const repassar = async () => {
    setEnviando(true);
    setErro("");
    try {
      await adminFetch(`/api/admin/demandas/${demandaId}/repasses`, {
        method: "POST",
        body: JSON.stringify({ fonte: p.fonte, id: p.id, nome: p.nome, whatsapp: p.whatsapp }),
      });
      onRepassado();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          {p.nome || p.id}
          {p.fonte === "externo" && <Badge tone="gray">planilha</Badge>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.gray500 }}>{p.cidade || "cidade não informada"} · {(p.categorias || []).join(", ") || "sem categoria"}</div>
        {erro && <div style={{ fontSize: 11, color: COLORS.red, marginTop: 2 }}>{erro}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, color: COLORS.gray700, fontWeight: 700 }}>{formatarWhatsappProfissional(p.whatsapp) || p.id}</div>
        {p.repasse ? (
          <Badge tone="green">Repassado</Badge>
        ) : (
          <button onClick={repassar} disabled={enviando} style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: enviando ? "default" : "pointer", opacity: enviando ? 0.6 : 1 }}>
            {enviando ? "..." : "Repassar"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfissionaisSugeridos({ demandaId, onUnauthorized }) {
  const [profissionais, setProfissionais] = useState(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  const carregar = () => {
    adminFetch(`/api/admin/demandas/${demandaId}/profissionais-sugeridos`)
      .then(d => { setProfissionais(d.profissionais || []); setAviso(d.aviso || ""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErro(e.message); });
  };

  useEffect(carregar, [demandaId]);

  if (erro) return <div style={{ color: COLORS.red, fontSize: 12 }}>{erro}</div>;
  if (profissionais === null) return <div style={{ fontSize: 12, color: COLORS.gray500 }}>Buscando profissionais...</div>;
  if (aviso) return <div style={{ fontSize: 12, color: COLORS.gray500, fontStyle: "italic" }}>{aviso}</div>;
  if (!profissionais.length) return <div style={{ fontSize: 12, color: COLORS.gray500 }}>Nenhum profissional compatível com essa região/categoria ainda — tente a busca manual abaixo.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {profissionais.map(p => (
        <ProfissionalRow key={`${p.fonte}:${p.id}`} p={p} demandaId={demandaId} onUnauthorized={onUnauthorized} onRepassado={carregar} />
      ))}
    </div>
  );
}

// Busca manual (item 2b) — pra quando a sugestão automática não tem ninguém
// bom ou a pessoa quer ver outras opções. Campos livres (mesmo padrão do
// "Mover para fila" em Inbox.jsx — sem dropdown das 157 categorias).
function BuscaManualProfissionais({ demandaId, onUnauthorized }) {
  const [categoria, setCategoria] = useState("");
  const [cidade, setCidade] = useState("");
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const buscar = async (e) => {
    e.preventDefault();
    if (!categoria.trim() && !cidade.trim()) { setErro("Informe categoria ou cidade pra buscar."); return; }
    setBuscando(true);
    setErro("");
    try {
      const params = new URLSearchParams();
      if (categoria.trim()) params.set("categoria", categoria.trim());
      if (cidade.trim()) params.set("cidade", cidade.trim());
      params.set("demandaId", demandaId);
      const d = await adminFetch(`/api/admin/profissionais-busca?${params.toString()}`);
      setResultado(d.profissionais || []);
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
      setErro(e.message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div>
      <form onSubmit={buscar} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          placeholder="Categoria (ex: montador_de_moveis)"
          style={{ flex: "1 1 180px", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 12 }}
        />
        <input
          value={cidade}
          onChange={e => setCidade(e.target.value)}
          placeholder="Cidade"
          style={{ flex: "1 1 140px", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.gray200}`, fontSize: 12 }}
        />
        <button type="submit" disabled={buscando} style={{ background: COLORS.gray900, color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: 12, cursor: buscando ? "default" : "pointer", opacity: buscando ? 0.6 : 1 }}>
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {erro && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 8 }}>{erro}</div>}
      {resultado !== null && (
        resultado.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.gray500 }}>Nenhum profissional encontrado com esse filtro.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {resultado.map(p => (
              <ProfissionalRow key={`${p.fonte}:${p.id}`} p={p} demandaId={demandaId} onUnauthorized={onUnauthorized} onRepassado={buscar} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function DemandaCard({ demanda, onUnauthorized, onMudou }) {
  const [expandido, setExpandido] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const mudarStatus = async (status) => {
    setAtualizando(true);
    try {
      await adminFetch(`/api/admin/demandas/${demanda.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      onMudou();
    } catch (e) {
      if (e.unauthorized) return onUnauthorized?.();
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, cursor: "pointer" }} onClick={() => setExpandido(v => !v)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{demanda.nome_cliente || formatarTelefone(demanda.telefone_cliente) || "Sem nome"}</span>
            <Badge tone={STATUS_TONE[demanda.status]}>{STATUS_LABEL[demanda.status]}</Badge>
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray500 }}>
            {demanda.regiao || "região não informada"} · {demanda.categoria_servico || "categoria não informada"} · em aberto há {tempoEmAberto(demanda.criado_em)}
          </div>
          {demanda.descricao && <div style={{ fontSize: 13, color: COLORS.gray700, marginTop: 8 }}>{demanda.descricao}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {demanda.status === "aberta" && (
            <button onClick={() => mudarStatus("em_andamento")} disabled={atualizando} style={{ background: COLORS.amberBg, color: COLORS.amber, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Assumir
            </button>
          )}
          {demanda.status === "em_andamento" && (
            <button onClick={() => mudarStatus("resolvida")} disabled={atualizando} style={{ background: COLORS.greenBg, color: COLORS.green, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Marcar resolvida
            </button>
          )}
        </div>
      </div>
      {expandido && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.gray200}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray700, marginBottom: 8 }}>Profissionais sugeridos</div>
          <ProfissionaisSugeridos demandaId={demanda.id} onUnauthorized={onUnauthorized} />
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.gray700, margin: "16px 0 8px" }}>Busca manual</div>
          <BuscaManualProfissionais demandaId={demanda.id} onUnauthorized={onUnauthorized} />
        </div>
      )}
    </Card>
  );
}

export default function Atendimentos({ onUnauthorized }) {
  const [demandas, setDemandas] = useState(null);
  const [filtro, setFiltro] = useState("aberta");
  const [erro, setErro] = useState("");

  const carregar = () => {
    const qs = filtro === "todos" ? "" : `&status=${filtro}`;
    adminFetch(`/api/admin/demandas?fila=demanda${qs}`)
      .then(d => { setDemandas(d.demandas || []); setErro(""); })
      .catch(e => { if (e.unauthorized) return onUnauthorized?.(); setErro(e.message); });
  };

  useEffect(carregar, [filtro]);

  return (
    <div style={{ padding: "24px 28px" }}>
      <PageHeader title="Atendimentos" subtitle="Pedidos de serviço triados a partir do WhatsApp (Caixa de Entrada → Mover para fila)" />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["aberta", "em_andamento", "resolvida", "cancelada", "todos"].map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            style={{
              padding: "6px 12px", borderRadius: 999,
              border: `1px solid ${filtro === s ? COLORS.blue : COLORS.gray200}`,
              background: filtro === s ? COLORS.blue : "white",
              color: filtro === s ? "white" : COLORS.gray700,
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            {s === "todos" ? "Todos" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {erro && <div style={{ background: COLORS.redBg, color: COLORS.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{erro}</div>}

      {demandas === null ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.gray500 }}>Carregando...</div>
      ) : demandas.length === 0 ? (
        <Card><EmptyState title="Nenhum atendimento" description="Nenhuma demanda de cliente nessa situação. Mova uma conversa do WhatsApp pra fila 'Demanda' na Caixa de Entrada pra começar." /></Card>
      ) : (
        demandas.map(d => <DemandaCard key={d.id} demanda={d} onUnauthorized={onUnauthorized} onMudou={carregar} />)
      )}
    </div>
  );
}
