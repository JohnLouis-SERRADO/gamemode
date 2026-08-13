'use strict';

// =====================================================================
// Moteur de combat tour par tour : initiative, tours des joueurs et
// des monstres, dégâts, soins, effets de statut, victoire et défaite.
// =====================================================================

const EMOJI_STATUT = {
  poison: '🧪', etourdi: '💫', bouclier: '🛡️',
  benediction: '🙏', provocation: '😤', regen: '💧',
};

const NOM_STATUT = {
  poison: 'Empoisonné', etourdi: 'Étourdi', bouclier: 'Bouclier',
  benediction: 'Bénédiction (+30 % dégâts)', provocation: 'Provocation', regen: 'Régénération',
};

function estMort(c) {
  return c.type === 'joueur' ? c.ko : c.mort;
}

function statDe(source, cle) {
  return source.type === 'joueur' ? source.stats[cle] : 0;
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
function demarrerCombat(index) {
  const rencontre = RENCONTRES[index];
  const n = etat.nbJoueurs;
  const cles = rencontre.composition(n);

  const compteurs = {};
  cles.forEach((c) => { compteurs[c] = (compteurs[c] || 0) + 1; });
  const vus = {};
  const monstres = cles.map((cle, i) => {
    const base = MONSTRES[cle];
    vus[cle] = (vus[cle] || 0) + 1;
    const maxHp = base.hp + (base.hpParJoueur || 0) * n;
    return {
      type: 'monstre',
      id: `m${i}`,
      nom: compteurs[cle] > 1 ? `${base.nom} ${vus[cle]}` : base.nom,
      emoji: base.emoji,
      atk: base.atk,
      agi: base.agi,
      xp: base.xp,
      attaques: base.attaques,
      maxHp,
      hp: maxHp,
      statuts: [],
      defense: false,
      mort: false,
    };
  });

  etat.combat = {
    index,
    rencontre,
    monstres,
    manche: 0,
    file: [],
    actif: null,
    termine: false,
    cibleEnAttente: null,
    finTour: null,
    journalLignes: [],
  };

  el('combat-titre').textContent = `Combat ${index + 1}/${RENCONTRES.length} — ${rencontre.nom}`;
  el('combat-manche').textContent = '';
  el('zone-actions').innerHTML = '';
  journal(`⚔️ ${rencontre.nom} — ${rencontre.intro}`);
  montrerEcran('ecran-combat');
  rendreCombat();
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
      cb.file = [...etat.joueurs.filter((j) => !j.ko), ...cb.monstres.filter((m) => !m.mort)]
        .map((c) => ({ c, init: (c.type === 'joueur' ? c.stats.agi : c.agi) * 2 + alea(1, 10) }))
        .sort((a, b) => b.init - a.init)
        .map((x) => x.c);
      el('combat-manche').textContent = `Manche ${cb.manche}`;
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
      await attendre(900);
      continue;
    }

    if (c.type === 'joueur') {
      rendreActions(c);
      await new Promise((res) => { cb.finTour = res; });
      cb.finTour = null;
      el('zone-actions').innerHTML = '';
      rendreCombat();
    } else {
      el('zone-actions').innerHTML = '';
      await attendre(900);
      tourMonstre(c);
      rendreCombat();
    }

    if (verifierFin()) break;
    await attendre(400);
  }
}

// Effets appliqués au début du tour d'un combattant.
function debutTour(c) {
  c.defense = false;

  if (c.type === 'joueur') {
    Object.keys(c.cooldowns).forEach((k) => { if (c.cooldowns[k] > 0) c.cooldowns[k]--; });
    c.mp = Math.min(c.maxMp, c.mp + 2);
  }

  const poison = c.statuts.find((s) => s.type === 'poison');
  if (poison) {
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

  c.statuts.forEach((s) => s.duree--);
  c.statuts = c.statuts.filter((s) => s.duree > 0 && !(s.type === 'bouclier' && s.valeur <= 0));

  return { skip };
}

function verifierFin() {
  const cb = etat.combat;
  if (cb.termine) return true;

  if (cb.monstres.every((m) => m.mort)) {
    cb.termine = true;
    cb.actif = null;
    const xp = cb.monstres.reduce((s, m) => s + m.xp, 0);
    journal('🏆 Victoire ! Tous les ennemis sont vaincus.');
    rendreCombat();
    setTimeout(() => {
      if (cb.index >= RENCONTRES.length - 1) ecranVictoireFinale(xp);
      else allerAuCamp(xp);
    }, 1400);
    return true;
  }

  if (etat.joueurs.every((j) => j.ko)) {
    cb.termine = true;
    cb.actif = null;
    journal('💀 Tout le groupe est à terre…');
    rendreCombat();
    setTimeout(ecranDefaite, 1400);
    return true;
  }

  return false;
}

// =====================================================================
// Dégâts, soins et effets
// =====================================================================
function infligerDegats(source, cible, brut, options = {}) {
  let d = varie(brut);
  if (source.statuts.some((s) => s.type === 'benediction')) d *= 1.3;

  const chanceCrit = 0.05 + statDe(source, 'agi') * 0.01 + (options.critBonus || 0);
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

  // La mort est gérée par l'appelant (gererMort) après avoir écrit
  // la ligne de dégâts dans le journal, pour garder les messages en ordre.
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
      const valeur = effet.degats != null ? effet.degats : Math.round(3 + statDe(source, 'agi') * 0.6);
      poserStatut(cible, { type: 'poison', duree: effet.duree, valeur });
      journal(`🧪 ${cible.nom} est empoisonné (${valeur} dégâts par tour, ${effet.duree} tours).`);
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
function rendreActions(j) {
  const cb = etat.combat;
  const zone = el('zone-actions');
  zone.innerHTML = '';

  const entete = document.createElement('div');
  entete.className = 'actions-entete';
  entete.innerHTML = `<span class="avatar-grand">${j.avatar}</span>
    <div>Au tour de <strong>${echapper(j.nom)}</strong> — passe-lui l'écran !<br>
    <span class="actions-vie">❤️ ${j.hp}/${j.maxHp} PV · 💧 ${j.mp}/${j.maxMp} PM</span></div>`;
  zone.appendChild(entete);

  if (cb.cibleEnAttente) {
    const bandeau = document.createElement('div');
    bandeau.className = 'bandeau-cible';
    bandeau.textContent = '🎯 Clique sur une cible en surbrillance…';
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

  zone.appendChild(barre);
  zone.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function surActionChoisie(j, action) {
  const cb = etat.combat;
  if (cb.termine || cb.actif !== j || !cb.finTour) return;

  if (action.genre === 'defense') {
    executerAction(j, action, null);
    return;
  }

  const comp = action.compId ? COMPETENCES[action.compId] : null;
  const cibleType = action.genre === 'attaque' ? 'ennemi' : comp.cible;

  if (cibleType === 'soi') {
    executerAction(j, action, j);
    return;
  }
  if (cibleType === 'ennemis' || cibleType === 'allies') {
    executerAction(j, action, null);
    return;
  }

  const possibles = cibleType === 'ennemi'
    ? cb.monstres.filter((m) => !m.mort)
    : etat.joueurs.filter((x) => !x.ko);
  if (possibles.length === 1) {
    executerAction(j, action, possibles[0]);
  } else {
    cb.cibleEnAttente = { joueur: j, action };
    rendreCombat();
    rendreActions(j);
  }
}

function executerAction(j, action, cible) {
  const cb = etat.combat;
  // Empêche un double-clic de jouer deux actions dans le même tour.
  if (!cb.finTour || cb.termine) return;
  const finir = cb.finTour;
  cb.finTour = null;
  if (action.genre === 'attaque') {
    const brut = 3 + Math.max(j.stats.for, j.stats.agi);
    const r = infligerDegats(j, cible, brut);
    journal(`⚔️ ${j.nom} attaque ${cible.nom} : ${texteDegats(r)}`);
    gererMort(cible);
  } else if (action.genre === 'defense') {
    j.defense = true;
    j.mp = Math.min(j.maxMp, j.mp + 3);
    journal(`🛡️ ${j.nom} se met en garde (+3 PM, dégâts subis réduits de moitié).`);
  } else {
    lancerCompetence(j, action.compId, cible);
  }
  rendreCombat();
  finir();
}

function lancerCompetence(j, compId, cible) {
  const cb = etat.combat;
  const comp = COMPETENCES[compId];
  j.mp -= comp.coutMp;
  if (comp.cooldown) j.cooldowns[compId] = comp.cooldown;

  if (comp.type === 'degats') {
    const cibles = comp.cible === 'ennemis' ? cb.monstres.filter((m) => !m.mort) : [cible];
    journal(`${comp.emoji} ${j.nom} utilise ${comp.nom} !`);
    cibles.forEach((c) => {
      const brut = comp.puissance + j.stats[comp.stat] * comp.ratio;
      const r = infligerDegats(j, c, brut, { critBonus: comp.critBonus || 0 });
      journal(`→ ${c.nom} subit ${texteDegats(r)}`);
      gererMort(c);
      if (comp.effet && !estMort(c)) appliquerEffet(j, c, comp.effet, r);
    });
  } else if (comp.type === 'soin') {
    const cibles = comp.cible === 'allies' ? etat.joueurs.filter((x) => !x.ko) : [cible];
    cibles.forEach((c) => {
      const soin = soigner(c, comp.puissance + j.stats[comp.stat] * comp.ratio);
      journal(`${comp.emoji} ${j.nom} rend ${soin} PV à ${c === j ? 'lui-même' : c.nom}.`);
    });
  } else {
    appliquerEffet(j, cible || j, comp.effet, null);
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
  const joueursVivants = etat.joueurs.filter((x) => !x.ko);
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
  const zoneE = el('zone-ennemis');
  zoneE.innerHTML = '';
  cb.monstres.forEach((m) => zoneE.appendChild(carteCombattant(m)));
  const zoneJ = el('zone-joueurs');
  zoneJ.innerHTML = '';
  etat.joueurs.forEach((j) => zoneJ.appendChild(carteCombattant(j)));
  rendreJournal();
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
    <div class="combattant-nom">${echapper(c.nom)}${c.type === 'joueur' ? ` <span class="niveau">niv. ${c.niveau}</span>` : ''}</div>
    ${barres}
    <div class="combattant-statuts">${statuts}${defense}${mort ? (c.type === 'joueur' ? '😵 KO' : '☠️') : ''}</div>`;

  if (!mort && cibleValide(c)) {
    carte.classList.add('ciblable');
    carte.addEventListener('click', () => {
      const { joueur, action } = cb.cibleEnAttente;
      cb.cibleEnAttente = null;
      executerAction(joueur, action, c);
    });
  }

  return carte;
}
