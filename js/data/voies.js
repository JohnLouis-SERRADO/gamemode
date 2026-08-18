'use strict';

// =====================================================================
// v19 — LES VOIES, au niveau 50.
//
// Trois par sous-classe, quatre-vingt-une au total. Une Voie ne change
// pas la classe : elle donne un passif fort, une compétence, et le titre
// qui s'affiche partout — « Berserker de la Rage ».
//
// Chaque compétence de Voie est décrite par son NOM, son EMOJI, son
// PROFIL et sa phrase. Les chiffres, eux, sont calculés : à profil égal,
// deux Voies de deux sous-classes différentes frappent aussi fort, sur
// l'attribut de leur propre famille. Écrire 81 blocs de statistiques à la
// main, ce serait 81 occasions de créer un déséquilibre invisible.
// =====================================================================

const NIVEAU_VOIE = 50;

// Les profils : ce que fait la compétence, et ce que ça coûte.
const PROFILS_VOIE = {
  frappe:   { type: 'degats', cible: 'ennemi',  puissance: 17, ratio: 2.05, coutMp: 12, cooldown: 4 },
  salve:    { type: 'degats', cible: 'ennemis', puissance: 11, ratio: 1.45, coutMp: 15, cooldown: 5 },
  rafale:   { type: 'degats', cible: 'ennemi',  puissance: 7,  ratio: 1.15, coups: 3, coutMp: 13, cooldown: 4 },
  execution:{ type: 'degats', cible: 'ennemi',  puissance: 20, ratio: 2.35, critBonus: 0.25, coutMp: 14, cooldown: 5 },
  drain:    { type: 'degats', cible: 'ennemi',  puissance: 15, ratio: 1.85, coutMp: 12, cooldown: 4, effet: { type: 'drain', part: 0.5 } },
  fleau:    { type: 'degats', cible: 'ennemis', puissance: 9,  ratio: 1.25, coutMp: 15, cooldown: 5, effet: { type: 'poison', duree: 3 } },
  brise:    { type: 'degats', cible: 'ennemi',  puissance: 13, ratio: 1.65, coutMp: 12, cooldown: 4, effet: { type: 'affaibli', duree: 3 } },
  fracas:   { type: 'degats', cible: 'ennemis', puissance: 10, ratio: 1.35, coutMp: 16, cooldown: 5, effet: { type: 'etourdi', duree: 1, chance: 0.45 } },
  soin:     { type: 'soin',   cible: 'allies',  puissance: 18, ratio: 2.1,  coutMp: 15, cooldown: 4 },
  grandSoin:{ type: 'soin',   cible: 'allie',   puissance: 30, ratio: 2.9,  coutMp: 14, cooldown: 4 },
  egide:    { type: 'utilitaire', cible: 'allies', coutMp: 14, cooldown: 5, effet: { type: 'bouclier', duree: 4 } },
  ferveur:  { type: 'utilitaire', cible: 'allies', coutMp: 12, cooldown: 5, effet: { type: 'benediction', duree: 3 } },
  souffle:  { type: 'utilitaire', cible: 'soi',    coutMp: 10, cooldown: 4, effet: { type: 'regen', duree: 4 } },
};

// =====================================================================
// ⚠️ LES PHRASES CI-DESSOUS NE SONT PLUS CE QUE LE JEU AFFICHE.
//
// Depuis la v23, le passif de chaque Voie est PRODUIT à partir de ses
// réglages — voir js/data/voies-passifs.js, qui les écrase tous à la fin
// du chargement. Les phrases gardées ici servent encore à deux choses :
// la description de la COMPÉTENCE de la Voie (première phrase), et la
// mémoire de l'intention d'origine.
//
// Autrement dit : pour changer ce qu'une Voie FAIT et ce qu'elle DIT, on
// touche à voies-passifs.js, jamais ici.
// =====================================================================

// Les 81 Voies. Trois par sous-classe : une qui pousse l'identité à
// l'extrême, une qui la détourne, une qui la retourne.
const VOIES = {};

const TABLE_VOIES = {
  // ---------------- 🛡️ Gardien ----------------
  templier: [
    ['Voie du Bastion', 'Partage 35 % de ses PV maximum avec la ligne avant ; chaque coup encaissé soigne l’équipe de 3 %.', 'Voûte', '🏛️', 'egide'],
    ['Voie du Serment', 'Les alliés qu’il protège frappent 15 % plus fort, et leurs dégâts lui rendent du mana.', 'Cercle sacré', '⭕', 'ferveur'],
    ['Voie du Zèle', '+15 % de dégâts par allié vivant ; sa Vitalité se convertit en puissance offensive.', 'Verdict', '⚖️', 'frappe'],
  ],
  paladin: [
    ['Voie du Gardien', 'Un allié sous 20 % de PV devient invulnérable un tour, une fois par allié et par combat.', 'Serment éternel', '🕊️', 'egide'],
    ['Voie du Croisé', '+2 % de dégâts par point de Vitalité au-delà de 40.', 'Charge sainte', '⚔️', 'frappe'],
    ['Voie de la Lumière', 'Ses dégâts soignent l’équipe de 30 % du montant infligé.', 'Aube', '🌅', 'soin'],
  ],
  'chevalier-noir': [
    ['Voie du Sang', 'Chaque coup vole 25 % en PV ; les soins reçus des autres sont réduits de moitié.', 'Saignée', '🩸', 'drain'],
    ['Voie du Linceul', 'Les ennemis qui le frappent subissent un statut aléatoire.', 'Manteau de nuit', '🌑', 'fleau'],
    ['Voie du Vide', 'Ses dégâts ignorent la défense et les boucliers, et lui coûtent 5 % de ses PV.', 'Néant portatif', '🕳️', 'execution'],
  ],
  colosse: [
    ['Voie du Géant', '+60 % de PV maximum ; ses dégâts se calculent sur ses PV plutôt que sur la Force.', 'Piétinement', '🦶', 'fracas'],
    ['Voie de la Montagne', 'Immunisé aux déplacements et à l’étourdissement, initiative réduite de moitié.', 'Immobilité', '🏔️', 'egide'],
    ['Voie du Séisme', 'Toutes ses compétences deviennent des zones, +25 % de dégâts, +25 % de coût.', 'Faille', '🌋', 'salve'],
  ],

  // ---------------- ⚔️ Guerrier ----------------
  berserker: [
    ['Voie de la Rage', '+3 % de dégâts par tour, sans plafond, remis à zéro s’il ne subit aucun dégât.', 'Ivresse rouge', '🍷', 'frappe'],
    ['Voie du Sang', 'Chaque coup vole 20 % en PV ; les soins reçus sont réduits de moitié.', 'Saignée', '🩸', 'drain'],
    ['Voie du Carnage', 'Chaque ennemi tué donne +10 % de dégâts, cumulables pour tout le combat.', 'Curée', '🪓', 'salve'],
  ],
  moine: [
    ['Voie du Poing de Fer', 'Huit charges au lieu de cinq, et +3 % de dégâts par charge accumulée.', 'Éveil du dragon', '🐲', 'rafale'],
    ['Voie du Souffle', '+3 % de Célérité par tour sans dégâts subis, sans plafond.', 'Paume du vide', '🌬️', 'souffle'],
    ['Voie du Calme', '+10 % de PV et de mana par tour, mais ses dégâts baissent de 20 %.', 'Immobilité parfaite', '☯️', 'soin'],
  ],
  assassin: [
    ['Voie de l’Ombre', 'Invisible deux tours après un kill ; en sortir frappe à 300 %.', 'Nuit sans lune', '🌑', 'execution'],
    ['Voie du Poison', 'Ses poisons se cumulent cinq fois, et +50 % contre les cibles sous 50 % de PV.', 'Peste de la Veuve', '🕷️', 'fleau'],
    ['Voie de la Mise à Mort', 'Dégâts doublés sous 25 % de PV ; exécution automatique sous 10 %.', 'Fin de contrat', '☠️', 'execution'],
  ],
  danselame: [
    ['Voie du Vent Tranchant', 'Change de ligne à chaque action, et le bonus se cumule jusqu’à +100 %.', 'Danse sans fin', '🌪️', 'rafale'],
    ['Voie du Miroir', 'Mémorise deux compétences ennemies et peut les relancer.', 'Galerie des glaces', '🪞', 'brise'],
    ['Voie des Pétales', 'Chaque coup touche une cible de plus, à 45 % des dégâts.', 'Tourbillon éternel', '🌸', 'salve'],
  ],
  duelliste: [
    ['Voie de la Lame Vive', '+25 % de Célérité ; les critiques rendent un tour d’action, deux fois par combat.', 'Enchaînement', '⚡', 'rafale'],
    ['Voie du Contre', 'Chaque coup évité déclenche une riposte critique.', 'Feinte mortelle', '🤺', 'execution'],
    ['Voie du Point Faible', 'Ses coups appliquent vulnérabilité, et +40 % contre les cibles vulnérables.', 'Perforation', '🎯', 'brise'],
  ],

  // ---------------- 🏹 Franc-tireur ----------------
  rodeur: [
    ['Voie des Pièges', 'Trois pièges au début du combat, rechargés tous les trois tours.', 'Terrain de chasse', '🪤', 'fleau'],
    ['Voie de la Meute', 'Trois loups permanents combattent à 50 % de ses statistiques.', 'Curée royale', '🐺', 'salve'],
    ['Voie du Poison', 'Ses flèches appliquent un poison cumulable cinq fois.', 'Carquois empoisonné', '🧪', 'fleau'],
  ],
  voleur: [
    ['Voie du Détrousseur', '35 % de vol d’objet par coup, et les objets du palier supérieur deviennent possibles.', 'Casse du siècle', '💎', 'execution'],
    ['Voie de la Fortune', '+80 % d’or, et +2 % de dégâts par tranche de 1 000 po gagnée dans le combat.', 'Pluie d’or', '🪙', 'salve'],
    ['Voie de la Ruse', 'Applique un statut aléatoire à chaque coup porté.', 'Sac de tours', '🎩', 'brise'],
  ],
  traqueur: [
    ['Voie de la Marque', 'Les marques font subir +25 % de dégâts d’équipe et se propagent à la mort de la cible.', 'Sentence du chasseur', '🔖', 'brise'],
    ['Voie de l’Exécution', '+50 % de dégâts sous 40 % de PV, exécution automatique sous 12 %.', 'Tir du crépuscule', '🌆', 'execution'],
    ['Voie de la Piste', '+30 % contre une famille de monstres choisie chaque jour.', 'Piste de sang', '🩸', 'frappe'],
  ],
  voltigeur: [
    ['Voie du Vent', 'Trois tirs par action, à 60 % des dégâts chacun.', 'Grêle de traits', '🌬️', 'rafale'],
    ['Voie de la Célérité', '+25 % de Célérité, et chaque esquive rend une action.', 'Danse de l’arc', '💨', 'souffle'],
    ['Voie de la Distance', '+50 % de dégâts en ligne arrière, interdiction de passer en ligne avant.', 'Tir de siège', '🏰', 'frappe'],
  ],

  // ---------------- 🔮 Arcaniste ----------------
  pyromancien: [
    ['Voie du Brasier', 'Les brûlures durent jusqu’au premier soin et se cumulent huit fois.', 'Immolation', '🔥', 'fleau'],
    ['Voie des Cendres', 'Un ennemi tué par le feu explose pour 25 % de ses PV maximum.', 'Nova de cendres', '💥', 'salve'],
    ['Voie du Soleil', 'Ses sorts de feu ignorent toutes les résistances élémentaires.', 'Colonne solaire', '☀️', 'frappe'],
  ],
  givremage: [
    ['Voie du Grand Froid', 'Gel de deux tours sur les non-boss ; les gelés ne peuvent plus être soignés.', 'Zéro absolu', '🧊', 'fracas'],
    ['Voie du Fracas', 'La brisure éclabousse à 60 % ; chaque brisure rend un tour, deux fois par combat.', 'Brise-glace', '❄️', 'salve'],
    ['Voie du Linceul', 'Les ralentis perdent 20 de Célérité de plus et subissent +25 % de dégâts.', 'Hiver', '🌨️', 'brise'],
  ],
  elementaliste: [
    ['Voie de la Convergence', 'Deux synergies par tour, et les synergies frappent 60 % plus fort.', 'Grand Œuvre', '🌀', 'salve'],
    ['Voie Sismique', 'Toutes ses compétences deviennent des zones : +25 % de dégâts, +25 % de coût.', 'Faille', '🏔️', 'fracas'],
    ['Voie du Prisme', '+8 % de dégâts au sort suivant par élément différent déjà lancé.', 'Arc-en-ciel', '🌈', 'frappe'],
  ],
  necromancien: [
    ['Voie de la Peste', 'Ses statuts durent deux tours de plus et se propagent à toute la ligne.', 'Épidémie', '☣️', 'fleau'],
    ['Voie de la Moisson', '+5 % de dégâts par âme récoltée, sans plafond dans le combat.', 'Moisson', '🌾', 'drain'],
    ['Voie de la Terreur', 'Les ennemis terrorisés se frappent entre eux.', 'Miasme', '😱', 'fracas'],
  ],
  invocateur: [
    ['Voie du Lien', 'Ses invocations copient les compétences qu’il a équipées.', 'Lien parfait', '🔗', 'frappe'],
    ['Voie de l’Éther', 'Les invocations tombées reviennent au tour suivant à 50 % de leurs PV.', 'Éther sans fin', '🫧', 'soin'],
    ['Voie de la Horde', 'Quatre invocations simultanées, à 60 % de ses statistiques.', 'Légion', '🐉', 'salve'],
  ],

  // ---------------- ✨ Devin ----------------
  barde: [
    ['Voie du Maestro', 'Deux buffs cumulables par allié, et ils deviennent indissipables.', 'Crescendo', '🎼', 'ferveur'],
    ['Voie du Satiriste', 'Les silencés subissent +25 % ; une action ratée coûte 10 % des PV maximum.', 'Farce finale', '🎭', 'brise'],
    ['Voie de l’Écho', '30 % de chances que ses sorts se relancent gratuitement.', 'Reprise', '🔁', 'soin'],
  ],
  chaman: [
    ['Voie des Totems', 'Trois totems indestructibles, à 50 % de ses statistiques.', 'Cercle des esprits', '🗿', 'egide'],
    ['Voie des Ancêtres', 'Le premier héros tombé de chaque combat revient au tour suivant à 30 % de PV.', 'Convocation des Aïeux', '🪶', 'grandSoin'],
    ['Voie de la Foudre', 'La foudre rebondit une fois de plus par allié vivant.', 'Orage ancestral', '🌩️', 'salve'],
  ],
  druide: [
    ['Voie de la Sève', 'Tout surplus de soin devient un bouclier permanent.', 'Cœur de la forêt', '🌳', 'egide'],
    ['Voie des Ronces', 'Ses statuts de nature sont doublés et immobilisent la cible.', 'Ronceraie', '🥀', 'fleau'],
    ['Voie du Renouveau', 'Une résurrection gratuite par combat.', 'Renouveau', '🌱', 'grandSoin'],
  ],
  oracle: [
    ['Voie du Bouclier', 'Ses boucliers durent jusqu’à rupture et se cumulent entre eux.', 'Aegis', '🛡️', 'egide'],
    ['Voie de la Vision', 'L’équipe évite automatiquement la prochaine attaque annoncée.', 'Prophétie', '🔮', 'ferveur'],
    ['Voie du Verbe', 'Ses soins mono-cible touchent toute l’équipe à 60 %.', 'Dernier Jour', '🌇', 'soin'],
  ],

  // ---------------- 🌑 Runelame ----------------
  faucheur: [
    ['Voie du Drain', 'Vole 40 % des dégâts infligés en PV et en mana.', 'Siphon d’âmes', '🫀', 'drain'],
    ['Voie de la Moisson', '+5 % de dégâts par âme récoltée, sans plafond dans le combat.', 'Moisson', '🌾', 'salve'],
    ['Voie du Néant', 'Ses dégâts ignorent défense et boucliers, et lui coûtent 5 % de ses PV.', 'Souffle du néant', '🕳️', 'execution'],
  ],
  corrupteur: [
    ['Voie de la Peste', 'Ses statuts durent deux tours de plus et se propagent à toute la ligne.', 'Épidémie', '☣️', 'fleau'],
    ['Voie de la Décomposition', 'Convertit tous les statuts d’une cible en dégâts immédiats.', 'Décomposition', '🍂', 'execution'],
    ['Voie de la Terreur', 'Les ennemis terrorisés se frappent entre eux.', 'Miasme', '😱', 'fracas'],
  ],
  metamorphe: [
    ['Voie de l’Ours', '+40 % de PV maximum, et ses coups appliquent un saignement.', 'Rugissement', '🐻', 'fracas'],
    ['Voie du Corbeau', '+40 % de Célérité et d’esquive ; il agit deux fois au premier tour.', 'Vol du corbeau', '🐦‍⬛', 'rafale'],
    ['Voie du Serpent', 'Poison à chaque coup, cumulable cinq fois.', 'Morsure du serpent', '🐍', 'fleau'],
  ],
  runemaitre: [
    ['Voie de la Convergence', 'Deux runes par tour, et les runes frappent 60 % plus fort.', 'Grand Œuvre runique', '💠', 'salve'],
    ['Voie du Sceau', 'Ses glyphes au sol persistent tout le combat et se cumulent.', 'Sceau permanent', '🔯', 'fleau'],
    ['Voie de l’Alphabet', '+8 % de dégâts au sort suivant par rune différente déjà tracée.', 'Alphabet complet', '📜', 'frappe'],
  ],
  vibrelame: [
    ['Voie de la Résonance', 'Chaque coup d’une série renforce le suivant de 15 %.', 'Résonance parfaite', '🔔', 'rafale'],
    ['Voie du Silence', 'Ses zones silencent les ennemis touchés pendant un tour.', 'Silence blanc', '🤍', 'fracas'],
    ['Voie de l’Écho', '30 % de chances que ses attaques à coups multiples se relancent.', 'Mille échos', '🎼', 'rafale'],
  ],
};

// ---------------------------------------------------------------------
// Construction : chaque Voie devient une entrée de VOIES et sa compétence
// rejoint le catalogue, calée sur l'attribut de sa famille.
// ---------------------------------------------------------------------
function identifiantVoie(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

Object.entries(TABLE_VOIES).forEach(([idSousClasse, liste]) => {
  const sousClasse = SOUS_CLASSES[idSousClasse];
  if (!sousClasse) return;
  const stat = CLASSES_BASE[sousClasse.classe].stat;
  liste.forEach(([nomVoie, passif, nomComp, emoji, profil], index) => {
    const idVoie = `${idSousClasse}-${identifiantVoie(nomVoie)}`;
    const idComp = `voie-${idVoie}`;
    const modele = PROFILS_VOIE[profil];

    COMPETENCES[idComp] = {
      ...modele,
      effet: modele.effet ? { ...modele.effet } : undefined,
      nom: nomComp,
      emoji,
      categorie: 'signature',
      voie: idVoie,
      niveauRequis: NIVEAU_VOIE,
      stat: modele.type === 'utilitaire' ? undefined : stat,
      desc: `${passif.split('.')[0]}. La compétence de la ${nomVoie}.`,
    };
    // Les effets de soutien lisent la statistique de la famille aussi.
    if (COMPETENCES[idComp].effet && ['bouclier', 'regen'].includes(COMPETENCES[idComp].effet.type)) {
      COMPETENCES[idComp].effet.stat = stat;
    }
    if (COMPETENCES[idComp].effet && COMPETENCES[idComp].effet.type === 'poison') {
      COMPETENCES[idComp].effet.stat = stat;
    }

    VOIES[idVoie] = {
      id: idVoie,
      sousClasse: idSousClasse,
      classe: sousClasse.classe,
      nom: nomVoie,
      emoji,
      passif,
      competence: idComp,
      rang: index,
      // Le titre s'affiche partout : « Berserker de la Rage ».
      titre: `${sousClasse.nom} ${nomVoie.replace(/^Voie /, '')}`,
    };
  });
});

// Chaque sous-classe connaît ses trois Voies.
Object.values(SOUS_CLASSES).forEach((sc) => {
  sc.voies = Object.keys(VOIES).filter((id) => VOIES[id].sousClasse === sc.id);
});

function voieDe(p) {
  return VOIES[p && p.voie] || null;
}

// Le titre complet du héros : « Gardien — Templier » puis, à partir du
// niveau 50, « Templier du Bastion ».
function titreCompletHeros(p) {
  // L'Éveil prime sur la Voie, qui prime sur la classe : le nom affiché
  // est toujours le plus récent des trois, classements compris.
  const eveil = typeof eveilDe === 'function' ? eveilDe(p) : null;
  if (eveil) return eveil.titre;
  const voie = voieDe(p);
  return voie ? voie.titre : nomCompletClasse(p);
}
