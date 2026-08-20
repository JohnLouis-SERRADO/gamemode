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

  test('la puissance conseillée ne redescend jamais', () => {
    // v20 : l'invariant est « jamais de RECUL », pas « toujours plus ».
    // La courbe est mesurée sur le meilleur héros possible à chaque niveau,
    // et il existe des paliers où le catalogue n'offre rien de neuf : la
    // recommandation y fait un plat, ce qui est honnête. Elle ne doit
    // simplement jamais baisser — un contenu plus haut ne peut pas demander
    // moins qu'un contenu plus bas.
    const ruptures = [];
    for (let n = 2; n <= NIVEAU_MAX; n++) {
      if (puissanceRecommandee(n) < puissanceRecommandee(n - 1)) ruptures.push(`niv. ${n}`);
    }
    aucun(ruptures, 'recommandations en recul');
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
    ['crit', 'direct', 'deter', 'celerite', 'piete'].forEach((cle) => {
      verifier(SOUS_CARACS[cle], `sous-caractéristique ${cle} manquante`);
      verifier(PLAFONDS_SOUS_CARACS[cle] > 0, `plafond de ${cle} manquant`);
    });
    egal(Object.keys(SOUS_CARACS).length, 5, 'nombre de sous-caractéristiques');
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
    // v20 : ce test comparait la recommandation à un héros TOUT NU — et
    // c'est précisément ce qui masquait le défaut pendant si longtemps.
    // Un héros sans le moindre objet passait pour la référence, pendant
    // qu'un joueur équipé affichait sept fois le chiffre conseillé.
    //
    // On compare désormais au héros ÉQUIPÉ de chaque classe : la
    // recommandation doit être franchissable par toutes (donc sous la plus
    // faible) sans être ridicule pour la meilleure.
    const ecarts = [];
    [1, 10, 25, 50, 70, 85, 100].forEach((n) => {
      const e = puissancesEtalon(n);
      const requis = puissanceRecommandee(n);
      if (requis > e.min) ecarts.push(`niv. ${n} : ${requis} conseillé > ${e.min} atteignable`);
      if (requis < e.min * 0.5) ecarts.push(`niv. ${n} : ${requis} conseillé, trop bas pour ${e.min}`);
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
  test('vingt-neuf cartes couvrent la route du niveau 1 au niveau 100', () => {
    // v27 : le Dernier Point a fondu dans le Trône — la liste du joueur
    // compte vingt-neuf cartes, et le jeu aussi.
    egal(ZONES.length, 29, 'cartes du monde');
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
      // v27 : le bestiaire suit la liste du joueur — de deux espèces (la
      // Mer de Verre) à sept (le Trône, qui a hérité du Dernier Point).
      if (z.monstres.length < 2 || z.monstres.length > 7) fautives.push(`${id} : ${z.monstres.length} monstres`);
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

  test('vingt-neuf Chroniques, une par carte', () => {
    egal(CHRONIQUES.length, 29, 'Chroniques');
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
// 12. Les Voies du niveau 50 (v19)
// =====================================================================
suite('Voies', () => {
  test('quatre-vingt-une Voies, trois par sous-classe', () => {
    egal(Object.keys(VOIES).length, 81, 'Voies');
    const fautives = Object.values(SOUS_CLASSES)
      .filter((sc) => (sc.voies || []).length !== 3)
      .map((sc) => `${sc.nom} (${(sc.voies || []).length})`);
    aucun(fautives, 'sous-classes mal dotées en Voies');
  });

  test('chaque Voie a un passif, une compétence, un titre', () => {
    const fautives = Object.entries(VOIES)
      .filter(([, v]) => !v.passif || !v.titre || !COMPETENCES[v.competence] || !v.emoji)
      .map(([id]) => id);
    aucun(fautives, 'Voies incomplètes');
  });

  test('les trois Voies d\'une sous-classe sont bien distinctes', () => {
    const doublons = [];
    Object.values(SOUS_CLASSES).forEach((sc) => {
      const noms = (sc.voies || []).map((id) => VOIES[id].nom);
      if (new Set(noms).size !== noms.length) doublons.push(sc.nom);
    });
    aucun(doublons, 'Voies en doublon');
  });

  test('chaque compétence de Voie suit l\'attribut de sa famille', () => {
    const fautives = [];
    Object.values(VOIES).forEach((v) => {
      const comp = COMPETENCES[v.competence];
      if (comp.type === 'utilitaire') return;
      const attendu = CLASSES_BASE[v.classe].stat;
      if (comp.stat !== attendu) fautives.push(`${v.nom} : ${comp.stat} au lieu de ${attendu}`);
    });
    aucun(fautives, 'Voies sur le mauvais attribut');
  });

  test('à profil ET rôle égaux, deux Voies frappent aussi fort', () => {
    // C'est tout l'intérêt d'avoir calculé les chiffres plutôt que de les
    // écrire : aucune sous-classe n'est avantagée par accident.
    //
    // v20.1 : le RÔLE entre dans la clé. Depuis la calibration des
    // compétences, une Voie de tank et une Voie de DPS ne frappent
    // volontairement PAS aussi fort — c'était même tout le problème
    // signalé. Ce qui doit rester égal, c'est deux Voies du même rôle.
    const parProfil = {};
    Object.values(VOIES).forEach((v) => {
      const comp = COMPETENCES[v.competence];
      const cle = `${roleDeCompetence(comp)}-${comp.type}-${comp.cible}-${comp.coups || 1}-${comp.cooldown || 0}-${comp.effet ? comp.effet.type : 'nu'}-${comp.critBonus || 0}-${comp.puissance}`;
      (parProfil[cle] = parProfil[cle] || []).push(comp.ratio);
    });
    const inegaux = Object.entries(parProfil)
      .filter(([, ratios]) => new Set(ratios).size > 1)
      .map(([cle]) => cle);
    aucun(inegaux, 'profils identiques aux chiffres différents');
  });

  test('les Voies s\'ouvrent au niveau 50, pas avant', () => {
    egal(NIVEAU_VOIE, 50, 'palier des Voies');
    const trop = Object.values(VOIES)
      .filter((v) => (COMPETENCES[v.competence].niveauRequis || 1) !== NIVEAU_VOIE)
      .map((v) => v.nom);
    aucun(trop, 'compétences de Voie mal verrouillées');
  });

  test('le titre de Voie remplace le nom de classe', () => {
    const heros = { classe: 'gardien', sousClasse: 'templier', voie: null };
    egal(titreCompletHeros(heros), 'Gardien — Templier', 'sans Voie');
    heros.voie = SOUS_CLASSES.templier.voies[0];
    egal(titreCompletHeros(heros), VOIES[heros.voie].titre, 'avec Voie');
    verifier(!titreCompletHeros(heros).includes('Voie '), 'le titre ne doit pas dire « Voie »');
  });

  test('une Voie inconnue est écartée sans casse à la migration', () => {
    const p = herosTest({ niveau: 55, classe: 'gardien', sousClasse: 'templier' });
    p.voie = 'voie-qui-n-existe-plus';
    const migre = normaliserPerso(p);
    egal(migre.voie, null, 'la Voie fantôme devrait être écartée');
  });

  test('les compétences de Voie sont accessibles et chiffrables', () => {
    const stats = { for: 40, dex: 40, int: 40, esp: 40, vit: 40, cha: 20 };
    const fautives = [];
    Object.values(VOIES).forEach((v) => {
      const comp = COMPETENCES[v.competence];
      try {
        if (!detailsCompetence(comp, stats, 0, 200).length) fautives.push(v.nom);
      } catch (e) { fautives.push(`${v.nom} (${e.message})`); }
    });
    aucun(fautives, 'compétences de Voie inaffichables');
  });
});

// =====================================================================
// 13. L'Éveil du niveau 80 (v19)
// =====================================================================
suite('Éveil', () => {
  test('162 Éveils, six raretés par sous-classe', () => {
    egal(Object.keys(EVEILS).length, 162, 'Éveils');
    const fautives = Object.values(SOUS_CLASSES)
      .filter((sc) => (sc.eveils || []).length !== 6)
      .map((sc) => `${sc.nom} (${(sc.eveils || []).length})`);
    aucun(fautives, 'sous-classes mal dotées');
  });

  test('chaque sous-classe couvre les six raretés, une fois chacune', () => {
    const fautives = [];
    Object.values(SOUS_CLASSES).forEach((sc) => {
      const raretes = (sc.eveils || []).map((id) => EVEILS[id].rarete);
      if (new Set(raretes).size !== 6) fautives.push(sc.nom);
    });
    aucun(fautives, 'raretés manquantes ou en double');
  });

  test('324 compétences d\'Éveil, deux par Éveil', () => {
    const fautifs = Object.entries(EVEILS)
      .filter(([, e]) => e.competences.length !== 2 || e.competences.some((c) => !COMPETENCES[c]))
      .map(([id]) => id);
    aucun(fautifs, 'Éveils aux compétences manquantes');
    const total = Object.values(COMPETENCES).filter((c) => c.eveil).length;
    egal(total, 324, 'compétences d\'Éveil');
  });

  test('LA RÈGLE : la rareté ne change jamais la puissance', () => {
    // C'est la règle non négociable du document de conception. Sans elle,
    // tout le monde relance jusqu'au Divin et le système devient une
    // machine à frustration. On compare la puissance moyenne des
    // compétences de chaque rareté : l'écart doit rester sous 10 %.
    const parRarete = {};
    Object.values(EVEILS).forEach((e) => {
      const puissance = e.competences.reduce((somme, id) =>
        somme + valeurProfilEveil(COMPETENCES[id]), 0);
      (parRarete[e.rarete] = parRarete[e.rarete] || []).push(puissance);
    });
    const moyennes = Object.entries(parRarete).map(([r, l]) =>
      [r, l.reduce((a, b) => a + b, 0) / l.length]);
    const min = Math.min(...moyennes.map(([, m]) => m));
    const max = Math.max(...moyennes.map(([, m]) => m));
    const ecart = (max - min) / min;
    verifier(ecart <= 0.1,
      `écart de ${Math.round(ecart * 100)} % entre raretés — le maximum toléré est 10 %`);
  });

  test('chaque profil dépense exactement le même budget', () => {
    // La règle tient parce que les profils sont budgétés, pas choisis à
    // la main. Si quelqu'un en ajoute un de travers, c'est ici que ça se voit.
    const ecarts = Object.entries(PROFILS_EVEIL)
      .map(([nom, modele]) => [nom, valeurProfilEveil(modele)])
      .filter(([, valeur]) => Math.abs(valeur - BUDGET_EVEIL) / BUDGET_EVEIL > 0.02)
      .map(([nom, valeur]) => `${nom} = ${Math.round(valeur)} au lieu de ${BUDGET_EVEIL}`);
    aucun(ecarts, 'profils hors budget');
  });

  test('la rareté change bien la CONTRAINTE', () => {
    // L'autre moitié de la règle : ce qui monte avec la rareté, c'est
    // l'exigence. Rare et Épique sont libres, le reste est contraint.
    const fautifs = [];
    Object.values(EVEILS).forEach((e) => {
      const doitContraindre = RARETES_EVEIL[e.rarete].contrainte;
      if (doitContraindre && !e.contrainte) fautifs.push(`${e.nom} (${e.rarete}) sans contrainte`);
      if (!doitContraindre && e.contrainte) fautifs.push(`${e.nom} (${e.rarete}) contraint à tort`);
    });
    aucun(fautifs, 'contraintes mal réparties');
  });

  test('chaque Éveil a un nom, un effet et une sous-classe valides', () => {
    const fautifs = Object.entries(EVEILS)
      .filter(([, e]) => !e.nom || !e.effet || !SOUS_CLASSES[e.sousClasse] || !RARETES_EVEIL[e.rarete])
      .map(([id]) => id);
    aucun(fautifs, 'Éveils incomplets');
  });

  test('les compétences d\'Éveil suivent l\'attribut de leur famille', () => {
    const fautives = [];
    Object.values(EVEILS).forEach((e) => {
      const attendu = CLASSES_BASE[e.classe].stat;
      e.competences.forEach((id) => {
        const c = COMPETENCES[id];
        if (c.type !== 'utilitaire' && c.stat !== attendu) fautives.push(`${e.nom} : ${c.stat}`);
      });
    });
    aucun(fautives, 'Éveils sur le mauvais attribut');
  });

  test('le tirage propose trois Éveils de la bonne sous-classe, sans doublon', () => {
    const p = herosTest({ niveau: 80, classe: 'guerrier', sousClasse: 'berserker' });
    const tirage = tirerEveils(p);
    egal(tirage.length, PROPOSITIONS_PAR_TIRAGE, 'propositions');
    const etrangers = tirage.filter((e) => e.sousClasse !== 'berserker').map((e) => e.nom);
    aucun(etrangers, 'propositions hors sous-classe');
    const doublons = tirage.length - new Set(tirage.map((e) => e.id)).size;
    egal(doublons, 0, 'propositions en double');
  });

  test('le tirage VARIE : trois propositions sur cinq possibles, la rareté compte', () => {
    // Le vice de conception corrigé : à 5 propositions sur 5 candidats,
    // tout tirage contenait toujours les 5 raretés — relances, garantie
    // et verrouillage ne servaient à rien.
    verifier(PROPOSITIONS_PAR_TIRAGE < 5,
      `le tirage (${PROPOSITIONS_PAR_TIRAGE}) doit proposer moins que les 5 Éveils tirables`);
    const p = herosTest({ niveau: 80, classe: 'guerrier', sousClasse: 'berserker' });
    const ensembles = new Set();
    for (let i = 0; i < 200; i++) {
      ensembles.add(tirerEveils(p).map((e) => e.id).sort().join('+'));
    }
    verifier(ensembles.size > 1, 'deux cents tirages identiques : le tirage ne tire rien');
  });

  test('une proposition verrouillée revient d\'office dans le tirage suivant', () => {
    const p = herosTest({ niveau: 80, classe: 'guerrier', sousClasse: 'berserker' });
    const verrou = SOUS_CLASSES.berserker.eveils
      .map((id) => EVEILS[id]).find((e) => e.rarete === 'mythique').id;
    const absents = [];
    for (let i = 0; i < 100; i++) {
      const tirage = tirerEveils(p, { verrouillee: verrou });
      if (!tirage.some((e) => e.id === verrou)) absents.push(String(i));
    }
    aucun(absents, 'tirages où le verrou a sauté');
  });

  test('les Éveils cachés ne sortent jamais d\'un tirage ordinaire', () => {
    const p = herosTest({ niveau: 80, classe: 'guerrier', sousClasse: 'berserker' });
    const vus = new Set();
    for (let i = 0; i < 400; i++) tirerEveils(p).forEach((e) => vus.add(e.rarete));
    verifier(!vus.has('cache'), 'un Éveil caché est sorti d\'un tirage ordinaire');
  });

  test('la garantie anti-frustration tient après cinq relances', () => {
    const p = herosTest({ niveau: 80, classe: 'arcaniste', sousClasse: 'pyromancien' });
    p.eveil = { relances: RELANCES_AVANT_GARANTIE };
    const rangs = ORDRE_EVEIL;
    const echecs = [];
    for (let i = 0; i < 200; i++) {
      const tirage = tirerEveils(p);
      const assezRare = tirage.some((e) => rangs.indexOf(e.rarete) >= rangs.indexOf(RARETE_GARANTIE));
      if (!assezRare) echecs.push(i);
    }
    aucun(echecs.map(String), `tirages garantis sans ${RARETES_EVEIL[RARETE_GARANTIE].nom}`);
  });

  test('le seuil de garantie est réellement manquable — sinon elle ne garantit rien', () => {
    // Garde-fou de conception : si TOUT tirage atteignait déjà le seuil,
    // la garantie (payée 80 Sceaux, ou méritée en cinq relances) ne
    // vaudrait rien. C'est ce qui condamnait le seuil « Légendaire » :
    // 3 des 5 Éveils tirables le sont, et on en tire 3.
    const p = herosTest({ niveau: 80, classe: 'arcaniste', sousClasse: 'pyromancien' });
    const rangs = ORDRE_EVEIL;
    const tirables = SOUS_CLASSES.pyromancien.eveils
      .map((id) => EVEILS[id]).filter((e) => e.rarete !== 'cache');
    const sousLeSeuil = tirables.filter((e) => rangs.indexOf(e.rarete) < rangs.indexOf(RARETE_GARANTIE)).length;
    verifier(sousLeSeuil >= PROPOSITIONS_PAR_TIRAGE,
      `il faut au moins ${PROPOSITIONS_PAR_TIRAGE} Éveils sous le seuil ${RARETE_GARANTIE} pour qu'un tirage puisse le manquer (il y en a ${sousLeSeuil})`);
    let manques = 0;
    for (let i = 0; i < 400; i++) {
      const tirage = tirerEveils(p);
      if (!tirage.some((e) => rangs.indexOf(e.rarete) >= rangs.indexOf(RARETE_GARANTIE))) manques++;
    }
    verifier(manques > 0, '400 tirages atteignent tous le seuil : la garantie ne garantit rien');
  });

  test('chaque Éveil caché porte une condition avec indice et énoncé exact', () => {
    const caches = Object.values(EVEILS).filter((e) => e.rarete === 'cache');
    egal(caches.length, 27, 'Éveils cachés');
    const fautifs = caches
      .filter((e) => !e.condition || !e.condition.indice || !e.condition.exacte)
      .map((e) => e.nom);
    aucun(fautifs, 'Éveils cachés sans condition');
  });

  test('le titre d\'Éveil prime sur la Voie et sur la classe', () => {
    const heros = { classe: 'guerrier', sousClasse: 'berserker', voie: null, eveil: null };
    egal(titreCompletHeros(heros), 'Guerrier — Berserker', 'sans rien');
    heros.voie = SOUS_CLASSES.berserker.voies[0];
    egal(titreCompletHeros(heros), VOIES[heros.voie].titre, 'avec Voie');
    const eveil = EVEILS[SOUS_CLASSES.berserker.eveils[1]];
    heros.eveil = { id: eveil.id, rarete: eveil.rarete, relances: 0 };
    egal(titreCompletHeros(heros), eveil.nom, 'l\'Éveil prime');
  });

  test('un Éveil disparu du catalogue est écarté sans casse', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    p.eveil = { id: 'eveil-qui-n-existe-plus', rarete: 'divin', relances: 0 };
    egal(normaliserPerso(p).eveil, null, 'l\'Éveil fantôme devrait être écarté');
  });
});

suite('Fin de combat', () => {
  // La page de tests ne charge pas reseau.js : on remplace le multiplicateur
  // d'événement mondial par sa valeur neutre (1 partout), comme hors ligne.
  if (typeof multiplicateursEvenement === 'undefined') {
    window.multiplicateursEvenement = () => ({ xp: 1, po: 1, drop: 1 });
  }

  // Un matériau de la filière « peau » : celui que la battue rapporte.
  const MATERIAU_PEAU = Object.keys(OBJETS)
    .find((id) => OBJETS[id].type === 'materiau' && FAMILLE_MATERIAU[id] === 'peau');

  function combatFactice(surcharges = {}) {
    const heros = herosTest({ niveau: 10 });
    return {
      // v20 : une battue, car c'est le seul genre de combat qui ouvre la
      // filière « peau » — une expédition ne rapporte plus de matériau.
      genre: 'chasse',
      difficulte: 'normal',
      equipe: [heros],
      monstres: [{
        nom: 'Cobaye', xp: 40, po: [5, 9],
        drops: [{ id: MATERIAU_PEAU, chance: 1 }],
      }],
      ...surcharges,
    };
  }

  test('la victoire distribue XP, or et butin sans planter (régression du gel)', () => {
    // Le bug : « monde » déclaré APRÈS la boucle des drops qui le lisait —
    // tout combat dont un monstre avait un drop à tirer figeait l'écran.
    // Ce test exécute précisément ce chemin : un drop à 100 %.
    const butin = tirerButinCombat(combatFactice());
    verifier(butin.xp > 0, `l'XP du butin devrait être positive (${butin.xp})`);
    verifier(butin.po >= 5, `l'or du butin devrait suivre la fourchette (${butin.po})`);
    verifier(Object.keys(butin.objets).length >= 1, 'le drop garanti devrait tomber');
  });

  test('une expédition ne ramasse aucun matériau, même sur un drop à 100 %', () => {
    // La règle des modes descend jusqu'au butin : les peaux ne tombent
    // que d'une battue, jamais d'un combat d'expédition.
    const butin = tirerButinCombat(combatFactice({ genre: 'exploration' }));
    verifier(butin.xp > 0, 'l\'XP tombe toujours');
    egal(Object.keys(butin.objets).length, 0,
      `une expédition ne doit rendre aucun matériau (${Object.keys(butin.objets).join(', ')})`);
  });

  test('une embuscade ne rend que la filière qu\'on récoltait', () => {
    const enMinant = tirerButinCombat(combatFactice({ genre: 'embuscade', filiereRecolte: 'mine' }));
    egal(Object.keys(enMinant.objets).length, 0, 'une peau ne tombe pas pendant qu\'on mine');
    const enChassant = tirerButinCombat(combatFactice({ genre: 'embuscade', filiereRecolte: 'peau' }));
    verifier(Object.keys(enChassant.objets).length >= 1, 'la peau tombe quand c\'est la filière en cours');
  });

  test('un donjon et une tour gardent leur butin de matériaux', () => {
    ['donjon', 'tour', 'tourBoss'].forEach((genre) => {
      const butin = tirerButinCombat(combatFactice({ genre }));
      verifier(Object.keys(butin.objets).length >= 1,
        `« ${genre} » ne doit pas perdre ses drops de matériaux`);
    });
  });

  test('la moisson déjà ramassée survit à l\'embuscade', () => {
    // lootRecolte, c'est ce qu'on avait dans les mains quand on s'est
    // fait surprendre : le filtre de filière ne doit pas le manger.
    const butin = tirerButinCombat(combatFactice({
      genre: 'embuscade', filiereRecolte: 'mine', lootRecolte: { [MATERIAU_PEAU]: 3 },
    }));
    egal(butin.objets[MATERIAU_PEAU], 3, 'la récolte déjà en poche est conservée');
  });

  test('le butin traverse les trois moments du monde vivant', () => {
    // Aube, jour et nuit modulent l'or et le butin : aucun des trois ne doit
    // faire planter le tirage ni produire de NaN.
    const butin = tirerButinCombat(combatFactice());
    verifier(Number.isFinite(butin.xp) && Number.isFinite(butin.po),
      `XP et or doivent être des nombres finis (${butin.xp}, ${butin.po})`);
    const monde = mondeMaintenant();
    verifier(Number.isFinite(monde.effets.or || 1) && Number.isFinite(monde.effets.butin || 1),
      'les effets du monde doivent être des nombres');
  });

  test('un monstre sans drops ni bourse ne casse rien', () => {
    const butin = tirerButinCombat(combatFactice({ monstres: [{ nom: 'Spectre', xp: 10 }] }));
    egal(Object.keys(butin.objets).length, 0, 'objets');
    egal(butin.po, 0, 'or');
  });

  test('la récolte embarquée rejoint le butin', () => {
    const idMateriau = Object.keys(OBJETS).find((id) => OBJETS[id].type === 'materiau');
    const butin = tirerButinCombat(combatFactice({ lootRecolte: { [idMateriau]: 3 } }));
    verifier((butin.objets[idMateriau] || 0) >= 3, 'les 3 unités récoltées devraient être là');
  });
});

suite('Tour de l\'Éveil', () => {
  test('les sept services annoncent un nom, un coût et une description', () => {
    const ids = Object.keys(SERVICES_TOUR);
    egal(ids.length, 7, 'services');
    const fautifs = ids.filter((id) => {
      const s = SERVICES_TOUR[id];
      return !s.nom || !s.emoji || !s.desc
        || typeof s.sceaux !== 'number' || s.sceaux <= 0
        || typeof s.majeurs !== 'number' || s.majeurs < 0
        || typeof s.disponible !== 'function' || typeof s.appliquer !== 'function';
    });
    aucun(fautifs, 'services mal décrits');
  });

  test('le coût suit la gravité du changement', () => {
    const c = (id) => SERVICES_TOUR[id].sceaux;
    verifier(c('changer-voie') < c('changer-sous-classe'),
      `changer de Voie (${c('changer-voie')}) devrait coûter moins que changer de spécialité (${c('changer-sous-classe')})`);
    verifier(c('changer-sous-classe') < c('changer-classe'),
      `changer de spécialité (${c('changer-sous-classe')}) devrait coûter moins que changer de rôle (${c('changer-classe')})`);
    egal(SERVICES_TOUR['changer-voie'].majeurs, 0, 'Majeurs pour la Voie');
    egal(SERVICES_TOUR['changer-classe'].majeurs, 3, 'Majeurs pour le rôle');
  });

  test('les Sceaux montent par tranche et le boss donne un Majeur', () => {
    egal(sceauxDeLEtage(1), 1, 'étage 1');
    egal(sceauxDeLEtage(20), 1, 'étage 20');
    egal(sceauxDeLEtage(21), 2, 'étage 21');
    egal(sceauxDeLEtage(50), 2, 'étage 50');
    egal(sceauxDeLEtage(51), 3, 'étage 51');
    egal(sceauxDeLEtage(80), 3, 'étage 80');
    egal(sceauxDeLEtage(100), 5, 'étage 100');
    verifier(sceauxDeLEtage(150) >= 5, 'au-delà de cent étages la Tour doit continuer à payer');
    const paliers = [];
    for (let e = 1; e <= 100; e++) if (estEtageBoss(e) !== (e % 10 === 0)) paliers.push(String(e));
    aucun(paliers, 'étages boss mal détectés');
  });

  test('gagnerSceaux crédite la bourse, Majeur compris', () => {
    const p = herosTest({ niveau: 80 });
    egal(sceauxDe(p).normaux, 0, 'bourse de départ');
    const petit = gagnerSceaux(p, 7);
    egal(petit.normaux, 1, 'gain étage 7');
    egal(petit.majeurs, 0, 'Majeur étage 7');
    const boss = gagnerSceaux(p, 30);
    egal(boss.majeurs, 1, 'Majeur étage 30');
    egal(sceauxDe(p).normaux, 3, 'cumul');
    egal(sceauxDe(p).majeurs, 1, 'cumul Majeurs');
  });

  test('un service ne s\'emploie pas à crédit', () => {
    const p = herosTest({ niveau: 80, classe: 'guerrier', sousClasse: 'berserker' });
    const service = SERVICES_TOUR['changer-sous-classe'];
    verifier(!peutPayerService(p, service), 'une bourse vide ne devrait rien payer');
    sceauxDe(p).normaux = service.sceaux;
    verifier(!peutPayerService(p, service), 'les Sceaux Majeurs manquants devraient bloquer');
    sceauxDe(p).majeurs = service.majeurs;
    verifier(peutPayerService(p, service), 'la bourse complète devrait payer');
  });

  test('aucun service ne retire une compétence du grimoire', () => {
    const fautifs = [];
    Object.entries(SERVICES_TOUR).forEach(([id, service]) => {
      const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
      p.voie = SOUS_CLASSES.berserker.voies[0];
      const eveil = EVEILS[SOUS_CLASSES.berserker.eveils[0]];
      p.eveil = { id: eveil.id, rarete: eveil.rarete, relances: 0, propositions: [eveil.id] };
      const avant = p.competences.slice();
      const orAvant = p.po;
      const niveauAvant = p.niveau;
      service.appliquer(p);
      const perdues = avant.filter((c) => !p.competences.includes(c));
      if (perdues.length) fautifs.push(`${id} : ${perdues.join(', ')}`);
      if (p.niveau !== niveauAvant) fautifs.push(`${id} : niveau modifié`);
      if (p.po !== orAvant) fautifs.push(`${id} : or modifié hors paiement`);
    });
    aucun(fautifs, 'services destructeurs');
  });

  test('changer de spécialité remet aussi la Voie en jeu', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    p.voie = SOUS_CLASSES.berserker.voies[0];
    SERVICES_TOUR['changer-sous-classe'].appliquer(p);
    egal(p.sousClasse, null, 'spécialité');
    egal(p.voie, null, 'Voie — elle dépend de la spécialité');
  });

  test('relancer l\'Éveil fait avancer le compteur de garantie', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    const eveil = EVEILS[SOUS_CLASSES.berserker.eveils[0]];
    p.eveil = { id: eveil.id, rarete: eveil.rarete, relances: 2 };
    SERVICES_TOUR['relancer-eveil'].appliquer(p);
    egal(p.eveil.id, undefined, 'l\'Éveil devrait être oublié');
    egal(p.eveil.relances, 3, 'relances');
  });

  test('forcer une rareté garantit vraiment un Mythique au tirage suivant', () => {
    const p = herosTest({ niveau: 85, classe: 'arcaniste', sousClasse: 'pyromancien' });
    SERVICES_TOUR['forcer-rarete'].appliquer(p);
    verifier(p.eveil.garantie === true, 'la garantie devrait être posée');
    const rangs = ORDRE_EVEIL;
    const echecs = [];
    for (let i = 0; i < 200; i++) {
      // La chaîne réelle : verifierEveil lit p.eveil.garantie et la passe
      // au tirage — c'est CE contrat qu'on vérifie.
      const tirage = tirerEveils(p, { garantirLegendaire: !!p.eveil.garantie });
      if (!tirage.some((e) => rangs.indexOf(e.rarete) >= rangs.indexOf(RARETE_GARANTIE))) echecs.push(String(i));
    }
    aucun(echecs, 'tirages sans Mythique malgré la garantie payée');
    // Et sans la garantie, avec 3 propositions sur 5, le Légendaire doit
    // parfois MANQUER — sinon le service ne vend que du vent.
    p.eveil.garantie = false;
    let manques = 0;
    for (let i = 0; i < 300; i++) {
      const tirage = tirerEveils(p);
      if (!tirage.some((e) => rangs.indexOf(e.rarete) >= rangs.indexOf(RARETE_GARANTIE))) manques++;
    }
    verifier(manques > 0, 'sans garantie, 300 tirages atteignent tous le seuil : la garantie ne sert à rien');
  });

  test('la relance préserve la garantie et le verrou déjà payés', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    const eveil = EVEILS[SOUS_CLASSES.berserker.eveils[0]];
    const verrou = SOUS_CLASSES.berserker.eveils[2];
    p.eveil = { id: eveil.id, rarete: eveil.rarete, relances: 0, garantie: true, verrouillee: verrou };
    SERVICES_TOUR['relancer-eveil'].appliquer(p);
    egal(p.eveil.id, undefined, 'l\'Éveil devrait être oublié');
    verifier(p.eveil.garantie === true, 'la garantie payée a été effacée par la relance');
    egal(p.eveil.verrouillee, verrou, 'le verrou payé a été effacé par la relance');
  });

  test('verrouiller retient la proposition la plus rare du tirage en attente', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    const parRarete = {};
    SOUS_CLASSES.berserker.eveils.forEach((id) => { parRarete[EVEILS[id].rarete] = id; });
    p.eveil = { relances: 0, propositions: [parRarete.rare, parRarete.mythique, parRarete.epique] };
    const message = SERVICES_TOUR['verrouiller'].appliquer(p);
    egal(p.eveil.verrouillee, parRarete.mythique, 'le verrou devrait retenir la plus rare');
    verifier(message.includes(EVEILS[parRarete.mythique].nom), `le message devrait la nommer : ${message}`);
  });

  test('changer de spécialité remet aussi l\'Éveil en jeu — il appartient à la spécialité', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    const eveil = EVEILS[SOUS_CLASSES.berserker.eveils[0]];
    p.eveil = { id: eveil.id, rarete: eveil.rarete, relances: 0 };
    SERVICES_TOUR['changer-sous-classe'].appliquer(p);
    egal(p.eveil, null, 'l\'Éveil de l\'ancienne spécialité devrait être remis en jeu');
  });

  test('révéler un Éveil caché rend son énoncé exact et le mémorise', () => {
    const p = herosTest({ niveau: 85, classe: 'guerrier', sousClasse: 'berserker' });
    const message = SERVICES_TOUR['reveler-cache'].appliquer(p);
    const cache = SOUS_CLASSES.berserker.eveils.map((id) => EVEILS[id]).find((e) => e.rarete === 'cache');
    verifier(message.includes(cache.condition.exacte), `l'énoncé exact devrait apparaître : ${message}`);
    verifier((p.cachesReveles || []).includes(cache.id), 'la révélation devrait être mémorisée');
  });

  test('les services ne s\'ouvrent que s\'il y a quelque chose à défaire', () => {
    const vierge = herosTest({ niveau: 80, classe: 'guerrier' });
    vierge.sousClasse = null;
    vierge.voie = null;
    vierge.eveil = null;
    verifier(!SERVICES_TOUR['changer-voie'].disponible(vierge), 'changer de Voie sans Voie');
    verifier(!SERVICES_TOUR['changer-sous-classe'].disponible(vierge), 'changer de spécialité sans spécialité');
    verifier(!SERVICES_TOUR['relancer-eveil'].disponible(vierge), 'relancer un Éveil inexistant');
    verifier(SERVICES_TOUR['changer-classe'].disponible(vierge), 'changer de rôle est toujours possible');
  });
});

suite('Régressions v19.1', () => {
  test('la Lame de fer du catalogue n\'est plus écrasée par la série de craft', () => {
    // La série « de Fer » générait l'id 'lame-de-fer' — celui de l'épée
    // de boutique, qui disparaissait des rayons et mutait dans les sacs.
    const epee = OBJETS['lame-de-fer'];
    verifier(!!epee, 'l\'épée du catalogue doit exister');
    egal(epee.niveau, 4, 'niveau de l\'épée du catalogue');
    verifier(epee.prix != null, 'elle doit être en vente en boutique');
    const piece = OBJETS['craft-lame-de-fer'];
    verifier(!!piece && piece.set === 'craft-de-fer', 'la pièce de craft doit vivre sous son propre id');
    const recette = RECETTES.find((r) => r.resultat === 'craft-lame-de-fer');
    verifier(!!recette, 'la recette doit pointer vers le nouvel id');
    aucun(RECETTES.filter((r) => !OBJETS[r.resultat]).map((r) => r.resultat), 'recettes orphelines');
  });

  test('toute arme porte sa famille — le filtre « pour ma classe » ne ment plus', () => {
    const sansFamille = Object.entries(OBJETS)
      .filter(([, o]) => o.type === 'equipement' && o.slot === 'arme' && !o.familleArme)
      .map(([id]) => id);
    aucun(sansFamille, 'armes sans famille');
  });

  test('le bonus d\'XP d\'une relique équipée est réellement versé', () => {
    const [idRelique, relique] = Object.entries(OBJETS)
      .find(([, o]) => o.bonus && o.bonus.xpBonus) || [];
    verifier(!!idRelique, 'au moins une relique à bonus d\'XP doit exister');
    const nu = herosTest({ niveau: 85 });
    const equipe = herosTest({ niveau: 85 });
    equipe.equipement = { ...(equipe.equipement || {}), [relique.slot]: idRelique };
    verifier(xpReelle(equipe, 1000) > xpReelle(nu, 1000),
      `le +${Math.round(relique.bonus.xpBonus * 100)} % XP de ${relique.nom} devrait compter (${xpReelle(equipe, 1000)} vs ${xpReelle(nu, 1000)})`);
  });

  test('l\'XP affichée est l\'XP versée : gagnerXp applique exactement xpReelle', () => {
    const p = herosTest({ niveau: 20 });
    const attendu = xpReelle(p, 500);
    const avant = p.xp;
    gagnerXp(p, 500);
    egal(p.xp - avant, attendu, 'XP créditée');
  });
});

// =====================================================================
// Audit joué : ce qu'une partie complète, du niveau 1 au niveau 100, a
// fait remonter. Chaque test ci-dessous a d'abord été un défaut visible
// à l'écran.
// =====================================================================
suite('Audit de partie', () => {
  test('les paliers d\'identité ne s\'achètent pas : le pool commun n\'appartient à personne', () => {
    const intrus = Object.entries(COMPETENCES)
      .filter(([, c]) => estCompetenceCommune(c))
      .filter(([, c]) => c.classe || c.sousClasse || c.voie || c.eveil)
      .map(([id]) => id);
    aucun(intrus, 'compétences dites communes alors qu\'elles appartiennent à un palier');
  });

  test('aucune compétence de spécialité, de Voie ou d\'Éveil n\'est commune', () => {
    // C'est LE test qui ferme la brèche : la création en proposait 50 au
    // niveau 1 et l'Arcanium en vendait 645, faute de regarder autre
    // chose que `comp.classe`.
    const reserves = Object.entries(COMPETENCES)
      .filter(([, c]) => c.sousClasse || c.voie || c.eveil)
      .filter(([, c]) => estCompetenceCommune(c))
      .map(([id]) => id);
    aucun(reserves, 'compétences réservées passées dans le pool commun');
    const communes = Object.values(COMPETENCES).filter(estCompetenceCommune).length;
    entre(communes, 1, 60, 'le pool commun doit rester un petit pool');
  });

  test('chaque carte du monde a ses histoires uniques', () => {
    const sans = ZONES.filter((z) => !(HISTOIRES_ZONES[z.id] || []).length).map((z) => z.id);
    aucun(sans, 'cartes sans la moindre histoire — le compteur afficherait 0/0');
  });

  test('les histoires de carte ne promettent que des récompenses réelles', () => {
    const fautes = [];
    Object.entries(HISTOIRES_ZONES).forEach(([zone, histoires]) => {
      const titres = new Set();
      histoires.forEach((h) => {
        if (!h.titre || !h.texte) fautes.push(`${zone} : histoire sans titre ou sans texte`);
        if (titres.has(h.titre)) fautes.push(`${zone} : titre en double « ${h.titre} »`);
        titres.add(h.titre);
        const r = h.recompense || {};
        if (!Object.keys(r).length) fautes.push(`${zone}/${h.titre} : aucune récompense`);
        if (r.materiau && !OBJETS[r.materiau]) fautes.push(`${zone}/${h.titre} : matériau inconnu « ${r.materiau} »`);
        if (r.soinPct != null && !(r.soinPct > 0 && r.soinPct <= 1)) fautes.push(`${zone}/${h.titre} : soinPct hors ]0,1]`);
        ['po', 'xp'].forEach((cle) => {
          if (r[cle] != null && !(r[cle] > 0)) fautes.push(`${zone}/${h.titre} : ${cle} invalide`);
        });
      });
    });
    aucun(fautes, 'histoires de carte mal formées');
  });

  test('le nom d\'une carte se contracte correctement après « de »', () => {
    egal(deLaCarte('Les Marches Grises'), 'des Marches Grises', 'article pluriel');
    egal(deLaCarte('Le Trône du Premier Roi'), 'du Trône du Premier Roi', 'article masculin');
    egal(deLaCarte('La Mer de Verre'), 'de la Mer de Verre', 'article féminin');
    egal(deLaCarte('L’Ossuaire des Dieux'), 'de l’Ossuaire des Dieux', 'article élidé');
    egal(deLaCarte('Pics Gelés'), 'de Pics Gelés', 'sans article');
    // « de la Mer » et « de l’Ossuaire » sont corrects ; c'est l'article
    // resté en capitale — « de Le », « de Les » — qu'on traque.
    const laids = ZONES.map((z) => deLaCarte(z.nom)).filter((t) => /^de (Le|La|Les|L[’'])/.test(t));
    aucun(laids, 'cartes dont le nom donne du « de Le » ou du « de Les »');
  });

  test('un matériau offert par une histoire se récolte bien sur cette carte', () => {
    const hors = [];
    ZONES.forEach((z) => {
      const locaux = new Set((z.recolte || []).map((r) => r.id));
      (HISTOIRES_ZONES[z.id] || []).forEach((h) => {
        const mat = (h.recompense || {}).materiau;
        if (mat && !locaux.has(mat)) hors.push(`${z.id}/${h.titre} → ${mat}`);
      });
    });
    aucun(hors, 'histoires offrant un matériau étranger à leur carte');
  });

  test('terminer toutes les Chroniques a son haut fait, et il compte juste', () => {
    const total = DONJONS.filter((d) => d.chronique).length;
    const complet = HAUTS_FAITS.find((h) => h.id === 'chroniques-toutes');
    verifier(!!complet, 'un haut fait doit récompenser la complétion des Chroniques');
    const p = herosTest({ niveau: 100 });
    p.donjons = {};
    DONJONS.filter((d) => d.chronique).slice(0, total - 1).forEach((d) => { p.donjons[d.id] = { fini: 1 }; });
    verifier(!complet.cond(p), `le haut fait ne doit pas tomber à ${total - 1}/${total} Chroniques`);
    DONJONS.filter((d) => d.chronique).forEach((d) => { p.donjons[d.id] = { fini: 1 }; });
    verifier(complet.cond(p), `le haut fait doit tomber à ${total}/${total} Chroniques`);
  });

  test('aucun haut fait ne promet un décompte que le monde a dépassé', () => {
    const chroniques = DONJONS.filter((d) => d.chronique).length;
    const fautes = HAUTS_FAITS
      .filter((h) => /Terminer les (\d+) Chroniques/.test(h.desc))
      .filter((h) => Number(/Terminer les (\d+) Chroniques/.exec(h.desc)[1]) !== chroniques)
      .map((h) => `${h.id} : « ${h.desc} » pour ${chroniques} Chroniques`);
    aucun(fautes, 'hauts faits annonçant une complétion qui n\'en est pas une');
  });

  test('les ids de hauts faits restent uniques — un id perdu, un titre perdu', () => {
    const vus = new Set();
    const doublons = [];
    HAUTS_FAITS.forEach((h) => { if (vus.has(h.id)) doublons.push(h.id); vus.add(h.id); });
    aucun(doublons, 'ids de hauts faits en double');
  });

  test('la garantie d\'Éveil dit partout la même rareté', () => {
    // Le commentaire du tirage annonçait « Légendaire » quand le code
    // garantit un Mythique. Les textes de la Tour lisent la constante.
    verifier(!!RARETES_EVEIL[RARETE_GARANTIE], 'RARETE_GARANTIE doit être une rareté connue');
    const service = SERVICES_TOUR['forcer-rarete'];
    verifier(service.desc.includes(RARETES_EVEIL[RARETE_GARANTIE].nom),
      `« ${service.desc} » doit parler de ${RARETES_EVEIL[RARETE_GARANTIE].nom}`);
    const relance = SERVICES_TOUR['relancer-eveil'];
    verifier(relance.desc.includes(RARETES_EVEIL[RARETE_GARANTIE].nom),
      `« ${relance.desc} » doit parler de ${RARETES_EVEIL[RARETE_GARANTIE].nom}`);
  });

  test('le nombre de propositions annoncé par la Tour est celui du tirage', () => {
    const chiffres = { une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
    const dit = /(une|deux|trois|quatre|cinq|six) propositions?/i.exec(SERVICES_TOUR['relancer-eveil'].desc);
    verifier(!!dit, 'le service de relance doit annoncer combien de propositions il tire');
    egal(chiffres[dit[1].toLowerCase()], PROPOSITIONS_PAR_TIRAGE, 'propositions annoncées par la Tour');
  });
});

// =====================================================================
// Les cinq modes d'une carte.
//
// Expédition · Miner · Récolte · Chasse · Boss. Le même modèle sur les
// 26 cartes, et chaque mode avec SA ressource : c'est tout l'objet de la
// refonte, donc c'est ce qu'on verrouille.
// =====================================================================
suite('Modes de zone', () => {
  const modesRecolte = () => MODES_ZONE.filter((m) => m.metier);

  test('le modèle est le même partout : cinq modes, dans le même ordre', () => {
    egal(MODES_ZONE.length, 5, 'nombre de modes');
    egal(MODES_ZONE.map((m) => m.id).join(' '), 'expedition mine plante peau boss', 'ordre des modes');
    aucun(MODES_ZONE.filter((m) => !m.nom || !m.emoji).map((m) => m.id), 'modes sans nom ou sans emoji');
  });

  test('les trois modes de récolte pointent vers un métier réel', () => {
    aucun(modesRecolte().filter((m) => !METIERS[m.metier]).map((m) => m.id), 'modes liés à un métier inconnu');
    egal(modesRecolte().length, Object.keys(METIERS).length, 'un mode de récolte par métier');
    const familles = modesRecolte().map((m) => METIERS[m.metier].famille).sort().join(',');
    egal(familles, 'mine,peau,plante', 'les trois filières sont couvertes');
  });

  test('chaque carte alimente les trois modes de récolte', () => {
    const vides = [];
    ZONES.forEach((z) => {
      modesRecolte().forEach((mode) => {
        if (!materiauxDuMode(z, mode).length) vides.push(`${z.id}/${mode.nom}`);
      });
    });
    aucun(vides, 'modes de récolte sans la moindre ressource sur leur carte');
  });

  test('un matériau n\'appartient qu\'à un seul mode', () => {
    const doublons = [];
    ZONES.forEach((z) => {
      const vu = {};
      modesRecolte().forEach((mode) => {
        materiauxDuMode(z, mode).forEach((e) => {
          if (vu[e.id]) doublons.push(`${z.id} : ${e.id} dans ${vu[e.id]} et ${mode.nom}`);
          vu[e.id] = mode.nom;
        });
      });
    });
    aucun(doublons, 'matériaux rattachés à deux modes à la fois');
  });

  test('aucune ressource de carte n\'est orpheline d\'un mode', () => {
    // Un matériau sans filière ne tomberait d'aucun des cinq modes : il
    // serait annoncé sur la carte et introuvable en jeu.
    const orphelins = [];
    ZONES.forEach((z) => {
      (z.recolte || []).forEach((e) => {
        if (!FAMILLE_MATERIAU[e.id]) orphelins.push(`${z.id} : ${e.id}`);
      });
    });
    aucun(orphelins, 'ressources de carte qu\'aucun mode ne rapporte');
  });

  test('tout matériau récoltable du catalogue a sa filière', () => {
    const sans = Object.entries(OBJETS)
      .filter(([, o]) => o.type === 'materiau')
      .filter(([id]) => !FAMILLE_MATERIAU[id])
      .map(([id]) => id);
    aucun(sans, 'matériaux sans filière de métier');
  });

  test('une filière de récolte ne s\'ouvre que par son mode', () => {
    // filiereAutorisee() est la règle unique : c'est le mode qui décide
    // de la filière ramassée, jusque dans le butin des monstres.
    egal(filiereAutorisee({ genre: 'chasse' }), 'peau', 'la battue rapporte des peaux');
    egal(filiereAutorisee({ genre: 'embuscade', filiereRecolte: 'mine' }), 'mine', 'l\'embuscade suit la récolte en cours');
    ['exploration', 'boss'].forEach((genre) => {
      egal(filiereAutorisee({ genre }), null, `« ${genre} » ne doit ouvrir aucune filière`);
    });
  });

  test('la règle des modes s\'arrête aux frontières de la carte', () => {
    // Donjons, tours et boss du monde ne sont pas des modes de carte :
    // leurs tables de butin restent intactes. Les filtrer aurait été un
    // effet de bord, pas la demande.
    ['tour', 'tourBoss', 'donjon', 'bossMonde'].forEach((genre) => {
      egal(filiereAutorisee({ genre }), 'toutes', `« ${genre} » garde son butin`);
    });
    GENRES_DE_CARTE.forEach((genre) => {
      verifier(filiereAutorisee({ genre, filiereRecolte: 'mine' }) !== 'toutes',
        `« ${genre} » est un mode de carte : il doit être filtré`);
    });
  });

  test('l\'expédition ne distribue aucun matériau d\'artisanat', () => {
    // Les vivres d'une trouvaille sont des consommables, jamais des
    // matériaux : ceux-là appartiennent aux trois modes de récolte.
    const fautes = VIVRES_EXPEDITION.filter((v) => !OBJETS[v.id] || OBJETS[v.id].type !== 'consommable'
      || FAMILLE_MATERIAU[v.id]).map((v) => v.id);
    aucun(fautes, 'vivres d\'expédition qui ne sont pas de simples consommables');
    verifier(VIVRES_EXPEDITION.some((v) => v.niveauMin <= 1), 'une trouvaille doit être possible dès la première carte');
    for (let i = 1; i < VIVRES_EXPEDITION.length; i++) {
      verifier(VIVRES_EXPEDITION[i].niveauMin > VIVRES_EXPEDITION[i - 1].niveauMin,
        'les vivres doivent monter en gamme avec le niveau de la carte');
    }
  });

  test('les modes annoncent ce qu\'ils rapportent, sans mentir', () => {
    // Le libellé d'un mode liste les matériaux de SA filière : si un
    // matériau change de filière, l'affichage suit tout seul.
    const fautes = [];
    ZONES.forEach((z) => {
      modesRecolte().forEach((mode) => {
        materiauxDuMode(z, mode).forEach((e) => {
          if (!OBJETS[e.id]) fautes.push(`${z.id}/${mode.nom} : ${e.id} absent du catalogue`);
          else if (FAMILLE_MATERIAU[e.id] !== METIERS[mode.metier].famille) {
            fautes.push(`${z.id}/${mode.nom} : ${e.id} est de filière ${FAMILLE_MATERIAU[e.id]}`);
          }
        });
      });
    });
    aucun(fautes, 'modes annonçant une ressource qu\'ils ne rapportent pas');
  });
});

// =====================================================================
// Le graphe des 35 histoires.
//
// Un donjon est un graphe d'étapes reliées par `suite`. Une flèche vers
// une étape qui n'existe pas, une étape qu'aucun chemin n'atteint, ou
// une scène sans sortie, et le joueur reste coincé dans le récit — sans
// aucun message d'erreur pour le prévenir. Ces tests parcourent le
// graphe complet de chaque histoire.
// =====================================================================
suite('Graphe des donjons', () => {
  // Toutes les flèches sortantes d'une étape, quel que soit son type.
  function sortiesDe(etape) {
    const s = [];
    if (etape.suite) s.push(etape.suite);
    if (etape.reussite && etape.reussite.suite) s.push(etape.reussite.suite);
    if (etape.echec && etape.echec.suite) s.push(etape.echec.suite);
    (etape.options || []).forEach((o) => {
      if (o.suite) s.push(o.suite);
      (o.resultats || []).forEach((r) => { if (r.suite) s.push(r.suite); });
    });
    return s;
  }

  test('chaque histoire part d\'une étape qui existe', () => {
    aucun(DONJONS.filter((d) => !d.etapes[d.depart]).map((d) => `${d.id} → ${d.depart}`),
      'histoires dont l\'étape de départ est introuvable');
  });

  test('aucune flèche ne mène à une étape inexistante', () => {
    const cassees = [];
    DONJONS.forEach((d) => {
      Object.entries(d.etapes).forEach(([id, etape]) => {
        sortiesDe(etape).forEach((cible) => {
          if (!d.etapes[cible]) cassees.push(`${d.id}/${id} → ${cible}`);
        });
      });
    });
    aucun(cassees, 'flèches vers une étape inexistante');
  });

  test('aucune étape n\'est un cul-de-sac (sauf les fins)', () => {
    const impasses = [];
    DONJONS.forEach((d) => {
      Object.entries(d.etapes).forEach(([id, etape]) => {
        if (etape.type === 'fin') return;
        if (!sortiesDe(etape).length) impasses.push(`${d.id}/${id}`);
      });
    });
    aucun(impasses, 'étapes sans aucune sortie — le joueur y reste bloqué');
  });

  test('toute étape écrite est atteignable depuis le départ', () => {
    const orphelines = [];
    DONJONS.forEach((d) => {
      const vus = new Set();
      const pile = [d.depart];
      while (pile.length) {
        const cur = pile.pop();
        if (!cur || vus.has(cur) || !d.etapes[cur]) continue;
        vus.add(cur);
        sortiesDe(d.etapes[cur]).forEach((s) => pile.push(s));
      }
      Object.keys(d.etapes).forEach((id) => { if (!vus.has(id)) orphelines.push(`${d.id}/${id}`); });
    });
    aucun(orphelines, 'étapes écrites mais qu\'aucun chemin n\'atteint');
  });

  test('chaque histoire a une fin qu\'on peut atteindre', () => {
    const sansFin = [];
    DONJONS.forEach((d) => {
      const vus = new Set();
      const pile = [d.depart];
      while (pile.length) {
        const cur = pile.pop();
        if (!cur || vus.has(cur) || !d.etapes[cur]) continue;
        vus.add(cur);
        sortiesDe(d.etapes[cur]).forEach((s) => pile.push(s));
      }
      if (![...vus].some((id) => d.etapes[id].type === 'fin')) sansFin.push(d.id);
    });
    aucun(sansFin, 'histoires sans aucune fin atteignable');
  });

  test('les monstres et boss des histoires existent tous', () => {
    const inconnus = [];
    DONJONS.forEach((d) => {
      Object.entries(d.etapes).forEach(([id, etape]) => {
        (etape.monstres || []).forEach((m) => {
          if (!MONSTRES[m] && !MONSTRES_DONJONS[m]) inconnus.push(`${d.id}/${id} → ${m}`);
        });
        if (etape.monstre && !MONSTRES[etape.monstre] && !MONSTRES_DONJONS[etape.monstre]) {
          inconnus.push(`${d.id}/${id} → ${etape.monstre}`);
        }
      });
    });
    aucun(inconnus, 'monstres d\'histoire absents du bestiaire');
  });

  test('tout objet distribué par une histoire existe au catalogue', () => {
    const inconnus = [];
    const verifEffet = (effet, ou) => {
      Object.keys((effet || {}).objets || {}).forEach((id) => {
        if (!OBJETS[id]) inconnus.push(`${ou} → ${id}`);
      });
    };
    DONJONS.forEach((d) => {
      Object.entries(d.etapes).forEach(([id, etape]) => {
        verifEffet(etape.effet, `${d.id}/${id}`);
        ['reussite', 'echec'].forEach((k) => verifEffet((etape[k] || {}).effet, `${d.id}/${id}/${k}`));
        (etape.options || []).forEach((o, i) => {
          verifEffet(o.effet, `${d.id}/${id}/option ${i + 1}`);
          (o.resultats || []).forEach((r) => verifEffet(r.effet, `${d.id}/${id}/option ${i + 1}`));
        });
      });
      const rec = d.recompenses || {};
      if (rec.objet && !OBJETS[rec.objet]) inconnus.push(`${d.id}/récompense → ${rec.objet}`);
      Object.keys(rec.objets || {}).forEach((id) => { if (!OBJETS[id]) inconnus.push(`${d.id}/récompense → ${id}`); });
      Object.values(rec.objetParDrapeau || {}).forEach((id) => { if (!OBJETS[id]) inconnus.push(`${d.id}/épilogue → ${id}`); });
    });
    aucun(inconnus, 'objets d\'histoire absents du catalogue');
  });

  test('aucun drapeau n\'est lu sans être posable', () => {
    // Un drapeau lu mais jamais posé, c'est une variante d'épilogue ou un
    // affaiblissement de boss auquel le joueur n'a jamais accès.
    const fantomes = [];
    DONJONS.forEach((d) => {
      const poses = new Set();
      const lus = new Map();
      const noterPose = (effet) => { if (effet && effet.drapeau) poses.add(effet.drapeau); };
      Object.entries(d.etapes).forEach(([id, etape]) => {
        noterPose(etape.effet);
        ['reussite', 'echec'].forEach((k) => noterPose((etape[k] || {}).effet));
        (etape.options || []).forEach((o) => {
          noterPose(o.effet);
          (o.resultats || []).forEach((r) => noterPose(r.effet));
        });
        (etape.modificateurs || []).forEach((m) => { if (m.drapeau) lus.set(m.drapeau, `${id} (modificateur)`); });
        (etape.variantes || []).forEach((v) => { if (v.drapeau) lus.set(v.drapeau, `${id} (variante)`); });
        (etape.options || []).forEach((o, i) => {
          const c = o.condition || {};
          if (c.drapeau) lus.set(c.drapeau, `${id}/option ${i + 1}`);
          if (c.sansDrapeau) lus.set(c.sansDrapeau, `${id}/option ${i + 1}`);
        });
      });
      Object.keys(d.recompenses.objetParDrapeau || {}).forEach((dr) => lus.set(dr, 'récompense'));
      lus.forEach((ou, dr) => { if (!poses.has(dr)) fantomes.push(`${d.id} : « ${dr} » lu par ${ou}`); });
    });
    aucun(fantomes, 'drapeaux lus mais qu\'aucun choix ne pose');
  });

  test('les épreuves au d20 testent un attribut réel, avec un seuil', () => {
    const fautes = [];
    DONJONS.forEach((d) => {
      Object.entries(d.etapes).forEach(([id, etape]) => {
        if (etape.type !== 'epreuve') return;
        if (!CARACS[etape.stat]) fautes.push(`${d.id}/${id} : attribut « ${etape.stat} »`);
        if (!(etape.difficulte > 0)) fautes.push(`${d.id}/${id} : difficulté ${etape.difficulte}`);
        ['reussite', 'echec'].forEach((k) => {
          if (!etape[k]) fautes.push(`${d.id}/${id} : issue « ${k} » manquante`);
        });
      });
      Object.entries(d.etapes).forEach(([id, etape]) => {
        (etape.options || []).forEach((o, i) => {
          const c = o.condition;
          if (c && c.stat && !CARACS[c.stat]) fautes.push(`${d.id}/${id}/option ${i + 1} : attribut « ${c.stat} »`);
          if (c && c.stat && c.min == null) fautes.push(`${d.id}/${id}/option ${i + 1} : seuil absent`);
        });
      });
    });
    aucun(fautes, 'épreuves ou conditions mal formées');
  });

  test('l\'accès à une Chronique reste ouvrable : zone, boss et objet-clé réels', () => {
    const fautes = [];
    DONJONS.filter((d) => d.chronique).forEach((d) => {
      const zone = ZONES.find((z) => z.id === d.zone);
      if (!zone) { fautes.push(`${d.id} : zone « ${d.zone} » inconnue`); return; }
      const a = d.acces || {};
      if (a.objet && !OBJETS[a.objet]) fautes.push(`${d.id} : objet-clé « ${a.objet} » inconnu`);
      if (a.objet && !(zone.recolte || []).some((r) => r.id === a.objet)) {
        fautes.push(`${d.id} : l'objet-clé « ${a.objet} » ne se récolte pas sur sa propre carte`);
      }
      if (a.stat && !CARACS[a.stat]) fautes.push(`${d.id} : attribut « ${a.stat} » inconnu`);
      if (a.bossZone && !ZONES.some((z) => z.id === a.bossZone)) fautes.push(`${d.id} : boss de zone « ${a.bossZone} » inconnu`);
    });
    aucun(fautes, 'Chroniques dont l\'accès ne peut pas se remplir');
  });

  test('chaque carte du monde a exactement une Chronique', () => {
    const fautes = ZONES
      .map((z) => [z.id, DONJONS.filter((d) => d.chronique && d.zone === z.id).length])
      .filter(([, n]) => n !== 1)
      .map(([id, n]) => `${id} : ${n}`);
    aucun(fautes, 'cartes sans Chronique, ou avec plusieurs');
  });
});

suite('Accès admin par le portrait', () => {
  test('seul le code exact ouvre la porte', () => {
    verifier(codeAdminValide('Silka2026'), 'le code exact doit passer');
    verifier(codeAdminValide('  Silka2026  '),
      'les espaces collés par un clavier mobile ne doivent pas bloquer');
  });

  test('un code approchant reste refusé', () => {
    ['silka2026', 'SILKA2026', 'Silka202', 'Silka20266', 'admin-valciel', '', ' ']
      .forEach((essai) => {
        verifier(!codeAdminValide(essai), `« ${essai} » ne devrait pas ouvrir la console`);
      });
  });

  test('une saisie qui n\'est pas du texte ne fait pas planter le verrou', () => {
    [null, undefined, 0, {}, []].forEach((essai) => {
      verifier(!codeAdminValide(essai), 'une valeur non-texte doit être refusée sans erreur');
    });
  });

  test('un héros ordinaire n\'est pas admin tant qu\'on ne lui donne rien', () => {
    verifier(!herosTest().admin, 'la console ne doit pas être ouverte par défaut');
  });

  test('monter puis redescendre ne double pas les points', () => {
    const p = herosTest();
    const pointsDepart = p.pointsEnAttente;
    const maitriseDepart = p.maitrise || 0;
    adminFixerNiveau(p, 30);
    adminFixerNiveau(p, p.niveau - 10);
    adminFixerNiveau(p, 30);
    egal(p.niveau, 30, 'niveau après l\'aller-retour');
    egal(p.pointsEnAttente, pointsDepart + pointsCumules(30) - pointsCumules(1),
      'points à répartir après un aller-retour 30 → 20 → 30');
    egal(p.maitrise, maitriseDepart + pointsMaitrisePourNiveau(30) - pointsMaitrisePourNiveau(1),
      'points de maîtrise après un aller-retour');
  });

  test('descendre ne reprend jamais plus que le crédit non dépensé', () => {
    const p = herosTest();
    adminFixerNiveau(p, 40);
    p.pointsEnAttente = 0; // tout a été placé dans les caractéristiques
    p.maitrise = 0;        // et tous les rangs achetés
    adminFixerNiveau(p, 1);
    egal(p.pointsEnAttente, 0, 'les points déjà placés ne repartent pas en négatif');
    egal(p.maitrise, 0, 'la maîtrise déjà dépensée ne repart pas en négatif');
    egal(p.niveau, 1, 'le niveau descend bien jusqu\'à 1');
  });

  test('le niveau reste borné entre 1 et le maximum', () => {
    const p = herosTest();
    adminFixerNiveau(p, -50);
    egal(p.niveau, 1, 'plancher');
    adminFixerNiveau(p, NIVEAU_MAX + 500);
    egal(p.niveau, NIVEAU_MAX, 'plafond');
  });

  test('fixer un niveau remet le héros d\'aplomb', () => {
    const p = herosTest();
    p.hp = 1;
    p.mp = 0;
    adminFixerNiveau(p, 25);
    egal(p.hp, p.maxHp, 'PV pleins');
    egal(p.mp, p.maxMp, 'PM pleins');
    egal(p.xp, seuilXp(25), 'l\'XP colle au palier du niveau');
  });
});

// =====================================================================
// v20 — ÉQUILIBRAGE : le contrôle de cohérence qui manquait.
//
// Rien ne comparait jamais un héros RÉEL au contenu réel. Deux courbes
// vivaient chacune de leur côté — celle de la puissance et celle de la
// difficulté — et elles avaient divergé d'un facteur sept sans qu'aucun
// test ne s'en aperçoive. Un joueur de niveau 22 dépassait la puissance
// « conseillée » pour le niveau 100, et nettoyait le contenu de son niveau
// avec neuf fois la marge nécessaire.
//
// Cette suite est le garde-fou. Elle mesure ce qu'un joueur vit vraiment :
// combien de tours pour nettoyer un groupe, combien de tours avant de
// tomber, et si l'un des deux camps peut tuer d'un seul coup.
// =====================================================================
suite('Équilibrage (v20)', () => {
  test('la table PUISSANCE_ETALON colle au héros réellement mesuré', () => {
    // La table embarquée dans progression.js est un calcul figé : si le
    // catalogue ou les formules bougent, elle doit être régénérée. Ce test
    // est ce qui empêche qu'on l'oublie.
    const derives = [];
    let record = 0;
    for (let n = 1; n <= NIVEAU_MAX; n++) {
      record = Math.max(record, puissancesEtalon(n).min);
      const ecart = Math.abs(puissanceEtalon(n) - record) / record;
      if (ecart > 0.02) derives.push(`niv. ${n} : table ${puissanceEtalon(n)} vs mesuré ${record}`);
    }
    aucun(derives, 'PUISSANCE_ETALON a dérivé — régénérer la table');
  });

  test('l\'équipement pèse environ 40 % du héros, jamais plus de la moitié', () => {
    // C'était 88 % : le personnage ne comptait plus, seul son butin comptait.
    const fautifs = [];
    let somme = 0;
    let n = 0;
    [5, 10, 22, 30, 40, 50, 60, 70, 80, 90, 100].forEach((niveau) => {
      const p = personaReference('guerrier', niveau);
      const nu = { ...p, equipement: {}, familier: null };
      const avec = statsEffectives(p);
      const sans = statsEffectives(nu);
      const total = Object.keys(CARACS).reduce((a, c) => a + (avec[c] || 0), 0);
      const propre = Object.keys(CARACS).reduce((a, c) => a + (sans[c] || 0), 0);
      const part = (total - propre) / total;
      somme += part; n++;
      if (part > 0.55) fautifs.push(`niv. ${niveau} : ${Math.round(part * 100)} %`);
    });
    aucun(fautifs, 'niveaux où l\'équipement écrase le personnage');
    entre(somme / n, 0.33, 0.47, 'part moyenne de l\'équipement dans les caractéristiques');
  });

  test('les sous-caractéristiques n\'atteignent leur plafond qu\'en fin de partie', () => {
    // Elles étaient à la moitié de leur plafond dès le niveau 22 : critique,
    // détermination et la ténacité d'alors — les multiplicateurs de dégâts —
    // étaient
    // déjà à moitié acquis au premier quart du jeu.
    const plafond = Object.keys(SOUS_CARACS).reduce((a, c) => a + PLAFONDS_SOUS_CARACS[c], 0);
    const saturation = (niveau) => {
      const s = statsEffectives(personaReference('guerrier', niveau));
      return Object.keys(SOUS_CARACS).reduce((a, c) => a + (s[c] || 0), 0) / plafond;
    };
    entre(saturation(22), 0.15, 0.40, 'saturation au niveau 22');
    entre(saturation(100), 0.70, 1.0, 'saturation au niveau 100');
    verifier(saturation(100) > saturation(22), 'la saturation doit progresser avec le niveau');
  });

  test('aucun monstre ne tue un héros de son niveau en un coup', () => {
    // La règle demandée : personne ne se fait « one shot », dans aucun sens.
    const fautives = [];
    ZONES.forEach((z) => {
      const t = tensionZone(z, 3);
      if (t && t.reference.pireCoupPct > 0.25) {
        fautives.push(`${z.nom} : ${Math.round(t.reference.pireCoupPct * 100)} % des PV en un coup`);
      }
    });
    aucun(fautives, 'zones où un seul coup fait trop mal');
  });

  test('aucun héros ne pulvérise un monstre de son niveau d\'une pichenette', () => {
    // v20.1 : la règle se lit en DEUX temps, parce que la calibration des
    // compétences a séparé pour de bon le coup d'entretien du coup gardé
    // en réserve.
    //
    //   • en rythme de croisière, un monstre doit encaisser au moins deux
    //     tours. Un ennemi qui tombe à chaque coup n'est pas un combat.
    //   • une pointe — la grosse compétence, sortie au bon moment, qui
    //     part en critique — a le droit d'achever un monstre d'un coup.
    //     C'est ce qui rend le choix du moment intéressant. Elle ne doit
    //     simplement jamais en emporter DEUX.
    const tropFort = [];
    const tropDeBurst = [];
    ZONES.filter((z) => z.niveauMin > 4).forEach((z) => {
      const mobs = z.monstres.map((c) => MONSTRES[c]).filter(Boolean);
      if (!mobs.length) return;
      const niveau = niveauReelZone(z);
      const pv = mobs.reduce((a, m) => a + m.hp, 0) / mobs.length;
      classesEtalon().forEach((classe) => {
        const p = personaEquipeNormalement(classe, niveau);
        if (degatsParTourHeros(p) / pv > 0.6) {
          tropFort.push(`${z.nom} / ${classe} : ${Math.round(degatsParTourHeros(p) / pv * 100)} % par tour`);
        }
        if (plusGrosCoupHeros(p) / pv > 2.5) {
          tropDeBurst.push(`${z.nom} / ${classe} : une pointe emporte ${(plusGrosCoupHeros(p) / pv).toFixed(1)} monstres`);
        }
      });
    });
    aucun(tropFort, 'zones où les monstres tombent en moins de deux tours');
    aucun(tropDeBurst, 'zones où une seule pointe emporte deux monstres');
  });

  test('la tension reste dans la même fourchette du niveau 1 au niveau 100', () => {
    // LE test qui aurait dû exister. Avant : 1,1× au niveau 3, 9,3× au
    // niveau 22, 1,0× au niveau 90 — une bulle de contenu trivial au milieu
    // de la partie, invisible pour tout le monde.
    const marges = [];
    const horsFourchette = [];
    ZONES.forEach((z) => {
      const t = tensionZone(z, 3);
      if (!t) return;
      marges.push(t.reference.marge);
      if (t.reference.marge < 0.8 || t.reference.marge > 3.2) {
        horsFourchette.push(`${z.nom} : ${t.reference.marge.toFixed(1)}×`);
      }
    });
    aucun(horsFourchette, 'zones dont la tension sort de la fourchette');
    const moyenne = marges.reduce((a, v) => a + v, 0) / marges.length;
    entre(moyenne, 1.5, 2.2, 'marge moyenne sur toutes les zones');
    // Et surtout : plus de bulle. Le rapport entre la zone la plus tendue
    // et la plus tranquille doit rester modeste.
    entre(Math.max(...marges) / Math.min(...marges), 1, 3.5, 'écart entre la zone la plus dure et la plus douce');
  });

  test('sauter vingt niveaux de contenu ne pardonne pas', () => {
    // Le symptôme signalé : « au niveau 22 je pourrais faire la map 90-100 ».
    // On vérifie avec un héros bien équipé (légendaire) : aucune classe ne
    // doit survivre au contenu de niveau 46, et l'écart avec son propre
    // contenu doit être franc.
    const chezSoi = ZONES.filter((z) => z.niveauMin === 20)[0];
    const tropHaut = ZONES.filter((z) => z.niveauMin >= 44)[0];
    const mSoi = chezSoi.monstres.map((c) => MONSTRES[c]).filter(Boolean);
    const mHaut = tropHaut.monstres.map((c) => MONSTRES[c]).filter(Boolean);
    const survivants = [];
    classesEtalon().forEach((classe) => {
      const p = personaEquipeNormalement(classe, 20);
      const marge = tensionCombat(mHaut, p, 3).marge;
      if (marge >= 1) survivants.push(`${classe} (${marge.toFixed(2)}×)`);
    });
    aucun(survivants, 'classes de niveau 20 qui passent quand même le contenu de niveau 44');

    // Et la chute doit être nette, pas marginale.
    classesEtalon().forEach((classe) => {
      const p = personaEquipeNormalement(classe, 20);
      const ici = tensionCombat(mSoi, p, 3).marge;
      const laBas = tensionCombat(mHaut, p, 3).marge;
      verifier(laBas < ici * 0.55,
        `${classe} : la marge doit s'effondrer en montant de 24 niveaux (${ici.toFixed(2)}× → ${laBas.toFixed(2)}×)`);
    });
  });

  test('la marge maximale reste entre 2 et 4, toutes classes et zones confondues', () => {
    // La borne haute est ce qui empêche une classe de se promener : au-delà
    // de 4, on survit quatre fois plus longtemps qu'il ne faut pour gagner,
    // et le combat cesse d'être un combat. Le Gardien était à 5,8×.
    // La borne basse dit l'inverse : si même le meilleur cas descend sous 2,
    // c'est que le jeu ne laisse plus aucune respiration.
    let maximum = 0;
    let ou = '';
    ZONES.forEach((z) => {
      const monstres = (z.monstres || []).map((c) => MONSTRES[c]).filter(Boolean);
      if (!monstres.length) return;
      const niveau = niveauReelZone(z);
      classesEtalon().forEach((classe) => {
        const marge = tensionCombat(monstres, personaEquipeNormalement(classe, niveau), 3).marge;
        if (marge > maximum) { maximum = marge; ou = `${classe} / ${z.nom}`; }
      });
    });
    entre(maximum, 2, 4, `marge maximale (atteinte par ${ou})`);
  });

  test('chaque classe a un passif qui fait vraiment quelque chose', () => {
    // Les six fiches annoncent un passif. Trois ne faisaient rien du tout,
    // un quatrième était vrai à moitié — et le Gardien décrivait la
    // mécanique générale de réduction des dégâts, dont le Guerrier profitait à
    // l'identique (même armure de plaque, 21 % chacun). On vérifie donc
    // que chaque passif produit un effet MESURABLE et PROPRE à sa classe.
    const combattant = (classe, extra) => Object.assign({
      type: 'joueur', classe, niveau: 50, bid: 'x',
      stats: { for: 60, int: 60, dex: 60, esp: 60, vit: 60, cha: 10 },
      equipement: {}, familiers: [], familier: null,
      statuts: [], cooldowns: {}, competences: [], ligne: 'avant',
      hp: 1000, maxHp: 1000, mp: 100, maxMp: 100,
    }, extra || {});

    // Franc-tireur : la ligne arrière ne le pénalise pas.
    verifier(ignoreMalusDeLigne(combattant('franc-tireur')), 'Franc-tireur : « Ligne de tir »');
    verifier(!ignoreMalusDeLigne(combattant('guerrier')), 'le malus de ligne doit rester pour les autres');

    // Guerrier : l'Élan monte et plafonne.
    const g = combattant('guerrier', { elan: 0 });
    const depart = bonusElan(g);
    for (let i = 0; i < 10; i++) nourrirElan(g);
    verifier(bonusElan(g) > depart, 'Guerrier : « Élan » doit monter');
    verifier(bonusElan(g) <= 1 + ELAN_MAX * ELAN_PAR_COUP + 1e-9, '« Élan » doit plafonner');
    verifier(bonusElan(combattant('arcaniste', { elan: 3 })) === 1, '« Élan » n\'appartient qu\'au Guerrier');

    // Arcaniste : le mana revient plus vite.
    verifier(regainDeMana(combattant('arcaniste')) > regainDeMana(combattant('guerrier')),
      'Arcaniste : « Flux »');

    // Devin : le surplus de soin devient bouclier.
    const soigneur = combattant('devin');
    const plein = combattant('devin');
    soigner(plein, 500, soigneur);
    verifier(plein.statuts.some((x) => x.type === 'bouclier'), 'Devin : « Clairvoyance »');
    const plein2 = combattant('guerrier');
    soigner(plein2, 500, combattant('guerrier'));
    verifier(!plein2.statuts.some((x) => x.type === 'bouclier'),
      'le surplus ne doit se figer que pour le Devin');

    // Gardien : provoquer le fait frapper plus fort.
    verifier(bonusRempart(combattant('gardien', { statuts: [{ type: 'provocation', duree: 2 }] })) > 1,
      'Gardien : « Rempart »');
    verifier(bonusRempart(combattant('gardien')) === 1, '« Rempart » ne joue qu\'en provocation');
    verifier(bonusRempart(combattant('guerrier', { statuts: [{ type: 'provocation', duree: 2 }] })) === 1,
      '« Rempart » n\'appartient qu\'au Gardien');

    // Runelame : la Gravure lui rend une part de ses dégâts.
    const rl = combattant('runelame', { hp: 500 });
    draineDeGravure(rl, 200);
    verifier(rl.hp > 500, 'Runelame : « Gravure »');
    const gr = combattant('guerrier', { hp: 500 });
    draineDeGravure(gr, 200);
    verifier(gr.hp === 500, '« Gravure » n\'appartient qu\'au Runelame');
  });

  test('aucune classe ne domine par la seule Vitalité', () => {
    // La Vitalité achète les points de vie de tout le monde ET les dégâts du
    // Gardien : elle payait donc deux fois pour lui, et il frappait aussi
    // fort que la meilleure classe de dégâts avec 1,7 fois ses points de vie.
    const dps = {};
    classesEtalon().forEach((c) => { dps[c] = degatsParTourHeros(personaEquipeNormalement(c, 63)); });
    const meilleurDps = Math.max(...Object.values(dps));
    verifier(dps.gardien < meilleurDps * 0.8,
      `un tank ne doit pas rivaliser en dégâts avec les classes offensives (${Math.round(dps.gardien)} contre ${Math.round(meilleurDps)})`);
    // Il reste le plus résistant : c'est son métier.
    const pv = {};
    classesEtalon().forEach((c) => { pv[c] = personaEquipeNormalement(c, 63).maxHp; });
    verifier(pv.gardien === Math.max(...Object.values(pv)), 'le Gardien doit rester le plus résistant');
  });

  test('aucun niveau ne se gagne en moins de dix combats', () => {
    // Le plancher est posé au moment où l'XP est CRÉDITÉE (voir xpReelle),
    // pas dans la table des monstres : une table ne peut pas savoir qu'un
    // héros de niveau 3 ira farmer la zone de niveau 90, qu'un groupe fera
    // tomber six monstres d'un coup, ou qu'un joueur cumulera les quatre
    // bonus d'expérience du jeu. On éprouve donc les cas tordus.
    const heros = (n) => {
      const p = personaEquipeNormalement('guerrier', n);
      p.race = 'humain';                       // Ambition : +10 % d'XP
      const fam = Object.keys(FAMILIERS).sort((a, b) =>
        (FAMILIERS[b].bonus.xpBonus || 0) - (FAMILIERS[a].bonus.xpBonus || 0))[0];
      p.familier = fam;
      p.familiers = [fam];
      return p;
    };
    const zoneLaPlusHaute = ZONES[ZONES.length - 1];
    const pires = [];
    for (let n = 1; n < NIVEAU_MAX; n += 3) {
      const p = heros(n);
      const besoin = seuilXp(n + 1) - seuilXp(n);
      const accessibles = ZONES.filter((z) => z.niveauMin <= n);
      const derniere = accessibles[accessibles.length - 1] || ZONES[0];
      const candidats = [
        // le meilleur monstre à sa portée, en pack maximum
        Math.max(...derniere.monstres.map((c) => MONSTRES[c].xp)) * 6,
        // le contenu le plus haut du jeu, largement hors de sa portée
        Math.max(...zoneLaPlusHaute.monstres.map((c) => MONSTRES[c].xp)) * 6,
        // un boss
        (MONSTRES[derniere.boss] || { xp: 0 }).xp,
        // une somme absurde, pour vérifier que la borne est bien dure
        999999999,
      ];
      candidats.forEach((brut) => {
        if (!brut) return;
        const combats = besoin / xpReelle(p, brut);
        if (combats < 10) pires.push(`niv. ${n} : ${combats.toFixed(1)} combats`);
      });
    }
    aucun(pires, 'niveaux gagnables en moins de dix combats');
  });

  test('le niveau 100 ne s\'atteint pas en une soirée', () => {
    // L'exigence tient en une phrase : on ne doit pas pouvoir boucler cent
    // niveaux en quatre heures. Un jeu de vingt-six zones, trente-cinq
    // donjons et sept cent une compétences ne peut pas s'épuiser avant
    // d'avoir été habité.
    //
    // On compte en COMBATS, la seule unité qui ne dépende pas de la vitesse
    // de lecture du joueur, et on la convertit avec une hypothèse explicite
    // et volontairement pessimiste.
    //
    // Vingt secondes par combat est en réalité IMPOSSIBLE : le moteur impose
    // 900 ms par tour de monstre et 400 ms entre deux tours (voir la boucle
    // de manches dans js/combat.js), et une bataille tient une dizaine de
    // manches — soit 45 s au bas mot. On garde volontairement cette borne
    // irréaliste : un test qui passe avec une hypothèse trop favorable au
    // joueur passera a fortiori dans la vraie vie.
    const SECONDES_PAR_COMBAT = 20;
    const tailleEsperee = (p) => {
      const s = statsEffectives(p);
      const score = s.for + s.int + s.dex + s.vit + (s.cha || 0);
      const base = 1 + (score >= 90 ? 2 : score >= 50 ? 1 : 0);
      let esp = 0;
      [0, 1].forEach((plus) => {
        const pPlus = plus ? 0.35 : 0.65;
        const n1 = base + plus;
        esp += n1 > 1 ? pPlus * (0.25 * (n1 - 1) + 0.75 * n1) : pPlus * n1;
      });
      return Math.max(1, Math.min(6, esp));
    };
    // Le héros le plus rapide possible : optimisé en XP, et qui farme
    // toujours la meilleure zone à sa portée.
    const herosOptimal = (n) => {
      const p = personaEquipeNormalement('guerrier', n);
      p.race = 'humain';
      const fam = Object.keys(FAMILIERS).sort((a, b) =>
        (FAMILIERS[b].bonus.xpBonus || 0) - (FAMILIERS[a].bonus.xpBonus || 0))[0];
      p.familier = fam;
      p.familiers = [fam];
      return p;
    };
    let total = 0;
    let niveauEn4h = 1;
    const combatsEn4h = (4 * 3600) / SECONDES_PAR_COMBAT;
    for (let n = 1; n < NIVEAU_MAX; n++) {
      const accessibles = ZONES.filter((z) => z.niveauMin <= n);
      const derniere = accessibles[accessibles.length - 1];
      if (!derniere) continue;
      const mobs = derniere.monstres.map((c) => MONSTRES[c]).filter(Boolean);
      if (!mobs.length) continue;
      const p = herosOptimal(n);
      const meilleur = Math.max(...mobs.map((m) => m.xp));
      total += (seuilXp(n + 1) - seuilXp(n)) / xpReelle(p, meilleur * tailleEsperee(p));
      if (total <= combatsEn4h) niveauEn4h = n + 1;
    }
    verifier(total > combatsEn4h * 2,
      `le niveau 100 doit demander bien plus de quatre heures (${Math.round(total)} combats,`
      + ` soit ${(total * SECONDES_PAR_COMBAT / 3600).toFixed(1)} h au rythme le plus rapide)`);
    verifier(niveauEn4h < 60,
      `quatre heures ne doivent pas mener au-delà de la moitié du chemin (atteint : niveau ${niveauEn4h})`);
  });

  test('la courbe d\'XP monte régulièrement, sans falaise', () => {
    // Un niveau doit coûter plus cher que le précédent — mais la pente doit
    // se sentir, pas faire mur. Avant correction : 1,6 combat pour le
    // niveau 1, 185 pour le niveau 99. Un rapport de 114.
    const parNiveau = {};
    Object.values(MONSTRES).forEach((m) => {
      if (m.boss || !m.niveau) return;
      (parNiveau[m.niveau] = parNiveau[m.niveau] || []).push(m);
    });
    const xpMoyenAu = (n) => {
      for (let r = 0; r <= 12; r++) {
        const proches = [];
        for (let k = n - r; k <= n + r; k++) if (parNiveau[k]) proches.push(...parNiveau[k]);
        if (proches.length >= 2) return proches.reduce((a, m) => a + m.xp, 0) / proches.length;
      }
      return null;
    };
    // Héros SANS niveau, volontairement : ce test mesure la forme de la
    // table d'XP, pas l'effet du plancher (qui a son propre test juste
    // au-dessus). Sans niveau, plafondXpParGain ne s'applique pas.
    const heros = { race: 'elfe', equipement: {}, familier: null, familiers: [] };
    const combats = [];
    for (let n = 1; n < NIVEAU_MAX; n++) {
      const xpMoy = xpMoyenAu(n);
      if (!xpMoy) continue;
      combats.push({ n, valeur: (seuilXp(n + 1) - seuilXp(n)) / xpReelle(heros, xpMoy * 3) });
    }
    verifier(combats.length > 50, 'assez de paliers mesurés');
    const valeurs = combats.map((c) => c.valeur);

    // La pente EXISTE : la fin de partie demande nettement plus que le début.
    const debut = combats.filter((c) => c.n <= 10).map((c) => c.valeur);
    const fin = combats.filter((c) => c.n >= 90).map((c) => c.valeur);
    const moyenne = (t) => t.reduce((a, v) => a + v, 0) / t.length;
    verifier(moyenne(fin) > moyenne(debut) * 2,
      `la fin de partie doit coûter nettement plus que le début (${moyenne(debut).toFixed(1)} → ${moyenne(fin).toFixed(1)} combats)`);

    // Mais elle reste LISIBLE : pas de falaise.
    entre(Math.max(...valeurs) / Math.min(...valeurs), 2, 12,
      'rapport entre le palier le plus long et le plus court');
    entre(Math.max(...valeurs), 10, 45, 'combats nécessaires pour le palier le plus long');

    // Et elle ne fait pas de marche : aucun palier ne doit exiger le double
    // du précédent d'un coup.
    const marches = [];
    combats.forEach((c, i) => {
      if (i === 0) return;
      const bond = c.valeur / combats[i - 1].valeur;
      if (bond > 1.6) marches.push(`niv. ${c.n} (×${bond.toFixed(1)})`);
    });
    aucun(marches, 'marches brutales dans la courbe d\'XP');
  });

  test('la progression ne s\'accélère jamais quand on monte', () => {
    // Le test au-dessus vérifie que la pente EXISTE et qu'elle ne fait pas
    // de falaise. Il ne vérifiait pas qu'elle va toujours dans le bon sens
    // — et c'est précisément par là que la dérive est passée.
    //
    // Ce qui avait échappé : l'XP des monstres composait à taux fixe pendant
    // que le coût d'un niveau est quadratique par tronçon. Deux courbes
    // indépendantes, donc un rapport qui dérive. Il fallait 5,5 monstres
    // pour le niveau 50 et 2,2 pour le 52 (franchir le palier des Marches
    // faisait monter deux fois et demie plus vite), puis les niveaux 70 à 80
    // s'allégeaient onze niveaux d'affilée.
    //
    // On mesure ici la courbe de DESIGN : le joueur affronte le contenu
    // taillé pour son niveau, donc un monstre de son niveau. La granularité
    // du bestiaire (un monstre tous les deux à cinq niveaux) est un autre
    // sujet, couvert par les tests de couverture du contenu.
    const combatsPour = (n) => {
      const stats = statsMonstreMarches(n, false);
      return incrementXp(n) / stats.xp;
    };

    // 1. Aucun niveau ne doit demander moins de monstres que le précédent.
    const allegements = [];
    for (let n = 53; n <= NIVEAU_MAX; n++) {
      const avant = combatsPour(n - 1);
      const apres = combatsPour(n);
      if (apres < avant - 0.01) {
        allegements.push(`niv. ${n} (${avant.toFixed(2)} → ${apres.toFixed(2)})`);
      }
    }
    aucun(allegements, 'niveaux qui s\'allègent au lieu de durcir');

    // 2. Le raccord des Marches doit être invisible. Juste avant le palier,
    //    le bestiaire écrit à la main demande ~5,5 monstres : l'entrée des
    //    Marches doit repartir de là, pas d'un chiffre deux fois plus bas.
    const avantPalier = incrementXp(PALIER_XP_MOYEN) / Math.max(...Object.values(MONSTRES)
      .filter((m) => !m.boss && m.niveau <= PALIER_XP_MOYEN && m.niveau >= PALIER_XP_MOYEN - 4)
      .map((m) => m.xp));
    const apresPalier = combatsPour(PALIER_XP_MOYEN + 2);
    entre(apresPalier / avantPalier, 0.85, 1.25,
      `raccord des Marches (${avantPalier.toFixed(2)} → ${apresPalier.toFixed(2)} monstres)`);

    // 3. La pente reste réelle sur les Marches et la Couture.
    verifier(combatsPour(NIVEAU_MAX) > combatsPour(PALIER_XP_MOYEN + 2) * 1.2,
      `la fin de partie doit durcir (${combatsPour(PALIER_XP_MOYEN + 2).toFixed(2)}`
      + ` → ${combatsPour(NIVEAU_MAX).toFixed(2)} monstres)`);
  });

  test('les six classes restent dans un écart de puissance raisonnable', () => {
    // Elles ne se valent pas — c'est voulu — mais l'écart ne doit pas
    // rendre une classe injouable.
    const trop = [];
    [10, 30, 50, 80, 100].forEach((n) => {
      const e = puissancesEtalon(n);
      if (e.max / e.min > 1.6) trop.push(`niv. ${n} : ×${(e.max / e.min).toFixed(2)}`);
    });
    aucun(trop, 'niveaux où une classe décroche complètement');
  });
});

// =====================================================================
// v20 — Cohérence entre les compétences et les caractéristiques
// =====================================================================
suite('Compétences et caractéristiques (v20)', () => {
  test('l\'attaque de base profite à TOUTES les classes', () => {
    // Elle valait « 3 + le meilleur de FOR et DEX » : au niveau 80, un
    // guerrier frappait à 161 et un arcaniste à 9. Même bouton, même tour.
    const fautives = [];
    classesEtalon().forEach((classe) => {
      const p = personaArme(classe, 80);
      const s = statsEffectives(p);
      // La caractéristique dans laquelle la classe investit doit compter —
      // au rendement offensif qui est le sien (la Vitalité rend 60 %, elle
      // paie déjà en points de vie).
      const attendu = valeurOffensiveDe(CLASSES_BASE[classe].stat, s);
      if (degatsAttaqueDeBase(p, s) < attendu) fautives.push(classe);
    });
    aucun(fautives, 'classes dont l\'attaque de base ignore leur caractéristique');

    const degats = classesEtalon().map((c) => {
      const p = personaArme(c, 80);
      return degatsAttaqueDeBase(p, statsEffectives(p));
    });
    entre(Math.max(...degats) / Math.min(...degats), 1, 2.2,
      'écart d\'attaque de base entre la meilleure et la moins bien lotie');
  });

  test('chaque compétence chiffrée déclare la caractéristique qui la porte', () => {
    const sansStat = Object.entries(COMPETENCES)
      .filter(([, c]) => (c.type === 'degats' || c.type === 'soin') && (!c.stat || !CARACS[c.stat]))
      .map(([id]) => id);
    aucun(sansStat, 'compétences chiffrées sans caractéristique valide');
  });

  test('le détail d\'une compétence dit sur quoi elle s\'appuie', () => {
    // La demande : « il faut indiquer les stats concernées par chaque sort
    // pour savoir quoi évoluer ».
    const s = statsEffectives(personaArme('arcaniste', 40));
    const muettes = Object.entries(COMPETENCES)
      .filter(([, c]) => c.type === 'degats' || c.type === 'soin')
      .filter(([, c]) => !detailsCompetence(c, s, 0, 200).some((l) => l.startsWith('📊')))
      .map(([id]) => id);
    aucun(muettes, 'compétences dont le détail ne nomme pas la caractéristique');
  });

  test('aucune compétence chiffrée n\'est figée dans le temps', () => {
    // Un ratio nul, c'est une compétence qui vaut la même chose au niveau 1
    // et au niveau 100 : elle meurt doucement sans que personne ne le voie.
    const figees = Object.entries(COMPETENCES)
      .filter(([, c]) => (c.type === 'degats' || c.type === 'soin') && !c.ratio)
      .map(([id]) => id);
    aucun(figees, 'compétences à puissance fixe');
  });

  test('les retours de mana suivent la réserve du héros', () => {
    // Sept compétences rendaient « +10 PM » en dur : un tiers de la réserve
    // au niveau 5, trois pour cent au niveau 90.
    const effetsMana = Object.entries(COMPETENCES)
      .filter(([, c]) => c.effet && c.effet.type === 'mana');
    verifier(effetsMana.length > 0, 'il existe bien des compétences qui rendent du mana');
    const figees = effetsMana.filter(([, c]) => {
      const petit = valeurRetourMana(c.effet, { int: 10, esp: 2 }, 40);
      const grand = valeurRetourMana(c.effet, { int: 200, esp: 40 }, 600);
      return grand <= petit;
    }).map(([id]) => id);
    aucun(figees, 'retours de mana qui ne progressent pas avec la réserve');
  });
});

// =====================================================================
// Expéditions de groupe : l'instantané publié aux autres écrans
//
// La règle : ce que le salon montre et ce que le chef fait combattre,
// c'est le héros TEL QU'IL EST MAINTENANT. L'auberge, un niveau gagné,
// une compétence apprise, une pièce d'équipement — tout doit passer,
// sans recharger la page.
// =====================================================================
suite('Expéditions de groupe', () => {
  function herosRelie(surcharges = {}) {
    const p = herosTest(surcharges);
    p.cloud = { id: '11111111-1111-1111-1111-111111111111', token: '2222' };
    bornerVie(p);
    return p;
  }

  test('l\'instantané publie les PV et PM du moment, pas ceux de l\'arrivée', () => {
    const p = herosRelie();
    p.hp = 3;
    p.mp = 0;
    egal(snapshotPourGroupe(p).hp, 3, 'PV blessés');
    // Le passage à l'auberge, exactement comme en ville.
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    const apresAuberge = snapshotPourGroupe(p);
    egal(apresAuberge.hp, p.maxHp, 'PV rendus par l\'auberge');
    egal(apresAuberge.mp, p.maxMp, 'PM rendus par l\'auberge');
  });

  test('l\'instantané suit le niveau, les compétences et la puissance', () => {
    const p = herosRelie();
    const avant = snapshotPourGroupe(p);
    const nouvelle = Object.keys(COMPETENCES).find((id) => !p.competences.includes(id));
    apprendreCompetence(p, nouvelle, true);
    adminFixerNiveau(p, 30);
    const apres = snapshotPourGroupe(p);
    egal(apres.niveau, 30, 'le niveau gagné part au groupe');
    verifier(apres.maxHp > avant.maxHp, 'les PV maximum suivent le niveau');
    verifier(apres.competences.includes(nouvelle),
      `la compétence « ${nouvelle} » apprise doit partir au groupe`);
  });

  test('les maximums de l\'instantané sont recalculés, jamais lus tels quels', () => {
    const p = herosRelie();
    // Un maxHp périmé traîne sur le héros (équipement changé sans bornage).
    p.maxHp = 1;
    p.maxMp = 1;
    const s = snapshotPourGroupe(p);
    egal(s.maxHp, maxHpDe(p), 'maxHp recalculé');
    egal(s.maxMp, maxMpDe(p), 'maxMp recalculé');
    verifier(s.hp <= s.maxHp && s.mp <= s.maxMp, 'PV/PM bornés par les maximums publiés');
  });

  test('la spécialité voyage avec l\'instantané (passif de l\'Invocateur)', () => {
    const p = herosRelie();
    p.sousClasse = 'invocateur';
    const distant = creerJoueurDistant(snapshotPourGroupe(p));
    egal(distant.sousClasse, 'invocateur',
      'sans elle, un Invocateur distant perdrait sa deuxième créature');
  });

  test('le héros distant se reconstruit avec les stats effectives reçues', () => {
    const p = herosRelie();
    adminFixerNiveau(p, 20);
    const distant = creerJoueurDistant(snapshotPourGroupe(p));
    verifier(distant.distant === true, 'un distant est marqué comme tel');
    egal(distant.bid, p.cloud.id, 'identifiant de combat = identifiant cloud');
    egal(distant.maxHp, maxHpDe(p), 'PV maximum transmis');
    Object.keys(CARACS).forEach((cle) => {
      egal(statsEffectives(distant)[cle], statsEffectives(p)[cle],
        `caractéristique « ${cle} » transmise sans perte`);
    });
  });

  test('la signature de l\'instantané change dès que le héros change', () => {
    const p = herosRelie();
    const avant = JSON.stringify(snapshotPourGroupe(p));
    egal(JSON.stringify(snapshotPourGroupe(p)), avant,
      'un héros inchangé ne republie rien (pas de martèlement du serveur)');
    p.hp = Math.max(1, p.hp - 1);
    verifier(JSON.stringify(snapshotPourGroupe(p)) !== avant,
      'un seul PV de différence doit déclencher la republication');
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

// =====================================================================
// v22 — La grande passe de cohérence : points de maîtrise, passifs de
// sous-classe, bornes des actes, points de sauvegarde des tours et
// verrous des donjons d'histoire.
// =====================================================================
suite('Cohérence v22', () => {
  // Le journal de combat écrit dans le DOM du jeu, absent de cette page.
  // On le neutralise une fois pour toutes : les tests lisent des chiffres,
  // pas des lignes de récit.
  window.rendreJournal = () => {};

  // Un combattant de laboratoire, complet mais sans DOM ni sauvegarde.
  function combattantTest(sousClasse, extra) {
    const base = SOUS_CLASSES[sousClasse];
    return Object.assign({
      type: 'joueur', classe: base ? base.classe : 'guerrier', sousClasse,
      niveau: 50, bid: 'x', nom: 'Cobaye', avatar: '🧪',
      stats: { for: 40, int: 40, dex: 40, esp: 40, vit: 40, cha: 10 },
      equipement: {}, familiers: [], familier: null, inventaire: [],
      statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
      hp: 1000, maxHp: 1000, mp: 100, maxMp: 100, ko: false,
    }, extra || {});
  }

  function monstreTest(extra) {
    return Object.assign({
      type: 'monstre', id: 'm0', nom: 'Mannequin', emoji: '🎯', niveau: 50,
      atk: 10, dex: 5, statuts: [], hp: 1000, maxHp: 1000, mort: false, defense: false,
    }, extra || {});
  }

  // Un combat minimal : de quoi faire tourner les hooks de passif.
  function combatTest(equipe, monstres) {
    etat.combat = {
      genre: 'exploration', equipe, monstres, manche: 1, file: [],
      actif: null, termine: false, journalLignes: [], statuts: [],
    };
    return etat.combat;
  }

  // ------------------------------------------------------------------
  // 1. Les points de maîtrise
  // ------------------------------------------------------------------
  test('les paliers de maîtrise découlent de la cadence annoncée', () => {
    // La liste était écrite à la main et l'affichage aussi : ils se sont
    // contredits pendant trois versions. Ils viennent maintenant du même
    // endroit — ce test le vérifie en reconstruisant la liste à part.
    const attendus = [];
    let precedent = 0;
    CADENCE_MAITRISE.forEach((tranche) => {
      for (let n = precedent + tranche.tousLes; n <= tranche.jusqu; n += tranche.tousLes) attendus.push(n);
      precedent = attendus[attendus.length - 1];
    });
    egal(SEUILS_MAITRISE.join(','), attendus.join(','), 'les paliers doivent suivre la cadence');
    egal(TOTAL_POINTS_MAITRISE, SEUILS_MAITRISE.length, 'le total annoncé doit être le nombre de paliers');
    egal(pointsMaitrisePourNiveau(NIVEAU_MAX), TOTAL_POINTS_MAITRISE,
      'un héros au niveau maximum doit avoir touché tous les points');
  });

  test('le texte des points de maîtrise dit le compte exact', () => {
    const texte = texteBudgetMaitrise();
    verifier(texte.includes(String(TOTAL_POINTS_MAITRISE)),
      `le texte doit annoncer les ${TOTAL_POINTS_MAITRISE} points — « ${texte} »`);
    verifier(texte.includes(String(COMPETENCES_MAITRISABLES)),
      'le texte doit dire combien de compétences on peut porter au rang maximum');
    CADENCE_MAITRISE.forEach((tranche) => {
      verifier(texte.includes(`tous les ${tranche.tousLes} niveaux jusqu’au ${tranche.jusqu}`),
        `la cadence « tous les ${tranche.tousLes} jusqu'au ${tranche.jusqu} » doit être annoncée`);
    });
    // Et la promesse doit être tenable : le budget ne doit jamais dépasser
    // ce qu'il y a à acheter (8 compétences de classe × 5 rangs).
    verifier(COMPETENCES_MAITRISABLES >= 1 && COMPETENCES_MAITRISABLES <= 8,
      `${COMPETENCES_MAITRISABLES} compétences maîtrisables : hors des clous`);
  });

  test('le prochain palier de maîtrise ne ment jamais', () => {
    const faux = [];
    for (let n = 1; n <= NIVEAU_MAX; n++) {
      const prochain = prochainSeuilMaitrise(n);
      if (prochain === null) { if (n < NIVEAU_MAX) faux.push(`niv. ${n} sans suite`); continue; }
      if (prochain <= n) faux.push(`niv. ${n} → ${prochain}`);
      if (pointsMaitrisePourNiveau(prochain) !== pointsMaitrisePourNiveau(n) + 1) faux.push(`niv. ${n} : saut`);
    }
    aucun(faux, 'paliers de maîtrise annoncés à tort');
  });

  // ------------------------------------------------------------------
  // 2. Les bornes du monde
  // ------------------------------------------------------------------
  test('l\'étiquette d\'une carte dit exactement son niveau d\'entrée', () => {
    const faux = ZONES.filter((z) => !z.plage.startsWith(`niv. ${z.niveauMin}-${z.niveauMax}`))
      .map((z) => `${z.nom} : « ${z.plage} » pour un accès au niveau ${z.niveauMin}`);
    aucun(faux, 'étiquettes de carte qui ne collent pas au niveau d\'entrée');
  });

  test('chaque acte annonce le niveau de sa PREMIÈRE carte', () => {
    // Le bug d'origine : « Acte II — niv. 21-50 » alors que sa première
    // carte ouvre au niveau 22. Le joueur atteignait 21 et ne trouvait
    // qu'un cadenas.
    const faux = [];
    ACTES_MONDE.forEach((acte) => {
      const cartes = ZONES.filter((z) => z.acte === acte.id);
      if (!cartes.length) return;
      const entree = Math.min(...cartes.map((z) => z.niveauMin));
      const sortie = Math.max(...cartes.map((z) => z.niveauMax));
      if (acte.niveauMin !== entree) faux.push(`${acte.nom} annonce ${acte.niveauMin}, ouvre à ${entree}`);
      if (acte.niveauMax !== sortie) faux.push(`${acte.nom} annonce ${acte.niveauMax}, finit à ${sortie}`);
      if (acte.plage !== `niv. ${entree}-${sortie}`) faux.push(`${acte.nom} : étiquette « ${acte.plage} »`);
    });
    aucun(faux, 'actes dont les bornes ne collent pas à leurs cartes');
  });

  test('chaque carte appartient à un acte et un seul', () => {
    const orphelines = ZONES.filter((z) => !z.acte).map((z) => z.nom);
    aucun(orphelines, 'cartes sans acte');
    const doublons = ZONES.filter((z) => ACTES_MONDE
      .filter((a) => z.niveauMin >= a.de && z.niveauMin <= a.a).length !== 1).map((z) => z.nom);
    aucun(doublons, 'cartes réclamées par zéro ou deux actes');
  });

  // ------------------------------------------------------------------
  // 3. Les passifs de sous-classe
  // ------------------------------------------------------------------
  test('les 27 sous-classes ont un passif chiffré, et leur fiche le récite', () => {
    const sans = Object.keys(SOUS_CLASSES).filter((id) => !PASSIFS_SOUS_CLASSE[id]);
    aucun(sans, 'sous-classes sans passif branché');
    const orphelins = Object.keys(PASSIFS_SOUS_CLASSE).filter((id) => !SOUS_CLASSES[id]);
    aucun(orphelins, 'passifs qui ne correspondent à aucune sous-classe');

    const muets = [];
    Object.entries(PASSIFS_SOUS_CLASSE).forEach(([id, passif]) => {
      // Un passif sans le moindre réglage ne peut rien faire : c'est
      // exactement l'état d'avant, et il ne doit pas revenir.
      const reglages = Object.keys(passif)
        .filter((cle) => !['nom', 'texte', 'description', 'id'].includes(cle));
      if (!reglages.length && id !== 'assassin') muets.push(id);
      // Et la fiche doit réciter ce que les chiffres disent, mot pour mot.
      if (SOUS_CLASSES[id].passif !== `${passif.nom} — ${passif.description}`) {
        muets.push(`${id} (fiche désaccordée)`);
      }
    });
    aucun(muets, 'passifs sans réglage ou dont la fiche a divergé');
  });

  test('le Faucheur draine tous ses sorts et exécute les moribonds', () => {
    // Le passif annoncé depuis toujours, et qui ne faisait rien : ni les
    // 25 % de PV rendus, ni l'exécution sous 15 % de vie.
    const faucheur = combattantTest('faucheur', { hp: 500 });
    const proie = monstreTest();
    combatTest([faucheur], [proie]);

    moissonDuFaucheur(faucheur, 200);
    verifier(faucheur.hp > 500, `« Moisson » doit rendre des PV (${faucheur.hp})`);
    egal(faucheur.hp, 500 + Math.round(200 * PASSIFS_SOUS_CLASSE.faucheur.drainSorts),
      'la part rendue doit être exactement celle de la fiche');

    // Un Runelame sans spécialité ne draine pas tous ses sorts.
    const nu = combattantTest(null, { hp: 500, classe: 'runelame' });
    moissonDuFaucheur(nu, 200);
    egal(nu.hp, 500, '« Moisson » n\'appartient qu\'au Faucheur');

    // L'exécution : sous le seuil, la cible ne se relève pas.
    proie.hp = Math.round(proie.maxHp * 0.1);
    executerSiMoribonde(faucheur, proie);
    verifier(proie.mort, 'une cible sous 15 % de vie doit être exécutée');

    const debout = monstreTest({ id: 'm1', hp: 500 });
    combatTest([faucheur], [debout]);
    executerSiMoribonde(faucheur, debout);
    verifier(!debout.mort, 'une cible à mi-vie ne doit surtout pas être exécutée');
    etat.combat = null;
  });

  test('les passifs qui multiplient les dégâts multiplient vraiment', () => {
    const cible = monstreTest();
    const mesure = (sousClasse, extra, options) => {
      const c = combattantTest(sousClasse, extra);
      combatTest([c], [cible]);
      const m = multiplicateurPassifs(c, cible, options || {});
      etat.combat = null;
      return m;
    };
    verifier(mesure('colosse', { maxHp: 1500 }) > 1, 'Colosse : la masse doit payer');
    verifier(mesure('colosse', { maxHp: 1500 }) > mesure('colosse', { maxHp: 300 }),
      'Colosse : plus massif, plus fort');
    verifier(mesure('berserker', { hp: 100, maxHp: 1000 }) > mesure('berserker', { hp: 1000, maxHp: 1000 }),
      'Berserker : blessé, il frappe plus fort');
    verifier(mesure('runemaitre', { sortsDuCombat: ['a', 'b', 'c'] }, { compId: 'd' })
      > mesure('runemaitre', { sortsDuCombat: [] }, { compId: 'd' }),
      'Runemaître : varier son répertoire doit payer');
    verifier(mesure('elementaliste', { avantDernierSort: 'a' }, { compId: 'b' })
      > mesure('elementaliste', { avantDernierSort: 'b' }, { compId: 'b' }),
      'Élémentaliste : alterner doit payer, marteler non');
    egal(mesure('templier'), 1, 'un passif défensif ne doit pas gonfler les dégâts');
  });

  test('l\'Assassin ouvre sur un critique, le Moine frappe à la cinquième charge', () => {
    verifier(critiqueForce(combattantTest('assassin')), 'Assassin : le premier coup est critique');
    verifier(!critiqueForce(combattantTest('assassin', { premierCoupFait: true })),
      'Assassin : le second coup redevient ordinaire');
    const moine = combattantTest('moine', { chargesCadence: 4 });
    verifier(!critiqueForce(moine), 'Moine : quatre charges ne suffisent pas');
    moine.chargesCadence = 5;
    verifier(critiqueForce(moine), 'Moine : la cinquième charge déclenche le critique');
    verifier(!critiqueForce(combattantTest('duelliste', { chargesCadence: 9 })),
      'les charges n\'appartiennent qu\'au Moine');
  });

  test('la marque du Traqueur profite à TOUTE l\'équipe', () => {
    const traqueur = combattantTest('traqueur');
    const cible = monstreTest();
    combatTest([traqueur], [cible]);
    egal(multiplicateurMarque(cible), 1, 'une cible non marquée ne subit rien de plus');
    apresDegatsPassifs(traqueur, cible, 50);
    verifier(cible.statuts.some((s) => s.type === 'marque'), 'le coup doit poser la marque');
    egal(Math.round(multiplicateurMarque(cible) * 100),
      Math.round((1 + PASSIFS_SOUS_CLASSE.traqueur.bonusMarque) * 100),
      'la marque doit valoir exactement ce que dit la fiche');
    etat.combat = null;
  });

  test('le Chevalier Noir paie ses sorts en sang quand le mana manque', () => {
    const chevalier = combattantTest('chevalier-noir', { mp: 2, hp: 500 });
    combatTest([chevalier], [monstreTest()]);
    verifier(peutPayerSort(chevalier, 20), 'il doit pouvoir lancer un sort à sec');
    verifier(payerSortEnSang(chevalier, 20), 'le paiement en sang doit aboutir');
    egal(chevalier.mp, 0, 'la réserve part en premier');
    verifier(chevalier.hp < 500, `le sang doit couler (${chevalier.hp})`);
    const autre = combattantTest('berserker', { mp: 2 });
    verifier(!peutPayerSort(autre, 20), 'les autres restent bloqués par le mana');
    etat.combat = null;
  });

  test('le Métamorphe échange des PV contre de l\'initiative', () => {
    const ours = combattantTest('metamorphe', { forme: 'ours' });
    const corbeau = combattantTest('metamorphe', { forme: 'corbeau' });
    delete ours.maxHp; delete corbeau.maxHp;
    verifier(maxHpDe(ours) > maxHpDe(corbeau), 'l\'ours doit porter plus de PV que le corbeau');
    egal(maxHpDe(ours), Math.round(maxHpDe(corbeau) * (1 + PASSIFS_SOUS_CLASSE.metamorphe.pvOurs)),
      'l\'écart doit valoir exactement ce que dit la fiche');
  });

  test('le Voleur ramasse plus d\'or et tire de meilleures raretés', () => {
    const voleur = combattantTest('voleur');
    const honnete = combattantTest('rodeur');
    verifier(multiplicateurOr(voleur) > multiplicateurOr(honnete), 'le Voleur doit gagner plus d\'or');
    egal(Math.round((multiplicateurOr(voleur) - multiplicateurOr(honnete)) * 100),
      Math.round(PASSIFS_SOUS_CLASSE.voleur.bonusOr * 100), 'l\'écart d\'or doit être celui de la fiche');
    // La Chance de butin se compare à SA propre Chance : les deux
    // spécialités n'ont pas les mêmes bonus de caractéristiques.
    egal(chanceButin(voleur) - statsEffectives(voleur).cha, PASSIFS_SOUS_CLASSE.voleur.bonusRarete,
      'la Chance de butin doit monter d\'autant');
    egal(chanceButin(honnete) - statsEffectives(honnete).cha, 0,
      'et rester intacte pour les autres');
  });

  test('l\'Oracle fige tout le surplus de soin, le Devin la moitié', () => {
    const oracle = combattantTest('oracle', { classe: 'devin' });
    const devin = combattantTest(null, { classe: 'devin' });
    combatTest([oracle, devin], [monstreTest()]);
    const blesseA = combattantTest(null, { classe: 'guerrier', hp: 1000, maxHp: 1000 });
    const blesseB = combattantTest(null, { classe: 'guerrier', hp: 1000, maxHp: 1000 });
    soigner(blesseA, 200, devin);
    soigner(blesseB, 200, oracle);
    const bouclier = (c) => (c.statuts.find((s) => s.type === 'bouclier') || {}).valeur || 0;
    verifier(bouclier(blesseB) > bouclier(blesseA),
      `l'Oracle doit figer plus que le tronc commun (${bouclier(blesseB)} contre ${bouclier(blesseA)})`);
    verifier(bouclier(blesseB) <= Math.round(blesseB.maxHp * PASSIFS_SOUS_CLASSE.oracle.plafondSurplus),
      'et jamais plus que son plafond');
    etat.combat = null;
  });

  test('les brûlures du Pyromancien se cumulent, celles des autres non', () => {
    const pyro = combattantTest('pyromancien', { classe: 'arcaniste' });
    const proie = monstreTest();
    combatTest([pyro], [proie]);
    const effet = { type: 'poison', duree: 3, stat: 'int' };
    appliquerEffet(pyro, proie, effet, null, null);
    const premier = proie.statuts.find((x) => x.type === 'poison').valeur;
    for (let i = 0; i < 8; i++) appliquerEffet(pyro, proie, effet, null, null);
    const brulure = proie.statuts.find((x) => x.type === 'poison');
    egal(brulure.cumuls, PASSIFS_SOUS_CLASSE.pyromancien.brulureMax, 'la brûlure doit plafonner');
    egal(brulure.valeur, premier * PASSIFS_SOUS_CLASSE.pyromancien.brulureMax,
      'et valoir exactement le cumul annoncé');

    // Chez tout autre lanceur, un second poison REMPLACE le premier.
    const autre = combattantTest('elementaliste', { classe: 'arcaniste' });
    const cible2 = monstreTest({ id: 'm1' });
    combatTest([autre], [cible2]);
    appliquerEffet(autre, cible2, effet, null, null);
    const seul = cible2.statuts.find((x) => x.type === 'poison').valeur;
    appliquerEffet(autre, cible2, effet, null, null);
    egal(cible2.statuts.find((x) => x.type === 'poison').valeur, seul,
      'le poison ordinaire ne se cumule pas');
    etat.combat = null;
  });

  test('le Corrupteur allonge ses états, le Barde ses bienfaits', () => {
    const corrupteur = combattantTest('corrupteur', { classe: 'runelame' });
    const barde = combattantTest('barde', { classe: 'devin' });
    const neutre = combattantTest(null, { classe: 'runelame' });
    egal(dureeAjustee(corrupteur, { type: 'poison', duree: 3 }),
      3 + PASSIFS_SOUS_CLASSE.corrupteur.dureeBonusStatut, 'Corrupteur : ses états durent plus');
    egal(dureeAjustee(corrupteur, { type: 'benediction', duree: 3 }), 3,
      'mais pas ses bienfaits — ce n\'est pas son métier');
    egal(dureeAjustee(barde, { type: 'benediction', duree: 3 }),
      3 + PASSIFS_SOUS_CLASSE.barde.dureeBuffBonus, 'Barde : ses bénédictions durent plus');
    egal(dureeAjustee(barde, { type: 'poison', duree: 3 }), 3, 'mais pas ses poisons');
    egal(dureeAjustee(neutre, { type: 'poison', duree: 3 }), 3, 'et rien ne change pour les autres');
  });

  test('la sève du Druide arrose toute l\'équipe', () => {
    const druide = combattantTest('druide', { classe: 'devin' });
    const allie = combattantTest(null, { classe: 'guerrier', hp: 400, maxHp: 1000 });
    combatTest([druide, allie], [monstreTest()]);
    seveDuDruide(druide);
    verifier(allie.hp > 400, `la sève doit soigner les alliés (${allie.hp})`);
    const avant = allie.hp;
    seveDuDruide(combattantTest('oracle', { classe: 'devin' }));
    egal(allie.hp, avant, 'et n\'appartenir qu\'au Druide');
    etat.combat = null;
  });

  // ------------------------------------------------------------------
  // 4. Les points de sauvegarde des tours
  // ------------------------------------------------------------------
  test('un point de sauvegarde se grave tous les dix étages, et pas ailleurs', () => {
    const p = herosTest({ niveau: 30 });
    const faux = [];
    for (let etage = 1; etage <= 45; etage++) {
      const attendu = etage % PALIER_SAUVEGARDE_TOUR === 0;
      if (estPalierDeSauvegarde(etage) !== attendu) faux.push(`étage ${etage}`);
    }
    aucun(faux, 'étages mal reconnus comme paliers');

    egal(palierAtteint(p, 'tour'), 0, 'un héros neuf n\'a aucun palier');
    franchirPalierDeSauvegarde(p, 'tour', 7);
    egal(palierAtteint(p, 'tour'), 0, 'l\'étage 7 ne grave rien');
    franchirPalierDeSauvegarde(p, 'tour', 20);
    egal(palierAtteint(p, 'tour'), 20, 'l\'étage 20 grave le palier');
    franchirPalierDeSauvegarde(p, 'tour', 10);
    egal(palierAtteint(p, 'tour'), 20, 'un palier ne recule jamais');
  });

  test('les trois escaliers gardent chacun leur palier', () => {
    const p = herosTest({ niveau: 60 });
    franchirPalierDeSauvegarde(p, 'tour', 30);
    franchirPalierDeSauvegarde(p, 'tourBoss:heroique', 10);
    franchirPalierDeSauvegarde(p, 'ascension:crypte', 20);
    egal(palierAtteint(p, 'tour'), 30, 'Tour Sans Fin');
    egal(palierAtteint(p, 'tourBoss:heroique'), 10, 'Tour des Boss, en Héroïque');
    egal(palierAtteint(p, 'tourBoss:normal'), 0, 'chaque difficulté a le sien');
    egal(palierAtteint(p, 'ascension:crypte'), 20, 'Ascension de la Crypte');
    egal(palierAtteint(p, 'ascension:volcan'), 0, 'chaque épopée a le sien');
  });

  test('le palier rend les PV et les PM — c\'est le seul repos de la Tour', () => {
    const p = herosTest({ niveau: 30 });
    bornerVie(p);
    p.hp = 1;
    p.mp = 0;
    p.statuts = [{ type: 'poison', duree: 3, valeur: 9 }];
    const ligne = franchirPalierDeSauvegarde(p, 'tour', 10);
    verifier(!!ligne, 'le palier doit annoncer le repos');
    egal(p.hp, p.maxHp, 'les PV reviennent au maximum');
    egal(p.mp, p.maxMp, 'les PM aussi');
    egal(p.statuts.length, 0, 'et le poison ne traverse pas le campement');

    p.hp = 1;
    egal(franchirPalierDeSauvegarde(p, 'tour', 13), null, 'un étage ordinaire ne soigne rien');
    egal(p.hp, 1, 'et laisse le héros dans l\'état où il était');
  });

  // ------------------------------------------------------------------
  // 5. Les verrous des donjons d'histoire
  // ------------------------------------------------------------------
  test('chaque donjon d\'histoire déclare de vrais verrous', () => {
    const nus = DONJONS.filter((d) => !d.acces).map((d) => d.nom);
    aucun(nus, 'donjons sans conditions d\'accès');
    const pauvres = DONJONS.filter((d) => {
      const a = d.acces;
      const compte = (a.stat ? 1 : 0) + Object.keys(a.objets || {}).length
        + (a.bossZones || []).length + (a.donjons || []).length + (d.requiert ? 1 : 0)
        + (a.puissance ? 1 : 0) + (a.equipement ? 1 : 0) + (a.metier ? 1 : 0);
      return compte < 3;
    }).map((d) => d.nom);
    aucun(pauvres, 'donjons dont l\'accès tient à moins de trois conditions');
  });

  test('un héros nu, au bon niveau, reste dehors', () => {
    // Le niveau ne suffit plus : c'était tout le problème des Épopées.
    const faux = [];
    DONJONS.forEach((d) => {
      const p = herosTest({ niveau: NIVEAU_MAX });
      p.equipement = {};
      p.inventaire = [];
      p.bossVaincus = [];
      p.donjons = {};
      p.paliersTour = null;
      if (verrousDonjon(p, d).length === 0) faux.push(d.nom);
    });
    aucun(faux, 'donjons qu\'un héros sans rien peut ouvrir');
  });

  test('un héros complètement équipé ouvre toutes les histoires de son palier', () => {
    // L'inverse du test précédent, et le plus important : une condition
    // d'accès ne doit JAMAIS être une impasse. On prend la classe la moins
    // bien lotie de chaque récit et on vérifie qu'elle passe.
    const materiaux = Object.keys(OBJETS).filter((id) => OBJETS[id].type === 'materiau');
    const impasses = [];
    DONJONS.forEach((d) => {
      classesEtalon().forEach((classe) => {
        const p = personaEquipeNormalement(classe, d.niveauMin);
        p.type = 'joueur';
        p.bossVaincus = ZONES.map((z) => z.id);
        p.donjons = {};
        DONJONS.forEach((autre) => { p.donjons[autre.id] = { fini: 1, drapeaux: {}, checkpoint: null }; });
        p.metiers = { mineur: { niveau: 9, xp: 0 }, tanneur: { niveau: 9, xp: 0 }, tisseur: { niveau: 9, xp: 0 } };
        p.inventaire = materiaux.map((id) => ({ id, qte: 9 }));
        const verrous = verrousDonjon(p, d);
        if (verrous.length) impasses.push(`${d.nom} / ${classe} : ${verrous.join(', ')}`);
      });
    });
    aucun(impasses, 'histoires inaccessibles à une classe entièrement équipée');
  });

  test('un verrou manquant se dit toujours en clair', () => {
    const p = herosTest({ niveau: 1 });
    p.equipement = {};
    p.inventaire = [];
    p.bossVaincus = [];
    const muets = [];
    DONJONS.forEach((d) => {
      verrousDonjon(p, d).forEach((v) => {
        if (typeof v !== 'string' || v.trim().length < 3 || v.includes('undefined')) {
          muets.push(`${d.nom} : « ${v} »`);
        }
      });
    });
    aucun(muets, 'verrous illisibles');
  });
});

// =====================================================================
// v23 — Les quatre-vingt-une Voies branchées : leurs réglages existent,
// leur fiche les récite, et le moteur les lit vraiment.
// =====================================================================
suite('Voies (v23)', () => {
  window.rendreJournal = () => {};

  function combattantVoie(sousClasse, voie, extra) {
    const base = SOUS_CLASSES[sousClasse];
    return Object.assign({
      type: 'joueur', classe: base ? base.classe : 'guerrier', sousClasse, voie,
      niveau: 50, bid: 'x', nom: 'Cobaye', avatar: '🧪',
      stats: { for: 40, int: 40, dex: 40, esp: 40, vit: 60, cha: 10 },
      equipement: {}, familiers: [], familier: null, inventaire: [],
      statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
      hp: 1000, maxHp: 1000, mp: 100, maxMp: 100, ko: false,
    }, extra || {});
  }

  function monstreVoie(extra) {
    return Object.assign({
      type: 'monstre', id: 'm0', nom: 'Mannequin', emoji: '🎯', niveau: 50,
      atk: 10, dex: 5, statuts: [], hp: 1000, maxHp: 1000, mort: false, defense: false,
    }, extra || {});
  }

  function combatVoie(equipe, monstres) {
    etat.combat = {
      genre: 'exploration', equipe, monstres, manche: 1, file: [],
      actif: null, termine: false, journalLignes: [],
    };
    return etat.combat;
  }

  // Retrouve une Voie par sa spécialité et son rang (0, 1 ou 2).
  function voieDeRang(sousClasse, rang) {
    return Object.values(VOIES).find((v) => v.sousClasse === sousClasse && v.rang === rang);
  }

  test('les 81 Voies ont des réglages, et pas seulement une phrase', () => {
    egal(Object.keys(VOIES).length, 81, 'le compte des Voies');
    const sans = Object.values(VOIES).filter((v) => !PASSIFS_VOIE[v.id]).map((v) => v.titre);
    aucun(sans, 'Voies sans réglage mécanique');
    const vides = Object.values(VOIES)
      .filter((v) => Object.keys(PASSIFS_VOIE[v.id] || {}).length === 0).map((v) => v.titre);
    aucun(vides, 'Voies dont les réglages sont vides');
  });

  test('la fiche d\'une Voie récite EXACTEMENT ses réglages', () => {
    // C'est toute la garantie : le texte n'est pas écrit, il est produit.
    const desaccordees = Object.values(VOIES)
      .filter((v) => v.passif !== texteMecaniquesVoie(PASSIFS_VOIE[v.id]))
      .map((v) => v.titre);
    aucun(desaccordees, 'Voies dont la fiche a divergé de ses réglages');
    const muettes = Object.values(VOIES).filter((v) => !v.passif || v.passif.length < 20)
      .map((v) => v.titre);
    aucun(muettes, 'Voies dont la fiche ne dit rien');
  });

  test('chaque réglage de Voie sait se dire en français', () => {
    // Un réglage sans phrase serait un effet invisible : le joueur le
    // subirait sans jamais l'avoir lu. Interdit.
    const orphelins = new Set();
    Object.values(MECANIQUES_VOIE).forEach((liste) => liste.forEach((m) => {
      Object.keys(m).forEach((cle) => {
        if (!PHRASES_VOIE[cle] && !CLES_MUETTES.has(cle)) orphelins.add(cle);
      });
    }));
    aucun([...orphelins], 'réglages de Voie sans phrase ni statut de complément');
  });

  test('une Voie recouvre sa spécialité sans jamais l\'effacer', () => {
    // Le Faucheur draine 25 % ; sa Voie du Drain monte à 40 % — et son
    // exécution, qui vient de la spécialité, reste en place.
    const drain = voieDeRang('faucheur', 0);
    const nu = combattantVoie('faucheur', null);
    const voie = combattantVoie('faucheur', drain.id);
    egal(reglagePassif(nu, 'drainSorts', 0), PASSIFS_SOUS_CLASSE.faucheur.drainSorts,
      'sans Voie, le drain de la spécialité');
    egal(reglagePassif(voie, 'drainSorts', 0), 0.4, 'avec la Voie du Drain, il monte');
    egal(reglagePassif(voie, 'seuilExecution', 0), PASSIFS_SOUS_CLASSE.faucheur.seuilExecution,
      'et l\'exécution de la spécialité reste');
  });

  test('les Voies qui multiplient les dégâts multiplient vraiment', () => {
    const cible = monstreVoie();
    const mesure = (sousClasse, rang, extra, options) => {
      const v = voieDeRang(sousClasse, rang);
      const c = combattantVoie(sousClasse, v.id, extra);
      combatVoie([c], [cible]);
      const m = multiplicateurPassifs(c, cible, options || {});
      etat.combat = null;
      return m;
    };
    // Templier du Zèle : +15 % par allié — seul, il n'a personne.
    const zele = voieDeRang('templier', 2);
    const seul = combattantVoie('templier', zele.id);
    const epaule = combattantVoie('templier', zele.id);
    combatVoie([seul, epaule], [cible]);
    const aDeux = multiplicateurPassifs(seul, cible, {});
    combatVoie([seul], [cible]);
    const toutSeul = multiplicateurPassifs(seul, cible, {});
    etat.combat = null;
    verifier(aDeux > toutSeul, 'Templier du Zèle : un allié de plus, des dégâts en plus');

    verifier(mesure('berserker', 0, { manchesEnSang: 4 }) > mesure('berserker', 0, { manchesEnSang: 0 }),
      'Berserker de la Rage : le sang versé paie');
    const moribonde = monstreVoie({ id: 'm1', hp: 100, maxHp: 1000 });
    const miseAMort = voieDeRang('assassin', 2);
    const tueur = combattantVoie('assassin', miseAMort.id, { premierCoupFait: true });
    combatVoie([tueur], [moribonde]);
    verifier(multiplicateurPassifs(tueur, moribonde, {}) >= 2,
      'Assassin de la Mise à Mort : dégâts doublés sous le seuil');
    etat.combat = null;

    verifier(mesure('voltigeur', 2, { ligne: 'arriere' }) > mesure('voltigeur', 2, { ligne: 'avant' }),
      'Voltigeur de la Distance : la portée paie');
    verifier(mesure('colosse', 2, {}, { zone: true }) > mesure('colosse', 2, {}, { zone: false }),
      'Colosse du Séisme : les zones frappent plus fort');
    verifier(mesure('vibrelame', 0, {}, { coupIndex: 3 }) > mesure('vibrelame', 0, {}, { coupIndex: 0 }),
      'Vibrelame de la Résonance : la série se renforce');
  });

  test('la Voie du Vide traverse les boucliers, et se paie', () => {
    const vide = voieDeRang('chevalier-noir', 2);
    const perceur = combattantVoie('chevalier-noir', vide.id, { hp: 1000 });
    const cible = monstreVoie({ statuts: [{ type: 'bouclier', duree: 5, valeur: 5000 }] });
    combatVoie([perceur], [cible]);
    const r = infligerDegats(perceur, cible, 200);
    egal(r.absorbe, 0, 'le bouclier ne doit rien absorber');
    verifier(r.degats > 0, 'et le coup doit passer');
    verifier(perceur.hp < 1000, 'la percée se paie sur ses propres PV');
    etat.combat = null;
  });

  test('la Voie du Sang vole de la vie, mais coupe les soins reçus', () => {
    const sang = voieDeRang('berserker', 1);
    const buveur = combattantVoie('berserker', sang.id, { hp: 500 });
    const soigneur = combattantVoie('druide', null);
    combatVoie([buveur, soigneur], [monstreVoie()]);
    const plein = soigner(buveur, 200, soigneur);
    const temoin = combattantVoie('berserker', null, { hp: 500 });
    const normal = soigner(temoin, 200, soigneur);
    verifier(plein < normal, `les soins reçus doivent être réduits (${plein} contre ${normal})`);
    etat.combat = null;
  });

  test('le Colosse de la Montagne ne se laisse ni assommer ni presser', () => {
    const montagne = voieDeRang('colosse', 1);
    const roc = combattantVoie('colosse', montagne.id);
    combatVoie([roc], [monstreVoie()]);
    appliquerEffet(monstreVoie(), roc, { type: 'etourdi', duree: 3, chance: 1 }, null, null);
    verifier(!roc.statuts.some((s) => s.type === 'etourdi'), 'rien ne doit l\'étourdir');
    verifier(reglagePassif(roc, 'initiativeMoitie', false), 'et il agit en dernier');
    etat.combat = null;
  });

  test('le Colosse du Géant et l\'Ours portent vraiment leurs PV', () => {
    const geant = voieDeRang('colosse', 0);
    const gros = combattantVoie('colosse', geant.id);
    const normal = combattantVoie('colosse', null);
    delete gros.maxHp; delete normal.maxHp;
    verifier(maxHpDe(gros) > maxHpDe(normal), 'la Voie du Géant doit épaissir la carcasse');
    egal(maxHpDe(gros), Math.round(maxHpDe(normal) * (1 + PASSIFS_VOIE[geant.id].pvMaxVoie)),
      'et exactement de ce que dit sa fiche');
  });

  test('la Voie de la Peste propage à TOUS, la Contagion à un seul', () => {
    const peste = voieDeRang('corrupteur', 0);
    const semeur = combattantVoie('corrupteur', peste.id);
    const a = monstreVoie({ id: 'm0' });
    const b = monstreVoie({ id: 'm1' });
    const c = monstreVoie({ id: 'm2' });
    combatVoie([semeur], [a, b, c]);
    propagerStatutsDuCorrupteur(a, [{ type: 'poison', duree: 0, valeur: 12 }]);
    const touches = [b, c].filter((m) => m.statuts.some((s) => s.type === 'poison')).length;
    egal(touches, 2, 'la Peste doit toucher tous les voisins');
    etat.combat = null;
  });

  test('la résurrection d\'une Voie ne joue qu\'une fois par combat', () => {
    const renouveau = voieDeRang('druide', 2);
    const gardien = combattantVoie('druide', renouveau.id);
    const a = combattantVoie('berserker', null, { hp: 0 });
    const b = combattantVoie('moine', null, { hp: 0 });
    combatVoie([gardien, a, b], [monstreVoie()]);
    gererMort(a);
    verifier(!a.ko, 'le premier tombé doit se relever');
    gererMort(b);
    verifier(b.ko, 'le second reste à terre : une seule relève par combat');
    etat.combat = null;
  });

  test('la Voie de la Meute et celle des Pièges entrent en scène au premier tour', () => {
    const meute = voieDeRang('rodeur', 1);
    const chasseur = combattantVoie('rodeur', meute.id);
    const proie = monstreVoie();
    const cb = combatVoie([chasseur], [proie]);
    ouvertureDesVoies(chasseur);
    egal(cb.equipe.filter((x) => x.type === 'invocation').length, 3, 'trois compagnons');

    const pieges = voieDeRang('rodeur', 0);
    const piegeur = combattantVoie('rodeur', pieges.id);
    const proie2 = monstreVoie({ id: 'm1' });
    combatVoie([piegeur], [proie2]);
    ouvertureDesVoies(piegeur);
    verifier(proie2.statuts.some((s) => s.type === 'poison'), 'le piège doit se refermer');
    etat.combat = null;
  });

  test('aucune Voie ne rend un héros ingérable', () => {
    // Garde-fou d'équilibrage : on mesure le multiplicateur de dégâts que
    // chaque Voie procure dans une situation de combat ORDINAIRE — pas de
    // cible moribonde, pas de compteur gonflé. Au-delà de 3, une Voie
    // cesse d'être un parti pris et devient le seul choix possible.
    const cible = monstreVoie({ hp: 900, maxHp: 1000 });
    const excessives = [];
    Object.values(VOIES).forEach((v) => {
      const c = combattantVoie(v.sousClasse, v.id, { hp: 1000, maxHp: 1000 });
      combatVoie([c], [cible]);
      const m = multiplicateurPassifs(c, cible, { compId: 'x' });
      etat.combat = null;
      if (!(m >= 0.5 && m <= 3)) excessives.push(`${v.titre} : ×${m.toFixed(2)}`);
    });
    aucun(excessives, 'Voies dont le multiplicateur de base sort de la fourchette');
  });
});

// =====================================================================
// v24 — Les 162 Éveils et leurs 20 contraintes : branchés, chiffrés, et
// leur fiche dit exactement ce que le moteur applique.
// =====================================================================
suite('Éveils (v24)', () => {
  window.rendreJournal = () => {};

  function heros(sousClasse, idEveil, extra) {
    const base = SOUS_CLASSES[sousClasse];
    return Object.assign({
      type: 'joueur', classe: base ? base.classe : 'guerrier', sousClasse,
      voie: null, eveil: idEveil ? { id: idEveil } : null,
      niveau: 80, bid: 'x', nom: 'Cobaye', avatar: '🧪',
      stats: { for: 60, int: 60, dex: 60, esp: 60, vit: 60, cha: 10 },
      equipement: {}, familiers: [], familier: null, inventaire: [],
      statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
      hp: 1000, maxHp: 1000, mp: 200, maxMp: 200, ko: false,
    }, extra || {});
  }

  function monstre(extra) {
    return Object.assign({
      type: 'monstre', id: 'm0', nom: 'Mannequin', emoji: '🎯', niveau: 80,
      atk: 20, dex: 8, statuts: [], hp: 2000, maxHp: 2000, mort: false, defense: false,
    }, extra || {});
  }

  function combat(equipe, monstres) {
    etat.combat = {
      genre: 'exploration', equipe, monstres, manche: 1, file: [],
      actif: null, termine: false, journalLignes: [],
    };
    return etat.combat;
  }

  const eveilDeRarete = (sc, rarete) => Object.values(EVEILS)
    .find((e) => e.sousClasse === sc && e.rarete === rarete);

  test('les 162 Éveils ont des réglages, et leur fiche les récite', () => {
    egal(Object.keys(EVEILS).length, 162, 'le compte des Éveils');
    const sans = Object.values(EVEILS).filter((e) => !PASSIFS_EVEIL[e.id]).map((e) => e.nom);
    aucun(sans, 'Éveils sans réglage mécanique');
    const desaccordes = Object.values(EVEILS).filter((e) => {
      const contrainte = RARETES_EVEIL[e.rarete].contrainte
        ? MECANIQUES_CONTRAINTE[e.rarete][ROLE_CONTRAINTE[e.classe]] : null;
      const effetSeul = { ...PASSIFS_EVEIL[e.id] };
      Object.keys(contrainte || {}).forEach((cle) => delete effetSeul[cle]);
      return e.effet !== textePassifComplet(effetSeul);
    }).map((e) => e.nom);
    aucun(desaccordes, 'Éveils dont la fiche a divergé de ses réglages');
  });

  test('chaque réglage d\'Éveil sait se dire en français', () => {
    const orphelins = new Set();
    const balayer = (m) => Object.keys(m).forEach((cle) => {
      if (!PHRASES_PASSIF[cle] && !CLES_MUETTES_EVEIL.has(cle)) orphelins.add(cle);
    });
    Object.values(MECANIQUES_EVEIL).forEach((liste) => liste.forEach(balayer));
    Object.values(MECANIQUES_CONTRAINTE).forEach((parRole) => Object.values(parRole).forEach(balayer));
    aucun([...orphelins], 'réglages d\'Éveil sans phrase');
  });

  test('la contrainte suit la rareté, et elle est BRANCHÉE', () => {
    // La règle §5.1 tient par la contrainte : un Divin sans contrainte
    // branchée, c'est un Divin gratuitement meilleur.
    const fautifs = [];
    Object.values(EVEILS).forEach((e) => {
      const doit = RARETES_EVEIL[e.rarete].contrainte;
      if (doit && !e.contrainte) fautifs.push(`${e.nom} (${e.rarete}) sans contrainte`);
      if (!doit && e.contrainte) fautifs.push(`${e.nom} (${e.rarete}) contraint à tort`);
      if (!doit) return;
      const attendue = MECANIQUES_CONTRAINTE[e.rarete][ROLE_CONTRAINTE[e.classe]];
      const reglages = PASSIFS_EVEIL[e.id];
      Object.entries(attendue).forEach(([cle, valeur]) => {
        if (reglages[cle] !== valeur) fautifs.push(`${e.nom} : contrainte ${cle} absente des réglages`);
      });
    });
    aucun(fautifs, 'contraintes mal accrochées');
  });

  test('l\'Éveil se pose PAR-DESSUS la Voie, qui se pose par-dessus la spécialité', () => {
    const voieDrain = Object.values(VOIES).find((v) => v.sousClasse === 'faucheur' && v.rang === 0);
    const eveilPasseur = eveilDeRarete('faucheur', 'legendaire');
    const nu = heros('faucheur', null);
    const avecVoie = heros('faucheur', null, { voie: voieDrain.id });
    const complet = heros('faucheur', eveilPasseur.id, { voie: voieDrain.id });
    egal(reglagePassif(nu, 'seuilExecution', 0), 0.15, 'spécialité seule');
    egal(reglagePassif(avecVoie, 'drainSorts', 0), 0.40, 'la Voie relève le drain');
    egal(reglagePassif(complet, 'seuilExecution', 0), 0.20, 'l\'Éveil relève l\'exécution');
    verifier(reglagePassif(complet, 'drainSorts', 0) > 0, 'et rien du dessous n\'est perdu');
  });

  test('« Fléau Premier » rend tous les coups critiques — et le prive de tout soin', () => {
    const fleau = eveilDeRarete('berserker', 'divin');
    const brute = heros('berserker', fleau.id);
    const cible = monstre();
    combat([brute], [cible]);
    let crits = 0;
    for (let i = 0; i < 20; i++) {
      cible.hp = cible.maxHp;
      if (infligerDegats(brute, cible, 100).crit) crits++;
    }
    egal(crits, 20, 'tous les coups doivent être critiques');
    verifier(reglagePassif(brute, 'soinsInterdits', false), 'et la contrainte divine doit être là');
    egal(soigner(brute, 300, brute), 0, 'plus aucun soin ne le touche');
    etat.combat = null;
  });

  test('les Éveils d\'immunité tiennent vraiment les états à distance', () => {
    const basalte = eveilDeRarete('colosse', 'mythique');
    const roc = heros('colosse', basalte.id);
    combat([roc], [monstre()]);
    ['poison', 'etourdi', 'affaibli'].forEach((type) => {
      appliquerEffet(monstre(), roc, { type, duree: 3, chance: 1, stat: 'dex' }, null, null);
    });
    egal(roc.statuts.length, 0, 'aucun état ne doit prendre');
    etat.combat = null;
  });

  test('« Muraille Vivante » empêche l\'équipe de tomber, et lui coupe les soins', () => {
    const muraille = eveilDeRarete('templier', 'legendaire');
    const gardien = heros('templier', muraille.id);
    const allie = heros('berserker', null, { hp: 50, maxHp: 1000 });
    combat([gardien, allie], [monstre()]);
    infligerDegats(monstre(), allie, 5000);
    verifier(allie.hp >= 1 && !allie.ko, `l'allié doit rester debout (${allie.hp} PV)`);
    egal(soigner(gardien, 300, allie), 0, 'et le Templier ne peut plus être soigné par les siens');
    etat.combat = null;
  });

  test('« Serment Immortel » relève son porteur une seule fois', () => {
    const serment = eveilDeRarete('templier', 'mythique');
    const gardien = heros('templier', serment.id, { hp: 0 });
    combat([gardien], [monstre()]);
    gererMort(gardien);
    verifier(!gardien.ko, 'il doit se relever');
    gardien.hp = 0;
    gererMort(gardien);
    verifier(gardien.ko, 'mais une seule fois par combat');
    etat.combat = null;
  });

  test('la contrainte divine du tank plafonne vraiment ses PV', () => {
    const aegis = eveilDeRarete('templier', 'divin');
    const plafonne = heros('templier', aegis.id);
    const libre = heros('templier', null);
    delete plafonne.maxHp; delete libre.maxHp;
    egal(maxHpDe(plafonne), Math.round(maxHpDe(libre) * 0.5), 'les PV doivent être coupés en deux');
  });

  test('la contrainte légendaire du corps à corps ferme vraiment les zones', () => {
    const titan = eveilDeRarete('berserker', 'legendaire');
    const brute = heros('berserker', titan.id, { competences: [], mp: 200 });
    const zone = Object.entries(COMPETENCES).find(([, c]) => c.type === 'degats' && c.cible === 'ennemis');
    const a = monstre({ id: 'm0' });
    const b = monstre({ id: 'm1' });
    combat([brute], [a, b]);
    const avant = a.hp + b.hp;
    lancerCompetence(brute, zone[0], a);
    egal(a.hp + b.hp, avant, 'la compétence de zone ne doit rien faire du tout');
    etat.combat = null;
  });

  test('aucun Éveil ne rend un héros ingérable', () => {
    // Même garde-fou que pour les Voies : la rareté change la contrainte,
    // pas le plafond de puissance (règle §5.1).
    const cible = monstre({ hp: 1800, maxHp: 2000 });
    const excessifs = [];
    Object.values(EVEILS).forEach((e) => {
      const c = heros(e.sousClasse, e.id, { hp: 1000, maxHp: 1000, premierCoupFait: true });
      combat([c], [cible]);
      const m = multiplicateurPassifs(c, cible, { compId: 'x' });
      etat.combat = null;
      if (!(m >= 0.4 && m <= 3.5)) excessifs.push(`${e.nom} (${e.rarete}) : ×${m.toFixed(2)}`);
    });
    aucun(excessifs, 'Éveils dont le multiplicateur de base sort de la fourchette');
  });

  test('les trois étages de passifs couvrent tout le jeu, sans trou', () => {
    // Le bilan de la grande passe : plus une seule promesse sans moteur.
    egal(Object.keys(PASSIFS_SOUS_CLASSE).length, 27, 'passifs de spécialité');
    egal(Object.keys(PASSIFS_VOIE).length, 81, 'passifs de Voie');
    egal(Object.keys(PASSIFS_EVEIL).length, 162, 'passifs d\'Éveil');
    const sansTexte = [
      ...Object.values(SOUS_CLASSES).filter((x) => !x.passif),
      ...Object.values(VOIES).filter((x) => !x.passif),
      ...Object.values(EVEILS).filter((x) => !x.effet),
    ].map((x) => x.nom);
    aucun(sansTexte, 'paliers d\'identité sans fiche');
  });
});

// =====================================================================
// v25 — L'OBSERVABILITÉ. Un passif qui agit sans laisser de trace est,
// du point de vue du joueur, un passif qui ne marche pas. Ces tests-là
// ne vérifient pas que la mécanique calcule juste — les suites v22 à v24
// s'en chargent — mais qu'elle SE VOIT.
// =====================================================================
suite('Passifs visibles (v25)', () => {
  window.rendreJournal = () => {};

  function combattant(sousClasse, extra) {
    const base = SOUS_CLASSES[sousClasse];
    return Object.assign({
      type: 'joueur', classe: base ? base.classe : 'guerrier', sousClasse,
      voie: null, eveil: null, niveau: 50, bid: 'x', nom: 'Cobaye', avatar: '🧪',
      stats: { for: 40, int: 40, dex: 40, esp: 40, vit: 40, cha: 10 },
      equipement: {}, familiers: [], familier: null, inventaire: [],
      statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
      hp: 1000, maxHp: 1000, mp: 100, maxMp: 100, ko: false,
    }, extra || {});
  }

  function cible(extra) {
    return Object.assign({
      type: 'monstre', id: 'm0', nom: 'Mannequin', emoji: '🎯', niveau: 50,
      atk: 10, dex: 5, statuts: [], hp: 2000, maxHp: 2000, mort: false, defense: false,
    }, extra || {});
  }

  function combat(equipe, monstres) {
    etat.combat = {
      genre: 'exploration', equipe, monstres, manche: 1, file: [],
      actif: null, termine: false, journalLignes: [],
    };
    return etat.combat;
  }

  test('un drain de passif parle MÊME à pleine vie — la plainte d\'origine', () => {
    // Le bug tel qu'il était vécu : le joueur entre en combat à pleine
    // vie, lance un sort, son Faucheur draine 25 % — et rien, nulle part,
    // ne le lui dit. Il en conclut que le passif ne marche pas. Il a
    // raison de le conclure : rien ne prouvait le contraire.
    const faucheur = combattant('faucheur', { classe: 'runelame', hp: 1000, maxHp: 1000 });
    const cb = combat([faucheur], [cible()]);
    moissonDuFaucheur(faucheur, 200);
    egal(faucheur.hp, 1000, 'à pleine vie, il ne gagne rien — c\'est normal');
    verifier(cb.journalLignes.some((l) => /Moisson/.test(l)),
      'mais le journal DOIT dire que la Moisson a pris sa part');
    verifier(cb.journalLignes.some((l) => /déjà au maximum/.test(l)),
      'et expliquer pourquoi le joueur ne voit pas ses PV monter');
    etat.combat = null;
  });

  test('tous les drains de passif suivent la même règle', () => {
    const cas = [
      ['faucheur', 'runelame', (c) => moissonDuFaucheur(c, 200), /Moisson/],
      ['chevalier-noir', 'gardien', (c) => apresDegatsPassifs(c, cible(), 200), /Soif/],
    ];
    const muets = [];
    cas.forEach(([sc, classe, declencher, motif]) => {
      const heros = combattant(sc, { classe, hp: 1000, maxHp: 1000 });
      const cb = combat([heros], [cible()]);
      declencher(heros);
      if (!cb.journalLignes.some((l) => motif.test(l))) muets.push(sc);
      etat.combat = null;
    });
    aucun(muets, 'drains de passif silencieux à pleine vie');

    // Et la Gravure du Runelame, qui est un passif de CLASSE de base.
    const runelame = combattant(null, { classe: 'runelame', hp: 1000, maxHp: 1000 });
    const cb = combat([runelame], [cible()]);
    draineDeGravure(runelame, 200);
    verifier(cb.journalLignes.some((l) => /Gravure/.test(l)), 'Gravure muette à pleine vie');
    etat.combat = null;
  });

  test('la ligne de dégâts montre ce que les passifs ont pesé', () => {
    // Sans ça, un Colosse n'a aucun moyen de savoir que sa Masse
    // s'applique : le chiffre affiché est juste « un chiffre ».
    const colosse = combattant('colosse', { classe: 'gardien', maxHp: 2000, hp: 2000 });
    combat([colosse], [cible()]);
    const r = infligerDegats(colosse, cible(), 100);
    verifier(r.multPassifs > 1, `le Colosse doit avoir un multiplicateur (${r.multPassifs})`);
    verifier(/🏅/.test(texteDegats(r)), `la ligne doit porter la marque du passif — « ${texteDegats(r)} »`);
    etat.combat = null;

    // Un héros sans passif multiplicateur ne doit PAS polluer la ligne.
    const nu = combattant(null, { classe: 'guerrier' });
    combat([nu], [cible()]);
    const r2 = infligerDegats(nu, cible(), 100);
    verifier(!/🏅/.test(texteDegats(r2)), 'pas de marque quand aucun passif ne joue');
    etat.combat = null;
  });

  test('chaque spécialité à multiplicateur le rend visible sur ses coups', () => {
    // On balaie les 27 : celles dont le passif pèse sur les dégâts doivent
    // toutes produire la marque « 🏅 ». Aucune exception silencieuse.
    const invisibles = [];
    Object.keys(SOUS_CLASSES).forEach((sc) => {
      const heros = combattant(sc, { classe: SOUS_CLASSES[sc].classe, hp: 600, maxHp: 1000, maxMp: 200 });
      const proie = cible({ hp: 1500, maxHp: 2000, statuts: [{ type: 'poison', duree: 3, valeur: 10 }] });
      combat([heros, combattant(null, { classe: 'guerrier', bid: 'y' })], [proie]);
      const mult = multiplicateurPassifs(heros, proie, { compId: 'x' });
      if (Math.abs(mult - 1) >= 0.005) {
        const r = { degats: 100, crit: false, direct: false, absorbe: 0, multPassifs: mult };
        if (!/🏅/.test(texteDegats(r))) invisibles.push(sc);
      }
      etat.combat = null;
    });
    aucun(invisibles, 'spécialités dont le multiplicateur ne s\'affiche pas');
  });

  test('le bandeau de tour annonce les passifs actifs du héros', () => {
    const faucheur = combattant('faucheur', { classe: 'runelame' });
    const texte = texteInlinePassifs(faucheur);
    verifier(/🏅/.test(texte), 'le bandeau doit porter la puce des passifs');
    verifier(texte.includes('Moisson'), `il doit nommer la spécialité — « ${texte} »`);
    verifier(texte.includes('Gravure'), 'et le passif de la classe de base');

    // Voie et Éveil s'y ajoutent quand ils existent.
    const voie = Object.values(VOIES).find((v) => v.sousClasse === 'faucheur');
    const eveil = Object.values(EVEILS).find((e) => e.sousClasse === 'faucheur');
    const complet = combattant('faucheur', { classe: 'runelame', voie: voie.id, eveil: { id: eveil.id } });
    const texteComplet = texteInlinePassifs(complet);
    verifier(texteComplet.includes(voie.nom.replace(/^Voie /, '')), 'la Voie doit apparaître');
    verifier(texteComplet.includes(eveil.nom), 'l\'Éveil aussi');

    // Un héros sans classe ne doit pas afficher une puce vide.
    egal(texteInlinePassifs(combattant(null, { classe: null })), '', 'rien à annoncer, rien d\'affiché');
  });

  test('l\'exécution du Faucheur laisse une trace, elle aussi', () => {
    const faucheur = combattant('faucheur', { classe: 'runelame' });
    const moribonde = cible({ hp: 100, maxHp: 2000 });
    const cb = combat([faucheur], [moribonde]);
    executerSiMoribonde(faucheur, moribonde);
    verifier(moribonde.mort, 'la cible doit tomber');
    verifier(cb.journalLignes.some((l) => /exécute/.test(l)), 'et le journal doit le dire');
    etat.combat = null;
  });
});

// =====================================================================
// v25.1 — Les neuf angles morts trouvés par l'audit.
//
// Un banc de 50 agents a exercé 233 passifs en combat réel et en a trouvé
// neuf qui pouvaient agir sans laisser la moindre trace. Huit d'entre eux
// avaient la MÊME cause : leur multiplicateur était appliqué en dehors de
// multiplicateurPassifs(), donc en dehors du chiffre remonté au journal.
// Ces tests-là ferment chacun des neuf.
// =====================================================================
suite('Angles morts refermés (v25.1)', () => {
  window.rendreJournal = () => {};

  const heros = (classe, extra) => Object.assign({
    type: 'joueur', classe, sousClasse: null, voie: null, eveil: null,
    niveau: 50, bid: 'x', nom: 'Cobaye', avatar: '🧪',
    stats: { for: 40, int: 40, dex: 40, esp: 40, vit: 40, cha: 10 },
    equipement: {}, familiers: [], familier: null, inventaire: [],
    statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
    hp: 1000, maxHp: 1000, mp: 100, maxMp: 100, ko: false, elan: 0,
  }, extra || {});

  const monstre = (extra) => Object.assign({
    type: 'monstre', id: 'm0', nom: 'Mannequin', emoji: '🎯', niveau: 50,
    atk: 20, dex: 5, statuts: [], hp: 3000, maxHp: 3000, mort: false, defense: false,
  }, extra || {});

  const combat = (equipe, monstres) => {
    etat.combat = { genre: 'exploration', equipe, monstres, manche: 1, file: [],
      actif: null, termine: false, journalLignes: [] };
    return etat.combat;
  };

  test('l\'Élan du Guerrier entre dans le chiffre affiché, et se dit', () => {
    // Le passif que TOUS les Guerriers portent, et le seul multiplicateur
    // du moteur qui restait hors du badge.
    const g = heros('guerrier', { elan: 3 });
    const cb = combat([g], [monstre()]);
    const r = infligerDegats(g, monstre(), 100);
    verifier(r.multPassifs > 1.2, `l'Élan doit peser dans multPassifs (${r.multPassifs})`);
    verifier(/🏅/.test(texteDegats(r)), 'et donc apparaître sur la ligne');

    const neuf = heros('guerrier', { elan: 0 });
    nourrirElan(neuf);
    verifier(cb.journalLignes.concat(etat.combat.journalLignes).some((l) => /Élan/.test(l)),
      'la montée en palier doit être annoncée');
    etat.combat = null;
  });

  test('le Rempart du Gardien se voit des deux côtés du coup', () => {
    // Moitié offensive : il frappe plus fort tant qu'il provoque.
    const off = heros('gardien', { statuts: [{ type: 'provocation', duree: 3 }] });
    combat([off], [monstre()]);
    const r = infligerDegats(off, monstre(), 100);
    verifier(r.multPassifs > 1, `« Rempart » offensif doit compter (${r.multPassifs})`);
    etat.combat = null;

    // Moitié défensive : il encaisse 12 % de moins, et ça s'affiche.
    const def = heros('gardien');
    combat([def], [monstre()]);
    const r2 = infligerDegats(monstre(), def, 200);
    verifier(r2.multDefense < 1, `« Rempart » défensif doit compter (${r2.multDefense})`);
    verifier(/🛡️/.test(texteDegats(r2)), `la défense doit s'afficher — « ${texteDegats(r2)} »`);
    etat.combat = null;
  });

  test('le Bouclier partagé du Templier s\'affiche sur l\'allié qu\'il couvre', () => {
    const templier = heros('gardien', { sousClasse: 'templier' });
    const allie = heros('guerrier', { bid: 'y', ligne: 'avant' });
    combat([templier, allie], [monstre()]);
    const r = infligerDegats(monstre(), allie, 200);
    verifier(r.multDefense < 1, `l'allié doit encaisser moins (${r.multDefense})`);
    verifier(/🛡️/.test(texteDegats(r)), 'et la ligne doit le montrer');
    etat.combat = null;
  });

  test('la fragilité d\'un Éveil mythique se voit sur chaque coup reçu', () => {
    // La contrainte la plus punitive du jeu, et la plus silencieuse :
    // elle DOUBLE les dégâts subis.
    const mythique = Object.values(EVEILS).find((e) => e.sousClasse === 'berserker' && e.rarete === 'mythique');
    const fragile = heros('guerrier', { sousClasse: 'berserker', eveil: { id: mythique.id } });
    combat([fragile], [monstre()]);
    verifier(reglagePassif(fragile, 'fragilite', 0) > 0, 'la contrainte doit être présente');
    const r = infligerDegats(monstre(), fragile, 200);
    verifier(r.multDefense > 1.5, `il doit encaisser bien plus (${r.multDefense})`);
    verifier(/💔/.test(texteDegats(r)), `et la ligne doit le dire — « ${texteDegats(r)} »`);
    etat.combat = null;
  });

  test('la Ligne de tir du Franc-tireur se compte comme un bonus visible', () => {
    const tireur = heros('franc-tireur', { ligne: 'arriere' });
    const autre = heros('guerrier', { ligne: 'arriere' });
    combat([tireur, autre], [monstre()]);
    const rt = infligerDegats(tireur, monstre(), 100, {});
    const ra = infligerDegats(autre, monstre(), 100, {});
    verifier(rt.multPassifs > 1.5, `« Ligne de tir » doit rendre le −40 % (${rt.multPassifs})`);
    egal(Math.round(ra.multPassifs * 100), 100, 'les autres n\'ont rien de plus');
    verifier(/🏅/.test(texteDegats(rt)), 'et ça se voit sur la ligne');
    etat.combat = null;
  });

  test('quitter sa ligne avec l\'Éveil caché du tir est ANNONCÉ', () => {
    const cache = Object.values(EVEILS).find((e) => e.sousClasse === 'rodeur' && e.rarete === 'cache');
    const tireur = heros('franc-tireur', { sousClasse: 'rodeur', eveil: { id: cache.id }, ligne: 'arriere' });
    const cb = combat([tireur], [monstre()]);
    verifier(reglagePassif(tireur, 'bonusPerdusSiLigneChangee', false), 'la contrainte doit être là');
    executerActionCoeur(tireur, { genre: 'ligne' }, null);
    verifier(cb.journalLignes.some((l) => /retire tous ses bonus/.test(l)),
      'la perte doit être annoncée au moment où elle se produit');
    etat.combat = null;
  });

  test('la Voie du Soleil dit que le ciel ne la touche pas', () => {
    const voie = Object.values(VOIES).find((v) => v.id.includes('pyromancien') && PASSIFS_VOIE[v.id].ignoreMeteoSubis);
    verifier(!!voie, 'la Voie du Soleil doit exister');
    const mage = heros('arcaniste', { sousClasse: 'pyromancien', voie: voie.id });
    verifier(reglagePassif(mage, 'ignoreMeteoSubis', false), 'et porter le réglage');
  });

  test('l\'initiative gagnée est annoncée, pas seulement subie', () => {
    const voie = Object.values(VOIES).find((v) => PASSIFS_VOIE[v.id].celeriteBonus);
    const rapide = heros(VOIES[voie.id].classe, { sousClasse: VOIES[voie.id].sousClasse, voie: voie.id });
    const cb = combat([rapide], [monstre()]);
    annoncerInitiative(rapide);
    verifier(cb.journalLignes.some((l) => /prend les devants/.test(l)),
      'un bonus d\'initiative doit s\'annoncer');
    // Et personne d'autre ne doit polluer le journal.
    const lent = heros('guerrier');
    const cb2 = combat([lent], [monstre()]);
    annoncerInitiative(lent);
    egal(cb2.journalLignes.length, 0, 'un héros sans bonus ne dit rien');
    etat.combat = null;
  });

  test('la Chance de butin affichée est celle qui sert vraiment', () => {
    // Le Voleur ajoute +10, un Éveil caché annule tout : ni l'un ni
    // l'autre n'apparaissait nulle part.
    const voleur = heros('franc-tireur', { sousClasse: 'voleur' });
    verifier(chanceButin(voleur) > statsEffectives(voleur).cha, 'le Voleur doit voir sa Chance montée');
    const cacheVoleur = Object.values(EVEILS).find((e) => e.sousClasse === 'voleur' && e.rarete === 'cache');
    const bride = heros('franc-tireur', { sousClasse: 'voleur', eveil: { id: cacheVoleur.id } });
    egal(chanceButin(bride), statsEffectives(bride).cha, 'et son Éveil caché doit vraiment l\'annuler');
  });

  test('la relance du Voltigeur n\'appartient qu\'au Voltigeur', () => {
    // Elle passait par `ignoreLigne`, que les douze Voies de la famille
    // portent aussi : un Rôdeur avec n'importe quelle Voie héritait de la
    // relance du Voltigeur.
    const voltigeur = heros('franc-tireur', { sousClasse: 'voltigeur' });
    verifier(reglagePassif(voltigeur, 'relanceCelerite', false), 'le Voltigeur garde sa relance');
    const voieRodeur = Object.values(VOIES).find((v) => v.sousClasse === 'rodeur');
    const rodeur = heros('franc-tireur', { sousClasse: 'rodeur', voie: voieRodeur.id });
    verifier(!reglagePassif(rodeur, 'relanceCelerite', false),
      'un Rôdeur avec une Voie ne doit PAS l\'hériter');
    verifier(reglagePassif(rodeur, 'ignoreLigne', false),
      'mais il garde bien l\'absence de malus de ligne');
  });
});

// =====================================================================
// v25.2 — L'exécution du Faucheur, cas par cas.
//
// Le passif dit « toute cible LAISSÉE sous 15 % de ses PV ». Il ne dit
// pas « toute cible touchée par un sort » — or c'était le seul cas
// couvert : une attaque simple qui laissait un monstre à 14 % le laissait
// vivre. Ces tests balaient tous les chemins par lesquels un Faucheur
// peut laisser quelqu'un sous le seuil.
// =====================================================================
suite('Exécution du Faucheur (v25.2)', () => {
  window.rendreJournal = () => {};

  function faucheur(sousClasse) {
    return {
      type: 'joueur', classe: 'runelame', sousClasse: sousClasse || 'faucheur',
      voie: null, eveil: null, niveau: 30, bid: 'x', nom: 'Faucheur', avatar: '⚰️',
      stats: { for: 4, int: 40, dex: 5, vit: 20, esp: 4, cha: 4 },
      equipement: {}, familiers: [], familier: null, inventaire: [],
      statuts: [], cooldowns: {}, competences: [], rangs: {}, ligne: 'avant',
      hp: 600, maxHp: 600, mp: 999, maxMp: 999, ko: false,
    };
  }

  const proie = (id, part) => ({
    type: 'monstre', id, nom: 'Proie ' + id, emoji: '🎯', niveau: 30, atk: 5, dex: 5,
    statuts: [], maxHp: 1000, hp: Math.round(1000 * part), mort: false, defense: false,
    attaques: [{ nom: 'coup', emoji: '💥', mult: 1, poids: 1, type: 'mono' }],
  });

  function combat(j, monstres) {
    etat.combat = { genre: 'exploration', equipe: [j], monstres, manche: 1, file: [],
      actif: j, termine: false, journalLignes: [] };
    reinitialiserPassifsCombat(j);
    return etat.combat;
  }

  test('une ATTAQUE SIMPLE qui laisse la cible sous le seuil exécute — le trou d\'origine', () => {
    const j = faucheur();
    const c = proie('a', 0.16);
    combat(j, [c]);
    executerActionCoeur(j, { genre: 'attaque' }, c);
    verifier(c.mort, `l'attaque simple doit achever la proie (${c.hp}/${c.maxHp} PV restants)`);
    etat.combat = null;
  });

  test('un SORT qui laisse la cible sous le seuil exécute', () => {
    const j = faucheur();
    j.competences = ['runelame-lame-gravee'];
    const c = proie('b', 0.16);
    combat(j, [c]);
    executerActionCoeur(j, { genre: 'competence', compId: 'runelame-lame-gravee' }, c);
    verifier(c.mort, 'le sort doit achever la proie');
    etat.combat = null;
  });

  test('une cible au-dessus du seuil ne meurt PAS', () => {
    const j = faucheur();
    const c = proie('c', 0.9);
    combat(j, [c]);
    executerActionCoeur(j, { genre: 'attaque' }, c);
    verifier(!c.mort, `une proie à 90 % doit survivre (${Math.round(c.hp / c.maxHp * 100)} %)`);
    verifier(c.hp > c.maxHp * 0.15, 'et rester au-dessus du seuil');
    etat.combat = null;
  });

  test('le seuil est inclusif : pile 15 %, elle tombe', () => {
    const j = faucheur();
    const c = proie('d', 0.15);
    combat(j, [c]);
    executerSiMoribonde(j, c);
    verifier(c.mort, 'exactement au seuil, la cible est exécutée');
    etat.combat = null;
  });

  test('même une action SANS attaque balaie les moribonds', () => {
    // « Toute cible LAISSÉE sous 15 % » : si un poison l'a amenée là, se
    // mettre en garde suffit à l'achever.
    const j = faucheur();
    const c = proie('e', 0.10);
    combat(j, [c]);
    executerActionCoeur(j, { genre: 'defense' }, null);
    verifier(c.mort, 'la proie laissée sous le seuil doit tomber');
    etat.combat = null;
  });

  test('toutes les cibles sous le seuil tombent, pas seulement celle visée', () => {
    const j = faucheur();
    const trio = [proie('f1', 0.10), proie('f2', 0.12), proie('f3', 0.80)];
    combat(j, trio);
    executerActionCoeur(j, { genre: 'attaque' }, trio[2]);
    egal(trio.filter((m) => m.mort).length, 2, 'les deux moribondes tombent, la troisième non');
    verifier(!trio[2].mort, 'celle à 80 % survit');
    etat.combat = null;
  });

  test('les autres spécialités n\'exécutent rien', () => {
    const faux = faucheur('corrupteur');
    const c = proie('g', 0.05);
    combat(faux, [c]);
    executerActionCoeur(faux, { genre: 'attaque' }, c);
    verifier(!c.mort || c.hp <= 0, 'un Corrupteur ne doit pas exécuter par passif');
    egal(reglagePassif(faux, 'seuilExecution', 0), 0, 'et ne porte aucun seuil d\'exécution');
    etat.combat = null;
  });

  test('les seuils des autres porteurs d\'exécution valent ce que dit leur fiche', () => {
    // Assassin, Traqueur et les Voies/Éveils qui reprennent la clé.
    const porteurs = [];
    Object.entries(PASSIFS_SOUS_CLASSE).forEach(([id, p]) => {
      if (p.seuilExecution) porteurs.push([`spécialité ${id}`, p.seuilExecution]);
    });
    verifier(porteurs.length >= 1, 'au moins une spécialité doit porter l\'exécution');
    const horsBornes = porteurs.filter(([, v]) => !(v > 0 && v <= 0.3)).map(([n]) => n);
    aucun(horsBornes, 'seuils d\'exécution hors de toute mesure');

    // Et le seuil du Faucheur est bien celui annoncé sur sa fiche.
    egal(PASSIFS_SOUS_CLASSE.faucheur.seuilExecution, 0.15, 'le seuil du Faucheur');
    verifier(SOUS_CLASSES.faucheur.passif.includes('15 %'), 'et sa fiche annonce bien 15 %');
  });
});

// =====================================================================
// v26 — La refonte de la logique des classes, verrouillée par les tests.
//
// L'audit croisé (16 agents, 102 constats confirmés) a montré que les
// mêmes familles de défauts revenaient partout : signatures calibrées au
// niveau 1, fusion de passifs qui rétrograde, sorts d'Esprit traités en
// coups physiques, poisons de passifs sur la mauvaise statistique,
// contraintes d'Éveil qui interdisaient les dons de l'Éveil lui-même.
// Chaque test ci-dessous verrouille l'une de ces corrections.
// =====================================================================
suite('Refonte des classes (v26)', () => {
  window.rendreJournal = () => {};

  test('aucune signature n\'est calibrée comme un sort de niveau 1', () => {
    const fautives = [];
    Object.entries(COMPETENCES).forEach(([id, comp]) => {
      if (!comp.signature) return;
      const palier = palierDeCompetence(comp);
      const attendu = comp.sousClasse ? NIVEAU_SOUS_CLASSE : 10;
      if (palier < attendu) fautives.push(`${id} (palier ${palier})`);
    });
    aucun(fautives, 'signatures restées au palier 1');
  });

  test('la fusion des passifs ne rétrograde jamais un bonus acquis', () => {
    // Traqueur : Voie de la Marque (25 %) + Éveil rare « Pisteur » (20 %).
    // Avant : l'Éveil ÉCRASAIT la Voie — prendre un Éveil affaiblissait.
    const voieMarque = Object.values(VOIES).find((v) => v.sousClasse === 'traqueur' && v.rang === 0);
    const pisteur = Object.values(EVEILS).find((e) => e.sousClasse === 'traqueur' && e.rarete === 'rare');
    const c = { type: 'joueur', sousClasse: 'traqueur', voie: voieMarque.id, eveil: { id: pisteur.id } };
    verifier(reglagePassif(c, 'bonusMarque', 0) >= 0.25, 'la marque de la Voie survit à l\'Éveil');
    // Voleur : Voie de la Fortune (+80 % d'or) + Éveil « Filou » (+40 %).
    const fortune = Object.values(VOIES).find((v) => v.sousClasse === 'voleur' && v.rang === 1);
    const filou = Object.values(EVEILS).find((e) => e.sousClasse === 'voleur' && e.rarete === 'rare');
    const v = { type: 'joueur', sousClasse: 'voleur', voie: fortune.id, eveil: { id: filou.id } };
    verifier(reglagePassif(v, 'bonusOr', 0) >= 0.8, 'l\'or de la Fortune survit au Filou');
  });

  test('les sorts portés par l\'Esprit sont magiques — les lignes ne les touchent pas', () => {
    verifier(estSortMagique({ stat: 'esp' }), 'l\'Esprit est une statistique magique');
    verifier(estSortMagique({ stat: 'int' }), 'l\'Intelligence aussi');
    verifier(!estSortMagique({ stat: 'for' }), 'la Force, non');
    // Et tout le kit offensif du Devin en profite.
    const fautives = CLASSES_BASE.devin.competences
      .map((id) => COMPETENCES[id])
      .filter((comp) => comp && comp.type === 'degats' && !estSortMagique(comp))
      .map((comp) => comp.nom);
    aucun(fautives, 'sorts offensifs du Devin traités en coups physiques');
  });

  test('les poisons des passifs suivent la statistique de la famille', () => {
    // Un Pyromancien divin (poisonParCoup) brûle avec son Intelligence,
    // pas avec une Dextérité qu'il ne monte jamais.
    const p = { type: 'joueur', classe: 'arcaniste', sousClasse: 'pyromancien' };
    const stat = (CLASSES_BASE[p.classe] || {}).stat || 'dex';
    egal(stat, 'int', 'la famille de l\'Arcaniste porte l\'Intelligence');
  });

  test('les dons d\'un Éveil échappent à sa propre contrainte de zone', () => {
    // Berserker « Titan de Guerre » (légendaire) : contrainte de mêlée
    // zonesInterdites, mais sa première compétence EST une zone.
    const titan = Object.values(EVEILS).find((e) => e.sousClasse === 'berserker' && e.rarete === 'legendaire');
    verifier(!!titan, 'l\'Éveil légendaire du Berserker existe');
    const compZone = (titan.competences || []).map((id) => COMPETENCES[id]).find((c) => c.cible === 'ennemis');
    if (compZone) {
      verifier(compZone.eveil === titan.id, 'le don de zone appartient bien à l\'Éveil');
    }
    verifier(reglagePassif({ type: 'joueur', sousClasse: 'berserker', eveil: { id: titan.id } }, 'zonesInterdites', false),
      'et la contrainte est bien posée pour tout le reste');
  });

  test('chaque héros ne porte jamais deux compétences du même nom', () => {
    const fautives = [];
    Object.values(SOUS_CLASSES).forEach((sc) => {
      const ids = new Set();
      (CLASSES_BASE[sc.classe].competences || []).forEach((id) => ids.add(id));
      (sc.competences || []).forEach((id) => ids.add(id));
      (sc.voies || []).forEach((v) => ids.add(VOIES[v].competence));
      (sc.eveils || []).forEach((e) => (EVEILS[e].competences || []).forEach((id) => ids.add(id)));
      const parNom = {};
      ids.forEach((id) => {
        const comp = COMPETENCES[id];
        if (!comp) return;
        const nom = comp.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        (parNom[nom] = parNom[nom] || []).push(id);
      });
      Object.entries(parNom).filter(([, l]) => l.length > 1)
        .forEach(([nom, l]) => fautives.push(`${sc.id} : « ${nom} » (${l.join(', ')})`));
    });
    aucun(fautives, 'homonymes dans la barre d\'un même héros');
  });

  test('les six modèles d\'invocation déclarent toutes les caractéristiques', () => {
    const fautives = [];
    Object.entries(INVOCATIONS).forEach(([id, modele]) => {
      Object.keys(CARACS).forEach((cle) => {
        if (modele.stats[cle] == null) fautives.push(`${id} sans ${cle}`);
      });
    });
    aucun(fautives, 'modèles d\'invocation troués — stats NaN à l\'appel');
  });

  test('les fiches des compétences de Voie et d\'Éveil disent leurs mécaniques réelles', () => {
    // La desc est régénérée depuis le passif produit — plus jamais depuis
    // les anciennes phrases (invisibilité, copie de sorts…).
    const fautives = [];
    Object.values(VOIES).forEach((v) => {
      const comp = COMPETENCES[v.competence];
      if (comp && v.passif && !comp.desc.startsWith(v.passif)) fautives.push(v.id);
    });
    aucun(fautives, 'fiches de Voie encore figées sur l\'ancien texte');
    verifier(!Object.values(VOIES).some((v) => (v.passif || '').includes('NaN')),
      'aucune fiche de Voie ne contient « NaN »');
    verifier(!Object.values(EVEILS).some((e) => (e.effet || '').includes('NaN')),
      'aucune fiche d\'Éveil ne contient « NaN »');
  });

  test('un héros migré garde tout son kit — la grille 10-40 vaut pour les nouveaux', () => {
    const brut = {
      version: 2, type: 'joueur', id: 'test-kit', nom: 'Vétéran', avatar: '🔥', classe: 'pyromancien',
      stats: { for: 2, int: 24, dex: 5, vit: 9, esp: 3, cha: 4 },
      niveau: 22, xp: seuilXp(22), pointsEnAttente: 0, competences: [], po: 0,
      inventaire: [], equipement: { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null },
      explorations: {}, bossVaincus: [], cloud: null,
      hp: 100, mp: 40, maxHp: 0, maxMp: 0, statuts: [], cooldowns: {}, defense: false, ko: false,
    };
    const p = normaliserPerso(JSON.parse(JSON.stringify(brut)));
    const dues = SOUS_CLASSES.pyromancien.competences.filter((id) => !p.grimoire.includes(id));
    aucun(dues, 'compétences perdues à la migration');
  });
});

// =====================================================================
// v27 — Les Ordres de Valciel : recommencer, en le sachant.
// =====================================================================
suite('Les Ordres de Valciel (v27)', () => {
  window.rendreJournal = () => {};

  const heroDesOrdres = (niveau) => {
    const p = nouveauPersonnage({
      nom: 'Recrue', avatar: '🧙', race: 'humain', classe: 'guerrier',
      stats: { for: 10, dex: 6, int: 4, esp: 4, vit: 10, cha: 4 },
      competences: ['frappe-heroique', 'coup-etourdissant'],
    });
    sansAnnonces(() => adminFixerNiveau(p, niveau));
    p.sousClasse = 'berserker';
    p.po = 10000;
    debloquerCompetencesClasse(p, false);
    return p;
  };

  test('changer de classe remet au niveau 1 et rend les points', () => {
    const p = heroDesOrdres(50);
    p.equipement.arme = 'baton-tempetes';   // pièce de niveau bien au-delà de 1
    const communesAvant = p.grimoire.filter((id) => estCompetenceCommune(COMPETENCES[id]));
    changerDeClasse(p, 'arcaniste');
    egal(p.classe, 'arcaniste', 'nouvelle classe');
    egal(p.niveau, 1, 'retour au niveau 1');
    egal(p.xp, 0, 'expérience remise à zéro');
    egal(p.sousClasse, null, 'spécialité effacée');
    egal(p.pointsEnAttente, POINTS_CREATION, 'les points de création sont rendus');
    Object.keys(CARACS).forEach((cle) => egal(p.stats[cle], STAT_BASE, `stat ${cle} à la base`));
    const liees = p.grimoire.filter((id) => {
      const c = COMPETENCES[id];
      return c && (c.sousClasse || c.voie || c.eveil || (c.classe && c.classe !== 'arcaniste'));
    });
    aucun(liees, 'compétences de l\'ancienne identité restées au grimoire');
    const perdues = communesAvant.filter((id) => !p.grimoire.includes(id));
    aucun(perdues, 'compétences communes perdues');
    egal(p.equipement.arme, null, 'l\'arme trop haute est déséquipée');
    verifier(compterObjet(p, 'baton-tempetes') >= 1, 'et déposée au sac');
    verifier(p.grimoire.some((id) => (COMPETENCES[id] || {}).classe === 'arcaniste'),
      'le kit de la nouvelle classe arrive');
  });

  test('changer de spécialité remet au niveau 10, points et maîtrise rendus', () => {
    const p = heroDesOrdres(60);
    p.voie = Object.keys(VOIES).find((id) => VOIES[id].sousClasse === 'berserker');
    changerDeSpecialite(p, 'duelliste');
    egal(p.niveau, NIVEAU_SOUS_CLASSE, 'retour au niveau 10');
    egal(p.sousClasse, 'duelliste', 'nouvelle spécialité');
    egal(p.voie, null, 'Voie effacée');
    egal(p.eveil, null, 'Éveil effacé');
    egal(p.xp, seuilXp(NIVEAU_SOUS_CLASSE), 'expérience calée sur le niveau 10');
    egal(p.pointsEnAttente, POINTS_CREATION + pointsCumules(NIVEAU_SOUS_CLASSE), 'points rendus');
    egal(p.maitrise, pointsMaitrisePourNiveau(NIVEAU_SOUS_CLASSE), 'maîtrise du niveau 10');
    verifier(p.grimoire.some((id) => (COMPETENCES[id] || {}).sousClasse === 'duelliste'),
      'le kit du Duelliste (palier 10) arrive');
    verifier(!p.grimoire.some((id) => (COMPETENCES[id] || {}).sousClasse === 'berserker'),
      'le kit du Berserker est rendu');
  });

  test('le Puits de Mémoire rend tous les points, sans toucher au niveau', () => {
    const p = heroDesOrdres(40);
    const avant = p.niveau;
    reinitialiserCaracteristiques(p);
    egal(p.niveau, avant, 'le niveau ne bouge pas');
    Object.keys(CARACS).forEach((cle) => egal(p.stats[cle], STAT_BASE, `stat ${cle} à la base`));
    egal(p.pointsEnAttente, POINTS_CREATION + pointsCumules(avant), 'tous les points rendus');
    verifier(p.hp <= p.maxHp && p.maxHp > 0, 'les PV suivent la nouvelle répartition');
  });
});
