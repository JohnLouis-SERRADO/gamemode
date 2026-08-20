'use strict';

// =====================================================================
// Moteur narratif : scènes, choix, votes, épreuves d20, Ascension éternelle
// =====================================================================

const DONJONS_PAR_ID = {};
DONJONS.forEach((d) => { DONJONS_PAR_ID[d.id] = d; });

// =====================================================================
// Progression sauvegardée sur le héros
// =====================================================================
function progresDonjon(p, idDonjon) {
  if (!p.donjons) p.donjons = {};
  // Une entrée corrompue (nombre, chaîne…) est refaite à neuf plutôt que
  // de faire trébucher la normalisation qui suit.
  if (!p.donjons[idDonjon] || typeof p.donjons[idDonjon] !== 'object') {
    p.donjons[idDonjon] = {
      checkpoint: null, drapeaux: {}, fini: 0, epilogue: null,
      finis: { normal: 0, heroique: 0, cauchemar: 0 }, difficulte: null,
    };
  }
  // v29 : les histoires se vivent en trois difficultés. `fini` reste le
  // compte TOTAL (hauts faits, verrous, contrats n'ont pas bougé) ;
  // `finis` compte par palier. Les sauvegardes d'avant la v29 créditent
  // leurs complétions passées au palier Normal — c'est là qu'elles ont
  // toutes été vécues.
  const prog = p.donjons[idDonjon];
  if (!prog.finis || typeof prog.finis !== 'object') {
    prog.finis = { normal: prog.fini || 0, heroique: 0, cauchemar: 0 };
  }
  ORDRE_DIFFICULTES.forEach((cle) => {
    if (typeof prog.finis[cle] !== 'number') prog.finis[cle] = 0;
  });
  if (prog.difficulte === undefined) prog.difficulte = null;
  return prog;
}

// =====================================================================
// v29 — LES TROIS DIFFICULTÉS DES HISTOIRES.
//
// La logique est celle du reste du jeu, appliquée aux récits : on ne
// choisit pas Cauchemar avant d'avoir prouvé Héroïque, et on ne choisit
// pas Héroïque avant d'avoir VÉCU l'histoire. Chaque palier double les
// monstres (PV et attaque) et double les récompenses de fin — c'est le
// barème unique DIFFICULTES, le même que les cartes du monde et la Tour
// des Boss. La relique unique, elle, reste unique : une histoire n'a
// qu'un seul trésor, quelle que soit la façon dont on la relit.
// =====================================================================
function difficulteHistoireDebloquee(prog, cle) {
  if (cle === 'normal') return true;
  if (cle === 'heroique') return (prog.finis.normal || 0) > 0;
  return (prog.finis.heroique || 0) > 0;
}

// Le plus haut palier déjà terminé — pour les insignes des cartes.
function meilleureDifficulteFinie(prog) {
  if ((prog.finis.cauchemar || 0) > 0) return 'cauchemar';
  if ((prog.finis.heroique || 0) > 0) return 'heroique';
  if ((prog.fini || 0) > 0) return 'normal';
  return null;
}

// La feuille de paie d'une fin d'histoire — pure, donc testable.
// Règles : la PREMIÈRE complétion d'un palier paie plein tarif × le
// multiplicateur du palier ; revivre un palier déjà vécu paie 35 % ;
// l'objet unique et le familier ne tombent qu'à la toute première fin.
function recompensesFinHistoire(donjon, prog, difficulte) {
  const cle = DIFFICULTES[difficulte] ? difficulte : 'normal';
  const d = DIFFICULTES[cle];
  const premiereAbsolue = (prog.fini || 0) === 0;
  const premiereDifficulte = ((prog.finis && prog.finis[cle]) || 0) === 0;
  const multReprise = premiereDifficulte ? 1 : 0.35;
  return {
    cle,
    premiereAbsolue,
    premiereDifficulte,
    xp: Math.round(donjon.recompenses.xp * multReprise * d.xp),
    po: Math.round(donjon.recompenses.po * multReprise * d.po),
  };
}

// =====================================================================
// Cartes des donjons sur la carte du monde
// =====================================================================
// =====================================================================
// v22 — LES VERROUS DES DONJONS D'HISTOIRE, REMANIÉS.
//
// CE QUI N'ALLAIT PAS. Deux familles d'histoires, deux régimes sans
// rapport : une Chronique demandait quatre conditions (niveau,
// caractéristique, objet-clé, boss de la carte), une Épopée n'en demandait
// qu'une — le niveau — et, pour les trois dernières, d'avoir fini la
// précédente. On pouvait donc entrer dans « La Couronne Céleste » nu,
// sans équipement, sans avoir vaincu quoi que ce soit, au seul motif
// d'avoir atteint le niveau 42.
//
// LA RÈGLE DE LA v22. Un seul jeu de verrous, lu par les deux familles,
// et qui regarde TOUT le héros : ses niveaux, ses caractéristiques
// effectives (donc son équipement), sa puissance, ce qu'il porte
// réellement, ce qu'il a dans son sac, les boss qu'il a couchés, les
// histoires qu'il a déjà vécues et, quand le récit s'y prête, son métier.
//
// Chaque condition manquante est écrite en clair, avec le chiffre atteint
// et le chiffre attendu : un donjon fermé doit toujours dire pourquoi, et
// quoi faire pour l'ouvrir.
// =====================================================================
// Le seuil de caractéristique d'une histoire : une part du palier, la
// même pour les Chroniques et les Épopées. Un seul chiffre à bouger si
// l'exigence se révèle mal calibrée.
function SEUIL_STAT_HISTOIRE(palier) {
  return STAT_BASE + Math.round(palier * 0.35);
}

// Les emplacements sont déjà décrits une fois pour toutes dans le
// catalogue : on les relit plutôt que d'en tenir une seconde liste.
function piecesEquipees(p) {
  return Object.keys(SLOTS_EQUIPEMENT).filter((slot) => (p.equipement || {})[slot]).length;
}

// Le seuil de puissance d'un donjon : une fraction de la puissance
// conseillée pour son palier. Passer par puissanceRecommandee garantit
// que le verrou suit automatiquement tout rééquilibrage du jeu.
function puissanceExigee(donjon) {
  const part = donjon.acces && donjon.acces.puissance;
  if (!part) return 0;
  return Math.round(puissanceRecommandee(donjon.defi || donjon.niveauMin) * part);
}

function verrousDonjon(p, donjon) {
  const verrous = [];
  const a = donjon.acces || {};
  if (p.niveau < donjon.niveauMin) verrous.push(`⬆️ niveau ${p.niveau}/${donjon.niveauMin}`);

  // Caractéristique du récit, lue sur les stats EFFECTIVES : l'équipement
  // compte, et c'est voulu.
  //
  // Une porte de caractéristique ne doit JAMAIS condamner un héros. Un
  // spécialiste extrême — tous ses points dans une seule statistique —
  // n'atteindrait certaines d'entre elles à aucun niveau, et resterait
  // enfermé dehors pour toujours. D'où la dispense : celui qui arrive à
  // la PLEINE puissance conseillée de son palier entre sans qu'on regarde
  // son profil. La porte reste donc un choix (« investis un peu ici, ou
  // équipe-toi mieux »), jamais une impasse.
  const s = statsEffectives(p);
  if (a.stat) {
    const min = SEUIL_STAT_HISTOIRE(donjon.niveauMin);
    // 0,9 et non 1 : la barre conseillée est une moyenne entre classes, et
    // un héros ENTIÈREMENT équipé en légendaire doit franchir la dispense
    // quelle que soit la sienne — mesuré au banc, la classe la moins bien
    // lotie passe à 0,92. Sinon la porte redeviendrait une impasse.
    const dispense = Math.round(puissanceRecommandee(donjon.niveauMin) * 0.9);
    if ((s[a.stat] || 0) < min && puissanceDe(p) < dispense) {
      verrous.push(`${CARACS[a.stat].emoji} ${CARACS[a.stat].nom} ${s[a.stat] || 0}/${min}`
        + ` (ou ⚡ ${formatNombre(dispense)} de puissance)`);
    }
  }

  // Puissance : le seul verrou qui juge le héros ENTIER — caractéristiques,
  // réserves, sous-caractéristiques et qualité de l'équipement à la fois.
  const requise = puissanceExigee(donjon);
  if (requise > 0 && puissanceDe(p) < requise) {
    verrous.push(`⚡ puissance ${formatNombre(puissanceDe(p))}/${formatNombre(requise)}`);
  }

  // Ce qu'il PORTE : on n'entre pas dans une histoire en sous-vêtements.
  if (a.equipement && piecesEquipees(p) < a.equipement) {
    verrous.push(`🛡️ ${piecesEquipees(p)}/${a.equipement} emplacements d'équipement garnis`);
  }

  // Ce qu'il a dans son sac : les clefs du récit.
  Object.entries(a.objets || {}).forEach(([id, qte]) => {
    const objet = OBJETS[id];
    if (!objet) return;
    const enPoche = compterObjet(p, id);
    if (enPoche < qte) verrous.push(`🗝️ ${objet.emoji} ${objet.nom} ${enPoche}/${qte}`);
  });

  // Les boss de carte déjà couchés.
  (a.bossZones || []).forEach((idZone) => {
    if (p.bossVaincus.includes(idZone)) return;
    const z = ZONES.find((x) => x.id === idZone);
    if (z) verrous.push(`👑 vaincre ${MONSTRES[z.boss].nom} (${z.nom})`);
  });

  // Les histoires déjà vécues — `requiert` reste accepté, il dit la même
  // chose pour un seul donjon.
  const histoires = [...(a.donjons || [])];
  if (donjon.requiert) histoires.push(donjon.requiert);
  histoires.forEach((id) => {
    if (progresDonjon(p, id).fini > 0) return;
    const autre = DONJONS_PAR_ID[id];
    if (autre) verrous.push(`📖 terminer « ${autre.nom} »`);
  });

  // Et le métier, quand le récit tient à la main plutôt qu'à la lame.
  if (a.metier) {
    const niveau = (p.metiers && p.metiers[a.metier.id] && p.metiers[a.metier.id].niveau) || 1;
    if (niveau < a.metier.niveau) {
      verrous.push(`${METIERS[a.metier.id].emoji} ${METIERS[a.metier.id].nom} niveau ${niveau}/${a.metier.niveau}`);
    }
  }
  return verrous;
}

// Compat : l'ancien nom reste, il pointe sur le nouveau jeu de verrous.
function verrousChronique(p, donjon) {
  return verrousDonjon(p, donjon);
}

// v16 : la liste des donjons qu'un héros a DÉBLOQUÉS — calculée sur son
// propre appareil (verrous complets), puis embarquée dans l'instantané
// de groupe.
function donjonDebloquePour(p, donjon) {
  return verrousDonjon(p, donjon).length === 0;
}

function donjonsDebloquesPour(p) {
  return DONJONS.filter((d) => donjonDebloquePour(p, d)).map((d) => d.id);
}

// Le boss FINAL d'un donjon : la dernière étape de type « boss » du récit.
function bossDeDonjon(donjon) {
  let boss = null;
  Object.values(donjon.etapes).forEach((etape) => { if (etape.type === 'boss') boss = etape; });
  return boss;
}

function rendreCartesDonjons(conteneur, p) {
  const sections = [
    {
      court: '📜 Chroniques des terres',
      titre: '📜 <strong>Chroniques des terres</strong> — la petite histoire de chaque carte. Accès exigeant : niveau, caractéristique, puissance, équipement porté, objet-clé… et le boss de la carte vaincu.',
      liste: DONJONS.filter((d) => d.chronique),
    },
    {
      court: '📖 Épopées de Valciel',
      titre: '📖 <strong>Épopées de Valciel</strong> — les grandes histoires. Elles se méritent, elles aussi : niveau, caractéristiques, puissance, équipement, trophées et matériaux de la région. Une épopée terminée ouvre son <strong>Ascension éternelle</strong> : on y grimpe jusqu’à la mort ou l’abandon.',
      liste: DONJONS.filter((d) => !d.chronique),
    },
  ];

  // v19 : chaque registre se replie. Les donjons d’histoire s’ajoutaient
  // à la suite des cartes du monde, dans le même défilement sans fin —
  // on ne les ouvre plus que quand on les cherche.
  sections.forEach((section) => {
    const bloc = document.createElement('section');
    bloc.className = 'acte-monde';

    const entete = document.createElement('button');
    entete.type = 'button';
    entete.className = 'acte-entete';
    entete.setAttribute('aria-expanded', 'false');
    const ouverts = section.liste.filter((dj) => donjonDebloquePour(p, dj)).length;
    entete.innerHTML = `
      <span class="acte-titre">${section.court}</span>
      <span class="acte-plage">${ouverts}/${section.liste.length} accessible${ouverts > 1 ? 's' : ''}</span>
      <span class="acte-chevron">▸</span>`;

    const contenu = document.createElement('div');
    contenu.className = 'acte-cartes cache';
    const intro = document.createElement('div');
    intro.className = 'separateur-donjons';
    intro.innerHTML = section.titre;
    contenu.appendChild(intro);

    entete.addEventListener('click', () => {
      const replie = contenu.classList.toggle('cache');
      entete.setAttribute('aria-expanded', String(!replie));
      entete.querySelector('.acte-chevron').textContent = replie ? '▸' : '▾';
    });
    bloc.appendChild(entete);
    bloc.appendChild(contenu);
    conteneur.appendChild(bloc);

    section.liste.forEach((donjon) => {
      const prog = progresDonjon(p, donjon.id);
      const verrousAcces = verrousDonjon(p, donjon);
      const verrouille = verrousAcces.length > 0;
      const enCours = !!prog.checkpoint;
      const carte = document.createElement('div');
      carte.className = 'carte-zone donjon-histoire' + (verrouille ? ' verrouillee' : '');
      // v29 : l'insigne dit le plus haut palier déjà vaincu.
      const sommet = meilleureDifficulteFinie(prog);
      let statut = '';
      if (sommet === 'cauchemar') statut = ' ✅💀';
      else if (sommet === 'heroique') statut = ' ✅🔥';
      else if (sommet === 'normal') statut = ' ✅';
      else if (enCours) statut = ' 📖';
      let action = 'Commencer l’histoire';
      if (verrousAcces.length) action = `🔒 Il manque : ${verrousAcces.join(' · ')}.`;
      else if (enCours) {
        const dRep = DIFFICULTES[prog.difficulte] || DIFFICULTES.normal;
        action = `▶ Reprendre l’aventure en cours (${dRep.emoji} ${dRep.nom})`;
      } else if (prog.fini > 0) {
        action = donjon.chronique
          ? 'Revivre l’histoire — trois difficultés au choix'
          : '⛰️ Revivre l’histoire (trois difficultés) ou tenter l’Ascension éternelle';
      }
      let etiquette;
      if (donjon.chronique) etiquette = `📜 chronique · niv. ${donjon.niveauMin}+`;
      else if (donjon.defi) etiquette = `☠️ défi niv. ${donjon.defi} · héros niv. ${donjon.niveauMin}+`;
      else etiquette = `📖 épopée · niv. ${donjon.niveauMin}+`;
      const record = !donjon.chronique ? recordAscension(p, donjon.id) : 0;
      carte.innerHTML = `
        <div class="zone-emoji">${donjon.emoji}${verrouille ? '<span class="cadenas-zone">🔒</span>' : ''}</div>
        <div class="zone-nom">${donjon.nom}${statut}</div>
        <div class="zone-plage">${etiquette}${record > 0 ? ` · ⛰️ record : étage ${record}` : ''} · ${texteRecommandation(p, donjon.defi || donjon.niveauMin)}</div>
        <div class="zone-desc">${verrouille ? action : `${donjon.resume}<br><em>${action}</em>`}</div>`;
      if (!verrouille) rendreCliquable(carte, () => ouvrirDonjon(donjon));
      contenu.appendChild(carte);
    });
  });
}

// =====================================================================
// Moteur : ouverture, étapes, rendu narratif
// =====================================================================
function ouvrirDonjon(donjon) {
  const p = persoActif();
  // Les verrous se revérifient à l'entrée — Chroniques comme Épopées.
  const verrous = verrousDonjon(p, donjon);
  if (verrous.length) {
    afficherToast(`🔒 Il manque : ${verrous.join(' · ')}.`);
    return;
  }
  const prog = progresDonjon(p, donjon.id);
  const reprise = prog.checkpoint && donjon.etapes[prog.checkpoint];
  // Un chapitre en cours se reprend à SA difficulté — on ne change pas
  // les règles au milieu d'un livre. Mais on peut refermer celui-ci et
  // le rouvrir à un autre palier : sans cette porte, un héros coincé en
  // Cauchemar au milieu d'une histoire y resterait pour toujours.
  if (reprise) {
    const dRep = DIFFICULTES[prog.difficulte] || DIFFICULTES.normal;
    afficherButin({
      titre: `${donjon.emoji} ${donjon.nom}`,
      texte: `Un chapitre est en cours en ${dRep.emoji} ${dRep.nom}. Reprenez-le où vous l'aviez laissé — ou recommencez du début pour changer de difficulté.`,
      lignes: [],
      retour: 'carte',
      boutons: [
        {
          texte: `▶ Reprendre l’aventure (${dRep.emoji} ${dRep.nom})`,
          classe: 'btn-principal',
          action: () => demarrerHistoireDonjon(donjon),
        },
        {
          texte: '🔄 Recommencer du début — l’avancée du chapitre est perdue',
          action: () => {
            prog.checkpoint = null;
            prog.difficulte = null;
            prog.drapeaux = {};
            sauvegarder(p);
            ouvrirChoixDifficulteDonjon(donjon);
          },
        },
        { texte: '🗺️ Revenir à la carte', action: () => naviguer('carte') },
      ],
    });
    return;
  }
  ouvrirChoixDifficulteDonjon(donjon);
}

// v29 : le seuil du donjon est un choix de difficulté. Normal s'ouvre
// toujours ; Héroïque exige d'avoir terminé l'histoire en Normal ;
// Cauchemar exige Héroïque. Pour une épopée déjà vécue, l'Ascension
// éternelle se propose au même endroit.
function ouvrirChoixDifficulteDonjon(donjon) {
  const p = persoActif();
  const prog = progresDonjon(p, donjon.id);
  const lignes = [];
  const boutons = [];
  // Le palier conseillé : le plus doux qui reste à vivre. Quand tout est
  // vécu, le bouton doré revient à l'Ascension (épopées) ou au Cauchemar
  // (chroniques) — un écran sans porte principale désoriente.
  const conseille = ORDRE_DIFFICULTES.find(
    (cle) => difficulteHistoireDebloquee(prog, cle) && !(prog.finis[cle] > 0),
  ) || null;
  const ascensionEnAvant = !donjon.chronique && prog.fini > 0 && !conseille;
  const misEnAvant = conseille || (ascensionEnAvant ? null : 'cauchemar');
  // v29 : la difficulté se lit en puissance de combat — chaque palier
  // affiche la sienne, et le héros voit la sienne en face.
  const niveauReference = donjon.defi || donjon.niveauMin;
  lignes.push(`⚡ Votre puissance de combat : ${formatNombre(puissanceDe(p))}.`);
  ORDRE_DIFFICULTES.forEach((cle) => {
    const d = DIFFICULTES[cle];
    const faits = prog.finis[cle] || 0;
    if (difficulteHistoireDebloquee(prog, cle)) {
      boutons.push({
        texte: `${d.emoji} ${d.nom} — monstres ×${d.hp} · ${texteRecommandationDifficulte(p, niveauReference, cle)}`
          + (faits > 0 ? ` · ✅ ×${faits}` : ''),
        classe: cle === misEnAvant ? 'btn-principal' : undefined,
        action: () => demarrerHistoireDonjon(donjon, cle),
      });
    } else {
      const requise = DIFFICULTES[cle === 'heroique' ? 'normal' : 'heroique'];
      lignes.push(`🔒 ${d.emoji} ${d.nom} (monstres ×${d.hp}, récompenses ×${d.xp}, ⚡ ${formatNombre(puissanceConseilleePour(niveauReference, cle))} conseillé) — terminez d’abord l’histoire en ${requise.emoji} ${requise.nom}.`);
    }
  });
  if (prog.fini > 0) {
    lignes.push('📖 Revivre un palier déjà vécu rapporte 35 % de ses récompenses de fin — la relique de l’histoire, elle, ne tombe qu’une fois.');
  }
  // Épopée déjà terminée : l'Ascension éternelle se propose ici aussi —
  // et se présente : un primo-grimpeur part à l'étage 1 sans autre écran.
  if (!donjon.chronique && prog.fini > 0) {
    const record = recordAscension(p, donjon.id);
    lignes.push('⛰️ L’Ascension éternelle : des étages sans fin, de plus en plus durs, SANS soin entre les salles — jusqu’à la mort ou l’abandon.');
    lignes.push(record > 0 ? `⛰️ Votre record d’Ascension ici : étage ${record}.` : '⛰️ Aucune Ascension tentée ici pour l’instant.');
    const palier = palierAtteint(p, `ascension:${donjon.id}`);
    lignes.push(palier > 0
      ? `⛑️ Point de sauvegarde gravé : étage ${palier} — l’ascension peut y reprendre.`
      : `⛑️ Un point de sauvegarde se grave tous les ${PALIER_SAUVEGARDE_TOUR} étages.`);
    boutons.push({
      texte: '⛰️ Entamer l’Ascension éternelle',
      classe: ascensionEnAvant ? 'btn-principal' : undefined,
      action: () => ouvrirAscension(donjon),
    });
  }
  // Le seuil doit toujours laisser repartir — même motif que la Tour des Boss.
  boutons.push({ texte: '🗺️ Revenir à la carte', action: () => naviguer('carte') });
  afficherButin({
    titre: `${donjon.emoji} ${donjon.nom}`,
    texte: prog.fini > 0
      ? 'L’histoire est écrite — mais elle peut se revivre plus féroce. Chaque palier de difficulté DOUBLE les monstres… et les récompenses (le plafond d’XP anti-rush s’élève avec le palier).'
      : 'Choisissez la difficulté. Chaque palier double les monstres — et les récompenses (le plafond d’XP anti-rush s’élève avec le palier). Les paliers supérieurs s’ouvrent en terminant le précédent.',
    lignes,
    retour: 'carte',
    boutons,
  });
}

function demarrerHistoireDonjon(donjon, difficulte) {
  const p = persoActif();
  const prog = progresDonjon(p, donjon.id);
  const reprise = prog.checkpoint && donjon.etapes[prog.checkpoint];
  // À la reprise, l'histoire continue à la difficulté où elle a commencé ;
  // sinon, celle qu'on vient de choisir (Normal à défaut).
  const cle = DIFFICULTES[reprise ? prog.difficulte : difficulte] ? (reprise ? prog.difficulte : difficulte) : 'normal';
  const d = DIFFICULTES[cle];
  etat.donjon = { donjon, difficulte: cle, drapeaux: reprise ? { ...prog.drapeaux } : {} };
  if (!reprise) {
    prog.drapeaux = {};
    prog.difficulte = cle;
    if (prog.fini > 0) afficherToast(`📖 Vous rouvrez le livre en ${d.emoji} ${d.nom} : l’histoire recommence.`);
    else if (cle !== 'normal') afficherToast(`${d.emoji} L’histoire s’ouvre en ${d.nom} — monstres ×${d.hp}, récompenses ×${d.xp}.`);
  } else {
    afficherToast(`📖 Vous reprenez l’aventure où vous l’aviez laissée${cle !== 'normal' ? ` (${d.emoji} ${d.nom})` : ''}.`);
  }
  demarrerEtapeDonjon(reprise ? prog.checkpoint : donjon.depart);
}

// Sauvegarde immédiate de la progression (checkpoint + drapeaux) : appelée
// à chaque étape, mais aussi dès qu'un choix ou un trésor est consommé,
// pour qu'un aller-retour ne permette jamais de les rejouer.
function sauvegarderProgresDonjon(checkpoint) {
  const contexte = etat.donjon;
  const p = persoActif();
  const prog = progresDonjon(p, contexte.donjon.id);
  prog.checkpoint = checkpoint;
  prog.difficulte = contexte.difficulte || 'normal'; // la reprise gardera le même palier
  prog.drapeaux = { ...contexte.drapeaux };
  sauvegarder(p);
}

function demarrerEtapeDonjon(idEtape) {
  const contexte = etat.donjon;
  if (!contexte) return;
  // Un double-clic sur « Poursuivre » ne doit pas rejouer l'étape (et ses gains).
  if (contexte.etapeId === idEtape) return;
  const { donjon } = contexte;
  const etape = donjon.etapes[idEtape];
  if (!etape) { etat.donjon = null; naviguer('carte'); return; }
  contexte.etapeId = idEtape;

  // Checkpoint : on peut quitter et reprendre ici.
  sauvegarderProgresDonjon(idEtape);

  if (etape.type === 'combat' || etape.type === 'boss') {
    lancerCombatDonjon(etape);
    return;
  }

  rendreEnteteDonjon();
  const scene = el('donjon-scene');
  scene.innerHTML = '';
  if (etape.type === 'dialogue') rendreDialogueDonjon(etape, 0);
  else if (etape.type === 'choix') rendreChoixDonjon(etape);
  else if (etape.type === 'epreuve') rendreEpreuveDonjon(etape);
  else if (etape.type === 'tresor') rendreTresorDonjon(etape);
  else if (etape.type === 'fin') terminerDonjon(etape);
  montrerEcran('ecran-donjon');
}

function rendreEnteteDonjon() {
  const { donjon } = etat.donjon;
  const d = DIFFICULTES[etat.donjon.difficulte] || DIFFICULTES.normal;
  const entete = el('donjon-entete');
  entete.innerHTML = `
    <div class="entete-lieu">
      <h2>${donjon.emoji} ${donjon.nom} <span class="badge">${d.emoji} ${d.nom}</span></h2>
      <button class="btn-choix btn-compact" id="donjon-quitter">🚪 Reprendre plus tard</button>
    </div>`;
  el('donjon-quitter').addEventListener('click', () => {
    afficherToast('📖 Progression sauvegardée : reprenez quand vous voulez depuis la carte.');
    etat.donjon = null;
    naviguer('carte');
  });
}

function carteScene(qui, emoji, texte) {
  const carte = document.createElement('div');
  carte.className = 'scene-donjon';
  carte.innerHTML = `
    <span class="scene-portrait">${emoji || '📜'}</span>
    <div class="scene-corps">
      <div class="scene-nom">${echapper(qui || 'Narrateur')}</div>
      <div class="scene-texte">${echapper(texte)}</div>
    </div>`;
  return carte;
}

function rendreDialogueDonjon(etape, index) {
  const scene = el('donjon-scene');
  // Les scènes déjà lues restent visibles au-dessus.
  scene.querySelectorAll('.scene-boutons').forEach((x) => x.remove());
  scene.appendChild(carteScene(etape.scenes[index].qui, etape.scenes[index].emoji, etape.scenes[index].texte));

  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  const derniere = index >= etape.scenes.length - 1;
  continuer.textContent = derniere ? 'Poursuivre ➜' : 'Continuer…';
  continuer.addEventListener('click', () => {
    if (derniere) demarrerEtapeDonjon(etape.suite);
    else rendreDialogueDonjon(etape, index + 1);
  });
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
  continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function conditionRemplie(condition, p) {
  if (!condition) return { ok: true };
  if (condition.stat) {
    // En équipe, c'est le membre le plus doué qui « fait l'action »
    // (l'esprit Donjons & Dragons : chacun son moment de gloire).
    const membres = membresEquipe();
    let valeur = 0;
    let champion = p;
    membres.forEach((m) => {
      const v = statsEffectives(m)[condition.stat] || 0;
      if (v >= valeur) { valeur = v; champion = m; }
    });
    const nomStat = CARACS[condition.stat] ? CARACS[condition.stat].nom : condition.stat;
    return valeur >= condition.min
      ? { ok: true, champion: membres.length > 1 ? champion : null }
      : { ok: false, raison: `${nomStat} ${valeur}/${condition.min}` };
  }
  if (condition.drapeau) {
    return etat.donjon.drapeaux[condition.drapeau] ? { ok: true } : { ok: false, raison: 'chemin non découvert' };
  }
  if (condition.sansDrapeau) {
    return !etat.donjon.drapeaux[condition.sansDrapeau] ? { ok: true } : { ok: false, raison: 'trop tard' };
  }
  return { ok: true };
}

// Applique un effet déclaratif et renvoie des lignes descriptives.
function appliquerEffetDonjon(effet) {
  const lignes = [];
  if (!effet) return lignes;
  const membres = membresEquipe();
  if (effet.drapeau) etat.donjon.drapeaux[effet.drapeau] = true;
  if (effet.pvPct) {
    membres.forEach((m) => {
      const delta = Math.round(m.maxHp * effet.pvPct);
      m.hp = Math.max(1, Math.min(m.maxHp, m.hp + delta)); // une péripétie ne tue jamais
    });
    lignes.push(effet.pvPct > 0
      ? `❤️ +${Math.round(effet.pvPct * 100)} % de PV pour l'équipe`
      : `💔 ${Math.round(effet.pvPct * 100)} % de PV pour l'équipe`);
  }
  if (effet.mpPct) {
    membres.forEach((m) => {
      m.mp = Math.max(0, Math.min(m.maxMp, m.mp + Math.round(m.maxMp * effet.mpPct)));
    });
    lignes.push(effet.mpPct > 0
      ? `💧 +${Math.round(effet.mpPct * 100)} % de PM pour l'équipe`
      : `🌀 ${Math.round(effet.mpPct * 100)} % de PM pour l'équipe`);
  }
  if (effet.po) {
    membres.forEach((m) => { m.po += effet.po; m.compteurs.orTotal += effet.po; });
    lignes.push(`💰 +${effet.po} po pour chaque héros`);
  }
  if (effet.xp) {
    // v29 : les gains du récit suivent le palier joué, plafond compris.
    const multPlafond = multPlafondXp(etat.donjon && etat.donjon.difficulte);
    membres.forEach((m) => gagnerXp(m, effet.xp, multPlafond));
    lignes.push(`⭐ ${texteGainXp(membres, effet.xp, multPlafond)} pour chaque héros`);
  }
  if (effet.objets) {
    Object.entries(effet.objets).forEach(([id, qte]) => {
      membres.forEach((m) => ajouterObjet(m, id, qte));
      const objet = OBJETS[id];
      if (objet) lignes.push(`${objet.emoji} ${objet.nom}${texteRarete(objet)} ×${qte}`);
    });
  }
  membres.forEach((m) => { verifierHautsFaits(m); sauvegarder(m); });
  rendreTopbar();
  return lignes;
}

// =====================================================================
// Épreuves façon Donjons & Dragons : un jet de d20 + la meilleure stat
// de l'équipe contre une difficulté. Réussite et échec ont chacun
// leurs conséquences — et l'histoire continue dans les deux cas.
// =====================================================================
function rendreEpreuveDonjon(etape) {
  const scene = el('donjon-scene');
  scene.appendChild(carteScene(etape.qui || 'Épreuve', etape.emoji || '🎲', etape.texte));

  const membres = membresEquipe();
  let champion = membres[0];
  membres.forEach((m) => {
    if ((statsEffectives(m)[etape.stat] || 0) > (statsEffectives(champion)[etape.stat] || 0)) champion = m;
  });
  const bonus = statsEffectives(champion)[etape.stat] || 0;
  const nomStat = CARACS[etape.stat].nom;
  const epreuveDe = /^[aeioué]/i.test(nomStat) ? `d’${nomStat}` : `de ${nomStat}`;

  const bloc = document.createElement('div');
  bloc.className = 'panneau bloc-epreuve';
  bloc.innerHTML = `<p>🎲 <strong>Épreuve ${epreuveDe}</strong> — difficulté ${etape.difficulte}.
    ${membres.length > 1 ? `C'est <strong>${echapper(champion.nom)}</strong> (le plus doué, ${nomStat} ${bonus}) qui s'y colle.` : `Votre ${nomStat} : ${bonus}.`}</p>`;
  const lancer = document.createElement('button');
  lancer.className = 'btn-principal';
  lancer.textContent = '🎲 Lancer le d20 !';
  lancer.addEventListener('click', () => {
    lancer.disabled = true;
    const de = alea(1, 20);
    const total = de + bonus;
    const critique = de === 20;
    const echecCritique = de === 1;
    const reussite = critique || (!echecCritique && total >= etape.difficulte);
    const resultat = document.createElement('p');
    resultat.className = 'resultat-de';
    resultat.innerHTML = `🎲 <strong>${de}</strong> + ${bonus} (${nomStat}) = <strong>${total}</strong> contre ${etape.difficulte}
      — ${critique ? '🌟 20 NATUREL !' : echecCritique ? '💀 1 naturel…' : reussite ? '✅ Réussite !' : '❌ Échec…'}`;
    bloc.appendChild(resultat);
    const issue = reussite ? etape.reussite : etape.echec;
    const lignes = appliquerEffetDonjon(issue.effet);
    // L'épreuve est consommée : pas de relance en boucle.
    sauvegarderProgresDonjon(issue.suite);
    setTimeout(() => rendreResultatDonjon(issue.texte, lignes, issue.suite), 900);
  });
  bloc.appendChild(lancer);
  scene.appendChild(bloc);
  bloc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function rendreChoixDonjon(etape, sansCarte) {
  const scene = el('donjon-scene');
  if (!sansCarte) scene.appendChild(carteScene(etape.qui, etape.emoji, etape.texte));
  const p = persoActif();
  const membres = membresEquipe();

  // En équipe locale, les décisions se prennent AU VOTE : chaque héros
  // choisit à son tour (on se passe l'écran), la majorité l'emporte,
  // et le chef d'expédition tranche les égalités.
  const contexte = etat.donjon;
  const enVote = membres.length > 1;
  if (enVote && !contexte.vote) contexte.vote = { votes: [], tour: 0 };

  const boutons = document.createElement('div');
  boutons.className = 'choix-donjon';
  if (enVote) {
    const votant = membres[contexte.vote.tour];
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-vote';
    bandeau.innerHTML = `🗳️ <strong>Vote d'équipe</strong> (${contexte.vote.tour + 1}/${membres.length}) —
      au tour de <strong>${echapper(votant.nom)}</strong> ${echapper(votant.avatar)} de choisir. Passez-lui l'écran !`;
    boutons.appendChild(bandeau);
  }
  etape.options.forEach((option, indexOption) => {
    const verif = conditionRemplie(option.condition, p);
    const btn = document.createElement('button');
    btn.className = 'btn-action choix-option';
    btn.disabled = !verif.ok;
    const voix = enVote ? contexte.vote.votes.filter((v) => v === indexOption).length : 0;
    const detail = verif.ok
      ? `${option.detail || ''}${verif.champion ? ` — c'est ${echapper(verif.champion.nom)} qui agira` : ''}`
      : `🔒 ${option.detail || ''} — ${verif.raison}`;
    btn.innerHTML = `<strong>${option.texte}</strong>${voix ? ` <span class="badge">${voix} voix</span>` : ''}${detail ? `<span class="action-detail">${detail}</span>` : ''}`;
    btn.addEventListener('click', () => {
      if (!enVote) { choisirOptionDonjon(etape, option); return; }
      // Enregistre la voix du votant courant, puis passe au suivant.
      contexte.vote.votes.push(indexOption);
      contexte.vote.tour++;
      if (contexte.vote.tour < membres.length) {
        scene.querySelectorAll('.choix-donjon').forEach((x) => x.remove());
        rendreChoixDonjon(etape, true); // la carte de scène reste, seul le vote se rafraîchit
        return;
      }
      // Dépouillement : majorité, le chef (1er membre) tranche les égalités.
      const compte = {};
      contexte.vote.votes.forEach((v) => { compte[v] = (compte[v] || 0) + 1; });
      const maxVoix = Math.max(...Object.values(compte));
      const exaequo = Object.keys(compte).filter((k) => compte[k] === maxVoix).map(Number);
      // Le chef départage — mais UNIQUEMENT entre les ex-aequo : si son
      // propre vote a perdu, il choisit parmi les options arrivées en tête
      // (le premier de ses votes qui en fait partie, sinon la première).
      const gagnante = exaequo.length > 1
        ? (contexte.vote.votes.find((v) => exaequo.includes(v)) ?? exaequo[0])
        : exaequo[0];
      const elue = etape.options[gagnante];
      afficherToast(`🗳️ L'équipe a tranché : « ${elue.texte} » (${maxVoix} voix${exaequo.length > 1 ? ' — le chef départage' : ''}).`);
      contexte.vote = null;
      choisirOptionDonjon(etape, elue);
    });
    boutons.appendChild(btn);
  });
  scene.appendChild(boutons);
  boutons.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function choisirOptionDonjon(etape, option) {
  const contexte = etat.donjon;
  // Un seul choix par étape : bloque le double-clic sur deux options.
  if (contexte.choixFait === contexte.etapeId) return;
  contexte.choixFait = contexte.etapeId;

  // Issue aléatoire (fiole mystère…) : tirage pondéré parmi les résultats.
  if (option.resultats) {
    const tirage = tirageAuPoids(option.resultats);
    const lignes = appliquerEffetDonjon(tirage.effet);
    // Le choix est consommé : reprendre plus tard mènera directement à la suite.
    sauvegarderProgresDonjon(tirage.suite);
    rendreResultatDonjon(tirage.texte, lignes, tirage.suite);
    return;
  }
  const lignes = appliquerEffetDonjon(option.effet);
  sauvegarderProgresDonjon(option.suite);
  if (option.resultat) {
    rendreResultatDonjon(option.resultat, lignes, option.suite);
  } else {
    demarrerEtapeDonjon(option.suite);
  }
}

function rendreResultatDonjon(texte, lignes, suite) {
  const scene = el('donjon-scene');
  scene.querySelectorAll('.choix-donjon, .scene-boutons').forEach((x) => x.remove());
  const carte = carteScene('Narrateur', '📜', texte);
  scene.appendChild(carte);
  if (lignes && lignes.length) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau gains-donjon';
    lignes.forEach((ligne) => {
      const div = document.createElement('div');
      div.className = 'ligne-butin';
      div.textContent = ligne;
      bloc.appendChild(div);
    });
    scene.appendChild(bloc);
  }
  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  continuer.textContent = 'Poursuivre ➜';
  continuer.addEventListener('click', () => demarrerEtapeDonjon(suite));
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
  continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function rendreTresorDonjon(etape) {
  const scene = el('donjon-scene');
  scene.appendChild(carteScene(etape.titre, '🎁', etape.texte));
  const lignes = appliquerEffetDonjon(etape.effet);
  // Le trésor est encaissé : reprendre plus tard mènera directement à la suite.
  sauvegarderProgresDonjon(etape.suite);
  if (lignes.length) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau gains-donjon';
    lignes.forEach((ligne) => {
      const div = document.createElement('div');
      div.className = 'ligne-butin';
      div.textContent = ligne;
      bloc.appendChild(div);
    });
    scene.appendChild(bloc);
  }
  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const continuer = document.createElement('button');
  continuer.className = 'btn-principal';
  continuer.textContent = 'Poursuivre ➜';
  continuer.addEventListener('click', () => demarrerEtapeDonjon(etape.suite));
  boutons.appendChild(continuer);
  scene.appendChild(boutons);
}

// =====================================================================
// Combats de donjon
// =====================================================================
function defMonstreDonjon(cle) {
  return MONSTRES_DONJONS[cle] || MONSTRES[cle];
}

function lancerCombatDonjon(etape) {
  const contexte = etat.donjon;
  const { donjon } = contexte;
  const membres = membresEquipe();
  // Les combats scénarisés sont taillés pour un héros : on renforce
  // les monstres si l'équipe locale est plus nombreuse.
  const multEquipe = 1 + 0.35 * (membres.length - 1);
  const multAtkEquipe = 1 + 0.1 * (membres.length - 1);
  // v29 : la difficulté choisie à l'entrée s'applique à CHAQUE salle —
  // le même barème que partout ailleurs (Héroïque ×2, Cauchemar ×4).
  const multDiff = DIFFICULTES[contexte.difficulte] || DIFFICULTES.normal;

  const cles = etape.type === 'boss' ? [etape.monstre] : etape.monstres;
  const annonces = [];
  const defs = cles.map((cle) => {
    const base = defMonstreDonjon(cle);
    let hp = base.hp * multEquipe * multDiff.hp;
    let atk = base.atk * multAtkEquipe * multDiff.atk;
    if (etape.type === 'boss') {
      (etape.modificateurs || []).forEach((mod) => {
        if (!contexte.drapeaux[mod.drapeau]) return;
        if (mod.hpMult) hp *= mod.hpMult;
        if (mod.atkMult) atk *= mod.atkMult;
        annonces.push(mod.annonce);
      });
    }
    return { ...base, cle, hp: Math.round(hp), atk: Math.round(atk) };
  });

  demarrerCombat({
    genre: 'donjon',
    zone: null,
    // Le butin de chaque salle suit la difficulté (tirerButinCombat lit
    // cb.difficulte : XP, or et chances de drop multipliés d'office).
    difficulte: contexte.difficulte || 'normal',
    titre: `${donjon.emoji} ${donjon.nom}`,
    intro: etape.intro,
    monstresDef: defs,
    equipe: membres,
    donjon: { id: donjon.id, suite: etape.suite },
  });
  annonces.forEach((a) => journal(a));
  rendreCombat();
}

function apresVictoireDonjon(cb) {
  if (cb.ascension) { apresVictoireAscension(cb); return; }
  const contexte = etat.donjon;
  const membres = cb.equipe;
  const partage = membres.length;
  const butin = tirerButinCombat(cb);
  const xpParHeros = Math.max(1, Math.round(butin.xp / partage));
  const poParHeros = Math.max(0, Math.round(butin.po / partage));
  const multPlafond = multPlafondXp(cb.difficulte); // v29 : le plafond suit le palier
  const lignes = [`⭐ ${texteGainXp(membres, xpParHeros, multPlafond)} et 💰 ${texteGainPo(membres, poParHeros)} par héros`];
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    const niveaux = gagnerXp(m, xpParHeros, multPlafond);
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin gratuit : l'histoire ménage ses repos
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });

  if (!contexte) { afficherButin({ titre: '🏆 Victoire !', lignes, retour: 'carte' }); return; }
  afficherButin({
    titre: '🏆 Salle nettoyée !',
    texte: 'L’histoire continue…',
    lignes,
    retour: 'carte',
    boutons: [{
      texte: '📖 Poursuivre l’histoire ➜',
      classe: 'btn-principal',
      action: () => demarrerEtapeDonjon(cb.donjon.suite),
    }],
  });
}

function apresDefaiteDonjon(cb) {
  if (cb.ascension) { apresDefaiteAscension(cb); return; }
  cb.equipe.forEach((m) => nettoyerApresCombat(m));
  const nomDonjon = etat.donjon ? etat.donjon.donjon.nom : 'du donjon';
  etat.donjon = null;
  // v14 : tomber dans une histoire, c'est mourir dedans.
  traiterMortEquipe(cb, [
    `📖 « ${nomDonjon} » garde votre progression : l'histoire vous attend au dernier chapitre atteint.`,
  ]);
}

// =====================================================================
// v13 — L'ASCENSION ÉTERNELLE : une épopée terminée ne meurt jamais.
// Le donjon vit « comme un bâtiment » : on y grimpe étage après étage,
// de plus en plus dur, sans soin entre les salles — jusqu'à la mort ou
// l'abandon. Tous les 3 étages : une épreuve au d20. Tous les 5 : l'écho
// du boss, plus dense à chaque cycle. Le record est gardé par épopée.
// =====================================================================
function recordAscension(p, idDonjon) {
  if (!p.ascensions || typeof p.ascensions !== 'object') p.ascensions = {};
  return p.ascensions[idDonjon] || 0;
}

function monstresDeLEpopee(donjon) {
  const cles = new Set();
  Object.values(donjon.etapes).forEach((e) => {
    if (e.type === 'combat') e.monstres.forEach((cle) => cles.add(cle));
  });
  return [...cles];
}

function bossDeLEpopee(donjon) {
  return Object.values(donjon.etapes).find((e) => e.type === 'boss').monstre;
}

function ouvrirAscension(donjon) {
  // v22 : l'Ascension a ses points de sauvegarde, comme les deux Tours —
  // un tous les dix étages, gravé par épopée.
  demanderDepartAscension({
    titre: `⛰️ ${donjon.nom} — Ascension éternelle`,
    texte: 'Aucun soin entre les étages — sauf aux points de sauvegarde. D’où l’équipe part-elle ?',
    cle: `ascension:${donjon.id}`,
    lancer: (etage) => {
      etat.ascension = { donjon, etage };
      afficherToast(etage > 1
        ? `⛰️ L'Ascension de « ${donjon.nom} » reprend à l'étage ${etage}.`
        : `⛰️ L'Ascension de « ${donjon.nom} » commence. Pas de soin entre les étages — grimpez tant que vous tenez debout.`);
      demarrerEtageAscension();
    },
  });
}

function demarrerEtageAscension() {
  const a = etat.ascension;
  if (!a) return;
  const { donjon, etage } = a;

  // Tous les 3 étages (hors paliers de boss) : le donjon éprouve l'équipe.
  if (etage % 5 !== 0 && etage % 3 === 0) {
    rendreEpreuveAscension();
    return;
  }

  const membres = membresEquipe();
  const multEquipe = 1 + 0.35 * (membres.length - 1);
  const multAtkEquipe = 1 + 0.1 * (membres.length - 1);
  const croissanceHp = 1 + 0.15 * (etage - 1);
  const croissanceAtk = 1 + 0.06 * (etage - 1);

  let defs;
  let intro;
  if (etage % 5 === 0) {
    const cleBoss = bossDeLEpopee(donjon);
    const base = defMonstreDonjon(cleBoss);
    defs = [{
      ...base,
      cle: cleBoss,
      nom: `Écho de ${base.nom}`,
      hp: Math.round(base.hp * croissanceHp * multEquipe),
      atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      xp: Math.round(base.xp * (0.5 + etage * 0.05)),
    }];
    intro = `⛰️ Étage ${etage} — le donjon reforme l'écho de son maître, plus dense à chaque cycle.`;
  } else {
    const pool = monstresDeLEpopee(donjon);
    const nb = Math.min(4, 2 + Math.floor(etage / 6));
    defs = Array.from({ length: nb }, () => {
      const cle = pool[alea(0, pool.length - 1)];
      const base = defMonstreDonjon(cle);
      return {
        ...base,
        cle,
        hp: Math.round(base.hp * croissanceHp * multEquipe),
        atk: Math.round(base.atk * croissanceAtk * multAtkEquipe),
      };
    });
    intro = `⛰️ Étage ${etage} — le donjon rebat ses cartes et vous oppose une salle nouvelle.`;
  }

  demarrerCombat({
    genre: 'donjon',
    ascension: true,
    zone: null,
    titre: `⛰️ ${donjon.nom} — Ascension, étage ${etage}`,
    intro,
    monstresDef: defs,
    equipe: membres,
    donjon: null,
  });
  rendreCombat();
}

// Étage-épreuve : un jet de d20 dont la difficulté grimpe avec l'étage.
function rendreEpreuveAscension() {
  const a = etat.ascension;
  const { donjon, etage } = a;
  rendreEnteteAscension();
  const scene = el('donjon-scene');
  scene.innerHTML = '';

  const stats = ['for', 'int', 'dex', 'vit', 'cha'];
  const stat = stats[Math.floor(etage / 3) % stats.length];
  const difficulte = 12 + Math.round(donjon.niveauMin * 0.6) + etage;

  const membres = membresEquipe();
  let champion = membres[0];
  membres.forEach((m) => {
    if ((statsEffectives(m)[stat] || 0) > (statsEffectives(champion)[stat] || 0)) champion = m;
  });
  const bonus = statsEffectives(champion)[stat] || 0;
  const nomStat = CARACS[stat].nom;
  const epreuveDe = /^[aeioué]/i.test(nomStat) ? `d’${nomStat}` : `de ${nomStat}`;

  scene.appendChild(carteScene('L’Ascension', '⛰️', `Étage ${etage} — le donjon ne vous envoie personne : il vous éprouve lui-même. Les murs se resserrent, l'air change, et quelque chose attend de voir de quoi vous êtes faits.`));

  const bloc = document.createElement('div');
  bloc.className = 'panneau bloc-epreuve';
  bloc.innerHTML = `<p>🎲 <strong>Épreuve ${epreuveDe}</strong> — difficulté ${difficulte}.
    ${membres.length > 1 ? `C'est <strong>${echapper(champion.nom)}</strong> (le plus doué, ${nomStat} ${bonus}) qui s'y colle.` : `Votre ${nomStat} : ${bonus}.`}</p>`;
  const lancer = document.createElement('button');
  lancer.className = 'btn-principal';
  lancer.textContent = '🎲 Lancer le d20 !';
  lancer.addEventListener('click', () => {
    lancer.disabled = true;
    const de = alea(1, 20);
    const total = de + bonus;
    const critique = de === 20;
    const echecCritique = de === 1;
    const reussite = critique || (!echecCritique && total >= difficulte);
    const resultat = document.createElement('p');
    resultat.className = 'resultat-de';
    resultat.innerHTML = `🎲 <strong>${de}</strong> + ${bonus} (${nomStat}) = <strong>${total}</strong> contre ${difficulte}
      — ${critique ? '🌟 20 NATUREL !' : echecCritique ? '💀 1 naturel…' : reussite ? '✅ Réussite !' : '❌ Échec…'}`;
    bloc.appendChild(resultat);
    const lignes = appliquerEffetDonjon(reussite
      ? { pvPct: 0.12, mpPct: 0.15, po: 15 * etage }
      : { pvPct: -0.15 });
    const texteIssue = reussite
      ? 'Le donjon incline ses murs, presque respectueux : une alcôve s\'ouvre, avec de quoi souffler et de quoi remplir les bourses.'
      : 'Le donjon vous secoue comme un sablier — vous atteignez le palier suivant meurtris, et il compte bien continuer.';
    setTimeout(() => {
      scene.appendChild(carteScene('L’Ascension', '⛰️', texteIssue));
      if (lignes.length) {
        const gains = document.createElement('div');
        gains.className = 'panneau gains-donjon';
        lignes.forEach((l) => {
          const div = document.createElement('div');
          div.className = 'ligne-butin';
          div.textContent = l;
          gains.appendChild(div);
        });
        scene.appendChild(gains);
      }
      const boutons = document.createElement('div');
      boutons.className = 'rangee-boutons scene-boutons';
      const continuer = document.createElement('button');
      continuer.className = 'btn-principal';
      continuer.textContent = `⬆️ Étage ${etage + 1} ➜`;
      continuer.addEventListener('click', () => {
        // Survivre à l'épreuve du donjon compte comme un étage conquis.
        membresEquipe().forEach((m) => {
          if (!m.ascensions || typeof m.ascensions !== 'object') m.ascensions = {};
          if (etage > (m.ascensions[donjon.id] || 0)) m.ascensions[donjon.id] = etage;
          // Un étage-épreuve compte comme un étage : le palier aussi.
          franchirPalierDeSauvegarde(m, `ascension:${donjon.id}`, etage);
          verifierHautsFaits(m);
          sauvegarder(m);
        });
        a.etage++;
        demarrerEtageAscension();
      });
      boutons.appendChild(continuer);
      scene.appendChild(boutons);
      continuer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 900);
  });
  bloc.appendChild(lancer);
  scene.appendChild(bloc);
  montrerEcran('ecran-donjon');
}

function rendreEnteteAscension() {
  const { donjon, etage } = etat.ascension;
  const entete = el('donjon-entete');
  entete.innerHTML = `
    <div class="entete-lieu">
      <h2>⛰️ ${donjon.nom} — Ascension, étage ${etage}</h2>
      <button class="btn-choix btn-compact" id="ascension-quitter">🚪 Abandonner l'ascension</button>
    </div>`;
  el('ascension-quitter').addEventListener('click', () => terminerAscension('abandon'));
}

function terminerAscension(mode) {
  const a = etat.ascension;
  etat.ascension = null;
  if (a) {
    const record = recordAscension(persoActif(), a.donjon.id);
    afficherToast(mode === 'abandon'
      ? `⛰️ Vous redescendez de « ${a.donjon.nom} ». Record conservé : étage ${record}.`
      : `⛰️ Fin de l'ascension. Record : étage ${record}.`);
  }
  naviguer('carte');
}

function apresVictoireAscension(cb) {
  const a = etat.ascension;
  const membres = cb.equipe;
  const partage = membres.length;
  const butin = tirerButinCombat(cb);
  const bonusPo = a.etage * 12;
  const xpParHeros = Math.max(1, Math.round(butin.xp / partage));
  const poParHeros = Math.max(0, Math.round((butin.po + bonusPo) / partage));
  const lignes = [`⭐ ${texteGainXp(membres, xpParHeros)} et 💰 ${texteGainPo(membres, poParHeros)} par héros (prime d'étage comprise)`];
  Object.entries(butin.objets).forEach(([id, qte]) => {
    lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}${texteRarete(OBJETS[id])} ×${qte}`);
  });

  let nouveauRecord = false;
  membres.forEach((m) => {
    if (m.hp <= 0) m.hp = 1;
    const poGagne = Math.round(poParHeros * multiplicateurOr(m));
    m.po += poGagne;
    m.compteurs.orTotal += poGagne;
    m.compteurs.monstres += cb.monstres.length;
    progresserQuete(m, 'monstres', cb.monstres.length);
    Object.entries(butin.objets).forEach(([id, qte]) => ajouterObjet(m, id, qte));
    const niveaux = gagnerXp(m, xpParHeros);
    if (!m.ascensions || typeof m.ascensions !== 'object') m.ascensions = {};
    if (a.etage > (m.ascensions[a.donjon.id] || 0)) {
      m.ascensions[a.donjon.id] = a.etage;
      nouveauRecord = true;
    }
    verifierHautsFaits(m);
    nettoyerApresCombat(m); // pas de soin entre les étages : c'est la règle…
    const repos = franchirPalierDeSauvegarde(m, `ascension:${a.donjon.id}`, a.etage);
    if (repos) lignes.push(repos);                 // …sauf tous les dix étages
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} ! PV et PM restaurés.`);
    sauvegarder(m);
  });
  if (nouveauRecord) lignes.push(`⛰️ Nouveau record : étage ${a.etage} !`);

  afficherButin({
    titre: `⛰️ Étage ${a.etage} conquis !${estPalierDeSauvegarde(a.etage) ? ' ⛑️ Point de sauvegarde' : ''}`,
    texte: estPalierDeSauvegarde(a.etage)
      ? 'Un palier de repos : le donjon vous laisse souffler, et grave votre passage. La prochaine ascension pourra repartir d\'ici.'
      : 'Le donjon encaisse le coup — et reconstruit déjà l\'étage suivant, un peu plus haut, un peu plus dur.',
    lignes,
    retour: 'carte',
    boutons: [
      {
        texte: `⬆️ Étage ${a.etage + 1} ➜`,
        classe: 'btn-principal',
        action: () => {
          a.etage++;
          demarrerEtageAscension();
        },
      },
      {
        texte: '🚪 Redescendre (garder le record)',
        action: () => terminerAscension('retraite'),
      },
    ],
  });
}

function apresDefaiteAscension(cb) {
  const a = etat.ascension;
  etat.ascension = null;
  cb.equipe.forEach((m) => nettoyerApresCombat(m));
  const record = recordAscension(persoActif(), a.donjon.id);
  // v14 : l'Ascension tient sa promesse — on y grimpe jusqu'à la MORT.
  traiterMortEquipe(cb, [
    `⛰️ L'étage ${a.etage} de « ${a.donjon.nom} » a eu raison de votre expédition. Record conservé : étage ${record}.`,
  ]);
}

// =====================================================================
// Fin d'un donjon : épilogue et récompenses
// =====================================================================
function terminerDonjon(etape) {
  const contexte = etat.donjon;
  const { donjon, drapeaux } = contexte;
  const p = persoActif();
  const membres = membresEquipe();
  const prog = progresDonjon(p, donjon.id);

  // Épilogue selon les choix faits pendant l'aventure.
  const variante = (etape.variantes || []).find((v) => drapeaux[v.drapeau]);
  const texteFin = variante ? variante.texte : etape.texte;

  // v29 : la paie se calcule AVANT d'incrémenter les compteurs — la
  // première complétion d'un palier paie plein tarif × son multiplicateur.
  const paie = recompensesFinHistoire(donjon, prog, contexte.difficulte);
  const diff = DIFFICULTES[paie.cle];
  prog.fini = (prog.fini || 0) + 1;
  prog.finis[paie.cle] = (prog.finis[paie.cle] || 0) + 1;
  prog.epilogue = variante ? variante.cle : 'defaut';
  prog.checkpoint = null;
  prog.difficulte = null;
  prog.drapeaux = {};
  const premiere = paie.premiereAbsolue;

  const lignes = [];
  const xpParHeros = paie.xp;
  const poParHeros = paie.po;
  const multPlafond = multPlafondXp(paie.cle); // v29 : le plafond suit le palier
  lignes.push(`⭐ ${texteGainXp(membres, xpParHeros, multPlafond)} et 💰 +${formatNombre(poParHeros)} po par héros`
    + (paie.cle !== 'normal' ? ` — ${diff.emoji} récompenses ×${diff.xp}` : '')
    + (paie.premiereDifficulte ? '' : ' (palier déjà vécu : 35 %)'));

  // L'objet unique de l'histoire (variante selon la fin) et le familier ne
  // tombent qu'à la TOUTE première fin : une histoire n'a qu'un trésor.
  if (premiere) {
    let idObjet = donjon.recompenses.objet;
    Object.entries(donjon.recompenses.objetParDrapeau || {}).forEach(([drapeau, id]) => {
      if (drapeaux[drapeau]) idObjet = id;
    });
    if (idObjet) {
      ajouterObjet(p, idObjet, 1);
      const objet = OBJETS[idObjet];
      lignes.push(`✨ ${objet.emoji} ${objet.nom}${texteRarete(objet)} — récompense unique de l'histoire !`);
    }
    if (donjon.familier && !p.familiers.includes(donjon.familier)) {
      p.familiers.push(donjon.familier);
      const compagnon = FAMILIERS[donjon.familier];
      lignes.push(`🐾 ${compagnon.emoji} ${compagnon.nom} vous adopte à la fin de l'histoire !`);
    }
  }
  // Le paquet d'appoint (consommables, matériaux), lui, revient à la
  // première complétion de CHAQUE palier : un vrai motif de relecture.
  if (paie.premiereDifficulte) {
    Object.entries(donjon.recompenses.objets || {}).forEach(([id, qte]) => {
      ajouterObjet(p, id, qte);
      lignes.push(`${OBJETS[id].emoji} ${OBJETS[id].nom} ×${qte}`);
    });
  }
  // Le palier suivant vient de s'ouvrir ? Qu'on le sache tout de suite.
  if (paie.premiereDifficulte && paie.cle !== 'cauchemar') {
    const suivante = DIFFICULTES[paie.cle === 'normal' ? 'heroique' : 'cauchemar'];
    lignes.push(`${suivante.emoji} Difficulté ${suivante.nom} débloquée pour cette histoire — monstres ×${suivante.hp}, récompenses ×${suivante.xp} !`);
  }

  membres.forEach((m) => {
    m.po += poParHeros;
    m.compteurs.orTotal += poParHeros;
    progresserQuete(m, 'donjon', 1);
    const niveaux = gagnerXp(m, xpParHeros, multPlafond);
    if (niveaux > 0) lignes.push(`🎉 ${m.avatar} ${m.nom} passe niveau ${m.niveau} !`);
    verifierHautsFaits(m);
    sauvegarder(m);
  });
  rendreTopbar();

  // Rendu de l'épilogue
  const scene = el('donjon-scene');
  scene.innerHTML = '';
  const epilogue = document.createElement('div');
  epilogue.className = 'scene-donjon epilogue';
  epilogue.innerHTML = `
    <span class="scene-portrait">${donjon.emoji}</span>
    <div class="scene-corps">
      <div class="scene-nom">Épilogue${paie.cle !== 'normal' ? ` — ${diff.emoji} ${diff.nom}` : ''}${premiere ? '' : ' (histoire revécue)'}</div>
      <div class="scene-texte">${echapper(texteFin)}</div>
    </div>`;
  scene.appendChild(epilogue);

  const bloc = document.createElement('div');
  bloc.className = 'panneau gains-donjon';
  bloc.innerHTML = '<h3>🎁 Récompenses de l’histoire</h3>';
  lignes.forEach((ligne) => {
    const div = document.createElement('div');
    div.className = 'ligne-butin';
    div.textContent = ligne;
    bloc.appendChild(div);
  });
  scene.appendChild(bloc);

  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons scene-boutons';
  const retour = document.createElement('button');
  retour.className = 'btn-principal';
  retour.textContent = '🗺️ Refermer le livre — retour à la carte';
  retour.addEventListener('click', () => {
    etat.donjon = null;
    naviguer('carte');
  });
  boutons.appendChild(retour);
  scene.appendChild(boutons);
}

// =====================================================================
// v20 — Dernier maillon du chargement des données : tout le catalogue
// existe enfin (objets écrits à la main, séries d'artisan, butin généré,
// étal du marchand, reliques de Chronique, butin des boss nommés). C'est
// le seul moment où l'on peut tenir les pièces uniques sur la même
// échelle que le reste — voir plafonnerEquipementUnique() dans
// js/data/objets-generes.js.
// =====================================================================
plafonnerEquipementUnique();

// Et la même chose pour le bestiaire : les points de vie et l'attaque de
// chaque bête sont ramenés sur la courbe dérivée du héros — voir
// calibrerBestiaire() dans js/data/monstres.js.
calibrerBestiaire();

// Et les compétences : leur puissance est ramenée sur le budget de leur
// rôle et de leur palier — voir calibrerCompetences() dans
// js/data/competences.js.
calibrerCompetences();
