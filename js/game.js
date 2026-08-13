'use strict';

// =====================================================================
// État global, navigation entre écrans, création de personnage,
// campement et progression.
// =====================================================================

const etat = {
  nbJoueurs: 0,
  joueurs: [],
  indexCreation: 0,
  rencontreIndex: 0,
  combat: null,
  brouillon: null, // personnage en cours de création
};

// ----- Petits utilitaires -----
const el = (id) => document.getElementById(id);

function montrerEcran(id) {
  document.querySelectorAll('.ecran').forEach((e) => e.classList.remove('actif'));
  el(id).classList.add('actif');
  window.scrollTo(0, 0);
}

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
  div.textContent = texte;
  return div.innerHTML;
}

// =====================================================================
// Accueil
// =====================================================================
function initAccueil() {
  const zone = el('choix-nb-joueurs');
  zone.innerHTML = '';
  for (let n = 1; n <= 5; n++) {
    const btn = document.createElement('button');
    btn.className = 'btn-choix';
    btn.textContent = n === 1 ? '1 joueur' : `${n} joueurs`;
    btn.addEventListener('click', () => {
      etat.nbJoueurs = n;
      etat.joueurs = [];
      etat.indexCreation = 0;
      etat.rencontreIndex = 0;
      demarrerCreation();
    });
    zone.appendChild(btn);
  }
}

// =====================================================================
// Création de personnage
// =====================================================================
function demarrerCreation() {
  etat.brouillon = {
    nom: '',
    avatar: AVATARS[etat.indexCreation % AVATARS.length],
    stats: { for: STAT_BASE, int: STAT_BASE, agi: STAT_BASE, vit: STAT_BASE },
    competences: new Set(),
  };
  el('creation-nom').value = '';
  el('creation-titre').textContent = `Joueur ${etat.indexCreation + 1} sur ${etat.nbJoueurs} — Crée ton personnage`;
  rendreCreation();
  montrerEcran('ecran-creation');
}

function pointsRestants() {
  const b = etat.brouillon;
  const utilises = b.stats.for + b.stats.int + b.stats.agi + b.stats.vit - 4 * STAT_BASE;
  return POINTS_CREATION - utilises;
}

function rendreCreation() {
  const b = etat.brouillon;

  // Avatars
  const zoneAvatars = el('creation-avatars');
  zoneAvatars.innerHTML = '';
  AVATARS.forEach((a) => {
    const btn = document.createElement('button');
    btn.className = 'avatar-choix' + (b.avatar === a ? ' selectionne' : '');
    btn.textContent = a;
    btn.addEventListener('click', () => { b.avatar = a; rendreCreation(); });
    zoneAvatars.appendChild(btn);
  });

  // Modèles rapides
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

  // Caractéristiques
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

  // Compétences
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
  const cibleTexte = {
    ennemi: 'un ennemi', ennemis: 'tous les ennemis',
    allie: 'un allié', allies: 'tout le groupe', soi: 'soi-même',
  }[comp.cible];
  carte.innerHTML = `
    <div class="comp-entete">${comp.emoji} <strong>${comp.nom}</strong></div>
    <div class="comp-desc">${comp.desc}</div>
    <div class="comp-infos">🎯 ${cibleTexte} · 💧 ${comp.coutMp} PM${comp.cooldown ? ` · ⏳ ${comp.cooldown} tours` : ''}</div>`;
  if (options.cliquable && options.surClic) carte.addEventListener('click', options.surClic);
  return carte;
}

function validerCreation() {
  const b = etat.brouillon;
  const nom = el('creation-nom').value.trim() || `Héros ${etat.indexCreation + 1}`;
  const stats = { ...b.stats };
  const joueur = {
    type: 'joueur',
    id: `j${etat.indexCreation}`,
    nom,
    avatar: b.avatar,
    stats,
    niveau: 1,
    xp: 0,
    pointsEnAttente: 0,
    competencesEnAttente: 0,
    competences: [...b.competences],
    maxHp: maxHpPour(stats, 1),
    maxMp: maxMpPour(stats, 1),
    hp: 0,
    mp: 0,
    statuts: [],
    cooldowns: {},
    defense: false,
    ko: false,
  };
  joueur.hp = joueur.maxHp;
  joueur.mp = joueur.maxMp;
  etat.joueurs.push(joueur);
  etat.indexCreation++;
  if (etat.indexCreation < etat.nbJoueurs) {
    demarrerCreation();
  } else {
    rendreGroupe();
    montrerEcran('ecran-groupe');
  }
}

// =====================================================================
// Récapitulatif du groupe
// =====================================================================
function rendreGroupe() {
  const zone = el('groupe-cartes');
  zone.innerHTML = '';
  etat.joueurs.forEach((j) => zone.appendChild(carteRecap(j)));
}

function carteRecap(j) {
  const carte = document.createElement('div');
  carte.className = 'carte-recap';
  const listeComp = j.competences
    .map((id) => `<li>${COMPETENCES[id].emoji} ${COMPETENCES[id].nom}</li>`)
    .join('');
  carte.innerHTML = `
    <div class="recap-entete"><span class="avatar-grand">${j.avatar}</span>
      <div><strong>${echapper(j.nom)}</strong><br><span class="niveau">Niveau ${j.niveau}</span></div>
    </div>
    <div class="recap-stats">
      ❤️ ${j.maxHp} PV · 💧 ${j.maxMp} PM<br>
      💪 ${j.stats.for} · 🧠 ${j.stats.int} · 🏃 ${j.stats.agi} · ❤️ ${j.stats.vit}
    </div>
    <ul class="recap-competences">${listeComp}</ul>`;
  return carte;
}

// =====================================================================
// Campement (entre les combats) : repos, XP, montées de niveau
// =====================================================================
function allerAuCamp(xpGagnee) {
  etat.joueurs.forEach((j) => {
    // Repos : les KO se relèvent, tout le monde récupère
    if (j.ko) {
      j.ko = false;
      j.hp = Math.round(j.maxHp * 0.35);
    } else {
      j.hp = Math.min(j.maxHp, j.hp + Math.round(j.maxHp * 0.4));
    }
    j.mp = Math.min(j.maxMp, j.mp + Math.round(j.maxMp * 0.6));
    j.statuts = [];
    j.cooldowns = {};
    j.defense = false;

    // Expérience et montées de niveau
    const ancienNiveau = j.niveau;
    j.xp += xpGagnee;
    const nouveauNiveau = niveauPour(j.xp);
    if (nouveauNiveau > ancienNiveau) {
      j.pointsEnAttente += POINTS_PAR_NIVEAU * (nouveauNiveau - ancienNiveau);
      NIVEAUX_NOUVELLE_COMPETENCE.forEach((seuil) => {
        if (ancienNiveau < seuil && nouveauNiveau >= seuil) j.competencesEnAttente++;
      });
      const ancienMaxHp = j.maxHp;
      const ancienMaxMp = j.maxMp;
      j.niveau = nouveauNiveau;
      j.maxHp = maxHpPour(j.stats, j.niveau);
      j.maxMp = maxMpPour(j.stats, j.niveau);
      j.hp = Math.min(j.maxHp, j.hp + (j.maxHp - ancienMaxHp));
      j.mp = Math.min(j.maxMp, j.mp + (j.maxMp - ancienMaxMp));
    }
  });

  el('camp-message').textContent =
    `Victoire ! Chaque héros gagne ${xpGagnee} XP. Le groupe reprend des forces avant le combat suivant.`;
  rendreCamp();
  montrerEcran('ecran-camp');
}

function rendreCamp() {
  const zone = el('camp-cartes');
  zone.innerHTML = '';
  etat.joueurs.forEach((j) => zone.appendChild(carteCamp(j)));
  const tousPrets = etat.joueurs.every((j) => j.pointsEnAttente === 0 && j.competencesEnAttente === 0);
  const btn = el('camp-continuer');
  btn.disabled = !tousPrets;
  const derniere = etat.rencontreIndex >= RENCONTRES.length - 1;
  btn.textContent = tousPrets
    ? (derniere ? '⚔️ Affronter le gardien ➜' : 'Combat suivant ➜')
    : 'Terminez les montées de niveau…';
}

function carteCamp(j) {
  const carte = document.createElement('div');
  carte.className = 'carte-recap carte-camp';
  const prochainSeuil = j.niveau < NIVEAU_MAX ? SEUILS_XP[j.niveau] : null;
  carte.innerHTML = `
    <div class="recap-entete"><span class="avatar-grand">${j.avatar}</span>
      <div><strong>${echapper(j.nom)}</strong><br>
        <span class="niveau">Niveau ${j.niveau} · ${j.xp} XP${prochainSeuil ? ` (prochain niveau à ${prochainSeuil})` : ' (niveau max)'}</span>
      </div>
    </div>
    <div class="recap-stats">❤️ ${j.hp}/${j.maxHp} PV · 💧 ${j.mp}/${j.maxMp} PM</div>`;

  if (j.pointsEnAttente > 0) {
    const bloc = document.createElement('div');
    bloc.className = 'bloc-niveau';
    bloc.innerHTML = `<h4>📈 Niveau supérieur ! ${j.pointsEnAttente} point${j.pointsEnAttente > 1 ? 's' : ''} à répartir</h4>`;
    Object.entries(CARACS).forEach(([cle, c]) => {
      const ligne = document.createElement('div');
      ligne.className = 'ligne-stat';
      ligne.innerHTML = `
        <span class="stat-nom">${c.emoji} ${c.nom}</span>
        <span class="stat-valeur">${j.stats[cle]}</span>
        <button class="btn-mini" data-stat="${cle}">+</button>`;
      ligne.querySelector('button').addEventListener('click', () => {
        j.stats[cle]++;
        j.pointsEnAttente--;
        const ancienMaxHp = j.maxHp;
        const ancienMaxMp = j.maxMp;
        j.maxHp = maxHpPour(j.stats, j.niveau);
        j.maxMp = maxMpPour(j.stats, j.niveau);
        j.hp = Math.min(j.maxHp, j.hp + (j.maxHp - ancienMaxHp));
        j.mp = Math.min(j.maxMp, j.mp + (j.maxMp - ancienMaxMp));
        rendreCamp();
      });
      bloc.appendChild(ligne);
    });
    carte.appendChild(bloc);
  }

  if (j.competencesEnAttente > 0) {
    const bloc = document.createElement('div');
    bloc.className = 'bloc-niveau';
    bloc.innerHTML = `<h4>📖 Nouvelle compétence à apprendre (${j.competencesEnAttente})</h4>`;
    const grille = document.createElement('div');
    grille.className = 'grille-competences';
    Object.entries(COMPETENCES)
      .filter(([id]) => !j.competences.includes(id))
      .forEach(([id, comp]) => {
        grille.appendChild(carteCompetence(id, comp, {
          cliquable: true,
          surClic: () => {
            j.competences.push(id);
            j.competencesEnAttente--;
            rendreCamp();
          },
        }));
      });
    bloc.appendChild(grille);
    carte.appendChild(bloc);
  }

  return carte;
}

// =====================================================================
// Fin de partie
// =====================================================================
function ecranVictoireFinale(xpGagnee) {
  etat.joueurs.forEach((j) => {
    j.xp += xpGagnee || 0;
    j.niveau = niveauPour(j.xp);
  });
  el('fin-titre').textContent = '🏆 Victoire !';
  el('fin-message').textContent =
    'Le gardien des Profondeurs est tombé. Votre groupe ressort du donjon couvert de gloire !';
  const zone = el('fin-cartes');
  zone.innerHTML = '';
  etat.joueurs.forEach((j) => zone.appendChild(carteRecap(j)));
  montrerEcran('ecran-fin');
}

function ecranDefaite() {
  el('fin-titre').textContent = '💀 Défaite…';
  el('fin-message').textContent =
    'Tout le groupe est tombé au combat. Les Profondeurs gardent leurs secrets… pour cette fois.';
  const zone = el('fin-cartes');
  zone.innerHTML = '';
  etat.joueurs.forEach((j) => zone.appendChild(carteRecap(j)));
  montrerEcran('ecran-fin');
}

// =====================================================================
// Initialisation
// =====================================================================
function reinitialiserPartie() {
  etat.nbJoueurs = 0;
  etat.joueurs = [];
  etat.indexCreation = 0;
  etat.rencontreIndex = 0;
  etat.combat = null;
  etat.brouillon = null;
  montrerEcran('ecran-accueil');
}

function initialiser() {
  initAccueil();
  el('creation-valider').addEventListener('click', validerCreation);
  el('groupe-commencer').addEventListener('click', () => demarrerCombat(etat.rencontreIndex));
  el('camp-continuer').addEventListener('click', () => {
    etat.rencontreIndex++;
    demarrerCombat(etat.rencontreIndex);
  });
  el('fin-rejouer').addEventListener('click', reinitialiserPartie);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiser);
} else {
  initialiser();
}
