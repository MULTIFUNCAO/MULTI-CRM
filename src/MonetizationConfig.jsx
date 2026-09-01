import { useEffect, useState } from "react";
import { adminFetch } from "./api";

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 };

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// Configurações → Monetização — correção do modelo financeiro real. Só
// administrador chega aqui (Layout esconde o nav; o backend recusa PATCH
// com 403 de qualquer jeito). Hoje só o plano "acesso" (Taxa de Acesso)
// lê esses valores — os outros planos (autonomo/pro/premium/empresa*)
// continuam com valor fixo, não configurável por aqui.
export default function MonetizationConfig({ onUnauthorized }) {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const carregar = () => {
    adminFetch("/api/admin/config-monetizacao")
      .then((d) => {
        setConfig(d.config);
        setForm(d.config);
      })
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  };

  useEffect(carregar, [onUnauthorized]);

  const handleChange = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setSalvo(false);
    setError("");
    try {
      const payload = {
        modelo_cobranca: form.modelo_cobranca,
        valor_entrada: Number(form.valor_entrada),
        duracao_promocao_meses: Number(form.duracao_promocao_meses),
        valor_pos_promocao: Number(form.valor_pos_promocao),
        comissao_ativa: !!form.comissao_ativa,
        comissao_percentual: Number(form.comissao_percentual),
        comissao_base: form.comissao_base,
      };
      const { config: atualizado } = await adminFetch("/api/admin/config-monetizacao", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setConfig(atualizado);
      setForm(atualizado);
      setSalvo(true);
    } catch (err) {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Configurações → Monetização</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
          Valores da Taxa de Acesso — muda aqui, sem precisar mexer em código
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>{error}</div>
      )}

      {!form && !error && <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>}

      {form && (
        <form
          onSubmit={handleSubmit}
          style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, maxWidth: 640, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <Field label="Modelo de cobrança">
            <select style={inputStyle} value={form.modelo_cobranca} onChange={(e) => handleChange("modelo_cobranca", e.target.value)}>
              <option value="mensalidade">Mensalidade</option>
              <option value="comissao">Comissão</option>
              <option value="mensalidade_comissao">Mensalidade + Comissão</option>
            </select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <Field label="Valor de entrada (R$/mês)" hint="Cobrado durante o período promocional">
              <input type="number" step="0.01" min="0.01" required style={inputStyle} value={form.valor_entrada} onChange={(e) => handleChange("valor_entrada", e.target.value)} />
            </Field>
            <Field label="Duração da promoção (meses)">
              <input type="number" step="1" min="1" required style={inputStyle} value={form.duracao_promocao_meses} onChange={(e) => handleChange("duracao_promocao_meses", e.target.value)} />
            </Field>
            <Field label="Valor após promoção (R$/mês)" hint="Mensalidade normal, recorrente">
              <input type="number" step="0.01" min="0.01" required style={inputStyle} value={form.valor_pos_promocao} onChange={(e) => handleChange("valor_pos_promocao", e.target.value)} />
            </Field>
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.comissao_ativa} onChange={(e) => handleChange("comissao_ativa", e.target.checked)} />
              Comissão sobre serviço fechado ativa
            </label>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0 26px" }}>
              Hoje fica desativada por decisão de negócio — o percentual abaixo fica guardado mesmo desligada, pronto pra ativar no futuro sem mexer em código.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 14 }}>
              <Field label="Percentual de comissão (%)">
                <input type="number" step="0.1" min="0" style={inputStyle} value={form.comissao_percentual} onChange={(e) => handleChange("comissao_percentual", e.target.value)} />
              </Field>
              <Field label="Base de cálculo">
                <select style={inputStyle} value={form.comissao_base} onChange={(e) => handleChange("comissao_base", e.target.value)}>
                  <option value="orcamento">Sobre orçamento</option>
                  <option value="servico_fechado">Sobre serviço fechado</option>
                  <option value="valor_recebido">Sobre valor recebido</option>
                </select>
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="submit"
              disabled={salvando}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: "#0066FF", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            {salvo && <span style={{ color: "#059669", fontSize: 13, fontWeight: 700 }}>✓ Salvo</span>}
          </div>

          {config?.updated_at && (
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
              Última atualização: {new Date(config.updated_at).toLocaleString("pt-BR")}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
