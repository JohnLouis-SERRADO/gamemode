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
  'ecran-boutique', 'ecran-antiquaire', 'ecran-guilde', 'ecran-atelier', 'ecran-heros',
  'ecran-taverne', 'ecran-groupe-ligne', 'ecran-donjon'];

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
  window.scrollTo(0, 0);
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
  badge.classList.toggle('cache', !(p.pointsEnAttente > 0 || p.competencesEnAttente > 0));
  el('point-en-ligne').classList.toggle('actif-reseau', etat.enLigne);
}

function naviguer(destination) {
  if (combatEnCours()) return;
  if (destination !== 'titre' && !persoActif()) return;
  switch (destination) {
    case 'carte': rendreCarte(); montrerEcran('ecran-carte'); break;
    case 'ville': rendreVille(); montrerEcran('ecran-ville'); break;
    case 'heros': rendreHeros(); montrerEcran('ecran-heros'); break;
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
  if (!p.donjons || typeof p.donjons !== 'object') p.donjons = {};
  if (!p.quetes || p.quetes.date !== new Date().toISOString().slice(0, 10)) {
    p.quetes = genererQuetesDuJour(p);
  }
  bornerVie(p);
  return p;
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
    competences: p.competences, po: p.po, inventaire: p.inventaire,
    equipement: p.equipement, hp: p.hp, mp: p.mp,
    explorations: p.explorations, bossVaincus: p.bossVaincus,
    compteurs: p.compteurs, familiers: p.familiers, familier: p.familier,
    hautsFaits: p.hautsFaits, titre: p.titre, tourMax: p.tourMax, quetes: p.quetes,
    donjons: p.donjons,
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

// Gagne de l'XP ; une montée de niveau soigne entièrement (le fameux « ding »).
function gagnerXp(p, xp) {
  const avant = p.niveau;
  if (p.race === 'humain') xp = Math.round(xp * 1.1); // Ambition
  const familier = familierActif(p);
  if (familier && familier.bonus.xpBonus) xp = Math.round(xp * (1 + familier.bonus.xpBonus));
  p.xp += xp;
  const apres = niveauPour(p.xp);
  if (apres > avant) {
    p.pointsEnAttente += POINTS_PAR_NIVEAU * (apres - avant);
    NIVEAUX_NOUVELLE_COMPETENCE.forEach((seuil) => {
      if (avant < seuil && apres >= seuil) p.competencesEnAttente++;
    });
    p.niveau = apres;
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
    jouer.textContent = '▶ Jouer';
    jouer.addEventListener('click', () => {
      etat.actifId = p.id;
      etat.equipe = [p.id];
      sauvegarderLocal();
      rendreCarte();
      montrerEcran('ecran-carte');
    });
    boutons.appendChild(jouer);
    boutons.appendChild(boutonConfirmation('🗑 Supprimer', 'Vraiment supprimer ?', () => {
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
    btn.className = 'btn-choix';
    btn.textContent = `${m.emoji} ${m.nom}`;
    btn.addEventListener('click', () => {
      b.stats = { ...m.stats };
      b.competences = new Set(m.competences);
      rendreCreation();
    });
    zoneModeles.appendChild(btn);
  });

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
    + (options.selectionnee ? ' selectionnee' : '')
    + (options.cliquable ? ' cliquable' : '');
  // Détails chiffrés calculés avec les stats fournies (héros ou brouillon).
  const infos = detailsCompetence(comp, options.stats || {});
  carte.innerHTML = `
    <div class="comp-entete">${comp.emoji} <strong>${comp.nom}</strong></div>
    <div class="comp-desc">${comp.desc}</div>
    <div class="comp-infos">${infos.join(' · ')}</div>`;
  if (options.cliquable && options.surClic) rendreCliquable(carte, options.surClic);
  return carte;
}

function validerCreation() {
  const b = etat.brouillon;
  const nom = el('creation-nom').value.trim() || `Héros ${etat.profils.length + 1}`;
  const p = nouveauPersonnage({ nom, avatar: b.avatar, race: b.race, stats: b.stats, competences: [...b.competences] });
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
  const familier = familierActif(p);
  const titreActif = p.titre ? HAUTS_FAITS.find((h) => h.id === p.titre) : null;
  entete.innerHTML = `
    <span class="avatar-titan">${p.avatar}${familier ? `<span class="familier-avatar" title="${familier.nom}">${familier.emoji}</span>` : ''}</span>
    <div class="heros-identite">
      <h2>${echapper(p.nom)}${titreActif ? ` <span class="titre-heros">${titreActif.titre}</span>` : ''} <span class="niveau">niveau ${p.niveau}</span></h2>
      <div class="heros-race">${race.emoji} ${race.nom} — <em>${race.passif}</em> : ${race.desc}</div>
      <div class="barre xp"><div class="remplissage" style="width:${pctXp}%"></div>
        <span>${suivant ? `${p.xp} / ${suivant} XP` : 'niveau maximum'}</span></div>
      <div class="heros-vitaux">❤️ ${p.hp}/${p.maxHp} PV · 💧 ${p.mp}/${p.maxMp} PM · 💰 ${p.po} po · 💥 ${Math.round(5 + s.agi + s.crit + (p.race === 'elfe' ? 5 : 0))} % crit. · 🍀 +${Math.round((multChanceDrop(s.cha) - 1) * 100)} % butin</div>
    </div>`;
  zone.appendChild(entete);

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

  // --- Nouvelle compétence à apprendre ---
  if (p.competencesEnAttente > 0) {
    const bloc = document.createElement('div');
    bloc.className = 'panneau bloc-apprentissage';
    bloc.innerHTML = `<h3>📖 Nouvelle compétence à apprendre (${p.competencesEnAttente})</h3>`;
    const grille = document.createElement('div');
    grille.className = 'grille-competences';
    Object.entries(COMPETENCES)
      .filter(([id]) => !p.competences.includes(id))
      .forEach(([id, comp]) => {
        grille.appendChild(carteCompetence(id, comp, {
          stats: s,
          cliquable: true,
          surClic: () => {
            p.competences.push(id);
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

  // --- Compétences connues (avec détails chiffrés) ---
  const blocComp = document.createElement('div');
  blocComp.className = 'panneau';
  blocComp.innerHTML = '<h3>Compétences connues</h3>';
  const grilleComp = document.createElement('div');
  grilleComp.className = 'grille-competences';
  p.competences.forEach((id) => {
    const comp = COMPETENCES[id];
    if (!comp) return;
    grilleComp.appendChild(carteCompetence(id, comp, { stats: s }));
  });
  blocComp.appendChild(grilleComp);
  zone.appendChild(blocComp);

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

  // --- Équipement ---
  const blocEquip = document.createElement('div');
  blocEquip.className = 'panneau';
  blocEquip.innerHTML = '<h3>Équipement</h3>';
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
        <div class="case-bonus">${texteBonus(objet.bonus)}</div>`;
      const retirer = document.createElement('button');
      retirer.className = 'btn-choix btn-compact';
      retirer.textContent = 'Retirer';
      retirer.addEventListener('click', () => {
        ajouterObjet(p, idObjet);
        p.equipement[slot] = null;
        bornerVie(p);
        sauvegarder(p);
        rendreHeros();
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

  // --- Inventaire ---
  const blocInv = document.createElement('div');
  blocInv.className = 'panneau';
  blocInv.innerHTML = '<h3>Inventaire</h3>';
  if (p.inventaire.length === 0) {
    const vide = document.createElement('p');
    vide.className = 'aide';
    vide.textContent = 'Votre sac est vide. Le monde regorge de trésors !';
    blocInv.appendChild(vide);
  } else {
    const grille = document.createElement('div');
    grille.className = 'grille-inventaire';
    p.inventaire.forEach((entree) => {
      const objet = OBJETS[entree.id];
      if (!objet) return;
      const carte = document.createElement('div');
      carte.className = `carte-objet bord-rar-${rareteDe(objet)}`;
      carte.innerHTML = `
        <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)} <span class="objet-qte">×${entree.qte}</span></div>
        <div class="objet-desc">${objet.desc || ''}</div>
        ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
        ${objet.type === 'equipement' ? `<div class="objet-niveau ${p.niveau < objet.niveau ? 'niveau-insuffisant' : ''}">niv. ${objet.niveau} requis</div>` : ''}`;
      if (objet.type === 'equipement') {
        const equiperBtn = document.createElement('button');
        equiperBtn.className = 'btn-choix btn-compact';
        equiperBtn.textContent = 'Équiper';
        equiperBtn.disabled = p.niveau < objet.niveau;
        equiperBtn.addEventListener('click', () => {
          equiper(p, entree.id);
          rendreHeros();
          rendreTopbar();
        });
        carte.appendChild(equiperBtn);
      } else if (objet.type === 'consommable') {
        const utiliser = document.createElement('button');
        utiliser.className = 'btn-choix btn-compact';
        utiliser.textContent = 'Utiliser';
        utiliser.addEventListener('click', () => {
          utiliserConsommable(p, entree.id);
          rendreHeros();
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
  p.niveau = donnees.niveau || 1;
  p.xp = donnees.xp || 0;
  p.pointsEnAttente = d.pointsEnAttente || 0;
  p.competencesEnAttente = d.competencesEnAttente || 0;
  p.po = d.po != null ? d.po : 60;
  p.inventaire = Array.isArray(d.inventaire) ? d.inventaire : [];
  p.equipement = { arme: null, tete: null, torse: null, jambes: null, acc1: null, acc2: null, ...(d.equipement || {}) };
  p.explorations = d.explorations || {};
  p.bossVaincus = d.bossVaincus || [];
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

  rendreTitre();
  montrerEcran('ecran-titre');
  if (typeof demarrerReseau === 'function') demarrerReseau();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiser);
} else {
  initialiser();
}
