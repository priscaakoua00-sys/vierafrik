# 🌍 VierAfrik — Gestion Business pour Entrepreneurs Africains

> **"Gagne de l'argent en Afrique"**  
> SaaS de gestion commerciale conçu spécifiquement pour les PME et micro-entrepreneurs d'Afrique francophone subsaharienne.

---

## 1. Vision & Problème Résolu

### Le problème
Les entrepreneurs africains — commerçants, prestataires, artisans — gèrent leur business sur papier, dans des carnets ou dans leur tête. Ils n'ont pas accès à des outils simples, adaptés à leurs réalités : paiement Mobile Money, langues locales, connexion instable, pas de formation.

Les logiciels occidentaux (QuickBooks, Sage, Zoho) sont trop complexes, trop chers, et conçus pour des marchés qui ne ressemblent pas à celui de Dakar, Abidjan ou Lagos.

### La solution VierAfrik
Une application web mobile-first, en français, qui permet à un entrepreneur africain de :
- **Enregistrer une vente en 10 secondes**
- **Générer une facture automatiquement**
- **Encaisser par Mobile Money** (Orange, MTN, Wave)
- **Suivre ses clients, ses dépenses, son bénéfice**
- **Obtenir des conseils business personnalisés** via un Coach IA

Principe UX absolu : **1 action = 1 résultat. Aucune formation requise.**

---

## 2. Fonctionnement Réel de l'Application

### Flux principal : Vente → Client → Facture → Paiement

```
Entrepreneur saisit une vente
        │
        ▼
Client existe dans la base ?
  ├─ OUI → CA client mis à jour automatiquement
  └─ NON → Client créé automatiquement (nom + téléphone)
        │
        ▼
Facture générée automatiquement (numéro VAF-YYYY-XXXX)
        │
        ▼
Statut facture : Non payée ⏳
        │
        ▼
Entrepreneur encaisse (total ou partiel)
        │
        ├─ Paiement partiel → Statut : Partiellement payée 🔵
        └─ Paiement total  → Statut : Payée ✅
```

### Flux paiement Mobile Money
```
Facture → Bouton "📱 MM" → Choix opérateur (CinetPay / Wave / Paystack / Flutterwave)
        → API serverless /api/notchpay (Vercel)
        → Client reçoit notification sur son téléphone
        → Confirmation webhook → Statut mis à jour
```

---

## 3. Fonctionnalités Actuelles

### 💸 Transactions
- Enregistrement vente ou dépense
- Catégories ventes : Commerce, Services, Alimentation, Agriculture, Transport, BTP, Santé, Éducation
- Catégories dépenses : Salaires, Loyer, Marketing, Matières premières, Équipement...
- Historique complet avec recherche et filtre par type
- Export CSV

### 🧾 Factures (fusion automatique avec les ventes)
- Génération automatique à chaque vente enregistrée
- Numérotation séquentielle : `VAF-2025-0001`
- Détail des articles (nom, quantité, prix unitaire, total ligne)
- Paiement partiel avec barre de progression visuelle
- Statuts automatiques : Non payé / Partiellement payé / Payé / En retard
- Export PDF professionnel avec QR code Mobile Money
- Envoi par WhatsApp en 1 clic
- Paiement Mobile Money intégré

### 👥 Clients
- Fiche client : nom, téléphone, email, pays, catégorie, statut (actif/inactif)
- CA total automatiquement mis à jour à chaque vente
- Auto-création si client inconnu lors d'une vente
- Export CSV
- 10 pays africains couverts (CI, SN, GH, CM, NG, ML, BF, TG, BJ, GN)

### 📊 Dashboard & Stats
- KPIs du mois : Ventes, Dépenses, Bénéfice net, Clients actifs
- Objectif mensuel avec barre de progression
- Graphique 6 mois (ventes / dépenses / profit)
- Donut chart par catégorie
- Top 5 clients par CA
- Insights automatiques (alertes trésorerie, factures en retard...)
- Top client du mois

### 🎥 Coach IA
- Chat contextuel basé sur les données réelles de l'utilisateur
- Répond aux questions : ventes, dépenses, bénéfice, clients, factures, objectifs, Mobile Money
- Vidéos tutoriels thématiques intégrées
- Fonctionne sans appel API externe (moteur local enrichi)

### ⚡ Action Rapide
- Publication de services pour trouver des clients
- Mise en relation B2B dans le réseau VierAfrik

### 🗺️ Réseau Commerçants
- Annuaire des commerçants inscrits
- Recherche par proximité géographique
- Fiches commerçants avec contact direct

### 📇 Carte de Visite & 🎨 Logo
- Génération de carte de visite digitale personnalisée
- Générateur de logo pour les entrepreneurs sans identité visuelle

### 🤝 Programme Ambassadeur
- Lien de parrainage unique par utilisateur
- Commission 20% sur chaque conversion payante
- Dashboard filleuls : inscrits / convertis / gains en FCFA
- Anti-fraude : vérification activité (minimum 3 actions + compte 24h+)
- Demande de paiement via WhatsApp (minimum 5 000 FCFA)

### 💎 Plans Tarifaires
| Plan | Prix | Transactions | Clients | Factures | PDF | WhatsApp | MM | Coach IA |
|------|------|-------------|---------|----------|-----|----------|----|----------|
| Free 🌱 | 0 FCFA | 10 | 3 | 2 | ❌ | ❌ | ❌ | ❌ |
| Pro ⚡ | 4 900 FCFA/mois | ∞ | ∞ | ∞ | ✅ | ✅ | ✅ | ✅ |
| Business 🏆 | 9 900 FCFA/mois | ∞ | ∞ | ∞ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Architecture Technique

### Stack
```
Frontend  : React 18 (hooks, SPA, mobile-first)
Backend   : Supabase (PostgreSQL + Auth + RLS + Realtime)
Serverless: Vercel (API route /api/notchpay pour les paiements)
Déploiement: GitHub → Vercel (CI/CD automatique)
Paiement  : NotchPay (proxy serverless pour éviter CORS)
```

### Structure fichiers
```
/
├── src/
│   └── App.jsx          ← Application complète (composant unique SPA)
├── api/
│   └── notchpay.js      ← Serverless function Vercel (proxy paiements)
├── public/
└── package.json
```

### Logique globale
L'application est une **SPA React single-file** avec routage par état (`page` state). Tous les modules (Dashboard, Factures, Clients, Coach, etc.) sont des composants définis **à l'extérieur du composant parent** pour éviter les re-renders et les bugs de remontage.

La persistance est 100% Supabase — pas de localStorage. Chaque action déclenche un appel Supabase synchronisé avec l'état React local.

---

## 5. Structure Base de Données (Supabase)

### Table `transactions`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text PK | Identifiant unique (xid) |
| user_id | uuid FK | Référence auth.users |
| type | text | `sale` ou `expense` |
| amount | float8 | Montant en FCFA |
| category | text | Catégorie de la transaction |
| who | text | Nom client ou fournisseur |
| date | date | Date de la transaction |
| note | text | Note libre |

### Table `invoices`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text PK | Identifiant unique |
| user_id | uuid FK | Propriétaire |
| number | text | Numéro facture (VAF-YYYY-XXXX) |
| client_id | text | Référence client (optionnel) |
| client_name | text | Nom du client |
| phone | text | Téléphone client |
| total | float8 | Montant total TTC |
| subtotal | float8 | Sous-total HT |
| tax | float8 | Montant taxe |
| amt_paid | float8 | Montant déjà encaissé |
| status | text | `pending` / `partial` / `paid` / `overdue` |
| pay_status | text | `unpaid` / `partial` / `paid` |
| pay_ref | text | Référence transaction paiement |
| pay_prov | text | Opérateur Mobile Money utilisé |
| issued | date | Date d'émission |
| due | date | Date d'échéance |
| items | jsonb | Articles (nom, qté, prix, total ligne) |
| notes | text | Notes et conditions |

### Table `clients`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text PK | Identifiant unique |
| user_id | uuid FK | Propriétaire |
| name | text | Nom ou raison sociale |
| phone | text | Téléphone |
| email | text | Email |
| country | text | Pays (emoji + nom) |
| category | text | Secteur d'activité |
| status | text | `active` ou `inactive` |
| revenue | float8 | CA total cumulé |

### Table `referrals`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| ambassador_code | text | Code ambassadeur |
| referred_user_id | uuid | Utilisateur parrainé |
| referred_email | text | Email filleul |
| plan | text | Plan souscrit par le filleul |
| commission | float8 | Commission due en FCFA |
| verified | boolean | Parrainage validé (anti-fraude) |
| created_at | timestamptz | Date d'inscription |

### Table `user_activity`
| Colonne | Type | Description |
|---------|------|-------------|
| user_id | uuid PK | Référence utilisateur |
| user_active | boolean | Compte actif |
| action_count | int | Nombre d'actions réalisées |
| last_action_at | timestamptz | Dernière action |

> **RLS activé sur toutes les tables.** Chaque utilisateur ne voit que ses propres données via `auth.uid() = user_id`.

---

## 6. Logiques Importantes

### Génération automatique de facture
Déclenchée à chaque enregistrement d'une **vente** (`type = "sale"`) :
1. Création d'un objet facture avec numéro séquentiel `VAF-YYYY-XXXX`
2. Article unique : description = note ou catégorie, prix = montant de la vente
3. Insert en base (`invoices`) + mise à jour du state React local
4. Toast de confirmation affiché à l'utilisateur
5. La facture apparaît immédiatement dans la page "Factures"

### Auto-création client
Lors de l'enregistrement d'une vente avec un nom de client :
1. Recherche dans `clis` (state) par nom exact (insensible à la casse) ou numéro de téléphone
2. Si **trouvé** : CA du client incrémenté du montant de la vente + update Supabase
3. Si **non trouvé** : création automatique d'une fiche client avec nom, téléphone (si saisi), pays par défaut CI, statut actif, CA = montant de la vente
4. Un seul toast récapitulatif affiché

### Paiement partiel
Champ `amt_paid` sur chaque facture, cumulatif :
```
newPaid = amtPaid + montantEncaissé
reste   = total - newPaid

if reste <= 0   → status = "paid"
if newPaid > 0  → status = "partial"
else            → status = "pending"
```
La barre de progression visuelle affiche `(amtPaid / total) * 100%`.  
Le modal propose des raccourcis rapides : 25% / 50% / 75% / 100% du reste.

### Mise à jour du CA client
À chaque vente associée à un client existant, `revenue` est incrémenté côté state React ET mis à jour dans Supabase via `supaUpdate`. Ce CA est affiché dans la fiche client et utilisé dans le classement Top 5.

---

## 7. Lancer le Projet

### Prérequis
- Node.js 18+
- Compte Supabase (projet existant)
- Compte Vercel (déploiement)
- Compte NotchPay (paiements Mobile Money)

### Développement local
```bash
# Cloner le repo
git clone https://github.com/votre-repo/vierafrik.git
cd vierafrik

# Installer les dépendances
npm install

# Variables d'environnement
cp .env.example .env.local
# Remplir : NOTCHPAY_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

# Lancer en dev
npm run dev
```

### Variables d'environnement requises
```env
# Supabase (côté client — safe avec RLS activé)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx

# NotchPay (côté serveur uniquement — dans Vercel)
NOTCHPAY_SECRET_KEY=sk.xxx
```

### Déploiement production
```bash
# Push sur GitHub → Vercel déploie automatiquement
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

### Migration base de données
Exécuter dans Supabase → SQL Editor si nouveau projet :
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Colonne paiement partiel (si migration depuis version antérieure)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amt_paid float8 DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id text DEFAULT '';
```

---

## 8. Roadmap & Points à Améliorer

### Priorité haute
- [ ] **Relance automatique WhatsApp** pour factures en retard (rappel J+7, J+14)
- [ ] **Webhook NotchPay** pour mise à jour automatique du statut après paiement Mobile Money confirmé
- [ ] **Mode hors-ligne** avec sync différée (PWA + IndexedDB)
- [ ] **Multi-devises** : FCFA / GHS / NGN / XOF / XAF

### Priorité moyenne
- [ ] **Devis** : convertir un devis en facture en 1 clic
- [ ] **Dépenses récurrentes** (loyer, salaires) avec rappel mensuel automatique
- [ ] **Export comptable** : grand livre simplifié en PDF/Excel
- [ ] **Photo de reçu** : attacher une image à une dépense
- [ ] **Tableau de bord TVA** pour les pays avec obligations fiscales

### Priorité basse / Futur
- [ ] **App mobile native** (React Native / Capacitor)
- [ ] **API publique** pour intégrations tierces
- [ ] **Multi-utilisateurs par entreprise** (comptable + gérant)
- [ ] **Intelligence Coach IA** via API Claude/OpenAI pour réponses plus riches
- [ ] **Marketplace** : connexion directe acheteurs / vendeurs dans le réseau VierAfrik

### Dette technique connue
- L'application est un fichier unique (~5 000 lignes) → migration vers une architecture modulaire recommandée à partir de la v2
- Le Coach IA texte est un moteur local à mots-clés → à remplacer par un appel API LLM
- Les clés Supabase sont inline dans le code client → à migrer vers variables d'environnement Vite

---

## 9. Positionnement Produit

### Marché cible
**Afrique francophone subsaharienne** — en priorité :
- 🇨🇮 Côte d'Ivoire
- 🇸🇳 Sénégal
- 🇨🇲 Cameroun
- 🇲🇱 Mali / 🇧🇫 Burkina Faso

Secteurs ciblés : commerce de détail, services, alimentation, BTP, transport, santé, éducation.

### Pourquoi VierAfrik gagne
| Critère | Concurrents occidentaux | VierAfrik |
|---------|------------------------|-----------|
| Langue | Anglais | Français africain |
| Paiement | Carte bancaire | Mobile Money natif |
| Complexité | Formation nécessaire | 0 formation |
| Prix | 20-50€/mois | 4 900 FCFA/mois (~7€) |
| Adapté Africa | ❌ | ✅ |
| Offline-friendly | ❌ | En cours |

### Modèle économique
- **Freemium** : plan gratuit limité pour acquisition
- **Pro 4 900 FCFA/mois** : cible commerçants individuels actifs
- **Business 9 900 FCFA/mois** : cible PME avec équipe
- **Commission ambassadeur 20%** : croissance virale organique

---

## Informations Projet

| | |
|--|--|
| **Produit** | VierAfrik |
| **URL** | https://vierafrik.com |
| **Stack** | React · Supabase · Vercel · NotchPay |
| **Version actuelle** | App_fixed_8 |
| **Langue principale** | Français |
| **Marché** | Afrique francophone subsaharienne |

---

*VierAfrik — Gagne de l'argent en Afrique 🌍*
