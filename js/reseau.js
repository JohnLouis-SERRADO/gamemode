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

async function demarrerReseau() {
  try {
    await apiRequete('/rest/v1/boss_monde?actif=eq.true&select=nom&limit=1');
    etat.enLigne = true;
  } catch (e) {
    etat.enLigne = false;
  }
  majUiReseau();
  if (!etat.enLigne && !minuterieReconnexion) {
    minuterieReconnexion = setInterval(async () => {
      try {
        await apiRequete('/rest/v1/boss_monde?actif=eq.true&select=nom&limit=1');
        etat.enLigne = true;
        clearInterval(minuterieReconnexion);
        minuterieReconnexion = null;
        majUiReseau();
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

async function sauvegarderCloud(p) {
  if (!etat.enLigne) return;
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

async function creerPersonnageCloud(p) {
  if (!etat.enLigne || p.cloud) return;
  try {
    const resultat = await apiRequete('/rest/v1/rpc/creer_personnage', {
      methode: 'POST',
      corps: { p_nom: p.nom, p_avatar: p.avatar, p_donnees: donneesCloud(p) },
    });
    if (resultat && resultat.id) {
      p.cloud = { id: resultat.id, token: resultat.token };
      sauvegarderLocal();
      await apiRequete('/rest/v1/rpc/sauvegarder_personnage', {
        methode: 'POST',
        corps: {
          p_id: p.cloud.id, p_token: p.cloud.token,
          p_niveau: p.niveau, p_xp: p.xp, p_donnees: donneesCloud(p),
        },
      });
    }
  } catch (e) { /* on réessaiera plus tard */ }
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

// =====================================================================
// Taverne : chat, joueurs, boss du monde, classement
// =====================================================================
let minuterieTaverne = null;
let donneesTaverne = { boss: null, contributions: [], messages: [], joueurs: [], classement: [] };

function arreterSondageTaverne() {
  if (minuterieTaverne) {
    clearInterval(minuterieTaverne);
    minuterieTaverne = null;
  }
}

async function chargerDonneesTaverne() {
  if (!etat.enLigne) return false;
  try {
    const [boss, messages, joueurs, classement] = await Promise.all([
      apiRequete('/rest/v1/boss_monde?actif=eq.true&select=*&order=id.desc&limit=1'),
      apiRequete('/rest/v1/messages?select=nom,avatar,texte,cree_le&order=id.desc&limit=40'),
      apiRequete('/rest/v1/personnages?select=nom,avatar,niveau,xp,degats_boss_total,derniere_activite&order=derniere_activite.desc&limit=30'),
      apiRequete('/rest/v1/personnages?select=nom,avatar,niveau,xp&order=niveau.desc,xp.desc&limit=10'),
    ]);
    donneesTaverne.boss = boss && boss[0] ? boss[0] : null;
    donneesTaverne.messages = (messages || []).reverse();
    donneesTaverne.joueurs = joueurs || [];
    donneesTaverne.classement = classement || [];
    if (donneesTaverne.boss) {
      donneesTaverne.contributions = await apiRequete(
        `/rest/v1/contributions_boss?boss_id=eq.${donneesTaverne.boss.id}&select=nom,degats&order=degats.desc&limit=8`) || [];
    }
    return true;
  } catch (e) {
    etat.enLigne = false;
    majUiReseau();
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

  const colonnes = document.createElement('div');
  colonnes.className = 'colonnes-taverne';
  const blocJoueurs = document.createElement('div');
  blocJoueurs.className = 'panneau';
  blocJoueurs.innerHTML = '<h3>🧑‍🤝‍🧑 Aventuriers</h3><div id="taverne-joueurs"></div>';
  const blocClassement = document.createElement('div');
  blocClassement.className = 'panneau';
  blocClassement.innerHTML = '<h3>🏆 Classement</h3><div id="taverne-classement"></div>';
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
      detail.textContent = `niv. ${j.niveau} · ${enLigne ? '🟢 en ligne' : tempsRelatif(j.derniere_activite)}`;
      ligne.appendChild(nom);
      ligne.appendChild(detail);
      zoneJoueurs.appendChild(ligne);
    });
  }

  // --- Classement ---
  const zoneClassement = el('taverne-classement');
  if (zoneClassement) {
    zoneClassement.innerHTML = '';
    donneesTaverne.classement.forEach((j, i) => {
      const ligne = document.createElement('div');
      ligne.className = 'ligne-classement';
      const medaille = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      ligne.textContent = `${medaille} ${j.avatar || '⚔️'} ${j.nom} — niv. ${j.niveau} (${formatNombre(j.xp)} XP)`;
      zoneClassement.appendChild(ligne);
    });
  }
}
