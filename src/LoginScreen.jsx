import { useState } from "react";
import { login } from "./api";

const BLUE = "#0066FF";

// Fase 4: login por pessoa (email + senha), não mais só uma senha de admin
// compartilhada — ver crm_equipe/api.js.
export default function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !senha) return;
    setLoading(true);
    setError("");
    try {
      await login(email, senha);
      onSuccess();
    } catch (err) {
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8F9FA",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `linear-gradient(135deg,${BLUE},#0055d4)`,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              marginBottom: 12,
            }}
          >
            🛠️
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#111827" }}>
            MULTI CRM
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
            Painel administrativo — acesso restrito
          </p>
        </div>

        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>E-mail</label>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />

        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              color: "#DC2626",
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !senha}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: loading || !email || !senha ? "#9CA3AF" : `linear-gradient(135deg,${BLUE},#0055d4)`,
            color: "white",
            fontWeight: 800,
            fontSize: 14,
            cursor: loading || !email || !senha ? "default" : "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
