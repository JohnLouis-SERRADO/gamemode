'use strict';

// =====================================================================
// Générateurs : butin d'aventure et catalogue du marchand
// =====================================================================

// =====================================================================
// Butin d'aventure généré : ~1500 équipements introuvables en boutique.
// Ils tombent des coffres de boss, de la Tour et des contrats de guilde.
// Pour chaque archétype × niveau × rareté disponible, deux variantes.
// =====================================================================
const ARCHETYPES_BUTIN = [
  { cle: 'epee',     noms: ['Épée', 'Hache', 'Masse'],           emoji: '⚔️', slot: 'arme',       principal: 'for', secondaire: 'vit' },
  { cle: 'baton',    noms: ['Bâton', 'Sceptre', 'Orbe'],         emoji: '🪄', slot: 'arme',       principal: 'int', secondaire: 'cha' },
  { cle: 'arc',      noms: ['Arc', 'Dague', 'Arbalète'],         emoji: '🏹', slot: 'arme',       principal: 'agi', secondaire: 'for' },
  { cle: 'heaume',   noms: ['Heaume', 'Capuche', 'Diadème'],     emoji: '🪖', slot: 'tete',       principal: 'vit', secondaire: 'int' },
  { cle: 'plastron', noms: ['Plastron', 'Tunique', 'Cuirasse'],  emoji: '🛡️', slot: 'torse',      principal: 'vit', secondaire: 'for' },
  { cle: 'gants',    noms: ['Gants', 'Gantelets', 'Mitaines'],   emoji: '🧤', slot: 'mains',      principal: 'for', secondaire: 'agi', defensif: 'blocage' },
  { cle: 'jambes',   noms: ['Jambières', 'Grèves', 'Cuissards'], emoji: '👖', slot: 'jambes',     principal: 'agi', secondaire: 'vit' },
  { cle: 'bottes',   noms: ['Bottes', 'Sandales', 'Solerets'],   emoji: '🥾', slot: 'pieds',      principal: 'agi', secondaire: 'vit', defensif: 'esquive' },
  { cle: 'anneau',   noms: ['Anneau', 'Sceau', 'Chevalière'],    emoji: '💍', slot: 'accessoire', principal: 'cha', secondaire: 'agi' },
  { cle: 'amulette', noms: ['Amulette', 'Pendentif', 'Relique'], emoji: '📿', slot: 'accessoire', principal: 'int', secondaire: 'cha' },
];

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
  for (let niveau = 1; niveau <= 50; niveau++) {
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
        if (archetype.principal === 'int') bonus.pmMax = Math.round(niveau * 1.5 * mult);
        if (rarete === 'mythique' || rarete === 'divin') bonus.crit = Math.round(2 + niveau * 0.25);
        // Gants et bottes portent les stats défensives (blocage/esquive)
        // à partir de la rareté rare et du niveau 8.
        if (archetype.defensif && niveau >= 8 && !['commun', 'inhabituel'].includes(rarete)) {
          bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.12 * mult));
        }
        // Les objets partageant un même qualificatif forment une panoplie.
        const indexQualificatif = (niveau + variante * 2) % 3;
        const idSet = `butin-${rarete}-${indexQualificatif}`;
        if (!SETS[idSet]) SETS[idSet] = { nom: `Panoplie ${qualificatif}`, rarete };
        OBJETS[`butin-${archetype.cle}-${rarete}-${niveau}-${variante}`] = {
          nom: `${nomBase} ${qualificatif}`,
          emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
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
const FENETRES_BOUTIQUE = {
  commun: [1, 8], inhabituel: [3, 14], rare: [6, 30], epique: [10, 50], legendaire: [14, 50],
};
const MULT_STAT_BOUTIQUE = { commun: 0.7, inhabituel: 0.85, rare: 1.0, epique: 1.15, legendaire: 1.4 };
const MULT_PRIX_BOUTIQUE = { commun: 1, inhabituel: 1.6, rare: 2.6, epique: 4.2, legendaire: 7 };

ARCHETYPES_BUTIN.forEach((archetype) => {
  for (let niveau = 1; niveau <= 50; niveau++) {
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
      if (archetype.principal === 'int') bonus.pmMax = Math.round(niveau * 1.5 * mult);
      if (rarete === 'legendaire') bonus.crit = Math.round(1 + niveau * 0.2);
      if (archetype.defensif && niveau >= 8 && ['rare', 'epique', 'legendaire'].includes(rarete)) {
        bonus[archetype.defensif] = Math.max(1, Math.round(1 + niveau * 0.1 * mult));
      }
      OBJETS[`marchand-${archetype.cle}-${rarete}-${niveau}`] = {
        nom: `${nomBase} ${qualificatif}`,
        emoji: archetype.emoji, type: 'equipement', slot: archetype.slot,
        niveau, rarete,
        prix: Math.max(8, Math.round((10 + niveau * 8) * MULT_PRIX_BOUTIQUE[rarete])),
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
    for: '💪 FOR', int: '🧠 INT', agi: '🏃 AGI', vit: '❤️ VIT', cha: '🍀 CHA',
    pvMax: '❤️ PV max', pmMax: '💧 PM max', crit: '💥 Crit.',
    blocage: '🛡️ Blocage', esquive: '💨 Esquive',
  };
  const enPourcent = ['crit', 'blocage', 'esquive'];
  return Object.entries(bonus)
    .map(([cle, valeur]) => `+${valeur}${enPourcent.includes(cle) ? ' %' : ''} ${libelles[cle] || cle}`)
    .join(' · ');
}
