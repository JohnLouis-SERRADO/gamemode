'use strict';

// =====================================================================
// Générateurs : butin d'aventure et catalogue du marchand
// =====================================================================

// =====================================================================
// Butin d'aventure généré : ~1500 équipements introuvables en boutique.
// Ils tombent des coffres de boss, de la Tour et des contrats de guilde.
// Pour chaque archétype × niveau × rareté disponible, deux variantes.
// =====================================================================
// --- Les armes : une famille par manière de se battre ----------------
const ARCHETYPES_ARMES = [
  { cle: 'epee',     noms: ['Épée', 'Hache', 'Masse'],            emoji: '⚔️', familleArme: 'lame',    principal: 'for', secondaire: 'vit' },
  { cle: 'pavois',   noms: ['Pavois', 'Écu', 'Targe'],            emoji: '🛡️', familleArme: 'pavois',  principal: 'vit', secondaire: 'for' },
  { cle: 'arc',      noms: ['Arc', 'Dague', 'Arbalète'],          emoji: '🏹', familleArme: 'arc',     principal: 'dex', secondaire: 'for' },
  { cle: 'baton',    noms: ['Bâton', 'Sceptre', 'Orbe'],          emoji: '🪄', familleArme: 'baton',   principal: 'int', secondaire: 'cha' },
  { cle: 'calice',   noms: ['Calice', 'Canne', 'Crosse'],         emoji: '🕊️', familleArme: 'calice',  principal: 'esp', secondaire: 'int' },
  { cle: 'runique',  noms: ['Lame runique', 'Faux', 'Estoc gravé'], emoji: '🌑', familleArme: 'runique', principal: 'int', secondaire: 'vit' },
];

// --- Les armures : chaque emplacement décliné en quatre matières ------
//
// C'est le cœur de la correction : le même emplacement existe désormais
// en tissu, cuir, maille et plaque, avec des noms et des statistiques qui
// disent tout de suite à qui la pièce est destinée.
const PIECES_ARMURE = [
  { cle: 'tete',   slot: 'tete',   emoji: '🪖', noms: { tissu: ['Capuche', 'Chapeau', 'Diadème'], cuir: ['Bandeau', 'Capuchon', 'Serre-tête'], maille: ['Coiffe', 'Camail', 'Cervelière'], plaque: ['Heaume', 'Casque', 'Armet'] } },
  { cle: 'torse',  slot: 'torse',  emoji: '👕', noms: { tissu: ['Tunique', 'Robe', 'Chasuble'], cuir: ['Justaucorps', 'Brigandine', 'Veste'], maille: ['Haubert', 'Cotte', 'Broigne'], plaque: ['Cuirasse', 'Plastron', 'Harnois'] } },
  { cle: 'mains',  slot: 'mains',  emoji: '🧤', noms: { tissu: ['Mitaines', 'Manchettes', 'Bandes'], cuir: ['Gants', 'Poignets', 'Brassards'], maille: ['Gantelets gravés', 'Mailles de main', 'Serres'], plaque: ['Gantelets', 'Canons d’avant-bras', 'Poings d’acier'] } },
  { cle: 'jambes', slot: 'jambes', emoji: '👖', noms: { tissu: ['Chausses', 'Pantalon', 'Jupe'], cuir: ['Braies', 'Cuissardes', 'Culotte'], maille: ['Chausses de mailles', 'Jambières tressées', 'Cuissots'], plaque: ['Grèves', 'Cuissards', 'Tassettes'] } },
  { cle: 'pieds',  slot: 'pieds',  emoji: '🥾', noms: { tissu: ['Sandales', 'Chaussons', 'Escarpins'], cuir: ['Bottes', 'Souliers', 'Mocassins'], maille: ['Solerets', 'Bottes cloutées', 'Chausses ferrées'], plaque: ['Solerets d’acier', 'Sabatons', 'Bottes de plates'] } },
];

// Statistique dominante et défensive de chaque matière.
const PROFIL_ARMURE = {
  tissu:  { principal: 'int', secondaire: 'esp', defensif: 'piete' },
  cuir:   { principal: 'dex', secondaire: 'vit', defensif: 'celerite' },
  maille: { principal: 'int', secondaire: 'vit', defensif: 'deter' },
  plaque: { principal: 'vit', secondaire: 'for', defensif: 'tenacite' },
};

// --- Les accessoires : sans matière, ils vont à tout le monde ---------
const ARCHETYPES_ACCESSOIRES = [
  { cle: 'anneau',   noms: ['Anneau', 'Sceau', 'Chevalière'],    emoji: '💍', slot: 'accessoire', principal: 'cha', secondaire: 'dex' },
  { cle: 'amulette', noms: ['Amulette', 'Pendentif', 'Relique'], emoji: '📿', slot: 'accessoire', principal: 'int', secondaire: 'cha' },
  { cle: 'talisman', noms: ['Talisman', 'Fétiche', 'Gri-gri'],   emoji: '🧿', slot: 'accessoire', principal: 'esp', secondaire: 'vit' },
];

// La liste complète, à plat : armes + armures typées + accessoires.
const ARCHETYPES_BUTIN = [
  ...ARCHETYPES_ARMES.map((a) => ({ ...a, slot: 'arme' })),
  ...PIECES_ARMURE.flatMap((piece) => Object.keys(CATEGORIES_ARMURE).map((matiere) => ({
    cle: `${piece.cle}-${matiere}`,
    noms: piece.noms[matiere],
    emoji: CATEGORIES_ARMURE[matiere].emoji,
    slot: piece.slot,
    armure: matiere,
    ...PROFIL_ARMURE[matiere],
  }))),
  ...ARCHETYPES_ACCESSOIRES,
];

// =====================================================================
// v19 — Les sous-caractéristiques du butin.
//
// Elles ne sont pas distribuées au hasard : chaque emplacement a son
// tempérament, et la rareté décide COMBIEN il en porte, pas lesquelles.
// C'est ce qui fait qu'un anneau épique se compare à un autre anneau
// épique, et qu'on hésite entre deux pièces au lieu de lire un seul chiffre.
// =====================================================================
const SOUS_CARACS_PAR_SLOT = {
  arme:       ['crit', 'direct', 'deter'],
  tete:       ['deter', 'piete', 'tenacite'],
  torse:      ['tenacite', 'deter', 'piete'],
  mains:      ['direct', 'crit', 'tenacite'],
  jambes:     ['deter', 'celerite', 'tenacite'],
  pieds:      ['celerite', 'direct', 'crit'],
  accessoire: ['crit', 'piete', 'celerite', 'deter'],
};

// Combien de sous-caractéristiques par rareté. Le commun n'en porte aucune :
// c'est ce qui rend la première pièce rare mémorable.
const NB_SOUS_CARACS = { commun: 0, inhabituel: 0, rare: 1, epique: 2, legendaire: 2, mythique: 3, divin: 3 };

// Ajoute au bonus les sous-caractéristiques dues à la pièce. `decalage`
// fait tourner la sélection pour que deux variantes ne soient pas jumelles.
function ajouterSousCaracs(bonus, slot, niveau, rarete, decalage = 0) {
  const disponibles = SOUS_CARACS_PAR_SLOT[slot] || SOUS_CARACS_PAR_SLOT.accessoire;
  const combien = Math.min(NB_SOUS_CARACS[rarete] || 0, disponibles.length);
  const mult = MULT_RARETE_BUTIN[rarete] || 1;
  for (let i = 0; i < combien; i++) {
    const cle = disponibles[(decalage + i) % disponibles.length];
    const valeur = Math.max(1, Math.round((1 + niveau * 0.11) * mult));
    bonus[cle] = (bonus[cle] || 0) + Math.min(valeur, PLAFONDS_SOUS_CARACS[cle]);
  }
  return bonus;
}

// Qualificatifs sans accord de genre (formes en « de/du/des »).
const QUALIFICATIFS_BUTIN = {
  commun:     ['de recrue', 'd’apprenti', 'de fortune'],
  inhabituel: ['de vétéran', 'de la garde', 'du compagnon'],
  rare:       ['des runes', 'de l’enchanteur', 'des murmures'],
  epique:     ['des tempêtes', 'du zénith', 'des abysses'],
  legendaire: ['du crépuscule', 'des légendes', 'du phénix'],
  mythique:   ['des origines', 'du chaos', 'des Titans'],
  divin:      ['des dieux', 'de l’éternité', 'des étoiles'],
};

// Niveau minimal d'apparition et puissance de chaque rareté.
const PALIER_RARETE = { commun: 1, inhabituel: 1, rare: 3, epique: 6, legendaire: 10, mythique: 14, divin: 17 };
const MULT_RARETE_BUTIN = { commun: 0.8, inhabituel: 0.95, rare: 1.1, epique: 1.3, legendaire: 1.55, mythique: 1.8, divin: 2.15 };

// Jusqu'au niveau 20 : toutes les raretés, deux variantes. Au-delà
// (niveaux 21 à 50) : une variante, raretés épique et plus seulement —
// le haut niveau se joue dans les hautes raretés.
ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= NIVEAU_MAX; niveau++) {
    // Au-delà du niveau 60, un palier sur deux suffit : le butin se joue
    // dans les hautes raretés, pas dans le nombre de lignes du catalogue.
    if (niveau > 60 && niveau % 2 !== 0) continue;
    const variantes = niveau <= 20 ? 2 : 1;
    Object.keys(RARETES).forEach((rarete) => {
      if (niveau < PALIER_RARETE[rarete]) return;
      if (niveau > 20 && !['epique', 'legendaire', 'mythique', 'divin'].includes(rarete)) return;
      for (let variante = 0; variante < variantes; variante++) {
        const nomBase = archetype.noms[(niveau + variante) % archetype.noms.length];
        const qualificatif = QUALIFICATIFS_BUTIN[rarete][(niveau + variante * 2) % 3];
        const mult = MULT_RARETE_BUTIN[rarete];
        const principal = Math.max(1, Math.round((2 + niveau * 0.85) * mult) + variante);
        const bonus = { [archetype.principal]: principal };
        if (niveau >= 4) bonus[archetype.secondaire] = Math.max(1, Math.round(principal * 0.35));
        if (archetype.slot === 'torse' || archetype.slot === 'tete') bonus.pvMax = Math.round(niveau * 2 * mult);
        if (archetype.principal === 'int' || archetype.principal === 'esp') {
          bonus.pmMax = Math.round(niveau * 1.5 * mult);
        }
        // Gants et bottes gardent leur tempérament défensif d'origine.
        if (archetype.defensif && niveau >= 8 && !['commun', 'inhabituel'].includes(rarete)) {
          bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.12 * mult));
        }
        ajouterSousCaracs(bonus, archetype.slot, niveau, rarete, niveau + variante);
        // Les objets partageant un même qualificatif forment une panoplie.
        const indexQualificatif = (niveau + variante * 2) % 3;
        const idSet = `butin-${rarete}-${indexQualificatif}`;
        if (!SETS[idSet]) SETS[idSet] = { nom: `Panoplie ${qualificatif}`, rarete };
        OBJETS[`butin-${archetype.cle}-${rarete}-${niveau}-${variante}`] = {
          nom: `${nomBase} ${qualificatif}`,
          emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
          armure: archetype.armure || null, familleArme: archetype.familleArme || null,
          niveau, rarete,
          prixVente: Math.max(5, Math.round(niveau * 6 * mult)),
          bonus,
          set: idSet,
          desc: 'Butin d’aventure : coffres de boss, Tour Sans Fin et contrats de guilde.',
        };
      }
    });
  }
});

// =====================================================================
// Catalogue du marchand : équipements générés, niveaux 1 à 50.
// v17.2 : le marchand vend du commun au LÉGENDAIRE — seuls le mythique
// et le divin restent introuvables en boutique (butin, boss, artisans).
// Ses pièces n'ont AUCUN bonus de panoplie ni skill passif — pour ça, il
// faut passer chez les artisans ou partir à l'aventure.
// =====================================================================
const QUALIFICATIFS_BOUTIQUE = {
  commun:     ['de l’échoppe', 'du colporteur', 'de série'],
  inhabituel: ['de l’artisan', 'du bourg', 'de bonne facture'],
  rare:       ['de maître', 'du comptoir doré', 'd’exception'],
  epique:     ['de la Grande Foire', 'du maître-marchand', 'de prestige'],
  legendaire: ['de la Vitrine Secrète', 'du fond du coffre', 'de collection'],
};

// Fenêtre de niveaux où le marchand propose chaque rareté (jusqu'au 50).
// v19 : l'étal accompagne le héros jusqu'au niveau 100. Au-delà de 60,
// un palier sur deux — sans quoi le catalogue double sans rien apporter.
const FENETRES_BOUTIQUE = {
  commun: [1, 10], inhabituel: [3, 18], rare: [6, 38], epique: [10, 70], legendaire: [14, 100],
};
const MULT_STAT_BOUTIQUE = { commun: 0.7, inhabituel: 0.85, rare: 1.0, epique: 1.15, legendaire: 1.4 };
const MULT_PRIX_BOUTIQUE = { commun: 1, inhabituel: 1.6, rare: 2.6, epique: 4.2, legendaire: 7 };

// =====================================================================
// v19 — La courbe des prix.
//
// L'ancienne était linéaire : 10 + niveau × 8. Au niveau 50, une pièce
// légendaire coûtait 2 870 po, soit le quart d'un seul contrat de guilde.
// La nouvelle est quadratique — l'écart se creuse là où l'or afflue, et
// un équipement de son niveau redevient un achat qui se prépare.
// =====================================================================
function prixBoutique(niveau, rarete) {
  const base = 24 + niveau * 14 + niveau * niveau * 1.6;
  return Math.max(12, Math.round(base * MULT_PRIX_BOUTIQUE[rarete]));
}

ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= NIVEAU_MAX; niveau++) {
    if (niveau > 60 && niveau % 2 !== 0) continue;
    Object.entries(FENETRES_BOUTIQUE).forEach(([rarete, [debut, fin]]) => {
      if (niveau < debut || niveau > fin) return;
      const indexQualificatif = niveau % 3;
      const qualificatif = QUALIFICATIFS_BOUTIQUE[rarete][indexQualificatif];
      const nomBase = archetype.noms[niveau % archetype.noms.length];
      const mult = MULT_STAT_BOUTIQUE[rarete];
      const principal = Math.max(1, Math.round((2 + niveau * 0.85) * mult));
      const bonus = { [archetype.principal]: principal };
      if (niveau >= 4) bonus[archetype.secondaire] = Math.max(1, Math.round(principal * 0.35));
      if (archetype.slot === 'torse' || archetype.slot === 'tete') bonus.pvMax = Math.round(niveau * 2 * mult);
      if (archetype.principal === 'int' || archetype.principal === 'esp') {
        bonus.pmMax = Math.round(niveau * 1.5 * mult);
      }
      if (archetype.defensif && niveau >= 8 && ['rare', 'epique', 'legendaire'].includes(rarete)) {
        bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.1 * mult));
      }
      // Le marchand porte une sous-caractéristique de moins que le butin :
      // partir à l'aventure doit rester plus payant que passer à la caisse.
      const rareteMoindre = { rare: 'inhabituel', epique: 'rare', legendaire: 'epique' }[rarete] || rarete;
      ajouterSousCaracs(bonus, archetype.slot, niveau, rareteMoindre, niveau);
      OBJETS[`marchand-${archetype.cle}-${rarete}-${niveau}`] = {
        nom: `${nomBase} ${qualificatif}`,
        emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
        armure: archetype.armure || null, familleArme: archetype.familleArme || null,
        niveau, rarete,
        prix: prixBoutique(niveau, rarete),
        bonus,
        desc: `Collection du marchand — sans bonus de panoplie : les sets à passifs se forgent chez les artisans.`,
      };
    });
  }
});

// =====================================================================
// Inventaire : liste de { id, qte }
// =====================================================================
function compterObjet(p, idObjet) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  return entree ? entree.qte : 0;
}

function ajouterObjet(p, idObjet, qte = 1) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  if (entree) entree.qte += qte;
  else p.inventaire.push({ id: idObjet, qte });
  // Compteurs de hauts faits : trouvailles de haut rang.
  const objet = OBJETS[idObjet];
  if (objet && p.compteurs) {
    const rarete = rareteDe(objet);
    if (rarete === 'legendaire' || rarete === 'mythique') p.compteurs.legendaires += qte;
    if (rarete === 'divin') p.compteurs.divins += qte;
  }
}

function retirerObjet(p, idObjet, qte = 1) {
  const entree = p.inventaire.find((e) => e.id === idObjet);
  if (!entree || entree.qte < qte) return false;
  entree.qte -= qte;
  if (entree.qte <= 0) p.inventaire = p.inventaire.filter((e) => e.qte > 0);
  return true;
}

function texteBonus(bonus) {
  if (!bonus) return '';
  const libelles = {
    for: '💪 FOR', dex: '🎯 DEX', int: '🧠 INT', esp: '🕊️ ESP', vit: '❤️ VIT', cha: '🍀 CHA',
    pvMax: '❤️ PV max', pmMax: '💧 PM max',
    crit: '💥 Critique', direct: '🎲 Coup direct', deter: '⚖️ Détermination',
    tenacite: '🛡️ Ténacité', celerite: '💨 Célérité', piete: '💧 Piété',
  };
  const enPourcent = Object.keys(SOUS_CARACS);
  return Object.entries(bonus)
    .map(([cle, valeur]) => `+${valeur}${enPourcent.includes(cle) ? ' %' : ''} ${libelles[cle] || cle}`)
    .join(' · ');
}
