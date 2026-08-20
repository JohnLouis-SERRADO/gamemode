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
// (v26 : les « bonus » d'étage — cartes de faille, reliques — étaient des
// promesses déclarées ici sans une ligne de code ni d'affichage. Ils
// disparaissent plutôt que de mentir ; le jour où ils existeront, ils
// reviendront avec leur mécanique.)
const SCEAUX_PAR_ETAGE = [
  { jusqua: 20, sceaux: 1 },
  { jusqua: 50, sceaux: 2 },
  { jusqua: 80, sceaux: 3 },
  { jusqua: 100, sceaux: 5 },
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
      p.voie = null;    // la Voie dépend de la spécialité
      p.eveil = null;
      p.kitMigre = null; // le contrat de migration valait pour l'ANCIENNE spécialité   // l'Éveil aussi : chaque Éveil appartient à SA spécialité
      return 'Votre spécialité, votre Voie et votre Éveil sont à rechoisir. Votre grimoire est intact.';
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
      p.kitMigre = null;
      p.choixClasseOffert = true;
      return 'Votre rôle est à rechoisir. Vous gardez votre niveau, votre or et tout votre grimoire.';
    },
  },
  'relancer-eveil': {
    nom: 'Relancer l’Éveil', emoji: '🎲',
    sceaux: 40, majeurs: 1, or: 0,
    // v28 : la description dit TOUT ce que le service fait — un Éveil déjà
    // choisi est remplacé par le nouveau tirage, et il faut le savoir.
    desc: 'Un nouveau tirage de trois propositions — si un Éveil est déjà choisi, il est oublié au profit du tirage. Après cinq relances, la garantie assure au moins un Mythique.',
    disponible: (p) => !!(p.eveil && (p.eveil.id || (p.eveil.propositions || []).length)),
    raison: () => `Vous n’avez pas encore d’Éveil — le premier tirage arrive au niveau ${NIVEAU_EVEIL}.`,
    appliquer: (p) => {
      // La relance oublie l'Éveil (ou le tirage en attente) mais JAMAIS
      // ce qui a été payé : la garantie et le verrou survivent jusqu'au
      // tirage qui les consomme.
      const relances = (p.eveil.relances || 0) + 1;
      p.eveil = {
        relances,
        garantie: p.eveil.garantie || false,
        verrouillee: p.eveil.verrouillee || null,
      };
      const reste = Math.max(0, RELANCES_AVANT_GARANTIE - relances);
      const seuil = RARETES_EVEIL[RARETE_GARANTIE].nom;
      return reste > 0 && !p.eveil.garantie
        ? `Tirage relancé. Encore ${reste} relance${reste > 1 ? 's' : ''} avant la garantie ${seuil}.`
        : `Tirage relancé : il contiendra au moins un ${seuil} — c’est garanti.`;
    },
  },
  'verrouiller': {
    nom: 'Verrouiller une proposition', emoji: '🔒',
    sceaux: 25, majeurs: 0, or: 0,
    desc: 'Verrouiller automatiquement la PLUS RARE des propositions en attente : elle reviendra d’office au tirage suivant — la garantie elle-même ne peut plus l’écraser.',
    disponible: (p) => !!(p.eveil && p.eveil.propositions && p.eveil.propositions.length),
    raison: () => 'Aucun tirage en attente. Reportez un tirage (« Plus tard ») ou relancez-en un, puis revenez.',
    appliquer: (p) => {
      // On garde la plus rare : c'est toujours elle qu'on paie pour revoir.
      const rangs = ORDRE_EVEIL;
      const meilleure = p.eveil.propositions
        .map((id) => EVEILS[id]).filter(Boolean)
        .sort((a, b) => rangs.indexOf(b.rarete) - rangs.indexOf(a.rarete))[0];
      p.eveil.verrouillee = meilleure.id;
      return `${meilleure.nom} (${RARETES_EVEIL[meilleure.rarete].nom}) est verrouillé : il reviendra au prochain tirage.`;
    },
  },
  'forcer-rarete': {
    nom: 'Forcer une rareté minimale', emoji: '💠',
    sceaux: 80, majeurs: 0, or: 0,
    desc: 'Garantir au moins une proposition Mythique dans le prochain tirage, sans attendre les cinq relances.',
    // v28 : plus proposé à un héros qui n'a encore aucun tirage à forcer.
    disponible: (p) => (p.niveau || 1) >= NIVEAU_EVEIL || !!p.eveil,
    raison: () => `Le premier tirage d’Éveil arrive au niveau ${NIVEAU_EVEIL} — rien à forcer d’ici là.`,
    appliquer: (p) => {
      p.eveil = { ...(p.eveil || { relances: 0 }), garantie: true };
      return `Le prochain tirage contiendra au moins un ${RARETES_EVEIL[RARETE_GARANTIE].nom}.`;
    },
  },
  'reveler-cache': {
    nom: 'Révéler un Éveil caché', emoji: '🕯️',
    sceaux: 100, majeurs: 0, or: 0,
    desc: 'Afficher la condition exacte d’un Éveil caché de votre spécialité, au lieu de son simple indice.',
    // v28 : le service n'est proposé que si l'Éveil caché EXISTE — les
    // Sceaux étaient débités avant de découvrir qu'il n'y avait rien.
    disponible: (p) => !!p.sousClasse && (SOUS_CLASSES[p.sousClasse].eveils || [])
      .some((id) => EVEILS[id] && EVEILS[id].rarete === 'cache'),
    raison: (p) => (p && p.sousClasse
      ? 'Cette spécialité ne cache aucun Éveil — il n’y a rien à révéler.'
      : `Chaque Éveil caché appartient à une spécialité : choisissez la vôtre au niveau ${NIVEAU_SOUS_CLASSE}.`),
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
