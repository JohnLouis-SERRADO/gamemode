'use strict';

// =====================================================================
// Harnais de test de Valciel (lot 0).
//
// Il charge exactement les mêmes fichiers de données que le jeu et vérifie
// que rien n'est cassé : cohérence du catalogue, courbe de progression,
// formules de combat, tirages de butin, et surtout — la règle d'or —
// qu'aucune sauvegarde existante ne perd quoi que ce soit en se chargeant.
//
// Ouvrir tests.html dans un navigateur. Tout doit être vert.
// =====================================================================

const SUITES = [];
let suiteCourante = null;

function suite(nom, corps) {
  suiteCourante = { nom, cas: [] };
  SUITES.push(suiteCourante);
  corps();
  suiteCourante = null;
}

function test(nom, corps) {
  suiteCourante.cas.push({ nom, corps });
}

// --- assertions ------------------------------------------------------
function verifier(condition, message) {
  if (!condition) throw new Error(message || 'condition fausse');
}

function egal(obtenu, attendu, message) {
  if (obtenu !== attendu) {
    throw new Error(`${message || 'valeurs différentes'} — attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`);
  }
}

function entre(valeur, min, max, message) {
  if (!(valeur >= min && valeur <= max)) {
    throw new Error(`${message || 'hors bornes'} — ${valeur} n'est pas entre ${min} et ${max}`);
  }
}

// Liste les éléments fautifs plutôt que d'échouer sur le premier : quand on
// ajoute mille objets d'un coup, on veut le rapport complet.
function aucun(liste, message) {
  if (liste.length === 0) return;
  const apercu = liste.slice(0, 8).join(', ');
  throw new Error(`${message} (${liste.length}) : ${apercu}${liste.length > 8 ? '…' : ''}`);
}

// Héros de référence, reconstruit à neuf pour chaque test qui en a besoin.
function herosTest(surcharges = {}) {
  const p = nouveauPersonnage({
    nom: 'Éprouvette', avatar: '⚔️', race: 'humain', classe: 'guerrier',
    stats: { for: 7, int: 2, agi: 3, vit: 6, cha: 2 },
    competences: ['frappe-heroique', 'coup-etourdissant', 'provocation', 'second-souffle'],
  });
  return Object.assign(p, surcharges);
}

// =====================================================================
// 1. Intégrité du catalogue — la famille qui protège les gros ajouts
// =====================================================================
suite('Catalogue et données', () => {
  test('toute compétence référencée par une classe existe', () => {
    const manquantes = [];
    Object.values(MODELES).forEach((m) => {
      m.competences.forEach((id) => { if (!COMPETENCES[id]) manquantes.push(`${m.nom} → ${id}`); });
    });
    Object.entries(VOIES_CLASSES).forEach(([classe, ids]) => {
      ids.forEach((id) => { if (!COMPETENCES[id]) manquantes.push(`${classe} → ${id}`); });
    });
    aucun(manquantes, 'compétences référencées mais inexistantes');
  });

  test('chaque classe a une signature qui existe', () => {
    const fautives = Object.entries(CLASSES)
      .filter(([, c]) => !c.signature || !COMPETENCES[c.signature])
      .map(([id]) => id);
    aucun(fautives, 'classes sans signature valide');
  });

  test('toute compétence d\'invocation pointe une créature connue', () => {
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => c.type === 'invocation' && !INVOCATIONS[c.invocation])
      .map(([id]) => id);
    aucun(fautives, 'invocations introuvables');
  });

  test('les compétences des invocations existent toutes', () => {
    const manquantes = [];
    Object.entries(INVOCATIONS).forEach(([id, inv]) => {
      inv.competences.forEach((c) => { if (!COMPETENCES[c]) manquantes.push(`${id} → ${c}`); });
    });
    aucun(manquantes, 'compétences d\'invocation inexistantes');
  });

  test('toute recette produit un objet du catalogue', () => {
    const fautives = RECETTES.filter((r) => !OBJETS[r.resultat]).map((r) => r.resultat);
    aucun(fautives, 'recettes sans objet produit');
  });

  test('tout matériau de recette existe au catalogue', () => {
    const manquants = [];
    RECETTES.forEach((r) => {
      Object.keys(r.materiaux).forEach((id) => {
        if (!OBJETS[id]) manquants.push(`${r.resultat} ← ${id}`);
      });
    });
    aucun(manquants, 'matériaux de recette inexistants');
  });

  test('tout équipement a un emplacement connu', () => {
    const slots = new Set([...Object.keys(SLOTS_EQUIPEMENT), 'accessoire']);
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => o.type === 'equipement' && !slots.has(o.slot))
      .map(([id, o]) => `${id} (${o.slot})`);
    aucun(fautifs, 'équipements à emplacement inconnu');
  });

  test('tout objet a un nom, un emoji et un type', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => !o.nom || !o.emoji || !['equipement', 'consommable', 'materiau'].includes(o.type))
      .map(([id]) => id);
    aucun(fautifs, 'objets incomplets');
  });

  test('toute rareté d\'objet est déclarée', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => o.rarete && !RARETES[o.rarete])
      .map(([id, o]) => `${id} (${o.rarete})`);
    aucun(fautifs, 'raretés inconnues');
  });

  test('tout objet vendable a un prix strictement positif', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => o.prix != null && !(o.prix > 0))
      .map(([id]) => id);
    aucun(fautifs, 'objets à prix nul ou négatif');
  });

  test('toute panoplie référencée existe', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => o.set && !SETS[o.set])
      .map(([id, o]) => `${id} → ${o.set}`);
    aucun(fautifs, 'panoplies inexistantes');
  });

  test('chaque panoplie a des paliers définis pour sa rareté', () => {
    const fautives = Object.entries(SETS)
      .filter(([, s]) => !BONUS_SET_PAR_RARETE[s.rarete])
      .map(([id]) => id);
    aucun(fautives, 'panoplies sans table de bonus');
  });

  test('tout matériau récoltable appartient à une filière de métier', () => {
    const familles = new Set(Object.values(METIERS).map((m) => m.famille));
    const fautifs = Object.entries(FAMILLE_MATERIAU)
      .filter(([, famille]) => !familles.has(famille))
      .map(([id]) => id);
    aucun(fautifs, 'matériaux à filière inconnue');
  });

  test('toute zone a des monstres et un boss qui existent', () => {
    const fautifs = [];
    ZONES.forEach((z) => {
      z.monstres.forEach((m) => { if (!MONSTRES[m]) fautifs.push(`${z.id} → ${m}`); });
      if (!MONSTRES[z.boss]) fautifs.push(`${z.id} → boss ${z.boss}`);
    });
    aucun(fautifs, 'monstres de zone inexistants');
  });

  test('toute récolte de zone existe au catalogue', () => {
    const fautifs = [];
    ZONES.forEach((z) => {
      (z.recolte || []).forEach((r) => { if (!OBJETS[r.id]) fautifs.push(`${z.id} → ${r.id}`); });
    });
    aucun(fautifs, 'récoltes de zone inexistantes');
  });

  test('tout butin de monstre existe au catalogue', () => {
    const fautifs = [];
    Object.entries(MONSTRES).forEach(([id, m]) => {
      (m.drops || []).forEach((d) => { if (!OBJETS[d.id]) fautifs.push(`${id} → ${d.id}`); });
    });
    aucun(fautifs, 'butins de monstre inexistants');
  });

  test('chaque boss de zone a son trophée de coffre', () => {
    const fautifs = ZONES
      .filter((z) => !COFFRES_BOSS[z.boss] || !OBJETS[COFFRES_BOSS[z.boss]])
      .map((z) => z.id);
    aucun(fautifs, 'boss sans trophée');
  });

  test('les zones sont ordonnées par niveau minimum croissant', () => {
    const desordre = [];
    for (let i = 1; i < ZONES.length; i++) {
      if (ZONES[i].niveauMin < ZONES[i - 1].niveauMin) desordre.push(ZONES[i].id);
    }
    aucun(desordre, 'zones dans le désordre');
  });

  test('chaque donjon a un identifiant unique et une étape de départ', () => {
    const vus = new Set();
    const fautifs = [];
    DONJONS.forEach((d) => {
      if (vus.has(d.id)) fautifs.push(`doublon ${d.id}`);
      vus.add(d.id);
      if (!d.depart || !d.etapes || !d.etapes[d.depart]) fautifs.push(`${d.id} sans départ valide`);
    });
    aucun(fautifs, 'donjons mal formés');
  });

  test('chaque Chronique vise une zone qui existe', () => {
    const ids = new Set(ZONES.map((z) => z.id));
    const fautives = CHRONIQUES.filter((c) => !ids.has(c.zone)).map((c) => c.nom);
    aucun(fautives, 'Chroniques sans zone');
  });

  test('chaque familier annonce un bonus non vide', () => {
    const fautifs = Object.entries(FAMILIERS)
      .filter(([, f]) => !f.bonus || Object.keys(f.bonus).length === 0)
      .map(([id]) => id);
    aucun(fautifs, 'familiers sans bonus');
  });

  test('chaque haut fait a un identifiant unique et une condition', () => {
    const vus = new Set();
    const fautifs = [];
    HAUTS_FAITS.forEach((h) => {
      if (vus.has(h.id)) fautifs.push(`doublon ${h.id}`);
      vus.add(h.id);
      if (typeof h.cond !== 'function') fautifs.push(`${h.id} sans condition`);
    });
    aucun(fautifs, 'hauts faits mal formés');
  });
});

// =====================================================================
// 2. Progression
// =====================================================================
suite('Progression', () => {
  test('la courbe d\'XP est strictement croissante jusqu\'au niveau maximum', () => {
    const ruptures = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      if (seuilXp(n) <= seuilXp(n - 1)) ruptures.push(`niv. ${n}`);
    }
    aucun(ruptures, 'paliers d\'XP non croissants');
  });

  test('le niveau 1 démarre à 0 XP', () => {
    egal(seuilXp(1), 0, 'seuil du niveau 1');
  });

  test('niveauPour est l\'inverse exact de seuilXp', () => {
    const fautifs = [];
    for (let n = 1; n <= NIVEAU_MAX; n++) {
      if (niveauPour(seuilXp(n)) !== n) fautifs.push(`niv. ${n}`);
      if (n < NIVEAU_MAX && niveauPour(seuilXp(n + 1) - 1) !== n) fautifs.push(`niv. ${n} (juste avant)`);
    }
    aucun(fautifs, 'inversions de niveau incorrectes');
  });

  test('niveauPour ne dépasse jamais le plafond', () => {
    egal(niveauPour(seuilXp(NIVEAU_MAX) * 100), NIVEAU_MAX, 'plafond de niveau');
  });

  test('les points de maîtrise ne décroissent jamais avec le niveau', () => {
    const ruptures = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      if (pointsMaitrisePourNiveau(n) < pointsMaitrisePourNiveau(n - 1)) ruptures.push(`niv. ${n}`);
    }
    aucun(ruptures, 'points de maîtrise en recul');
  });

  test('PV et mana augmentent avec le niveau', () => {
    const bas = herosTest({ niveau: 1 });
    const haut = herosTest({ niveau: NIVEAU_MAX });
    bornerVie(bas); bornerVie(haut);
    verifier(maxHpDe(haut) > maxHpDe(bas), 'les PV max devraient croître avec le niveau');
    verifier(maxMpDe(haut) > maxMpDe(bas), 'le mana max devrait croître avec le niveau');
  });

  test('la puissance croît avec les caractéristiques', () => {
    const faible = herosTest();
    const fort = herosTest({ stats: { for: 20, int: 20, agi: 20, vit: 20, cha: 20 } });
    bornerVie(faible); bornerVie(fort);
    verifier(puissanceDe(fort) > puissanceDe(faible), 'un héros mieux doté doit être plus puissant');
  });

  test('la puissance conseillée croît avec le niveau du contenu', () => {
    const ruptures = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      if (puissanceRecommandee(n) <= puissanceRecommandee(n - 1)) ruptures.push(`niv. ${n}`);
    }
    aucun(ruptures, 'recommandations non croissantes');
  });
});

// =====================================================================
// 3. Combat
// =====================================================================
suite('Combat', () => {
  test('le coût en mana ne dépasse jamais 30 % de la réserve', () => {
    const stats = { for: 60, int: 60, agi: 60, vit: 60, cha: 60 };
    const maxMp = 100;
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => coutMpDe(c, stats, maxMp) > Math.max(c.coutMp || 0, Math.round(maxMp * 0.3)))
      .map(([id]) => id);
    aucun(fautives, 'compétences qui dépassent le plafond de mana');
  });

  test('le coût en mana n\'est jamais négatif', () => {
    const stats = { for: 0, int: 0, agi: 0, vit: 0, cha: 0 };
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => coutMpDe(c, stats, 50) < 0)
      .map(([id]) => id);
    aucun(fautives, 'coûts de mana négatifs');
  });

  test('une compétence gratuite le reste, quelles que soient les stats', () => {
    const stats = { for: 99, int: 99, agi: 99, vit: 99, cha: 99 };
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => !c.coutMp && coutMpDe(c, stats, 200) > 0)
      .map(([id]) => id);
    aucun(fautives, 'compétences gratuites devenues payantes');
  });

  test('chaque compétence offensive ou de soin porte une stat et un ratio', () => {
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => ['degats', 'soin'].includes(c.type) && (!c.stat || !c.ratio))
      .map(([id]) => id);
    aucun(fautives, 'compétences sans stat de calcul');
  });

  test('chaque compétence vise une cible connue', () => {
    const cibles = new Set(Object.keys(TEXTE_CIBLE));
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => !cibles.has(c.cible))
      .map(([id, c]) => `${id} (${c.cible})`);
    aucun(fautives, 'cibles inconnues');
  });

  test('chaque compétence appartient à une catégorie affichable', () => {
    const connues = new Set([...Object.keys(CATEGORIES), 'signature']);
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => !connues.has(c.categorie))
      .map(([id, c]) => `${id} (${c.categorie})`);
    aucun(fautives, 'catégories inconnues');
  });

  test('les détails d\'une compétence se calculent sans erreur', () => {
    const stats = { for: 10, int: 10, agi: 10, vit: 10, cha: 10 };
    const fautives = [];
    Object.entries(COMPETENCES).forEach(([id, c]) => {
      try {
        const lignes = detailsCompetence(c, stats, 2, 80);
        if (!lignes.length) fautives.push(`${id} (aucune ligne)`);
      } catch (erreur) {
        fautives.push(`${id} (${erreur.message})`);
      }
    });
    aucun(fautives, 'compétences dont l\'affichage plante');
  });

  test('chaque attaque de monstre a un poids et un type valides', () => {
    const fautives = [];
    Object.entries(MONSTRES).forEach(([id, m]) => {
      (m.attaques || []).forEach((a) => {
        if (!(a.poids > 0)) fautives.push(`${id} → ${a.nom} (poids)`);
        if (!['mono', 'aoe', 'soin'].includes(a.type)) fautives.push(`${id} → ${a.nom} (type ${a.type})`);
      });
    });
    aucun(fautives, 'attaques de monstre mal formées');
  });

  test('les monstres montent en puissance avec leur niveau', () => {
    const ordonnes = Object.values(MONSTRES).filter((m) => !m.boss).sort((a, b) => a.niveau - b.niveau);
    const premier = ordonnes[0];
    const dernier = ordonnes[ordonnes.length - 1];
    verifier(dernier.hp > premier.hp * 10, 'l\'écart de PV entre le premier et le dernier monstre est trop faible');
    verifier(dernier.atk > premier.atk * 5, 'l\'écart d\'attaque est trop faible');
  });
});

// =====================================================================
// 4. Butin et économie
// =====================================================================
suite('Butin et économie', () => {
  test('tirerRarete ne renvoie que des raretés connues', () => {
    const inconnues = new Set();
    for (let i = 0; i < 3000; i++) {
      const r = tirerRarete(i % 30);
      if (!RARETES[r]) inconnues.add(r);
    }
    aucun([...inconnues], 'raretés inconnues tirées');
  });

  test('la Chance tire le butin vers le haut', () => {
    const rares = (cha) => {
      let n = 0;
      for (let i = 0; i < 4000; i++) {
        if (!['commun', 'inhabituel'].includes(tirerRarete(cha))) n++;
      }
      return n;
    };
    verifier(rares(30) > rares(0), 'une Chance élevée devrait produire plus d\'objets rares');
  });

  test('le multiplicateur de chance reste borné', () => {
    entre(multChanceDrop(0), 1, 1, 'chance nulle');
    entre(multChanceDrop(1000), 1, 2, 'chance extrême');
  });

  test('tout objet a un prix de revente d\'au moins 1 po', () => {
    const fautifs = Object.keys(OBJETS).filter((id) => prixVenteDe(id) < 1);
    aucun(fautifs, 'objets invendables');
  });

  test('un objet ne se revend jamais plus cher qu\'il ne s\'achète', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([id, o]) => o.prix && prixVenteDe(id) > o.prix)
      .map(([id]) => id);
    aucun(fautifs, 'objets revendus au-dessus du prix d\'achat');
  });

  test('les contrats du jour sont réalisables et récompensés', () => {
    const p = herosTest({ niveau: 12 });
    const quetes = genererQuetesDuJour(p);
    verifier(quetes.liste.length > 0, 'aucun contrat généré');
    const fautifs = quetes.liste
      .filter((q) => !(q.requis > 0) || !(q.recompense.po > 0) || !(q.recompense.xp > 0) || !RARETES[q.rarete])
      .map((q) => q.texte);
    aucun(fautifs, 'contrats mal formés');
  });

  test('les contrats sont les mêmes pour un même héros le même jour', () => {
    const p = herosTest({ niveau: 12 });
    const a = genererQuetesDuJour(p);
    const b = genererQuetesDuJour(p);
    egal(JSON.stringify(a.liste.map((q) => q.texte)), JSON.stringify(b.liste.map((q) => q.texte)),
      'le tirage du jour devrait être déterministe');
  });
});

// =====================================================================
// 5. Migration des sauvegardes — la règle d'or
// =====================================================================
suite('Migration des sauvegardes', () => {
  // Une sauvegarde d'avant la v8 : pas de classe, pas de grimoire, pas de
  // métiers, pas d'emplacements mains/pieds, pas de Chance.
  function sauvegardeAncienne() {
    return {
      version: 1, type: 'joueur', id: 'test-ancien', nom: 'Vieux Brisquard', avatar: '⚔️',
      stats: { for: 8, int: 3, agi: 4, vit: 7 },
      niveau: 12, xp: seuilXp(12), pointsEnAttente: 0,
      competences: ['frappe-heroique', 'tourbillon', 'provocation'],
      po: 1234,
      inventaire: [{ id: 'potion-soin', qte: 3 }, { id: 'minerai-fer', qte: 7 }],
      equipement: { arme: 'lame-de-fer', tete: null, torse: 'cotte-mailles', jambes: null, acc1: null, acc2: null },
      explorations: {}, bossVaincus: ['plaines'], cloud: null,
      hp: 50, mp: 10, maxHp: 0, maxMp: 0,
      statuts: [], cooldowns: {}, defense: false, ko: false,
    };
  }

  test('une sauvegarde d\'avant la v8 se charge sans erreur', () => {
    const p = normaliserPerso(sauvegardeAncienne());
    verifier(p, 'la migration devrait renvoyer un héros');
  });

  test('la migration ne perd ni or, ni niveau, ni inventaire', () => {
    const avant = sauvegardeAncienne();
    const p = normaliserPerso(sauvegardeAncienne());
    egal(p.po, avant.po, 'or conservé');
    egal(p.niveau, avant.niveau, 'niveau conservé');
    egal(p.inventaire.length, avant.inventaire.length, 'inventaire conservé');
    egal(compterObjet(p, 'minerai-fer'), 7, 'quantités conservées');
  });

  test('la migration ne perd aucun équipement porté', () => {
    const p = normaliserPerso(sauvegardeAncienne());
    egal(p.equipement.arme, 'lame-de-fer', 'arme conservée');
    egal(p.equipement.torse, 'cotte-mailles', 'torse conservé');
  });

  test('la migration ne perd aucune compétence connue', () => {
    const avant = sauvegardeAncienne();
    const p = normaliserPerso(sauvegardeAncienne());
    const perdues = avant.competences.filter((id) => !p.grimoire.includes(id));
    aucun(perdues, 'compétences disparues du grimoire');
  });

  test('la migration complète les champs manquants', () => {
    const p = normaliserPerso(sauvegardeAncienne());
    verifier(CLASSES[p.classe], 'une classe devrait être déduite');
    verifier(p.stats.cha != null, 'la Chance devrait être initialisée');
    verifier(p.equipement.mains !== undefined, 'l\'emplacement mains devrait exister');
    verifier(p.equipement.pieds !== undefined, 'l\'emplacement pieds devrait exister');
    verifier(p.metiers && Object.keys(p.metiers).length === Object.keys(METIERS).length, 'les métiers devraient être initialisés');
    verifier(Array.isArray(p.hautsFaits), 'les hauts faits devraient être une liste');
    verifier(p.tourBoss && typeof p.tourBoss === 'object', 'la Tour des Boss devrait être initialisée');
  });

  test('la migration est idempotente', () => {
    const une = normaliserPerso(sauvegardeAncienne());
    const deux = normaliserPerso(JSON.parse(JSON.stringify(une)));
    egal(deux.grimoire.length, une.grimoire.length, 'grimoire stable');
    egal(deux.competences.length, une.competences.length, 'barre de compétences stable');
    egal(deux.po, une.po, 'or stable');
  });

  test('la barre de compétences ne dépasse jamais le maximum', () => {
    const brut = sauvegardeAncienne();
    brut.competences = Object.keys(COMPETENCES).slice(0, 20);
    const p = normaliserPerso(brut);
    verifier(p.competences.length <= MAX_COMPETENCES_ACTIVES,
      `barre de ${p.competences.length} compétences, maximum ${MAX_COMPETENCES_ACTIVES}`);
  });

  test('un objet disparu du catalogue est écarté, pas planté', () => {
    const brut = sauvegardeAncienne();
    brut.inventaire.push({ id: 'objet-qui-n-existe-plus', qte: 2 });
    brut.equipement.tete = 'casque-fantome';
    const p = normaliserPerso(brut);
    verifier(!p.inventaire.some((e) => e.id === 'objet-qui-n-existe-plus'), 'l\'objet inconnu devrait être écarté');
    egal(p.equipement.tete, null, 'l\'emplacement devrait être vidé proprement');
  });

  test('un héros neuf est valide dès sa création', () => {
    const p = herosTest();
    verifier(p.maxHp > 0 && p.hp === p.maxHp, 'PV initialisés');
    verifier(p.maxMp > 0 && p.mp === p.maxMp, 'mana initialisé');
    verifier(p.grimoire.length >= p.competences.length, 'grimoire cohérent');
    verifier(CLASSES[p.classe], 'classe valide');
  });

  test('les compétences de classe arrivent aux bons niveaux', () => {
    const p = herosTest({ niveau: 15 });
    debloquerCompetencesClasse(p, false);
    const dues = Object.entries(COMPETENCES)
      .filter(([, c]) => c.classe === p.classe && (c.niveauRequis || 1) <= 15)
      .map(([id]) => id);
    const manquantes = dues.filter((id) => !p.grimoire.includes(id));
    aucun(manquantes, 'compétences de classe non débloquées');
  });
});

// =====================================================================
// Exécution et rapport
// =====================================================================
function lancerTests() {
  const sortie = document.getElementById('resultats');
  const resume = document.getElementById('resume');
  sortie.innerHTML = '';
  let reussis = 0;
  let echoues = 0;
  const debut = performance.now();

  SUITES.forEach((s) => {
    const bloc = document.createElement('section');
    bloc.className = 'suite';
    const titre = document.createElement('h2');
    titre.textContent = s.nom;
    bloc.appendChild(titre);

    let echecsSuite = 0;
    s.cas.forEach((cas) => {
      const ligne = document.createElement('div');
      ligne.className = 'cas';
      try {
        cas.corps();
        reussis++;
        ligne.classList.add('ok');
        ligne.innerHTML = `<span class="pastille">✓</span><span class="libelle">${cas.nom}</span>`;
      } catch (erreur) {
        echoues++;
        echecsSuite++;
        ligne.classList.add('ko');
        ligne.innerHTML = `<span class="pastille">✕</span><span class="libelle">${cas.nom}
          <span class="detail">${erreur.message}</span></span>`;
      }
      bloc.appendChild(ligne);
    });

    titre.innerHTML = `${s.nom} <span class="compte ${echecsSuite ? 'compte-ko' : 'compte-ok'}">${s.cas.length - echecsSuite}/${s.cas.length}</span>`;
    sortie.appendChild(bloc);
  });

  const duree = Math.round(performance.now() - debut);
  resume.className = echoues ? 'resume resume-ko' : 'resume resume-ok';
  resume.textContent = echoues
    ? `${echoues} test${echoues > 1 ? 's' : ''} en échec sur ${reussis + echoues} — ${duree} ms`
    : `${reussis} tests au vert — ${duree} ms`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('relancer').addEventListener('click', lancerTests);
  lancerTests();
});
