import { Component } from "react";

// ══════════════════════════════════════════════════════════════
//  Filet de sécurité global — sans ceci, une exception non gérée
//  dans n'importe quel composant (tout l'app vit dans un seul
//  arbre React) fait un écran totalement blanc, sans aucun moyen
//  de récupération pour l'utilisateur.
// ══════════════════════════════════════════════════════════════
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Exception non gérée:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", background: "#010306", color: "#dff0ff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "2rem", textAlign: "center", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Une erreur est survenue</div>
        <div style={{ fontSize: 13, color: "#80a8c8", marginBottom: 24, maxWidth: 340, lineHeight: 1.6 }}>
          Quelque chose s'est mal passé. Vos données sont en sécurité — essayez de recharger la page.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#00d478,#00bfcc)", color: "#000",
            fontWeight: 800, fontSize: 14, fontFamily: "inherit",
          }}
        >
          🔄 Recharger l'application
        </button>
      </div>
    );
  }
}
