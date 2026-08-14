'use strict';

// =====================================================================
// Moteur de combat tour par tour : initiative, tours des joueurs et des
// monstres, dégâts, soins, effets de statut, objets, fuite.
// Genres de combat : exploration, embuscade, boss (de zone), bossMonde.
// =====================================================================

const EMOJI_STATUT = {
  poison: '🧪', etourdi: '💫', bouclier: '🛡️',
  benediction: '🙏', provocation: '😤', regen: '💧', affaibli: '⬇️',
};

const NOM_STATUT = {
  poison: 'Empoisonné', etourdi: 'Étourdi', bouclier: 'Bouclier',
  benediction: 'Bénédiction (+30 % dégâts)', provocation: 'Provocation',
  regen: 'Régénération', affaibli: 'Affaibli (−30 % dégâts)',
};

function estMort(c) {
  return c.type === 'joueur' ? c.ko : c.mort;
}

function statDe(source, cle) {
  if (source.type === 'joueur') return statsEffectives(source)[cle] || 0;
  return 0;
}

function tirageAuPoids(liste) {
  const total = liste.reduce((s, x) => s + x.poids, 0);
  let r = Math.random() * total;
  for (const x of liste) {
    r -= x.poids;
    if (r <= 0) return x;
  }
  return liste[liste.length - 1];
}

// =====================================================================
// Lancement d'un combat
// =====================================================================
function demarrerCombat(options) {
  const equipe = options.equipe && options.equipe.length ? options.equipe : membresEquipe();
  equipe.forEach((j) => {
    bornerVie(j);
    j.statuts = [];
    j.cooldowns = {};
    j.defense = false;
    j.ko = false;
    if (j.hp <= 0) j.hp = 1;
  });

  const compteurs = {};
  options.monstresDef.forEach((def) => { compteurs[def.nom] = (compteurs[def.nom] || 0) + 1; });
  const vus = {};
  const monstres = options.monstresDef.map((def, i) => {
    vus[def.nom] = (vus[def.nom] || 0) + 1;
    return {
      type: 'monstre',
      id: `m${i}`,
      cle: def.cle || null,
      nom: compteurs[def.nom] > 1 ? `${def.nom} ${vus[def.nom]}` : def.nom,
      emoji: def.emoji,
      niveau: def.niveau,
      atk: def.atk,
      agi: def.agi,
      xp: def.xp,
      po: def.po,
      drops: def.drops,
      attaques: def.attaques,
      boss: !!def.boss,
      maxHp: def.hp,
      hp: def.hp,
      statuts: [],
      defense: false,
      mort: false,
    };
  });

  // Identifiant de combat stable pour chaque héros (id cloud en groupe en ligne)
  equipe.forEach((j) => { j.bid = j.bid || (j.cloud && j.cloud.id) || j.id; });

  etat.combat = {
    genre: options.genre,
    zone: options.zone || null,
    difficulte: options.difficulte || 'normal',
    equipe,
    monstres,
    lootRecolte: options.lootRecolte || null,
    manchesMax: options.manchesMax || null,
    manche: 0,
    file: [],
    actif: null,
    termine: false,
    cibleEnAttente: null,
    finTour: null,
    modeActions: null,
    journalLignes: [],
    degatsBossMonde: 0,
    groupe: options.groupe || null,
    enAttenteDe: null,
    consosDistantes: options.groupe ? {} : null,
  };

  const titres = {
    exploration: () => `${options.zone.emoji} ${options.zone.nom}`,
    embuscade: () => `⚠️ Embuscade — ${options.zone.nom}`,
    boss: () => `👑 ${monstres[0].nom} — ${options.zone.nom}`,
    bossMonde: () => `🌍 ${monstres[0].nom} — assaut du monde`,
  };
  const difficulte = DIFFICULTES[etat.combat.difficulte];
  const suffixe = difficulte && etat.combat.difficulte !== 'normal' ? ` · ${difficulte.emoji} ${difficulte.nom}` : '';
  el('combat-titre').textContent = (titres[options.genre] ? titres[options.genre]() : 'Combat') + suffixe;
  el('combat-manche').textContent = '';
  el('zone-actions').innerHTML = '';

  const intros = {
    exploration: 'Des créatures hostiles surgissent !',
    embuscade: 'On vous tombe dessus en pleine récolte !',
    boss: 'Le maître des lieux se dresse devant vous…',
    bossMonde: `Vous avez ${options.manchesMax || 6} manches pour infliger un maximum de dégâts !`,
  };
  journal(`⚔️ ${intros[options.genre] || 'Le combat commence !'}`);
  montrerEcran('ecran-combat');
  rendreCombat();
  if (etat.combat.groupe && etat.combat.groupe.hote) publierEtatGroupe(etat.combat);
  boucleTour();
}

// =====================================================================
// Boucle de tours
// =====================================================================
async function boucleTour() {
  const cb = etat.combat;
  while (!cb.termine) {
    if (cb.file.length === 0) {
      cb.manche++;
      if (cb.manchesMax && cb.manche > cb.manchesMax) {
        cb.termine = true;
        cb.actif = null;
        journal(`⏳ ${cb.monstres[0].nom} se lasse du combat et s'éloigne dans un fracas !`);
        rendreCombat();
        setTimeout(() => apresBossMonde(cb), 1300);
        break;
      }
      cb.file = [...cb.equipe.filter((j) => !j.ko), ...cb.monstres.filter((m) => !m.mort)]
        .map((c) => ({ c, init: (c.type === 'joueur' ? statsEffectives(c).agi : c.agi) * 2 + alea(1, 10) }))
        .sort((a, b) => b.init - a.init)
        .map((x) => x.c);
      el('combat-manche').textContent = cb.manchesMax
        ? `Manche ${cb.manche}/${cb.manchesMax}` : `Manche ${cb.manche}`;
      journal(`— Manche ${cb.manche} —`);
    }

    const c = cb.file.shift();
    if (estMort(c)) continue;
    cb.actif = c;

    const debut = debutTour(c);
    rendreCombat();
    if (verifierFin()) break;
    if (estMort(c)) continue; // mort au poison pendant son propre tour

    if (debut.skip) {
      journal(`💫 ${c.nom} est étourdi et passe son tour !`);
      rendreCombat();
      if (cb.groupe && cb.groupe.hote) await publierEtatGroupe(cb);
      await attendre(900);
      continue;
    }

    if (c.type === 'joueur') {
      if (c.distant && cb.groupe && cb.groupe.hote) {
        // Héros sur un autre écran : on publie l'état et on attend son action.
        await tourJoueurDistant(c);
      } else {
        cb.modeActions = null;
        rendreActions(c);
        await new Promise((res) => { cb.finTour = res; });
        cb.finTour = null;
        el('zone-actions').innerHTML = '';
      }
      finDeTourStatuts(c);
      rendreCombat();
    } else {
      el('zone-actions').innerHTML = '';
      await attendre(900);
      tourMonstre(c);
      finDeTourStatuts(c);
      rendreCombat();
    }

    if (cb.groupe && cb.groupe.hote && !cb.termine) await publierEtatGroupe(cb);
    if (verifierFin()) break;
    await attendre(400);
  }
}

// Effets appliqués au début du tour d'un combattant.
function debutTour(c) {
  const cb = etat.combat;
  c.defense = false;

  if (c.type === 'joueur') {
    Object.keys(c.cooldowns).forEach((k) => { if (c.cooldowns[k] > 0) c.cooldowns[k]--; });
    c.mp = Math.min(c.maxMp, c.mp + 2);
  }

  const poison = c.statuts.find((s) => s.type === 'poison');
  if (poison) {
    // La contribution au boss du monde est bornée aux PV restants (pas d'overkill).
    if (c.type === 'monstre' && cb.genre === 'bossMonde') {
      cb.degatsBossMonde += Math.min(poison.valeur, Math.max(0, c.hp));
    }
    c.hp -= poison.valeur;
    journal(`🧪 ${c.nom} souffre du poison : ${poison.valeur} dégâts.`);
    gererMort(c);
  }
  if (estMort(c)) return { skip: true };

  const regen = c.statuts.find((s) => s.type === 'regen');
  if (regen && c.hp < c.maxHp) {
    const soin = Math.min(regen.valeur, c.maxHp - c.hp);
    c.hp += soin;
    journal(`💧 ${c.nom} régénère ${soin} PV.`);
  }

  const skip = c.statuts.some((s) => s.type === 'etourdi');

  // La bénédiction (+30 % de dégâts) se consomme en AGISSANT : elle est
  // décomptée en fin de tour (finDeTourStatuts), pas ici, pour offrir
  // ses 3 tours d'attaque annoncés.
  c.statuts.forEach((s) => { if (s.type !== 'benediction') s.duree--; });
  c.statuts = c.statuts.filter((s) => s.duree > 0 && !(s.type === 'bouclier' && s.valeur <= 0));

  return { skip };
}

// Statuts consommés par l'action du combattant (décomptés après qu'il a agi).
function finDeTourStatuts(c) {
  const benediction = c.statuts.find((s) => s.type === 'benediction');
  if (benediction) {
    benediction.duree--;
    if (benediction.duree <= 0) c.statuts = c.statuts.filter((s) => s !== benediction);
  }
}

function verifierFin() {
  const cb = etat.combat;
  if (cb.termine) return true;

  if (cb.monstres.every((m) => m.mort)) {
    cb.termine = true;
    cb.actif = null;
    journal('🏆 Victoire ! Tous les ennemis sont vaincus.');
    rendreCombat();
    setTimeout(() => apresVictoire(cb), 1300);
    return true;
  }

  if (cb.equipe.every((j) => j.ko)) {
    cb.termine = true;
    cb.actif = null;
    journal('💫 Tout le groupe est à terre…');
    rendreCombat();
    setTimeout(() => apresDefaite(cb), 1300);
    return true;
  }

  return false;
}

// =====================================================================
// Dégâts, soins et effets
// =====================================================================
function infligerDegats(source, cible, brut, options = {}) {
  const cb = etat.combat;
  let d = varie(brut);
  if (source.statuts.some((s) => s.type === 'benediction')) d *= 1.3;
  if (source.statuts.some((s) => s.type === 'affaibli')) d *= 0.7;

  let chanceCrit = 0.05 + (options.critBonus || 0);
  if (source.type === 'joueur') {
    const s = statsEffectives(source);
    chanceCrit += s.agi * 0.01 + (s.crit || 0) / 100;
  }
  const crit = Math.random() < chanceCrit;
  if (crit) d *= 1.5;
  if (cible.defense) d *= 0.5;
  d = Math.max(1, Math.round(d));

  let absorbe = 0;
  const bouclier = cible.statuts.find((s) => s.type === 'bouclier' && s.valeur > 0);
  if (bouclier) {
    absorbe = Math.min(bouclier.valeur, d);
    bouclier.valeur -= absorbe;
    d -= absorbe;
  }

  // La mort est gérée par l'appelant (gererMort) après la ligne de journal.
  // La contribution au boss du monde est bornée aux PV restants (pas d'overkill).
  if (cible.type === 'monstre' && cb && cb.genre === 'bossMonde') {
    cb.degatsBossMonde += Math.min(d, Math.max(0, cible.hp));
  }
  cible.hp -= d;
  return { degats: d, crit, absorbe };
}

function texteDegats(r) {
  let t = `${r.degats} dégâts`;
  if (r.crit) t += ' 💥 CRITIQUE !';
  if (r.absorbe > 0) t += ` (${r.absorbe} absorbés par le bouclier)`;
  return t;
}

function soigner(cible, brut) {
  const soin = Math.max(1, Math.round(varie(brut)));
  cible.hp = Math.min(cible.maxHp, cible.hp + soin);
  return soin;
}

function gererMort(c) {
  if (c.hp > 0 || estMort(c)) return;
  c.hp = 0;
  c.statuts = [];
  if (c.type === 'joueur') {
    c.ko = true;
    journal(`😵 ${c.nom} s'effondre ! (KO)`);
  } else {
    c.mort = true;
    journal(`☠️ ${c.nom} est vaincu !`);
  }
}

function poserStatut(cible, statut) {
  cible.statuts = cible.statuts.filter((s) => s.type !== statut.type);
  cible.statuts.push(statut);
}

function appliquerEffet(source, cible, effet, resultatDegats) {
  switch (effet.type) {
    case 'poison': {
      const valeur = effet.degats != null
        ? effet.degats
        : Math.round(3 + statDe(source, effet.stat || 'agi') * (effet.stat === 'int' ? 0.5 : 0.6));
      poserStatut(cible, { type: 'poison', duree: effet.duree, valeur });
      journal(`🧪 ${cible.nom} est empoisonné (${valeur} dégâts par tour, ${effet.duree} tours).`);
      break;
    }
    case 'affaibli': {
      poserStatut(cible, { type: 'affaibli', duree: effet.duree });
      journal(`⬇️ ${cible.nom} est affaibli : −30 % de dégâts pendant ${effet.duree} tours.`);
      break;
    }
    case 'pacte': {
      const sacrifice = Math.max(1, Math.round(cible.maxHp * effet.partPv));
      cible.hp = Math.max(1, cible.hp - sacrifice); // le pacte ne tue jamais
      cible.mp = Math.min(cible.maxMp, cible.mp + effet.mana);
      journal(`🩸 ${cible.nom} sacrifie ${sacrifice} PV et récupère ${effet.mana} PM.`);
      break;
    }
    case 'etourdi': {
      if (Math.random() < (effet.chance != null ? effet.chance : 1)) {
        poserStatut(cible, { type: 'etourdi', duree: effet.duree });
        journal(`💫 ${cible.nom} est étourdi !`);
      } else {
        journal(`${cible.nom} résiste à l'étourdissement.`);
      }
      break;
    }
    case 'bouclier': {
      const valeur = Math.round(8 + statDe(source, 'int') * 1.5);
      poserStatut(cible, { type: 'bouclier', duree: effet.duree, valeur });
      journal(`🛡️ ${cible.nom} est protégé par un bouclier (${valeur} points).`);
      break;
    }
    case 'benediction': {
      poserStatut(cible, { type: 'benediction', duree: effet.duree });
      journal(`🙏 ${cible.nom} est béni : +30 % de dégâts pendant ${effet.duree} tours.`);
      break;
    }
    case 'provocation': {
      poserStatut(cible, { type: 'provocation', duree: effet.duree });
      const valeur = Math.round(4 + statDe(source, 'for'));
      poserStatut(cible, { type: 'bouclier', duree: effet.duree, valeur });
      journal(`😤 ${cible.nom} provoque les ennemis et se protège (${valeur} points de bouclier) !`);
      break;
    }
    case 'regen': {
      const valeur = Math.round(3 + statDe(source, 'int') * 0.8);
      poserStatut(cible, { type: 'regen', duree: effet.duree, valeur });
      journal(`💧 ${cible.nom} régénérera ${valeur} PV par tour pendant ${effet.duree} tours.`);
      break;
    }
    case 'mana': {
      cible.mp = Math.min(cible.maxMp, cible.mp + effet.valeur);
      journal(`🧘 ${cible.nom} récupère ${effet.valeur} PM.`);
      break;
    }
    case 'drain': {
      if (resultatDegats && resultatDegats.degats > 0) {
        const soin = soigner(source, resultatDegats.degats * effet.part);
        journal(`🧛 ${source.nom} draine ${soin} PV.`);
      }
      break;
    }
  }
}

// =====================================================================
// Actions des joueurs
// =====================================================================
function consommablesDe(j) {
  return j.inventaire.filter((entree) => {
    const objet = OBJETS[entree.id];
    return objet && objet.type === 'consommable' && entree.qte > 0;
  });
}

function rendreActions(j) {
  const cb = etat.combat;
  const zone = el('zone-actions');
  zone.innerHTML = '';

  const entete = document.createElement('div');
  entete.className = 'actions-entete';
  entete.innerHTML = `<span class="avatar-grand">${j.avatar}</span>
    <div>Au tour de <strong>${echapper(j.nom)}</strong>${cb.equipe.length > 1 ? ' — passe-lui l’écran !' : ''}<br>
    <span class="actions-vie">❤️ ${j.hp}/${j.maxHp} PV · 💧 ${j.mp}/${j.maxMp} PM</span></div>`;
  zone.appendChild(entete);

  if (cb.cibleEnAttente) {
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-cible';
    bandeau.textContent = '🎯 Touche une cible en surbrillance…';
    zone.appendChild(bandeau);
    const annuler = document.createElement('button');
    annuler.className = 'btn-choix';
    annuler.textContent = '✖ Annuler';
    annuler.addEventListener('click', () => {
      cb.cibleEnAttente = null;
      rendreCombat();
      rendreActions(j);
    });
    zone.appendChild(annuler);
    return;
  }

  const barre = document.createElement('div');
  barre.className = 'barre-actions';

  if (cb.modeActions === 'objet') {
    consommablesDe(j).forEach((entree) => {
      const objet = OBJETS[entree.id];
      const inutile = (objet.effet.type === 'pv' && j.hp >= j.maxHp)
        || (objet.effet.type === 'pm' && j.mp >= j.maxMp)
        || (objet.effet.type === 'antidote' && !j.statuts.some((st) => st.type === 'poison'));
      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.disabled = inutile;
      btn.innerHTML = `${objet.emoji} <strong>${objet.nom}</strong><span class="action-detail">×${entree.qte} · ${inutile ? 'déjà au maximum' : objet.desc}</span>`;
      btn.addEventListener('click', () => surActionChoisie(j, { genre: 'objet', idObjet: entree.id }));
      barre.appendChild(btn);
    });
    const retour = document.createElement('button');
    retour.className = 'btn-action';
    retour.innerHTML = '↩️ <strong>Retour</strong><span class="action-detail">Choisir une autre action</span>';
    retour.addEventListener('click', () => { cb.modeActions = null; rendreActions(j); });
    barre.appendChild(retour);
    zone.appendChild(barre);
    return;
  }

  const btnAttaque = document.createElement('button');
  btnAttaque.className = 'btn-action';
  btnAttaque.innerHTML = '⚔️ <strong>Attaque</strong><span class="action-detail">Gratuite · dégâts légers</span>';
  btnAttaque.addEventListener('click', () => surActionChoisie(j, { genre: 'attaque' }));
  barre.appendChild(btnAttaque);

  const btnDefense = document.createElement('button');
  btnDefense.className = 'btn-action';
  btnDefense.innerHTML = '🛡️ <strong>Défendre</strong><span class="action-detail">−50 % dégâts subis · +3 PM</span>';
  btnDefense.addEventListener('click', () => surActionChoisie(j, { genre: 'defense' }));
  barre.appendChild(btnDefense);

  j.competences.forEach((compId) => {
    const comp = COMPETENCES[compId];
    if (!comp) return;
    const btn = document.createElement('button');
    btn.className = 'btn-action competence';
    const cd = j.cooldowns[compId] || 0;
    let detail = `${comp.coutMp} PM`;
    if (cd > 0) detail = `⏳ Encore ${cd} tour${cd > 1 ? 's' : ''}`;
    else if (j.mp < comp.coutMp) detail = `${comp.coutMp} PM — pas assez de mana`;
    btn.innerHTML = `${comp.emoji} <strong>${comp.nom}</strong><span class="action-detail">${detail}</span>`;
    btn.title = comp.desc;
    btn.disabled = cd > 0 || j.mp < comp.coutMp;
    btn.addEventListener('click', () => surActionChoisie(j, { genre: 'competence', compId }));
    barre.appendChild(btn);
  });

  const consommables = consommablesDe(j);
  const btnObjet = document.createElement('button');
  btnObjet.className = 'btn-action';
  btnObjet.disabled = consommables.length === 0;
  btnObjet.innerHTML = `🎒 <strong>Objet</strong><span class="action-detail">${consommables.length ? 'Boire une potion' : 'Aucune potion dans le sac'}</span>`;
  btnObjet.addEventListener('click', () => { cb.modeActions = 'objet'; rendreActions(j); });
  barre.appendChild(btnObjet);

  if (cb.genre === 'exploration' || cb.genre === 'embuscade') {
    const btnFuite = document.createElement('button');
    btnFuite.className = 'btn-action';
    btnFuite.innerHTML = '💨 <strong>Fuir</strong><span class="action-detail">65 % de réussite</span>';
    btnFuite.addEventListener('click', () => surActionChoisie(j, { genre: 'fuite' }));
    barre.appendChild(btnFuite);
  } else if (cb.genre === 'bossMonde') {
    const btnRetraite = document.createElement('button');
    btnRetraite.className = 'btn-action';
    btnRetraite.innerHTML = '🏳️ <strong>Battre en retraite</strong><span class="action-detail">Vos dégâts comptent quand même</span>';
    btnRetraite.addEventListener('click', () => surActionChoisie(j, { genre: 'fuite' }));
    barre.appendChild(btnRetraite);
  }

  zone.appendChild(barre);
  // Sur petit écran, amener le panneau d'actions en vue au début du tour.
  if (zone.scrollIntoView) zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function surActionChoisie(j, action) {
  const cb = etat.combat;
  if (cb.termine) return;
  if (cb.distant) {
    // Membre d'une expédition multi-écrans : l'action part vers le chef.
    const moi = persoActif();
    if (!moi || !moi.cloud || cb.enAttenteDe !== moi.cloud.id || cb.actionEnvoyee) return;
  } else if (cb.actif !== j || !cb.finTour) {
    return;
  }

  if (action.genre === 'objet') {
    // Garde-fou : ne pas gaspiller un objet et un tour sans effet.
    const objet = OBJETS[action.idObjet];
    if (objet.effet.type === 'pv' && j.hp >= j.maxHp) { afficherToast('PV déjà au maximum.'); return; }
    if (objet.effet.type === 'pm' && j.mp >= j.maxMp) { afficherToast('PM déjà au maximum.'); return; }
    if (objet.effet.type === 'antidote' && !j.statuts.some((st) => st.type === 'poison')) {
      afficherToast('Vous n’êtes pas empoisonné.');
      return;
    }
  }

  const lancer = (cible) => {
    if (cb.distant) envoyerActionGroupe(action, cible);
    else executerAction(j, action, cible);
  };

  if (action.genre === 'defense' || action.genre === 'objet' || action.genre === 'fuite') {
    lancer(null);
    return;
  }

  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : comp.cible;

  if (cibleType === 'soi') {
    lancer(j);
    return;
  }
  if (cibleType === 'ennemis' || cibleType === 'allies') {
    lancer(null);
    return;
  }

  const possibles = cibleType === 'ennemi'
    ? cb.monstres.filter((m) => !m.mort)
    : cb.equipe.filter((x) => !x.ko);
  if (possibles.length === 1) {
    lancer(possibles[0]);
  } else {
    cb.cibleEnAttente = { joueur: j, action };
    rendreCombat();
    rendreActions(j);
  }
}

// Exécute une action de joueur (locale ou distante).
// Renvoie 'fuite', 'retraite' (boss du monde) ou null.
function executerActionCoeur(j, action, cible) {
  const cb = etat.combat;
  if (action.genre === 'attaque') {
    const s = statsEffectives(j);
    const brut = 3 + Math.max(s.for, s.agi);
    const r = infligerDegats(j, cible, brut);
    journal(`⚔️ ${j.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
  } else if (action.genre === 'defense') {
    j.defense = true;
    j.mp = Math.min(j.maxMp, j.mp + 3);
    journal(`🛡️ ${j.nom} se met en garde (+3 PM, dégâts subis réduits de moitié).`);
  } else if (action.genre === 'objet') {
    const objet = OBJETS[action.idObjet];
    if (objet && retirerObjet(j, action.idObjet, 1)) {
      utiliserObjetEnCombat(j, objet);
      if (j.distant && cb.consosDistantes) {
        const conso = cb.consosDistantes[j.bid] = cb.consosDistantes[j.bid] || {};
        conso[action.idObjet] = (conso[action.idObjet] || 0) + 1;
      }
      sauvegarderLocal();
    }
  } else if (action.genre === 'fuite') {
    if (cb.genre === 'bossMonde') {
      journal(`🏳️ ${j.nom} bat en retraite : le combat s'arrête ici.`);
      return 'retraite';
    }
    if (Math.random() < 0.65) {
      journal('💨 Le groupe parvient à s’échapper !');
      return 'fuite';
    }
    journal(`💨 ${j.nom} tente de fuir… sans succès !`);
  } else {
    lancerCompetence(j, action.compId, cible);
  }
  return null;
}

function executerAction(j, action, cible) {
  const cb = etat.combat;
  // Empêche un double-clic de jouer deux actions dans le même tour.
  if (!cb.finTour || cb.termine) return;
  const finir = cb.finTour;
  cb.finTour = null;

  const issue = executerActionCoeur(j, action, cible);
  if (issue === 'retraite' || issue === 'fuite') {
    cb.termine = true;
    cb.actif = null;
    rendreCombat();
    finir();
    setTimeout(() => (issue === 'retraite' ? apresBossMonde(cb) : apresFuite(cb)), 800);
    return;
  }
  rendreCombat();
  finir();
}

function lancerCompetence(j, compId, cible) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  const s = statsEffectives(j);
  j.mp -= comp.coutMp;
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  if (comp.type === 'degats') {
    const cibles = comp.cible === 'ennemis' ? cb.monstres.filter((m) => !m.mort) : [cible];
    journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => {
      // Certaines compétences frappent plusieurs fois (rafale de coups).
      for (let coup = 0; coup < (comp.coups || 1); coup++) {
        if (estMort(c)) break;
        const brut = comp.puissance + s[comp.stat] * comp.ratio;
        const r = infligerDegats(j, c, brut, { critBonus: comp.critBonus || 0 });
        journal(`→ ${c.nom} subit ${texteDegats(r)}`);
        gererMort(c);
        // Le drain soigne le lanceur même si le coup achève la cible ;
        // les autres effets (poison, étourdissement…) ne s'appliquent qu'aux vivants.
        if (comp.effet && (comp.effet.type === 'drain' || !estMort(c))) {
          appliquerEffet(j, c, comp.effet, r);
        }
      }
    });
  } else if (comp.type === 'soin') {
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible];
    cibles.forEach((c) => {
      const soin = soigner(c, comp.puissance + s[comp.stat] * comp.ratio);
      journal(`${comp.emoji} ${j.nom} rend ${soin} PV à ${c === j ? 'lui-même' : c.nom}.`);
      if (comp.effet) appliquerEffet(j, c, comp.effet, null);
    });
  } else {
    // Utilitaire : sur soi, un allié, ou tout le groupe (aura, chant…)
    const cibles = comp.cible === 'allies' ? cb.equipe.filter((x) => !x.ko) : [cible || j];
    if (comp.cible === 'allies') journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => appliquerEffet(j, c, comp.effet, null));
  }
}

// Applique l'effet d'un consommable pendant un combat.
function utiliserObjetEnCombat(j, objet) {
  const cb = etat.combat;
  const effet = objet.effet;
  if (effet.type === 'pv') {
    const soin = Math.min(effet.valeur, j.maxHp - j.hp);
    j.hp += soin;
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +${soin} PV.`);
  } else if (effet.type === 'pm') {
    const gain = Math.min(effet.valeur, j.maxMp - j.mp);
    j.mp += gain;
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +${gain} PM.`);
  } else if (effet.type === 'antidote') {
    j.statuts = j.statuts.filter((st) => st.type !== 'poison');
    journal(`${objet.emoji} ${j.nom} boit un antidote : le poison se dissipe.`);
  } else if (effet.type === 'elixir-benediction') {
    poserStatut(j, { type: 'benediction', duree: effet.duree });
    journal(`${objet.emoji} ${j.nom} boit ${objet.nom} : +30 % de dégâts pendant ${effet.duree} tours !`);
  } else if (effet.type === 'bombe') {
    journal(`${objet.emoji} ${j.nom} lance une ${objet.nom} sur les ennemis !`);
    cb.monstres.filter((m) => !m.mort).forEach((m) => {
      const r = infligerDegats(j, m, effet.valeur);
      journal(`→ ${m.nom} subit ${texteDegats(r)}`);
      gererMort(m);
      if (!estMort(m) && Math.random() < (effet.chanceEtourdi || 0)) {
        poserStatut(m, { type: 'etourdi', duree: 1 });
        journal(`💫 ${m.nom} est étourdi par le givre !`);
      }
    });
  }
}

// =====================================================================
// Tour des monstres
// =====================================================================
function choisirCibleJoueur(joueursVivants) {
  const provocateurs = joueursVivants.filter((x) => x.statuts.some((s) => s.type === 'provocation'));
  const candidats = provocateurs.length > 0 ? provocateurs : joueursVivants;
  const ponderes = candidats.map((x) => ({ x, poids: 1 + 2 * (1 - x.hp / x.maxHp) }));
  return tirageAuPoids(ponderes).x;
}

function tourMonstre(m) {
  const cb = etat.combat;
  const joueursVivants = cb.equipe.filter((x) => !x.ko);
  if (joueursVivants.length === 0) return;

  const monstresVivants = cb.monstres.filter((x) => !x.mort);
  const blesses = monstresVivants.filter((x) => x.hp < x.maxHp * 0.6);
  const possibles = m.attaques.filter((a) => a.type !== 'soin' || blesses.length > 0);
  const att = tirageAuPoids(possibles);

  if (att.type === 'soin') {
    const cible = [...blesses].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const soin = soigner(cible, att.valeur);
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} : ${cible.nom} récupère ${soin} PV.`);
  } else if (att.type === 'aoe') {
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} sur tout le groupe !`);
    joueursVivants.forEach((jv) => {
      const r = infligerDegats(m, jv, m.atk * att.mult);
      journal(`→ ${jv.nom} subit ${texteDegats(r)}`);
      gererMort(jv);
    });
  } else {
    const cible = choisirCibleJoueur(joueursVivants);
    const r = infligerDegats(m, cible, m.atk * att.mult);
    journal(`${att.emoji} ${m.nom} utilise ${att.nom} sur ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
    if (att.effet && !estMort(cible)) appliquerEffet(m, cible, att.effet, r);
  }
}

// =====================================================================
// Affichage du combat
// =====================================================================
function journal(message) {
  const cb = etat.combat;
  if (!cb) return;
  cb.journalLignes.push(message);
  if (cb.journalLignes.length > 100) cb.journalLignes.shift();
  rendreJournal();
}

function rendreJournal() {
  const cb = etat.combat;
  const zone = el('combat-log');
  zone.innerHTML = '';
  cb.journalLignes.forEach((ligne) => {
    const div = document.createElement('div');
    div.className = 'ligne-journal' + (ligne.startsWith('—') ? ' ligne-manche' : '');
    div.textContent = ligne;
    zone.appendChild(div);
  });
  zone.scrollTop = zone.scrollHeight;
}

function rendreCombat() {
  const cb = etat.combat;
  if (!cb) return;
  // Le défilement horizontal des rangées (mobile) survit au re-rendu.
  const zoneE = el('zone-ennemis');
  const defilE = zoneE.scrollLeft;
  zoneE.innerHTML = '';
  cb.monstres.forEach((m) => zoneE.appendChild(carteCombattant(m)));
  zoneE.scrollLeft = defilE;
  const zoneJ = el('zone-joueurs');
  const defilJ = zoneJ.scrollLeft;
  zoneJ.innerHTML = '';
  cb.equipe.forEach((j) => zoneJ.appendChild(carteCombattant(j)));
  zoneJ.scrollLeft = defilJ;
  rendreJournal();
  // En mode ciblage, amener la première cible en vue.
  if (cb.cibleEnAttente) {
    const premiere = document.querySelector('.carte-combattant.ciblable');
    if (premiere && premiere.scrollIntoView) {
      premiere.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }
}

function cibleValide(c) {
  const cb = etat.combat;
  if (!cb.cibleEnAttente) return false;
  const { action } = cb.cibleEnAttente;
  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : comp.cible;
  if (cibleType === 'ennemi') return c.type === 'monstre' && !c.mort;
  if (cibleType === 'allie') return c.type === 'joueur' && !c.ko;
  return false;
}

function carteCombattant(c) {
  const cb = etat.combat;
  const carte = document.createElement('div');
  const mort = estMort(c);
  carte.className = 'carte-combattant'
    + (c.type === 'monstre' ? ' ennemi' : ' allie')
    + (c.boss ? ' carte-boss' : '')
    + (cb.actif === c && !cb.termine ? ' tour-actif' : '')
    + (mort ? ' mort' : '');

  const pctHp = Math.max(0, Math.round((c.hp / c.maxHp) * 100));
  const statuts = c.statuts
    .map((s) => `<span title="${NOM_STATUT[s.type]}">${EMOJI_STATUT[s.type]}</span>`)
    .join('');
  const defense = c.defense ? '<span title="En garde">🛡️</span>' : '';

  let barres = `
    <div class="barre pv"><div class="remplissage" style="width:${pctHp}%"></div>
      <span>${c.hp}/${c.maxHp}</span></div>`;
  if (c.type === 'joueur') {
    const pctMp = Math.max(0, Math.round((c.mp / c.maxMp) * 100));
    barres += `
    <div class="barre pm"><div class="remplissage" style="width:${pctMp}%"></div>
      <span>${c.mp}/${c.maxMp}</span></div>`;
  }

  carte.innerHTML = `
    <div class="combattant-avatar">${c.type === 'joueur' ? c.avatar : c.emoji}</div>
    <div class="combattant-nom">${echapper(c.nom)} <span class="niveau">niv. ${c.niveau}</span></div>
    ${barres}
    <div class="combattant-statuts">${statuts}${defense}${mort ? (c.type === 'joueur' ? '😵 KO' : '☠️') : ''}</div>`;

  if (!mort && cibleValide(c)) {
    carte.classList.add('ciblable');
    rendreCliquable(carte, () => {
      if (!cb.cibleEnAttente) return;
      const { joueur, action } = cb.cibleEnAttente;
      cb.cibleEnAttente = null;
      if (cb.distant) envoyerActionGroupe(action, c);
      else executerAction(joueur, action, c);
    });
  }

  return carte;
}
