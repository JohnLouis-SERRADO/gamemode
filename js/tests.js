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
    stats: { for: 7, int: 2, dex: 3, vit: 6, cha: 2 },
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
    const fort = herosTest({ stats: { for: 20, int: 20, dex: 20, vit: 20, cha: 20 } });
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
    const stats = { for: 60, int: 60, dex: 60, vit: 60, cha: 60 };
    const maxMp = 100;
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => coutMpDe(c, stats, maxMp) > Math.max(c.coutMp || 0, Math.round(maxMp * 0.3)))
      .map(([id]) => id);
    aucun(fautives, 'compétences qui dépassent le plafond de mana');
  });

  test('le coût en mana n\'est jamais négatif', () => {
    const stats = { for: 0, int: 0, dex: 0, vit: 0, cha: 0 };
    const fautives = Object.entries(COMPETENCES)
      .filter(([, c]) => coutMpDe(c, stats, 50) < 0)
      .map(([id]) => id);
    aucun(fautives, 'coûts de mana négatifs');
  });

  test('une compétence gratuite le reste, quelles que soient les stats', () => {
    const stats = { for: 99, int: 99, dex: 99, vit: 99, cha: 99 };
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
    const stats = { for: 10, int: 10, dex: 10, vit: 10, cha: 10 };
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
      stats: { for: 8, int: 3, dex: 4, vit: 7 },
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
// 6. Caractéristiques — le modèle Final Fantasy XIV (v19)
// =====================================================================
suite('Caractéristiques FF XIV', () => {
  test('les six attributs principaux sont déclarés', () => {
    ['for', 'dex', 'int', 'esp', 'vit', 'cha'].forEach((cle) => {
      verifier(CARACS[cle], `attribut ${cle} manquant`);
      verifier(CARACS[cle].nom && CARACS[cle].emoji && CARACS[cle].desc, `attribut ${cle} incomplet`);
    });
    egal(Object.keys(CARACS).length, 6, 'nombre d\'attributs');
  });

  test('les six sous-caractéristiques sont déclarées et plafonnées', () => {
    ['crit', 'direct', 'deter', 'tenacite', 'celerite', 'piete'].forEach((cle) => {
      verifier(SOUS_CARACS[cle], `sous-caractéristique ${cle} manquante`);
      verifier(PLAFONDS_SOUS_CARACS[cle] > 0, `plafond de ${cle} manquant`);
    });
    egal(Object.keys(SOUS_CARACS).length, 6, 'nombre de sous-caractéristiques');
  });

  test('attributs et sous-caractéristiques ne se chevauchent jamais', () => {
    const collisions = Object.keys(SOUS_CARACS).filter((cle) => CARACS[cle]);
    aucun(collisions, 'clés présentes dans les deux familles');
  });

  test('une sous-caractéristique ne dépasse jamais son plafond', () => {
    // Un héros couvert de pièces divines ne doit pas atteindre 100 % de quoi
    // que ce soit : c'est ce qui empêche les builds invincibles.
    const p = herosTest({ niveau: 50 });
    const divins = Object.entries(OBJETS)
      .filter(([, o]) => o.type === 'equipement' && o.rarete === 'divin' && o.niveau <= 50);
    Object.keys(SLOTS_EQUIPEMENT).forEach((slot) => {
      const attendu = slot === 'acc1' || slot === 'acc2' ? 'accessoire' : slot;
      const piece = divins.find(([, o]) => o.slot === attendu);
      if (piece) p.equipement[slot] = piece[0];
    });
    const s = statsEffectives(p);
    const debordements = Object.keys(SOUS_CARACS)
      .filter((cle) => s[cle] > PLAFONDS_SOUS_CARACS[cle])
      .map((cle) => `${cle} = ${s[cle]} > ${PLAFONDS_SOUS_CARACS[cle]}`);
    aucun(debordements, 'plafonds dépassés');
  });

  test('statsEffectives renvoie toujours les douze clés', () => {
    const s = statsEffectives(herosTest());
    const manquantes = [...Object.keys(CARACS), ...Object.keys(SOUS_CARACS)]
      .filter((cle) => typeof s[cle] !== 'number');
    aucun(manquantes, 'clés absentes de statsEffectives');
  });

  test('un combattant sans stats ne fait pas planter le calcul', () => {
    const s = statsEffectives({ type: 'joueur' });
    const fautives = Object.keys(s).filter((cle) => typeof s[cle] !== 'number');
    aucun(fautives, 'valeurs non numériques');
  });

  test('la Piété augmente réellement la réserve de mana', () => {
    const sans = herosTest({ niveau: 20 });
    const avec = herosTest({ niveau: 20 });
    avec.statsEff = { ...statsEffectives(sans), piete: 40 };
    verifier(maxMpDe(avec) > maxMpDe(sans), 'la Piété devrait gonfler le mana maximum');
  });

  test('l\'Esprit augmente la réserve de mana et la puissance des soins', () => {
    const base = { for: 5, dex: 5, int: 5, esp: 5, vit: 5, cha: 5 };
    const soin = COMPETENCES.soin;
    const faible = statDeCompetence(soin, { ...base, esp: 0 });
    const fort = statDeCompetence(soin, { ...base, esp: 40 });
    verifier(fort > faible, 'l\'Esprit devrait porter les soins');
  });

  test('un ancien soigneur ne perd rien : l\'Intelligence fait foi si elle est meilleure', () => {
    const ancien = { for: 2, dex: 2, int: 40, esp: 2, vit: 2, cha: 2 };
    egal(statDeCompetence(COMPETENCES.soin, ancien), 40, 'soin porté par l\'Intelligence');
    // …mais l'Intelligence ne déborde pas sur ce qui n'est pas du soutien.
    egal(statDeCompetence(COMPETENCES['boule-de-feu'], ancien), 40, 'dégâts magiques');
    const espritue = { for: 2, dex: 2, int: 2, esp: 40, vit: 2, cha: 2 };
    egal(statDeCompetence(COMPETENCES['boule-de-feu'], espritue), 2, 'l\'Esprit ne porte pas les dégâts');
  });

  test('chaque modèle de classe distribue exactement la dotation de création', () => {
    const attendu = POINTS_CREATION + Object.keys(CARACS).length * STAT_BASE;
    const fautifs = MODELES
      .map((m) => [m.nom, Object.keys(CARACS).reduce((somme, cle) => somme + m.stats[cle], 0)])
      .filter(([, total]) => total !== attendu)
      .map(([nom, total]) => `${nom} (${total} au lieu de ${attendu})`);
    aucun(fautifs, 'modèles mal dotés');
  });

  test('aucun modèle ne dépasse le plafond de création', () => {
    const fautifs = [];
    MODELES.forEach((m) => {
      Object.keys(CARACS).forEach((cle) => {
        if (m.stats[cle] > STAT_MAX_CREATION) fautifs.push(`${m.nom} → ${cle} = ${m.stats[cle]}`);
      });
    });
    aucun(fautifs, 'caractéristiques au-dessus du plafond');
  });

  test('l\'Esprit a des armes à sa mesure', () => {
    const armes = Object.values(OBJETS)
      .filter((o) => o.type === 'equipement' && o.slot === 'arme' && o.bonus && o.bonus.esp);
    verifier(armes.length > 0, 'aucune arme ne porte l\'Esprit');
  });

  test('les objets rares et mieux portent des sous-caractéristiques', () => {
    const rares = Object.values(OBJETS).filter((o) => o.type === 'equipement'
      && ['epique', 'legendaire', 'mythique', 'divin'].includes(o.rarete));
    const sans = rares.filter((o) => !Object.keys(SOUS_CARACS).some((cle) => o.bonus && o.bonus[cle]));
    verifier(sans.length < rares.length * 0.05,
      `${sans.length} objets de haute rareté sur ${rares.length} n'ont aucune sous-caractéristique`);
  });

  test('tout bonus d\'objet porte une clé connue', () => {
    const connues = new Set([...Object.keys(CARACS), ...Object.keys(SOUS_CARACS), 'pvMax', 'pmMax', 'xpBonus', 'poBonus']);
    const fautifs = [];
    Object.entries(OBJETS).forEach(([id, o]) => {
      Object.keys(o.bonus || {}).forEach((cle) => {
        if (!connues.has(cle)) fautifs.push(`${id} → ${cle}`);
      });
    });
    aucun(fautifs, 'clés de bonus inconnues');
  });

  test('texteBonus sait nommer toutes les clés', () => {
    const connues = [...Object.keys(CARACS), ...Object.keys(SOUS_CARACS), 'pvMax', 'pmMax'];
    const fautives = connues.filter((cle) => {
      // Sans libellé, texteBonus recrache la clé brute telle quelle.
      const rendu = texteBonus({ [cle]: 3 });
      return rendu === `+3 ${cle}` || rendu === `+3 % ${cle}`;
    });
    aucun(fautives, 'clés sans libellé lisible');
  });
});

// =====================================================================
// 7. La route jusqu'au niveau 100 (v19)
// =====================================================================
suite('Route jusqu\'au niveau 100', () => {
  test('le plafond est bien à 100', () => {
    egal(NIVEAU_MAX, 100, 'niveau maximum');
  });

  test('la courbe d\'XP reste continue aux deux raccords', () => {
    // Un saut brutal à 50 ou à 80 se verrait comme un mur en jeu.
    [PALIER_XP_MOYEN, PALIER_XP_HAUT].forEach((palier) => {
      const avant = seuilXp(palier) - seuilXp(palier - 1);
      const apres = seuilXp(palier + 1) - seuilXp(palier);
      verifier(apres > avant, `le palier ${palier} devrait durcir la pente`);
      verifier(apres < avant * 12, `le palier ${palier} fait un mur (×${Math.round(apres / avant)})`);
    });
  });

  test('la courbe d\'XP d\'avant le niveau 50 est inchangée', () => {
    // Les héros existants ne doivent voir aucune différence sur le chemin
    // qu'ils ont déjà parcouru.
    const ancienne = (n) => 14 * (n - 1) * (n - 1) + 30 * (n - 1);
    const ecarts = [];
    for (let n = 1; n <= 50; n++) {
      if (seuilXp(n) !== ancienne(n)) ecarts.push(`niv. ${n}`);
    }
    aucun(ecarts, 'paliers d\'XP modifiés sous le niveau 50');
  });

  test('les points par niveau suivent les trois tranches', () => {
    egal(pointsPourNiveau(30), 2, 'tranche 1-50');
    egal(pointsPourNiveau(60), 3, 'tranche 51-80');
    egal(pointsPourNiveau(85), 4, 'tranche 81-100');
    egal(pointsPourNiveau(90), 14, 'palier de respiration du niveau 90');
    egal(pointsPourNiveau(100), 14, 'palier de respiration du niveau 100');
    egal(pointsPourNiveau(1), 0, 'aucun point au niveau 1');
  });

  test('pointsCumules est cohérent avec pointsPourNiveau', () => {
    let somme = 0;
    const ecarts = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      somme += pointsPourNiveau(n);
      if (pointsCumules(n) !== somme) ecarts.push(`niv. ${n}`);
    }
    aucun(ecarts, 'cumuls incohérents');
  });

  test('les paliers de maîtrise vont jusqu\'au niveau 100', () => {
    egal(SEUILS_MAITRISE[SEUILS_MAITRISE.length - 1], 100, 'dernier palier de maîtrise');
    const desordre = SEUILS_MAITRISE.filter((s, i) => i > 0 && s <= SEUILS_MAITRISE[i - 1]);
    aucun(desordre, 'paliers de maîtrise dans le désordre');
  });

  test('la puissance conseillée reste atteignable à chaque niveau', () => {
    // Un héros de référence, correctement doté, doit rester dans l'épure de
    // la recommandation de son niveau — sinon toutes les cartes s'affichent
    // en rouge et l'indicateur ne veut plus rien dire.
    const ecarts = [];
    [1, 10, 25, 50, 70, 85, 100].forEach((n) => {
      const p = herosTest({ niveau: n });
      const points = POINTS_CREATION + 6 * STAT_BASE + pointsCumules(n);
      const part = Math.floor(points / 6);
      Object.keys(CARACS).forEach((cle) => { p.stats[cle] = part; });
      bornerVie(p);
      const rapport = puissanceDe(p) / puissanceRecommandee(n);
      if (rapport < 0.55 || rapport > 1.6) ecarts.push(`niv. ${n} (×${rapport.toFixed(2)})`);
    });
    aucun(ecarts, 'recommandations décalées du héros de référence');
  });
});

// =====================================================================
// 8. Les six classes et leurs sous-classes (v19)
// =====================================================================
suite('Classes et sous-classes', () => {
  test('six classes de base, et pas une de plus à la création', () => {
    egal(Object.keys(CLASSES_BASE).length, 6, 'classes de base');
    egal(MODELES.length, 6, 'modèles proposés à la création');
  });

  test('chaque classe couvre un rôle distinct', () => {
    const roles = Object.values(CLASSES_BASE).map((c) => c.role);
    egal(new Set(roles).size, roles.length, 'des rôles font doublon');
    verifier(roles.includes('Tank'), 'aucune classe de tank');
    verifier(roles.includes('Soigneur'), 'aucune classe de soigneur');
  });

  test('chaque classe a un attribut porteur et une catégorie d\'armure', () => {
    const fautives = Object.entries(CLASSES_BASE)
      .filter(([, c]) => !CARACS[c.stat] || !['plaque', 'maille', 'cuir', 'tissu'].includes(c.armure))
      .map(([id]) => id);
    aucun(fautives, 'classes mal définies');
  });

  test('chaque classe a huit compétences, qui existent toutes', () => {
    const fautives = [];
    Object.entries(CLASSES_BASE).forEach(([id, c]) => {
      if (c.competences.length !== 8) fautives.push(`${id} (${c.competences.length} compétences)`);
      c.competences.forEach((cle) => { if (!COMPETENCES[cle]) fautives.push(`${id} → ${cle}`); });
    });
    aucun(fautives, 'kits de classe incomplets');
  });

  test('chaque classe a une signature', () => {
    const fautives = Object.entries(CLASSES_BASE)
      .filter(([, c]) => !c.signature || !COMPETENCES[c.signature])
      .map(([id]) => id);
    aucun(fautives, 'classes sans signature');
  });

  test('vingt-sept sous-classes, de quatre à six par classe', () => {
    egal(Object.keys(SOUS_CLASSES).length, 27, 'sous-classes');
    const horsBornes = Object.entries(CLASSES_BASE)
      .filter(([, c]) => c.sousClasses.length < 4 || c.sousClasses.length > 6)
      .map(([id, c]) => `${id} (${c.sousClasses.length})`);
    aucun(horsBornes, 'classes hors de la fourchette 4-6');
  });

  test('chaque sous-classe est rattachée à une classe existante', () => {
    const fautives = Object.entries(SOUS_CLASSES)
      .filter(([, sc]) => !CLASSES_BASE[sc.classe])
      .map(([id]) => id);
    aucun(fautives, 'sous-classes orphelines');
  });

  test('chaque sous-classe a huit compétences et une signature', () => {
    const fautives = [];
    Object.entries(SOUS_CLASSES).forEach(([id, sc]) => {
      if (sc.competences.length !== 8) fautives.push(`${id} (${sc.competences.length})`);
      if (!sc.signature) fautives.push(`${id} (sans signature)`);
    });
    aucun(fautives, 'sous-classes incomplètes');
  });

  test('chaque sous-classe annonce un passif et un bonus de caractéristiques', () => {
    const fautives = Object.entries(SOUS_CLASSES)
      .filter(([, sc]) => !sc.passif || !sc.resume || !sc.bonusStats || !Object.keys(sc.bonusStats).length)
      .map(([id]) => id);
    aucun(fautives, 'sous-classes sans identité');
  });

  test('les bonus de sous-classe ne portent que des attributs connus', () => {
    const fautifs = [];
    Object.entries(SOUS_CLASSES).forEach(([id, sc]) => {
      Object.keys(sc.bonusStats).forEach((cle) => {
        if (!CARACS[cle]) fautifs.push(`${id} → ${cle}`);
      });
    });
    aucun(fautifs, 'bonus sur des attributs inconnus');
  });

  test('les sous-classes d\'une même classe sont équilibrées entre elles', () => {
    // Un écart de dotation entre deux spécialités d'un même rôle serait un
    // choix forcé déguisé en choix libre.
    const ecarts = [];
    Object.entries(CLASSES_BASE).forEach(([id, c]) => {
      const totaux = c.sousClasses.map((cle) => Object.values(SOUS_CLASSES[cle].bonusStats)
        .reduce((somme, v) => somme + v, 0));
      const min = Math.min(...totaux);
      const max = Math.max(...totaux);
      if (max - min > 1) ecarts.push(`${id} (de ${min} à ${max})`);
    });
    aucun(ecarts, 'dotations de sous-classe déséquilibrées');
  });

  test('aucune compétence de classe n\'est orpheline', () => {
    const classes = new Set(Object.keys(CLASSES_BASE));
    const sousClasses = new Set(Object.keys(SOUS_CLASSES));
    const orphelines = Object.entries(COMPETENCES)
      .filter(([, c]) => !c.heritee)
      .filter(([, c]) => (c.classe && !classes.has(c.classe)) || (c.sousClasse && !sousClasses.has(c.sousClasse)))
      .map(([id, c]) => `${id} (${c.classe || c.sousClasse})`);
    aucun(orphelines, 'compétences rattachées à un néant');
    // Les compétences héritées de l'Aventurier restent utilisables.
    const heritees = Object.values(COMPETENCES).filter((c) => c.heritee);
    verifier(heritees.length === 8, `${heritees.length} compétences héritées au lieu de 8`);
  });

  test('chaque compétence suit l\'attribut de sa famille', () => {
    // Un Moine ne doit pas avoir à monter la Dextérité dans une classe de Force.
    const recalables = ['for', 'dex', 'int', 'esp'];
    const fautives = [];
    Object.entries(COMPETENCES).forEach(([id, c]) => {
      if (!recalables.includes(c.stat)) return;
      const famille = c.classe ? CLASSES_BASE[c.classe]
        : (c.sousClasse ? CLASSES_BASE[SOUS_CLASSES[c.sousClasse].classe] : null);
      if (famille && c.stat !== famille.stat) fautives.push(`${id} : ${c.stat} au lieu de ${famille.stat}`);
    });
    aucun(fautives, 'compétences sur le mauvais attribut');
  });

  test('les vingt et une classes historiques sont toutes prises en charge', () => {
    const historiques = ['guerrier', 'mage', 'archer', 'clerc', 'paladin', 'necromancien', 'moine',
      'barde', 'rodeur', 'assassin', 'berserker', 'templier', 'elementaliste', 'druide', 'invocateur',
      'pyromancien', 'givremage', 'chaman', 'voleur', 'danselame', 'aventurier'];
    const oubliees = historiques.filter((id) => !MIGRATION_CLASSES[id]);
    aucun(oubliees, 'classes historiques sans destination');
    egal(historiques.length, 21, 'nombre de classes historiques');
  });

  test('les seize classes devenues sous-classes gardent leurs compétences', () => {
    const fautives = [];
    Object.entries(MIGRATION_CLASSES).forEach(([ancienne, cible]) => {
      if (!cible.sousClasse) return;
      const sc = SOUS_CLASSES[cible.sousClasse];
      if (!sc) { fautives.push(`${ancienne} → sous-classe inconnue`); return; }
      if (sc.competences.length !== 8) fautives.push(`${ancienne} (${sc.competences.length} compétences)`);
    });
    aucun(fautives, 'classes historiques appauvries');
  });

  test('un Pyromancien sauvegardé devient Arcaniste — Pyromancien sans rien perdre', () => {
    const avant = {
      version: 2, type: 'joueur', id: 'test-pyro', nom: 'Braise', avatar: '🔮',
      classe: 'pyromancien',
      stats: { for: 2, int: 24, agi: 5, vit: 9, cha: 4 },
      niveau: 22, xp: seuilXp(22), pointsEnAttente: 0,
      competences: ['boule-de-feu', 'eclair', 'pyromancien-etincelle', 'signature-supernova'],
      po: 8400, inventaire: [{ id: 'potion-soin', qte: 5 }],
      equipement: { arme: 'baton-tempetes', tete: null, torse: null, jambes: null, acc1: null, acc2: null },
      explorations: {}, bossVaincus: ['plaines', 'foret'], cloud: null,
      hp: 100, mp: 40, maxHp: 0, maxMp: 0,
      statuts: [], cooldowns: {}, defense: false, ko: false,
    };
    const p = normaliserPerso(JSON.parse(JSON.stringify(avant)));
    egal(p.classe, 'arcaniste', 'classe de base');
    egal(p.sousClasse, 'pyromancien', 'sous-classe');
    egal(p.po, avant.po, 'or conservé');
    egal(p.niveau, avant.niveau, 'niveau conservé');
    egal(p.equipement.arme, 'baton-tempetes', 'équipement conservé');
    const perdues = avant.competences.filter((id) => !p.grimoire.includes(id));
    aucun(perdues, 'compétences disparues');
    // Et il reçoit bien les huit compétences de sa sous-classe.
    const dues = SOUS_CLASSES.pyromancien.competences.filter((id) => !p.grimoire.includes(id));
    aucun(dues, 'compétences de sous-classe non attribuées');
  });

  test('la migration des classes est idempotente', () => {
    const brut = {
      version: 2, type: 'joueur', id: 'test-idem', nom: 'Écho', avatar: '⚔️', classe: 'berserker',
      stats: { for: 20, int: 3, agi: 6, vit: 12, cha: 3 },
      niveau: 30, xp: seuilXp(30), pointsEnAttente: 0,
      competences: ['dechainement', 'cri-de-guerre'], po: 500,
      inventaire: [], equipement: { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null },
      explorations: {}, bossVaincus: [], cloud: null,
      hp: 100, mp: 20, maxHp: 0, maxMp: 0, statuts: [], cooldowns: {}, defense: false, ko: false,
    };
    const une = normaliserPerso(JSON.parse(JSON.stringify(brut)));
    egal(une.classe, 'guerrier', 'première migration — classe');
    egal(une.sousClasse, 'berserker', 'première migration — sous-classe');
    const deux = normaliserPerso(JSON.parse(JSON.stringify(une)));
    egal(deux.classe, 'guerrier', 'seconde migration — classe');
    egal(deux.sousClasse, 'berserker', 'la sous-classe ne doit pas être effacée');
  });

  test('une classe de base historique garde sa liberté de spécialité', () => {
    const brut = {
      version: 2, type: 'joueur', id: 'test-mage', nom: 'Sibylle', avatar: '🔮', classe: 'mage',
      stats: { for: 2, int: 18, agi: 4, vit: 7, cha: 3 },
      niveau: 25, xp: seuilXp(25), pointsEnAttente: 0,
      competences: ['boule-de-feu'], po: 100,
      inventaire: [], equipement: { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null },
      explorations: {}, bossVaincus: [], cloud: null,
      hp: 80, mp: 40, maxHp: 0, maxMp: 0, statuts: [], cooldowns: {}, defense: false, ko: false,
    };
    const p = normaliserPerso(brut);
    egal(p.classe, 'arcaniste', 'classe de base');
    egal(p.sousClasse, null, 'la spécialité reste à choisir');
  });

  test('le bonus de sous-classe entre bien dans les statistiques', () => {
    const sans = herosTest({ niveau: 20, classe: 'guerrier', sousClasse: null });
    const avec = herosTest({ niveau: 20, classe: 'guerrier', sousClasse: 'berserker' });
    const bonus = SOUS_CLASSES.berserker.bonusStats.for;
    egal(statsEffectives(avec).for - statsEffectives(sans).for, bonus, 'bonus de Force du Berserker');
  });

  test('le nom affiché suit la spécialité', () => {
    egal(nomCompletClasse({ classe: 'gardien', sousClasse: null }), 'Gardien', 'sans spécialité');
    egal(nomCompletClasse({ classe: 'gardien', sousClasse: 'templier' }), 'Gardien — Templier', 'avec spécialité');
  });

  test('les modèles de création couvrent les six classes', () => {
    const manquants = Object.keys(CLASSES_BASE).filter((id) => !MODELES.some((m) => m.id === id));
    aucun(manquants, 'classes absentes de la création');
    const fautifs = MODELES.filter((m) => m.competences.some((cle) => !COMPETENCES[cle])).map((m) => m.nom);
    aucun(fautifs, 'modèles aux compétences inexistantes');
  });
});

// =====================================================================
// 9. Typage de l'équipement et économie (v19)
// =====================================================================
suite('Équipement et économie', () => {
  test('les quatre catégories d\'armure et les six familles d\'arme existent', () => {
    egal(Object.keys(CATEGORIES_ARMURE).length, 4, 'catégories d\'armure');
    egal(Object.keys(FAMILLES_ARME).length, 6, 'familles d\'arme');
  });

  test('chaque classe déclare ce qu\'elle sait porter', () => {
    const fautives = Object.keys(CLASSES_BASE).filter((id) => {
      const r = EQUIPEMENT_PAR_CLASSE[id];
      return !r || !CATEGORIES_ARMURE[r.armure] || !r.armes.length
        || r.armes.some((a) => !FAMILLES_ARME[a]);
    });
    aucun(fautives, 'classes sans règles d\'équipement');
  });

  test('chaque catégorie d\'armure a des porteurs, et chaque famille d\'arme aussi', () => {
    const armuresPortees = new Set(Object.values(EQUIPEMENT_PAR_CLASSE).map((r) => r.armure));
    const armesManiees = new Set(Object.values(EQUIPEMENT_PAR_CLASSE).flatMap((r) => r.armes));
    aucun(Object.keys(CATEGORIES_ARMURE).filter((a) => !armuresPortees.has(a)), 'armures que personne ne porte');
    aucun(Object.keys(FAMILLES_ARME).filter((a) => !armesManiees.has(a)), 'armes que personne ne manie');
  });

  test('toute pièce d\'armure porte une matière, toute arme une famille', () => {
    const fautifs = Object.entries(OBJETS)
      .filter(([, o]) => o.type === 'equipement')
      .filter(([, o]) => {
        if (SLOTS_ARMURE.includes(o.slot)) return o.armure && !CATEGORIES_ARMURE[o.armure];
        if (o.slot === 'arme') return o.familleArme && !FAMILLES_ARME[o.familleArme];
        return false;
      })
      .map(([id]) => id);
    aucun(fautifs, 'pièces au type inconnu');
  });

  test('une armure de plaque n\'est pas portable par un Arcaniste', () => {
    const mage = herosTest({ classe: 'arcaniste', sousClasse: null });
    const plaque = Object.values(OBJETS).find((o) => o.armure === 'plaque');
    const tissu = Object.values(OBJETS).find((o) => o.armure === 'tissu');
    verifier(!peutPorter(mage, plaque), 'l\'Arcaniste ne devrait pas porter la plaque');
    verifier(peutPorter(mage, tissu), 'l\'Arcaniste devrait porter le tissu');
    verifier(raisonRefusEquipement(mage, plaque).length > 10, 'le refus devrait être expliqué');
  });

  test('un Gardien porte la plaque mais pas la robe', () => {
    const tank = herosTest({ classe: 'gardien', sousClasse: 'templier' });
    const plaque = Object.values(OBJETS).find((o) => o.armure === 'plaque');
    const tissu = Object.values(OBJETS).find((o) => o.armure === 'tissu');
    verifier(peutPorter(tank, plaque), 'le Gardien devrait porter la plaque');
    verifier(!peutPorter(tank, tissu), 'le Gardien ne devrait pas porter le tissu');
  });

  test('les accessoires restent ouverts à tout le monde', () => {
    const anneau = Object.values(OBJETS).find((o) => o.slot === 'accessoire' && o.type === 'equipement');
    const fautives = Object.keys(CLASSES_BASE)
      .filter((id) => !peutPorter({ classe: id }, anneau));
    aucun(fautives, 'classes privées d\'accessoires');
  });

  test('chaque classe trouve de quoi s\'équiper à tous ses emplacements', () => {
    const trous = [];
    Object.keys(CLASSES_BASE).forEach((id) => {
      const heros = { classe: id };
      ['arme', ...SLOTS_ARMURE].forEach((slot) => {
        const dispo = Object.values(OBJETS).some((o) => o.type === 'equipement'
          && o.slot === slot && peutPorter(heros, o));
        if (!dispo) trous.push(`${id} → ${slot}`);
      });
    });
    aucun(trous, 'classes sans équipement disponible');
  });

  test('la boutique a bien grandi d\'au moins mille articles', () => {
    const enBoutique = Object.values(OBJETS).filter((o) => o.prix).length;
    verifier(enBoutique >= 2295, `seulement ${enBoutique} articles en boutique (1 295 avant, +1 000 demandés)`);
  });

  test('l\'étal et le butin accompagnent le héros jusqu\'au niveau 100', () => {
    const hauts = Object.values(OBJETS).filter((o) => o.type === 'equipement' && o.niveau > 50);
    verifier(hauts.length > 500, `seulement ${hauts.length} pièces au-delà du niveau 50`);
    const boutiqueHaute = Object.values(OBJETS).filter((o) => o.prix && o.niveau >= 90);
    verifier(boutiqueHaute.length > 0, 'rien en boutique au niveau 90+');
  });

  test('la revente est dégressive avec la rareté', () => {
    // Deux pièces de même prix ne se revendent pas pareil : plus c'est rare,
    // moins la revente en rend, pour que ça se garde ou s'échange.
    const parts = ['commun', 'rare', 'legendaire', 'divin'].map((r) => REVENTE_PAR_RARETE[r]);
    for (let i = 1; i < parts.length; i++) {
      verifier(parts[i] < parts[i - 1], 'la revente devrait décroître avec la rareté');
    }
    verifier(PART_REVENTE <= 0.25, `la part de revente reste à ${PART_REVENTE}`);
  });

  test('un équipement de son niveau coûte plus qu\'un contrat de guilde', () => {
    // C'est tout l'objet du rééquilibrage : l'or ne doit plus tomber du ciel.
    const p = herosTest({ niveau: 50 });
    const contrats = genererQuetesDuJour(p).liste;
    const meilleur = Math.max(...contrats.map((q) => q.recompense.po));
    const piece = prixBoutique(50, 'legendaire');
    verifier(piece > meilleur * 2,
      `une pièce légendaire niv. 50 coûte ${piece} po, le meilleur contrat en rapporte ${meilleur}`);
  });

  test('les prix croissent franchement avec le niveau', () => {
    const ruptures = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      if (prixBoutique(n, 'rare') <= prixBoutique(n - 1, 'rare')) ruptures.push(`niv. ${n}`);
    }
    aucun(ruptures, 'prix non croissants');
  });

  test('chaque série d\'artisan vise une matière', () => {
    const fautives = SETS_CRAFT.filter((s) => !CATEGORIES_ARMURE[s.armure]).map((s) => s.suffixe);
    aucun(fautives, 'séries sans matière');
  });

  test('chaque série propose une arme pour chaque famille', () => {
    const manquantes = [];
    SETS_CRAFT.slice(0, 3).forEach((serie) => {
      const idBase = serie.suffixe.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      Object.keys(FAMILLES_ARME).forEach((famille) => {
        const trouvee = Object.values(OBJETS).some((o) => o.set === `craft-${idBase}` && o.familleArme === famille);
        if (!trouvee) manquantes.push(`${serie.suffixe} → ${famille}`);
      });
    });
    aucun(manquantes, 'familles d\'arme absentes des séries');
  });
});

// =====================================================================
// 10. Le monde vivant : heure et météo (v19)
// =====================================================================
suite('Monde vivant', () => {
  test('les trois phases couvrent les vingt-quatre heures', () => {
    const trous = [];
    for (let h = 0; h < 24; h++) {
      const phase = phaseCourante(new Date(2026, 5, 12, h, 30));
      if (!phase || !PHASES_JOUR.includes(phase)) trous.push(`${h} h`);
    }
    aucun(trous, 'heures sans phase');
    egal(phaseCourante(new Date(2026, 5, 12, 3)).id, 'nuit', '3 h du matin');
    egal(phaseCourante(new Date(2026, 5, 12, 9)).id, 'aube', '9 h');
    egal(phaseCourante(new Date(2026, 5, 12, 15)).id, 'jour', '15 h');
    egal(phaseCourante(new Date(2026, 5, 12, 22)).id, 'nuit', '22 h');
  });

  test('la météo est déterministe : même instant, même ciel', () => {
    // C'est ce qui permet à tous les joueurs d'avoir la même météo sans
    // qu'aucun serveur n'ait à la leur dire — et de jouer hors ligne.
    const instant = new Date(Date.UTC(2026, 3, 20, 14, 7));
    const premier = meteoCourante(instant).id;
    for (let i = 0; i < 50; i++) {
      if (meteoCourante(new Date(instant.getTime())).id !== premier) {
        throw new Error('la météo change alors que l\'instant est le même');
      }
    }
  });

  test('la météo change bien toutes les trois heures', () => {
    const base = Date.UTC(2026, 3, 20, 0, 0);
    const tranches = [];
    for (let h = 0; h < 24; h += HEURES_PAR_METEO) {
      tranches.push(meteoCourante(new Date(base + h * 3600000)).id);
    }
    egal(tranches.length, 8, 'tranches de météo dans la journée');
    // Dans la même tranche, le ciel ne bouge pas.
    egal(meteoCourante(new Date(base + 30 * 60000)).id,
      meteoCourante(new Date(base + 100 * 60000)).id, 'stabilité dans la tranche');
  });

  test('les six météos apparaissent toutes sur deux semaines', () => {
    const vues = new Set();
    for (let h = 0; h < 24 * 14; h += HEURES_PAR_METEO) {
      vues.add(meteoCourante(new Date(Date.UTC(2026, 0, 1) + h * 3600000)).id);
    }
    const absentes = Object.keys(METEOS).filter((id) => !vues.has(id));
    aucun(absentes, 'météos qui n\'arrivent jamais');
  });

  test('chaque phase et chaque météo annonce ses effets en clair', () => {
    const fautifs = [];
    PHASES_JOUR.forEach((p) => {
      if (!p.emoji || !p.resume || !p.detail) fautifs.push(`phase ${p.id}`);
    });
    Object.entries(METEOS).forEach(([id, m]) => {
      if (!m.emoji || !m.resume || !m.detail || !(m.poids > 0)) fautifs.push(`météo ${id}`);
    });
    aucun(fautifs, 'entrées incomplètes');
  });

  test('les effets du monde restent dans des bornes raisonnables', () => {
    // Un monde vivant ne doit pas devenir un monde capricieux : aucun
    // effet ne doit doubler ni annuler quoi que ce soit.
    const exces = [];
    for (let h = 0; h < 24 * 7; h++) {
      const monde = mondeMaintenant(new Date(Date.UTC(2026, 0, 1) + h * 3600000));
      Object.entries(monde.effets).forEach(([cle, v]) => {
        if (typeof v !== 'number') return;
        // Deux effets ne sont pas des multiplicateurs : ils se lisent
        // autrement, et n'ont donc pas à tenir dans la même fourchette.
        if (cle === 'manaParTour') { if (v < -0.1) exces.push(`${cle} = ${v}`); return; }
        if (cle === 'gelPeriodique') { if (v < 2) exces.push(`${cle} = ${v}`); return; }
        if (v < 0.7 || v > 1.6) exces.push(`${cle} = ${v.toFixed(2)}`);
      });
    }
    aucun([...new Set(exces)], 'effets hors bornes');
  });

  test('le physique ignore le temps qu\'il fait', () => {
    const ciels = [];
    for (let h = 0; h < 24 * 3; h += HEURES_PAR_METEO) {
      ciels.push(multElementMonde(null, mondeMaintenant(new Date(Date.UTC(2026, 0, 1) + h * 3600000))));
    }
    aucun(ciels.filter((m) => m !== 1).map(String), 'le physique subit la météo');
  });

  test('le prochain changement de ciel est toujours annonçable', () => {
    const fautifs = [];
    for (let h = 0; h < 24; h++) {
      const minutes = minutesAvantChangementMeteo(new Date(Date.UTC(2026, 0, 1, h, 17)));
      if (!(minutes >= 1 && minutes <= HEURES_PAR_METEO * 60)) fautifs.push(`${h} h → ${minutes} min`);
    }
    aucun(fautifs, 'délais aberrants');
  });
});

// =====================================================================
// 11. Les Marches Fêlées et la Couture (v19)
// =====================================================================
suite('Actes III et IV', () => {
  test('vingt-six cartes couvrent la route du niveau 1 au niveau 100', () => {
    egal(ZONES.length, 26, 'cartes du monde');
    const plafond = Math.max(...ZONES.map((z) => z.niveauMin));
    verifier(plafond >= 90, `la dernière carte s'ouvre au niveau ${plafond}`);
  });

  test('aucun trou de plus de dix niveaux entre deux cartes', () => {
    // Un palier trop large, et le joueur se retrouve sans terrain de jeu.
    const seuils = [...new Set(ZONES.map((z) => z.niveauMin))].sort((a, b) => a - b);
    const trous = [];
    for (let i = 1; i < seuils.length; i++) {
      if (seuils[i] - seuils[i - 1] > 10) trous.push(`${seuils[i - 1]} → ${seuils[i]}`);
    }
    aucun(trous, 'paliers trop espacés');
  });

  test('chaque acte du fil conducteur a ses cartes', () => {
    const vides = ACTES_MONDE
      .filter((a) => !ZONES.some((z) => z.niveauMin >= a.de && z.niveauMin <= a.a))
      .map((a) => a.nom);
    aucun(vides, 'actes sans aucune carte');
  });

  test('les dix cartes neuves ont monstres, boss, récolte et trophée', () => {
    const neuves = ['marches-grises', 'chant-ruines', 'mer-de-verre', 'jardins-renverses',
      'ossuaire-dieux', 'bibliotheque-noyee', 'rempart-crepuscule', 'terres-recousues',
      'couture-monde', 'trone-premier-roi'];
    const fautives = [];
    neuves.forEach((id) => {
      const z = ZONES.find((x) => x.id === id);
      if (!z) { fautives.push(`${id} absente`); return; }
      if (z.monstres.length !== 3) fautives.push(`${id} : ${z.monstres.length} monstres`);
      if (!MONSTRES[z.boss]) fautives.push(`${id} : boss introuvable`);
      if (!(z.recolte || []).length) fautives.push(`${id} : aucune récolte`);
      if (!COFFRES_BOSS[z.boss] || !OBJETS[COFFRES_BOSS[z.boss]]) fautives.push(`${id} : pas de trophée`);
    });
    aucun(fautives, 'cartes incomplètes');
  });

  test('la courbe des monstres reste continue au raccord du niveau 52', () => {
    // Un mur de statistiques au passage des Terres lointaines aux Marches
    // se sentirait immédiatement en jeu.
    const avant = Object.values(MONSTRES).filter((m) => !m.boss && m.niveau >= 46 && m.niveau <= 50);
    const apres = Object.values(MONSTRES).filter((m) => !m.boss && m.niveau >= 53 && m.niveau <= 57);
    const moy = (l, cle) => l.reduce((s, m) => s + m[cle], 0) / l.length;
    const rapportHp = moy(apres, 'hp') / moy(avant, 'hp');
    verifier(rapportHp > 1 && rapportHp < 2,
      `les PV font un bond de ×${rapportHp.toFixed(2)} au raccord`);
  });

  test('les monstres montent régulièrement jusqu\'au niveau 100', () => {
    const hauts = Object.values(MONSTRES).filter((m) => !m.boss && m.niveau >= 90);
    verifier(hauts.length >= 4, `seulement ${hauts.length} monstres au-delà du niveau 90`);
    const ruptures = [];
    Object.values(MONSTRES).filter((m) => !m.boss).forEach((m) => {
      if (!(m.hp > 0) || !(m.atk > 0) || !(m.xp > 0)) ruptures.push(m.nom);
    });
    aucun(ruptures, 'monstres aux statistiques invalides');
  });

  test('chaque boss est nettement plus coriace que ses sbires', () => {
    const fautifs = [];
    ZONES.forEach((z) => {
      const boss = MONSTRES[z.boss];
      const sbires = z.monstres.map((c) => MONSTRES[c]).filter(Boolean);
      const moyenne = sbires.reduce((s, m) => s + m.hp, 0) / sbires.length;
      if (boss.hp < moyenne * 2) fautifs.push(`${z.id} (×${(boss.hp / moyenne).toFixed(1)})`);
    });
    aucun(fautifs, 'boss trop faibles');
  });

  test('vingt-six Chroniques, une par carte', () => {
    egal(CHRONIQUES.length, 26, 'Chroniques');
    const sansRecit = ZONES.filter((z) => !CHRONIQUES.some((c) => c.zone === z.id)).map((z) => z.id);
    aucun(sansRecit, 'cartes sans Chronique');
  });

  test('chaque Chronique neuve est complète et devient un donjon', () => {
    const champs = ['nom', 'emoji', 'statAcces', 'pnj', 'resume', 'scenes', 'ep1',
      'combat1', 'dilemme', 'tresor', 'combat2', 'ep2', 'avantBoss', 'boss', 'fins', 'relique'];
    const fautives = [];
    CHRONIQUES.slice(-10).forEach((c) => {
      champs.forEach((champ) => { if (!c[champ]) fautives.push(`${c.nom} → ${champ}`); });
      if (c.scenes && c.scenes.length !== 3) fautives.push(`${c.nom} → ${c.scenes.length} scènes`);
      if (!DONJONS.some((d) => d.chronique && d.nom === c.nom)) fautives.push(`${c.nom} → pas de donjon`);
    });
    aucun(fautives, 'Chroniques incomplètes');
  });

  test('chaque relique de Chronique existe et donne un vrai bonus', () => {
    const fautives = CHRONIQUES
      .filter((c) => !c.relique || !c.relique.bonus || !Object.keys(c.relique.bonus).length)
      .map((c) => c.nom);
    aucun(fautives, 'reliques vides');
  });

  test('les matériaux des Marches sont récoltables et servent à quelque chose', () => {
    const neufs = ['cendre-grise', 'echo-fossilise', 'verre-de-mer', 'graine-renversee',
      'os-divin', 'encre-noyee', 'braise-crepusculaire', 'fil-de-suture',
      'aiguille-premiere', 'eclat-de-couronne'];
    const orphelins = neufs.filter((id) => {
      if (!OBJETS[id]) return true;
      if (!FAMILLE_MATERIAU[id]) return true;
      const recolte = ZONES.some((z) => (z.recolte || []).some((r) => r.id === id));
      const butin = Object.values(MONSTRES).some((m) => (m.drops || []).some((d) => d.id === id));
      const utilise = RECETTES.some((r) => r.materiaux[id]);
      return !(recolte || butin) || !utilise;
    });
    aucun(orphelins, 'matériaux sans source ou sans usage');
  });

  test('l\'artisanat suit jusqu\'au niveau 100', () => {
    const hautes = RECETTES.filter((r) => r.niveau >= 90);
    verifier(hautes.length > 0, 'aucune recette au niveau 90+');
    const series = SETS_CRAFT.filter((s) => s.niveau >= 88);
    verifier(series.length >= 2, `seulement ${series.length} série(s) au-delà du niveau 88`);
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
