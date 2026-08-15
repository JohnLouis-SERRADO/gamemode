'use strict';

// =====================================================================
// v19 — LA TOUR DE L'ÉVEIL, à partir du niveau 60.
//
// C'est l'endgame de BUILD, en parallèle de la Tour Sans Fin qui est
// l'endgame de performance. On y monte pour changer ce qu'on est.
//
// Le principe qui gouverne tout : « tout choix définitif doit avoir une
// porte de sortie payante » (règle 10 du document de conception). Un
// joueur qui s'est trompé de sous-classe au niveau 10 ne doit pas être
// condamné à recommencer un héros — il doit pouvoir payer pour corriger.
// =====================================================================

const NIVEAU_TOUR_EVEIL = 60;
const ETAGES_TOUR_EVEIL = 100;

// Ce que rapporte un étage, par tranche. Les Sceaux sont la monnaie de la
// Tour : ils ne servent qu'ici, et ils ne s'achètent pas.
const SCEAUX_PAR_ETAGE = [
  { jusqua: 20, sceaux: 1, bonus: null },
  { jusqua: 50, sceaux: 2, bonus: 'Une carte de faille tous les dix étages' },
  { jusqua: 80, sceaux: 3, bonus: 'Une relique mineure aux étages 60 et 80' },
  { jusqua: 100, sceaux: 5, bonus: 'Une relique majeure à l’étage 100' },
];

function sceauxDeLEtage(etage) {
  const tranche = SCEAUX_PAR_ETAGE.find((t) => etage <= t.jusqua);
  if (!tranche) return 5 + Math.floor((etage - ETAGES_TOUR_EVEIL) / 10);
  return tranche.sceaux;
}

// Un boss tous les dix étages, et chacun donne un Sceau Majeur — la
// monnaie des changements lourds.
function estEtageBoss(etage) {
  return etage % 10 === 0;
}

// =====================================================================
// Les sept services.
//
// Chacun a un coût en Sceaux, parfois en Sceaux Majeurs, et parfois en or
// — les puits à or du lot 4 passent aussi par ici.
// =====================================================================
const SERVICES_TOUR = {
  'changer-voie': {
    nom: 'Changer de Voie', emoji: '🛤️',
    sceaux: 15, majeurs: 0, or: 0,
    desc: 'Rechoisir la Voie du niveau 50, sans rien perdre d’autre.',
    disponible: (p) => !!p.voie,
    raison: () => `Vous n’avez pas encore choisi de Voie — elle s’ouvre au niveau ${NIVEAU_VOIE}.`,
    appliquer: (p) => { p.voie = null; return 'Votre Voie est oubliée : elle vous sera reproposée.'; },
  },
  'changer-sous-classe': {
    nom: 'Changer de spécialité', emoji: '🔀',
    sceaux: 60, majeurs: 1, or: 0,
    desc: 'Rechoisir la sous-classe du niveau 10. Les compétences apprises restent au grimoire — rien ne se perd, jamais.',
    disponible: (p) => !!p.sousClasse,
    raison: () => `Vous n’avez pas encore de spécialité — elle se choisit au niveau ${NIVEAU_SOUS_CLASSE}.`,
    appliquer: (p) => {
      p.sousClasse = null;
      p.voie = null;   // la Voie dépend de la spécialité
      return 'Votre spécialité et votre Voie sont à rechoisir. Votre grimoire est intact.';
    },
  },
  'changer-classe': {
    nom: 'Changer de rôle', emoji: '🎭',
    sceaux: 150, majeurs: 3, or: 0,
    desc: 'Changer de classe de base. Le niveau et l’expérience sont conservés ; spécialité, Voie et Éveil sont à refaire.',
    disponible: () => true,
    appliquer: (p) => {
      p.sousClasse = null;
      p.voie = null;
      p.eveil = null;
      p.choixClasseOffert = true;
      return 'Votre rôle est à rechoisir. Vous gardez votre niveau, votre or et tout votre grimoire.';
    },
  },
  'relancer-eveil': {
    nom: 'Relancer l’Éveil', emoji: '🎲',
    sceaux: 40, majeurs: 1, or: 0,
    desc: 'Un nouveau tirage de cinq propositions. Après cinq relances, la garantie assure au moins un Légendaire.',
    disponible: (p) => !!(p.eveil && p.eveil.id),
    raison: () => `Vous n’avez pas encore d’Éveil — le premier tirage arrive au niveau ${NIVEAU_EVEIL}.`,
    appliquer: (p) => {
      const relances = (p.eveil.relances || 0) + 1;
      p.eveil = { relances };
      const reste = Math.max(0, RELANCES_AVANT_GARANTIE - relances);
      return reste > 0
        ? `Éveil oublié. Encore ${reste} relance${reste > 1 ? 's' : ''} avant la garantie Légendaire.`
        : 'Éveil oublié. Le prochain tirage contiendra au moins un Légendaire — c’est garanti.';
    },
  },
  'verrouiller': {
    nom: 'Verrouiller une proposition', emoji: '🔒',
    sceaux: 25, majeurs: 0, or: 0,
    desc: 'Garder une proposition du dernier tirage pour le tirage suivant.',
    disponible: (p) => !!(p.eveil && p.eveil.propositions && p.eveil.propositions.length),
    raison: () => 'Aucun tirage en attente : il faut d’abord ouvrir un tirage d’Éveil.',
    appliquer: (p) => {
      p.eveil.verrouillee = p.eveil.propositions[0];
      return 'Proposition verrouillée : elle reviendra au prochain tirage.';
    },
  },
  'forcer-rarete': {
    nom: 'Forcer une rareté minimale', emoji: '💠',
    sceaux: 80, majeurs: 0, or: 0,
    desc: 'Garantir au moins une proposition Légendaire dans le prochain tirage, sans attendre les cinq relances.',
    disponible: () => true,
    appliquer: (p) => {
      p.eveil = { ...(p.eveil || {}), garantie: true };
      return 'Le prochain tirage contiendra au moins un Légendaire.';
    },
  },
  'reveler-cache': {
    nom: 'Révéler un Éveil caché', emoji: '🕯️',
    sceaux: 100, majeurs: 0, or: 0,
    desc: 'Afficher la condition exacte d’un Éveil caché de votre spécialité, au lieu de son simple indice.',
    disponible: (p) => !!p.sousClasse,
    raison: () => `Chaque Éveil caché appartient à une spécialité : choisissez la vôtre au niveau ${NIVEAU_SOUS_CLASSE}.`,
    appliquer: (p) => {
      const cache = (SOUS_CLASSES[p.sousClasse].eveils || [])
        .map((id) => EVEILS[id]).find((e) => e.rarete === 'cache');
      if (!cache) return 'Aucun Éveil caché pour cette spécialité.';
      p.cachesReveles = p.cachesReveles || [];
      if (!p.cachesReveles.includes(cache.id)) p.cachesReveles.push(cache.id);
      return `${cache.nom} — ${cache.condition.exacte}`;
    },
  },
};

// La bourse de Sceaux d'un héros, initialisée à la demande.
function sceauxDe(p) {
  if (!p.sceaux) p.sceaux = { normaux: 0, majeurs: 0 };
  return p.sceaux;
}

function peutPayerService(p, service) {
  const bourse = sceauxDe(p);
  return bourse.normaux >= service.sceaux
    && bourse.majeurs >= service.majeurs
    && (p.po || 0) >= (service.or || 0);
}

// Rend les Sceaux gagnés en montant à un étage donné. Appelé par les
// tours existantes : la Tour de l'Éveil n'a pas son propre escalier, elle
// se nourrit de tout ce qu'on grimpe déjà.
function gagnerSceaux(p, etage) {
  const bourse = sceauxDe(p);
  const gagnes = sceauxDeLEtage(etage);
  bourse.normaux += gagnes;
  const majeur = estEtageBoss(etage);
  if (majeur) bourse.majeurs += 1;
  return { normaux: gagnes, majeurs: majeur ? 1 : 0 };
}
