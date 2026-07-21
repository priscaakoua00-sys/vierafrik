import { useState, useEffect, useRef } from "react";
import { PLANS } from "../../data/pricing.js";

// ══════════════════════════════════════════════════════
//  Palette : identique à celle de l'application (src/App.jsx)
//  Dupliquée volontairement ici : la landing doit pouvoir
//  vivre et être revue indépendamment du composant géant App.
// ══════════════════════════════════════════════════════
const T = {
  bg: "#010306", c1: "#05090f", c2: "#08111d", c3: "#0d1828", c4: "#121f34",
  border: "rgba(0,210,120,0.08)", bhi: "rgba(0,210,120,0.22)",
  gr: "#00d478", teal: "#00bfcc", blue: "#1a78ff", gold: "#f0b020",
  orange: "#ff5a18", red: "#ff2255", purple: "#9060ff",
  text: "#dff0ff", sub: "#4a7090", sub2: "#80a8c8", ink: "#000",
};

const FEATURES = [
  {
    ic: "🧾",
    col: T.gr,
    title: "Facture pro + Mobile Money en 1 clic",
    text: "Chaque vente devient automatiquement une facture numérotée. Le client paie par Orange Money, MTN ou Wave, et vous êtes encaissé sans attendre un virement bancaire.",
    tags: ["Orange Money", "MTN Mobile Money", "Wave"],
  },
  {
    ic: "🤖",
    col: T.teal,
    title: "Coach IA qui connaît vraiment votre business",
    text: "Pas un chatbot générique : il lit vos ventes, vos factures en retard, vos clients, et vous dit quoi faire ensuite, en français simple, sans jargon comptable.",
    tags: ["Basé sur vos données", "Conseils personnalisés"],
  },
  {
    ic: "🎨",
    col: T.gold,
    title: "Carte de visite et logo générés pour vous",
    text: "Pas de budget pour un designer ? VierAfrik crée votre identité visuelle professionnelle (carte de visite digitale et logo) en quelques clics.",
    tags: ["Carte digitale", "Logo automatique"],
  },
];

const COUNTRIES = ["🇨🇮 Côte d'Ivoire", "🇸🇳 Sénégal", "🇨🇲 Cameroun", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇹🇬 Togo", "🇧🇯 Bénin", "🇬🇳 Guinée"];

const COMPARISON = [
  { crit: "Langue", them: "Anglais", us: "Français africain" },
  { crit: "Paiement", them: "Carte bancaire uniquement", us: "Mobile Money natif" },
  { crit: "Prise en main", them: "Formation nécessaire", us: "Aucune formation, 1 action = 1 résultat" },
  { crit: "Prix", them: "20 à 50 € / mois", us: "À partir de 0 FCFA" },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export default function LandingPage({ onGetStarted, onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        .vaf-cta{transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease}
        .vaf-cta:active{transform:scale(.96)}
        .vaf-cta:hover{transform:translateY(-1px)}
        .vaf-feat{transition:transform .25s ease, border-color .25s ease}
        .vaf-feat:hover{transform:translateY(-4px);border-color:var(--hc)!important}
        @keyframes vafFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes vafPulse{0%,100%{opacity:.5}50%{opacity:1}}
      `}</style>

      {/* ── NAV ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: scrolled ? "rgba(1,3,6,.85)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
        transition: "all .25s ease",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.gr},${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🌍</div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-.03em" }}>
              <span style={{ color: T.gr }}>Vier</span><span style={{ color: T.text }}>Afrik</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <a href="#fonctionnalites" onClick={scrollTo("fonctionnalites")} style={{ color: T.sub2, textDecoration: "none", fontSize: 13, fontWeight: 600, display: window.innerWidth < 640 ? "none" : "block" }}>Fonctionnalités</a>
            <a href="#tarifs" onClick={scrollTo("tarifs")} style={{ color: T.sub2, textDecoration: "none", fontSize: 13, fontWeight: 600, display: window.innerWidth < 640 ? "none" : "block" }}>Tarifs</a>
            <button onClick={onLogin} className="vaf-cta" style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: "8px 16px", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Se connecter
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", padding: "64px 24px 80px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 700, height: 380, background: `radial-gradient(ellipse,${T.gr}10 0%,transparent 70%)`, pointerEvents: "none" }} />
        <Reveal>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.c2, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gr, animation: "vafPulse 2s ease infinite" }} />
            <span style={{ fontSize: 12, color: T.sub2, fontWeight: 600 }}>Conçu pour l'Afrique francophone</span>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.08, margin: "0 0 20px" }}>
            Gérez votre business.<br />
            <span style={{ background: `linear-gradient(135deg,${T.gr},${T.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Encaissez en Mobile Money.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p style={{ fontSize: "clamp(15px,2vw,18px)", color: T.sub2, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.6 }}>
            Factures automatiques, encaissement Mobile Money, coach IA et identité visuelle professionnelle : tout ce dont un entrepreneur africain a besoin, sans formation.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onGetStarted} className="vaf-cta" style={{
              background: `linear-gradient(135deg,${T.gr},${T.teal})`, color: T.ink, border: "none", borderRadius: 14,
              padding: "15px 32px", fontFamily: "inherit", fontWeight: 900, fontSize: 15, cursor: "pointer",
              boxShadow: `0 10px 40px ${T.gr}33`,
            }}>
              Commencer gratuitement →
            </button>
            <button onClick={onLogin} className="vaf-cta" style={{
              background: T.c2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 14,
              padding: "15px 28px", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
              Se connecter
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: T.sub }}>Gratuit pour commencer · Sans carte bancaire</div>
        </Reveal>

        {/* Mockup flottant */}
        <Reveal delay={320}>
          <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "100%", maxWidth: 380, background: T.c1, border: `1px solid ${T.border}`, borderRadius: 22,
              padding: "1.4rem", boxShadow: "0 40px 90px rgba(0,0,0,.6)", animation: "vafFloat 6s ease-in-out infinite",
              textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Facture VAF-2026-0142</div>
                <span style={{ background: `${T.gr}18`, color: T.gr, fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "3px 10px" }}>✅ Payée</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>45 000 FCFA</div>
              <div style={{ fontSize: 12, color: T.sub2, marginBottom: 16 }}>Aïcha Traoré · Boutique textile</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: T.c3, borderRadius: 10, padding: "8px 10px", fontSize: 11, color: T.sub2, textAlign: "center" }}>📱 Orange Money</div>
                <div style={{ flex: 1, background: T.c3, borderRadius: 10, padding: "8px 10px", fontSize: 11, color: T.sub2, textAlign: "center" }}>✅ Reçu envoyé</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── 3 FONCTIONNALITÉS PHARES ── */}
      <div id="fonctionnalites" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 80px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.gr, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Ce qui change tout</div>
            <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, letterSpacing: "-.02em", margin: 0 }}>3 raisons pour lesquelles VierAfrik est différent</h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="vaf-feat" style={{ "--hc": `${f.col}55`, height: "100%", background: T.c1, border: `1px solid ${T.border}`, borderRadius: 20, padding: "1.8rem 1.6rem" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: `${f.col}14`, border: `1px solid ${f.col}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18,
                }}>{f.ic}</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: T.sub2, lineHeight: 1.65, marginBottom: 16 }}>{f.text}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {f.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10.5, fontWeight: 700, color: f.col, background: `${f.col}12`, borderRadius: 20, padding: "4px 10px" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── COMPARATIF ── */}
      <div style={{ background: T.c1, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(22px,3.5vw,28px)", fontWeight: 900, marginBottom: 36, letterSpacing: "-.02em" }}>
              Pensé pour l'Afrique, pas adapté après coup
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", letterSpacing: ".05em" }}>
                <div></div><div>Solutions occidentales</div><div style={{ color: T.gr }}>VierAfrik</div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={row.crit} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "16px 20px", borderBottom: i < COMPARISON.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{row.crit}</div>
                  <div style={{ fontSize: 12.5, color: T.sub }}>❌ {row.them}</div>
                  <div style={{ fontSize: 12.5, color: T.gr, fontWeight: 700 }}>✅ {row.us}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── TARIFS ── */}
      <div id="tarifs" style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Tarifs</div>
            <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, letterSpacing: "-.02em", margin: "0 0 12px" }}>Un prix pensé pour le marché africain</h2>
            <p style={{ color: T.sub2, fontSize: 14 }}>Commencez gratuitement. Passez au plan supérieur quand votre business grandit.</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {Object.entries(PLANS).map(([key, plan], i) => (
            <Reveal key={key} delay={i * 100}>
              <div style={{
                height: "100%", background: key === "pro" ? `linear-gradient(180deg,${T.c2},${T.c1})` : T.c1,
                border: key === "pro" ? `2px solid ${plan.col}55` : `1px solid ${T.border}`,
                borderRadius: 20, padding: "1.8rem 1.6rem", position: "relative",
              }}>
                {key === "pro" && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.col, color: T.ink, fontSize: 10, fontWeight: 900, borderRadius: 20, padding: "4px 14px", whiteSpace: "nowrap" }}>
                    ⭐ LE PLUS CHOISI
                  </div>
                )}
                <div style={{ fontSize: 26, marginBottom: 8 }}>{plan.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>{plan.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: plan.col }}>{plan.price === 0 ? "0" : plan.price.toLocaleString("fr-FR")}</span>
                  <span style={{ fontSize: 13, color: T.sub }}>FCFA{plan.price > 0 ? " / mois" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, fontSize: 12.5, color: T.sub2 }}>
                  <div>{plan.maxTx === Infinity ? "Transactions illimitées" : `${plan.maxTx} transactions / mois`}</div>
                  <div>{plan.maxCli === Infinity ? "Clients illimités" : `${plan.maxCli} clients`}</div>
                  <div>{plan.maxInv === Infinity ? "Factures illimitées" : `${plan.maxInv} factures`}</div>
                  <div>{plan.pdf ? "✅" : "❌"} Export PDF professionnel</div>
                  <div>{plan.mm ? "✅" : "❌"} Encaissement Mobile Money</div>
                  <div>{plan.ai ? "✅" : "❌"} Coach IA</div>
                  {plan.prioritySupport && <div>✅ Support prioritaire</div>}
                </div>
                <button onClick={onGetStarted} className="vaf-cta" style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: key === "free" ? T.c3 : `linear-gradient(135deg,${plan.col},${T.teal})`,
                  color: key === "free" ? T.text : T.ink, fontFamily: "inherit", fontWeight: 800, fontSize: 13.5,
                }}>
                  {key === "free" ? "Commencer gratuitement" : `Choisir ${plan.label}`}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── COUVERTURE PAYS ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "48px 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 18 }}>
            Disponible dans toute l'Afrique francophone
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 720, margin: "0 auto" }}>
            {COUNTRIES.map(c => (
              <span key={c} style={{ fontSize: 12.5, color: T.sub2, background: T.c1, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px" }}>{c}</span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 90px", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, letterSpacing: "-.02em", marginBottom: 16 }}>
            Prêt à professionnaliser votre business ?
          </h2>
          <p style={{ color: T.sub2, fontSize: 14, marginBottom: 28 }}>
            Créez votre compte en moins d'une minute. Aucune carte bancaire requise.
          </p>
          <button onClick={onGetStarted} className="vaf-cta" style={{
            background: `linear-gradient(135deg,${T.gr},${T.teal})`, color: T.ink, border: "none", borderRadius: 14,
            padding: "16px 36px", fontFamily: "inherit", fontWeight: 900, fontSize: 15, cursor: "pointer",
            boxShadow: `0 10px 40px ${T.gr}33`,
          }}>
            Créer mon compte gratuitement →
          </button>
        </Reveal>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "28px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg,${T.gr},${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🌍</div>
            <span style={{ fontWeight: 800, fontSize: 13 }}><span style={{ color: T.gr }}>Vier</span>Afrik</span>
          </div>
          <div style={{ fontSize: 12, color: T.sub }}>© {new Date().getFullYear()} VierAfrik · Gagne de l'argent en Afrique</div>
        </div>
      </div>
    </div>
  );
}
