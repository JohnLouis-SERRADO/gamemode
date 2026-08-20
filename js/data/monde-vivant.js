'use strict';

// =====================================================================
// v19 — LE MONDE VIVANT : l'heure et le temps qu'il fait.
//
// Valciel n'avait ni heure ni météo. Le monde était identique à trois
// heures du matin et à midi, sous la pluie comme au grand soleil.
//
// Deux cycles y remédient, tous deux LISIBLES et PRÉVISIBLES — un monde
// vivant ne doit pas être un monde capricieux :
//
//   • la PHASE suit l'horloge réelle du joueur. Aube, Jour, Nuit.
//   • la MÉTÉO change toutes les trois heures, tirée d'une graine
//     commune calculée sur la date. Tous les joueurs ont donc le même
//     ciel au même moment, sans qu'aucun serveur n'ait à le dire — et
//     hors ligne, le jeu reste parfaitement jouable.
//
// Les effets sont réels : ils touchent les dégâts élémentaires, la
// récolte, l'or et le butin. Ils s'affichent en haut à droite du header,
// avec le détail au toucher.
// =====================================================================

const PHASES_JOUR = [
  {
    id: 'aube', nom: 'Aube', emoji: '🌅', de: 6, a: 12,
    resume: 'Les herbes sont chargées de rosée et les filons affleurent.',
    effets: { recolteHerbe: 1.25, recolteMine: 1.15 },
    detail: '🌿 Herboristerie +25 % · ⛏️ filons plus généreux +15 %',
  },
  {
    id: 'jour', nom: 'Jour', emoji: '☀️', de: 12, a: 20,
    resume: 'Les routes sont sûres et les marchands bien approvisionnés.',
    effets: { or: 1.1 },
    detail: '💰 Or +10 % · l’étal des marchands est au plus fourni',
  },
  {
    id: 'nuit', nom: 'Nuit', emoji: '🌙', de: 20, a: 6,
    resume: 'Ce qui dort le jour se réveille — et ce qu’on y trouve vaut plus cher.',
    // v28 : le gibier sort la nuit — le dépeçage a enfin son heure, comme
    // l'aube a la sienne pour les herbes et les filons.
    effets: { butin: 1.2, degatsSubis: 1.1, recoltePeau: 1.2 },
    detail: '🎁 Butin +20 % · 🔪 dépeçage +20 % · ⚠️ les monstres frappent 10 % plus fort',
  },
];

const METEOS = {
  claire: {
    nom: 'Ciel clair', emoji: '☀️', poids: 30,
    resume: 'Rien à signaler. Profitez-en.',
    effets: {}, detail: 'Aucun effet',
  },
  pluie: {
    nom: 'Pluie', emoji: '🌧️', poids: 20,
    resume: 'Le feu peine à prendre, la foudre trouve son chemin.',
    effets: { feu: 0.8, foudre: 1.2, recolteHerbe: 1.15 },
    detail: '🔥 Feu −20 % · ⚡ Foudre +20 % · 🌿 Herboristerie +15 %',
  },
  brume: {
    nom: 'Brume', emoji: '🌫️', poids: 14,
    resume: 'On ne voit pas à dix pas — ni ce qu’on frappe, ni ce qui approche. Le gibier non plus.',
    // v28 : la Brume couvre aussi l'approche du chasseur.
    effets: { precision: 0.9, pvEnnemisCaches: true, recoltePeau: 1.15 },
    detail: '🎯 Précision −10 % · les PV ennemis restent cachés · 🔪 dépeçage +15 %',
  },
  tempete: {
    nom: 'Tempête', emoji: '⛈️', poids: 12,
    resume: 'Le vent brouille l’ordre des choses. La foudre, elle, adore.',
    effets: { foudre: 1.3, initiativeAleatoire: true },
    detail: '⚡ Foudre +30 % · l’initiative devient imprévisible',
  },
  canicule: {
    nom: 'Canicule', emoji: '🔥', poids: 12,
    resume: 'L’air brûle. Le mana s’évapore avec la sueur.',
    effets: { feu: 1.2, manaParTour: -0.03 },
    detail: '🔥 Feu +20 % · 💧 −3 % de mana par tour',
  },
  blizzard: {
    nom: 'Blizzard', emoji: '🌨️', poids: 12,
    resume: 'Le froid mord tout le monde, et le givre porte plus loin.',
    effets: { givre: 1.25, gelPeriodique: 3 },
    detail: '❄️ Givre +25 % · un gel frappe le terrain tous les 3 tours',
  },
};

// Combien d'heures dure une tranche de météo. Trois heures : assez pour
// qu'on ait le temps d'en profiter, assez court pour que ça change.
const HEURES_PAR_METEO = 3;

// Générateur déterministe : la même date donne le même ciel, partout.
function graineMeteo(date) {
  const jour = Math.floor(date.getTime() / 86400000);
  const tranche = Math.floor(date.getUTCHours() / HEURES_PAR_METEO);
  let h = (jour * 24 + tranche) >>> 0;
  h = ((h ^ 0x9e3779b9) * 1103515245) >>> 0;
  return (h >>> 8) / 16777216;
}

function phaseCourante(maintenant) {
  const date = maintenant || new Date();
  const heure = date.getHours();
  return PHASES_JOUR.find((p) => (p.de < p.a
    ? heure >= p.de && heure < p.a
    : heure >= p.de || heure < p.a)) || PHASES_JOUR[1];
}

function meteoCourante(maintenant) {
  const date = maintenant || new Date();
  const tirage = graineMeteo(date);
  const total = Object.values(METEOS).reduce((somme, m) => somme + m.poids, 0);
  let curseur = tirage * total;
  for (const [id, meteo] of Object.entries(METEOS)) {
    curseur -= meteo.poids;
    if (curseur <= 0) return { id, ...meteo };
  }
  return { id: 'claire', ...METEOS.claire };
}

// Dans combien de minutes le ciel change-t-il ? Affiché au toucher, pour
// qu'attendre une meilleure météo devienne une décision possible.
function minutesAvantChangementMeteo(maintenant) {
  const date = maintenant || new Date();
  const heure = date.getUTCHours();
  const prochaine = (Math.floor(heure / HEURES_PAR_METEO) + 1) * HEURES_PAR_METEO;
  const reste = (prochaine - heure) * 60 - date.getUTCMinutes();
  return Math.max(1, reste);
}

// Les tests et le banc d'équilibrage peuvent FIGER le monde : un combat
// mesuré ne doit pas changer de résultat selon l'heure de la machine qui
// le mesure. figerMonde(null) rend le ciel au temps réel.
let MONDE_FIGE = null;

function figerMonde(monde) {
  MONDE_FIGE = monde;
}

// L'état complet du monde à cet instant : c'est ce que lit le combat,
// la récolte et le header.
function mondeMaintenant(maintenant) {
  if (MONDE_FIGE && !maintenant) return MONDE_FIGE;
  const phase = phaseCourante(maintenant);
  const meteo = meteoCourante(maintenant);
  const effets = { ...phase.effets };
  Object.entries(meteo.effets).forEach(([cle, valeur]) => {
    effets[cle] = typeof valeur === 'number' && typeof effets[cle] === 'number'
      ? effets[cle] * valeur
      : valeur;
  });
  return { phase, meteo, effets };
}

// Le multiplicateur d'un élément donné, selon le ciel. Le physique reste
// neutre : il ne dépend jamais du temps qu'il fait.
function multElementMonde(element, monde) {
  if (!element) return 1;
  const m = monde || mondeMaintenant();
  return m.effets[element] || 1;
}

// Multiplicateurs de récolte et de gains, lus par l'exploration.
// v28 : les TROIS filières ont leur heure — la chasse ne gagnait rien,
// jamais, pendant que l'aube payait les herbes et les filons.
function multRecolteMonde(famille, monde) {
  const m = monde || mondeMaintenant();
  if (famille === 'plante') return m.effets.recolteHerbe || 1;
  if (famille === 'mine') return m.effets.recolteMine || 1;
  if (famille === 'peau') return m.effets.recoltePeau || 1;
  return 1;
}
