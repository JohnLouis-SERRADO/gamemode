'use strict';

// =====================================================================
// État global, profils persistants, navigation, création de personnage,
// fiche du héros (stats, compétences, équipement, inventaire).
// =====================================================================

const CLE_STOCKAGE_PROFILS = 'gamemode2.profils';
const CLE_STOCKAGE_ACTIF = 'gamemode2.actif';

const etat = {
  profils: [],
  actifId: null,
  equipe: [],        // ids des membres de l'expédition (l'actif en fait toujours partie)
  zoneCourante: null,
  combat: null,
  enLigne: false,
  brouillon: null,
  difficulte: 'normal',
  evenementMonde: null,
  groupeLigne: null, // expédition multi-écrans en cours
};

// ----- Utilitaires -----
const el = (id) => document.getElementById(id);

function alea(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function varie(valeur) {
  return valeur * (0.85 + Math.random() * 0.3); // ±15 %
}

function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function echapper(texte) {
  const div = document.createElement('div');
  div.textContent = String(texte == null ? '' : texte);
  return div.innerHTML;
}

function uid() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function persoActif() {
  return etat.profils.find((p) => p.id === etat.actifId) || null;
}

function membresEquipe() {
  const membres = etat.equipe.map((id) => etat.profils.find((p) => p.id === id)).filter(Boolean);
  return membres.length ? membres : (persoActif() ? [persoActif()] : []);
}

function combatEnCours() {
  return etat.combat && !etat.combat.termine;
}

function afficherToast(texte) {
  let zone = el('zone-toasts');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'zone-toasts';
    document.body.appendChild(zone);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = texte;
  zone.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// =====================================================================
// v17 : POPUPS DE DÉBLOCAGE — dès qu'un joueur débloque quelque chose
// (zone, tour, compétence de classe, haut fait, familier, difficulté…),
// une fenêtre de célébration s'affiche. Les annonces se suivent une par
// une, jamais empilées.
// =====================================================================
const fileDeblocages = [];
let deblocageAffiche = false;
// v18 : la console d'admin fait bondir de 20 niveaux d'un clic — inutile
// de dérouler vingt fenêtres de célébration derrière.
let deblocagesSilencieux = false;

let renduDeblocagePlanifie = false;

function annoncerDeblocage(info) {
  if (deblocagesSilencieux) return;
  fileDeblocages.push(info);
  // Une montée de niveau annonce souvent plusieurs déblocages d'affilée :
  // on laisse tout le lot arriver avant d'ouvrir la première fenêtre, pour
  // que le compteur « encore N » soit juste dès le premier écran.
  if (!deblocageAffiche && !renduDeblocagePlanifie) {
    renduDeblocagePlanifie = true;
    setTimeout(() => {
      renduDeblocagePlanifie = false;
      afficherProchainDeblocage();
    }, 0);
  }
}

// Exécute une action sans aucune annonce de déblocage.
function sansAnnonces(action) {
  deblocagesSilencieux = true;
  try {
    action();
  } finally {
    deblocagesSilencieux = false;
  }
}

function afficherProchainDeblocage() {
  if (deblocageAffiche || fileDeblocages.length === 0) return;
  const info = fileDeblocages.shift();
  deblocageAffiche = true;
  const voile = document.createElement('div');
  voile.className = 'voile-deblocage';
  const modale = document.createElement('div');
  modale.className = 'modale-deblocage';
  modale.innerHTML = `
    <div class="deblocage-eclat">${info.emoji || '🎉'}</div>
    <div class="deblocage-bandeau">✨ DÉBLOQUÉ ✨</div>
    <h2>${info.titre}</h2>
    ${info.texte ? `<p class="deblocage-texte">${info.texte}</p>` : ''}
    ${fileDeblocages.length > 0 ? `<p class="deblocage-reste">+ ${fileDeblocages.length} autre${fileDeblocages.length > 1 ? 's' : ''} déblocage${fileDeblocages.length > 1 ? 's' : ''} à découvrir</p>` : ''}`;
  const fermer = () => {
    voile.remove();
    deblocageAffiche = false;
    afficherProchainDeblocage();
  };
  const btn = document.createElement('button');
  btn.className = 'btn-principal btn-deblocage';
  btn.textContent = info.bouton || (fileDeblocages.length > 0 ? '✨ Suivant' : '✨ Génial !');
  btn.addEventListener('click', fermer);
  modale.appendChild(btn);
  // Une grosse montée de niveau peut en empiler plusieurs : on doit
  // pouvoir tout balayer d'un geste.
  if (fileDeblocages.length > 0) {
    const tout = document.createElement('button');
    tout.className = 'btn-choix btn-compact btn-deblocage-tout';
    tout.textContent = `⏩ Tout fermer (${fileDeblocages.length + 1})`;
    tout.addEventListener('click', () => {
      fileDeblocages.length = 0;
      fermer();
    });
    modale.appendChild(tout);
  }
  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// Tout ce qu'une montée de niveau peut débloquer, annoncé en popup.
function annoncerDeblocagesNiveau(p, avant, apres) {
  if (p.distant) return;
  ZONES.forEach((z) => {
    if (z.niveauMin > avant && z.niveauMin <= apres) {
      annoncerDeblocage({ emoji: z.emoji, titre: `Nouvelle terre : ${z.nom}`, texte: `${z.plage} — ${z.desc}` });
    }
    const seuilCauchemar = z.niveauMin + 6;
    if (seuilCauchemar > avant && seuilCauchemar <= apres && p.bossVaincus.includes(z.id)) {
      annoncerDeblocage({ emoji: '💀', titre: `Cauchemar débloqué : ${z.nom}`, texte: 'Monstres déchaînés, récompenses ×2,5 — pour les héros qui n’ont peur de rien.' });
    }
  });
  if (avant < 3 && apres >= 3) {
    annoncerDeblocage({ emoji: '🗼', titre: 'Tour Sans Fin débloquée !', texte: 'Des étages infinis, aucun repos, un butin qui grimpe. Jusqu’où monterez-vous ?' });
  }
  if (avant < NIVEAU_SPECIALITE && apres >= NIVEAU_SPECIALITE) {
    annoncerDeblocage({ emoji: '⭐', titre: 'Sous-classe de récolteur !', texte: 'Mineur, tanneur ou tisseur : votre spécialité vous attend.' });
  }
  if (avant < 10 && apres >= 10) {
    annoncerDeblocage({ emoji: '🏯', titre: 'Tour des Boss débloquée !', texte: 'Un boss par étage, trois difficultés, un record à battre dans chacune.' });
  }
  if (typeof DONJONS !== 'undefined') {
    DONJONS.filter((d) => !d.chronique).forEach((d) => {
      if (d.niveauMin > avant && d.niveauMin <= apres) {
        annoncerDeblocage({ emoji: d.emoji, titre: `Histoire débloquée : ${d.nom}`, texte: d.resume || '' });
      }
    });
  }
}

// Rend un élément non-bouton activable au clic, au clavier (Entrée/Espace)
// et repérable par les lecteurs d'écran.
function rendreCliquable(element, action) {
  element.classList.add('cliquable');
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');
  element.addEventListener('click', action);
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  });
}

// Bouton à confirmation en deux temps (évite window.confirm, bloqué en iframe)
function boutonConfirmation(libelle, libelleConfirme, action) {
  const btn = document.createElement('button');
  btn.className = 'btn-choix btn-danger';
  btn.textContent = libelle;
  let arme = false;
  btn.addEventListener('click', () => {
    if (!arme) {
      arme = true;
      btn.textContent = libelleConfirme;
      setTimeout(() => { arme = false; btn.textContent = libelle; }, 2500);
    } else {
      action();
    }
  });
  return btn;
}

// =====================================================================
// Navigation
// =====================================================================
const ECRANS_AVEC_TOPBAR = ['ecran-carte', 'ecran-equipe', 'ecran-zone', 'ecran-ville',
  'ecran-boutique', 'ecran-antiquaire', 'ecran-arcanium', 'ecran-guilde', 'ecran-atelier',
  'ecran-fournisseur', 'ecran-tour-eveil', 'ecran-heros', 'ecran-sac', 'ecran-taverne', 'ecran-groupe-ligne', 'ecran-donjon'];

// Quel bouton de la barre du bas s'allume pour chaque écran.
const NAV_POUR_ECRAN = {
  'ecran-carte': 'carte', 'ecran-equipe': 'carte', 'ecran-zone': 'carte', 'ecran-donjon': 'carte',
  'ecran-ville': 'ville', 'ecran-boutique': 'ville', 'ecran-antiquaire': 'ville', 'ecran-arcanium': 'ville',
  'ecran-guilde': 'ville', 'ecran-atelier': 'ville', 'ecran-fournisseur': 'ville',
  'ecran-tour-eveil': 'ville',
  'ecran-heros': 'heros', 'ecran-sac': 'sac', 'ecran-taverne': 'taverne', 'ecran-groupe-ligne': 'taverne',
};

function montrerEcran(id) {
  document.querySelectorAll('.ecran').forEach((e) => e.classList.remove('actif'));
  el(id).classList.add('actif');
  const topbar = el('topbar');
  const navbar = el('navbar-bas');
  const barresVisibles = ECRANS_AVEC_TOPBAR.includes(id) && persoActif();
  topbar.classList.toggle('cache', !barresVisibles);
  if (navbar) {
    navbar.classList.toggle('cache', !barresVisibles);
    navbar.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('actif', b.dataset.nav === NAV_POUR_ECRAN[id]);
    });
  }
  if (barresVisibles) rendreTopbar();
  if (id !== 'ecran-taverne' && typeof arreterSondageTaverne === 'function') arreterSondageTaverne();
  // v12.2 : au niveau 5, le choix de la sous-classe de récolteur s'impose.
  if (['ecran-carte', 'ecran-zone', 'ecran-ville', 'ecran-heros'].includes(id)) {
    verifierChoixSpecialite();
    verifierChoixClasse();     // le rôle d'abord : la spécialité en découle
    verifierChoixSousClasse();
    verifierChoixVoie();
    verifierEveil();
  }
  window.scrollTo(0, 0);
}

// =====================================================================
// Une seule fenêtre bloquante à la fois.
//
// Le jeu en compte deux qui s'imposent au joueur : le choix de métier au
// niveau 5, et le choix de spécialité au niveau 10. Un héros qui atteint
// le niveau 10 sans avoir choisi son métier déclenchait les deux en même
// temps — et celle du dessous interceptait les clics de celle du dessus.
// On les fait donc passer l'une après l'autre, dans l'ordre des niveaux.
// =====================================================================
function modaleBloquanteOuverte() {
  return !!document.querySelector('#voile-specialite, #voile-classe, #voile-sous-classe, #voile-voie, #voile-eveil');
}

// =====================================================================
// v19 — L'ÉVEIL, au niveau 80.
//
// Cinq propositions tirées parmi les Éveils de sa sous-classe, une seule
// gardée. La rareté change la contrainte et la complexité, jamais la
// puissance : c'est écrit dans les données, et le harnais le vérifie.
// =====================================================================
function verifierEveil() {
  const p = persoActif();
  if (!p || p.niveau < NIVEAU_EVEIL || (p.eveil && p.eveil.id) || !p.sousClasse) return;
  if (p.eveil && p.eveil.reporte) return; // le joueur a dit « plus tard »
  if (modaleBloquanteOuverte()) return;
  if (typeof combatEnCours === 'function' && combatEnCours()) return;

  // Le tirage est PERSISTANT : tiré une fois, mémorisé, réaffiché tel
  // quel — naviguer entre les écrans ne relance jamais les dés. C'est
  // aussi ce qui rend les services de la Tour réels : « verrouiller une
  // proposition » et « forcer une rareté » agissent sur CE tirage-là.
  p.eveil = p.eveil || { relances: 0 };
  if (!p.eveil.propositions || !p.eveil.propositions.length) {
    const tirage = tirerEveils(p, {
      garantirLegendaire: !!p.eveil.garantie,
      verrouillee: p.eveil.verrouillee,
    });
    if (!tirage.length) return;
    p.eveil.propositions = tirage.map((e) => e.id);
    p.eveil.garantie = false;      // la garantie payée est consommée par CE tirage
    p.eveil.verrouillee = null;    // le verrou aussi : la proposition est dedans
    sauvegarder(p);
  }
  const propositions = p.eveil.propositions.map((id) => EVEILS[id]).filter(Boolean);
  if (!propositions.length) return;

  const voile = document.createElement('div');
  voile.id = 'voile-eveil';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-specialite';
  modale.innerHTML = `
    <h2>✨ Niveau ${NIVEAU_EVEIL} : l’Éveil de ${echapper(p.nom)}</h2>
    <p>Vous ne changez pas de style : vous changez de <strong>nature</strong>. Trois natures
      se présentent, vous en garderez une. La rareté ne rend pas plus puissant —
      elle rend plus <strong>exigeant</strong>.</p>
    <div id="eveil-choix"></div>
    <p class="aide">Pas convaincu ? À la Tour de l’Éveil, des Sceaux permettent de relancer le
      tirage, d’en verrouiller une proposition ou d’y garantir un Légendaire.</p>`;

  const zone = modale.querySelector('#eveil-choix');
  propositions.forEach((eveil) => {
    const rarete = RARETES_EVEIL[eveil.rarete];
    const carte = document.createElement('div');
    carte.className = `panneau carte-specialite bord-rar-${eveil.rarete === 'cache' ? 'divin' : eveil.rarete}`;
    carte.innerHTML = `
      <div class="objet-entete">${eveil.emoji} <strong>${eveil.nom}</strong>
        <span class="rarete rar-${eveil.rarete === 'cache' ? 'divin' : eveil.rarete}">${rarete.nom}</span></div>
      <div class="objet-desc">${eveil.effet}</div>
      <div class="objet-bonus">${eveil.competences.map((c) => `${COMPETENCES[c].emoji} ${COMPETENCES[c].nom}`).join(' · ')}</div>
      ${eveil.contrainte ? `<div class="objet-niveau niveau-insuffisant">⚠️ ${eveil.contrainte}</div>` : '<div class="objet-desc">Aucune contrainte.</div>'}`;
    const choisir = document.createElement('button');
    choisir.className = 'btn-principal btn-compact';
    choisir.textContent = `${eveil.emoji} Devenir ${eveil.nom}`;
    choisir.addEventListener('click', () => {
      // Le choix scelle tout : propositions, garantie et verrou s'effacent.
      p.eveil = { id: eveil.id, rarete: eveil.rarete, relances: (p.eveil && p.eveil.relances) || 0 };
      eveil.competences.forEach((c) => apprendreCompetence(p, c, true));
      bornerVie(p);
      sauvegarder(p);
      voile.remove();
      annoncerDeblocage({
        emoji: eveil.emoji,
        titre: eveil.nom,
        texte: `${eveil.effet}${eveil.contrainte ? ` — en échange : ${eveil.contrainte}` : ''}`,
      });
      if (el('ecran-heros').classList.contains('actif')) rendreHeros();
      rendreTopbar();
    });
    carte.appendChild(choisir);
    zone.appendChild(carte);
  });

  // « Plus tard » : indispensable pour que la Tour de l'Éveil serve à
  // quelque chose — verrouiller ou forcer une rareté se paie ENTRE le
  // tirage et le choix. Le tirage mémorisé revient tel quel.
  const plusTard = document.createElement('button');
  plusTard.className = 'btn-choix';
  plusTard.textContent = '🕰️ Plus tard — le tirage vous attendra';
  plusTard.addEventListener('click', () => {
    p.eveil.reporte = true;
    sauvegarder(p);
    voile.remove();
    afficherToast('✨ Le tirage patiente. Reprenez-le depuis la Tour de l’Éveil, au bourg.');
  });
  modale.appendChild(plusTard);

  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// v19 — LE CHOIX DE VOIE, au niveau 50.
//
// La Voie ne change pas la classe : elle pousse la spécialité dans une
// direction, donne un passif fort, une compétence, et le titre qui
// s'affiche ensuite partout — « Templier du Bastion ».
// =====================================================================
function verifierChoixVoie() {
  const p = persoActif();
  if (!p || p.niveau < NIVEAU_VOIE || p.voie || !p.sousClasse) return;
  if (modaleBloquanteOuverte()) return;
  if (typeof combatEnCours === 'function' && combatEnCours()) return;
  const sousClasse = sousClasseDe(p);
  if (!sousClasse || !(sousClasse.voies || []).length) return;

  const voile = document.createElement('div');
  voile.id = 'voile-voie';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-specialite';
  modale.innerHTML = `
    <h2>${sousClasse.emoji} Niveau ${NIVEAU_VOIE} : choisissez votre Voie de ${sousClasse.nom}</h2>
    <p>${echapper(p.nom)} a poussé sa spécialité aussi loin qu'elle allait. La Voie décide
      de ce qu'elle devient : un <strong>passif majeur</strong>, une <strong>compétence
      propre</strong>, et un <strong>titre</strong> qui vous suivra partout.</p>
    <div id="voie-choix"></div>
    <p class="aide">Le choix se change plus tard, contre une contrepartie.</p>`;

  const zone = modale.querySelector('#voie-choix');
  sousClasse.voies.forEach((idVoie) => {
    const voie = VOIES[idVoie];
    const comp = COMPETENCES[voie.competence];
    const carte = document.createElement('div');
    carte.className = 'panneau carte-specialite';
    carte.innerHTML = `
      <div class="objet-entete">${voie.emoji} <strong>${voie.nom}</strong></div>
      <div class="objet-desc">${voie.passif}</div>
      <div class="objet-bonus">${comp.emoji} ${comp.nom} — nouvelle compétence</div>
      <div class="objet-desc">Titre porté : <strong>${voie.titre}</strong></div>`;
    const choisir = document.createElement('button');
    choisir.className = 'btn-principal btn-compact';
    choisir.textContent = `${voie.emoji} Suivre la ${voie.nom}`;
    choisir.addEventListener('click', () => {
      p.voie = idVoie;
      apprendreCompetence(p, voie.competence, true);
      bornerVie(p);
      sauvegarder(p);
      voile.remove();
      annoncerDeblocage({
        emoji: voie.emoji,
        titre: voie.titre,
        texte: `${voie.passif} ${comp.nom} rejoint votre grimoire.`,
      });
      if (el('ecran-heros').classList.contains('actif')) rendreHeros();
      rendreTopbar();
    });
    carte.appendChild(choisir);
    zone.appendChild(carte);
  });

  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// v19 — LE CHOIX DE SPÉCIALITÉ, au niveau 10.
//
// Les dix premiers niveaux servent à comprendre son rôle ; le dixième
// demande de choisir sa voie à l'intérieur de ce rôle. Le choix n'est pas
// perdu d'avance : il apporte un bonus de caractéristiques permanent et
// huit compétences propres, et il reste changeable plus tard.
// =====================================================================
// Le choix (ou re-choix) de CLASSE : offert par la migration d'un très
// vieux héros Aventurier, et surtout VENDU par la Tour de l'Éveil
// (« Changer de rôle », 150 Sceaux + 3 Majeurs). Le drapeau
// p.choixClasseOffert était posé par le service… et lu par personne :
// le joueur payait le service le plus cher du jeu sans rien recevoir.
function verifierChoixClasse() {
  const p = persoActif();
  if (!p || !p.choixClasseOffert) return;
  if (modaleBloquanteOuverte()) return;
  if (document.getElementById('voile-classe')) return;
  if (typeof combatEnCours === 'function' && combatEnCours()) return;

  const voile = document.createElement('div');
  voile.id = 'voile-classe';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-specialite';
  modale.innerHTML = `
    <h2>🎭 Un nouveau rôle pour ${echapper(p.nom)}</h2>
    <p>Le niveau, l'or et tout le grimoire restent. Seul change ce que
      vous êtes au combat : choisissez votre nouvelle classe — la
      spécialité, la Voie et l'Éveil suivront, aux paliers habituels.</p>
    <div id="classe-choix"></div>`;

  const zone = modale.querySelector('#classe-choix');
  Object.entries(CLASSES_BASE).forEach(([id, base]) => {
    const actuelle = id === p.classe;
    const categorie = CATEGORIES_ARMURE[base.armure];
    const carte = document.createElement('div');
    carte.className = 'panneau carte-specialite';
    carte.innerHTML = `
      <div class="objet-entete">${base.emoji} <strong>${base.nom}</strong>
        ${actuelle ? '<span class="objet-qte">rôle actuel</span>' : ''}</div>
      <div class="objet-desc">${base.role} · ${categorie ? `${categorie.emoji} ${categorie.nom}` : ''}
        · attribut clé : ${CARACS[base.stat].emoji} ${CARACS[base.stat].nom}</div>
      <div class="objet-desc">${base.resume || ''}</div>`;
    const choisir = document.createElement('button');
    choisir.className = 'btn-principal btn-compact';
    choisir.textContent = actuelle ? `${base.emoji} Rester ${base.nom}` : `${base.emoji} Devenir ${base.nom}`;
    choisir.addEventListener('click', () => {
      p.classe = id;
      p.choixClasseOffert = false;
      debloquerCompetencesClasse(p, true);
      bornerVie(p);
      sauvegarder(p);
      voile.remove();
      annoncerDeblocage({
        emoji: base.emoji,
        titre: `Nouveau rôle : ${base.nom}`,
        texte: `${base.role}. Vos compétences apprises restent au grimoire — la spécialité de ${base.nom} vous sera proposée dans un instant.`,
      });
      if (el('ecran-heros').classList.contains('actif')) rendreHeros();
      rendreTopbar();
    });
    carte.appendChild(choisir);
    zone.appendChild(carte);
  });

  voile.appendChild(modale);
  document.body.appendChild(voile);
}

function verifierChoixSousClasse() {
  const p = persoActif();
  if (!p || p.niveau < NIVEAU_SOUS_CLASSE || p.sousClasse) return;
  if (modaleBloquanteOuverte()) return;
  const base = classeBaseDe(p);
  if (!base || !base.sousClasses.length) return;
  if (document.getElementById('voile-sous-classe')) return;
  // Jamais par-dessus un combat : on attend le retour au calme.
  if (typeof combatEnCours === 'function' && combatEnCours()) return;

  const voile = document.createElement('div');
  voile.id = 'voile-sous-classe';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-specialite';
  modale.innerHTML = `
    <h2>${base.emoji} Niveau ${NIVEAU_SOUS_CLASSE} : choisissez votre spécialité de ${base.nom}</h2>
    <p>${echapper(p.nom)} maîtrise les bases. Il est temps de choisir la voie qui fera
      sa réputation : chacune apporte un <strong>bonus de caractéristiques permanent</strong>,
      un <strong>passif propre</strong> et <strong>huit compétences exclusives</strong>.</p>
    <div id="sous-classe-choix"></div>
    <p class="aide">Vous garderez tout ce que vous avez déjà appris. Le choix se change plus tard,
      contre une contrepartie.</p>`;

  const zone = modale.querySelector('#sous-classe-choix');
  base.sousClasses.forEach((id) => {
    const sc = SOUS_CLASSES[id];
    const bonus = Object.entries(sc.bonusStats || {})
      .map(([cle, v]) => `${v > 0 ? '+' : ''}${v} ${CARACS[cle].emoji} ${CARACS[cle].nom}`)
      .join(' · ');
    const carte = document.createElement('div');
    carte.className = 'panneau carte-specialite';
    carte.innerHTML = `
      <div class="objet-entete">${sc.emoji} <strong>${sc.nom}</strong></div>
      <div class="objet-desc">${sc.resume}</div>
      <div class="objet-bonus">${bonus}</div>
      <div class="objet-desc"><strong>Passif :</strong> ${sc.passif}</div>`;
    const choisir = document.createElement('button');
    choisir.className = 'btn-principal btn-compact';
    choisir.textContent = `${sc.emoji} Devenir ${sc.nom}`;
    choisir.addEventListener('click', () => {
      p.sousClasse = id;
      debloquerCompetencesClasse(p, true);
      bornerVie(p);
      sauvegarder(p);
      voile.remove();
      annoncerDeblocage({
        emoji: sc.emoji,
        titre: `${base.nom} — ${sc.nom}`,
        texte: `${sc.passif} Ses huit compétences rejoignent votre grimoire.`,
      });
      if (el('ecran-heros').classList.contains('actif')) rendreHeros();
      rendreTopbar();
    });
    carte.appendChild(choisir);
    zone.appendChild(carte);
  });

  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// Sous-classe de récolteur (v12.2) : débloquée au niveau 5, choisie via
// une fenêtre OBLIGATOIRE (pas de croix, pas d'échappatoire) — seule la
// description peut être passée. Chaque spécialité nourrit un pan de
// l'artisanat : le choix compte.
// =====================================================================
function verifierChoixSpecialite() {
  const p = persoActif();
  if (!p || p.admin || p.metierPrincipal || p.niveau < NIVEAU_SPECIALITE) return;
  // Jamais par-dessus un combat : la fenêtre s'ouvrait au milieu d'un tour.
  if (typeof combatEnCours === 'function' && combatEnCours()) return;
  if (modaleBloquanteOuverte()) return;

  const PRESENTATIONS = {
    mineur: 'Pierres, minerais et cristaux — et la fameuse <strong>pierre magique</strong>. C\'est lui qui nourrit la <strong>Forge</strong> : lames, heaumes, cuirasses et jambières. Sans mineur, pas d\'acier — et les guerriers combattent en chemise.',
    tanneur: 'Cuirs, os et dépouilles de bêtes — jusqu\'au précieux <strong>cuir primal</strong>. C\'est lui qui nourrit la <strong>Tannerie</strong> : gants et bottes, Ténacité et Célérité. Sans tanneur, les aventuriers marchent pieds nus.',
    tisseur: 'Plantes, fibres et étoffes — dont le <strong>tissu magique</strong>. C\'est lui qui nourrit le <strong>Tisserand</strong> (talismans et grimoires des mages) et l\'<strong>Alchimiste</strong> (potions, bombes, philtres). Sans tisseur, personne ne boit ni ne lance rien.',
  };

  const voile = document.createElement('div');
  voile.id = 'voile-specialite';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-specialite';
  modale.innerHTML = `
    <h2>⭐ Niveau ${NIVEAU_SPECIALITE} atteint : votre sous-classe de récolteur vous attend !</h2>
    <div id="specialite-description">
      <p>${echapper(p.nom)} a fait ses preuves : il est temps de choisir une <strong>spécialité de récolte</strong>.
      Tous les métiers resteront praticables, mais le spécialiste récolte <strong>bien plus</strong> dans son domaine
      (quantités, matériaux signatures) et y progresse <strong>deux fois plus vite</strong> — un avantage qui grandit
      encore avec la Chance 🍀.</p>
      <p><strong>Chaque sous-classe compte</strong>, car chacune alimente des équipements différents chez les artisans
      du bourg — à choisir selon ce que vous voulez porter, fabriquer… ou vendre aux autres :</p>
      <button id="specialite-passer" class="btn-choix btn-compact">↷ Passer la description</button>
    </div>
    <div id="specialite-choix"></div>
    <p class="aide">Le choix est obligatoire pour continuer l'aventure — mais pas définitif :
      changer coûtera ${formatNombre(COUT_CHANGEMENT_SPECIALITE)} po depuis votre fiche de héros.</p>`;

  const zoneChoix = modale.querySelector('#specialite-choix');
  Object.entries(METIERS).forEach(([idMetier, metier]) => {
    const carte = document.createElement('div');
    carte.className = 'panneau carte-specialite';
    carte.innerHTML = `
      <div class="objet-entete">${metier.emoji} <strong>${metier.nom}</strong></div>
      <div class="objet-desc description-specialite">${PRESENTATIONS[idMetier]}</div>`;
    const choisir = document.createElement('button');
    choisir.className = 'btn-principal btn-compact';
    choisir.textContent = `${metier.emoji} Devenir ${metier.nom}`;
    choisir.addEventListener('click', () => {
      p.metierPrincipal = idMetier;
      sauvegarder(p);
      voile.remove();
      afficherToast(`${metier.emoji} ⭐ ${p.nom} est désormais ${metier.nom} : ses récoltes de spécialité seront bien plus riches !`);
      if (el('ecran-heros').classList.contains('actif')) rendreHeros();
      verifierChoixSousClasse();   // au tour de la spécialité de classe
    });
    carte.appendChild(choisir);
    zoneChoix.appendChild(carte);
  });

  // La description se saute ; le choix, lui, ne se saute pas.
  modale.querySelector('#specialite-passer').addEventListener('click', () => {
    modale.querySelector('#specialite-description').classList.add('cache');
    modale.querySelectorAll('.description-specialite').forEach((d) => d.classList.add('cache'));
  });

  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// v19 — L'heure et le temps qu'il fait, en haut à droite du header.
//
// Deux emojis sur mobile, le détail au toucher : le joueur voit d'un
// coup d'œil s'il fait nuit (butin +20 %) ou s'il pleut (feu −20 %), et
// peut décider d'attendre une meilleure fenêtre avant de partir.
// =====================================================================
function blocMondeVivant() {
  const monde = mondeMaintenant();
  return `<button class="topbar-monde" type="button"
      title="${monde.phase.nom} · ${monde.meteo.nom} — toucher pour le détail"
      aria-label="${monde.phase.nom}, ${monde.meteo.nom}. Toucher pour le détail.">
      <span class="monde-emojis">${monde.phase.emoji}${monde.meteo.emoji}</span>
      <span class="monde-libelle">${monde.phase.nom} · ${monde.meteo.nom}</span>
    </button>`;
}

function ouvrirDetailMonde() {
  if (document.getElementById('voile-monde')) return;
  const monde = mondeMaintenant();
  const minutes = minutesAvantChangementMeteo();
  const voile = document.createElement('div');
  voile.id = 'voile-monde';
  voile.className = 'voile-leger';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-monde';
  modale.innerHTML = `
    <h2>${monde.phase.emoji} ${monde.phase.nom} · ${monde.meteo.emoji} ${monde.meteo.nom}</h2>
    <div class="bloc-monde">
      <div class="monde-titre">${monde.phase.emoji} ${monde.phase.nom}</div>
      <p class="objet-desc">${monde.phase.resume}</p>
      <div class="objet-bonus">${monde.phase.detail}</div>
    </div>
    <div class="bloc-monde">
      <div class="monde-titre">${monde.meteo.emoji} ${monde.meteo.nom}</div>
      <p class="objet-desc">${monde.meteo.resume}</p>
      <div class="objet-bonus">${monde.meteo.detail}</div>
    </div>
    <p class="aide">Le ciel change dans ${minutes} minute${minutes > 1 ? 's' : ''} — il est le même
      pour tous les joueurs de Valciel, en ligne comme hors ligne.</p>`;
  const fermer = document.createElement('button');
  fermer.className = 'btn-principal btn-compact';
  fermer.textContent = 'Fermer';
  fermer.addEventListener('click', () => voile.remove());
  modale.appendChild(fermer);
  voile.appendChild(modale);
  voile.addEventListener('click', (e) => { if (e.target === voile) voile.remove(); });
  document.body.appendChild(voile);
}

// v17 : le header d'un vrai jeu vidéo — nom, niveau, puissance, PV, mana.
function rendreTopbar() {
  const p = persoActif();
  if (!p) return;
  const zone = el('topbar-perso');
  const pctHp = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
  const pctMp = Math.max(0, Math.round((p.mp / p.maxMp) * 100));
  zone.innerHTML = `
    <span class="topbar-avatar">${p.avatar}</span>
    <div class="topbar-infos">
      <div class="topbar-nom">${echapper(p.nom)} <span class="niveau">niv. ${p.niveau}</span>
        <span class="topbar-puissance" title="Puissance (stats + équipement)">⚡ ${puissanceDe(p).toLocaleString('fr-FR')}</span></div>
      <div class="topbar-vitaux">
        <span class="topbar-vital" title="Points de vie">❤️ ${p.hp}/${p.maxHp}
          <span class="barre pv mini"><span class="remplissage" style="width:${pctHp}%"></span></span></span>
        <span class="topbar-vital" title="Mana">💧 ${p.mp}/${p.maxMp}
          <span class="barre pm mini"><span class="remplissage" style="width:${pctMp}%"></span></span></span>
      </div>
    </div>
    ${blocMondeVivant()}`;
  const zoneMonde = zone.querySelector('.topbar-monde');
  if (zoneMonde) zoneMonde.addEventListener('click', ouvrirDetailMonde);
  const badge = el('badge-heros');
  if (badge) badge.classList.toggle('cache', !(p.pointsEnAttente > 0 || p.maitrise > 0));
  const point = el('point-en-ligne');
  if (point) point.classList.toggle('actif-reseau', etat.enLigne);
}

function naviguer(destination) {
  if (combatEnCours()) return;
  if (destination !== 'titre' && !persoActif()) return;
  switch (destination) {
    case 'carte': rendreCarte(); montrerEcran('ecran-carte'); break;
    case 'ville': rendreVille(); montrerEcran('ecran-ville'); break;
    case 'heros': rendreHeros(); montrerEcran('ecran-heros'); break;
    case 'sac': rendreSac(); montrerEcran('ecran-sac'); break;
    case 'taverne': rendreTaverne(); montrerEcran('ecran-taverne'); break;
    case 'titre': rendreTitre(); montrerEcran('ecran-titre'); break;
  }
}

// =====================================================================
// Profils : stockage local + synchronisation en ligne
// =====================================================================
function chargerProfils() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_STOCKAGE_PROFILS) || '[]');
    // Un stockage corrompu (mauvais type, entrées incomplètes) ne doit
    // jamais empêcher le jeu de démarrer.
    etat.profils = (Array.isArray(brut) ? brut : [])
      .filter((p) => p && p.stats && p.equipement && Array.isArray(p.inventaire) && Array.isArray(p.competences));
    etat.actifId = localStorage.getItem(CLE_STOCKAGE_ACTIF) || null;
    etat.profils.forEach((p) => normaliserPerso(p));
  } catch (e) {
    etat.profils = [];
    etat.actifId = null;
  }
}

// =====================================================================
// v19 — Migration des caractéristiques vers le modèle Final Fantasy XIV.
//
// Deux changements, et une règle qui prime sur les deux : personne ne perd
// quoi que ce soit.
//
//  • l'Agilité devient la DEXTÉRITÉ — un simple renommage, la valeur suit ;
//  • l'ESPRIT fait son entrée, à sa valeur de base, offerte.
//
// Le héros garde exactement la répartition qu'il s'était choisie. On
// recompte ensuite ce que la nouvelle courbe lui doit vraiment, et on lui
// rend la différence en points à placer — jamais l'inverse : si l'ancien
// modèle avait été plus généreux, il conserve son avance.
// =====================================================================
function migrerCaracteristiques(p) {
  if (p.stats.agi != null && p.stats.dex == null) p.stats.dex = p.stats.agi;
  delete p.stats.agi;
  Object.keys(CARACS).forEach((cle) => {
    if (p.stats[cle] == null) p.stats[cle] = STAT_BASE;
  });
  // Points réellement dus à ce niveau, création et bases comprises.
  const dus = POINTS_CREATION + Object.keys(CARACS).length * STAT_BASE + pointsCumules(p.niveau || 1);
  const detenus = Object.keys(CARACS).reduce((somme, cle) => somme + p.stats[cle], 0)
    + (p.pointsEnAttente || 0);
  if (detenus < dus) p.pointsEnAttente = (p.pointsEnAttente || 0) + (dus - detenus);
}

// =====================================================================
// v19 — Migration des classes vers les six rôles.
//
// Les 21 classes historiques se répartissent : quatre restent des classes
// de base, seize deviennent des sous-classes en gardant leurs huit
// compétences, et l'Aventurier se voit offrir un choix libre.
//
// Le marqueur de version est indispensable : sans lui, un héros déjà migré
// vers « Guerrier — Berserker » repasserait par la table à chaque
// chargement et y perdrait sa sous-classe.
// =====================================================================
const VERSION_CLASSES = 19;

function migrerClasses(p) {
  if (p.sousClasse === undefined) p.sousClasse = null;
  if (p.versionClasses >= VERSION_CLASSES) return;
  const cible = MIGRATION_CLASSES[p.classe];
  if (cible) {
    if (cible.choixOffert) {
      // L'Aventurier n'entre dans aucun rôle : on lui propose de choisir,
      // sans rien lui retirer en attendant.
      p.choixClasseOffert = true;
    } else {
      p.classe = cible.classe;
      p.sousClasse = cible.sousClasse;
    }
  }
  p.versionClasses = VERSION_CLASSES;
}

// Complète les sauvegardes venues d'anciennes versions du jeu.
function normaliserPerso(p) {
  if (!p.race) p.race = 'humain';
  if (!p.stats) p.stats = {};
  migrerCaracteristiques(p);
  if (!p.compteurs) p.compteurs = {};
  ['monstres', 'orTotal', 'crafts', 'quetes', 'legendaires', 'divins'].forEach((cle) => {
    if (p.compteurs[cle] == null) p.compteurs[cle] = 0;
  });
  if (!Array.isArray(p.familiers)) p.familiers = [];
  if (p.familier === undefined) p.familier = null;
  if (!Array.isArray(p.hautsFaits)) p.hautsFaits = [];
  if (p.titre === undefined) p.titre = null;
  if (p.tourMax == null) p.tourMax = 0;
  if (!p.tourBoss || typeof p.tourBoss !== 'object') p.tourBoss = { normal: 0, heroique: 0, cauchemar: 0 };
  if (!p.donjons || typeof p.donjons !== 'object') p.donjons = {};
  // v7 : le grimoire recense toutes les compétences connues ; seules
  // MAX_COMPETENCES_ACTIVES d'entre elles sont équipées en même temps.
  if (!Array.isArray(p.grimoire)) p.grimoire = [];
  p.competences.forEach((id) => { if (!p.grimoire.includes(id)) p.grimoire.push(id); });
  // v18 : plus aucune compétence gratuite à la montée de niveau — les
  // crédits en attente des anciennes sauvegardes sont soldés.
  p.competencesEnAttente = 0;
  if (p.competences.length > MAX_COMPETENCES_ACTIVES) {
    p.competences = p.competences.slice(0, MAX_COMPETENCES_ACTIVES);
  }
  // v10 : deux nouveaux emplacements d'équipement (mains, pieds).
  if (p.equipement.mains === undefined) p.equipement.mains = null;
  if (p.equipement.pieds === undefined) p.equipement.pieds = null;
  // v8 : classe, compétences de classe exclusives et points de maîtrise.
  if (!p.classe || !(CLASSES[p.classe] || MIGRATION_CLASSES[p.classe])) p.classe = infererClasse(p);
  migrerClasses(p);
  if (p.sousClasse && !SOUS_CLASSES[p.sousClasse]) p.sousClasse = null;
  if (p.voie && !VOIES[p.voie]) p.voie = null;
  if (p.eveil && !EVEILS[p.eveil.id]) p.eveil = null;
  if (!p.rangs || typeof p.rangs !== 'object') p.rangs = {};
  debloquerCompetencesClasse(p, false);
  if (p.maitrise == null) {
    const depenses = Object.values(p.rangs).reduce((somme, r) => somme + r, 0);
    p.maitrise = Math.max(0, pointsMaitrisePourNiveau(p.niveau) - depenses);
  }
  // v12 : métiers de récolte (mineur, tanneur, tisseur) + spécialité.
  if (!p.metiers || typeof p.metiers !== 'object') p.metiers = {};
  Object.keys(METIERS).forEach((id) => {
    if (!p.metiers[id]) p.metiers[id] = { niveau: 1, xp: 0 };
  });
  if (p.metierPrincipal === undefined || (p.metierPrincipal && !METIERS[p.metierPrincipal])) {
    p.metierPrincipal = null;
  }
  // v13 : records d'Ascension éternelle par épopée.
  if (!p.ascensions || typeof p.ascensions !== 'object') p.ascensions = {};
  // v17 : histoires uniques découvertes sur chaque carte.
  if (!p.histoiresVues || typeof p.histoiresVues !== 'object') p.histoiresVues = {};
  // v17.1 : migration des objets disparus du catalogue (les légendaires du
  // marchand n'existent plus) vers leur équivalent de BUTIN de même rareté
  // et de même niveau — le héros ne perd rien, il y gagne même un peu.
  const migrerObjet = (id) => {
    if (!id || OBJETS[id]) return id;
    const m = /^marchand-([a-z]+)-([a-z]+)-(\d+)$/.exec(id);
    if (m) {
      const butin = `butin-${m[1]}-${m[2]}-${m[3]}-0`;
      if (OBJETS[butin]) return butin;
      const epique = `marchand-${m[1]}-epique-${m[3]}`;
      if (OBJETS[epique]) return epique;
    }
    return null; // objet inconnu : on l'écarte plutôt que de planter
  };
  Object.keys(p.equipement).forEach((slot) => {
    p.equipement[slot] = migrerObjet(p.equipement[slot]);
  });
  p.inventaire = p.inventaire
    .map((entree) => ({ ...entree, id: migrerObjet(entree.id) }))
    .filter((entree) => entree.id);
  if (!p.quetes || p.quetes.date !== new Date().toISOString().slice(0, 10)) {
    p.quetes = genererQuetesDuJour(p);
  }
  bornerVie(p);
  return p;
}

// =====================================================================
// v14 — LA MORT. Quand une expédition tombe, chaque héros paie le prix :
// l'équipement porté est perdu à jamais, le familier qui l'accompagnait
// meurt, la moitié de la bourse s'évapore, et un niveau s'efface —
// avec les points de caractéristiques qui allaient avec. Puis la ville,
// le repos… et la compréhension : mourir renvoie dans le passé, là où
// le destin peut encore s'écrire autrement.
// =====================================================================
function appliquerMortHeros(m) {
  const bilan = {
    nom: m.nom, avatar: m.avatar,
    objets: [], familier: null, po: 0,
    niveauAvant: m.niveau, niveauApres: m.niveau,
  };

  // L'équipement porté disparaît, définitivement.
  Object.keys(m.equipement).forEach((slot) => {
    const id = m.equipement[slot];
    if (id && OBJETS[id]) bilan.objets.push(`${OBJETS[id].emoji} ${OBJETS[id].nom}`);
    m.equipement[slot] = null;
  });

  // Le familier qui l'accompagnait meurt avec lui.
  const compagnon = familierActif(m);
  if (compagnon) {
    bilan.familier = `${compagnon.emoji} ${compagnon.nom}`;
    m.familiers = m.familiers.filter((id) => id !== m.familier);
    m.familier = null;
  }

  // La moitié de la bourse s'évapore.
  bilan.po = Math.floor(m.po / 2);
  m.po -= bilan.po;

  // Un niveau s'efface — et ses points de caractéristiques.
  const apres = Math.max(1, m.niveau - 1);
  const niveauxPerdus = m.niveau - apres;
  if (niveauxPerdus > 0) {
    let aRetirer = pointsCumules(m.niveau) - pointsCumules(apres);
    const surAttente = Math.min(m.pointsEnAttente || 0, aRetirer);
    m.pointsEnAttente -= surAttente;
    aRetirer -= surAttente;
    while (aRetirer > 0) {
      let plusHaute = null;
      Object.keys(CARACS).forEach((cle) => {
        if (m.stats[cle] > STAT_BASE && (plusHaute === null || m.stats[cle] > m.stats[plusHaute])) plusHaute = cle;
      });
      if (plusHaute === null) break;
      m.stats[plusHaute]--;
      aRetirer--;
    }
    m.niveau = apres;
    m.xp = seuilXp(apres);
  }
  bilan.niveauApres = m.niveau;

  // Le corps, lui, se remettra : on se réveille reposé en ville.
  m.statuts = [];
  bornerVie(m);
  m.hp = m.maxHp;
  m.mp = m.maxMp;
  sauvegarder(m);
  return bilan;
}

function traiterMortEquipe(cb, lignesContexte) {
  const bilans = cb.equipe.map((m) => appliquerMortHeros(m));
  rendreTopbar();
  afficherEcranMort(bilans, lignesContexte || []);
}

// L'écran de la mort : un crâne en grand, et le décompte de ce qui part.
function afficherEcranMort(bilans, lignesContexte) {
  const ancien = document.getElementById('voile-mort');
  if (ancien) ancien.remove();
  const voile = document.createElement('div');
  voile.id = 'voile-mort';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-mort';
  const pertes = bilans.map((b) => `
    <div class="panneau pertes-mort">
      <div class="objet-entete">${b.avatar} <strong>${echapper(b.nom)}</strong> — niveau ${b.niveauAvant} ➜ ${b.niveauApres}</div>
      ${b.objets.length
    ? `<div class="ligne-butin">🛡️ Équipement perdu à jamais : ${b.objets.join(', ')}</div>`
    : '<div class="ligne-butin">🛡️ Aucun équipement porté — rien que la mort puisse prendre.</div>'}
      ${b.familier ? `<div class="ligne-butin">🐾 ${b.familier} meurt aux côtés de son maître.</div>` : ''}
      <div class="ligne-butin">💰 −${formatNombre(b.po)} po — la moitié de la bourse.</div>
      <div class="ligne-butin">⬇️ ${b.niveauAvant - b.niveauApres} niveau${b.niveauAvant - b.niveauApres > 1 ? 'x' : ''} perdu${b.niveauAvant - b.niveauApres > 1 ? 's' : ''}, et les points de caractéristiques qui allaient avec.</div>
    </div>`).join('');
  modale.innerHTML = `
    <div class="crane-mort">💀</div>
    <h2 class="titre-mort">La mort vous a trouvés.</h2>
    ${lignesContexte.map((l) => `<p class="sous-titre">${l}</p>`).join('')}
    ${pertes}
    <p class="aide">Ce qui est perdu est perdu. Ce qui est appris — compétences, métiers, hauts faits — reste à jamais.</p>`;
  const bouton = document.createElement('button');
  bouton.className = 'btn-principal';
  bouton.id = 'mort-accepter';
  bouton.textContent = '⚰️ Accepter son destin ➜';
  bouton.addEventListener('click', () => {
    voile.remove();
    naviguer('ville');
    afficherRenaissance(bilans);
  });
  modale.appendChild(bouton);
  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// Le réveil en ville : la mort n'était qu'un voyage dans le passé.
function afficherRenaissance(bilans) {
  const noms = bilans.map((b) => b.nom);
  const nom = noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}` : noms[0];
  const accord = noms.length > 1 ? 'comprennent' : 'comprend';
  const voile = document.createElement('div');
  voile.id = 'voile-renaissance';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-renaissance';
  modale.innerHTML = `
    <div class="crane-mort">🕯️</div>
    <h2>Le réveil</h2>
    <p>${echapper(nom)} retourne en ville et se repose — un sommeil noir, sans rêves, long comme une saison.</p>
    <p>Au réveil, la bourse est plus légère, le sac aussi… et pourtant les rues semblent plus jeunes, les visages moins marqués,
    les affiches de la Guilde annoncent des contrats d'il y a longtemps. Alors ${echapper(nom)} ${accord} :
    <strong>mourir n'est pas une fin — c'est un retour dans le passé</strong>, un niveau en arrière,
    au temps où le destin pouvait encore s'écrire autrement.</p>
    <p>Les souvenirs, eux, ont fait le voyage : chaque compétence apprise, chaque métier maîtrisé, chaque leçon durement payée.
    Cette fois, l'histoire ne se répétera pas. Cette fois, elle sera mieux écrite.</p>`;
  const bouton = document.createElement('button');
  bouton.className = 'btn-principal';
  bouton.id = 'renaissance-fermer';
  bouton.textContent = '🌅 Se relever et réécrire l’histoire';
  bouton.addEventListener('click', () => voile.remove());
  modale.appendChild(bouton);
  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// Métiers de récolte (v12) : mineur / tanneur / tisseur montent en
// niveau à force de pratiquer — meilleures quantités, meilleures prises.
// =====================================================================
function metierDe(p, idMetier) {
  if (!p.metiers) p.metiers = {};
  if (!p.metiers[idMetier]) p.metiers[idMetier] = { niveau: 1, xp: 0 };
  return p.metiers[idMetier];
}

function gagnerXpMetier(p, idMetier, xp) {
  const m = metierDe(p, idMetier);
  if (m.niveau >= NIVEAU_MAX_METIER) return false;
  m.xp += xp;
  let monte = false;
  while (m.niveau < NIVEAU_MAX_METIER && m.xp >= seuilXpMetier(m.niveau)) {
    m.xp -= seuilXpMetier(m.niveau);
    m.niveau++;
    monte = true;
  }
  if (monte) {
    afficherToast(`${METIERS[idMetier].emoji} ${p.nom} passe ${METIERS[idMetier].nom} niveau ${m.niveau} — ses récoltes s'enrichissent !`);
  }
  return monte;
}

// Devine la classe d'un héros d'avant la v8 : le modèle dont il connaît
// le plus de compétences (au moins 2), sinon Aventurier.
function infererClasse(p) {
  let meilleur = 'aventurier';
  let score = 1;
  const connues = p.grimoire && p.grimoire.length ? p.grimoire : (p.competences || []);
  MODELES.forEach((m) => {
    const n = m.competences.filter((id) => connues.includes(id)).length;
    if (n > score) { score = n; meilleur = m.id; }
  });
  return meilleur;
}

function sauvegarderLocal() {
  try {
    localStorage.setItem(CLE_STOCKAGE_PROFILS, JSON.stringify(etat.profils));
    if (etat.actifId) localStorage.setItem(CLE_STOCKAGE_ACTIF, etat.actifId);
  } catch (e) { /* stockage indisponible : la partie continue en mémoire */ }
}

function sauvegarder(p) {
  sauvegarderLocal();
  if (p && typeof planifierSauvegardeCloud === 'function') planifierSauvegardeCloud(p);
}

function donneesCloud(p) {
  return {
    nom: p.nom, avatar: p.avatar, race: p.race, stats: p.stats, niveau: p.niveau, xp: p.xp,
    pointsEnAttente: p.pointsEnAttente, competencesEnAttente: p.competencesEnAttente,
    competences: p.competences, grimoire: p.grimoire, po: p.po, inventaire: p.inventaire,
    equipement: p.equipement, hp: p.hp, mp: p.mp,
    explorations: p.explorations, bossVaincus: p.bossVaincus,
    compteurs: p.compteurs, familiers: p.familiers, familier: p.familier,
    hautsFaits: p.hautsFaits, titre: p.titre, tourMax: p.tourMax, quetes: p.quetes,
    donjons: p.donjons, classe: p.classe, maitrise: p.maitrise, rangs: p.rangs,
    // v19 : la spécialité voyage avec le héros — code de sauvegarde, taverne,
    // fiches publiques et expéditions doivent tous la connaître.
    sousClasse: p.sousClasse, voie: p.voie, eveil: p.eveil, sceaux: p.sceaux,
    versionClasses: p.versionClasses,
    tourBoss: p.tourBoss, metiers: p.metiers, metierPrincipal: p.metierPrincipal,
    ascensions: p.ascensions, histoiresVues: p.histoiresVues,
  };
}

// =====================================================================
// Hauts faits et contrats de guilde
// =====================================================================
function verifierHautsFaits(p) {
  HAUTS_FAITS.forEach((hautFait) => {
    if (p.hautsFaits.includes(hautFait.id)) return;
    if (!hautFait.cond(p)) return;
    p.hautsFaits.push(hautFait.id);
    if (p.distant) return;
    annoncerDeblocage({
      emoji: hautFait.emoji,
      titre: `Haut fait : ${hautFait.nom}`,
      texte: `${hautFait.desc} — titre débloqué : « ${hautFait.titre} » (à porter depuis la fiche du héros).`,
    });
  });
}

// Fait avancer les contrats de guilde du type donné.
function progresserQuete(p, type, n = 1) {
  if (!p.quetes || p.quetes.date !== new Date().toISOString().slice(0, 10)) {
    p.quetes = genererQuetesDuJour(p);
  }
  p.quetes.liste.forEach((quete) => {
    if (quete.type !== type || quete.reclamee || quete.fait >= quete.requis) return;
    quete.fait = Math.min(quete.requis, quete.fait + n);
    if (quete.fait >= quete.requis) {
      afficherToast(`🏰 Contrat rempli : ${quete.texte} ! Passez à la Guilde.`);
    }
  });
}

function nouveauPersonnage(base) {
  const p = {
    version: 2,
    type: 'joueur',
    id: uid(),
    nom: base.nom,
    avatar: base.avatar,
    race: base.race || 'humain',
    classe: base.classe || 'aventurier',
    stats: { ...base.stats },
    niveau: 1,
    xp: 0,
    pointsEnAttente: 0,
    competencesEnAttente: 0,
    competences: [...base.competences],
    po: 60,
    inventaire: [{ id: 'potion-soin', qte: 2 }],
    equipement: { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null },
    explorations: {},
    bossVaincus: [],
    cloud: null,
    hp: 0, mp: 0, maxHp: 0, maxMp: 0,
    statuts: [], cooldowns: {}, defense: false, ko: false,
  };
  normaliserPerso(p);
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  return p;
}

// Recalcule les maximums (équipement/niveau) et borne les valeurs courantes.
function bornerVie(p) {
  if (!p.distant) {
    p.maxHp = maxHpDe(p);
    p.maxMp = maxMpDe(p);
  }
  p.hp = Math.max(0, Math.min(p.maxHp, Math.round(p.hp)));
  p.mp = Math.max(0, Math.min(p.maxMp, Math.round(p.mp)));
}

// Apprend une compétence : elle entre au grimoire, et devient active
// immédiatement s'il reste une place parmi les 8.
function apprendreCompetence(p, id, prioritaire) {
  if (!p.grimoire.includes(id)) p.grimoire.push(id);
  if (p.competences.includes(id)) return;
  if (p.competences.length < MAX_COMPETENCES_ACTIVES) {
    p.competences.push(id);
    return;
  }
  // v18 : une compétence de CLASSE ne doit jamais rester à la porte parce
  // que la barre est pleine des choix de création — elle prend la place
  // d'une commune, qui reste au grimoire et se rééquipe d'un clic.
  if (!prioritaire) return;
  const aCeder = p.competences.find((autre) => !(COMPETENCES[autre] || {}).classe);
  if (!aCeder) return;
  p.competences[p.competences.indexOf(aCeder)] = id;
}

// Débloque les compétences de classe atteintes (signature au niveau 1,
// puis une aux niveaux 5, 10 et 15 — 4 par classe au total).
function debloquerCompetencesClasse(p, annoncer) {
  Object.entries(COMPETENCES).forEach(([id, comp]) => {
    const deMaClasse = comp.classe && comp.classe === p.classe;
    const deMaSousClasse = comp.sousClasse && comp.sousClasse === p.sousClasse;
    const deMaVoie = comp.voie && comp.voie === p.voie;
    const deMonEveil = comp.eveil && p.eveil && comp.eveil === p.eveil.id;
    if ((!deMaClasse && !deMaSousClasse && !deMaVoie && !deMonEveil) || p.grimoire.includes(id)) return;
    if ((comp.niveauRequis || 1) > p.niveau) return;
    // Les compétences du niveau 1 (signature et bases) s'imposent dans la
    // barre ; celles des paliers suivants respectent l'agencement choisi
    // par le joueur et attendent sagement au grimoire si tout est plein.
    apprendreCompetence(p, id, (comp.niveauRequis || 1) <= 1);
    if (annoncer && !p.distant) {
      annoncerDeblocage({
        emoji: comp.emoji,
        titre: `Compétence de classe : ${comp.nom}`,
        texte: `${comp.desc}${p.competences.includes(id)
          ? ''
          : ' — vos 8 emplacements actifs sont pleins : elle vous attend dans le grimoire (Profil → ⚡ Compétences).'}`,
      });
    }
  });
}

// Gagne de l'XP ; une montée de niveau soigne entièrement (le fameux « ding »).
// Ce que ce héros gagnera VRAIMENT : la réduction globale (v11 : −65 %)
// puis ses bonus personnels (race, familier, panoplie). C'est LA source
// de vérité — gagnerXp l'applique et les écrans de butin l'affichent,
// pour que l'annonce et le gain soient exactement le même nombre.
function xpReelle(p, xp) {
  xp = Math.max(1, Math.round(xp * 0.35));
  if (p.race === 'humain') xp = Math.round(xp * 1.1); // Ambition
  const familier = familierActif(p);
  if (familier && familier.bonus.xpBonus) xp = Math.round(xp * (1 + familier.bonus.xpBonus));
  const sets = bonusSetActifs(p);
  if (sets.xpBonus) xp = Math.round(xp * (1 + sets.xpBonus));
  // Les reliques portent parfois un bonus d'XP : compté ici, comme son
  // jumeau poBonus l'est dans multiplicateurOr — pas seulement affiché.
  Object.values(p.equipement || {}).forEach((id) => {
    const objet = id && OBJETS[id];
    if (objet && objet.bonus && objet.bonus.xpBonus) xp = Math.round(xp * (1 + objet.bonus.xpBonus));
  });
  // Les passifs de savoir (Voleur, Voie de la Fortune) comptent aussi.
  const passif = typeof passifsDe === 'function' ? (passifsDe(p).xpMult || 1) : 1;
  return Math.max(1, Math.round(xp * passif));
}

// Texte honnête d'un gain partagé : une valeur unique si toute l'équipe
// touche pareil, une fourchette sinon (les bonus varient par héros).
function texteGainXp(membres, xpBase) {
  const gains = membres.map((m) => xpReelle(m, xpBase));
  const min = Math.min(...gains);
  const max = Math.max(...gains);
  return min === max ? `+${formatNombre(min)} XP` : `+${formatNombre(min)} à ${formatNombre(max)} XP`;
}

function texteGainPo(membres, poBase) {
  const gains = membres.map((m) => Math.round(poBase * multiplicateurOr(m)));
  const min = Math.min(...gains);
  const max = Math.max(...gains);
  return min === max ? `+${formatNombre(min)} po` : `+${formatNombre(min)} à ${formatNombre(max)} po`;
}

function gagnerXp(p, xp) {
  const avant = p.niveau;
  p.xp += xpReelle(p, xp);
  const apres = niveauPour(p.xp);
  if (apres > avant) {
    p.pointsEnAttente += pointsCumules(apres) - pointsCumules(avant);
    // Points de maîtrise de la signature (niveaux 3, 6, 9, 12, 15, 18)
    p.maitrise = (p.maitrise || 0) + pointsMaitrisePourNiveau(apres) - pointsMaitrisePourNiveau(avant);
    p.niveau = apres;
    // v18 : monter de niveau n'offre PLUS de compétence gratuite. Hors
    // compétences de classe (automatiques), tout nouveau sort s'achète en
    // grimoire à l'Arcanium — le savoir se paie.
    debloquerCompetencesClasse(p, true);
    annoncerDeblocagesNiveau(p, avant, apres);
    bornerVie(p);
    p.hp = p.maxHp;
    p.mp = p.maxMp;
  }
  return apres - avant;
}

// =====================================================================
// Écran titre : liste des profils
// =====================================================================
function rendreTitre() {
  const zone = el('liste-profils');
  zone.innerHTML = '';
  if (etat.profils.length === 0) {
    const vide = document.createElement('p');
    vide.className = 'aide';
    vide.textContent = 'Aucun héros sur cet appareil pour l’instant. Créez-en un, ou importez-en un avec son code !';
    zone.appendChild(vide);
  }
  etat.profils.forEach((p) => {
    const carte = document.createElement('div');
    carte.className = 'carte-recap carte-profil';
    carte.innerHTML = `
      <div class="recap-entete"><span class="avatar-grand">${p.avatar}</span>
        <div><strong>${echapper(p.nom)}</strong><br>
        <span class="niveau">Niveau ${p.niveau} · 💰 ${formatNombre(p.po)} po${p.cloud ? ' · ☁️ relié au monde' : ''}</span></div>
      </div>`;
    const boutons = document.createElement('div');
    boutons.className = 'rangee-boutons';
    const jouer = document.createElement('button');
    jouer.className = 'btn-principal btn-compact';
    jouer.textContent = p.admin ? '🛠️ Jouer (admin)' : '▶ Jouer';
    jouer.addEventListener('click', () => {
      etat.actifId = p.id;
      etat.equipe = [p.id];
      sauvegarderLocal();
      rendreCarte();
      montrerEcran('ecran-carte');
    });
    boutons.appendChild(jouer);
    boutons.appendChild(boutonConfirmation('🗑 Supprimer', 'Vraiment supprimer ?', () => {
      // Le héros disparaît aussi du monde en ligne (taverne, classement).
      if (typeof supprimerPersonnageCloud === 'function') supprimerPersonnageCloud(p);
      etat.profils = etat.profils.filter((x) => x.id !== p.id);
      if (etat.actifId === p.id) etat.actifId = null;
      sauvegarderLocal();
      rendreTitre();
    }));
    carte.appendChild(boutons);
    zone.appendChild(carte);
  });
}

// =====================================================================
// Création de personnage
// =====================================================================
// v18 : la création accepte un MODE ADMIN — même parcours de A à Z
// (identité, race, classe, caractéristiques, compétences), mais le héros
// qui en naît porte la console de bac à sable.
function demarrerCreation(options = {}) {
  const stats = {};
  Object.keys(CARACS).forEach((cle) => { stats[cle] = STAT_BASE; });
  etat.brouillon = {
    nom: '',
    avatar: options.admin ? '🛠️' : AVATARS[etat.profils.length % AVATARS.length],
    race: 'humain',
    classe: 'aventurier',
    stats,
    competences: new Set(),
    page: 1,
    admin: !!options.admin,
  };
  el('creation-nom').value = '';
  el('creation-recuperation').value = '';
  el('creation-titre').textContent = options.admin
    ? '🛠️ Crée ton héros admin'
    : 'Crée ton héros';
  rendreCreation();
  montrerEcran('ecran-creation');
}

// v15 : la création se déroule en trois pages — identité, race/classe/
// caractéristiques, puis compétences. On avance, on revient, on valide.
const PAGES_CREATION = [
  { num: 1, titre: '1 · Identité' },
  { num: 2, titre: '2 · Race, classe & caractéristiques' },
  { num: 3, titre: '3 · Compétences' },
];

function allerPageCreation(delta) {
  const b = etat.brouillon;
  if (delta > 0 && b.page === 2 && pointsRestants() > 0) {
    afficherToast(`✋ Répartissez d'abord vos ${pointsRestants()} point${pointsRestants() > 1 ? 's' : ''} de caractéristiques.`);
    return;
  }
  b.page = Math.max(1, Math.min(3, b.page + delta));
  rendreCreation();
  window.scrollTo(0, 0);
}

function pointsRestants() {
  const b = etat.brouillon;
  const cles = Object.keys(CARACS);
  const utilises = cles.reduce((somme, cle) => somme + b.stats[cle], 0) - cles.length * STAT_BASE;
  return POINTS_CREATION - utilises;
}

function rendreCreation() {
  const b = etat.brouillon;

  // v18 : bandeau permanent en mode admin — on sait ce qu'on fabrique.
  const ancienBandeau = el('creation-bandeau-admin');
  if (ancienBandeau) ancienBandeau.remove();
  if (b.admin) {
    const bandeau = document.createElement('p');
    bandeau.id = 'creation-bandeau-admin';
    bandeau.className = 'bandeau-admin-creation';
    bandeau.innerHTML = '🛠️ <strong>Création d’un héros admin</strong> — un héros complet, choisi de A à Z, '
      + 'qui recevra en plus la <strong>console de bac à sable</strong> (onglet 🛠️ Admin de son profil) '
      + 'et une bourse de départ bien garnie. Il reste <strong>local par défaut</strong> : c’est vous qui '
      + 'déciderez de le relier au monde en ligne, depuis l’onglet ☁️ Compte.';
    el('creation-etapes').insertAdjacentElement('afterend', bandeau);
  }

  // Pages : une seule visible à la fois, un fil d'étapes en haut.
  document.querySelectorAll('#ecran-creation .page-creation').forEach((page) => {
    page.classList.toggle('cache', Number(page.dataset.page) !== b.page);
  });
  const fil = el('creation-etapes');
  fil.innerHTML = PAGES_CREATION
    .map((etape) => `<span class="etape-creation${etape.num === b.page ? ' etape-active' : ''}${etape.num < b.page ? ' etape-faite' : ''}">${etape.titre}</span>`)
    .join('<span class="etape-fleche">→</span>');
  el('creation-retour').classList.toggle('cache', b.page === 1);
  el('creation-suivant').classList.toggle('cache', b.page === 3);
  el('creation-valider').classList.toggle('cache', b.page !== 3);
  if (b.page === 2 && pointsRestants() > 0) {
    el('creation-suivant').textContent = `Répartis encore ${pointsRestants()} point${pointsRestants() > 1 ? 's' : ''}…`;
  } else {
    el('creation-suivant').textContent = 'Suivant →';
  }

  const zoneAvatars = el('creation-avatars');
  zoneAvatars.innerHTML = '';
  // En mode admin, l'emblème 🛠️ rejoint la grille : sinon il serait
  // choisi par défaut… sans jamais pouvoir être re-sélectionné.
  const avatarsProposes = b.admin ? ['🛠️', ...AVATARS] : AVATARS;
  avatarsProposes.forEach((a) => {
    const btn = document.createElement('button');
    btn.className = 'avatar-choix' + (b.avatar === a ? ' selectionne' : '');
    btn.textContent = a;
    btn.addEventListener('click', () => { b.avatar = a; rendreCreation(); });
    zoneAvatars.appendChild(btn);
  });

  const zoneRaces = el('creation-races');
  zoneRaces.innerHTML = '';
  Object.entries(RACES).forEach(([cle, race]) => {
    const btn = document.createElement('button');
    btn.className = 'btn-choix btn-race' + (b.race === cle ? ' selectionne' : '');
    btn.innerHTML = `${race.emoji} <strong>${race.nom}</strong><span class="race-passif">${race.passif} — ${race.desc}</span>`;
    btn.addEventListener('click', () => { b.race = cle; rendreCreation(); });
    zoneRaces.appendChild(btn);
  });

  const zoneModeles = el('creation-modeles');
  zoneModeles.innerHTML = '';
  MODELES.forEach((m) => {
    const btn = document.createElement('button');
    btn.className = 'btn-choix btn-race' + (b.classe === m.id ? ' selectionne' : '');
    // Le rôle et l'armure font partie du choix : un joueur qui débarque
    // doit savoir qui encaisse, qui soigne et qui frappe — sans cliquer.
    const base = CLASSES_BASE[m.id];
    const categorie = base && CATEGORIES_ARMURE[base.armure];
    const armure = categorie ? ` · ${categorie.emoji} ${categorie.nom}` : '';
    btn.innerHTML = `${m.emoji} <strong>${m.nom}</strong><span class="race-passif">${m.role}${armure}</span>`;
    btn.addEventListener('click', () => {
      b.classe = m.id;
      b.stats = { ...m.stats };
      b.competences = new Set(m.competences);
      rendreCreation();
    });
    zoneModeles.appendChild(btn);
  });
  // Chaque classe apporte sa compétence signature exclusive, améliorable
  // ensuite avec les points de maîtrise.
  const signature = COMPETENCES[CLASSES[b.classe].signature];
  const ancienEncart = el('creation-signature');
  if (ancienEncart) ancienEncart.remove();
  const encartSignature = document.createElement('div');
  encartSignature.id = 'creation-signature';
  encartSignature.className = 'aide encart-signature';
  // L'arbre complet de la classe, chaque compétence avec ses chiffres.
  const arbre = Object.values(COMPETENCES)
    .filter((comp) => comp.classe === b.classe && !comp.signature)
    .sort((a, c) => a.niveauRequis - c.niveauRequis)
    .map((comp) => `<br>🔓 <strong>niv. ${comp.niveauRequis}</strong> — ${comp.emoji} <strong>${comp.nom}</strong> : ${comp.desc}
      <br><span class="encart-chiffres">${detailsCompetence(comp, b.stats).join(' · ')}</span>`)
    .join('');
  encartSignature.innerHTML = `🏅 Signature de ${b.classe === 'aventurier' ? 'l’Aventurier (aucune classe choisie)' : `la classe <strong>${CLASSES[b.classe].nom}</strong>`} :
    ${signature.emoji} <strong>${signature.nom}</strong> — ${signature.desc}
    <br><span class="encart-chiffres">${detailsCompetence(signature, b.stats).join(' · ')}</span>
    ${arbre}
    <br><strong>8 compétences exclusives par classe</strong> (5 dès le niveau 1 — signature et bases —, puis niveaux 5, 10 et 15), améliorables avec les points de maîtrise (+15 % par rang) — en plus des compétences communes à choisir page suivante.`;
  zoneModeles.parentElement.appendChild(encartSignature);

  const restants = pointsRestants();
  el('creation-points').textContent = `${restants} point${restants > 1 ? 's' : ''} à répartir`;
  const zoneStats = el('creation-stats');
  zoneStats.innerHTML = '';
  Object.entries(CARACS).forEach(([cle, c]) => {
    const ligne = document.createElement('div');
    ligne.className = 'ligne-stat';
    ligne.innerHTML = `
      <span class="stat-nom" title="${c.desc}">${c.emoji} ${c.nom}</span>
      <button class="btn-mini" data-action="moins">−</button>
      <span class="stat-valeur">${b.stats[cle]}</span>
      <button class="btn-mini" data-action="plus">+</button>
      <span class="stat-desc">${c.desc}</span>`;
    ligne.querySelector('[data-action="moins"]').disabled = b.stats[cle] <= STAT_BASE;
    ligne.querySelector('[data-action="plus"]').disabled = restants <= 0 || b.stats[cle] >= STAT_MAX_CREATION;
    ligne.querySelector('[data-action="moins"]').addEventListener('click', () => { b.stats[cle]--; rendreCreation(); });
    ligne.querySelector('[data-action="plus"]').addEventListener('click', () => { b.stats[cle]++; rendreCreation(); });
    zoneStats.appendChild(ligne);
  });

  el('creation-nb-comp').textContent = `${b.competences.size} / ${NB_COMPETENCES} choisies`;
  const zoneComp = el('creation-competences');
  zoneComp.innerHTML = '';
  Object.entries(CATEGORIES).forEach(([catCle, catNom]) => {
    const titre = document.createElement('h4');
    titre.className = 'titre-categorie';
    titre.textContent = catNom;
    zoneComp.appendChild(titre);
    const grille = document.createElement('div');
    grille.className = 'grille-competences';
    // v17 : le choix ne porte que sur le POOL COMMUN — les compétences de
    // classe (signature, voies, arbre) arrivent automatiquement avec la classe.
    Object.entries(COMPETENCES)
      .filter(([, comp]) => comp.categorie === catCle && !comp.classe)
      .forEach(([id, comp]) => {
        grille.appendChild(carteCompetence(id, comp, {
          selectionnee: b.competences.has(id),
          stats: b.stats,
          cliquable: true,
          surClic: () => {
            if (b.competences.has(id)) b.competences.delete(id);
            else if (b.competences.size < NB_COMPETENCES) b.competences.add(id);
            rendreCreation();
          },
        }));
      });
    zoneComp.appendChild(grille);
  });

  el('creation-valider').disabled = !(restants === 0 && b.competences.size === NB_COMPETENCES);
  el('creation-valider').textContent = restants > 0
    ? `Répartis encore ${restants} point${restants > 1 ? 's' : ''}`
    : (b.competences.size < NB_COMPETENCES
      ? `Choisis encore ${NB_COMPETENCES - b.competences.size} compétence${NB_COMPETENCES - b.competences.size > 1 ? 's' : ''}`
      : 'Valider ce héros ✔');
}

function carteCompetence(id, comp, options = {}) {
  const carte = document.createElement('div');
  carte.className = 'carte-competence'
    + (comp.signature ? ' carte-signature' : '')
    + (options.selectionnee ? ' selectionnee' : '')
    + (options.cliquable ? ' cliquable' : '');
  // Détails chiffrés calculés avec les stats fournies (héros ou brouillon).
  const infos = detailsCompetence(comp, options.stats || {}, options.rang || 0);
  let badge = '';
  if (comp.signature) {
    badge = ` <span class="badge-signature">🏅 Signature${options.rang ? ` · rang ${options.rang}/${RANG_SIGNATURE_MAX}` : ''}</span>`;
  } else if (comp.classe) {
    badge = ` <span class="badge-signature">🏅 Classe · niv. ${comp.niveauRequis}${options.rang ? ` · rang ${options.rang}/${RANG_SIGNATURE_MAX}` : ''}</span>`;
  }
  carte.innerHTML = `
    <div class="comp-entete">${comp.emoji} <strong>${comp.nom}</strong>${badge}</div>
    <div class="comp-desc">${comp.desc}</div>
    <div class="comp-infos">${infos.join(' · ')}</div>`;
  if (options.cliquable && options.surClic) rendreCliquable(carte, options.surClic);
  return carte;
}

// Bouton d'investissement d'un point de maîtrise sur une compétence de classe.
function ajouterBlocSignature(p, id, comp, carte) {
  if (!comp.classe) return;
  const rang = rangDe(p, id);
  if (rang >= RANG_SIGNATURE_MAX) return;
  const monter = document.createElement('button');
  monter.className = p.maitrise > 0 ? 'btn-principal btn-compact' : 'btn-choix btn-compact';
  const texteInitial = p.maitrise > 0
    ? `🏅 Passer au rang ${rang + 1} (+15 % de puissance)`
    : `🏅 Rang ${rang}/${RANG_SIGNATURE_MAX} — point de maîtrise au niveau ${SEUILS_MAITRISE.find((seuil) => seuil > p.niveau) || 18}`;
  monter.textContent = texteInitial;
  monter.disabled = p.maitrise <= 0;
  // v15.1 : deux clics — le premier demande confirmation, le second investit.
  let enConfirmation = false;
  monter.addEventListener('click', () => {
    if (p.maitrise <= 0 || rangDe(p, id) >= RANG_SIGNATURE_MAX) return;
    if (!enConfirmation) {
      enConfirmation = true;
      monter.textContent = `❓ Confirmer : rang ${rangDe(p, id) + 1} contre 1 point de maîtrise`;
      setTimeout(() => {
        if (enConfirmation && monter.isConnected) {
          enConfirmation = false;
          monter.textContent = texteInitial;
        }
      }, 5000);
      return;
    }
    p.maitrise--;
    p.rangs[id] = rangDe(p, id) + 1;
    sauvegarder(p);
    afficherToast(`🏅 ${comp.nom} passe au rang ${p.rangs[id]} : +${p.rangs[id] * 15} % de puissance !`);
    rendreHeros();
    rendreTopbar();
  });
  carte.appendChild(monter);
}

// v15 : avant de créer le héros, une fenêtre confirme le choix du code
// de récupération — qu'on en ait mis un… ou pas.
function validerCreation() {
  const code = el('creation-recuperation').value.trim().toLowerCase();
  const ancien = document.getElementById('voile-confirmation-code');
  if (ancien) ancien.remove();

  const voile = document.createElement('div');
  voile.id = 'voile-confirmation-code';
  const modale = document.createElement('div');
  modale.className = 'modale-joueur modale-confirmation-code';
  modale.innerHTML = code
    ? `<h2>🗝️ Votre code de récupération</h2>
      <p>Vous avez choisi le code : <strong class="code-affiche">${echapper(code)}</strong></p>
      <p>Notez-le précieusement : il suffira de le taper dans « Reprendre un héros (code) » sur n'importe quel
      appareil pour retrouver ce héros. Toute personne qui le connaît pourra en faire autant — gardez-le pour vous.</p>`
    : `<h2>🗝️ Aucun code de récupération</h2>
      <p>Vous partez <strong>sans code de récupération</strong>. Si vous perdez cet appareil, seul le
      <strong>code de sauvegarde</strong> (affiché sur la fiche du héros) permettra de le retrouver — pensez à le noter.</p>
      <p>Vous pourrez aussi ajouter un code de récupération plus tard, depuis la fiche du héros.</p>`;
  const boutons = document.createElement('div');
  boutons.className = 'rangee-boutons';
  const confirmer = document.createElement('button');
  confirmer.className = 'btn-principal';
  confirmer.id = 'confirmation-code-valider';
  confirmer.textContent = code ? '✔ C’est noté — créer le héros' : '✔ Continuer sans code';
  confirmer.addEventListener('click', () => {
    voile.remove();
    finaliserCreation(code);
  });
  const annuler = document.createElement('button');
  annuler.className = 'btn-choix';
  annuler.id = 'confirmation-code-annuler';
  annuler.textContent = code ? '✖ Modifier le code' : '🗝️ Ajouter un code';
  annuler.addEventListener('click', () => {
    voile.remove();
    etat.brouillon.page = 1;
    rendreCreation();
    el('creation-recuperation').focus();
  });
  boutons.appendChild(confirmer);
  boutons.appendChild(annuler);
  modale.appendChild(boutons);
  voile.appendChild(modale);
  document.body.appendChild(voile);
}

function finaliserCreation(codeRecuperation) {
  const b = etat.brouillon;
  const nom = el('creation-nom').value.trim()
    || (b.admin ? `Admin ${etat.profils.filter((x) => x.admin).length + 1}` : `Héros ${etat.profils.length + 1}`);
  const p = nouveauPersonnage({ nom, avatar: b.avatar, race: b.race, classe: b.classe, stats: b.stats, competences: [...b.competences] });
  if (codeRecuperation) p.recuperation = codeRecuperation;
  // v18 : le héros admin naît comme les autres — mais avec sa console et
  // sa bourse de bac à sable. Il reste LOCAL tant qu'on ne le relie pas
  // soi-même au monde (bouton de l'onglet ☁️ Compte).
  if (b.admin) {
    p.admin = true;
    p.relieAuMonde = false;
    p.po = 100000;
  }
  etat.profils.push(p);
  etat.actifId = p.id;
  etat.equipe = [p.id];
  sauvegarderLocal();
  if (!p.admin && typeof creerPersonnageCloud === 'function') creerPersonnageCloud(p);
  if (p.admin) {
    afficherToast(`🛠️ ${p.avatar} ${p.nom} — héros admin créé ! Sa console vous attend : Profil → onglet 🛠️ Admin.`);
  } else {
    afficherToast(`${p.avatar} ${p.nom} rejoint les Royaumes de Valciel !`);
  }
  rendreCarte();
  montrerEcran('ecran-carte');
}

// =====================================================================
// Héros admin (v18) : un héros créé de A à Z comme les autres, doté
// d'une console de bac à sable rangée par thèmes. Local par défaut —
// c'est son joueur qui décide de le relier (ou non) au monde en ligne.
// =====================================================================

// Fixe directement le niveau (console d'admin), avec tous les déblocages.
function adminFixerNiveau(p, n) {
  n = Math.max(1, Math.min(NIVEAU_MAX, n));
  const avant = p.niveau;
  p.xp = seuilXp(n);
  p.niveau = n;
  if (n > avant) {
    p.pointsEnAttente += pointsCumules(n) - pointsCumules(avant);
    p.maitrise = (p.maitrise || 0) + pointsMaitrisePourNiveau(n) - pointsMaitrisePourNiveau(avant);
    debloquerCompetencesClasse(p, false);
  }
  bornerVie(p);
  p.hp = p.maxHp;
  p.mp = p.maxMp;
}

// Équipe le héros avec ce que le catalogue offre de mieux à son niveau.
// Les pièces remplacées retournent au sac, et les deux accessoires sont
// DISTINCTS (deux fois le même gonflerait artificiellement les panoplies).
function adminEquiperAuMieux(p) {
  const poids = (o) => (o.niveau || 1) * (MULT_RARETE_CRAFT[rareteDe(o)] || 1);
  const parSlot = {};
  const accessoires = [];
  Object.entries(OBJETS).forEach(([id, o]) => {
    if (o.type !== 'equipement' || (o.niveau || 1) > p.niveau) return;
    if (o.slot === 'accessoire') { accessoires.push(id); return; }
    const meilleur = parSlot[o.slot];
    if (!meilleur || poids(o) > poids(OBJETS[meilleur])) parSlot[o.slot] = id;
  });
  accessoires.sort((a, b) => poids(OBJETS[b]) - poids(OBJETS[a]));
  parSlot.acc1 = accessoires[0];
  parSlot.acc2 = accessoires[1];

  Object.entries(parSlot).forEach(([slot, id]) => {
    if (!id) return;
    const porte = p.equipement[slot];
    if (porte && porte !== id) ajouterObjet(p, porte);
    p.equipement[slot] = id;
  });
  bornerVie(p);
  p.hp = p.maxHp;
  p.mp = p.maxMp;
}

function rendreConsoleAdmin(zone, p) {
  const entete = document.createElement('div');
  entete.className = 'panneau panneau-admin';
  entete.innerHTML = `<h3>🛠️ Console d'admin</h3>
    <p class="aide">Héros bac à sable : modifiez tout, testez tout, cassez tout.
    ${p.cloud
    ? '☁️ Ce héros est <strong>relié au monde</strong> : ses statistiques apparaissent à la taverne et dans les classements.'
    : '📴 Ce héros est <strong>local</strong> : rien n’est publié en ligne. Le bouton « Relier au monde » vous attend dans l’onglet ☁️ Compte.'}</p>`;
  zone.appendChild(entete);

  // Rafraîchit tout ce qui peut avoir changé, puis annonce le résultat.
  // (les hauts faits déclenchés en cascade restent muets : un simple toast
  // suffit à la console.)
  const appliquer = (libelle, sansRecalcul) => {
    // Sans ce garde-fou, « Effacer les hauts faits » les re-décernerait
    // tous dans le même clic (leurs conditions sont toujours remplies).
    if (!sansRecalcul) sansAnnonces(() => verifierHautsFaits(p));
    bornerVie(p);
    sauvegarder(p);
    afficherToast(`🛠️ ${libelle} — fait.`);
    rendreHeros();
    rendreTopbar();
  };

  // Fabrique une section : un panneau, sa note, et sa rangée de boutons.
  const section = (titre, note, actions) => {
    const bloc = document.createElement('div');
    bloc.className = 'panneau panneau-admin';
    bloc.innerHTML = `<h4 class="titre-admin">${titre}</h4>${note ? `<p class="aide">${note}</p>` : ''}`;
    const rangee = document.createElement('div');
    rangee.className = 'rangee-boutons';
    actions.forEach(([libelle, action, danger, sansRecalcul]) => {
      const btn = document.createElement('button');
      btn.className = `btn-choix btn-compact${danger ? ' btn-danger' : ''}`;
      btn.textContent = libelle;
      // Les actions d'admin sont muettes : pas de pluie de célébrations.
      btn.addEventListener('click', () => { sansAnnonces(action); appliquer(libelle, sansRecalcul); });
      rangee.appendChild(btn);
    });
    bloc.appendChild(rangee);
    zone.appendChild(bloc);
    return bloc;
  };

  // Champ numérique + bouton d'application (niveau exact, or exact…).
  const ligneValeur = (bloc, id, libelle, placeholder, surValidation) => {
    const ligne = document.createElement('div');
    ligne.className = 'rangee-boutons';
    const champ = document.createElement('input');
    champ.id = id;
    champ.type = 'number';
    champ.className = 'champ-comptoir large';
    champ.placeholder = placeholder;
    const btn = document.createElement('button');
    btn.className = 'btn-choix btn-compact';
    btn.textContent = libelle;
    btn.addEventListener('click', () => {
      const valeur = parseInt(champ.value, 10);
      if (Number.isNaN(valeur)) { afficherToast('🛠️ Entrez un nombre.'); return; }
      sansAnnonces(() => surValidation(valeur));
      appliquer(libelle);
    });
    ligne.appendChild(champ);
    ligne.appendChild(btn);
    bloc.appendChild(ligne);
  };

  // ----- 📈 Progression -----
  const blocNiveau = section('📈 Progression', 'Niveau, caractéristiques et maîtrise.', [
    ['⬆️ Niveau +1', () => adminFixerNiveau(p, p.niveau + 1)],
    ['⬆️ +5', () => adminFixerNiveau(p, p.niveau + 5)],
    ['⬆️ +10', () => adminFixerNiveau(p, p.niveau + 10)],
    [`🌟 Niveau ${NIVEAU_MAX}`, () => adminFixerNiveau(p, NIVEAU_MAX)],
    ['⬇️ Niveau −1', () => adminFixerNiveau(p, p.niveau - 1)],
    ['💪 +5 à toutes les caracs', () => { Object.keys(CARACS).forEach((cle) => { p.stats[cle] += 5; }); }],
    ['🎯 +10 points à répartir', () => { p.pointsEnAttente += 10; }],
    ['🏅 +5 points de maîtrise', () => { p.maitrise = (p.maitrise || 0) + 5; }],
    ['🏅 Signatures au rang max', () => {
      p.grimoire.forEach((id) => { if (COMPETENCES[id] && COMPETENCES[id].classe) p.rangs[id] = RANG_SIGNATURE_MAX; });
    }],
    ['↺ Caracs au minimum', () => {
      Object.keys(CARACS).forEach((cle) => { p.stats[cle] = STAT_BASE; });
      p.pointsEnAttente = POINTS_CREATION + pointsCumules(p.niveau);
    }, true],
  ]);
  ligneValeur(blocNiveau, 'admin-niveau', '📈 Fixer le niveau', `Niveau exact (1-${NIVEAU_MAX})`,
    (v) => adminFixerNiveau(p, v));

  // ----- 💰 Richesse et objets -----
  const blocOr = section('💰 Richesse & objets', 'Bourse, matériaux, potions et équipement.', [
    ['💰 +1 000 po', () => { p.po += 1000; }],
    ['💰 +10 000 po', () => { p.po += 10000; }],
    ['💰 +100 000 po', () => { p.po += 100000; }],
    ['⛏️ Tous les matériaux ×25', () => { Object.entries(OBJETS).forEach(([id, o]) => { if (o.type === 'materiau') ajouterObjet(p, id, 25); }); }],
    ['⛏️ Matériaux ×99', () => { Object.entries(OBJETS).forEach(([id, o]) => { if (o.type === 'materiau') ajouterObjet(p, id, 99); }); }],
    ['🧪 Toutes les potions ×10', () => { Object.entries(OBJETS).forEach(([id, o]) => { if (o.type === 'consommable') ajouterObjet(p, id, 10); }); }],
    ['🛡️ S’équiper au mieux', () => adminEquiperAuMieux(p)],
    ['🧹 Vider le sac', () => { p.inventaire = []; }, true],
    ['🧹 Tout déséquiper', () => {
      Object.keys(p.equipement).forEach((slot) => {
        if (p.equipement[slot]) ajouterObjet(p, p.equipement[slot]);
        p.equipement[slot] = null;
      });
    }, true],
  ]);
  ligneValeur(blocOr, 'admin-or', '💰 Fixer l’or', 'Or exact', (v) => { p.po = Math.max(0, v); });

  // Donner n'importe quel objet, par nom ou par identifiant.
  const ligneObjet = document.createElement('div');
  ligneObjet.className = 'rangee-boutons';
  const champ = document.createElement('input');
  champ.id = 'admin-objet';
  champ.placeholder = 'Nom ou id d’objet (ex : Lame du Firmament)';
  champ.className = 'champ-comptoir large champ-admin-objet';
  const chercherEtDonner = (qte) => {
    const requete = champ.value.trim().toLowerCase();
    if (!requete) return;
    const trouve = OBJETS[requete]
      ? [requete, OBJETS[requete]]
      : Object.entries(OBJETS).find(([, o]) => o.nom.toLowerCase().includes(requete));
    if (!trouve) { afficherToast(`🛠️ Aucun objet ne correspond à « ${champ.value} ».`); return; }
    ajouterObjet(p, trouve[0], qte);
    sauvegarder(p);
    afficherToast(`🛠️ ${trouve[1].emoji} ${trouve[1].nom} ×${qte} ajouté au sac.`);
    rendreTopbar();
  };
  [[1, '🎁 Donner ×1'], [10, '🎁 ×10'], [99, '🎁 ×99']].forEach(([qte, libelle]) => {
    const btn = document.createElement('button');
    btn.className = 'btn-choix btn-compact';
    btn.textContent = libelle;
    btn.addEventListener('click', () => chercherEtDonner(qte));
    ligneObjet.appendChild(btn);
  });
  ligneObjet.insertBefore(champ, ligneObjet.firstChild);
  blocOr.appendChild(ligneObjet);

  // ----- ⚡ Compétences -----
  section('⚡ Compétences', 'Le grimoire, sans passer par la caisse de l’Arcanium.', [
    ['📚 Toutes les compétences', () => {
      Object.keys(COMPETENCES).forEach((id) => {
        if (!COMPETENCES[id].classe || COMPETENCES[id].classe === p.classe) apprendreCompetence(p, id);
      });
    }],
    ['✨ Toutes les communes', () => {
      Object.keys(COMPETENCES).forEach((id) => { if (!COMPETENCES[id].classe) apprendreCompetence(p, id); });
    }],
    ['🏅 Toutes celles de ma classe', () => {
      Object.keys(COMPETENCES).forEach((id) => { if (COMPETENCES[id].classe === p.classe) apprendreCompetence(p, id); });
    }],
    ['🐾 Tous les sorts d’invocation', () => {
      Object.entries(COMPETENCES).forEach(([id, c]) => { if (c.type === 'invocation') apprendreCompetence(p, id); });
    }],
    ['↺ Vider le grimoire', () => {
      p.grimoire = [...p.competences];
      p.rangs = {};
    }, true],
  ]);

  // ----- 🌍 Monde et déblocages -----
  section('🌍 Monde & déblocages', 'Boss, difficultés, histoires, donjons et records de tours.', [
    ['👑 Tous les boss de zone vaincus', () => {
      p.bossVaincus = ZONES.map((z) => z.id);
      ZONES.forEach((z) => { p.explorations[z.id] = Math.max(p.explorations[z.id] || 0, 10); });
    }],
    ['🗺️ +10 explorations partout', () => {
      ZONES.forEach((z) => { p.explorations[z.id] = (p.explorations[z.id] || 0) + 10; });
    }],
    ['📜 Toutes les histoires découvertes', () => {
      p.histoiresVues = {};
      Object.entries(HISTOIRES_ZONES).forEach(([idZone, liste]) => {
        p.histoiresVues[idZone] = liste.map((_, i) => i);
      });
    }],
    ['📖 Tous les donjons terminés', () => {
      DONJONS.forEach((d) => {
        p.donjons[d.id] = p.donjons[d.id] || { fini: 0, checkpoint: null, drapeaux: {} };
        p.donjons[d.id].fini = Math.max(1, p.donjons[d.id].fini || 0);
        p.donjons[d.id].checkpoint = null;
      });
    }],
    ['🗼 Records de tours au max', () => {
      p.tourMax = Math.max(p.tourMax || 0, 25);
      p.tourBoss = { normal: 10, heroique: 10, cauchemar: 10 };
    }],
    ['↺ Effacer boss & explorations', () => {
      p.bossVaincus = [];
      p.explorations = {};
      etat.menaces = {};
    }, true],
    ['↺ Oublier les histoires', () => { p.histoiresVues = {}; }, true],
  ]);

  // ----- 🧰 Métiers -----
  section('🧰 Métiers de récolte', 'Niveaux de métier et sous-classe de récolteur.', [
    ['🧰 Tous au maximum', () => {
      Object.keys(METIERS).forEach((id) => { metierDe(p, id).niveau = NIVEAU_MAX_METIER; metierDe(p, id).xp = 0; });
    }],
    ...Object.entries(METIERS).map(([id, m]) => [`${m.emoji} Devenir ${m.nom}`, () => { p.metierPrincipal = id; }]),
    ['↺ Réinitialiser les métiers', () => {
      p.metiers = {};
      p.metierPrincipal = null;
      Object.keys(METIERS).forEach((id) => { p.metiers[id] = { niveau: 1, xp: 0 }; });
    }, true],
  ]);

  // ----- 🏅 Collections -----
  section('🏅 Collections', 'Familiers, hauts faits et titres.', [
    ['🐾 Tous les familiers', () => { p.familiers = Object.keys(FAMILIERS); }],
    ['🏅 Tous les hauts faits', () => { p.hautsFaits = HAUTS_FAITS.map((h) => h.id); }],
    ['↺ Effacer les hauts faits', () => { p.hautsFaits = []; p.titre = null; }, true, true],
    ['↺ Renvoyer les familiers', () => { p.familiers = []; p.familier = null; }, true],
  ]);

  // ----- ❤️ Vie et contrats -----
  section('❤️ Vie, combat & contrats', 'De quoi tester les situations extrêmes.', [
    ['❤️ Soin complet', () => { p.hp = p.maxHp; p.mp = p.maxMp; }],
    ['🩸 Tomber à 1 PV', () => { p.hp = 1; }],
    ['💧 Vider le mana', () => { p.mp = 0; }],
    ['💧 Mana plein', () => { p.mp = p.maxMp; }],
    ['📜 Contrats du jour remplis', () => { p.quetes.liste.forEach((q) => { q.fait = q.requis; }); }],
    ['🔄 Régénérer les contrats', () => { p.quetes = genererQuetesDuJour(p); }],
  ]);

  // ----- 🧪 Tests d'interface -----
  section('🧪 Tests d’interface', 'Pour vérifier les fenêtres et les alertes sans jouer des heures.', [
    ['🎉 Tester un popup de déblocage', () => {
      // Celui-ci doit s'afficher : on force la sortie de la sourdine.
      setTimeout(() => annoncerDeblocage({
        emoji: '🎉',
        titre: 'Test de déblocage',
        texte: 'Voici à quoi ressemble une annonce de déblocage. Tout va bien.',
      }), 0);
    }],
    ['🎊 Tester une file de 3 popups', () => {
      setTimeout(() => {
        ['🥇', '🥈', '🥉'].forEach((emoji, i) => annoncerDeblocage({
          emoji,
          titre: `Déblocage de test n° ${i + 1}`,
          texte: 'Vérifiez le compteur « encore N » et le bouton « Tout fermer ».',
        }));
      }, 0);
    }],
    ['⚠️ Armer une menace de boss', () => {
      const dispo = ZONES.filter((z) => p.niveau >= z.niveauMin);
      const z = dispo[dispo.length - 1] || ZONES[0];
      etat.menaces = etat.menaces || {};
      etat.menaces[z.id] = { compteur: 0, declencheA: 1 };
      afficherToast(`⚠️ Menace armée sur ${z.nom} : le boss surgira à la prochaine exploration.`);
    }],
  ]);

  // ----- ⚠️ Zone rouge -----
  const blocRouge = document.createElement('div');
  blocRouge.className = 'panneau panneau-admin panneau-admin-rouge';
  blocRouge.innerHTML = `<h4 class="titre-admin">⚠️ Zone rouge</h4>
    <p class="aide">Renoncer au statut d'admin rend ce héros définitivement ordinaire : la console disparaît,
    et il se synchronise avec le monde comme tous les autres. Irréversible.</p>`;
  blocRouge.appendChild(boutonConfirmation(
    '🎭 Renoncer au statut d’admin',
    'Vraiment ? Ce héros deviendra ordinaire',
    () => {
      delete p.admin;
      delete p.relieAuMonde;
      ongletHeros = 'apercu';
      sauvegarder(p);
      afficherToast('🎭 Ce héros est désormais un aventurier comme les autres.');
      rendreHeros();
      rendreTopbar();
    },
  ));
  zone.appendChild(blocRouge);
}

// =====================================================================
// Fiche du héros : stats, compétences, équipement, inventaire, code
// =====================================================================
// v15.1 : brouillons de la fiche — la répartition de caractéristiques et
// le choix d'une nouvelle compétence attendent une CONFIRMATION.
let brouillonRepartition = null; // { persoId, points: { for: 1, ... } }
let ongletHeros = 'apercu'; // v17 : onglet actif de la fiche du héros

// v21 : le bandeau des passifs. Il liste ce que le héros gagne VRAIMENT
// de sa classe, de sa spécialité, de sa Voie et de son Éveil — la même
// phrase que celle calculée par le moteur, jamais une promesse à part.
function passifsHerosHtml(p) {
  if (typeof textePassifsHeros !== 'function') return '';
  const texte = textePassifsHeros(p);
  if (!texte) return '';
  const sources = [];
  const classe = CLASSES_BASE[p.classe];
  if (classe) sources.push(`${classe.emoji} ${classe.nom}`);
  const sc = sousClasseDe(p);
  if (sc) sources.push(`${sc.emoji} ${sc.nom}`);
  const voie = voieDe(p);
  if (voie) sources.push(`${voie.emoji} ${voie.nom}`);
  const eveil = eveilDe(p);
  if (eveil) sources.push(`${eveil.emoji} ${eveil.nom}`);
  return `<div class="heros-passifs" title="Cumul de vos passifs — c'est exactement ce que le combat applique">
    ✨ <strong>Passifs</strong> <span class="passifs-sources">${sources.join(' + ')}</span>
    <span class="passifs-texte">${texte}</span></div>`;
}

function rendreHeros() {
  const p = persoActif();
  if (!p) return;
  bornerVie(p);
  const s = statsEffectives(p);
  const zone = el('heros-contenu');
  zone.innerHTML = '';

  // --- En-tête ---
  const suivant = p.niveau < NIVEAU_MAX ? seuilXp(p.niveau + 1) : null;
  const base = seuilXp(p.niveau);
  const pctXp = suivant ? Math.min(100, Math.round(((p.xp - base) / (suivant - base)) * 100)) : 100;
  const entete = document.createElement('div');
  entete.className = 'panneau heros-entete';
  const race = raceDe(p);
  const classe = classeDe(p);
  const familier = familierActif(p);
  const titreActif = p.titre ? HAUTS_FAITS.find((h) => h.id === p.titre) : null;
  entete.innerHTML = `
    <span class="avatar-titan">${p.avatar}${familier ? `<span class="familier-avatar" title="${familier.nom}">${familier.emoji}</span>` : ''}</span>
    <div class="heros-identite">
      <h2>${echapper(p.nom)}${titreActif ? ` <span class="titre-heros">${titreActif.titre}</span>` : ''} <span class="niveau">${emojiClasse(p)} ${titreCompletHeros(p)} · niveau ${p.niveau}</span>
        <button id="btn-renommer" class="btn-choix btn-compact btn-renommer" title="Changer le nom de ce héros">✏️ Renommer</button></h2>
      <div id="zone-renommage" class="cache ligne-renommage">
        <input id="champ-renommage" maxlength="16" placeholder="Nouveau nom">
        <button id="btn-valider-renommage" class="btn-choix btn-compact">Valider</button>
      </div>
      <div class="heros-race">${race.emoji} ${race.nom} — <em>${race.passif}</em> : ${race.desc}</div>
      ${passifsHerosHtml(p)}
      <div class="barre xp"><div class="remplissage" style="width:${pctXp}%"></div>
        <span>${suivant ? `${p.xp} / ${suivant} XP` : 'niveau maximum'}</span></div>
      <div class="heros-puissance">⚡ Puissance : <strong>${puissanceDe(p).toLocaleString('fr-FR')}</strong>
        <span class="aide-inline">(caractéristiques + équipement + niveau)</span></div>
      <div class="heros-vitaux">❤️ ${p.hp}/${p.maxHp} PV · 💧 ${p.mp}/${p.maxMp} PM · 💰 ${formatNombre(p.po)} po · 💥 ${Math.round(5 + s.dex + s.crit + (p.race === 'elfe' ? 5 : 0))} % crit. · 🍀 +${Math.round((multChanceDrop(s.cha) - 1) * 100)} % butin${s.tenacite ? ` · 🛡️ ${Math.min(40, s.tenacite)} % tenacite` : ''}${s.celerite ? ` · 💨 ${Math.min(35, s.celerite)} % celerite` : ''}</div>
    </div>`;
  zone.appendChild(entete);

  // (v18 : la console d'admin vit désormais dans son propre onglet)

  // Renommage du héros (mis à jour aussi dans le monde en ligne)
  entete.querySelector('#btn-renommer').addEventListener('click', () => {
    const zoneRenommage = entete.querySelector('#zone-renommage');
    zoneRenommage.classList.toggle('cache');
    const champ = entete.querySelector('#champ-renommage');
    champ.value = p.nom;
    champ.focus();
  });
  entete.querySelector('#btn-valider-renommage').addEventListener('click', () => {
    const nouveau = entete.querySelector('#champ-renommage').value.trim().slice(0, 16);
    if (!nouveau || nouveau === p.nom) { entete.querySelector('#zone-renommage').classList.add('cache'); return; }
    p.nom = nouveau;
    sauvegarder(p);
    if (typeof renommerPersonnageCloud === 'function') renommerPersonnageCloud(p);
    afficherToast(`✏️ Ce héros s'appelle désormais ${p.nom} !`);
    rendreHeros();
    rendreTopbar();
  });

  // v17 : la fiche s'organise en ONGLETS clairs — fini le grand déballage.
  const onglets = [
    ['apercu', `📊 Aperçu${p.pointsEnAttente > 0 ? ' ❗' : ''}`],
    ['competences', `⚡ Compétences${p.maitrise > 0 ? ' ❗' : ''}`],
    ['progression', '🏅 Progression'],
    ['compte', '☁️ Compte'],
  ];
  // v18 : la console d'admin a désormais son propre onglet.
  if (p.admin) onglets.push(['admin', '🛠️ Admin']);
  if (!onglets.some(([id]) => id === ongletHeros)) ongletHeros = 'apercu';
  const barreOnglets = document.createElement('div');
  barreOnglets.className = 'onglets onglets-heros';
  onglets.forEach(([id, nom]) => {
    const btn = document.createElement('button');
    btn.className = 'onglet' + (ongletHeros === id ? ' actif' : '');
    btn.textContent = nom;
    btn.addEventListener('click', () => { ongletHeros = id; rendreHeros(); });
    barreOnglets.appendChild(btn);
  });
  zone.appendChild(barreOnglets);

  if (ongletHeros === 'apercu') {
    rendreBlocStats(zone, p, s);
    rendreBlocSets(zone, p);
  } else if (ongletHeros === 'competences') {
    rendreBlocCompetences(zone, p, s);
  } else if (ongletHeros === 'progression') {
    rendreBlocMetiers(zone, p);
    rendreBlocFamiliers(zone, p);
    rendreBlocFaits(zone, p);
  } else if (ongletHeros === 'admin') {
    rendreConsoleAdmin(zone, p);
  } else {
    rendreBlocCode(zone, p);
    rendreBlocDeconnexion(zone, p);
  }
}

// --- Caractéristiques ---
function rendreBlocStats(zone, p, s) {
  // v15.1 : la répartition passe par un BROUILLON — on ajuste avec + / −,
  // rien n'est définitif tant qu'on n'a pas confirmé. Fini les points
  // perdus sur un mauvais clic.
  if (!brouillonRepartition || brouillonRepartition.persoId !== p.id) {
    brouillonRepartition = { persoId: p.id, points: {} };
  }
  const brouillonPts = brouillonRepartition.points;
  let enBrouillon = Object.values(brouillonPts).reduce((somme, n) => somme + n, 0);
  if (enBrouillon > (p.pointsEnAttente || 0)) { // ex. : points perdus à la mort
    brouillonRepartition = { persoId: p.id, points: {} };
    enBrouillon = 0;
  }
  const ptsLibres = (p.pointsEnAttente || 0) - enBrouillon;
  const blocStats = document.createElement('div');
  blocStats.className = 'panneau';
  blocStats.innerHTML = `<h3>Caractéristiques${p.pointsEnAttente > 0 ? ` <span class="badge badge-alerte">${ptsLibres} point${ptsLibres > 1 ? 's' : ''} à répartir</span>` : ''}</h3>`;
  Object.entries(CARACS).forEach(([cle, c]) => {
    const bonus = s[cle] - p.stats[cle];
    const enCours = brouillonRepartition.points[cle] || 0;
    const ligne = document.createElement('div');
    ligne.className = 'ligne-stat';
    ligne.innerHTML = `
      <span class="stat-nom">${c.emoji} ${c.nom}</span>
      <span class="stat-valeur">${p.stats[cle]}${enCours > 0 ? `<span class="bonus-equip"> +${enCours}</span>` : ''}${bonus > 0 ? `<span class="bonus-equip"> +${bonus}</span>` : ''}</span>
      <span class="stat-desc">${c.desc}</span>`;
    if (p.pointsEnAttente > 0) {
      const moins = document.createElement('button');
      moins.className = 'btn-mini';
      moins.textContent = '−';
      moins.disabled = enCours <= 0;
      moins.addEventListener('click', () => {
        brouillonRepartition.points[cle] = enCours - 1;
        rendreHeros();
      });
      const plus = document.createElement('button');
      plus.className = 'btn-mini';
      plus.textContent = '+';
      plus.disabled = ptsLibres <= 0;
      plus.addEventListener('click', () => {
        brouillonRepartition.points[cle] = enCours + 1;
        rendreHeros();
      });
      const desc = ligne.querySelector('.stat-desc');
      ligne.insertBefore(moins, desc);
      ligne.insertBefore(plus, desc);
    }
    blocStats.appendChild(ligne);
  });
  if (enBrouillon > 0) {
    const rangee = document.createElement('div');
    rangee.className = 'rangee-boutons';
    const confirmer = document.createElement('button');
    confirmer.className = 'btn-principal btn-compact';
    confirmer.id = 'stats-confirmer';
    confirmer.textContent = `✔ Confirmer la répartition (${enBrouillon} point${enBrouillon > 1 ? 's' : ''})`;
    confirmer.addEventListener('click', () => {
      const total = Object.values(brouillonRepartition.points).reduce((somme, n) => somme + n, 0);
      if (total <= 0 || total > (p.pointsEnAttente || 0)) { brouillonRepartition = null; rendreHeros(); return; }
      Object.entries(brouillonRepartition.points).forEach(([cle, n]) => { p.stats[cle] += n; });
      p.pointsEnAttente -= total;
      brouillonRepartition = null;
      bornerVie(p);
      sauvegarder(p);
      afficherToast(`💪 Répartition confirmée : ${total} point${total > 1 ? 's' : ''} investi${total > 1 ? 's' : ''} !`);
      rendreHeros();
      rendreTopbar();
    });
    const annuler = document.createElement('button');
    annuler.className = 'btn-choix btn-compact';
    annuler.id = 'stats-annuler';
    annuler.textContent = '↺ Tout remettre';
    annuler.addEventListener('click', () => { brouillonRepartition = null; rendreHeros(); });
    rangee.appendChild(confirmer);
    rangee.appendChild(annuler);
    blocStats.appendChild(rangee);
  } else if (p.pointsEnAttente > 0) {
    const aide = document.createElement('p');
    aide.className = 'aide';
    aide.textContent = 'Ajustez librement avec + et −, puis confirmez : rien n’est définitif avant la confirmation.';
    blocStats.appendChild(aide);
  }
  zone.appendChild(blocStats);
}

// --- Compétences actives (max 8) et grimoire ---
function rendreBlocCompetences(zone, p, s) {
  const classe = classeDe(p);
  const blocComp = document.createElement('div');
  blocComp.className = 'panneau';
  blocComp.innerHTML = `<h3>⚡ Compétences actives (${p.competences.length}/${MAX_COMPETENCES_ACTIVES})
    ${p.maitrise > 0 ? `<span class="badge badge-alerte">🏅 ${p.maitrise} point${p.maitrise > 1 ? 's' : ''} de maîtrise à investir !</span>` : ''}</h3>
    <p class="aide">Ce sont elles que vous lancez en combat. Retirez-en, équipez-en d'autres depuis le grimoire — autant de fois que vous voulez, hors combat.
    Votre signature de classe se renforce avec les points de maîtrise (niv. 3, 6, 9, 12, 15, 18).</p>
    <p class="aide">📖 <strong>Apprendre de nouveaux sorts ?</strong> Monter de niveau n'en offre aucun. Vos
    8 compétences de classe vous reviennent de droit (5 dès le niveau 1, puis une aux niveaux 5, 10 et 15) ;
    tout le reste se lit dans un <strong>grimoire acheté à l'Arcanium</strong>, chez Dame Sibylle. Le savoir se paie.</p>`;
  const grilleComp = document.createElement('div');
  grilleComp.className = 'grille-competences';
  p.competences.forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp) return;
    const carte = carteCompetence(id, comp, { stats: s, rang: rangDe(p, id) });
    ajouterBlocSignature(p, id, comp, carte);
    const retirer = document.createElement('button');
    retirer.className = 'btn-choix btn-compact';
    retirer.textContent = '⬇️ Ranger au grimoire';
    retirer.disabled = p.competences.length <= 1; // toujours au moins une compétence
    retirer.addEventListener('click', () => {
      p.competences = p.competences.filter((x) => x !== id);
      sauvegarder(p);
      rendreHeros();
    });
    carte.appendChild(retirer);
    grilleComp.appendChild(carte);
  });
  blocComp.appendChild(grilleComp);

  const enReserve = p.grimoire.filter((id) => !p.competences.includes(id) && COMPETENCES[id]);
  const titreGrimoire = document.createElement('h3');
  titreGrimoire.className = 'titre-grimoire';
  titreGrimoire.textContent = `📚 Grimoire (${p.grimoire.length} connue${p.grimoire.length > 1 ? 's' : ''})`;
  blocComp.appendChild(titreGrimoire);
  if (enReserve.length === 0) {
    const aide = document.createElement('p');
    aide.className = 'aide';
    aide.textContent = 'Toutes vos compétences connues sont actives. Pour en apprendre d’autres, achetez leur grimoire à l’Arcanium — c’est la seule école du bourg.';
    blocComp.appendChild(aide);
  } else {
    const grilleGrimoire = document.createElement('div');
    grilleGrimoire.className = 'grille-competences';
    enReserve.forEach((id) => {
      const comp = COMPETENCES[id];
      const carte = carteCompetence(id, comp, { stats: s, rang: rangDe(p, id) });
      ajouterBlocSignature(p, id, comp, carte);
      const equiperBtn = document.createElement('button');
      equiperBtn.className = 'btn-choix btn-compact';
      const complet = p.competences.length >= MAX_COMPETENCES_ACTIVES;
      equiperBtn.textContent = complet ? `⚡ Actives au complet (${MAX_COMPETENCES_ACTIVES})` : '⚡ Équiper';
      equiperBtn.disabled = complet;
      equiperBtn.addEventListener('click', () => {
        if (p.competences.length >= MAX_COMPETENCES_ACTIVES) return;
        p.competences.push(id);
        sauvegarder(p);
        afficherToast(`${comp.emoji} ${comp.nom} rejoint vos compétences actives.`);
        rendreHeros();
      });
      carte.appendChild(equiperBtn);
      grilleGrimoire.appendChild(carte);
    });
    blocComp.appendChild(grilleGrimoire);
  }
  // --- L'arbre de classe : les compétences pas encore débloquées
  // restent visibles, verrouillées, avec tous leurs chiffres. ---
  const aVenir = Object.entries(COMPETENCES)
    .filter(([id, comp]) => comp.classe === p.classe && !p.grimoire.includes(id))
    .sort((a, c) => (a[1].niveauRequis || 1) - (c[1].niveauRequis || 1));
  if (aVenir.length > 0) {
    const titreArbre = document.createElement('h3');
    titreArbre.className = 'titre-grimoire';
    titreArbre.textContent = `🏅 Arbre de ${nomCompletClasse(p)} — à débloquer`;
    blocComp.appendChild(titreArbre);
    const grilleArbre = document.createElement('div');
    grilleArbre.className = 'grille-competences';
    aVenir.forEach(([id, comp]) => {
      const carte = carteCompetence(id, comp, { stats: s });
      carte.classList.add('carte-verrouillee');
      const verrou = document.createElement('div');
      verrou.className = 'comp-verrou';
      verrou.textContent = `🔒 Se débloque automatiquement au niveau ${comp.niveauRequis}`;
      carte.appendChild(verrou);
      grilleArbre.appendChild(carte);
    });
    blocComp.appendChild(grilleArbre);
  }
  zone.appendChild(blocComp);
}

// --- Panoplies actives ---
function rendreBlocSets(zone, p) {
  const sets = bonusSetActifs(p);
  if (sets.actifs.length > 0) {
    const blocSets = document.createElement('div');
    blocSets.className = 'panneau';
    blocSets.innerHTML = '<h3>⚙️ Panoplies actives</h3>';
    sets.actifs.forEach((actif) => {
      const paliers = BONUS_SET_PAR_RARETE[actif.rarete];
      const ligne = document.createElement('div');
      ligne.className = `carte-objet bord-rar-${actif.rarete} ligne-panoplie`;
      const detail = actif.atteints.map((seuil) => `<div class="objet-bonus">✔ ${seuil} pièces : ${textePalierSet(paliers[seuil])}</div>`).join('');
      const prochain = actif.pieces < 4 ? `<div class="objet-desc">Prochain palier à 4 pièces : ${textePalierSet(paliers[4])}</div>` : '';
      ligne.innerHTML = `<div class="objet-entete">⚙️ <strong>${actif.nom}</strong> <span class="objet-qte">${actif.pieces} pièce${actif.pieces > 1 ? 's' : ''} équipée${actif.pieces > 1 ? 's' : ''}</span></div>${detail}${prochain}`;
      blocSets.appendChild(ligne);
    });
    zone.appendChild(blocSets);
  }
}

// --- Familiers ---
function rendreBlocFamiliers(zone, p) {
  if (p.familiers.length > 0) {
    const blocFamiliers = document.createElement('div');
    blocFamiliers.className = 'panneau';
    blocFamiliers.innerHTML = `<h3>🐾 Familiers (${p.familiers.length}/${Object.keys(FAMILIERS).length})</h3>
      <p class="aide">Un seul familier vous accompagne à la fois. Les autres attendent au chenil.</p>`;
    const grilleFamiliers = document.createElement('div');
    grilleFamiliers.className = 'grille-inventaire';
    p.familiers.forEach((idFamilier) => {
      const compagnon = FAMILIERS[idFamilier];
      if (!compagnon) return;
      const actif = p.familier === idFamilier;
      const carte = document.createElement('div');
      carte.className = 'carte-objet' + (actif ? ' bord-rar-legendaire' : '');
      carte.innerHTML = `
        <div class="objet-entete">${compagnon.emoji} <strong>${compagnon.nom}</strong>${actif ? ' <span class="objet-qte">✔ actif</span>' : ''}</div>
        <div class="objet-bonus">${compagnon.desc}</div>`;
      const bouton = document.createElement('button');
      bouton.className = 'btn-choix btn-compact';
      bouton.textContent = actif ? 'Renvoyer au chenil' : 'Prendre avec soi';
      bouton.addEventListener('click', () => {
        p.familier = actif ? null : idFamilier;
        bornerVie(p);
        sauvegarder(p);
        afficherToast(actif ? `${compagnon.emoji} ${compagnon.nom} retourne au chenil.` : `${compagnon.emoji} ${compagnon.nom} trottine à vos côtés !`);
        rendreHeros();
        rendreTopbar();
      });
      carte.appendChild(bouton);
      grilleFamiliers.appendChild(carte);
    });
    blocFamiliers.appendChild(grilleFamiliers);
    zone.appendChild(blocFamiliers);
  }
}

// --- Métiers de récolte et spécialité (v12) ---
function rendreBlocMetiers(zone, p) {
  const blocMetiers = document.createElement('div');
  blocMetiers.className = 'panneau';
  blocMetiers.innerHTML = '<h3>🧰 Métiers de récolte</h3>'
    + '<p class="aide">Pratiquez sur la carte (miner, dépecer, herboriser) pour progresser. '
    + 'La <strong>spécialité</strong> ⭐ — votre sous-classe de récolteur — se choisit au '
    + `niveau ${NIVEAU_SPECIALITE} : le spécialiste récolte plus (quantités, matériaux signatures) `
    + 'et progresse deux fois plus vite dans son métier — et plus sa Chance est haute, plus l’écart se creuse. '
    + `En changer coûte ${formatNombre(COUT_CHANGEMENT_SPECIALITE)} po.</p>`;
  const grilleMetiers = document.createElement('div');
  grilleMetiers.className = 'rangee-chips';
  Object.entries(METIERS).forEach(([idMetier, metier]) => {
    const m = metierDe(p, idMetier);
    const specialite = p.metierPrincipal === idMetier;
    const chip = document.createElement('button');
    chip.className = 'chip chip-metier' + (specialite ? ' chip-specialite' : '');
    chip.title = specialite
      ? `${metier.detail} — votre spécialité : récolte et progression améliorées`
      : `${metier.detail} — matériau signature : ${OBJETS[metier.exclusif].nom}. `
        + (p.metierPrincipal ? `Changer de spécialité coûte ${formatNombre(COUT_CHANGEMENT_SPECIALITE)} po.` : 'Cliquez pour en faire votre spécialité (gratuit).');
    const progression = m.niveau >= NIVEAU_MAX_METIER
      ? 'maître'
      : `niv. ${m.niveau} (${m.xp}/${seuilXpMetier(m.niveau)} XP)`;
    chip.textContent = `${metier.emoji} ${metier.nom} ${progression}${specialite ? ' ⭐ spécialité' : ''}`;
    chip.addEventListener('click', () => {
      if (p.metierPrincipal === idMetier) return;
      if (p.niveau < NIVEAU_SPECIALITE) {
        afficherToast(`🔒 La spécialité se choisit au niveau ${NIVEAU_SPECIALITE} — continuez l'aventure !`);
        return;
      }
      if (p.metierPrincipal && p.po < COUT_CHANGEMENT_SPECIALITE) {
        afficherToast(`💰 Changer de spécialité coûte ${formatNombre(COUT_CHANGEMENT_SPECIALITE)} po.`);
        return;
      }
      if (p.metierPrincipal) p.po -= COUT_CHANGEMENT_SPECIALITE;
      p.metierPrincipal = idMetier;
      sauvegarder(p);
      afficherToast(`${metier.emoji} ⭐ ${p.nom} se spécialise ${metier.nom} : ses récoltes de ${metier.famille === 'mine' ? 'pierres' : metier.famille === 'peau' ? 'cuirs' : 'plantes'} seront bien plus riches !`);
      rendreHeros();
      rendreTopbar();
    });
    grilleMetiers.appendChild(chip);
  });
  blocMetiers.appendChild(grilleMetiers);
  zone.appendChild(blocMetiers);
}

// --- Hauts faits et titres ---
function rendreBlocFaits(zone, p) {
  const blocFaits = document.createElement('div');
  blocFaits.className = 'panneau';
  blocFaits.innerHTML = `<h3>🏅 Hauts faits (${p.hautsFaits.length}/${HAUTS_FAITS.length})</h3>
    <p class="aide">Chaque haut fait débloque un titre. Touchez un haut fait accompli pour porter son titre.</p>`;
  const grilleFaits = document.createElement('div');
  grilleFaits.className = 'rangee-chips';
  HAUTS_FAITS.forEach((hautFait) => {
    const obtenu = p.hautsFaits.includes(hautFait.id);
    const chip = document.createElement('button');
    chip.className = 'chip chip-haut-fait' + (obtenu ? ' obtenu' : ' verrouille') + (p.titre === hautFait.id ? ' titre-porte' : '');
    chip.title = hautFait.desc + (obtenu ? ` — titre : « ${hautFait.titre} »` : '');
    chip.textContent = obtenu ? `${hautFait.emoji} ${hautFait.nom}` : `🔒 ${hautFait.desc}`;
    if (obtenu) {
      chip.addEventListener('click', () => {
        p.titre = p.titre === hautFait.id ? null : hautFait.id;
        sauvegarder(p);
        afficherToast(p.titre ? `🏅 Vous portez le titre « ${hautFait.titre} ».` : 'Titre retiré.');
        rendreHeros();
      });
    }
    grilleFaits.appendChild(chip);
  });
  blocFaits.appendChild(grilleFaits);
  zone.appendChild(blocFaits);
}

// --- Code de sauvegarde (jouer sur un autre appareil) ---
function rendreBlocCode(zone, p) {
  const blocCode = document.createElement('div');
  blocCode.className = 'panneau';
  blocCode.innerHTML = '<h3>☁️ Code de sauvegarde</h3>';
  if (p.cloud) {
    const explication = document.createElement('p');
    explication.className = 'aide';
    explication.textContent = 'Ce code permet de reprendre ce héros sur n’importe quel appareil (écran d’accueil → « Reprendre un héros »). Gardez-le secret : il donne le contrôle du personnage.';
    blocCode.appendChild(explication);
    const ligne = document.createElement('div');
    ligne.className = 'ligne-code';
    const champ = document.createElement('input');
    champ.readOnly = true;
    champ.value = `${p.cloud.id}.${p.cloud.token}`;
    const copier = document.createElement('button');
    copier.className = 'btn-choix';
    copier.textContent = '📋 Copier';
    copier.addEventListener('click', () => {
      champ.select();
      try {
        navigator.clipboard.writeText(champ.value).then(
          () => afficherToast('Code copié !'),
          () => afficherToast('Sélectionnez le code et copiez-le manuellement.'));
      } catch (e) {
        afficherToast('Sélectionnez le code et copiez-le manuellement.');
      }
    });
    ligne.appendChild(champ);
    ligne.appendChild(copier);
    blocCode.appendChild(ligne);

    // v15 : le code de récupération, plus simple à retenir qu'un uuid.
    const noteRecup = document.createElement('p');
    noteRecup.className = 'aide';
    noteRecup.textContent = p.recuperation
      ? `🗝️ Code de récupération actuel : « ${p.recuperation} ». Le taper dans « Reprendre un héros » suffit à retrouver ce héros.`
      : '🗝️ Aucun code de récupération : vous pouvez en définir un ici (type email) — bien plus simple à retenir que le code technique.';
    blocCode.appendChild(noteRecup);
    const ligneRecup = document.createElement('div');
    ligneRecup.className = 'ligne-code';
    const champRecup = document.createElement('input');
    champRecup.id = 'champ-recuperation';
    champRecup.maxLength = 60;
    champRecup.placeholder = 'Ex. : kaela@mail.com';
    champRecup.value = p.recuperation || '';
    const definir = document.createElement('button');
    definir.className = 'btn-choix';
    definir.id = 'btn-definir-recuperation';
    definir.textContent = '🗝️ Définir';
    definir.addEventListener('click', async () => {
      const codeRecup = champRecup.value.trim().toLowerCase();
      if (!codeRecup) { afficherToast('🗝️ Saisissez un code (type email) avant de valider.'); return; }
      p.recuperation = codeRecup;
      sauvegarderLocal();
      const res = typeof definirRecuperationCloud === 'function' ? await definirRecuperationCloud(p) : { ok: false };
      if (res && res.ok) afficherToast(`🗝️ Code de récupération enregistré : « ${codeRecup} ». Gardez-le pour vous !`);
      rendreHeros();
    });
    ligneRecup.appendChild(champRecup);
    ligneRecup.appendChild(definir);
    blocCode.appendChild(ligneRecup);
  } else {
    const note = document.createElement('p');
    note.className = 'aide';
    if (!etat.enLigne) {
      note.textContent = 'Le monde en ligne est injoignable pour le moment — le code apparaîtra dès que la connexion sera rétablie.';
    } else if (p.admin) {
      // v18 : le bouton reste disponible pour l'admin — c'est LUI qui
      // décide. On dit juste franchement ce que ça implique.
      note.innerHTML = '🛠️ Ce héros admin est <strong>local</strong> : rien de lui n’est publié en ligne. '
        + 'Vous pouvez le relier au monde quand vous voulez — il apparaîtra alors à la taverne, '
        + 'dans les classements et pourra échanger avec les autres joueurs, <strong>console d’admin comprise</strong>.';
    } else {
      note.textContent = 'Ce héros n’est pas encore relié au monde en ligne.';
    }
    blocCode.appendChild(note);
    if (etat.enLigne && typeof creerPersonnageCloud === 'function') {
      const relier = document.createElement('button');
      relier.className = 'btn-choix';
      relier.textContent = '☁️ Relier au monde';
      relier.addEventListener('click', async () => {
        // Un héros admin est local par défaut : le clic vaut consentement.
        if (p.admin) p.relieAuMonde = true;
        relier.disabled = true;
        relier.textContent = '☁️ Liaison en cours…';
        await creerPersonnageCloud(p);
        if (!p.cloud && p.admin) p.relieAuMonde = false; // échec : on reste local
        sauvegarderLocal();
        afficherToast(p.cloud ? '☁️ Héros relié au monde !' : '📴 Liaison impossible pour le moment.');
        rendreHeros();
      });
      blocCode.appendChild(relier);
    }
  }
  zone.appendChild(blocCode);
}

// --- Déconnexion : changer de héros ou quitter la partie ---
function rendreBlocDeconnexion(zone, p) {
  const bloc = document.createElement('div');
  bloc.className = 'panneau';
  bloc.innerHTML = `<h3>🚪 Session</h3>
    <p class="aide">Votre héros est sauvegardé automatiquement${p.cloud ? ', ici et dans le monde en ligne' : ' sur cet appareil'}.
    Se déconnecter ramène à l'écran d'accueil pour changer de héros ou en créer un autre.</p>`;
  const btn = document.createElement('button');
  btn.className = 'btn-choix btn-danger';
  btn.textContent = '🚪 Se déconnecter (changer de héros)';
  btn.addEventListener('click', () => {
    sauvegarder(p);
    afficherToast(`👋 À bientôt, ${p.nom} !`);
    rendreTitre();
    montrerEcran('ecran-titre');
  });
  bloc.appendChild(btn);
  zone.appendChild(bloc);
}

// =====================================================================
// Le Sac : équipement porté + inventaire (écran séparé de la fiche)
// =====================================================================
let sousFiltreSac = 'tous';
let sousFiltreSacRarete = 'tous';

function rendreSac() {
  const p = persoActif();
  if (!p) return;
  bornerVie(p);
  const zone = el('sac-contenu');
  zone.innerHTML = '';

  // --- Équipement porté ---
  const blocEquip = document.createElement('div');
  blocEquip.className = 'panneau';
  blocEquip.innerHTML = '<h3>🛡️ Équipement porté</h3>';
  const grilleEquip = document.createElement('div');
  grilleEquip.className = 'grille-equipement';
  Object.entries(SLOTS_EQUIPEMENT).forEach(([slot, meta]) => {
    const idObjet = p.equipement[slot];
    // Garde-fou : un id qui ne correspond plus au catalogue est traité
    // comme un emplacement vide (et nettoyé) plutôt que de planter l'écran.
    const objet = idObjet ? OBJETS[idObjet] : null;
    if (idObjet && !objet) p.equipement[slot] = null;
    const caseSlot = document.createElement('div');
    caseSlot.className = 'case-equipement' + (objet ? ' occupee' : '');
    if (objet) {
      caseSlot.innerHTML = `
        <div class="case-slot-nom">${meta.nom}</div>
        <div class="case-objet">${objet.emoji} <strong>${objet.nom}</strong></div>
        <div class="case-bonus">${texteBonus(objet.bonus)}</div>
        ${texteSet(objet)}`;
      const retirer = document.createElement('button');
      retirer.className = 'btn-choix btn-compact';
      retirer.textContent = 'Retirer';
      retirer.addEventListener('click', () => {
        ajouterObjet(p, idObjet);
        p.equipement[slot] = null;
        bornerVie(p);
        sauvegarder(p);
        rendreSac();
        rendreTopbar();
      });
      caseSlot.appendChild(retirer);
    } else {
      caseSlot.innerHTML = `
        <div class="case-slot-nom">${meta.nom}</div>
        <div class="case-vide">${meta.emoji} vide</div>`;
    }
    grilleEquip.appendChild(caseSlot);
  });
  blocEquip.appendChild(grilleEquip);
  zone.appendChild(blocEquip);

  // --- Inventaire filtrable ---
  const blocInv = document.createElement('div');
  blocInv.className = 'panneau';
  blocInv.innerHTML = '<h3>🎒 Inventaire</h3>';
  const filtres = [
    { id: 'tous', nom: 'Tout' },
    { id: 'equipement', nom: '⚔️ Équipements' },
    { id: 'consommable', nom: '🧪 Consommables' },
    { id: 'materiau', nom: '⛏️ Matériaux' },
  ];
  const rangeeFiltres = document.createElement('div');
  rangeeFiltres.className = 'rangee-chips';
  filtres.forEach((f) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-filtre' + (sousFiltreSac === f.id ? ' active' : '');
    chip.textContent = f.nom;
    chip.addEventListener('click', () => { sousFiltreSac = f.id; rendreSac(); });
    rangeeFiltres.appendChild(chip);
  });
  // v17 : filtre par rareté, comme dans les boutiques.
  // v21 : et comme dans les boutiques, seules les raretés RÉELLEMENT
  // présentes dans le sac sont proposées — plus celle qui est active, pour
  // qu'on puisse toujours la désélectionner. Filtrer sur « Divin » quand on
  // n'en possède aucun ne renvoyait qu'un sac vide et un doute.
  const sep = document.createElement('span');
  sep.className = 'separateur-chips';
  rangeeFiltres.appendChild(sep);
  const raretesDuSac = new Set(p.inventaire.map((e) => OBJETS[e.id]).filter(Boolean).map((o) => rareteDe(o)));
  if (sousFiltreSacRarete !== 'tous') raretesDuSac.add(sousFiltreSacRarete);
  [['tous', '✨ Toutes raretés'], ...Object.keys(RARETES).filter((r) => raretesDuSac.has(r)).map((r) => [r, RARETES[r].nom])].forEach(([id, nom]) => {
    const chip = document.createElement('button');
    chip.className = `chip chip-filtre chip-rar-${id}` + (sousFiltreSacRarete === id ? ' active' : '');
    chip.textContent = nom;
    chip.addEventListener('click', () => { sousFiltreSacRarete = id; rendreSac(); });
    rangeeFiltres.appendChild(chip);
  });
  blocInv.appendChild(rangeeFiltres);

  const entrees = p.inventaire.filter((entree) => {
    const objet = OBJETS[entree.id];
    return objet && (sousFiltreSac === 'tous' || objet.type === sousFiltreSac)
      && (sousFiltreSacRarete === 'tous' || rareteDe(objet) === sousFiltreSacRarete);
  });
  rendreListeFiltrable({
    cle: 'sac',
    conteneur: blocInv,
    elements: entrees,
    texteDe: (entree) => texteRecherchableObjet(OBJETS[entree.id]),
    tris: TRIS_OBJETS,
    trierAvec: (entree) => ({ objet: OBJETS[entree.id], prix: prixVenteDe(entree.id) }),
    classeListe: 'grille-inventaire',
    placeholder: '🔎 Chercher dans le sac…',
    nomListe: 'lots',
    vide: p.inventaire.length === 0
      ? 'Votre sac est vide. Le monde regorge de trésors !'
      : 'Rien dans cette catégorie.',
    rendre: (entree) => {
      const objet = OBJETS[entree.id];
      const carte = document.createElement('div');
      carte.className = `carte-objet bord-rar-${rareteDe(objet)}`;
      carte.innerHTML = `
        <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)} <span class="objet-qte">×${entree.qte}</span></div>
        <div class="objet-desc">${objet.desc || ''}</div>
        ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
        ${texteSet(objet)}
        ${texteTypeEquipement(objet)}
        ${objet.type === 'equipement' ? `<div class="objet-niveau ${p.niveau < objet.niveau ? 'niveau-insuffisant' : ''}">niv. ${objet.niveau} requis</div>` : ''}
        ${texteComparaison(p, objet)}`;
      if (objet.type === 'equipement') {
        const interdit = !peutPorter(p, objet);
        if (interdit) {
          carte.classList.add('article-verrouille');
          carte.insertAdjacentHTML('beforeend',
            `<div class="objet-niveau niveau-insuffisant">🚫 ${raisonRefusEquipement(p, objet)}</div>`);
        }
        const equiperBtn = document.createElement('button');
        equiperBtn.className = 'btn-choix btn-compact';
        equiperBtn.textContent = interdit ? '🚫 Pas pour cette classe' : 'Équiper';
        equiperBtn.disabled = interdit || p.niveau < objet.niveau;
        equiperBtn.addEventListener('click', () => {
          equiper(p, entree.id);
          rendreSac();
          rendreTopbar();
        });
        carte.appendChild(equiperBtn);
      } else if (objet.type === 'consommable') {
        const utiliser = document.createElement('button');
        utiliser.className = 'btn-choix btn-compact';
        utiliser.textContent = 'Utiliser';
        utiliser.addEventListener('click', () => {
          utiliserConsommable(p, entree.id);
          rendreSac();
          rendreTopbar();
        });
        carte.appendChild(utiliser);
      } else {
        const note = document.createElement('div');
        note.className = 'objet-note';
        note.textContent = 'Matériau d’artisanat';
        carte.appendChild(note);
      }
      return carte;
    },
  });
  zone.appendChild(blocInv);
}

function equiper(p, idObjet) {
  const objet = OBJETS[idObjet];
  if (!objet || objet.type !== 'equipement' || p.niveau < objet.niveau) return;
  // v19 : une armure de plaque ne se porte pas en robe, et inversement.
  // La vérification n'intervient qu'ici, au moment d'équiper : ce qui est
  // déjà porté le reste, on ne déshabille personne rétroactivement.
  if (!peutPorter(p, objet)) {
    afficherToast(`🚫 ${raisonRefusEquipement(p, objet)}`);
    return;
  }
  let slot = objet.slot;
  if (slot === 'accessoire') {
    slot = !p.equipement.acc1 ? 'acc1' : (!p.equipement.acc2 ? 'acc2' : 'acc1');
  }
  if (!retirerObjet(p, idObjet, 1)) return;
  if (p.equipement[slot]) ajouterObjet(p, p.equipement[slot]);
  p.equipement[slot] = idObjet;
  bornerVie(p);
  sauvegarder(p);
  afficherToast(`${objet.emoji} ${objet.nom} équipé !`);
}

function utiliserConsommable(p, idObjet) {
  const objet = OBJETS[idObjet];
  if (!objet || objet.type !== 'consommable') return false;
  if (objet.effet.type !== 'pv' && objet.effet.type !== 'pm') {
    afficherToast(`${objet.emoji} ${objet.nom} s’utilise en combat.`);
    return false;
  }
  if (objet.effet.type === 'pv' && p.hp >= p.maxHp) { afficherToast('PV déjà au maximum.'); return false; }
  if (objet.effet.type === 'pm' && p.mp >= p.maxMp) { afficherToast('PM déjà au maximum.'); return false; }
  if (!retirerObjet(p, idObjet, 1)) return false;
  if (objet.effet.type === 'pv') p.hp = Math.min(p.maxHp, p.hp + objet.effet.valeur);
  if (objet.effet.type === 'pm') p.mp = Math.min(p.maxMp, p.mp + objet.effet.valeur);
  sauvegarder(p);
  afficherToast(`${objet.emoji} ${objet.nom} utilisé.`);
  return true;
}

// =====================================================================
// Choix de l'équipe (écran partagé)
// =====================================================================
function rendreEquipe() {
  const zone = el('equipe-choix');
  zone.innerHTML = '';
  const actif = persoActif();
  etat.profils.forEach((p) => {
    const carte = document.createElement('div');
    const estActif = p.id === actif.id;
    const coche = etat.equipe.includes(p.id);
    carte.className = 'carte-recap carte-equipier' + (coche ? ' selectionnee' : '') + (estActif ? ' chef' : '');
    carte.innerHTML = `
      <div class="recap-entete"><span class="avatar-grand">${p.avatar}</span>
        <div><strong>${echapper(p.nom)}</strong>${estActif ? ' <span class="badge">chef</span>' : ''}<br>
        <span class="niveau">Niveau ${p.niveau} · ❤️ ${p.hp}/${p.maxHp}</span></div>
      </div>`;
    if (!estActif) {
      rendreCliquable(carte, () => {
        if (coche) {
          etat.equipe = etat.equipe.filter((id) => id !== p.id);
        } else if (etat.equipe.length < 3) {
          etat.equipe.push(p.id);
        } else {
          afficherToast('Une expédition compte 3 héros au maximum.');
        }
        rendreEquipe();
      });
    }
    zone.appendChild(carte);
  });
}

// =====================================================================
// Import d'un héros par code
// =====================================================================
async function importerHeros() {
  const champ = el('champ-code-import');
  const message = el('message-import');
  const code = champ.value.trim();
  // Mot de passe secret : invoque le héros admin (bac à sable local,
  // jamais publié en ligne) sans aucun bouton visible.
  if (code.toLowerCase() === 'admin-valciel') {
    champ.value = '';
    message.textContent = '';
    el('zone-import').classList.add('cache');
    // v18 : le code n'invoque plus un héros tout fait — il ouvre la
    // création complète, en mode admin.
    demarrerCreation({ admin: true });
    return;
  }
  // Deux formes de code : « id.token » (code de sauvegarde technique)
  // ou le CODE DE RÉCUPÉRATION choisi à la création (type email).
  const morceaux = code.split('.');
  let id;
  let token;
  if (morceaux.length === 2 && morceaux[0].length >= 32) {
    [id, token] = morceaux;
  } else {
    message.textContent = 'Recherche par code de récupération…';
    const res = typeof recupererParCodeCloud === 'function'
      ? await recupererParCodeCloud(code.toLowerCase()) : null;
    if (!res) {
      message.textContent = etat.enLigne
        ? 'Aucun héros ne répond à ce code — vérifiez le code de récupération, ou utilisez le code de sauvegarde (deux parties séparées par un point).'
        : 'Le monde en ligne est injoignable pour le moment.';
      return;
    }
    id = res.id;
    token = res.token;
  }
  message.textContent = 'Recherche du héros…';
  const donnees = await recupererPersonnageCloud(id, token);
  if (!donnees) {
    message.textContent = etat.enLigne
      ? 'Héros introuvable : vérifiez le code.'
      : 'Le monde en ligne est injoignable pour le moment.';
    return;
  }
  chargerHerosImporte(donnees, id, token);
}

function chargerHerosImporte(donnees, id, token) {
  const champ = el('champ-code-import');
  const message = el('message-import');
  const d = donnees.donnees || {};
  const p = nouveauPersonnage({
    nom: donnees.nom, avatar: donnees.avatar || '⚔️',
    stats: d.stats || { for: 4, int: 4, dex: 4, vit: 4 },
    competences: d.competences || [],
  });
  if (Array.isArray(d.grimoire)) {
    d.grimoire.forEach((id) => { if (!p.grimoire.includes(id)) p.grimoire.push(id); });
  }
  if (d.classe && (CLASSES[d.classe] || MIGRATION_CLASSES[d.classe])) p.classe = d.classe;
  if (d.sousClasse !== undefined) p.sousClasse = d.sousClasse;
  if (d.voie !== undefined) p.voie = d.voie;
  if (d.eveil !== undefined) p.eveil = d.eveil;
  if (d.sceaux) p.sceaux = d.sceaux;
  if (d.versionClasses != null) p.versionClasses = d.versionClasses;
  if (d.rangs && typeof d.rangs === 'object') p.rangs = d.rangs;
  if (d.maitrise != null) p.maitrise = d.maitrise;
  normaliserPerso(p); // signature de classe, maîtrise et grimoire cohérents
  p.niveau = donnees.niveau || 1;
  p.xp = donnees.xp || 0;
  p.pointsEnAttente = d.pointsEnAttente || 0;
  p.competencesEnAttente = 0; // v18 : plus de compétence gratuite
  p.po = d.po != null ? d.po : 60;
  p.inventaire = Array.isArray(d.inventaire) ? d.inventaire : [];
  p.equipement = { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null, ...(d.equipement || {}) };
  p.explorations = d.explorations || {};
  p.bossVaincus = d.bossVaincus || [];
  // Toute la progression annexe voyage aussi d'un appareil à l'autre.
  if (d.compteurs) p.compteurs = { ...p.compteurs, ...d.compteurs };
  if (Array.isArray(d.familiers)) p.familiers = d.familiers;
  if (d.familier !== undefined) p.familier = d.familier;
  if (Array.isArray(d.hautsFaits)) p.hautsFaits = d.hautsFaits;
  if (d.titre !== undefined) p.titre = d.titre;
  if (d.tourMax != null) p.tourMax = d.tourMax;
  if (d.tourBoss && typeof d.tourBoss === 'object') p.tourBoss = { normal: 0, heroique: 0, cauchemar: 0, ...d.tourBoss };
  if (d.donjons && typeof d.donjons === 'object') p.donjons = d.donjons;
  if (d.metiers && typeof d.metiers === 'object') p.metiers = d.metiers;
  if (d.metierPrincipal !== undefined) p.metierPrincipal = d.metierPrincipal;
  if (d.ascensions && typeof d.ascensions === 'object') p.ascensions = d.ascensions;
  if (d.histoiresVues && typeof d.histoiresVues === 'object') p.histoiresVues = d.histoiresVues;
  if (d.quetes && d.quetes.date) p.quetes = d.quetes;
  p.cloud = { id, token };
  bornerVie(p);
  p.hp = d.hp != null ? Math.min(p.maxHp, d.hp) : p.maxHp;
  p.mp = d.mp != null ? Math.min(p.maxMp, d.mp) : p.maxMp;
  etat.profils.push(p);
  etat.actifId = p.id;
  etat.equipe = [p.id];
  sauvegarderLocal();
  message.textContent = '';
  champ.value = '';
  el('zone-import').classList.add('cache');
  afficherToast(`${p.avatar} ${p.nom} est de retour !`);
  rendreTitre();
}

// =====================================================================
// Initialisation
// =====================================================================
function initialiser() {
  chargerProfils();

  el('btn-nouveau-perso').addEventListener('click', demarrerCreation);
  el('creation-valider').addEventListener('click', validerCreation);
  el('creation-suivant').addEventListener('click', () => allerPageCreation(1));
  el('creation-retour').addEventListener('click', () => allerPageCreation(-1));
  el('creation-annuler').addEventListener('click', () => { rendreTitre(); montrerEcran('ecran-titre'); });
  el('btn-importer').addEventListener('click', () => el('zone-import').classList.toggle('cache'));
  el('btn-valider-import').addEventListener('click', importerHeros);
  el('equipe-valider').addEventListener('click', () => {
    rendreCarte();
    montrerEcran('ecran-carte');
  });
  el('butin-continuer').addEventListener('click', () => continuerApresButin());

  document.querySelectorAll('#navbar-bas button').forEach((btn) => {
    btn.addEventListener('click', () => naviguer(btn.dataset.nav));
  });
  // Chaque échoppe et atelier propose un retour direct vers le bourg.
  document.querySelectorAll('.btn-retour-ville').forEach((btn) => {
    btn.addEventListener('click', () => naviguer('ville'));
  });

  rendreTitre();
  montrerEcran('ecran-titre');
  if (typeof demarrerReseau === 'function') demarrerReseau();
}

// La page de tests (tests.html) charge les mêmes scripts que le jeu, mais
// sans ses écrans : on ne démarre l'interface que si elle est bien là.
function demarrerSiInterface() {
  if (!document.getElementById('ecran-titre')) return;
  initialiser();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrerSiInterface);
} else {
  demarrerSiInterface();
}
