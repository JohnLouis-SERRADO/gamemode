'use strict';

// =====================================================================
// Couche réseau : API REST Supabase en fetch pur (aucune dépendance).
// Le jeu fonctionne aussi hors ligne : tout échec réseau est silencieux
// et bascule l'interface en « monde local ».
// =====================================================================

const RESEAU_CONFIG = (typeof window !== 'undefined' && window.GAMEMODE_CONFIG) || {
  url: 'https://xutfwgmogzfuutcqpwni.supabase.co',
  cle: 'sb_publishable_69aF07BIexSMxFDwElnOjg_jas2yryz',
};

const DELAI_REQUETE_MS = 6000;
const SEUIL_EN_LIGNE_MS = 5 * 60 * 1000; // « en ligne » = actif dans les 5 dernières minutes

async function apiRequete(chemin, options = {}) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_REQUETE_MS);
  try {
    const reponse = await fetch(RESEAU_CONFIG.url + chemin, {
      method: options.methode || 'GET',
      headers: {
        apikey: RESEAU_CONFIG.cle,
        Authorization: `Bearer ${RESEAU_CONFIG.cle}`,
        'Content-Type': 'application/json',
      },
      body: options.corps ? JSON.stringify(options.corps) : undefined,
      signal: controleur.signal,
    });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    const texte = await reponse.text();
    return texte ? JSON.parse(texte) : null;
  } finally {
    clearTimeout(minuteur);
  }
}

// =====================================================================
// Détection en ligne / hors ligne
// =====================================================================
let minuterieReconnexion = null;
let minuterieEvenement = null;

async function demarrerReseau() {
  try {
    await apiRequete('/rest/v1/boss_monde?actif=eq.true&select=nom&limit=1');
    etat.enLigne = true;
  } catch (e) {
    etat.enLigne = false;
  }
  majUiReseau();
  if (etat.enLigne) {
    chargerEvenementMonde();
    if (!minuterieEvenement) {
      minuterieEvenement = setInterval(chargerEvenementMonde, 5 * 60 * 1000);
    }
  }
  if (!etat.enLigne && !minuterieReconnexion) {
    minuterieReconnexion = setInterval(async () => {
      try {
        await apiRequete('/rest/v1/boss_monde?actif=eq.true&select=nom&limit=1');
        etat.enLigne = true;
        clearInterval(minuterieReconnexion);
        minuterieReconnexion = null;
        majUiReseau();
        // Le monde revient : on récupère l'expédition laissée en plan.
        if (typeof restaurerGroupeLigne === 'function') restaurerGroupeLigne();
      } catch (e) { /* toujours hors ligne */ }
    }, 60000);
  }
}

function majUiReseau() {
  const texte = el('titre-reseau');
  if (texte) {
    texte.textContent = etat.enLigne
      ? '🌍 Monde en ligne : vos héros sont synchronisés et les autres joueurs vous attendent à la taverne.'
      : '📴 Monde local : jeu hors ligne sur cet appareil (la taverne multijoueur nécessite une connexion).';
    texte.classList.toggle('reseau-ok', etat.enLigne);
  }
  const point = el('point-en-ligne');
  if (point) point.classList.toggle('actif-reseau', etat.enLigne);
}

// =====================================================================
// Événements mondiaux
// =====================================================================
async function chargerEvenementMonde() {
  if (!etat.enLigne) return;
  try {
    const evenement = await apiRequete('/rest/v1/rpc/evenement_actuel', { methode: 'POST', corps: {} });
    etat.evenementMonde = evenement && new Date(evenement.fin) > new Date() ? evenement : null;
  } catch (e) { /* le jeu continue sans événement */ }
  majBandeauEvenement();
}

// Multiplicateurs de l'événement mondial actif (1 partout sinon).
function multiplicateursEvenement() {
  const evenement = etat.evenementMonde;
  if (!evenement || new Date(evenement.fin) <= new Date()) return { xp: 1, po: 1, drop: 1 };
  return {
    xp: Number(evenement.mult_xp) || 1,
    po: Number(evenement.mult_po) || 1,
    drop: Number(evenement.mult_drop) || 1,
  };
}

function majBandeauEvenement() {
  const bandeau = el('bandeau-evenement');
  if (!bandeau) return;
  const evenement = etat.evenementMonde;
  if (!evenement || new Date(evenement.fin) <= new Date()) {
    bandeau.classList.add('cache');
    return;
  }
  const minutes = Math.max(1, Math.round((new Date(evenement.fin).getTime() - Date.now()) / 60000));
  bandeau.textContent = `${evenement.emoji} Événement mondial — ${evenement.nom} : ${evenement.description} (encore ${minutes} min)`;
  bandeau.classList.remove('cache');
}

// =====================================================================
// Synchronisation des personnages
// =====================================================================
const sauvegardesEnAttente = {};

function planifierSauvegardeCloud(p) {
  if (!etat.enLigne) return;
  if (sauvegardesEnAttente[p.id]) clearTimeout(sauvegardesEnAttente[p.id]);
  sauvegardesEnAttente[p.id] = setTimeout(() => {
    delete sauvegardesEnAttente[p.id];
    sauvegarderCloud(p);
  }, 1500);
}

// v18 : le héros admin reste local PAR DÉFAUT — mais son joueur peut
// choisir de le relier au monde (bouton « Relier au monde », onglet
// Compte). Une fois relié, il se synchronise comme n'importe quel héros.
function herosLocalSeulement(p) {
  // Un héros DÉJÀ enregistré en ligne se synchronise toujours : sans cette
  // garde, un aller-retour malheureux du drapeau le laisserait publié mais
  // figé pour toujours, jamais remis à jour.
  if (p.cloud) return false;
  return !!p.admin && !p.relieAuMonde;
}

async function sauvegarderCloud(p) {
  if (!etat.enLigne || herosLocalSeulement(p)) return;
  try {
    if (!p.cloud) {
      await creerPersonnageCloud(p);
      return; // la création envoie déjà l'état complet
    }
    await apiRequete('/rest/v1/rpc/sauvegarder_personnage', {
      methode: 'POST',
      corps: {
        p_id: p.cloud.id,
        p_token: p.cloud.token,
        p_niveau: p.niveau,
        p_xp: p.xp,
        p_donnees: donneesCloud(p),
      },
    });
  } catch (e) { /* la sauvegarde locale reste la référence */ }
}

// Verrou de réentrance : sans lui, un double-clic ou une sauvegarde
// planifiée pendant la création créerait des personnages cloud en double.
const creationsCloudEnCours = new Set();

async function creerPersonnageCloud(p) {
  if (!etat.enLigne || p.cloud || herosLocalSeulement(p) || creationsCloudEnCours.has(p.id)) return;
  creationsCloudEnCours.add(p.id);
  try {
    const resultat = await apiRequete('/rest/v1/rpc/creer_personnage', {
      methode: 'POST',
      corps: { p_nom: p.nom, p_avatar: p.avatar, p_donnees: donneesCloud(p) },
    });
    if (resultat && resultat.id) {
      p.cloud = { id: resultat.id, token: resultat.token };
      // La création a abouti : le drapeau suit, quoi qu'ait fait entre-temps
      // un clic concurrent sur « Relier au monde ».
      if (p.admin) p.relieAuMonde = true;
      sauvegarderLocal();
      await apiRequete('/rest/v1/rpc/sauvegarder_personnage', {
        methode: 'POST',
        corps: {
          p_id: p.cloud.id, p_token: p.cloud.token,
          p_niveau: p.niveau, p_xp: p.xp, p_donnees: donneesCloud(p),
        },
      });
      // v15 : le code de récupération choisi à la création s'attache dès
      // que le héros existe en ligne.
      if (p.recuperation) definirRecuperationCloud(p);
    }
  } catch (e) {
    /* on réessaiera plus tard */
  } finally {
    creationsCloudEnCours.delete(p.id);
  }
}

async function recupererPersonnageCloud(id, token) {
  try {
    return await apiRequete('/rest/v1/rpc/recuperer_personnage', {
      methode: 'POST',
      corps: { p_id: id, p_token: token },
    });
  } catch (e) {
    return null;
  }
}

// =====================================================================
// Boss du monde et chat
// =====================================================================
async function envoyerDegatsBossMonde(degats) {
  const p = persoActif();
  if (!p || !etat.enLigne) return null;
  try {
    if (!p.cloud) await creerPersonnageCloud(p);
    if (!p.cloud) return null;
    return await apiRequete('/rest/v1/rpc/attaquer_boss', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_degats: degats },
    });
  } catch (e) {
    return null;
  }
}

async function envoyerMessageMonde(texte) {
  const p = persoActif();
  if (!p || !etat.enLigne || !texte.trim()) return false;
  try {
    if (!p.cloud) await creerPersonnageCloud(p);
    if (!p.cloud) return false;
    await apiRequete('/rest/v1/rpc/envoyer_message', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_texte: texte.trim().slice(0, 200) },
    });
    return true;
  } catch (e) {
    return false;
  }
}

// Renomme le personnage aussi dans le monde en ligne (taverne, classement).
async function renommerPersonnageCloud(p) {
  if (!etat.enLigne || !p.cloud) return;
  try {
    await apiRequete('/rest/v1/rpc/renommer_personnage', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_nom: p.nom },
    });
  } catch (e) { /* le nom local reste la référence */ }
}

// v15 — Code de récupération : un identifiant choisi par le joueur
// (type email) qui permet de retrouver son héros sans le code technique.
// Jamais lisible publiquement : il ne circule que par RPC.
async function definirRecuperationCloud(p) {
  if (!etat.enLigne || !p.cloud || !p.recuperation) return { ok: false };
  try {
    const res = await apiRequete('/rest/v1/rpc/definir_recuperation', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_code: p.recuperation },
    });
    if (res && res.erreur) {
      afficherToast(`🗝️ ${res.erreur}`);
      p.recuperation = null;
      sauvegarderLocal();
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
}

async function recupererParCodeCloud(code) {
  if (!etat.enLigne) return null;
  try {
    const res = await apiRequete('/rest/v1/rpc/recuperer_par_code', {
      methode: 'POST',
      corps: { p_code: code },
    });
    return res && res.id ? res : null;
  } catch (e) {
    return null;
  }
}

// Efface le personnage du monde en ligne (appelé à la suppression locale).
async function supprimerPersonnageCloud(p) {
  if (!p.cloud) return;
  try {
    await apiRequete('/rest/v1/rpc/supprimer_personnage', {
      methode: 'POST',
      corps: { p_id: p.cloud.id, p_token: p.cloud.token },
    });
  } catch (e) { /* au pire, la ligne s'éteindra d'elle-même (inactivité) */ }
}

// =====================================================================
// Taverne : chat, joueurs, boss du monde, classement
// =====================================================================
// v17 : plusieurs classements logiques, calculés depuis les sauvegardes
// publiques des meilleurs héros.
function puissancePublique(j) {
  if (!j.dstats) return 0;
  return puissanceDe({
    stats: { for: 4, int: 4, dex: 4, vit: 4, cha: 2, ...j.dstats },
    equipement: j.dequip || {},
    familier: j.dfam || null,
    niveau: j.niveau || 1,
  });
}

const CLASSEMENTS_TAVERNE = [
  { id: 'niveau', nom: '🏆 Niveau', valeur: (j) => (j.niveau || 0) * 1e9 + (j.xp || 0), texte: (v, j) => `niv. ${j.niveau} (${formatNombre(j.xp)} XP)` },
  { id: 'puissance', nom: '⚡ Puissance', valeur: (j) => puissancePublique(j), texte: (v) => `⚡ ${formatNombre(v)} de puissance` },
  { id: 'fortune', nom: '💰 Fortune', valeur: (j) => j.dpo || 0, texte: (v) => `${formatNombre(v)} po en bourse` },
  { id: 'bossmonde', nom: '🌍 Boss du monde', valeur: (j) => j.degats_boss_total || 0, texte: (v) => `${formatNombre(v)} dégâts au boss du monde` },
  { id: 'tour', nom: '🗼 Tour Sans Fin', valeur: (j) => j.dtour || 0, texte: (v) => `étage ${v} de la Tour Sans Fin` },
  { id: 'tourboss', nom: '🏯 Tour des Boss', valeur: (j) => (j.dtb ? Math.max(j.dtb.normal || 0, j.dtb.heroique || 0, j.dtb.cauchemar || 0) : 0), texte: (v) => `étage ${v} de la Tour des Boss` },
  { id: 'hautsfaits', nom: '🏅 Hauts faits', valeur: (j) => (Array.isArray(j.dhf) ? j.dhf.length : 0), texte: (v) => `${v} haut${v > 1 ? 's' : ''} fait${v > 1 ? 's' : ''} accompli${v > 1 ? 's' : ''}` },
];
let classementTaverneActif = 'niveau';
// Filtres du comptoir d'échange (v17).
const filtresComptoir = { type: 'tous', rarete: 'tous' };

let minuterieTaverne = null;
let donneesTaverne = {
  boss: null, contributions: [], messages: [], joueurs: [], classement: [],
  echanges: [], mesVentes: [],
};

function arreterSondageTaverne() {
  if (minuterieTaverne) {
    clearInterval(minuterieTaverne);
    minuterieTaverne = null;
  }
}

async function chargerDonneesTaverne() {
  if (!etat.enLigne) return false;
  try {
    const p = persoActif();
    const [boss, messages, joueurs, classement, echanges, mesVentes] = await Promise.all([
      apiRequete('/rest/v1/boss_monde?actif=eq.true&select=*&order=id.desc&limit=1'),
      apiRequete('/rest/v1/messages?select=nom,avatar,texte,cree_le&order=id.desc&limit=40'),
      apiRequete('/rest/v1/personnages?select=id,nom,avatar,niveau,xp,degats_boss_total,derniere_activite&order=derniere_activite.desc&limit=30'),
      // v17 : on ramène de quoi construire PLUSIEURS classements (puissance,
      // fortune, tours, hauts faits…) — champs ciblés du JSON de sauvegarde.
      apiRequete('/rest/v1/personnages?select=id,nom,avatar,niveau,xp,degats_boss_total,'
        + 'dstats:donnees->stats,dequip:donnees->equipement,dfam:donnees->familier,'
        + 'dpo:donnees->po,dhf:donnees->hautsFaits,dtb:donnees->tourBoss,dtour:donnees->tourMax'
        + '&order=niveau.desc,xp.desc&limit=20'),
      apiRequete('/rest/v1/echanges?statut=eq.ouvert&select=*&order=maj.desc&limit=30'),
      p && p.cloud
        ? apiRequete(`/rest/v1/echanges?vendeur_id=eq.${p.cloud.id}&statut=eq.vendu&reclame=eq.false&select=id,prix,objet_id,acheteur_nom`)
        : Promise.resolve([]),
    ]);
    donneesTaverne.boss = boss && boss[0] ? boss[0] : null;
    donneesTaverne.messages = (messages || []).reverse();
    donneesTaverne.joueurs = joueurs || [];
    donneesTaverne.classement = classement || [];
    donneesTaverne.echanges = echanges || [];
    donneesTaverne.mesVentes = mesVentes || [];
    if (donneesTaverne.boss) {
      donneesTaverne.contributions = await apiRequete(
        `/rest/v1/contributions_boss?boss_id=eq.${donneesTaverne.boss.id}&select=nom,degats&order=degats.desc&limit=8`) || [];
    }
    return true;
  } catch (e) {
    // Échec transitoire possible : re-tester tout de suite et, si le monde
    // est vraiment injoignable, armer la reconnexion automatique (60 s).
    etat.enLigne = false;
    majUiReseau();
    demarrerReseau();
    return false;
  }
}

function tempsRelatif(horodatage) {
  const ecart = Date.now() - new Date(horodatage).getTime();
  if (ecart < 60000) return 'à l’instant';
  if (ecart < 3600000) return `il y a ${Math.floor(ecart / 60000)} min`;
  if (ecart < 86400000) return `il y a ${Math.floor(ecart / 3600000)} h`;
  return `il y a ${Math.floor(ecart / 86400000)} j`;
}

function rendreTaverne() {
  const zone = el('taverne-contenu');
  zone.innerHTML = '';

  if (!etat.enLigne) {
    const panneau = document.createElement('div');
    panneau.className = 'panneau';
    panneau.innerHTML = `
      <h3>📴 Monde local</h3>
      <p class="aide">La taverne rassemble tous les joueurs du monde : chat, classement et boss commun.
      Elle nécessite une connexion au monde en ligne, qui est injoignable pour le moment.
      Votre partie continue normalement hors ligne — vos héros restent sauvegardés sur cet appareil.</p>`;
    const reessayer = document.createElement('button');
    reessayer.className = 'btn-choix';
    reessayer.textContent = '🔄 Réessayer la connexion';
    reessayer.addEventListener('click', async () => {
      reessayer.disabled = true;
      reessayer.textContent = 'Connexion…';
      await demarrerReseau();
      rendreTaverne();
    });
    panneau.appendChild(reessayer);
    zone.appendChild(panneau);
    return;
  }

  // --- Expédition multi-écrans ---
  const blocGroupe = document.createElement('div');
  blocGroupe.className = 'panneau';
  blocGroupe.innerHTML = `<h3>🖥️ Jouer ensemble, chacun sur son écran</h3>
    <p class="aide">Créez un groupe et partagez son code : vos amis le rejoignent depuis leur propre
    appareil, et vous partez combattre ensemble — chacun joue son tour sur son écran.</p>`;
  const ligneGroupe = document.createElement('div');
  ligneGroupe.className = 'rangee-boutons';
  if (etat.groupeLigne) {
    const reprendre = document.createElement('button');
    reprendre.className = 'btn-principal btn-compact';
    reprendre.textContent = `↩️ Retrouver mon groupe (${etat.groupeLigne.code})`;
    reprendre.addEventListener('click', () => ouvrirLobbyGroupe());
    ligneGroupe.appendChild(reprendre);
  } else {
    const creer = document.createElement('button');
    creer.className = 'btn-principal btn-compact';
    creer.textContent = '✨ Créer un groupe';
    creer.addEventListener('click', () => creerGroupeLigne());
    ligneGroupe.appendChild(creer);
    const champCode = document.createElement('input');
    champCode.id = 'taverne-code-groupe';
    champCode.placeholder = 'CODE';
    champCode.maxLength = 6;
    champCode.autocomplete = 'off';
    champCode.className = 'champ-code-groupe';
    const rejoindre = document.createElement('button');
    rejoindre.className = 'btn-choix btn-compact';
    rejoindre.textContent = '🔑 Rejoindre avec un code';
    rejoindre.addEventListener('click', () => {
      const code = champCode.value.trim();
      if (code.length < 4) { afficherToast('Entrez le code du groupe (6 caractères).'); return; }
      rejoindreGroupeLigne(code);
    });
    ligneGroupe.appendChild(champCode);
    ligneGroupe.appendChild(rejoindre);
  }
  blocGroupe.appendChild(ligneGroupe);
  zone.appendChild(blocGroupe);

  // --- Squelette ---
  const blocBoss = document.createElement('div');
  blocBoss.className = 'panneau';
  blocBoss.id = 'taverne-boss';
  blocBoss.innerHTML = '<h3>🌍 Boss du monde</h3><p class="aide">Chargement…</p>';
  zone.appendChild(blocBoss);


  const blocChat = document.createElement('div');
  blocChat.className = 'panneau';
  blocChat.innerHTML = '<h3>💬 Chat des Royaumes</h3>';
  const listeChat = document.createElement('div');
  listeChat.id = 'taverne-chat';
  listeChat.className = 'liste-chat';
  blocChat.appendChild(listeChat);
  const ligneEnvoi = document.createElement('div');
  ligneEnvoi.className = 'ligne-envoi';
  const champ = document.createElement('input');
  champ.id = 'taverne-champ-chat';
  champ.maxLength = 200;
  champ.placeholder = 'Dites bonjour aux Royaumes…';
  champ.autocomplete = 'off';
  const envoyer = document.createElement('button');
  envoyer.className = 'btn-choix';
  envoyer.textContent = 'Envoyer';
  const envoyerMaintenant = async () => {
    const texte = champ.value.trim();
    if (!texte) return;
    champ.value = '';
    envoyer.disabled = true;
    const ok = await envoyerMessageMonde(texte);
    envoyer.disabled = false;
    if (ok) {
      await chargerDonneesTaverne();
      rendreSectionsTaverne();
    } else {
      afficherToast('Message non envoyé (monde injoignable).');
    }
  };
  envoyer.addEventListener('click', envoyerMaintenant);
  champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') envoyerMaintenant(); });
  ligneEnvoi.appendChild(champ);
  ligneEnvoi.appendChild(envoyer);
  blocChat.appendChild(ligneEnvoi);
  zone.appendChild(blocChat);

  // --- Comptoir d'échange entre joueurs ---
  const blocComptoir = document.createElement('div');
  blocComptoir.className = 'panneau';
  blocComptoir.innerHTML = `<h3>🤝 Comptoir d'échange</h3>
    <p class="aide">Vendez vos trouvailles aux autres joueurs contre de l'or — ou faites-y de bonnes affaires.
    L'or de vos ventes s'encaisse ici même.</p>
    <div id="comptoir-reclamer"></div>`;

  const pComptoir = persoActif();
  const vendables = pComptoir.inventaire.filter((entree) => OBJETS[entree.id]);
  if (vendables.length > 0) {
    const formulaire = document.createElement('div');
    formulaire.className = 'rangee-boutons formulaire-comptoir';
    const selectObjet = document.createElement('select');
    selectObjet.id = 'comptoir-objet';
    selectObjet.className = 'select-groupe';
    // v19 : la liste déroulante annonçait un nom et rien d'autre — ni la
    // rareté, ni les effets. On y met tout, et un aperçu complet s'affiche
    // sous le formulaire dès qu'un objet est choisi.
    vendables
      .slice()
      .sort((a, b) => {
        const oa = OBJETS[a.id]; const ob = OBJETS[b.id];
        const ordre = ['divin', 'mythique', 'legendaire', 'epique', 'rare', 'inhabituel', 'commun'];
        return ordre.indexOf(rareteDe(oa)) - ordre.indexOf(rareteDe(ob))
          || (ob.niveau || 0) - (oa.niveau || 0);
      })
      .forEach((entree) => {
        const objet = OBJETS[entree.id];
        const option = document.createElement('option');
        option.value = entree.id;
        const rarete = rareteDe(objet);
        const etiquette = rarete === 'commun' ? '' : ` 〔${RARETES[rarete].nom}〕`;
        const niveau = objet.type === 'equipement' && objet.niveau ? ` · niv. ${objet.niveau}` : '';
        option.textContent = `${objet.emoji} ${objet.nom}${etiquette}${niveau} (×${entree.qte})`;
        selectObjet.appendChild(option);
      });
    const champQte = document.createElement('input');
    champQte.id = 'comptoir-qte';
    champQte.type = 'number';
    champQte.min = '1';
    champQte.max = '99';
    champQte.value = '1';
    champQte.className = 'champ-comptoir';
    champQte.title = 'Quantité';
    const champPrix = document.createElement('input');
    champPrix.id = 'comptoir-prix';
    champPrix.type = 'number';
    champPrix.min = '1';
    champPrix.value = '50';
    champPrix.className = 'champ-comptoir large';
    champPrix.title = 'Prix en po';
    const vendre = document.createElement('button');
    vendre.className = 'btn-choix btn-compact';
    vendre.textContent = '📤 Mettre en vente';
    vendre.addEventListener('click', () => vendreAuComptoir());
    formulaire.appendChild(selectObjet);
    formulaire.appendChild(champQte);
    formulaire.appendChild(champPrix);
    formulaire.appendChild(vendre);
    blocComptoir.appendChild(formulaire);

    // L'aperçu : la même carte que partout ailleurs, pour qu'on sache
    // exactement ce qu'on met en vente avant de fixer son prix.
    const apercu = document.createElement('div');
    apercu.className = 'apercu-vente';
    const majApercu = () => {
      const objet = OBJETS[selectObjet.value];
      if (!objet) { apercu.innerHTML = ''; return; }
      apercu.innerHTML = `
        <div class="carte-objet bord-rar-${rareteDe(objet)}">
          <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}</div>
          <div class="objet-desc">${objet.desc || ''}</div>
          ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
          ${texteSet(objet)}
          ${objet.type === 'equipement' && objet.niveau ? `<div class="objet-niveau">niv. ${objet.niveau} requis</div>` : ''}
          <div class="annonce-detail">Valeur de rachat en boutique : ${formatNombre(prixVenteDe(selectObjet.value))} po</div>
        </div>`;
    };
    selectObjet.addEventListener('change', majApercu);
    majApercu();
    blocComptoir.appendChild(apercu);
  }
  // v17 : filtres du comptoir (type + rareté), comme dans les boutiques.
  const rangeeFiltresComptoir = document.createElement('div');
  rangeeFiltresComptoir.className = 'rangee-chips rangee-sous-filtres';
  const majChipsComptoir = () => {
    rangeeFiltresComptoir.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.type === filtresComptoir.type || c.dataset.rarete === filtresComptoir.rarete);
    });
    rendreSectionsTaverne();
  };
  [['tous', 'Tout'], ['equipement', '⚔️ Équipements'], ['consommable', '🧪 Consommables'], ['materiau', '⛏️ Matériaux']].forEach(([id, nom]) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-filtre' + (filtresComptoir.type === id ? ' active' : '');
    chip.dataset.type = id;
    chip.textContent = nom;
    chip.addEventListener('click', () => { filtresComptoir.type = id; majChipsComptoir(); });
    rangeeFiltresComptoir.appendChild(chip);
  });
  const sepComptoir = document.createElement('span');
  sepComptoir.className = 'separateur-chips';
  rangeeFiltresComptoir.appendChild(sepComptoir);
  [['tous', '✨ Toutes raretés'], ...Object.keys(RARETES).map((r) => [r, RARETES[r].nom])].forEach(([id, nom]) => {
    const chip = document.createElement('button');
    chip.className = `chip chip-filtre chip-rar-${id}` + (filtresComptoir.rarete === id ? ' active' : '');
    chip.dataset.rarete = id;
    chip.textContent = nom;
    chip.addEventListener('click', () => { filtresComptoir.rarete = id; majChipsComptoir(); });
    rangeeFiltresComptoir.appendChild(chip);
  });
  blocComptoir.appendChild(rangeeFiltresComptoir);
  blocComptoir.insertAdjacentHTML('beforeend', '<div id="comptoir-liste"><p class="aide">Chargement des annonces…</p></div>');
  zone.appendChild(blocComptoir);

  const colonnes = document.createElement('div');
  colonnes.className = 'colonnes-taverne';
  const blocJoueurs = document.createElement('div');
  blocJoueurs.className = 'panneau';
  blocJoueurs.innerHTML = '<h3>🧑‍🤝‍🧑 Aventuriers</h3><div id="taverne-joueurs"></div>';
  const blocClassement = document.createElement('div');
  blocClassement.className = 'panneau';
  blocClassement.innerHTML = `<h3>🏆 Classements</h3>
    <div class="rangee-chips" id="taverne-classement-choix"></div>
    <div id="taverne-classement"></div>
    <p class="aide">Parmi les 20 héros les plus avancés du monde.</p>`;
  const choixClassement = blocClassement.querySelector('#taverne-classement-choix');
  CLASSEMENTS_TAVERNE.forEach((c) => {
    const chip = document.createElement('button');
    chip.className = 'chip chip-filtre' + (classementTaverneActif === c.id ? ' active' : '');
    chip.textContent = c.nom;
    chip.addEventListener('click', () => {
      classementTaverneActif = c.id;
      choixClassement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x.textContent === c.nom));
      rendreSectionsTaverne();
    });
    choixClassement.appendChild(chip);
  });
  colonnes.appendChild(blocJoueurs);
  colonnes.appendChild(blocClassement);
  zone.appendChild(colonnes);

  // --- Chargement + sondage ---
  chargerDonneesTaverne().then((ok) => {
    if (ok) rendreSectionsTaverne();
    else rendreTaverne();
  });
  arreterSondageTaverne();
  minuterieTaverne = setInterval(async () => {
    if (!el('ecran-taverne').classList.contains('actif')) { arreterSondageTaverne(); return; }
    const ok = await chargerDonneesTaverne();
    if (ok) rendreSectionsTaverne();
  }, 7000);
}

function rendreSectionsTaverne() {
  if (!el('ecran-taverne').classList.contains('actif')) return;
  const p = persoActif();

  // --- Boss du monde ---
  const blocBoss = el('taverne-boss');
  if (blocBoss) {
    const boss = donneesTaverne.boss;
    blocBoss.innerHTML = '<h3>🌍 Boss du monde</h3>';
    if (!boss) {
      blocBoss.insertAdjacentHTML('beforeend', '<p class="aide">Aucun boss actif pour le moment.</p>');
    } else {
      const pct = Math.max(0, Math.round((boss.hp / boss.hp_max) * 100));
      const entete = document.createElement('div');
      entete.className = 'boss-monde-entete';
      entete.innerHTML = `<span class="boss-monde-emoji">${boss.emoji}</span>
        <div class="boss-monde-infos">
          <strong>${echapper(boss.nom)}</strong> <span class="niveau">génération ${boss.generation}</span>
          <div class="barre pv boss-monde-barre"><div class="remplissage" style="width:${pct}%"></div>
            <span>${formatNombre(boss.hp)} / ${formatNombre(boss.hp_max)} PV</span></div>
        </div>`;
      blocBoss.appendChild(entete);

      const explication = document.createElement('p');
      explication.className = 'aide';
      explication.textContent = 'Affrontez votre propre instance du boss : chaque point de dégât que vous lui infligez est retiré de sa vie mondiale, partagée entre tous les joueurs. Quand elle tombe à zéro, tout le monde gagne — et un boss plus redoutable apparaît.';
      blocBoss.appendChild(explication);

      const affronter = document.createElement('button');
      affronter.className = 'btn-principal btn-compact';
      affronter.textContent = `⚔️ Affronter ${boss.nom}`;
      affronter.addEventListener('click', () => {
        arreterSondageTaverne();
        demarrerCombatBossMonde(boss);
      });
      blocBoss.appendChild(affronter);

      if (donneesTaverne.contributions.length > 0) {
        const titre = document.createElement('h4');
        titre.className = 'titre-categorie';
        titre.textContent = 'Meilleurs contributeurs';
        blocBoss.appendChild(titre);
        const liste = document.createElement('div');
        liste.className = 'liste-classement';
        donneesTaverne.contributions.forEach((c, i) => {
          const ligne = document.createElement('div');
          ligne.className = 'ligne-classement';
          ligne.textContent = `${i + 1}. ${c.nom} — ${formatNombre(c.degats)} dégâts`;
          liste.appendChild(ligne);
        });
        blocBoss.appendChild(liste);
      }
    }
  }

  // --- Chat ---
  const listeChat = el('taverne-chat');
  if (listeChat) {
    const enBas = listeChat.scrollHeight - listeChat.scrollTop - listeChat.clientHeight < 40;
    listeChat.innerHTML = '';
    if (donneesTaverne.messages.length === 0) {
      const vide = document.createElement('p');
      vide.className = 'aide';
      vide.textContent = 'Personne n’a encore parlé. Lancez la conversation !';
      listeChat.appendChild(vide);
    }
    donneesTaverne.messages.forEach((m) => {
      const ligne = document.createElement('div');
      ligne.className = 'message-chat' + (p && m.nom === p.nom ? ' moi' : '');
      const auteur = document.createElement('span');
      auteur.className = 'chat-auteur';
      auteur.textContent = `${m.avatar || '⚔️'} ${m.nom}`;
      const heure = document.createElement('span');
      heure.className = 'chat-heure';
      heure.textContent = tempsRelatif(m.cree_le);
      const texte = document.createElement('div');
      texte.className = 'chat-texte';
      texte.textContent = m.texte;
      ligne.appendChild(auteur);
      ligne.appendChild(heure);
      ligne.appendChild(texte);
      listeChat.appendChild(ligne);
    });
    if (enBas) listeChat.scrollTop = listeChat.scrollHeight;
  }

  // --- Joueurs ---
  const zoneJoueurs = el('taverne-joueurs');
  if (zoneJoueurs) {
    zoneJoueurs.innerHTML = '';
    if (donneesTaverne.joueurs.length === 0) {
      zoneJoueurs.innerHTML = '<p class="aide">Aucun aventurier connu pour l’instant.</p>';
    }
    donneesTaverne.joueurs.forEach((j) => {
      const enLigne = Date.now() - new Date(j.derniere_activite).getTime() < SEUIL_EN_LIGNE_MS;
      const ligne = document.createElement('div');
      ligne.className = 'ligne-joueur';
      const nom = document.createElement('span');
      nom.textContent = `${j.avatar || '⚔️'} ${j.nom}`;
      const detail = document.createElement('span');
      detail.className = 'joueur-detail';
      detail.textContent = `niv. ${j.niveau} · ${enLigne ? '🟢 en ligne' : tempsRelatif(j.derniere_activite)} · 👁️`;
      ligne.appendChild(nom);
      ligne.appendChild(detail);
      rendreCliquable(ligne, () => ouvrirFichePublique(j.id));
      zoneJoueurs.appendChild(ligne);
    });
  }

  // --- Classements (v17 : plusieurs vues logiques) ---
  const zoneClassement = el('taverne-classement');
  if (zoneClassement) {
    zoneClassement.innerHTML = '';
    const config = CLASSEMENTS_TAVERNE.find((c) => c.id === classementTaverneActif) || CLASSEMENTS_TAVERNE[0];
    const lignes = donneesTaverne.classement
      .map((j) => ({ joueur: j, valeur: config.valeur(j) }))
      .sort((a, b) => b.valeur - a.valeur)
      .slice(0, 10);
    lignes.forEach(({ joueur: j, valeur }, i) => {
      const ligne = document.createElement('div');
      ligne.className = 'ligne-classement';
      const medaille = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      ligne.textContent = `${medaille} ${j.avatar || '⚔️'} ${j.nom} — ${config.texte(valeur, j)} 👁️`;
      rendreCliquable(ligne, () => ouvrirFichePublique(j.id));
      zoneClassement.appendChild(ligne);
    });
  }

  // --- Comptoir d'échange ---
  const zoneReclamer = el('comptoir-reclamer');
  if (zoneReclamer) {
    zoneReclamer.innerHTML = '';
    if (donneesTaverne.mesVentes.length > 0) {
      const total = donneesTaverne.mesVentes.reduce((somme, vente) => somme + vente.prix, 0);
      const encaisser = document.createElement('button');
      encaisser.className = 'btn-principal btn-compact';
      encaisser.textContent = `💰 Encaisser ${donneesTaverne.mesVentes.length} vente${donneesTaverne.mesVentes.length > 1 ? 's' : ''} — ${formatNombre(total)} po`;
      encaisser.addEventListener('click', () => reclamerVentes());
      zoneReclamer.appendChild(encaisser);
    }
  }
  const zoneComptoir = el('comptoir-liste');
  if (zoneComptoir) {
    zoneComptoir.innerHTML = '';
    const annoncesVisibles = donneesTaverne.echanges.filter((annonce) => {
      const objet = OBJETS[annonce.objet_id];
      if (!objet) return false;
      if (filtresComptoir.type !== 'tous' && objet.type !== filtresComptoir.type) return false;
      if (filtresComptoir.rarete !== 'tous' && rareteDe(objet) !== filtresComptoir.rarete) return false;
      return true;
    });
    // v19 : le comptoir adopte les CARTES de la boutique — on y voit enfin
    // la rareté, les effets, la panoplie et ce que la pièce changerait.
    rendreListeFiltrable({
      cle: 'comptoir',
      conteneur: zoneComptoir,
      elements: annoncesVisibles,
      texteDe: (annonce) => `${texteRecherchableObjet(OBJETS[annonce.objet_id])} ${annonce.vendeur_nom || ''}`,
      tris: TRIS_OBJETS,
      trierAvec: (annonce) => ({ objet: OBJETS[annonce.objet_id], prix: annonce.prix }),
      classeListe: 'grille-inventaire',
      placeholder: '🔎 Chercher une annonce, un vendeur…',
      nomListe: 'annonces',
      vide: 'Aucune annonce au comptoir. Soyez le premier marchand !',
      rendre: (annonce) => {
        const objet = OBJETS[annonce.objet_id];
        const estMoi = p && p.cloud && annonce.vendeur_id === p.cloud.id;
        const carte = document.createElement('div');
        carte.className = `carte-objet bord-rar-${rareteDe(objet)}`;
        carte.innerHTML = `
          <div class="objet-entete">${objet.emoji} <strong>${objet.nom}</strong> ${etiquetteRarete(objet)}${annonce.qte > 1 ? ` <span class="objet-qte">×${annonce.qte}</span>` : ''}</div>
          <div class="objet-desc">${objet.desc || ''}</div>
          ${objet.bonus ? `<div class="objet-bonus">${texteBonus(objet.bonus)}</div>` : ''}
          ${texteSet(objet)}
          ${objet.type === 'equipement' && objet.niveau ? `<div class="objet-niveau ${p && p.niveau < objet.niveau ? 'niveau-insuffisant' : ''}">niv. ${objet.niveau} requis</div>` : ''}
          ${p ? texteComparaison(p, objet) : ''}
          <div class="annonce-detail">Vendu par ${estMoi ? '<strong>vous</strong>' : echapper(annonce.vendeur_nom)} · valeur de rachat : ${formatNombre(prixVenteDe(annonce.objet_id))} po</div>`;
        const bouton = document.createElement('button');
        bouton.className = 'btn-choix btn-compact btn-achat';
        if (estMoi) {
          bouton.textContent = '↩️ Retirer';
          bouton.addEventListener('click', () => annulerEchange(annonce));
        } else {
          bouton.textContent = `Acheter — ${formatNombre(annonce.prix)} po`;
          bouton.disabled = !p || p.po < annonce.prix;
          bouton.addEventListener('click', () => acheterEchange(annonce));
        }
        carte.appendChild(bouton);
        return carte;
      },
    });
  }
}

// =====================================================================
// Fiche publique d'un joueur : cliquer un nom à la taverne montre tout
// (stats, compétences, équipement, panoplies, hauts faits…).
// =====================================================================
function fermerFichePublique() {
  const voile = el('voile-joueur');
  if (voile) voile.remove();
}

async function ouvrirFichePublique(idJoueur) {
  if (!idJoueur) return;
  const lignes = await apiRequete(`/rest/v1/personnages?id=eq.${idJoueur}&select=id,nom,avatar,niveau,xp,donnees,degats_boss_total`)
    .catch(() => null);
  if (!lignes || !lignes[0]) { afficherToast('Fiche introuvable — le héros a peut-être quitté le monde.'); return; }
  const ligne = lignes[0];
  const d = ligne.donnees || {};

  // Pseudo-héros reconstruit pour réutiliser les calculs du jeu.
  const pp = {
    stats: d.stats || { for: 4, int: 4, dex: 4, vit: 4, cha: 2 },
    equipement: d.equipement || {},
    familier: d.familier || null,
    familiers: d.familiers || [],
    race: d.race || 'humain',
    niveau: ligne.niveau || 1,
    rangs: d.rangs || {},
  };
  const s = statsEffectives(pp);
  // La fiche publique affiche le rôle ET la spécialité, comme en local.
  const classe = CLASSES[d.classe] || CLASSES.aventurier;
  const identiteClasse = typeof nomCompletClasse === 'function'
    ? nomCompletClasse({ classe: d.classe, sousClasse: d.sousClasse })
    : classe.nom;
  const emojiIdentite = typeof emojiClasse === 'function'
    ? emojiClasse({ classe: d.classe, sousClasse: d.sousClasse })
    : classe.emoji;
  const race = RACES[pp.race] || RACES.humain;
  const titreActif = d.titre ? HAUTS_FAITS.find((h) => h.id === d.titre) : null;
  const compagnon = pp.familier ? FAMILIERS[pp.familier] : null;

  fermerFichePublique();
  const voile = document.createElement('div');
  voile.id = 'voile-joueur';
  voile.addEventListener('click', (e) => { if (e.target === voile) fermerFichePublique(); });
  const modale = document.createElement('div');
  modale.className = 'modale-joueur';

  const statsTexte = Object.entries(CARACS)
    .map(([cle, c]) => `${c.emoji} ${c.nom} <strong>${s[cle] || 0}</strong>`)
    .join(' · ');
  const equipements = Object.entries(SLOTS_EQUIPEMENT)
    .map(([slot, meta]) => {
      const idObjet = pp.equipement[slot];
      const objet = idObjet ? OBJETS[idObjet] : null;
      return `<div class="ligne-classement">${meta.emoji} ${meta.nom} : ${objet
        ? `${objet.emoji} <strong>${objet.nom}</strong> <span class="rarete rar-${rareteDe(objet)}">${RARETES[rareteDe(objet)].nom}</span> — ${texteBonus(objet.bonus)}`
        : '<span class="joueur-detail">vide</span>'}</div>`;
    }).join('');
  const sets = bonusSetActifs(pp);
  const panoplies = sets.actifs.length
    ? sets.actifs.map((a) => `⚙️ ${a.nom} (${a.pieces} pièces)`).join(' · ')
    : 'aucune panoplie active';
  const competences = (d.competences || [])
    .filter((id) => COMPETENCES[id])
    .map((id) => {
      const comp = COMPETENCES[id];
      return `<div class="ligne-classement">${comp.emoji} <strong>${comp.nom}</strong>${comp.signature ? ' 🏅' : ''}${rangDe(pp, id) ? ` (rang ${rangDe(pp, id)})` : ''}
        <span class="joueur-detail">${detailsCompetence(comp, s, rangDe(pp, id)).join(' · ')}</span></div>`;
    }).join('');

  modale.innerHTML = `
    <button class="btn-choix btn-compact modale-fermer">✖ Fermer</button>
    <h2>${ligne.avatar || '⚔️'} ${echapper(ligne.nom)}${titreActif ? ` <span class="titre-heros">${titreActif.titre}</span>` : ''}</h2>
    <p class="joueur-detail">${emojiIdentite} ${identiteClasse} · ${race.emoji} ${race.nom} · niveau ${ligne.niveau} (${formatNombre(ligne.xp)} XP)
      · ⚡ ${formatNombre(puissanceDe(pp))} de puissance · 💰 ${formatNombre(d.po || 0)} po · ⚔️ ${formatNombre(ligne.degats_boss_total || 0)} dégâts au boss du monde</p>
    <div class="panneau"><h3>Caractéristiques effectives</h3>
      <p>${statsTexte}</p>
      <p class="joueur-detail">❤️ ${maxHpDe(pp)} PV max · 💧 ${maxMpDe(pp)} PM max${s.deter ? ` · ⚖️ ${Math.min(PLAFONDS_SOUS_CARACS.deter, s.deter)} % determination` : ''}${s.celerite ? ` · 💨 ${Math.min(PLAFONDS_SOUS_CARACS.celerite, s.celerite)} % celerite` : ''}</p>
      <p class="joueur-detail">⚙️ ${panoplies}${compagnon ? ` · 🐾 ${compagnon.emoji} ${compagnon.nom}` : ''} · 🏅 ${(d.hautsFaits || []).length}/${HAUTS_FAITS.length} hauts faits</p>
      <p class="joueur-detail">${Object.entries(METIERS).map(([idMetier, metier]) => {
        const m = (d.metiers && d.metiers[idMetier]) || { niveau: 1 };
        return `${metier.emoji} ${metier.nom} niv. ${m.niveau}${d.metierPrincipal === idMetier ? ' ⭐' : ''}`;
      }).join(' · ')}</p></div>
    <div class="panneau"><h3>⚡ Compétences actives</h3>${competences || '<p class="aide">Aucune compétence connue.</p>'}</div>
    <div class="panneau"><h3>🛡️ Équipement porté</h3>${equipements}</div>`;
  modale.querySelector('.modale-fermer').addEventListener('click', fermerFichePublique);
  voile.appendChild(modale);
  document.body.appendChild(voile);
}

// =====================================================================
// Comptoir d'échange : actions
// =====================================================================
async function rafraichirComptoir() {
  const ok = await chargerDonneesTaverne();
  if (ok) rendreSectionsTaverne();
}

async function vendreAuComptoir() {
  const p = persoActif();
  if (!p.cloud && typeof creerPersonnageCloud === 'function') await creerPersonnageCloud(p);
  if (!p.cloud) { afficherToast('Impossible de relier ce héros au monde.'); return; }
  const idObjet = el('comptoir-objet').value;
  const qte = Math.max(1, Math.min(99, parseInt(el('comptoir-qte').value, 10) || 1));
  const prix = Math.max(1, Math.min(1000000, parseInt(el('comptoir-prix').value, 10) || 1));
  const objet = OBJETS[idObjet];
  if (!objet || compterObjet(p, idObjet) < qte) { afficherToast('Vous n’avez pas cette quantité.'); return; }
  const resultat = await apiRequete('/rest/v1/rpc/echange_creer', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_objet: idObjet, p_qte: qte, p_prix: prix },
  }).catch(() => null);
  if (!resultat || resultat.erreur) {
    afficherToast(resultat && resultat.erreur ? `❌ ${resultat.erreur}` : 'Dépôt impossible.');
    return;
  }
  retirerObjet(p, idObjet, qte);
  sauvegarder(p);
  afficherToast(`📤 ${objet.emoji} ${objet.nom} ×${qte} en vente pour ${formatNombre(prix)} po.`);
  rendreTaverne(); // reconstruit le formulaire avec l'inventaire à jour
}

async function acheterEchange(annonce) {
  const p = persoActif();
  if (p.po < annonce.prix) { afficherToast('Pas assez d’or.'); return; }
  if (!p.cloud && typeof creerPersonnageCloud === 'function') await creerPersonnageCloud(p);
  if (!p.cloud) return;
  const resultat = await apiRequete('/rest/v1/rpc/echange_acheter', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_echange: annonce.id },
  }).catch(() => null);
  if (!resultat || resultat.erreur) {
    afficherToast(resultat && resultat.erreur ? `❌ ${resultat.erreur}` : 'Achat impossible.');
    rafraichirComptoir();
    return;
  }
  p.po -= resultat.prix;
  ajouterObjet(p, resultat.objet_id, resultat.qte);
  verifierHautsFaits(p);
  sauvegarder(p);
  const objet = OBJETS[resultat.objet_id];
  afficherToast(`🤝 ${objet ? objet.emoji + ' ' + objet.nom : 'Objet'} ×${resultat.qte} acheté !`);
  rendreTopbar();
  rafraichirComptoir();
}

async function annulerEchange(annonce) {
  const p = persoActif();
  if (!p.cloud) return;
  const resultat = await apiRequete('/rest/v1/rpc/echange_annuler', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token, p_echange: annonce.id },
  }).catch(() => null);
  if (!resultat || resultat.erreur) {
    afficherToast(resultat && resultat.erreur ? `❌ ${resultat.erreur}` : 'Retrait impossible.');
    rafraichirComptoir();
    return;
  }
  ajouterObjet(p, resultat.objet_id, resultat.qte);
  sauvegarder(p);
  afficherToast('↩️ Annonce retirée, les objets reviennent dans votre sac.');
  rendreTaverne();
}

async function reclamerVentes() {
  const p = persoActif();
  if (!p.cloud) return;
  const resultat = await apiRequete('/rest/v1/rpc/echange_reclamer', {
    methode: 'POST',
    corps: { p_id: p.cloud.id, p_token: p.cloud.token },
  }).catch(() => null);
  if (!resultat || !resultat.total) { rafraichirComptoir(); return; }
  p.po += resultat.total;
  p.compteurs.orTotal += resultat.total;
  verifierHautsFaits(p);
  sauvegarder(p);
  afficherToast(`💰 ${resultat.nb} vente${resultat.nb > 1 ? 's' : ''} encaissée${resultat.nb > 1 ? 's' : ''} : +${formatNombre(resultat.total)} po !`);
  rendreTopbar();
  rafraichirComptoir();
}
