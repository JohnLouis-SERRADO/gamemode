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
  'ecran-heros', 'ecran-sac', 'ecran-taverne', 'ecran-groupe-ligne', 'ecran-donjon'];

function montrerEcran(id) {
  document.querySelectorAll('.ecran').forEach((e) => e.classList.remove('actif'));
  el(id).classList.add('actif');
  const topbar = el('topbar');
  if (ECRANS_AVEC_TOPBAR.includes(id) && persoActif()) {
    topbar.classList.remove('cache');
    rendreTopbar();
  } else {
    topbar.classList.add('cache');
  }
  if (id !== 'ecran-taverne' && typeof arreterSondageTaverne === 'function') arreterSondageTaverne();
  // v12.2 : au niveau 5, le choix de la sous-classe de récolteur s'impose.
  if (['ecran-carte', 'ecran-zone', 'ecran-ville', 'ecran-heros'].includes(id)) {
    verifierChoixSpecialite();
  }
  window.scrollTo(0, 0);
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
  if (document.getElementById('voile-specialite')) return;

  const PRESENTATIONS = {
    mineur: 'Pierres, minerais et cristaux — et la fameuse <strong>pierre magique</strong>. C\'est lui qui nourrit la <strong>Forge</strong> : lames, heaumes, cuirasses et jambières. Sans mineur, pas d\'acier — et les guerriers combattent en chemise.',
    tanneur: 'Cuirs, os et dépouilles de bêtes — jusqu\'au précieux <strong>cuir primal</strong>. C\'est lui qui nourrit la <strong>Tannerie</strong> : gants et bottes, blocage et esquive. Sans tanneur, les aventuriers marchent pieds nus.',
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
      changer coûtera ${COUT_CHANGEMENT_SPECIALITE} po depuis votre fiche de héros.</p>`;

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

function rendreTopbar() {
  const p = persoActif();
  if (!p) return;
  const zone = el('topbar-perso');
  const pctHp = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
  const pctMp = Math.max(0, Math.round((p.mp / p.maxMp) * 100));
  zone.innerHTML = `
    <span class="topbar-avatar">${p.avatar}</span>
    <div class="topbar-infos">
      <div class="topbar-nom">${echapper(p.nom)} <span class="niveau">niv. ${p.niveau}</span></div>
      <div class="topbar-barres">
        <div class="barre pv mini"><div class="remplissage" style="width:${pctHp}%"></div></div>
        <div class="barre pm mini"><div class="remplissage" style="width:${pctMp}%"></div></div>
      </div>
    </div>
    <span class="topbar-po">💰 ${p.po}</span>`;
  const badge = el('badge-heros');
  badge.classList.toggle('cache', !(p.pointsEnAttente > 0 || p.competencesEnAttente > 0 || p.maitrise > 0));
  el('point-en-ligne').classList.toggle('actif-reseau', etat.enLigne);
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

// Complète les sauvegardes venues d'anciennes versions du jeu.
function normaliserPerso(p) {
  if (!p.race) p.race = 'humain';
  if (p.stats.cha == null) p.stats.cha = 2;
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
  if (p.competences.length > MAX_COMPETENCES_ACTIVES) {
    p.competences = p.competences.slice(0, MAX_COMPETENCES_ACTIVES);
  }
  // v10 : deux nouveaux emplacements d'équipement (mains, pieds).
  if (p.equipement.mains === undefined) p.equipement.mains = null;
  if (p.equipement.pieds === undefined) p.equipement.pieds = null;
  // v8 : classe, compétences de classe exclusives et points de maîtrise.
  if (!p.classe || !CLASSES[p.classe]) p.classe = infererClasse(p);
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
  if (!p.quetes || p.quetes.date !== new Date().toISOString().slice(0, 10)) {
    p.quetes = genererQuetesDuJour(p);
  }
  bornerVie(p);
  return p;
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
    tourBoss: p.tourBoss, metiers: p.metiers, metierPrincipal: p.metierPrincipal,
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
    afficherToast(`${hautFait.emoji} Haut fait : ${hautFait.nom} ! Titre débloqué : « ${hautFait.titre} »`);
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
function apprendreCompetence(p, id) {
  if (!p.grimoire.includes(id)) p.grimoire.push(id);
  if (!p.competences.includes(id) && p.competences.length < MAX_COMPETENCES_ACTIVES) {
    p.competences.push(id);
  }
}

// Débloque les compétences de classe atteintes (signature au niveau 1,
// puis une aux niveaux 5, 10 et 15 — 4 par classe au total).
function debloquerCompetencesClasse(p, annoncer) {
  Object.entries(COMPETENCES).forEach(([id, comp]) => {
    if (comp.classe !== p.classe || p.grimoire.includes(id)) return;
    if ((comp.niveauRequis || 1) > p.niveau) return;
    apprendreCompetence(p, id);
    if (annoncer) afficherToast(`🏅 Compétence de classe débloquée : ${comp.emoji} ${comp.nom} !`);
  });
}

// Gagne de l'XP ; une montée de niveau soigne entièrement (le fameux « ding »).
function gagnerXp(p, xp) {
  const avant = p.niveau;
  // Rythme global de progression : gains réduits de 65 % (réglage v11).
  xp = Math.max(1, Math.round(xp * 0.35));
  if (p.race === 'humain') xp = Math.round(xp * 1.1); // Ambition
  const familier = familierActif(p);
  if (familier && familier.bonus.xpBonus) xp = Math.round(xp * (1 + familier.bonus.xpBonus));
  const sets = bonusSetActifs(p);
  if (sets.xpBonus) xp = Math.round(xp * (1 + sets.xpBonus));
  p.xp += xp;
  const apres = niveauPour(p.xp);
  if (apres > avant) {
    p.pointsEnAttente += POINTS_PAR_NIVEAU * (apres - avant);
    NIVEAUX_NOUVELLE_COMPETENCE.forEach((seuil) => {
      if (avant < seuil && apres >= seuil) p.competencesEnAttente++;
    });
    // Points de maîtrise de la signature (niveaux 3, 6, 9, 12, 15, 18)
    p.maitrise = (p.maitrise || 0) + pointsMaitrisePourNiveau(apres) - pointsMaitrisePourNiveau(avant);
    p.niveau = apres;
    // Nouvelles compétences de classe atteintes (niveaux 5, 10, 15)
    debloquerCompetencesClasse(p, true);
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
        <span class="niveau">Niveau ${p.niveau} · 💰 ${p.po} po${p.cloud ? ' · ☁️ relié au monde' : ''}</span></div>
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
function demarrerCreation() {
  const stats = {};
  Object.keys(CARACS).forEach((cle) => { stats[cle] = STAT_BASE; });
  etat.brouillon = {
    nom: '',
    avatar: AVATARS[etat.profils.length % AVATARS.length],
    race: 'humain',
    classe: 'aventurier',
    stats,
    competences: new Set(),
  };
  el('creation-nom').value = '';
  el('creation-titre').textContent = 'Crée ton héros';
  rendreCreation();
  montrerEcran('ecran-creation');
}

function pointsRestants() {
  const b = etat.brouillon;
  const cles = Object.keys(CARACS);
  const utilises = cles.reduce((somme, cle) => somme + b.stats[cle], 0) - cles.length * STAT_BASE;
  return POINTS_CREATION - utilises;
}

function rendreCreation() {
  const b = etat.brouillon;

  const zoneAvatars = el('creation-avatars');
  zoneAvatars.innerHTML = '';
  AVATARS.forEach((a) => {
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
    btn.className = 'btn-choix' + (b.classe === m.id ? ' selectionne' : '');
    btn.textContent = `${m.emoji} ${m.nom}`;
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
    <br>4 compétences exclusives par classe, améliorables avec les points de maîtrise (paliers de niveau — +15 % par rang).`;
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
    Object.entries(COMPETENCES)
      .filter(([, comp]) => comp.categorie === catCle)
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
  monter.textContent = p.maitrise > 0
    ? `🏅 Passer au rang ${rang + 1} (+15 % de puissance)`
    : `🏅 Rang ${rang}/${RANG_SIGNATURE_MAX} — point de maîtrise au niveau ${SEUILS_MAITRISE.find((seuil) => seuil > p.niveau) || 18}`;
  monter.disabled = p.maitrise <= 0;
  monter.addEventListener('click', () => {
    if (p.maitrise <= 0 || rangDe(p, id) >= RANG_SIGNATURE_MAX) return;
    p.maitrise--;
    p.rangs[id] = rangDe(p, id) + 1;
    sauvegarder(p);
    afficherToast(`🏅 ${comp.nom} passe au rang ${p.rangs[id]} : +${p.rangs[id] * 15} % de puissance !`);
    rendreHeros();
    rendreTopbar();
  });
  carte.appendChild(monter);
}

function validerCreation() {
  const b = etat.brouillon;
  const nom = el('creation-nom').value.trim() || `Héros ${etat.profils.length + 1}`;
  const p = nouveauPersonnage({ nom, avatar: b.avatar, race: b.race, classe: b.classe, stats: b.stats, competences: [...b.competences] });
  etat.profils.push(p);
  etat.actifId = p.id;
  etat.equipe = [p.id];
  sauvegarderLocal();
  if (typeof creerPersonnageCloud === 'function') creerPersonnageCloud(p);
  afficherToast(`${p.avatar} ${p.nom} rejoint les Royaumes de Valciel !`);
  rendreCarte();
  montrerEcran('ecran-carte');
}

// =====================================================================
// Héros admin : un bac à sable local avec une console pour tout modifier.
// Jamais relié au monde en ligne (ni classement, ni taverne).
// =====================================================================
function creerHerosAdmin() {
  const p = nouveauPersonnage({
    nom: `Admin ${etat.profils.filter((x) => x.admin).length + 1}`,
    avatar: '🛠️',
    race: 'humain',
    classe: 'aventurier',
    stats: { for: 5, int: 5, agi: 5, vit: 5, cha: 5 },
    competences: ['frappe-heroique', 'boule-de-feu', 'soin', 'tir-precis'],
  });
  p.admin = true;
  p.po = 100000;
  etat.profils.push(p);
  etat.actifId = p.id;
  etat.equipe = [p.id];
  sauvegarderLocal();
  afficherToast('🛠️ Héros admin créé — sa console vous attend sur sa fiche (onglet Héros). Il reste local, jamais publié en ligne.');
  rendreCarte();
  montrerEcran('ecran-carte');
}

// Fixe directement le niveau (console d'admin), avec tous les déblocages.
function adminFixerNiveau(p, n) {
  n = Math.max(1, Math.min(NIVEAU_MAX, n));
  const avant = p.niveau;
  p.xp = seuilXp(n);
  p.niveau = n;
  if (n > avant) {
    p.pointsEnAttente += POINTS_PAR_NIVEAU * (n - avant);
    NIVEAUX_NOUVELLE_COMPETENCE.forEach((seuil) => {
      if (avant < seuil && n >= seuil) p.competencesEnAttente++;
    });
    p.maitrise = (p.maitrise || 0) + pointsMaitrisePourNiveau(n) - pointsMaitrisePourNiveau(avant);
    debloquerCompetencesClasse(p, false);
  }
  bornerVie(p);
  p.hp = p.maxHp;
  p.mp = p.maxMp;
}

function rendreConsoleAdmin(zone, p) {
  const bloc = document.createElement('div');
  bloc.className = 'panneau panneau-admin';
  bloc.innerHTML = `<h3>🛠️ Console d'admin</h3>
    <p class="aide">Héros bac à sable : modifiez tout, testez tout. Il n'est jamais publié en ligne — le classement des vrais joueurs reste honnête.</p>`;

  const actions = [
    ['⬆️ Niveau +1', () => adminFixerNiveau(p, p.niveau + 1)],
    ['⬆️ Niveau +5', () => adminFixerNiveau(p, p.niveau + 5)],
    ['🌟 Niveau 50', () => adminFixerNiveau(p, 50)],
    ['💰 +10 000 po', () => { p.po += 10000; }],
    ['🏅 +5 maîtrise', () => { p.maitrise = (p.maitrise || 0) + 5; }],
    ['📚 Toutes les compétences', () => { Object.keys(COMPETENCES).forEach((id) => { if (!COMPETENCES[id].classe || COMPETENCES[id].classe === p.classe) apprendreCompetence(p, id); }); }],
    ['🐾 Tous les familiers', () => { p.familiers = Object.keys(FAMILIERS); }],
    ['⛏️ Matériaux ×25', () => { Object.entries(OBJETS).forEach(([id, o]) => { if (o.type === 'materiau') ajouterObjet(p, id, 25); }); }],
    ['🧪 Potions ×10', () => { Object.entries(OBJETS).forEach(([id, o]) => { if (o.type === 'consommable') ajouterObjet(p, id, 10); }); }],
    ['❤️ Soin complet', () => { p.hp = p.maxHp; p.mp = p.maxMp; }],
    ['💪 +5 à toutes les stats', () => { Object.keys(CARACS).forEach((cle) => { p.stats[cle] += 5; }); bornerVie(p); }],
    ['📜 Contrats du jour remplis', () => { p.quetes.liste.forEach((q) => { q.fait = q.requis; }); }],
    ['🧰 Métiers au maximum', () => { Object.keys(METIERS).forEach((id) => { metierDe(p, id).niveau = NIVEAU_MAX_METIER; metierDe(p, id).xp = 0; }); }],
  ];
  const rangee = document.createElement('div');
  rangee.className = 'rangee-boutons';
  actions.forEach(([libelle, action]) => {
    const btn = document.createElement('button');
    btn.className = 'btn-choix btn-compact';
    btn.textContent = libelle;
    btn.addEventListener('click', () => {
      action();
      sauvegarderLocal();
      afficherToast(`🛠️ ${libelle} — fait.`);
      rendreHeros();
      rendreTopbar();
    });
    rangee.appendChild(btn);
  });
  bloc.appendChild(rangee);

  // Donner n'importe quel objet, par nom ou par identifiant.
  const ligneObjet = document.createElement('div');
  ligneObjet.className = 'rangee-boutons';
  const champ = document.createElement('input');
  champ.id = 'admin-objet';
  champ.placeholder = 'Nom ou id d’objet (ex : Lame du Firmament)';
  champ.className = 'champ-comptoir large';
  champ.style.width = '280px';
  const donner = document.createElement('button');
  donner.className = 'btn-choix btn-compact';
  donner.textContent = '🎁 Donner ×1';
  const donnerDix = document.createElement('button');
  donnerDix.className = 'btn-choix btn-compact';
  donnerDix.textContent = '🎁 ×10';
  const chercherEtDonner = (qte) => {
    const requete = champ.value.trim().toLowerCase();
    if (!requete) return;
    const trouve = OBJETS[requete]
      ? [requete, OBJETS[requete]]
      : Object.entries(OBJETS).find(([, o]) => o.nom.toLowerCase().includes(requete));
    if (!trouve) { afficherToast(`🛠️ Aucun objet ne correspond à « ${champ.value} ».`); return; }
    ajouterObjet(p, trouve[0], qte);
    sauvegarderLocal();
    afficherToast(`🛠️ ${trouve[1].emoji} ${trouve[1].nom} ×${qte} ajouté au sac.`);
    rendreTopbar();
  };
  donner.addEventListener('click', () => chercherEtDonner(1));
  donnerDix.addEventListener('click', () => chercherEtDonner(10));
  ligneObjet.appendChild(champ);
  ligneObjet.appendChild(donner);
  ligneObjet.appendChild(donnerDix);
  bloc.appendChild(ligneObjet);
  zone.appendChild(bloc);
}

// =====================================================================
// Fiche du héros : stats, compétences, équipement, inventaire, code
// =====================================================================
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
      <h2>${echapper(p.nom)}${titreActif ? ` <span class="titre-heros">${titreActif.titre}</span>` : ''} <span class="niveau">${classe.emoji} ${classe.nom} · niveau ${p.niveau}</span>
        <button id="btn-renommer" class="btn-choix btn-compact btn-renommer" title="Changer le nom de ce héros">✏️ Renommer</button></h2>
      <div id="zone-renommage" class="cache ligne-renommage">
        <input id="champ-renommage" maxlength="16" placeholder="Nouveau nom">
        <button id="btn-valider-renommage" class="btn-choix btn-compact">Valider</button>
      </div>
      <div class="heros-race">${race.emoji} ${race.nom} — <em>${race.passif}</em> : ${race.desc}</div>
      <div class="barre xp"><div class="remplissage" style="width:${pctXp}%"></div>
        <span>${suivant ? `${p.xp} / ${suivant} XP` : 'niveau maximum'}</span></div>
      <div class="heros-vitaux">❤️ ${p.hp}/${p.maxHp} PV · 💧 ${p.mp}/${p.maxMp} PM · 💰 ${p.po} po · 💥 ${Math.round(5 + s.agi + s.crit + (p.race === 'elfe' ? 5 : 0))} % crit. · 🍀 +${Math.round((multChanceDrop(s.cha) - 1) * 100)} % butin${s.blocage ? ` · 🛡️ ${Math.min(40, s.blocage)} % blocage` : ''}${s.esquive ? ` · 💨 ${Math.min(35, s.esquive)} % esquive` : ''}</div>
    </div>`;
  zone.appendChild(entete);

  // Console d'admin (héros bac à sable uniquement)
  if (p.admin) rendreConsoleAdmin(zone, p);

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

  // --- Caractéristiques ---
  const blocStats = document.createElement('div');
  blocStats.className = 'panneau';
  blocStats.innerHTML = `<h3>Caractéristiques${p.pointsEnAttente > 0 ? ` <span class="badge badge-alerte">${p.pointsEnAttente} point${p.pointsEnAttente > 1 ? 's' : ''} à répartir !</span>` : ''}</h3>`;
  Object.entries(CARACS).forEach(([cle, c]) => {
    const bonus = s[cle] - p.stats[cle];
    const ligne = document.createElement('div');
    ligne.className = 'ligne-stat';
    ligne.innerHTML = `
      <span class="stat-nom">${c.emoji} ${c.nom}</span>
      <span class="stat-valeur">${p.stats[cle]}${bonus > 0 ? `<span class="bonus-equip"> +${bonus}</span>` : ''}</span>
      <span class="stat-desc">${c.desc}</span>`;
    if (p.pointsEnAttente > 0) {
      const plus = document.createElement('button');
      plus.className = 'btn-mini';
      plus.textContent = '+';
      plus.addEventListener('click', () => {
        p.stats[cle]++;
        p.pointsEnAttente--;
        bornerVie(p);
        sauvegarder(p);
        rendreHeros();
        rendreTopbar();
      });
      ligne.insertBefore(plus, ligne.querySelector('.stat-desc'));
    }
    blocStats.appendChild(ligne);
  });
  zone.appendChild(blocStats);

  // --- Nouvelle compétence à apprendre (montée de niveau) ---
  if (p.competencesEnAttente > 0) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau bloc-apprentissage';
    bloc.innerHTML = `<h3>📖 Nouvelle compétence à apprendre (${p.competencesEnAttente})</h3>
      <p class="aide">La compétence choisie rejoint votre grimoire — et vos actives s'il reste une place.</p>`;
    const grille = document.createElement('div');
    grille.className = 'grille-competences';
    Object.entries(COMPETENCES)
      .filter(([id, comp]) => !p.grimoire.includes(id) && !comp.classe)
      .forEach(([id, comp]) => {
        grille.appendChild(carteCompetence(id, comp, {
          stats: s,
          cliquable: true,
          surClic: () => {
            apprendreCompetence(p, id);
            p.competencesEnAttente--;
            sauvegarder(p);
            afficherToast(`${comp.emoji} ${p.nom} apprend ${comp.nom} !`);
            rendreHeros();
            rendreTopbar();
          },
        }));
      });
    bloc.appendChild(grille);
    zone.appendChild(bloc);
  }

  // --- Compétences actives (max 8) et grimoire ---
  const blocComp = document.createElement('div');
  blocComp.className = 'panneau';
  blocComp.innerHTML = `<h3>⚡ Compétences actives (${p.competences.length}/${MAX_COMPETENCES_ACTIVES})
    ${p.maitrise > 0 ? `<span class="badge badge-alerte">🏅 ${p.maitrise} point${p.maitrise > 1 ? 's' : ''} de maîtrise à investir !</span>` : ''}</h3>
    <p class="aide">Ce sont elles que vous lancez en combat. Retirez-en, équipez-en d'autres depuis le grimoire — autant de fois que vous voulez, hors combat.
    Votre signature de classe se renforce avec les points de maîtrise (niv. 3, 6, 9, 12, 15, 18).</p>`;
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
    aide.textContent = 'Toutes vos compétences connues sont actives. Débloquez-en d’autres en montant de niveau — ou achetez des grimoires à la boutique !';
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
    titreArbre.textContent = `🏅 Arbre de ${classe.nom} — à débloquer`;
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

  // --- Panoplies actives ---
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

  // --- Familiers ---
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

  // --- Métiers de récolte et spécialité (v12) ---
  const blocMetiers = document.createElement('div');
  blocMetiers.className = 'panneau';
  blocMetiers.innerHTML = '<h3>🧰 Métiers de récolte</h3>'
    + '<p class="aide">Pratiquez sur la carte (miner, dépecer, herboriser) pour progresser. '
    + 'La <strong>spécialité</strong> ⭐ — votre sous-classe de récolteur — se choisit au '
    + `niveau ${NIVEAU_SPECIALITE} : le spécialiste récolte plus (quantités, matériaux signatures) `
    + 'et progresse deux fois plus vite dans son métier — et plus sa Chance est haute, plus l’écart se creuse. '
    + `En changer coûte ${COUT_CHANGEMENT_SPECIALITE} po.</p>`;
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
        + (p.metierPrincipal ? `Changer de spécialité coûte ${COUT_CHANGEMENT_SPECIALITE} po.` : 'Cliquez pour en faire votre spécialité (gratuit).');
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
        afficherToast(`💰 Changer de spécialité coûte ${COUT_CHANGEMENT_SPECIALITE} po.`);
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

  // --- Hauts faits et titres ---
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

  // --- Code de sauvegarde (jouer sur un autre appareil) ---
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
  } else {
    const note = document.createElement('p');
    note.className = 'aide';
    note.textContent = etat.enLigne
      ? 'Ce héros n’est pas encore relié au monde en ligne.'
      : 'Le monde en ligne est injoignable pour le moment — le code apparaîtra dès que la connexion sera rétablie.';
    blocCode.appendChild(note);
    if (etat.enLigne && typeof creerPersonnageCloud === 'function') {
      const relier = document.createElement('button');
      relier.className = 'btn-choix';
      relier.textContent = '☁️ Relier au monde';
      relier.addEventListener('click', async () => {
        await creerPersonnageCloud(p);
        rendreHeros();
      });
      blocCode.appendChild(relier);
    }
  }
  zone.appendChild(blocCode);
}

// =====================================================================
// Le Sac : équipement porté + inventaire (écran séparé de la fiche)
// =====================================================================
let sousFiltreSac = 'tous';

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
    const caseSlot = document.createElement('div');
    caseSlot.className = 'case-equipement' + (idObjet ? ' occupee' : '');
    if (idObjet) {
      const objet = OBJETS[idObjet];
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
  blocInv.appendChild(rangeeFiltres);

  const entrees = p.inventaire.filter((entree) => {
    const objet = OBJETS[entree.id];
    return objet && (sousFiltreSac === 'tous' || objet.type === sousFiltreSac);
  });
  if (entrees.length === 0) {
    const vide = document.createElement('p');
    vide.className = 'aide';
    vide.textContent = p.inventaire.length === 0
      ? 'Votre sac est vide. Le monde regorge de trésors !'
      : 'Rien dans cette catégorie.';
    blocInv.appendChild(vide);
  } else {
    const grille = document.createElement('div');
    grille.className = 'grille-inventaire';
    entrees.forEach((entree) => {
      const objet = OBJETS[entree.id];
      const carte = document.createElement('div');
      carte.className = `carte-objet bord-rar-${rareteDe(objet)}`;
      carte.innerHTML = `
        <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)} <span class="objet-qte">×${entree.qte}</span></div>
        <div class="objet-desc">${objet.desc || ''}</div>
        ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
        ${texteSet(objet)}
        ${objet.type === 'equipement' ? `<div class="objet-niveau ${p.niveau < objet.niveau ? 'niveau-insuffisant' : ''}">niv. ${objet.niveau} requis</div>` : ''}`;
      if (objet.type === 'equipement') {
        const equiperBtn = document.createElement('button');
        equiperBtn.className = 'btn-choix btn-compact';
        equiperBtn.textContent = 'Équiper';
        equiperBtn.disabled = p.niveau < objet.niveau;
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
      grille.appendChild(carte);
    });
    blocInv.appendChild(grille);
  }
  zone.appendChild(blocInv);
}

function equiper(p, idObjet) {
  const objet = OBJETS[idObjet];
  if (!objet || objet.type !== 'equipement' || p.niveau < objet.niveau) return;
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
    creerHerosAdmin();
    return;
  }
  const morceaux = code.split('.');
  if (morceaux.length !== 2) {
    message.textContent = 'Code invalide : il doit contenir deux parties séparées par un point.';
    return;
  }
  message.textContent = 'Recherche du héros…';
  const donnees = await recupererPersonnageCloud(morceaux[0], morceaux[1]);
  if (!donnees) {
    message.textContent = etat.enLigne
      ? 'Héros introuvable : vérifiez le code.'
      : 'Le monde en ligne est injoignable pour le moment.';
    return;
  }
  const d = donnees.donnees || {};
  const p = nouveauPersonnage({
    nom: donnees.nom, avatar: donnees.avatar || '⚔️',
    stats: d.stats || { for: 4, int: 4, agi: 4, vit: 4 },
    competences: d.competences || [],
  });
  if (Array.isArray(d.grimoire)) {
    d.grimoire.forEach((id) => { if (!p.grimoire.includes(id)) p.grimoire.push(id); });
  }
  if (d.classe && CLASSES[d.classe]) p.classe = d.classe;
  if (d.rangs && typeof d.rangs === 'object') p.rangs = d.rangs;
  if (d.maitrise != null) p.maitrise = d.maitrise;
  normaliserPerso(p); // signature de classe, maîtrise et grimoire cohérents
  p.niveau = donnees.niveau || 1;
  p.xp = donnees.xp || 0;
  p.pointsEnAttente = d.pointsEnAttente || 0;
  p.competencesEnAttente = d.competencesEnAttente || 0;
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
  if (d.quetes && d.quetes.date) p.quetes = d.quetes;
  p.cloud = { id: morceaux[0], token: morceaux[1] };
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
  el('creation-annuler').addEventListener('click', () => { rendreTitre(); montrerEcran('ecran-titre'); });
  el('btn-importer').addEventListener('click', () => el('zone-import').classList.toggle('cache'));
  el('btn-valider-import').addEventListener('click', importerHeros);
  el('equipe-valider').addEventListener('click', () => {
    rendreCarte();
    montrerEcran('ecran-carte');
  });
  el('butin-continuer').addEventListener('click', () => continuerApresButin());

  document.querySelectorAll('#topbar-nav button').forEach((btn) => {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiser);
} else {
  initialiser();
}
