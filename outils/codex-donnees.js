'use strict';

// =====================================================================
// Régénère le bloc de données du Codex de Valciel (l'artifact publié).
//
//   node outils/codex-donnees.js <ancien-donnees.json> <sortie.json>
//
// Le codex embarque un JSON complet extrait du jeu. Les sections dont les
// données ont pu bouger (classes, progression, bestiaire, bourg, météo,
// socle, méta) sont reconstruites depuis le jeu vivant ; les sections
// lourdes et intouchées (objets, équipement, artisanat, zones, systèmes)
// sont reprises telles quelles de la publication précédente — elles se
// régénèrent avec le même schéma le jour où elles bougent.
// =====================================================================
const fs = require('fs');
const { execSync } = require('child_process');
const chargerJeu = require('./charger-jeu');

const [, , cheminAncien, cheminSortie] = process.argv;
if (!cheminAncien || !cheminSortie) {
  console.error('usage : node outils/codex-donnees.js <ancien-donnees.json> <sortie.json>');
  process.exit(1);
}
const ancien = JSON.parse(fs.readFileSync(cheminAncien, 'utf8'));
const jeu = chargerJeu();
const e = jeu.evaluer;

// Clone profond en jetant les fonctions (cond, appliquer, texte…).
function nettoyer(valeur) {
  if (Array.isArray(valeur)) return valeur.map(nettoyer);
  if (valeur && typeof valeur === 'object') {
    const sortie = {};
    Object.entries(valeur).forEach(([cle, v]) => {
      if (typeof v === 'function') return;
      sortie[cle] = nettoyer(v);
    });
    return sortie;
  }
  return typeof valeur === 'function' ? undefined : valeur;
}

// --- Compétence, au format du codex ----------------------------------
function exporterCompetence(id, niveauDefaut) {
  const c = e('COMPETENCES')[id];
  if (!c) return null;
  return {
    id,
    nom: c.nom, emoji: c.emoji, desc: c.desc || '',
    type: c.type, cible: c.cible || null, stat: c.stat || null,
    puissance: c.puissance != null ? c.puissance : null,
    ratio: c.ratio != null ? c.ratio : null,
    coups: c.coups || 1,
    coutMp: c.coutMp != null ? c.coutMp : null,
    cooldown: c.cooldown || 0,
    critBonus: c.critBonus != null ? c.critBonus : null,
    niveauRequis: c.niveauRequis != null ? c.niveauRequis : (niveauDefaut || 1),
    effet: c.effet ? nettoyer(c.effet) : null,
    categorie: c.categorie || null,
    signature: !!c.signature,
    portee: c.portee != null ? c.portee : null,
    element: c.element || null,
  };
}

// --- Les classes, leurs spécialités, Voies et Éveils ------------------
function exporterClasses() {
  const CLASSES_BASE = e('CLASSES_BASE');
  const SOUS_CLASSES = e('SOUS_CLASSES');
  const VOIES = e('VOIES');
  const EVEILS = e('EVEILS');
  const EQUIPEMENT_PAR_CLASSE = e('EQUIPEMENT_PAR_CLASSE');
  const FAMILLES_ARME = e('typeof FAMILLES_ARME !== "undefined" ? FAMILLES_ARME : null');
  const CATEGORIES_ARMURE = e('typeof CATEGORIES_ARMURE !== "undefined" ? CATEGORIES_ARMURE : null');
  const NIVEAU_VOIE = e('NIVEAU_VOIE');
  const NIVEAU_EVEIL = e('NIVEAU_EVEIL');

  const effetDeriveDe = (eveil) => {
    if (!eveil.contrainte) return eveil.effet;
    const contrainte = eveil.contrainte.replace(/\.\s*$/, '');
    return `${eveil.effet.replace(/\.\s*$/, '')} ; ${contrainte.charAt(0).toLowerCase()}${contrainte.slice(1)}.`;
  };

  return Object.entries(CLASSES_BASE).map(([id, base]) => {
    const equip = EQUIPEMENT_PAR_CLASSE[id] || {};
    return {
      id,
      nom: base.nom, emoji: base.emoji, role: base.role, resume: base.resume,
      stat: base.stat, ligne: base.ligne, armure: equip.armure || null,
      armureNom: (CATEGORIES_ARMURE && CATEGORIES_ARMURE[equip.armure] && CATEGORIES_ARMURE[equip.armure].nom) || null,
      armes: base.armes || [],
      famillesArme: (equip.armes || []).map((cle) => ({
        cle,
        nom: (FAMILLES_ARME && FAMILLES_ARME[cle] && FAMILLES_ARME[cle].nom) || cle,
        emoji: (FAMILLES_ARME && FAMILLES_ARME[cle] && FAMILLES_ARME[cle].emoji) || '',
        desc: (FAMILLES_ARME && FAMILLES_ARME[cle] && FAMILLES_ARME[cle].desc) || '',
      })),
      passif: base.passif, signature: base.signature || null,
      competences: (base.competences || []).map((cid) => exporterCompetence(cid, 1)).filter(Boolean),
      sousClasses: (base.sousClasses || []).map((idSc) => {
        const sc = SOUS_CLASSES[idSc];
        return {
          id: idSc,
          nom: sc.nom, emoji: sc.emoji, resume: sc.resume, classe: sc.classe,
          signature: sc.signature || null, bonusStats: sc.bonusStats || {},
          passif: sc.passif,
          competences: (sc.competences || []).map((cid) => exporterCompetence(cid, 1)).filter(Boolean),
          voies: (sc.voies || []).map((idVoie) => {
            const voie = VOIES[idVoie];
            return {
              id: idVoie,
              nom: voie.nom, emoji: voie.emoji, titre: voie.titre, rang: voie.rang,
              passif: voie.passif, passifDerive: voie.passif,
              mecaniques: nettoyer(voie.mecaniques || {}),
              competences: [exporterCompetence(voie.competence, NIVEAU_VOIE)].filter(Boolean),
            };
          }),
          eveils: (sc.eveils || []).map((idEveil) => {
            const eveil = EVEILS[idEveil];
            return {
              id: idEveil,
              nom: eveil.nom, emoji: eveil.emoji, rarete: eveil.rarete, titre: eveil.titre,
              effet: eveil.effet, effetDerive: effetDeriveDe(eveil),
              contrainte: eveil.contrainte || null,
              condition: eveil.condition ? nettoyer(eveil.condition) : null,
              mecaniques: nettoyer(eveil.mecaniques || {}),
              competences: (eveil.competences || []).map((cid) => exporterCompetence(cid, NIVEAU_EVEIL)).filter(Boolean),
            };
          }),
        };
      }),
    };
  });
}

// --- Progression ------------------------------------------------------
function exporterProgression() {
  const NIVEAU_MAX = e('NIVEAU_MAX');
  const niveaux = [];
  for (let n = 1; n <= NIVEAU_MAX; n += 1) {
    niveaux.push({
      n,
      xpCumul: e(`seuilXp(${n})`),
      xpPalier: n < NIVEAU_MAX ? e(`incrementXp(${n + 1})`) : null,
      points: e(`pointsPourNiveau(${n})`),
      pointsCumules: e(`pointsCumules(${n})`),
      maitrise: e(`pointsMaitrisePourNiveau(${n})`),
      puissance: e(`puissanceRecommandee(${n})`),
      combats: e(`combatsPourNiveau(${n})`),
    });
  }
  const equilibrage = { ...ancien.progression.equilibrage };
  equilibrage.echelleEquipement = nettoyer(e('ECHELLE_EQUIPEMENT'));
  equilibrage.facteurRecommandation = e('FACTEUR_RECOMMANDATION');
  equilibrage.combatsParNiveau = nettoyer(e('COMBATS_PAR_NIVEAU'));
  equilibrage.pvCibleMonstre = e('PV_CIBLE_MONSTRE.slice()');
  equilibrage.atkCibleMonstre = e('ATK_CIBLE_MONSTRE.slice()');
  equilibrage.pvCibleBoss = e('PV_CIBLE_BOSS.slice()');
  equilibrage.atkCibleBoss = e('ATK_CIBLE_BOSS.slice()');
  equilibrage.xpCibleMonstre = e('XP_CIBLE_MONSTRE.slice()');
  const jalons = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const puissanceEtalon = {};
  e('classesEtalon()').forEach((classe) => {
    puissanceEtalon[classe] = jalons.map((n) => ({
      n, p: e(`puissancesEtalon(${n})`).parClasse[classe],
    }));
  });
  equilibrage.puissanceEtalon = puissanceEtalon;
  return { niveaux, equilibrage };
}

// --- Bestiaire --------------------------------------------------------
function exporterRegistreMonstres(nomRegistre) {
  const registre = e(nomRegistre);
  const sortie = {};
  Object.entries(registre).forEach(([id, m]) => {
    if (!m || typeof m !== 'object') return;
    const entree = {
      nom: m.nom, emoji: m.emoji, niveau: m.niveau,
      hp: m.hp, atk: m.atk, dex: m.dex, xp: m.xp, po: m.po,
      drops: nettoyer(m.drops || []),
      attaques: nettoyer(m.attaques || []),
    };
    if (m.boss) entree.boss = true;
    if (m.miniBoss) entree.miniBoss = true;
    if (m.mecaniques) entree.mecaniques = nettoyer(m.mecaniques);
    sortie[id] = entree;
  });
  return sortie;
}

// --- Bourg ------------------------------------------------------------
function exporterBourg() {
  const bourg = { ...ancien.bourg };
  bourg.servicesTour = {};
  Object.entries(e('SERVICES_TOUR')).forEach(([id, s]) => {
    bourg.servicesTour[id] = { nom: s.nom, emoji: s.emoji, sceaux: s.sceaux, majeurs: s.majeurs, or: s.or || 0, desc: s.desc };
  });
  bourg.sceauxParEtage = nettoyer(e('SCEAUX_PAR_ETAGE'));
  bourg.etagesTourEveil = e('ETAGES_TOUR_EVEIL');
  bourg.metiers = nettoyer(e('METIERS'));
  bourg.modelesQuetes = nettoyer(e('MODELES_QUETES'));
  bourg.raretesQuetes = nettoyer(e('RARETES_QUETES'));
  bourg.hautsFaits = e('HAUTS_FAITS').map((h) => {
    const entree = { id: h.id, nom: h.nom, emoji: h.emoji, titre: h.titre, desc: h.desc };
    if (h.bonus) entree.bonus = nettoyer(h.bonus);
    return entree;
  });
  bourg.familiers = nettoyer(e('FAMILIERS'));
  bourg.familiersTour = nettoyer(e('FAMILIERS_TOUR'));
  bourg.conditionsCachees = nettoyer(e('CONDITIONS_CACHEES'));
  bourg.typesCondition = e('TYPES_CONDITION.slice()');
  // Les Ordres : mêmes maisons, plus la route des paliers (v28) que le
  // chapitre 12 du codex affiche désormais.
  bourg.ordres = {
    ...ancien.bourg.ordres,
    maisons: nettoyer(e('MAISONS_ORDRES')),
    prixChangementClasse: e('PRIX_CHANGEMENT_CLASSE'),
    prixChangementSpecialite: e('PRIX_CHANGEMENT_SPECIALITE'),
    paliers: [
      { niveau: 1, nom: 'Classe', detail: 'Son rôle dans le groupe — six ordres, six maisons.' },
      { niveau: e('NIVEAU_SPECIALITE'), nom: 'Spécialité de récolte', detail: 'Mineur, tanneur ou tisseur : le métier ⭐ se choisit ici.' },
      { niveau: e('NIVEAU_SOUS_CLASSE'), nom: 'Spécialité', detail: 'Sa manière de tenir le rôle — 27 en tout.' },
      { niveau: e('NIVEAU_VOIE'), nom: 'Voie', detail: 'Son parti pris de jeu — trois par spécialité, 81 en tout.' },
      { niveau: e('NIVEAU_TOUR_EVEIL'), nom: 'Tour de l’Éveil', detail: 'Défaire ses choix sans perdre son niveau, contre des Sceaux.' },
      { niveau: e('NIVEAU_EVEIL'), nom: 'Éveil', detail: 'Ce qui vous rend unique — tiré au sort, 162 écrits.' },
    ],
  };
  return bourg;
}

// --- Socle ------------------------------------------------------------
function exporterSocle() {
  const socle = { ...ancien.socle };
  socle.caracs = nettoyer(e('CARACS'));
  socle.sousCaracs = nettoyer(e('SOUS_CARACS'));
  socle.plafonds = nettoyer(e('PLAFONDS_SOUS_CARACS'));
  socle.sousCaracsRetirees = e('SOUS_CARACS_RETIREES.slice()');
  socle.races = nettoyer(e('RACES'));
  socle.raretes = nettoyer(e('RARETES'));
  socle.invocations = nettoyer(e('INVOCATIONS'));
  socle.metiers = nettoyer(e('METIERS'));
  socle.familleMateriau = nettoyer(e('FAMILLE_MATERIAU'));
  socle.constantes = {
    ...ancien.socle.constantes,
    POINTS_CREATION: e('POINTS_CREATION'),
    STAT_BASE: e('STAT_BASE'),
    NIVEAU_MAX: e('NIVEAU_MAX'),
    NIVEAU_SOUS_CLASSE: e('NIVEAU_SOUS_CLASSE'),
    NIVEAU_VOIE: e('NIVEAU_VOIE'),
    NIVEAU_EVEIL: e('NIVEAU_EVEIL'),
    NIVEAU_TOUR_EVEIL: e('NIVEAU_TOUR_EVEIL'),
    NIVEAU_SPECIALITE: e('NIVEAU_SPECIALITE'),
    TOTAL_POINTS_MAITRISE: e('TOTAL_POINTS_MAITRISE'),
    SEUILS_MAITRISE: e('SEUILS_MAITRISE.slice()'),
    CADENCE_MAITRISE: nettoyer(e('CADENCE_MAITRISE')),
    // v28 — la nouvelle règle d'or de la progression, écrite noir sur blanc.
    RAISON_XP: e('RAISON_XP'),
    COUT_PREMIER_PALIER: e('COUT_PREMIER_PALIER'),
    POINTS_PAR_NIVEAU: e('POINTS_PAR_NIVEAU'),
  };
  return socle;
}

// --- Compétences communes et héritées --------------------------------
function exporterCommunes() {
  const COMPETENCES = e('COMPETENCES');
  return Object.keys(COMPETENCES)
    .filter((id) => e('estCompetenceCommune')(COMPETENCES[id]))
    .map((id) => exporterCompetence(id, 1));
}

function exporterHeritees() {
  return ancien.competencesHeritees.map((h) => exporterCompetence(h.id, h.niveauRequis) || h);
}

// --- Méta -------------------------------------------------------------
function exporterMeta(classes, communes, heritees, bestiaire, bourg) {
  let commit = 'inconnu';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: `${__dirname}/..` }).toString().trim(); } catch (err) { /* hors dépôt */ }
  const nbScenes = ancien.meta.compte.scenes;
  const nbCompetences = classes.reduce((s, c) => s + c.competences.length
    + c.sousClasses.reduce((t, sc) => t + sc.competences.length
      + sc.voies.reduce((u, v) => u + v.competences.length, 0)
      + sc.eveils.reduce((u, ev) => u + ev.competences.length, 0), 0), 0)
    + communes.length;
  return {
    genere: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    commit,
    compte: {
      ...ancien.meta.compte,
      classes: classes.length,
      specialites: classes.reduce((s, c) => s + c.sousClasses.length, 0),
      voies: classes.reduce((s, c) => s + c.sousClasses.reduce((t, sc) => t + sc.voies.length, 0), 0),
      eveils: classes.reduce((s, c) => s + c.sousClasses.reduce((t, sc) => t + sc.eveils.length, 0), 0),
      competences: nbCompetences + heritees.length,
      competencesCommunes: communes.length,
      competencesHeritees: heritees.length,
      objets: ancien.objets.lignes.length,
      objetsBoutique: e('Object.values(OBJETS).filter((o) => o.prix != null).length'),
      recettes: e('RECETTES.length'),
      zones: e('ZONES.length'),
      monstres: Object.keys(bestiaire.monstres).length,
      monstresDonjons: Object.keys(bestiaire.monstresDonjons).length,
      donjons: e('DONJONS.length'),
      epopees: e('DONJONS.filter((d) => !d.chronique).length'),
      chroniques: e('DONJONS.filter((d) => d.chronique).length'),
      scenes: nbScenes,
      hautsFaits: bourg.hautsFaits.length,
      familiers: Object.keys(bourg.familiers).length,
      races: Object.keys(e('RACES')).length,
      invocations: Object.keys(e('INVOCATIONS')).length,
      niveauMax: e('NIVEAU_MAX'),
    },
  };
}

// --- Assemblage -------------------------------------------------------
const classes = exporterClasses();
const communes = exporterCommunes();
const heritees = exporterHeritees();
const bestiaire = {
  ...ancien.bestiaire,
  monstres: exporterRegistreMonstres('MONSTRES'),
  monstresDonjons: exporterRegistreMonstres('MONSTRES_DONJONS'),
  difficultes: nettoyer(e('DIFFICULTES')),
  titresMiniBoss: e('TITRES_MINI_BOSS.slice()'),
};
const bourg = exporterBourg();
const donnees = {
  meta: null,
  socle: exporterSocle(),
  classes,
  competencesCommunes: communes,
  competencesHeritees: heritees,
  progression: exporterProgression(),
  equipement: ancien.equipement,
  objets: ancien.objets,
  craft: ancien.craft,
  monde: {
    ...ancien.monde,
    meteos: nettoyer(e('METEOS')),
    phasesJour: nettoyer(e('PHASES_JOUR')),
    heuresParMeteo: e('HEURES_PAR_METEO'),
  },
  bestiaire,
  donjons: ancien.donjons.map((ancienDonjon) => {
    const vivant = e('DONJONS').find((d) => d.id === ancienDonjon.id);
    if (!vivant) return ancienDonjon;
    const sortie = { ...ancienDonjon };
    if (vivant.familier) sortie.familier = vivant.familier;
    return sortie;
  }),
  bourg,
  systemes: ancien.systemes,
};
donnees.meta = exporterMeta(classes, communes, heritees, bestiaire, bourg);

fs.writeFileSync(cheminSortie, JSON.stringify(donnees));
console.log(`✔ ${cheminSortie} écrit (${Math.round(fs.statSync(cheminSortie).size / 1024)} ko)`);
