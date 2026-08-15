'use strict';

// =====================================================================
// v19 — ACTES III ET IV : DES MARCHES FÊLÉES À LA COUTURE DU MONDE
//
// Dix cartes neuves, du niveau 52 au niveau 100, et le fil conducteur
// qui relie enfin les vingt-six existantes.
//
// L'histoire ne part pas de rien : elle ramasse ce que le jeu contenait
// déjà. Nihelm, le Dévoreur de Mondes du Néant Scintillant, la Forteresse
// du Temps Brisé, l'Œil du Néant — et le Premier Roi, mentionné nulle part
// ailleurs qu'en creux.
//
// Le fil : Valciel est une RECONSTRUCTION. Le monde s'est achevé une
// première fois, et quelqu'un l'a recousu — mal. Ce que les héros ont
// pris pour des monstres, des fêlures et des gouffres depuis le niveau 1,
// ce sont les points de suture qui lâchent. À l'acte III on le découvre ;
// à l'acte IV on remonte jusqu'au couturier.
// =====================================================================

// ---------------------------------------------------------------------
// Les matériaux des Marches et de la Couture.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'cendre-grise':      { nom: 'Cendre grise', emoji: '🌫️', type: 'materiau', rarete: 'rare', prixVente: 260, desc: 'Elle ne vient d’aucun feu. Elle est là depuis avant les feux.' },
  'echo-fossilise':    { nom: 'Écho fossilisé', emoji: '🔔', type: 'materiau', rarete: 'rare', prixVente: 280, desc: 'Un son qui a duré si longtemps qu’il a durci.' },
  'verre-de-mer':      { nom: 'Verre de mer', emoji: '🔷', type: 'materiau', rarete: 'epique', prixVente: 420, desc: 'L’océan y a été figé en pleine vague. On voit encore l’écume.' },
  'graine-renversee':  { nom: 'Graine renversée', emoji: '🌺', type: 'materiau', rarete: 'epique', prixVente: 440, desc: 'Elle pousse vers le bas. Personne n’a jamais su vers quoi.' },
  'os-divin':          { nom: 'Os divin', emoji: '💀', type: 'materiau', rarete: 'epique', prixVente: 620, desc: 'Trop grand pour un géant, trop fin pour une bête.' },
  'encre-noyee':       { nom: 'Encre noyée', emoji: '🖋️', type: 'materiau', rarete: 'epique', prixVente: 640, desc: 'Elle continue d’écrire sous l’eau, toute seule, très lentement.' },
  'braise-crepusculaire': { nom: 'Braise crépusculaire', emoji: '🌇', type: 'materiau', rarete: 'legendaire', prixVente: 900, desc: 'La dernière lumière d’un jour qui n’a jamais fini de tomber.' },
  'fil-de-suture':     { nom: 'Fil de suture', emoji: '🧵', type: 'materiau', rarete: 'legendaire', prixVente: 950, desc: 'C’est avec ça que le monde tient. Il en manque beaucoup.' },
  'aiguille-premiere': { nom: 'Aiguille première', emoji: '🪡', type: 'materiau', rarete: 'mythique', prixVente: 1600, desc: 'Elle a recousu un monde entier. Elle n’a pas l’air fatiguée.' },
  'eclat-de-couronne': { nom: 'Éclat de couronne', emoji: '👑', type: 'materiau', rarete: 'mythique', prixVente: 1800, desc: 'Le Premier Roi en portait une. Il l’a brisée lui-même.' },
});

Object.assign(FAMILLE_MATERIAU, {
  'cendre-grise': 'mine', 'verre-de-mer': 'mine', 'os-divin': 'mine',
  'braise-crepusculaire': 'mine', 'eclat-de-couronne': 'mine',
  'echo-fossilise': 'peau', 'graine-renversee': 'plante', 'encre-noyee': 'plante',
  'fil-de-suture': 'plante', 'aiguille-premiere': 'peau',
});

// ---------------------------------------------------------------------
// Les monstres : une table compacte, des statistiques calculées.
//
// Écrire quarante blocs de chiffres à la main, c'est quarante occasions
// de se tromper et aucune garantie de cohérence. La courbe est donc
// dérivée de celle des Terres lointaines : à 3,6 % de PV, 1,9 % d'attaque
// et 7,5 % d'XP par niveau, le raccord au niveau 52 est invisible.
// ---------------------------------------------------------------------
const CROISSANCE_MARCHES = { hp: 1.036, atk: 1.019, xp: 1.075, po: 1.05 };
const REFERENCE_MARCHES = { niveau: 52, hp: 2550, atk: 79, xp: 879, po: 52 };

function statsMonstreMarches(niveau, boss) {
  const d = niveau - REFERENCE_MARCHES.niveau;
  const hp = Math.round(REFERENCE_MARCHES.hp * Math.pow(CROISSANCE_MARCHES.hp, d) * (boss ? 4.6 : 1));
  const atk = Math.round(REFERENCE_MARCHES.atk * Math.pow(CROISSANCE_MARCHES.atk, d) * (boss ? 1.35 : 1));
  const xp = Math.round(REFERENCE_MARCHES.xp * Math.pow(CROISSANCE_MARCHES.xp, d) * (boss ? 3.4 : 1));
  const po = Math.round(REFERENCE_MARCHES.po * Math.pow(CROISSANCE_MARCHES.po, d) * (boss ? 6 : 1));
  return { hp, atk, xp, po: [po, po * 2] };
}

// nom · emoji · niveau · initiative · butin · attaques
const BESTIAIRE_MARCHES = {
  // ---------- Acte III · Les Marches Grises (52-58) ----------
  arpenteurGris: { nom: 'Arpenteur gris', emoji: '🚶', niveau: 53, dex: 12,
    drops: [{ id: 'cendre-grise', chance: 0.4 }],
    attaques: [
      { nom: 'Pas sans fin', emoji: '👣', mult: 1.1, poids: 3, type: 'mono' },
      { nom: 'Regard d’avant', emoji: '👁️', mult: 0.85, poids: 1, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ] },
  bornetremblante: { nom: 'Borne tremblante', emoji: '🪨', niveau: 55, dex: 6,
    drops: [{ id: 'cendre-grise', chance: 0.5 }, { id: 'echo-fossilise', chance: 0.2 }],
    attaques: [
      { nom: 'Chute de repère', emoji: '💢', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Effacement', emoji: '🌫️', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.35 } },
    ] },
  gardienDeLaLimite: { nom: 'Gardien de la limite', emoji: '⛩️', niveau: 57, dex: 10,
    drops: [{ id: 'cendre-grise', chance: 0.6 }, { id: 'fil-de-suture', chance: 0.08 }],
    attaques: [
      { nom: 'Refus', emoji: '🛑', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Frontière close', emoji: '⛓️', mult: 0.95, poids: 2, type: 'aoe' },
    ] },
  celuiQuiCompte: { nom: 'Celui Qui Compte', emoji: '🕯️', niveau: 58, boss: true, dex: 13,
    drops: [{ id: 'cendre-grise', chance: 1 }, { id: 'echo-fossilise', chance: 0.8 }],
    attaques: [
      { nom: 'Décompte', emoji: '🔢', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Recensement', emoji: '📋', mult: 0.9, poids: 2, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Rature', emoji: '✖️', mult: 1.6, poids: 1, type: 'mono' },
    ] },

  // ---------- Acte III · Le Chant des Ruines (52-58) ----------
  choeurDePierre: { nom: 'Chœur de pierre', emoji: '🗿', niveau: 53, dex: 7,
    drops: [{ id: 'echo-fossilise', chance: 0.45 }],
    attaques: [
      { nom: 'Note grave', emoji: '🎵', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Accord tenu', emoji: '🎶', mult: 0.8, poids: 2, type: 'aoe' },
    ] },
  veuveDesArcades: { nom: 'Veuve des arcades', emoji: '🕸️', niveau: 55, dex: 14,
    drops: [{ id: 'echo-fossilise', chance: 0.35 }, { id: 'cendre-grise', chance: 0.3 }],
    attaques: [
      { nom: 'Fil tendu', emoji: '🧵', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Berceuse de ruines', emoji: '🌙', mult: 0.75, poids: 1, type: 'aoe', effet: { type: 'poison', degats: 60, duree: 3 } },
    ] },
  refrainRevenant: { nom: 'Refrain revenant', emoji: '👻', niveau: 57, dex: 15,
    drops: [{ id: 'echo-fossilise', chance: 0.55 }],
    attaques: [
      { nom: 'Reprise', emoji: '🔁', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Da capo', emoji: '🎼', mult: 1.5, poids: 1, type: 'mono' },
    ] },
  maitreDeChapelle: { nom: 'Le Maître de Chapelle', emoji: '🎻', niveau: 58, boss: true, dex: 12,
    drops: [{ id: 'echo-fossilise', chance: 1 }, { id: 'fil-de-suture', chance: 0.3 }],
    attaques: [
      { nom: 'Ouverture', emoji: '🎺', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Tutti', emoji: '🎶', mult: 0.95, poids: 2, type: 'aoe' },
      { nom: 'Silence imposé', emoji: '🤫', mult: 1.1, poids: 1, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.5 } },
    ] },

  // ---------- Acte III · La Mer de Verre (60-68) ----------
  vagueFigee: { nom: 'Vague figée', emoji: '🌊', niveau: 61, dex: 9,
    drops: [{ id: 'verre-de-mer', chance: 0.45 }],
    attaques: [
      { nom: 'Déferlante immobile', emoji: '💧', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Éclats', emoji: '🔷', mult: 0.85, poids: 2, type: 'aoe' },
    ] },
  noyeDebout: { nom: 'Noyé debout', emoji: '🧍', niveau: 63, dex: 11,
    drops: [{ id: 'verre-de-mer', chance: 0.35 }, { id: 'encre-noyee', chance: 0.15 }],
    attaques: [
      { nom: 'Étreinte salée', emoji: '🫧', mult: 1.15, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.3 } },
      { nom: 'Marée arrêtée', emoji: '🌀', mult: 0.9, poids: 1, type: 'aoe' },
    ] },
  banquiseVive: { nom: 'Banquise vive', emoji: '🧊', niveau: 66, dex: 7,
    drops: [{ id: 'verre-de-mer', chance: 0.6 }],
    attaques: [
      { nom: 'Fracture', emoji: '💢', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Craquement long', emoji: '❄️', mult: 0.95, poids: 2, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
    ] },
  celleQuiNaJamaisCoule: { nom: 'Celle Qui N’a Jamais Coulé', emoji: '⛵', niveau: 68, boss: true, dex: 13,
    drops: [{ id: 'verre-de-mer', chance: 1 }, { id: 'fil-de-suture', chance: 0.4 }],
    attaques: [
      { nom: 'Étrave', emoji: '⚓', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Sillage de verre', emoji: '🔷', mult: 0.95, poids: 2, type: 'aoe' },
      { nom: 'Appel du fond', emoji: '🕳️', mult: 1.55, poids: 1, type: 'mono', effet: { type: 'drain', part: 0.4 } },
    ] },

  // ---------- Acte III · Les Jardins Renversés (60-68) ----------
  ronceInversee: { nom: 'Ronce inversée', emoji: '🌿', niveau: 61, dex: 8,
    drops: [{ id: 'graine-renversee', chance: 0.45 }],
    attaques: [
      { nom: 'Racine au ciel', emoji: '🌱', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Étranglement lent', emoji: '🪢', mult: 0.85, poids: 1, type: 'mono', effet: { type: 'poison', degats: 70, duree: 3 } },
    ] },
  jardinierSansTete: { nom: 'Jardinier sans tête', emoji: '🪓', niveau: 64, dex: 12,
    drops: [{ id: 'graine-renversee', chance: 0.4 }, { id: 'echo-fossilise', chance: 0.2 }],
    attaques: [
      { nom: 'Taille', emoji: '✂️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Élagage', emoji: '🍂', mult: 0.9, poids: 2, type: 'aoe' },
    ] },
  fleurQuiRegarde: { nom: 'Fleur qui regarde', emoji: '🌺', niveau: 66, dex: 10,
    drops: [{ id: 'graine-renversee', chance: 0.55 }],
    attaques: [
      { nom: 'Pollen fixe', emoji: '🌼', mult: 0.9, poids: 2, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Éclosion brusque', emoji: '💥', mult: 1.45, poids: 1, type: 'mono' },
    ] },
  grandMereRonce: { nom: 'Grand-Mère Ronce', emoji: '🥀', niveau: 68, boss: true, dex: 9,
    drops: [{ id: 'graine-renversee', chance: 1 }, { id: 'fil-de-suture', chance: 0.4 }],
    attaques: [
      { nom: 'Sarment maternel', emoji: '🌿', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Ronceraie', emoji: '🥀', mult: 0.95, poids: 2, type: 'aoe', effet: { type: 'poison', degats: 90, duree: 3 } },
      { nom: 'Ce qui repousse', emoji: '💚', valeur: 900, poids: 1, type: 'soin' },
    ] },

  // ---------- Acte III · L'Ossuaire des Dieux (70-78) ----------
  reliquaireMarcheur: { nom: 'Reliquaire marcheur', emoji: '⚱️', niveau: 71, dex: 8,
    drops: [{ id: 'os-divin', chance: 0.4 }],
    attaques: [
      { nom: 'Procession', emoji: '🕯️', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Litanie brisée', emoji: '📿', mult: 0.9, poids: 2, type: 'aoe' },
    ] },
  cotesDuCiel: { nom: 'Côtes du ciel', emoji: '🦴', niveau: 74, dex: 6,
    drops: [{ id: 'os-divin', chance: 0.5 }],
    attaques: [
      { nom: 'Cage', emoji: '⛓️', mult: 1.15, poids: 3, type: 'mono', effet: { type: 'etourdi', duree: 1, chance: 0.3 } },
      { nom: 'Effondrement', emoji: '💢', mult: 1.55, poids: 1, type: 'mono' },
    ] },
  prieurDuVide: { nom: 'Prieur du vide', emoji: '🙏', niveau: 76, dex: 13,
    drops: [{ id: 'os-divin', chance: 0.45 }, { id: 'fil-de-suture', chance: 0.12 }],
    attaques: [
      { nom: 'Oraison creuse', emoji: '🕳️', mult: 1.2, poids: 3, type: 'mono', effet: { type: 'drain', part: 0.35 } },
      { nom: 'Absolution forcée', emoji: '✨', mult: 0.95, poids: 2, type: 'aoe' },
    ] },
  leDieuRecousu: { nom: 'Le Dieu Recousu', emoji: '💀', niveau: 78, boss: true, dex: 11,
    drops: [{ id: 'os-divin', chance: 1 }, { id: 'aiguille-premiere', chance: 0.15 }],
    attaques: [
      { nom: 'Main d’avant', emoji: '🖐️', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Ce qui dépasse', emoji: '🧵', mult: 1.0, poids: 2, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Point de rupture', emoji: '✂️', mult: 1.7, poids: 1, type: 'mono' },
    ] },

  // ---------- Acte III · La Bibliothèque Noyée (70-78) ----------
  copisteNoye: { nom: 'Copiste noyé', emoji: '🖋️', niveau: 71, dex: 12,
    drops: [{ id: 'encre-noyee', chance: 0.45 }],
    attaques: [
      { nom: 'Rature', emoji: '✖️', mult: 1.15, poids: 3, type: 'mono' },
      { nom: 'Note en marge', emoji: '📝', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
    ] },
  rayonnageVorace: { nom: 'Rayonnage vorace', emoji: '📚', niveau: 74, dex: 5,
    drops: [{ id: 'encre-noyee', chance: 0.4 }, { id: 'os-divin', chance: 0.15 }],
    attaques: [
      { nom: 'Refermement', emoji: '📕', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Avalanche de tomes', emoji: '📖', mult: 0.9, poids: 2, type: 'aoe' },
    ] },
  indexVivant: { nom: 'Index vivant', emoji: '🗂️', niveau: 76, dex: 15,
    drops: [{ id: 'encre-noyee', chance: 0.55 }],
    attaques: [
      { nom: 'Renvoi', emoji: '↩️', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Table des matières', emoji: '📑', mult: 0.95, poids: 2, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ] },
  archivisteDesFins: { nom: 'L’Archiviste des Fins', emoji: '📜', niveau: 78, boss: true, dex: 14,
    drops: [{ id: 'encre-noyee', chance: 1 }, { id: 'aiguille-premiere', chance: 0.15 }],
    attaques: [
      { nom: 'Citation exacte', emoji: '❝', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Version antérieure', emoji: '🔙', mult: 1.0, poids: 2, type: 'aoe' },
      { nom: 'Errata', emoji: '✏️', mult: 1.65, poids: 1, type: 'mono', effet: { type: 'affaibli', duree: 3 } },
    ] },

  // ---------- Acte IV · Le Rempart du Crépuscule (80-88) ----------
  sentinelleDuSoir: { nom: 'Sentinelle du soir', emoji: '🌇', niveau: 81, dex: 11,
    drops: [{ id: 'braise-crepusculaire', chance: 0.35 }],
    attaques: [
      { nom: 'Dernière ronde', emoji: '🔦', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Couvre-feu', emoji: '🔕', mult: 0.9, poids: 2, type: 'aoe', effet: { type: 'affaibli', duree: 2 } },
    ] },
  porteurDeLanterne: { nom: 'Porteur de lanterne', emoji: '🏮', niveau: 84, dex: 13,
    drops: [{ id: 'braise-crepusculaire', chance: 0.4 }],
    attaques: [
      { nom: 'Lumière tenue', emoji: '💡', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Éblouissement', emoji: '✨', mult: 0.95, poids: 2, type: 'aoe' },
    ] },
  brecheAmbulante: { nom: 'Brèche ambulante', emoji: '🕳️', niveau: 86, dex: 9,
    drops: [{ id: 'braise-crepusculaire', chance: 0.45 }, { id: 'fil-de-suture', chance: 0.2 }],
    attaques: [
      { nom: 'Déchirure', emoji: '✂️', mult: 1.35, poids: 3, type: 'mono' },
      { nom: 'Ce qui passe au travers', emoji: '🌌', mult: 1.0, poids: 2, type: 'aoe', effet: { type: 'drain', part: 0.3 } },
    ] },
  capitaineDuDernierSoir: { nom: 'Le Capitaine du Dernier Soir', emoji: '🌆', niveau: 88, boss: true, dex: 12,
    drops: [{ id: 'braise-crepusculaire', chance: 1 }, { id: 'aiguille-premiere', chance: 0.25 }],
    attaques: [
      { nom: 'Ordre tenu', emoji: '⚔️', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Le mur ne cède pas', emoji: '🧱', mult: 1.0, poids: 2, type: 'aoe' },
      { nom: 'Relève impossible', emoji: '🕯️', mult: 1.7, poids: 1, type: 'mono' },
    ] },

  // ---------- Acte IV · Les Terres Recousues (80-88) ----------
  cousuVivant: { nom: 'Cousu vivant', emoji: '🧵', niveau: 81, dex: 10,
    drops: [{ id: 'fil-de-suture', chance: 0.35 }],
    attaques: [
      { nom: 'Point serré', emoji: '🪡', mult: 1.2, poids: 3, type: 'mono' },
      { nom: 'Ça tire', emoji: '😬', mult: 0.9, poids: 1, type: 'mono', effet: { type: 'poison', degats: 130, duree: 3 } },
    ] },
  paysageEnDouble: { nom: 'Paysage en double', emoji: '🪞', niveau: 84, dex: 12,
    drops: [{ id: 'fil-de-suture', chance: 0.3 }, { id: 'graine-renversee', chance: 0.25 }],
    attaques: [
      { nom: 'Répétition', emoji: '🔁', mult: 1.25, poids: 3, type: 'mono' },
      { nom: 'Superposition', emoji: '🌫️', mult: 0.95, poids: 2, type: 'aoe' },
    ] },
  raccordRate: { nom: 'Raccord raté', emoji: '🩹', niveau: 86, dex: 14,
    drops: [{ id: 'fil-de-suture', chance: 0.45 }],
    attaques: [
      { nom: 'Couture qui lâche', emoji: '✂️', mult: 1.35, poids: 3, type: 'mono' },
      { nom: 'Bord à vif', emoji: '🩸', mult: 1.0, poids: 2, type: 'aoe', effet: { type: 'poison', degats: 150, duree: 2 } },
    ] },
  laCouturiere: { nom: 'La Couturière', emoji: '🪡', niveau: 88, boss: true, dex: 15,
    drops: [{ id: 'fil-de-suture', chance: 1 }, { id: 'aiguille-premiere', chance: 0.3 }],
    attaques: [
      { nom: 'Reprise à l’aiguille', emoji: '🪡', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Ourlet', emoji: '🧵', mult: 1.0, poids: 2, type: 'aoe' },
      { nom: 'Elle défait', emoji: '↩️', mult: 1.75, poids: 1, type: 'mono', effet: { type: 'affaibli', duree: 3 } },
    ] },

  // ---------- Acte IV · La Couture du Monde (90-100) ----------
  gardeDeLaCouture: { nom: 'Garde de la Couture', emoji: '⚔️', niveau: 91, dex: 13,
    drops: [{ id: 'aiguille-premiere', chance: 0.2 }, { id: 'fil-de-suture', chance: 0.5 }],
    attaques: [
      { nom: 'Devoir', emoji: '🛡️', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Serment tenu', emoji: '📜', mult: 1.0, poids: 2, type: 'aoe' },
    ] },
  pointDeRupture: { nom: 'Point de rupture', emoji: '💢', niveau: 94, dex: 11,
    drops: [{ id: 'aiguille-premiere', chance: 0.25 }],
    attaques: [
      { nom: 'Ça craque', emoji: '⚡', mult: 1.4, poids: 3, type: 'mono' },
      { nom: 'Propagation', emoji: '🕸️', mult: 1.05, poids: 2, type: 'aoe' },
    ] },
  memoireDuMondeAncien: { nom: 'Mémoire du monde ancien', emoji: '🌍', niveau: 97, dex: 12,
    drops: [{ id: 'aiguille-premiere', chance: 0.3 }, { id: 'eclat-de-couronne', chance: 0.1 }],
    attaques: [
      { nom: 'Ce qui était avant', emoji: '🕰️', mult: 1.35, poids: 3, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Retour de vague', emoji: '🌊', mult: 1.1, poids: 2, type: 'aoe' },
    ] },
  laDerniereSuture: { nom: 'La Dernière Suture', emoji: '🪡', niveau: 100, boss: true, dex: 14,
    drops: [{ id: 'aiguille-premiere', chance: 1 }, { id: 'eclat-de-couronne', chance: 0.6 }],
    attaques: [
      { nom: 'Elle cède', emoji: '✂️', mult: 1.35, poids: 3, type: 'mono' },
      { nom: 'Tout se défait', emoji: '🌌', mult: 1.1, poids: 2, type: 'aoe' },
      { nom: 'Le monde retient son souffle', emoji: '🫁', mult: 1.85, poids: 1, type: 'mono' },
    ] },

  // ---------- Acte IV · Le Trône du Premier Roi (90-100) ----------
  heraultSansVoix: { nom: 'Héraut sans voix', emoji: '📯', niveau: 91, dex: 14,
    drops: [{ id: 'eclat-de-couronne', chance: 0.15 }],
    attaques: [
      { nom: 'Annonce muette', emoji: '🤐', mult: 1.3, poids: 3, type: 'mono' },
      { nom: 'Protocole', emoji: '📜', mult: 1.0, poids: 2, type: 'aoe', effet: { type: 'etourdi', duree: 1, chance: 0.25 } },
    ] },
  conseillerDeLaPremiereHeure: { nom: 'Conseiller de la première heure', emoji: '🎭', niveau: 94, dex: 12,
    drops: [{ id: 'eclat-de-couronne', chance: 0.2 }],
    attaques: [
      { nom: 'Mauvais conseil', emoji: '🗣️', mult: 1.35, poids: 3, type: 'mono', effet: { type: 'affaibli', duree: 2 } },
      { nom: 'Cabale', emoji: '🕯️', mult: 1.05, poids: 2, type: 'aoe' },
    ] },
  ombreCouronnee: { nom: 'Ombre couronnée', emoji: '👤', niveau: 97, dex: 15,
    drops: [{ id: 'eclat-de-couronne', chance: 0.3 }, { id: 'aiguille-premiere', chance: 0.15 }],
    attaques: [
      { nom: 'Ce qu’il fut', emoji: '👑', mult: 1.4, poids: 3, type: 'mono' },
      { nom: 'Ce qu’il refuse d’être', emoji: '🖤', mult: 1.1, poids: 2, type: 'aoe', effet: { type: 'drain', part: 0.35 } },
    ] },
  lePremierRoi: { nom: 'Le Premier Roi', emoji: '👑', niveau: 100, boss: true, dex: 16,
    drops: [{ id: 'eclat-de-couronne', chance: 1 }, { id: 'aiguille-premiere', chance: 1 }],
    attaques: [
      { nom: 'Décret', emoji: '📜', mult: 1.4, poids: 3, type: 'mono' },
      { nom: 'Le monde lui obéit encore', emoji: '🌍', mult: 1.15, poids: 2, type: 'aoe' },
      { nom: 'Recommencer', emoji: '🪡', mult: 1.9, poids: 1, type: 'mono', effet: { type: 'drain', part: 0.4 } },
    ] },
};

// Les statistiques se calculent une fois, à l'enregistrement.
Object.entries(BESTIAIRE_MARCHES).forEach(([cle, def]) => {
  MONSTRES[cle] = { ...def, ...statsMonstreMarches(def.niveau, def.boss) };
});

// ---------------------------------------------------------------------
// Les dix cartes. Chacune porte un morceau du fil conducteur : les
// descriptions se lisent dans l'ordre et racontent la découverte.
// ---------------------------------------------------------------------
ZONES.push(
  {
    id: 'marches-grises', nom: 'Les Marches Grises', emoji: '🌫️', niveauMin: 52, plage: 'niv. 52-58 · équipe conseillée',
    desc: 'Au-delà de la dernière carte connue, le paysage cesse de se décider. Les bornes changent de place, la cendre ne vient d’aucun feu — et les voyageurs qu’on y croise marchent tous dans la même direction, sans savoir laquelle.',
    monstres: ['arpenteurGris', 'bornetremblante', 'gardienDeLaLimite'], boss: 'celuiQuiCompte',
    recolte: [{ id: 'cendre-grise', chance: 0.8 }, { id: 'echo-fossilise', chance: 0.35 }],
  },
  {
    id: 'chant-ruines', nom: 'Le Chant des Ruines', emoji: '🏚️', niveauMin: 52, plage: 'niv. 52-58 · équipe conseillée',
    desc: 'Une cité dont il ne reste que l’acoustique. Les murs sont tombés, la musique est restée : elle rejoue chaque soir un concert que personne n’a donné. Les pierres, elles, se souviennent d’un autre plan que celui d’aujourd’hui.',
    monstres: ['choeurDePierre', 'veuveDesArcades', 'refrainRevenant'], boss: 'maitreDeChapelle',
    recolte: [{ id: 'echo-fossilise', chance: 0.8 }, { id: 'cendre-grise', chance: 0.4 }],
  },
  {
    id: 'mer-de-verre', nom: 'La Mer de Verre', emoji: '🔷', niveauMin: 60, plage: 'niv. 60-68 · équipe conseillée',
    desc: 'Un océan arrêté en pleine vague, il y a si longtemps que l’écume est devenue de la pierre. On marche dessus. Dessous, on distingue des villes — et elles ne ressemblent à aucune ville de Valciel.',
    monstres: ['vagueFigee', 'noyeDebout', 'banquiseVive'], boss: 'celleQuiNaJamaisCoule',
    recolte: [{ id: 'verre-de-mer', chance: 0.8 }, { id: 'encre-noyee', chance: 0.3 }],
  },
  {
    id: 'jardins-renverses', nom: 'Les Jardins Renversés', emoji: '🌺', niveauMin: 60, plage: 'niv. 60-68 · équipe conseillée',
    desc: 'Ici tout pousse à l’envers : les racines vers le ciel, les fleurs vers la terre. Les jardiniers entretiennent encore les allées. Interrogés, ils répondent qu’ils attendent que le monde soit remis à l’endroit — et qu’ils attendent depuis longtemps.',
    monstres: ['ronceInversee', 'jardinierSansTete', 'fleurQuiRegarde'], boss: 'grandMereRonce',
    recolte: [{ id: 'graine-renversee', chance: 0.8 }, { id: 'echo-fossilise', chance: 0.3 }],
  },
  {
    id: 'ossuaire-dieux', nom: 'L’Ossuaire des Dieux', emoji: '💀', niveauMin: 70, plage: 'niv. 70-78 · équipe requise',
    desc: 'Des ossements trop grands pour des géants, trop fins pour des bêtes, alignés comme dans un atelier. Aucun n’est complet. Tous portent des coutures — et ce sont les mêmes points que ceux qu’on a vus, en plus petit, sur les fêlures des Terres lointaines.',
    monstres: ['reliquaireMarcheur', 'cotesDuCiel', 'prieurDuVide'], boss: 'leDieuRecousu',
    recolte: [{ id: 'os-divin', chance: 0.8 }, { id: 'fil-de-suture', chance: 0.2 }],
  },
  {
    id: 'bibliotheque-noyee', nom: 'La Bibliothèque Noyée', emoji: '📚', niveauMin: 70, plage: 'niv. 70-78 · équipe requise',
    desc: 'Tout le savoir d’avant, sous trois mètres d’eau immobile. Les livres s’y lisent encore. Le catalogue est complet, méthodique — et il recense sept versions du monde. Valciel porte le numéro sept.',
    monstres: ['copisteNoye', 'rayonnageVorace', 'indexVivant'], boss: 'archivisteDesFins',
    recolte: [{ id: 'encre-noyee', chance: 0.8 }, { id: 'os-divin', chance: 0.3 }],
  },
  {
    id: 'rempart-crepuscule', nom: 'Le Rempart du Crépuscule', emoji: '🌇', niveauMin: 80, plage: 'niv. 80-88 · équipe requise',
    desc: 'Un mur sans fin, bâti face au vide, où le soleil tombe sans jamais se coucher. La garnison tient depuis la première reconstruction. Elle n’a reçu aucun ordre depuis, et elle n’en attend plus : elle sait ce qu’il y a de l’autre côté.',
    monstres: ['sentinelleDuSoir', 'porteurDeLanterne', 'brecheAmbulante'], boss: 'capitaineDuDernierSoir',
    recolte: [{ id: 'braise-crepusculaire', chance: 0.8 }, { id: 'fil-de-suture', chance: 0.35 }],
  },
  {
    id: 'terres-recousues', nom: 'Les Terres Recousues', emoji: '🧵', niveauMin: 80, plage: 'niv. 80-88 · équipe requise',
    desc: 'Des morceaux de pays cousus les uns aux autres : une plaine contre une falaise, un fleuve qui s’arrête net contre un désert. Les points sont visibles à l’œil nu. Certains lâchent. C’est de là que sortait tout ce qu’on a combattu depuis le premier jour.',
    monstres: ['cousuVivant', 'paysageEnDouble', 'raccordRate'], boss: 'laCouturiere',
    recolte: [{ id: 'fil-de-suture', chance: 0.85 }, { id: 'graine-renversee', chance: 0.3 }],
  },
  {
    id: 'couture-monde', nom: 'La Couture du Monde', emoji: '🪡', niveauMin: 90, plage: 'niv. 90-100 · équipe requise',
    desc: 'La suture maîtresse, celle qui tient les six mondes précédents ensemble sous celui-ci. Elle est en train de céder. Ce n’est pas une menace : c’est un compte à rebours, et il a commencé bien avant votre naissance.',
    monstres: ['gardeDeLaCouture', 'pointDeRupture', 'memoireDuMondeAncien'], boss: 'laDerniereSuture',
    recolte: [{ id: 'fil-de-suture', chance: 0.9 }, { id: 'aiguille-premiere', chance: 0.25 }],
  },
  {
    id: 'trone-premier-roi', nom: 'Le Trône du Premier Roi', emoji: '👑', niveauMin: 90, plage: 'niv. 90-100 · le dernier pas',
    desc: 'Au bout de la Couture, une salle du trône bâtie avant Valciel. Celui qui y siège n’est pas un tyran : c’est le couturier. Il a recousu le monde six fois, il s’apprête à recommencer, et il n’a jamais demandé à personne s’il fallait continuer.',
    monstres: ['heraultSansVoix', 'conseillerDeLaPremiereHeure', 'ombreCouronnee'], boss: 'lePremierRoi',
    recolte: [{ id: 'eclat-de-couronne', chance: 0.6 }, { id: 'aiguille-premiere', chance: 0.4 }],
  },
);

// ---------------------------------------------------------------------
// Les trophées des dix nouveaux boss.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'sablier-du-compteur':  { nom: 'Sablier du Compteur', emoji: '⏳', type: 'equipement', slot: 'accessoire', niveau: 58, rarete: 'legendaire', prixVente: 1400, bonus: { int: 16, esp: 10, celerite: 6 }, desc: 'Trophée de Celui Qui Compte. Il compte encore, mais plus les mêmes choses.' },
  'diapason-fele':        { nom: 'Diapason fêlé', emoji: '🎻', type: 'equipement', slot: 'accessoire', niveau: 58, rarete: 'legendaire', prixVente: 1400, bonus: { dex: 16, cha: 8, crit: 7 }, desc: 'Trophée du Maître de Chapelle. Il donne le la d’un monde disparu.' },
  'quille-de-verre':      { nom: 'Quille de verre', emoji: '⛵', type: 'equipement', slot: 'arme', familleArme: 'lame', niveau: 68, rarete: 'legendaire', prixVente: 2200, bonus: { for: 26, vit: 12, deter: 8 }, desc: 'Trophée de Celle Qui N’a Jamais Coulé. Taillée dans une étrave qui n’a jamais touché l’eau.' },
  'couronne-de-ronces':   { nom: 'Couronne de ronces', emoji: '🥀', type: 'equipement', slot: 'tete', armure: 'tissu', niveau: 68, rarete: 'legendaire', prixVente: 2200, bonus: { esp: 24, vit: 10, piete: 12 }, desc: 'Trophée de Grand-Mère Ronce. Elle pique celui qui la porte, et personne d’autre.' },
  'phalange-divine':      { nom: 'Phalange divine', emoji: '🦴', type: 'equipement', slot: 'arme', familleArme: 'runique', niveau: 78, rarete: 'mythique', prixVente: 3400, bonus: { int: 32, vit: 14, direct: 10 }, desc: 'Trophée du Dieu Recousu. Un seul doigt, et il pèse le poids d’un culte.' },
  'index-des-fins':       { nom: 'Index des Fins', emoji: '📜', type: 'equipement', slot: 'accessoire', niveau: 78, rarete: 'mythique', prixVente: 3400, bonus: { int: 22, esp: 16, crit: 9, piete: 10 }, desc: 'Trophée de l’Archiviste. Il liste les six fins précédentes. La septième est en blanc.' },
  'lanterne-du-dernier-soir': { nom: 'Lanterne du Dernier Soir', emoji: '🏮', type: 'equipement', slot: 'accessoire', niveau: 88, rarete: 'mythique', prixVente: 4800, bonus: { vit: 28, for: 18, tenacite: 12 }, desc: 'Trophée du Capitaine. Elle éclaire encore un poste que plus personne ne relève.' },
  'de-a-coudre-de-fer':   { nom: 'Dé à coudre de fer', emoji: '🪡', type: 'equipement', slot: 'mains', armure: 'maille', niveau: 88, rarete: 'mythique', prixVente: 4800, bonus: { int: 26, dex: 16, deter: 12 }, desc: 'Trophée de la Couturière. Il protège un doigt qui a recousu des continents.' },
  'aiguille-de-la-fin':   { nom: 'Aiguille de la Fin', emoji: '🪡', type: 'equipement', slot: 'arme', familleArme: 'runique', niveau: 100, rarete: 'divin', prixVente: 9000, bonus: { int: 44, esp: 24, vit: 20, crit: 12, deter: 12 }, desc: 'Trophée de la Dernière Suture. Ce qu’elle traverse ne se referme plus.' },
  'couronne-du-premier-roi': { nom: 'Couronne du Premier Roi', emoji: '👑', type: 'equipement', slot: 'tete', armure: 'plaque', niveau: 100, rarete: 'divin', prixVente: 9500, bonus: { for: 34, vit: 34, esp: 20, tenacite: 15, deter: 12 }, desc: 'Il l’avait brisée lui-même, six mondes plus tôt. Elle a tenu quand même.' },
});

Object.assign(COFFRES_BOSS, {
  celuiQuiCompte: 'sablier-du-compteur',
  maitreDeChapelle: 'diapason-fele',
  celleQuiNaJamaisCoule: 'quille-de-verre',
  grandMereRonce: 'couronne-de-ronces',
  leDieuRecousu: 'phalange-divine',
  archivisteDesFins: 'index-des-fins',
  capitaineDuDernierSoir: 'lanterne-du-dernier-soir',
  laCouturiere: 'de-a-coudre-de-fer',
  laDerniereSuture: 'aiguille-de-la-fin',
  lePremierRoi: 'couronne-du-premier-roi',
});

// ---------------------------------------------------------------------
// Artisanat des Marches : les raffinés et les grandes séries de la fin.
// ---------------------------------------------------------------------
Object.assign(OBJETS, {
  'acier-de-suture':  { nom: 'Acier de suture', emoji: '⚙️', type: 'materiau', rarete: 'legendaire', prixVente: 1500, desc: 'Fondu autour d’un fil de suture. Il tient tout ce qu’on lui confie.' },
  'toile-des-fins':   { nom: 'Toile des Fins', emoji: '🕸️', type: 'materiau', rarete: 'legendaire', prixVente: 1500, desc: 'Tissée d’encre noyée et de graines renversées. Elle se lit, un peu.' },
  'essence-du-septieme': { nom: 'Essence du Septième', emoji: '7️⃣', type: 'materiau', rarete: 'divin', prixVente: 4200, desc: 'Ce qui reste du septième monde une fois qu’on a tout retiré. C’est nous.' },
});

Object.assign(FAMILLE_MATERIAU, {
  'acier-de-suture': 'mine', 'toile-des-fins': 'plante', 'essence-du-septieme': 'peau',
});

[
  { resultat: 'acier-de-suture', niveau: 62, po: 900, materiaux: { 'cendre-grise': 4, 'verre-de-mer': 3, 'fil-de-suture': 1 } },
  { resultat: 'toile-des-fins', niveau: 72, po: 1100, materiaux: { 'encre-noyee': 4, 'graine-renversee': 3, 'echo-fossilise': 2 } },
  { resultat: 'essence-du-septieme', niveau: 92, po: 3200, materiaux: { 'aiguille-premiere': 2, 'eclat-de-couronne': 1, 'braise-crepusculaire': 3 } },
].forEach((recette) => RECETTES.push(recette));

// Quatre séries pour la fin du voyage — une par acte, plus celle du Roi.
SETS_CRAFT.push(
  { suffixe: 'des Marches', armure: 'cuir', niveau: 58, rarete: 'legendaire', po: 2600, materiaux: { 'acier-de-suture': 1, 'cendre-grise': 4, 'echo-fossilise': 3 } },
  { suffixe: 'de Verre', armure: 'tissu', niveau: 68, rarete: 'mythique', po: 4200, materiaux: { 'acier-de-suture': 2, 'verre-de-mer': 4, 'graine-renversee': 3 } },
  { suffixe: 'des Fins', armure: 'maille', niveau: 78, rarete: 'mythique', po: 6500, materiaux: { 'toile-des-fins': 2, 'os-divin': 4, 'encre-noyee': 3 } },
  { suffixe: 'du Crépuscule', armure: 'plaque', niveau: 88, rarete: 'divin', po: 11000, materiaux: { 'toile-des-fins': 2, 'acier-de-suture': 3, 'braise-crepusculaire': 4 } },
  { suffixe: 'du Premier Roi', armure: 'plaque', niveau: 100, rarete: 'divin', po: 22000, materiaux: { 'essence-du-septieme': 2, 'aiguille-premiere': 3, 'eclat-de-couronne': 2 } },
);

// Les séries ajoutées après coup doivent repasser par le générateur de
// pièces : il tourne à la fin de objets-craft.js, avant ce fichier.
construireSeriesCraft(SETS_CRAFT.slice(-5));
RECETTES.sort((a, b) => a.niveau - b.niveau);
