import { useEffect, useState } from "react";
import { adminFetch } from "./api";

const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "vendedor", label: "Vendedor" },
  { value: "atendimento", label: "Atendimento" },
  { value: "operacao", label: "Operação" },
];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};

// Gestão de Equipe — Fase 4. Só chega aqui quem é "administrador" (Layout
// esconde o item de nav pro resto, e o backend recusa com 403 de qualquer
// jeito — a UI aqui é conveniência, não a barreira de segurança real).
export default function TeamManagement({ onUnauthorized }) {
  const [equipe, setEquipe] = useState(null);
  const [error, setError] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", senha: "", role: "vendedor" });
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState("");

  const carregar = () => {
    adminFetch("/api/admin/equipe")
      .then((d) => setEquipe(d.equipe || []))
      .catch((err) => {
        if (err.unauthorized) return onUnauthorized();
        setError(err.message);
      });
  };

  useEffect(carregar, [onUnauthorized]);

  const handleCriar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setFormErro("");
    try {
      await adminFetch("/api/admin/equipe", { method: "POST", body: JSON.stringify(novo) });
      setNovo({ nome: "", email: "", senha: "", role: "vendedor" });
      setFormAberto(false);
      carregar();
    } catch (err) {
      if (err.unauthorized) return onUnauthorized();
      setFormErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (pessoa) => {
    try {
      await adminFetch("/api/admin/equipe/" + pessoa.id, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !pessoa.ativo }),
      });
      carregar();
    } catch (err) {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    }
  };

  const trocarRole = async (pessoa, role) => {
    try {
      await adminFetch("/api/admin/equipe/" + pessoa.id, { method: "PATCH", body: JSON.stringify({ role }) });
      carregar();
    } catch (err) {
      if (err.unauthorized) return onUnauthorized();
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: "#111827" }}>Gestão de Equipe</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
            {equipe ? `${equipe.length} pessoa(s) com acesso ao CRM` : "Carregando..."}
          </p>
        </div>
        <button
          onClick={() => setFormAberto((v) => !v)}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#0066FF",
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {formAberto ? "Cancelar" : "+ Nova pessoa"}
        </button>
      </div>

      {formAberto && (
        <form
          onSubmit={handleCriar}
          style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 20, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Nome</label>
            <input required style={inputStyle} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>E-mail</label>
            <input required type="email" style={inputStyle} value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Senha inicial</label>
            <input required type="text" minLength={8} style={inputStyle} value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} placeholder="mín. 8 caracteres" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Papel</label>
            <select style={inputStyle} value={novo.role} onChange={(e) => setNovo({ ...novo, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={salvando}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#059669", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {salvando ? "Salvando..." : "Criar acesso"}
            </button>
            {formErro && <span style={{ color: "#DC2626", fontSize: 13 }}>{formErro}</span>}
          </div>
        </form>
      )}

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", padding: 14, borderRadius: 12, marginBottom: 16 }}>{error}</div>
      )}

      {!equipe && !error && <div style={{ color: "#6B7280", padding: 24, textAlign: "center" }}>Carregando...</div>}

      {equipe && (
        <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                  {["Nome", "E-mail", "Papel", "Desde", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipe.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{p.nome}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{p.email}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <select value={p.role} onChange={(e) => trocarRole(p, e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 10px" }}>
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", whiteSpace: "nowrap" }}>{formatDateTime(p.created_at)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: p.ativo ? "#ECFDF5" : "#F3F4F6",
                          color: p.ativo ? "#059669" : "#6B7280",
                        }}
                      >
                        {p.ativo ? "Ativo" : "Desativado"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => alternarAtivo(p)}
                        style={{ border: "1px solid #E5E7EB", background: "white", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer" }}
                      >
                        {p.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
