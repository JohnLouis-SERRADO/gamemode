'use strict';

// =====================================================================
// v19 — LES SIX CLASSES ET LEURS VINGT-SEPT SOUS-CLASSES
//
// Le jeu proposait 21 classes, toutes jouables dès le niveau 1. C'était
// beaucoup de choix pour un joueur qui n'a encore rien vu, et peu de
// place pour progresser ensuite. On passe donc à la logique classique
// d'un MMORPG : SIX rôles au départ, une SPÉCIALITÉ au niveau 10.
//
//   🛡️ Gardien      tank                    Vitalité      plaque
//   ⚔️ Guerrier     DPS mêlée physique      Force         plaque
//   🏹 Franc-tireur DPS distance physique   Dextérité     cuir
//   🔮 Arcaniste    DPS distance magique    Intelligence  tissu
//   ✨ Devin        soigneur                Esprit        tissu
//   🌑 Runelame     DPS mêlée magique       Intelligence  maille
//
// Aucune des 21 classes existantes n'est perdue : seize d'entre elles
// deviennent des sous-classes, quatre deviennent des classes de base, et
// l'Aventurier se voit offrir un choix libre. Voir MIGRATION_CLASSES.
// =====================================================================

// =====================================================================
// 1. Les compétences des deux classes de base neuves
// =====================================================================
const COMPETENCES_CLASSES_V19 = {
  // ----- 🛡️ Gardien : il encaisse, il attire, il tient -----
  'gardien-frappe-du-rempart': { classe: 'gardien', niveauRequis: 1, nom: 'Frappe du rempart', emoji: '🛡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 5, ratio: 1.1, coutMp: 4, cooldown: 2, desc: 'Le bouclier d’abord, la lame ensuite. Les dégâts montent avec la Vitalité.' },
  'gardien-appel-au-combat': { classe: 'gardien', niveauRequis: 1, nom: 'Appel au combat', emoji: '📣', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'provocation', duree: 3 }, coutMp: 4, cooldown: 4, desc: 'Tous les regards sur lui — c’est exactement ce qu’il veut.' },
  'gardien-position-ancree': { classe: 'gardien', niveauRequis: 1, nom: 'Position ancrée', emoji: '⚓', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'vit', effet: { type: 'bouclier', duree: 3, stat: 'vit' }, coutMp: 5, cooldown: 4, desc: 'Les deux pieds dans le sol. On ne passe pas.' },
  'gardien-souffle-du-veteran': { classe: 'gardien', niveauRequis: 1, nom: 'Souffle du vétéran', emoji: '🫁', categorie: 'signature', type: 'soin', cible: 'soi', stat: 'vit', puissance: 7, ratio: 1.3, coutMp: 4, cooldown: 4, desc: 'Il a encaissé pire. Il le sait, et son corps aussi.' },
  'gardien-contre-attaque': { classe: 'gardien', niveauRequis: 5, nom: 'Contre-attaque', emoji: '↩️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 7, ratio: 1.2, effet: { type: 'affaibli', duree: 2 }, coutMp: 6, cooldown: 3, desc: 'Encaisser, puis rendre — avec les intérêts. L’ennemi en ressort diminué.' },
  'gardien-mur-de-boucliers': { classe: 'gardien', niveauRequis: 10, nom: 'Mur de boucliers', emoji: '🧱', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'bouclier', duree: 3, stat: 'vit' }, coutMp: 11, cooldown: 5, desc: 'Il se place devant tout le monde à la fois. Techniquement impossible. Il le fait quand même.' },
  'gardien-jugement-du-rempart': { classe: 'gardien', niveauRequis: 15, nom: 'Jugement du rempart', emoji: '⚒️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 7, ratio: 1.05, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 13, cooldown: 5, desc: 'Le bouclier frappe le sol, et le sol répond à tout le monde.' },
  'signature-inebranlable': { classe: 'gardien', signature: true, nom: 'Inébranlable', emoji: '🗿', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'vit', effet: { type: 'bouclier', duree: 4, stat: 'vit' }, coutMp: 10, cooldown: 5, desc: 'La signature du Gardien : tant qu’il est debout, la ligne tient.' },

  // ----- 🌑 Runelame : la magie à bout portant -----
  'runelame-lame-gravee': { classe: 'runelame', niveauRequis: 1, nom: 'Lame gravée', emoji: '🗡️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.2, coutMp: 4, cooldown: 2, desc: 'L’acier porte une rune. La rune fait le reste.' },
  'runelame-decharge-runique': { classe: 'runelame', niveauRequis: 1, nom: 'Décharge runique', emoji: '💠', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 4, ratio: 0.9, coutMp: 3, cooldown: 0, desc: 'Une rune qui se vide dans la garde de l’arme — à volonté.' },
  'runelame-morsure-d-ether': { classe: 'runelame', niveauRequis: 1, nom: 'Morsure d’éther', emoji: '🫧', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.1, effet: { type: 'drain', part: 0.35 }, coutMp: 6, cooldown: 3, desc: 'La lame boit un peu de ce qu’elle prend, et le rend à son porteur.' },
  'runelame-armure-de-runes': { classe: 'runelame', niveauRequis: 1, nom: 'Armure de runes', emoji: '🔷', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'int', effet: { type: 'bouclier', duree: 3 }, coutMp: 5, cooldown: 4, desc: 'Les runes gravées dans la maille se referment sur les coups.' },
  'runelame-fente-arcanique': { classe: 'runelame', niveauRequis: 5, nom: 'Fente arcanique', emoji: '⚡', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 9, ratio: 1.4, critBonus: 0.15, coutMp: 7, cooldown: 3, desc: 'Un pas en avant, et la distance cesse d’exister.' },
  'runelame-cercle-de-lames': { classe: 'runelame', niveauRequis: 10, nom: 'Cercle de lames', emoji: '🌀', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 6, ratio: 1.0, coutMp: 10, cooldown: 4, desc: 'Il tourne sur lui-même, et les runes tracent le cercle avec lui.' },
  'runelame-verdict-runique': { classe: 'runelame', niveauRequis: 15, nom: 'Verdict runique', emoji: '💥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 14, ratio: 1.8, coutMp: 12, cooldown: 5, desc: 'Toutes les runes de la lame se déchargent au même endroit, en même temps.' },
  'signature-lame-des-arcanes': { classe: 'runelame', signature: true, nom: 'Lame des arcanes', emoji: '🌑', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 13, ratio: 1.75, effet: { type: 'drain', part: 0.3 }, coutMp: 11, cooldown: 5, desc: 'La signature de la Runelame : la magie ne se lance plus, elle se plante.' },
};

// =====================================================================
// 2. Les compétences des douze sous-classes neuves
//
// Les quinze autres sous-classes reprennent intégralement les jeux de
// compétences des classes qu'elles remplacent : rien à réécrire, rien à
// perdre. Ces douze-là sont à créer de toutes pièces.
// =====================================================================
const COMPETENCES_SOUS_CLASSES = {
  // ----- 🛡️ Gardien / Chevalier Noir : encaisser en volant de la vie -----
  'chevalier-noir-lame-avide': { sousClasse: 'chevalier-noir', niveauRequis: 10, nom: 'Lame avide', emoji: '🖤', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 7, ratio: 1.2, effet: { type: 'drain', part: 0.4 }, coutMp: 6, cooldown: 2, desc: 'Elle prend, et elle donne à qui la tient. Jamais l’inverse.' },
  'chevalier-noir-voile-noir': { sousClasse: 'chevalier-noir', niveauRequis: 12, nom: 'Voile noir', emoji: '🌫️', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'vit', effet: { type: 'bouclier', duree: 3, stat: 'vit' }, coutMp: 6, cooldown: 4, desc: 'L’ombre s’épaissit autour de lui jusqu’à devenir une armure.' },
  'chevalier-noir-serment-de-sang': { sousClasse: 'chevalier-noir', niveauRequis: 14, nom: 'Serment de sang', emoji: '🩸', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'pacte', partPv: 0.12, mana: 16 }, coutMp: 0, cooldown: 3, desc: 'Il paie en sang ce que les autres paient en mana. C’est un choix.' },
  'chevalier-noir-emprise': { sousClasse: 'chevalier-noir', niveauRequis: 18, nom: 'Emprise', emoji: '🕸️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 5, ratio: 0.9, effet: { type: 'affaibli', duree: 2 }, coutMp: 11, cooldown: 4, desc: 'Tous les ennemis se sentent soudain observés. Ils frappent moins bien.' },
  'chevalier-noir-fossoyeur': { sousClasse: 'chevalier-noir', niveauRequis: 24, nom: 'Fossoyeur', emoji: '⚰️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 12, ratio: 1.6, effet: { type: 'drain', part: 0.5 }, coutMp: 10, cooldown: 4, desc: 'Il creuse, et il remplit. Souvent dans cet ordre.' },
  'chevalier-noir-nuit-tombante': { sousClasse: 'chevalier-noir', niveauRequis: 30, nom: 'Nuit tombante', emoji: '🌑', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 8, ratio: 1.1, effet: { type: 'drain', part: 0.3 }, coutMp: 14, cooldown: 5, desc: 'La nuit tombe d’un coup, sur tout le champ de bataille, et elle a faim.' },
  'chevalier-noir-pacte-final': { sousClasse: 'chevalier-noir', niveauRequis: 40, nom: 'Pacte final', emoji: '☠️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 18, ratio: 2.1, effet: { type: 'drain', part: 0.6 }, coutMp: 14, cooldown: 6, desc: 'Le contrat arrive à échéance. Ce n’est pas lui qui paie.' },
  'signature-couronne-noire': { sousClasse: 'chevalier-noir', signature: true, nom: 'Couronne noire', emoji: '👑', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 10, ratio: 1.3, effet: { type: 'drain', part: 0.4 }, coutMp: 13, cooldown: 6, desc: 'La signature du Chevalier Noir : il règne sur ce qu’il vide.' },

  // ----- 🛡️ Gardien / Colosse : la masse comme argument -----
  'colosse-choc-sismique': { sousClasse: 'colosse', niveauRequis: 10, nom: 'Choc sismique', emoji: '💢', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 5, ratio: 0.95, coutMp: 8, cooldown: 3, desc: 'Il ne frappe pas l’ennemi, il frappe le sol sous l’ennemi.' },
  'colosse-peau-de-pierre': { sousClasse: 'colosse', niveauRequis: 12, nom: 'Peau de pierre', emoji: '🪨', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'vit', effet: { type: 'bouclier', duree: 4, stat: 'vit' }, coutMp: 6, cooldown: 4, desc: 'La chair durcit. Les coups s’ébrèchent dessus.' },
  'colosse-empoignade': { sousClasse: 'colosse', niveauRequis: 14, nom: 'Empoignade', emoji: '✊', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 6, ratio: 1.0, effet: { type: 'etourdi', duree: 1, chance: 0.6 }, coutMp: 7, cooldown: 4, desc: 'Il attrape, il serre, et la discussion s’arrête là.' },
  'colosse-cri-de-la-montagne': { sousClasse: 'colosse', niveauRequis: 18, nom: 'Cri de la montagne', emoji: '🏔️', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'benediction', duree: 3 }, coutMp: 10, cooldown: 5, desc: 'Un cri qui part du ventre et qui redresse toute l’équipe.' },
  'colosse-masse-tellurique': { sousClasse: 'colosse', niveauRequis: 24, nom: 'Masse tellurique', emoji: '🔨', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'vit', puissance: 13, ratio: 1.7, coutMp: 10, cooldown: 4, desc: 'Le poids de la montagne, concentré sur une seule tête.' },
  'colosse-inarretable': { sousClasse: 'colosse', niveauRequis: 30, nom: 'Inarrêtable', emoji: '🐘', categorie: 'signature', type: 'soin', cible: 'soi', stat: 'vit', puissance: 16, ratio: 2.0, coutMp: 9, cooldown: 5, desc: 'Il se relève. C’est tout ce qu’il sait faire, et il le fait très bien.' },
  'colosse-effondrement': { sousClasse: 'colosse', niveauRequis: 40, nom: 'Effondrement', emoji: '🌋', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 10, ratio: 1.35, effet: { type: 'etourdi', duree: 1, chance: 0.45 }, coutMp: 15, cooldown: 6, desc: 'Tout le terrain se soulève, puis retombe. Surtout sur les autres.' },
  'signature-titan-de-pierre': { sousClasse: 'colosse', signature: true, nom: 'Titan de pierre', emoji: '🗿', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'vit', puissance: 11, ratio: 1.45, coutMp: 14, cooldown: 6, desc: 'La signature du Colosse : pendant un instant, il EST la montagne.' },

  // ----- ⚔️ Guerrier / Duelliste : une cible, une lame, un rythme -----
  'duelliste-riposte': { sousClasse: 'duelliste', niveauRequis: 10, nom: 'Riposte', emoji: '🤺', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 7, ratio: 1.25, critBonus: 0.15, coutMp: 5, cooldown: 2, desc: 'Il attend le coup, puis répond dans le même souffle.' },
  'duelliste-estoc': { sousClasse: 'duelliste', niveauRequis: 12, nom: 'Estoc', emoji: '📍', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 9, ratio: 1.45, critBonus: 0.2, coutMp: 6, cooldown: 3, desc: 'Droit devant, sans fioriture. La pointe trouve toujours l’interstice.' },
  'duelliste-feinte': { sousClasse: 'duelliste', niveauRequis: 14, nom: 'Feinte', emoji: '🎭', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 5, ratio: 0.9, effet: { type: 'affaibli', duree: 2 }, coutMp: 5, cooldown: 3, desc: 'Le coup part à gauche. Il arrive à droite. L’ennemi n’a plus confiance.' },
  'duelliste-point-faible': { sousClasse: 'duelliste', niveauRequis: 18, nom: 'Point faible', emoji: '🎯', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 8, ratio: 1.3, critBonus: 0.3, coutMp: 7, cooldown: 3, desc: 'Toute armure a un défaut. Il lui a fallu trois échanges pour le trouver.' },
  'duelliste-croisement': { sousClasse: 'duelliste', niveauRequis: 24, nom: 'Croisement de lames', emoji: '⚔️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 6, ratio: 1.0, coups: 3, coutMp: 9, cooldown: 4, desc: 'Trois passes en un battement. Un vrai duelliste compte les temps.' },
  'duelliste-botte-de-valciel': { sousClasse: 'duelliste', niveauRequis: 30, nom: 'Botte de Valciel', emoji: '🏅', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 15, ratio: 1.9, critBonus: 0.2, coutMp: 11, cooldown: 5, desc: 'La botte secrète des salles d’armes du bourg. On ne l’enseigne plus.' },
  'duelliste-duel-a-mort': { sousClasse: 'duelliste', niveauRequis: 40, nom: 'Duel à mort', emoji: '💀', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 20, ratio: 2.3, critBonus: 0.25, coutMp: 13, cooldown: 6, desc: 'Plus de garde, plus de recul. L’un des deux ne repart pas.' },
  'signature-salut-de-l-epee': { sousClasse: 'duelliste', signature: true, nom: 'Salut de l’épée', emoji: '🤺', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'for', puissance: 14, ratio: 1.85, critBonus: 0.25, coutMp: 10, cooldown: 5, desc: 'La signature du Duelliste : il salue avant. C’est la dernière politesse.' },

  // ----- 🏹 Franc-tireur / Traqueur : marquer, puis exécuter -----
  'traqueur-marque-du-chasseur': { sousClasse: 'traqueur', niveauRequis: 10, nom: 'Marque du chasseur', emoji: '🔖', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 5, ratio: 1.0, effet: { type: 'affaibli', duree: 3 }, coutMp: 5, cooldown: 3, desc: 'Une entaille précise, à un endroit précis. Désormais, elle boite.' },
  'traqueur-tir-de-rupture': { sousClasse: 'traqueur', niveauRequis: 12, nom: 'Tir de rupture', emoji: '💢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 8, ratio: 1.35, coutMp: 6, cooldown: 3, desc: 'La flèche ne cherche pas la chair : elle cherche la sangle qui tient l’armure.' },
  'traqueur-oeil-du-predateur': { sousClasse: 'traqueur', niveauRequis: 14, nom: 'Œil du prédateur', emoji: '👁️', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 3 }, coutMp: 6, cooldown: 5, desc: 'Le monde se réduit à une proie et à la distance qui l’en sépare.' },
  'traqueur-fleche-perce-armure': { sousClasse: 'traqueur', niveauRequis: 18, nom: 'Flèche perce-armure', emoji: '🏹', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 10, ratio: 1.5, critBonus: 0.2, coutMp: 8, cooldown: 4, desc: 'Une pointe en acier céleste, taillée pour ce qui se croit protégé.' },
  'traqueur-volee-marquee': { sousClasse: 'traqueur', niveauRequis: 24, nom: 'Volée marquée', emoji: '🎯', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 7, ratio: 1.1, effet: { type: 'affaibli', duree: 2 }, coutMp: 11, cooldown: 4, desc: 'Une flèche pour chacun, et un souvenir durable pour tous.' },
  'traqueur-piste-de-sang': { sousClasse: 'traqueur', niveauRequis: 30, nom: 'Piste de sang', emoji: '🩸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 9, ratio: 1.4, effet: { type: 'poison', duree: 3, stat: 'dex' }, coutMp: 9, cooldown: 4, desc: 'Il ne tue pas tout de suite. Il ouvre une piste, et il la suit.' },
  'traqueur-sentence': { sousClasse: 'traqueur', niveauRequis: 40, nom: 'Sentence', emoji: '⚖️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 19, ratio: 2.2, critBonus: 0.2, coutMp: 13, cooldown: 6, desc: 'La traque est finie. Le reste n’est qu’une formalité administrative.' },
  'signature-tir-du-crepuscule': { sousClasse: 'traqueur', signature: true, nom: 'Tir du crépuscule', emoji: '🌆', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 15, ratio: 1.95, critBonus: 0.3, coutMp: 11, cooldown: 5, desc: 'La signature du Traqueur : un seul tir, à l’heure où la lumière ment.' },

  // ----- 🏹 Franc-tireur / Voltigeur : multiplier les traits -----
  'voltigeur-tir-saute': { sousClasse: 'voltigeur', niveauRequis: 10, nom: 'Tir sauté', emoji: '🤸', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 5, ratio: 0.95, coups: 2, coutMp: 6, cooldown: 2, desc: 'Il tire en l’air, avant de retomber. Deux flèches pendant la chute.' },
  'voltigeur-saut-de-cote': { sousClasse: 'voltigeur', niveauRequis: 12, nom: 'Saut de côté', emoji: '💨', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'dex', effet: { type: 'bouclier', duree: 2, stat: 'dex' }, coutMp: 5, cooldown: 3, desc: 'Il n’est plus là où le coup arrive. C’est toute sa méthode.' },
  'voltigeur-volee-en-cloche': { sousClasse: 'voltigeur', niveauRequis: 14, nom: 'Volée en cloche', emoji: '🌧️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 5, ratio: 0.9, coutMp: 9, cooldown: 3, desc: 'Les flèches montent, disparaissent, et redescendent sur tout le monde.' },
  'voltigeur-corde-tendue': { sousClasse: 'voltigeur', niveauRequis: 18, nom: 'Corde tendue', emoji: '🪢', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 3 }, coutMp: 6, cooldown: 5, desc: 'Il tend la corde à l’extrême et la garde ainsi. Ses bras protestent.' },
  'voltigeur-grele-de-traits': { sousClasse: 'voltigeur', niveauRequis: 24, nom: 'Grêle de traits', emoji: '❄️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 6, ratio: 1.05, coups: 2, coutMp: 12, cooldown: 4, desc: 'Deux volées coup sur coup. Le carquois n’aime pas, le champ non plus.' },
  'voltigeur-tir-de-siege': { sousClasse: 'voltigeur', niveauRequis: 30, nom: 'Tir de siège', emoji: '🏰', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'dex', puissance: 16, ratio: 1.95, coutMp: 11, cooldown: 5, desc: 'Une flèche prévue pour une porte. L’ennemi n’est pas une porte.' },
  'voltigeur-tempete-de-traits': { sousClasse: 'voltigeur', niveauRequis: 40, nom: 'Tempête de traits', emoji: '🌪️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 9, ratio: 1.25, coups: 2, coutMp: 15, cooldown: 6, desc: 'Le ciel disparaît. Il réapparaît plus tard, et il y a moins de monde.' },
  'signature-danse-de-l-arc': { sousClasse: 'voltigeur', signature: true, nom: 'Danse de l’arc', emoji: '🪶', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'dex', puissance: 8, ratio: 1.15, coups: 2, coutMp: 13, cooldown: 6, desc: 'La signature du Voltigeur : il ne pose jamais deux fois le pied au même endroit.' },

  // ----- ✨ Devin / Oracle : boucliers et prescience -----
  'oracle-verbe-de-vie': { sousClasse: 'oracle', niveauRequis: 10, nom: 'Verbe de vie', emoji: '🕊️', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'esp', puissance: 10, ratio: 1.5, coutMp: 5, cooldown: 2, desc: 'Un mot dit à l’avance, qui referme une plaie pas encore ouverte.' },
  'oracle-bouclier-d-aube': { sousClasse: 'oracle', niveauRequis: 12, nom: 'Bouclier d’aube', emoji: '🌅', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'esp', effet: { type: 'bouclier', duree: 4, stat: 'esp' }, coutMp: 6, cooldown: 3, desc: 'La lumière du matin, prise d’avance et posée sur un allié.' },
  'oracle-halo': { sousClasse: 'oracle', niveauRequis: 14, nom: 'Halo', emoji: '💫', categorie: 'signature', type: 'utilitaire', cible: 'allies', stat: 'esp', effet: { type: 'bouclier', duree: 3, stat: 'esp' }, coutMp: 11, cooldown: 5, desc: 'Un cercle de clarté qui suit l’équipe partout où elle va.' },
  'oracle-prophetie': { sousClasse: 'oracle', niveauRequis: 18, nom: 'Prophétie', emoji: '🔮', categorie: 'signature', type: 'utilitaire', cible: 'allies', effet: { type: 'benediction', duree: 3 }, coutMp: 10, cooldown: 5, desc: 'Elle annonce la victoire. L’équipe se met à y croire, et ça change tout.' },
  'oracle-mot-d-espoir': { sousClasse: 'oracle', niveauRequis: 24, nom: 'Mot d’espoir', emoji: '💞', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'esp', puissance: 9, ratio: 1.25, coutMp: 12, cooldown: 4, desc: 'Elle dit le mot juste, et toute l’équipe respire mieux.' },
  'oracle-purge-sacree': { sousClasse: 'oracle', niveauRequis: 30, nom: 'Purge sacrée', emoji: '✨', categorie: 'signature', type: 'soin', cible: 'allie', stat: 'esp', puissance: 20, ratio: 2.3, coutMp: 11, cooldown: 5, desc: 'Ce qui rongeait l’allié n’a plus d’endroit où se tenir.' },
  'oracle-dernier-jour': { sousClasse: 'oracle', niveauRequis: 40, nom: 'Dernier Jour', emoji: '🌇', categorie: 'signature', type: 'soin', cible: 'allies', stat: 'esp', puissance: 18, ratio: 2.0, coutMp: 16, cooldown: 6, desc: 'Elle a vu la fin. Ce n’est pas aujourd’hui — et elle le prouve.' },
  'signature-vision': { sousClasse: 'oracle', signature: true, nom: 'Vision', emoji: '👁️‍🗨️', categorie: 'signature', type: 'utilitaire', cible: 'allies', stat: 'esp', effet: { type: 'bouclier', duree: 4, stat: 'esp' }, coutMp: 13, cooldown: 6, desc: 'La signature de l’Oracle : elle sait où le coup va tomber, et met la main devant.' },

  // ----- 🌑 Runelame / Faucheur : drainer et exécuter -----
  'faucheur-faux-d-ames': { sousClasse: 'faucheur', niveauRequis: 10, nom: 'Faux d’âmes', emoji: '⚰️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.35, effet: { type: 'drain', part: 0.35 }, coutMp: 6, cooldown: 2, desc: 'La lame prend la vie et la garde un instant, le temps de la transmettre.' },
  'faucheur-marque-du-faucheur': { sousClasse: 'faucheur', niveauRequis: 12, nom: 'Marque du faucheur', emoji: '🔖', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 5, ratio: 0.95, effet: { type: 'affaibli', duree: 3 }, coutMp: 6, cooldown: 3, desc: 'Un signe tracé dans l’air au-dessus de la cible. Elle ne le voit pas.' },
  'faucheur-sillage': { sousClasse: 'faucheur', niveauRequis: 14, nom: 'Sillage', emoji: '🌫️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 5, ratio: 0.9, effet: { type: 'drain', part: 0.25 }, coutMp: 10, cooldown: 4, desc: 'Là où il est passé, l’air est plus froid et les blessures plus lentes.' },
  'faucheur-drain-d-ame': { sousClasse: 'faucheur', niveauRequis: 18, nom: 'Drain d’âme', emoji: '🫀', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 10, ratio: 1.5, effet: { type: 'drain', part: 0.55 }, coutMp: 8, cooldown: 3, desc: 'Il ne prend pas le sang. Il prend ce qu’il y avait dedans.' },
  'faucheur-moisson': { sousClasse: 'faucheur', niveauRequis: 24, nom: 'Moisson', emoji: '🌾', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'drain', part: 0.35 }, coutMp: 13, cooldown: 5, desc: 'Un seul geste, ample et calme, comme à la ferme. Le résultat diffère.' },
  'faucheur-souffle-du-neant': { sousClasse: 'faucheur', niveauRequis: 30, nom: 'Souffle du néant', emoji: '🕳️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 16, ratio: 1.95, coutMp: 11, cooldown: 5, desc: 'Il ouvre la bouche et c’est le vide qui parle à sa place.' },
  'faucheur-sentence-finale': { sousClasse: 'faucheur', niveauRequis: 40, nom: 'Sentence finale', emoji: '☠️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 21, ratio: 2.35, effet: { type: 'drain', part: 0.5 }, coutMp: 14, cooldown: 6, desc: 'Aucun appel n’est prévu. Aucun n’a jamais été déposé.' },
  'signature-ultime-recolte': { sousClasse: 'faucheur', signature: true, nom: 'Ultime récolte', emoji: '🌑', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 11, ratio: 1.45, effet: { type: 'drain', part: 0.45 }, coutMp: 14, cooldown: 6, desc: 'La signature du Faucheur : il ramasse tout ce qui reste debout.' },

  // ----- 🌑 Runelame / Corrupteur : les statuts comme arme -----
  'corrupteur-peste-vive': { sousClasse: 'corrupteur', niveauRequis: 10, nom: 'Peste vive', emoji: '🦠', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 6, ratio: 1.05, effet: { type: 'poison', duree: 3, stat: 'int' }, coutMp: 5, cooldown: 2, desc: 'Elle entre par la plaie et s’installe. Elle ne paie pas de loyer.' },
  'corrupteur-miasme': { sousClasse: 'corrupteur', niveauRequis: 12, nom: 'Miasme', emoji: '🟢', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 4, ratio: 0.8, effet: { type: 'poison', duree: 2, stat: 'int' }, coutMp: 9, cooldown: 3, desc: 'L’air devient épais et vaguement sucré. Mauvais signe.' },
  'corrupteur-decomposition': { sousClasse: 'corrupteur', niveauRequis: 14, nom: 'Décomposition', emoji: '🍂', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.3, effet: { type: 'affaibli', duree: 3 }, coutMp: 7, cooldown: 3, desc: 'Ce qui tenait la cible ensemble se met à hésiter.' },
  'corrupteur-terreur-rampante': { sousClasse: 'corrupteur', niveauRequis: 18, nom: 'Terreur rampante', emoji: '😱', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 4, ratio: 0.75, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 11, cooldown: 4, desc: 'Une peur qui ne vient de nulle part, et qui vient donc de partout.' },
  'corrupteur-epidemie': { sousClasse: 'corrupteur', niveauRequis: 24, nom: 'Épidémie', emoji: '☣️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 7, ratio: 1.15, effet: { type: 'poison', duree: 3, stat: 'int' }, coutMp: 13, cooldown: 5, desc: 'Ce qui touchait un ennemi les touche désormais tous. Par contact.' },
  'corrupteur-chair-morte': { sousClasse: 'corrupteur', niveauRequis: 30, nom: 'Chair morte', emoji: '🧟', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 15, ratio: 1.85, effet: { type: 'affaibli', duree: 3 }, coutMp: 11, cooldown: 5, desc: 'Le corps cesse d’obéir avant d’avoir cessé de vivre.' },
  'corrupteur-fin-de-toute-chair': { sousClasse: 'corrupteur', niveauRequis: 40, nom: 'Fin de toute chair', emoji: '💀', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.35, effet: { type: 'poison', duree: 3, stat: 'int' }, coutMp: 16, cooldown: 6, desc: 'Il ne reste rien à corrompre. Il corrompt quand même.' },
  'signature-contagion': { sousClasse: 'corrupteur', signature: true, nom: 'Contagion', emoji: '🦠', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.3, effet: { type: 'poison', duree: 3, stat: 'int' }, coutMp: 14, cooldown: 6, desc: 'La signature du Corrupteur : ce qu’il pose se transmet tout seul.' },

  // ----- 🌑 Runelame / Métamorphe : trois bêtes en un -----
  'metamorphe-griffes-de-l-ours': { sousClasse: 'metamorphe', niveauRequis: 10, nom: 'Griffes de l’ours', emoji: '🐻', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.3, coutMp: 5, cooldown: 2, desc: 'Ses mains s’élargissent, s’assombrissent, et cessent d’être des mains.' },
  'metamorphe-peau-d-ecorce': { sousClasse: 'metamorphe', niveauRequis: 12, nom: 'Peau d’écorce', emoji: '🌳', categorie: 'signature', type: 'utilitaire', cible: 'soi', stat: 'int', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'L’écorce pousse plus vite que les plaies. C’est le principe.' },
  'metamorphe-vol-du-corbeau': { sousClasse: 'metamorphe', niveauRequis: 14, nom: 'Vol du corbeau', emoji: '🐦‍⬛', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 5, ratio: 0.9, coutMp: 9, cooldown: 3, desc: 'Il se disperse en une nuée noire, et chaque plume a un avis.' },
  'metamorphe-morsure-du-serpent': { sousClasse: 'metamorphe', niveauRequis: 18, nom: 'Morsure du serpent', emoji: '🐍', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.15, effet: { type: 'poison', duree: 3, stat: 'int' }, coutMp: 7, cooldown: 3, desc: 'Deux crochets, un venin, et beaucoup de patience.' },
  'metamorphe-rugissement': { sousClasse: 'metamorphe', niveauRequis: 24, nom: 'Rugissement', emoji: '🦁', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 6, ratio: 1.0, effet: { type: 'affaibli', duree: 2 }, coutMp: 11, cooldown: 4, desc: 'Un son que le corps humain ne devrait pas pouvoir produire.' },
  'metamorphe-mue': { sousClasse: 'metamorphe', niveauRequis: 30, nom: 'Mue', emoji: '🦎', categorie: 'signature', type: 'soin', cible: 'soi', stat: 'int', puissance: 17, ratio: 2.1, coutMp: 10, cooldown: 5, desc: 'Il abandonne le corps blessé et en reprend un neuf, en dessous.' },
  'metamorphe-forme-primordiale': { sousClasse: 'metamorphe', niveauRequis: 40, nom: 'Forme primordiale', emoji: '🐲', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 20, ratio: 2.25, coutMp: 13, cooldown: 6, desc: 'La bête d’avant les bêtes, celle dont les autres sont des brouillons.' },
  'signature-bete-premiere': { sousClasse: 'metamorphe', signature: true, nom: 'Bête première', emoji: '🐾', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 10, ratio: 1.4, effet: { type: 'poison', duree: 2, stat: 'int' }, coutMp: 13, cooldown: 6, desc: 'La signature du Métamorphe : les trois formes à la fois, une seconde durant.' },

  // ----- 🌑 Runelame / Runemaître : la rune comme discipline -----
  'runemaitre-rune-de-feu': { sousClasse: 'runemaitre', niveauRequis: 10, nom: 'Rune de feu', emoji: '🔥', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 8, ratio: 1.3, coutMp: 5, cooldown: 2, desc: 'Gravée d’un trait, elle brûle jusqu’à ce qu’il n’y ait plus de trait.' },
  'runemaitre-rune-de-givre': { sousClasse: 'runemaitre', niveauRequis: 12, nom: 'Rune de givre', emoji: '❄️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.15, effet: { type: 'etourdi', duree: 1, chance: 0.4 }, coutMp: 7, cooldown: 4, desc: 'Le froid ne blesse pas : il immobilise, ce qui est souvent pire.' },
  'runemaitre-rune-de-garde': { sousClasse: 'runemaitre', niveauRequis: 14, nom: 'Rune de garde', emoji: '🔷', categorie: 'signature', type: 'utilitaire', cible: 'allie', stat: 'int', effet: { type: 'bouclier', duree: 3 }, coutMp: 6, cooldown: 4, desc: 'Une rune posée sur l’épaule d’un allié, qui refuse les coups à sa place.' },
  'runemaitre-chaine-runique': { sousClasse: 'runemaitre', niveauRequis: 18, nom: 'Chaîne runique', emoji: '⛓️', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 6, ratio: 1.05, coutMp: 10, cooldown: 3, desc: 'Les runes s’appellent entre elles et se relient d’un ennemi à l’autre.' },
  'runemaitre-glyphe-explosif': { sousClasse: 'runemaitre', niveauRequis: 24, nom: 'Glyphe explosif', emoji: '💥', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.2, coutMp: 12, cooldown: 4, desc: 'Posé au sol, discret, patient. Puis nettement moins discret.' },
  'runemaitre-alphabet-interdit': { sousClasse: 'runemaitre', niveauRequis: 30, nom: 'Alphabet interdit', emoji: '📜', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 16, ratio: 1.95, coutMp: 11, cooldown: 5, desc: 'Sept signes que les scribes du bourg ont juré de ne jamais recopier.' },
  'runemaitre-grand-oeuvre': { sousClasse: 'runemaitre', niveauRequis: 40, nom: 'Grand Œuvre', emoji: '🌌', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 11, ratio: 1.45, coutMp: 16, cooldown: 6, desc: 'Toutes les runes qu’il connaît, écrites en même temps, dans le bon ordre.' },
  'signature-sceau-du-runemaitre': { sousClasse: 'runemaitre', signature: true, nom: 'Sceau du Runemaître', emoji: '💠', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 15, ratio: 1.9, coutMp: 12, cooldown: 5, desc: 'La signature du Runemaître : un sceau unique, qu’il est seul à savoir fermer.' },

  // ----- 🌑 Runelame / Vibrelame : la vitesse et l'écho -----
  'vibrelame-lame-vibrante': { sousClasse: 'vibrelame', niveauRequis: 10, nom: 'Lame vibrante', emoji: '〰️', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 4, ratio: 0.85, coups: 2, coutMp: 5, cooldown: 2, desc: 'L’arme tremble à une fréquence que l’armure n’aime pas du tout.' },
  'vibrelame-pas-de-l-echo': { sousClasse: 'vibrelame', niveauRequis: 12, nom: 'Pas de l’écho', emoji: '👣', categorie: 'signature', type: 'utilitaire', cible: 'soi', effet: { type: 'benediction', duree: 3 }, coutMp: 6, cooldown: 5, desc: 'Il fait un pas, et le pas résonne trois fois. Un seul est vrai.' },
  'vibrelame-onde-tranchante': { sousClasse: 'vibrelame', niveauRequis: 14, nom: 'Onde tranchante', emoji: '🌊', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 5, ratio: 0.95, coutMp: 9, cooldown: 3, desc: 'La lame ne touche personne. L’onde qu’elle laisse, si.' },
  'vibrelame-resonance': { sousClasse: 'vibrelame', niveauRequis: 18, nom: 'Résonance', emoji: '🔔', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 5, ratio: 1.0, coups: 3, coutMp: 9, cooldown: 4, desc: 'Chaque coup fait sonner le précédent. Le troisième sonne pour tous.' },
  'vibrelame-fracture': { sousClasse: 'vibrelame', niveauRequis: 24, nom: 'Fracture', emoji: '💢', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 12, ratio: 1.65, critBonus: 0.2, coutMp: 9, cooldown: 4, desc: 'Trouver la fréquence propre d’une armure, puis la lui faire atteindre.' },
  'vibrelame-silence-blanc': { sousClasse: 'vibrelame', niveauRequis: 30, nom: 'Silence blanc', emoji: '🤍', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 8, ratio: 1.2, effet: { type: 'etourdi', duree: 1, chance: 0.35 }, coutMp: 13, cooldown: 5, desc: 'Un instant où plus rien ne vibre. Les ennemis y perdent le fil.' },
  'vibrelame-mille-echos': { sousClasse: 'vibrelame', niveauRequis: 40, nom: 'Mille échos', emoji: '🎼', categorie: 'signature', type: 'degats', cible: 'ennemi', stat: 'int', puissance: 7, ratio: 1.15, coups: 4, coutMp: 14, cooldown: 6, desc: 'Quatre frappes, et autant d’échos qu’on ne compte plus.' },
  'signature-note-finale': { sousClasse: 'vibrelame', signature: true, nom: 'Note finale', emoji: '🎵', categorie: 'signature', type: 'degats', cible: 'ennemis', stat: 'int', puissance: 9, ratio: 1.35, coutMp: 13, cooldown: 6, desc: 'La signature de la Vibrelame : elle fait sonner tout le champ à la fois.' },
};

Object.assign(COMPETENCES, COMPETENCES_CLASSES_V19, COMPETENCES_SOUS_CLASSES);

// =====================================================================
// 3. Les six classes de base
//
// `stat` est l'attribut qui porte la classe : toutes ses compétences
// offensives et de soin y sont recalées, pour qu'un joueur n'ait jamais à
// répartir ses points entre deux attributs pour jouer une seule classe.
// =====================================================================
const CLASSES_BASE = {
  gardien: {
    nom: 'Gardien', emoji: '🛡️', role: 'Tank', stat: 'vit', armure: 'plaque',
    armes: ['lame lourde', 'bouclier-pavois', 'masse'],
    resume: 'Il se met devant. C’est tout son métier, et c’est un métier entier.',
    passif: 'Rempart — les dégâts subis baissent avec la Ténacité, et attirer les coups est une arme.',
    competences: ['gardien-frappe-du-rempart', 'gardien-appel-au-combat', 'gardien-position-ancree',
      'gardien-souffle-du-veteran', 'gardien-contre-attaque', 'gardien-mur-de-boucliers',
      'gardien-jugement-du-rempart', 'signature-inebranlable'],
  },
  guerrier: {
    nom: 'Guerrier', emoji: '⚔️', role: 'DPS mêlée physique', stat: 'for', armure: 'plaque',
    armes: ['épée', 'hache', 'poing d’acier'],
    resume: 'Au contact, sans détour : ce qu’il touche cesse rapidement de bouger.',
    passif: 'Élan — chaque coup porté nourrit le suivant.',
    competences: ['guerrier-taillade', 'guerrier-coup-de-bouclier', 'guerrier-cri-de-ralliement',
      'guerrier-endurance', 'guerrier-garde-de-fer', 'guerrier-brise-garde',
      'guerrier-assaut-final', 'signature-lame-du-champion'],
  },
  'franc-tireur': {
    nom: 'Franc-tireur', emoji: '🏹', role: 'DPS distance physique', stat: 'dex', armure: 'cuir',
    armes: ['arc', 'arbalète', 'dagues de lancer'],
    resume: 'La bonne distance, la bonne seconde. Il n’a jamais eu besoin d’autre chose.',
    passif: 'Ligne de tir — aucun malus depuis la ligne arrière, et l’initiative lui revient souvent.',
    competences: ['archer-fleche-perforante', 'archer-tir-double', 'archer-fleche-trempee',
      'archer-oeil-de-lynx', 'archer-fleche-entravante', 'archer-double-tir',
      'archer-deluge', 'signature-fleche-du-destin'],
  },
  arcaniste: {
    nom: 'Arcaniste', emoji: '🔮', role: 'DPS distance magique', stat: 'int', armure: 'tissu',
    armes: ['bâton', 'grimoire', 'focus'],
    resume: 'Fragile de près, catastrophique de loin.',
    passif: 'Flux — la magie ignore les lignes de combat, et le mana revient plus vite.',
    competences: ['mage-trait-arcanique', 'mage-explosion-runique', 'mage-barriere',
      'mage-siphon-de-mana', 'mage-flux-arcanique', 'mage-orbe-fracassant',
      'mage-tempete-de-mana', 'signature-comete-arcanique'],
  },
  devin: {
    nom: 'Devin', emoji: '✨', role: 'Soigneur', stat: 'esp', armure: 'tissu',
    armes: ['canne', 'calice', 'sceptre'],
    resume: 'Il décide qui survit. Personne ne s’en rend compte avant que ça manque.',
    passif: 'Clairvoyance — les soins et les boucliers montent avec l’Esprit, et le surplus ne se perd pas.',
    competences: ['clerc-mot-de-soin', 'clerc-eclat-sacre', 'clerc-priere-protection',
      'clerc-souffle-vital', 'clerc-priere-fervente', 'clerc-chatiment-lumineux',
      'clerc-sanctuaire', 'signature-lumiere-salvatrice'],
  },
  runelame: {
    nom: 'Runelame', emoji: '🌑', role: 'DPS mêlée magique', stat: 'int', armure: 'maille',
    armes: ['lame runique', 'faux', 'gantelet gravé'],
    resume: 'La magie ne se lance pas de loin : elle se plante dans le ventre.',
    passif: 'Gravure — ses sorts frappent au contact et lui rendent une part de ce qu’ils prennent.',
    competences: ['runelame-lame-gravee', 'runelame-decharge-runique', 'runelame-morsure-d-ether',
      'runelame-armure-de-runes', 'runelame-fente-arcanique', 'runelame-cercle-de-lames',
      'runelame-verdict-runique', 'signature-lame-des-arcanes'],
  },
};

// =====================================================================
// 4. Les vingt-sept sous-classes, choisies au niveau 10
//
// `bonusStats` s'ajoute une fois pour toutes au choix de la sous-classe :
// c'est ce qui fait qu'un Berserker et un Templier, partis du même
// Gardien, ne se jouent plus du tout pareil trois niveaux plus tard.
// =====================================================================
const NIVEAU_SOUS_CLASSE = 10;

const SOUS_CLASSES = {
  // ----- 🛡️ Gardien -----
  templier:         { classe: 'gardien', nom: 'Templier', emoji: '🛡️', bonusStats: { vit: 5, esp: 2 }, passif: 'Il partage son blocage avec la ligne avant : les alliés devant lui subissent moins.', resume: 'Le bouclier de l’équipe, au sens propre.' },
  paladin:          { classe: 'gardien', nom: 'Paladin', emoji: '⚖️', bonusStats: { vit: 4, esp: 3 }, passif: 'Un allié qui tombe sous 30 % de PV reçoit un bouclier gratuit, une fois par combat.', resume: 'Il encaisse, et il relève.' },
  'chevalier-noir': { classe: 'gardien', nom: 'Chevalier Noir', emoji: '🖤', bonusStats: { vit: 5, int: 2 }, passif: 'Ses coups lui rendent de la vie, et il paie son mana en PV quand la réserve est vide.', resume: 'Il tient debout en prenant aux autres.' },
  colosse:          { classe: 'gardien', nom: 'Colosse', emoji: '🗿', bonusStats: { vit: 6, for: 1 }, passif: 'Ses dégâts montent avec ses PV maximum : plus il est massif, plus il frappe.', resume: 'La masse comme argument.' },

  // ----- ⚔️ Guerrier -----
  berserker: { classe: 'guerrier', nom: 'Berserker', emoji: '🪓', bonusStats: { for: 8, vit: -1 }, passif: 'Plus il lui manque de PV, plus il frappe fort. Tuer le soigne.', resume: 'La rage comme méthode.' },
  moine:     { classe: 'guerrier', nom: 'Moine', emoji: '🥋', bonusStats: { for: 4, vit: 3 }, passif: 'Chaque coup accumule une charge ; à cinq charges, le coup suivant est critique.', resume: 'Le rythme avant la force.' },
  assassin:  { classe: 'guerrier', nom: 'Assassin', emoji: '🗡️', bonusStats: { for: 5, dex: 2 }, passif: 'Le premier coup du combat est critique garanti.', resume: 'Une seule ouverture lui suffit.' },
  danselame: { classe: 'guerrier', nom: 'Danselame', emoji: '🌸', bonusStats: { for: 4, dex: 3 }, passif: 'Changer de ligne est gratuit, et le coup qui suit gagne 20 %.', resume: 'Le combat comme chorégraphie.' },
  duelliste: { classe: 'guerrier', nom: 'Duelliste', emoji: '🤺', bonusStats: { for: 5, dex: 2 }, passif: 'Face à la même cible, son critique grimpe de 8 % par tour, jusqu’à 40 %.', resume: 'Un adversaire à la fois, et jusqu’au bout.' },

  // ----- 🏹 Franc-tireur -----
  rodeur:    { classe: 'franc-tireur', nom: 'Rôdeur', emoji: '🐺', bonusStats: { dex: 5, vit: 2 }, passif: '+30 % de dégâts contre les créatures et les élites ; un piège au début du combat.', resume: 'Le bois est son terrain, pas celui de la proie.' },
  voleur:    { classe: 'franc-tireur', nom: 'Voleur', emoji: '💰', bonusStats: { dex: 4, cha: 3 }, passif: '+25 % d’or et +10 % de rareté sur le butin ; ses coups font les poches.', resume: 'Il repart toujours avec plus qu’il n’est venu chercher.' },
  traqueur:  { classe: 'franc-tireur', nom: 'Traqueur', emoji: '🔖', bonusStats: { dex: 7 }, passif: 'Ses marques font subir +12 % de dégâts à la cible, pour toute l’équipe.', resume: 'Il désigne. L’équipe exécute.' },
  voltigeur: { classe: 'franc-tireur', nom: 'Voltigeur', emoji: '🤸', bonusStats: { dex: 5, vit: 2 }, passif: 'Aucun malus de ligne arrière, et la Célérité lui rend des actions.', resume: 'Jamais deux fois au même endroit.' },

  // ----- 🔮 Arcaniste -----
  pyromancien:   { classe: 'arcaniste', nom: 'Pyromancien', emoji: '🔥', bonusStats: { int: 7 }, passif: 'Ses brûlures se cumulent jusqu’à cinq fois ; tuer par le feu fait exploser la cible.', resume: 'Tout finit par brûler.' },
  givremage:     { classe: 'arcaniste', nom: 'Givremage', emoji: '❄️', bonusStats: { int: 5, vit: 2 }, passif: 'Les cibles gelées subissent +20 % ; les frapper brise la glace pour bien davantage.', resume: 'Il ralentit le monde, puis le casse.' },
  elementaliste: { classe: 'arcaniste', nom: 'Élémentaliste', emoji: '🌪️', bonusStats: { int: 5, dex: 2 }, passif: 'Alterner deux éléments déclenche gratuitement la synergie correspondante.', resume: 'Le bon élément au bon moment.' },
  necromancien:  { classe: 'arcaniste', nom: 'Nécromancien', emoji: '💀', bonusStats: { int: 6, vit: 1 }, passif: 'Chaque mort sur le terrain lui donne +3 % de dégâts, cumulables.', resume: 'Le champ de bataille travaille pour lui.' },
  invocateur:    { classe: 'arcaniste', nom: 'Invocateur', emoji: '🐉', bonusStats: { int: 5, esp: 2 }, passif: 'Deux invocations à la fois, et leurs statistiques montent de 40 %.', resume: 'Il ne se bat jamais seul.' },

  // ----- ✨ Devin -----
  barde:  { classe: 'devin', nom: 'Barde', emoji: '🎵', bonusStats: { esp: 4, dex: 3 }, passif: 'Ses buffs durent deux tours de plus ; les ennemis touchés infligent 15 % de moins.', resume: 'Il soigne en donnant le tempo.' },
  chaman: { classe: 'devin', nom: 'Chaman', emoji: '🌩️', bonusStats: { esp: 5, vit: 2 }, passif: 'Deux totems simultanés ; à la mort d’un allié, son esprit combat trois tours.', resume: 'Les ancêtres répondent quand on les appelle.' },
  druide: { classe: 'devin', nom: 'Druide', emoji: '🐻', bonusStats: { esp: 5, vit: 2 }, passif: 'Ses régénérations soignent aussi 5 % des PV de toute l’équipe.', resume: 'La forêt soigne les siens.' },
  oracle: { classe: 'devin', nom: 'Oracle', emoji: '👁️‍🗨️', bonusStats: { esp: 6, int: 1 }, passif: 'Le surplus de soin devient un bouclier, jusqu’à 20 % des PV maximum de la cible.', resume: 'Elle soigne les blessures avant qu’elles arrivent.' },

  // ----- 🌑 Runelame -----
  faucheur:   { classe: 'runelame', nom: 'Faucheur', emoji: '⚰️', bonusStats: { int: 5, vit: 2 }, passif: 'Ses sorts lui rendent 25 % en PV ; il exécute les cibles sous 15 % de vie.', resume: 'Il prend, et il garde.' },
  corrupteur: { classe: 'runelame', nom: 'Corrupteur', emoji: '🦠', bonusStats: { int: 6, vit: 1 }, passif: 'Ses statuts durent un tour de plus et se propagent en expirant.', resume: 'Il ne tue pas : il laisse faire.' },
  metamorphe: { classe: 'runelame', nom: 'Métamorphe', emoji: '🐾', bonusStats: { int: 4, vit: 3 }, passif: 'Il bascule librement entre ours (+30 % PV) et corbeau (+25 % initiative).', resume: 'Trois bêtes dans un seul corps.' },
  runemaitre: { classe: 'runelame', nom: 'Runemaître', emoji: '💠', bonusStats: { int: 6, esp: 1 }, passif: 'Chaque rune différente lancée dans le tour ajoute 8 % au sort suivant.', resume: 'La discipline avant la puissance.' },
  vibrelame:  { classe: 'runelame', nom: 'Vibrelame', emoji: '〰️', bonusStats: { int: 5, dex: 2 }, passif: 'Ses attaques à coups multiples gagnent un coup supplémentaire à 50 %.', resume: 'La vitesse, jusqu’à ce que l’acier chante.' },
};

// =====================================================================
// 5. Migration : où atterrit chacune des 21 classes historiques
//
// Aucune n'est perdue. Seize deviennent des sous-classes en gardant leurs
// huit compétences, quatre deviennent des classes de base, et l'Aventurier
// se voit offrir un choix libre à sa première connexion.
// =====================================================================
const MIGRATION_CLASSES = {
  // Les quatre classes historiques qui restent des classes de base.
  guerrier: { classe: 'guerrier', sousClasse: null },
  mage:     { classe: 'arcaniste', sousClasse: null },
  archer:   { classe: 'franc-tireur', sousClasse: null },
  clerc:    { classe: 'devin', sousClasse: null },
  // Les seize qui deviennent des sous-classes, avec tout ce qu'elles ont.
  templier:      { classe: 'gardien', sousClasse: 'templier' },
  paladin:       { classe: 'gardien', sousClasse: 'paladin' },
  berserker:     { classe: 'guerrier', sousClasse: 'berserker' },
  moine:         { classe: 'guerrier', sousClasse: 'moine' },
  assassin:      { classe: 'guerrier', sousClasse: 'assassin' },
  danselame:     { classe: 'guerrier', sousClasse: 'danselame' },
  rodeur:        { classe: 'franc-tireur', sousClasse: 'rodeur' },
  voleur:        { classe: 'franc-tireur', sousClasse: 'voleur' },
  pyromancien:   { classe: 'arcaniste', sousClasse: 'pyromancien' },
  givremage:     { classe: 'arcaniste', sousClasse: 'givremage' },
  elementaliste: { classe: 'arcaniste', sousClasse: 'elementaliste' },
  necromancien:  { classe: 'arcaniste', sousClasse: 'necromancien' },
  invocateur:    { classe: 'arcaniste', sousClasse: 'invocateur' },
  barde:         { classe: 'devin', sousClasse: 'barde' },
  chaman:        { classe: 'devin', sousClasse: 'chaman' },
  druide:        { classe: 'devin', sousClasse: 'druide' },
  // L'Aventurier n'entre dans aucun rôle : on lui offre le choix.
  aventurier:    { classe: null, sousClasse: null, choixOffert: true },
};

// =====================================================================
// 6. Recâblage des compétences historiques
//
// Les huit compétences de chaque classe historique suivent leur classe :
// celles des futures sous-classes deviennent des compétences de
// sous-classe, celles des classes de base restent des compétences de
// base. Leur statistique porteuse est recalée sur celle de la famille,
// pour qu'un Moine n'ait pas à monter la Dextérité dans une classe de
// Force. La Vitalité est laissée telle quelle : quand une compétence s'en
// sert, c'est un choix d'endurance, pas un oubli.
// =====================================================================
const STATS_RECALABLES = ['for', 'dex', 'int', 'esp'];

Object.entries(MIGRATION_CLASSES).forEach(([ancienne, cible]) => {
  if (!cible.classe) return;
  const statFamille = CLASSES_BASE[cible.classe].stat;
  Object.values(COMPETENCES).forEach((comp) => {
    if (comp.classe !== ancienne) return;
    if (cible.sousClasse) {
      comp.sousClasse = cible.sousClasse;
      comp.classe = null;
      // Une compétence de sous-classe s'apprend au choix de la spécialité.
      comp.niveauRequis = Math.max(comp.niveauRequis || 1, NIVEAU_SOUS_CLASSE);
    } else {
      comp.classe = cible.classe;
    }
    if (STATS_RECALABLES.includes(comp.stat)) comp.stat = statFamille;
    if (comp.effet && STATS_RECALABLES.includes(comp.effet.stat)) comp.effet.stat = statFamille;
  });
});

// Chaque sous-classe reçoit la liste de ses compétences et sa signature.
Object.entries(SOUS_CLASSES).forEach(([id, sc]) => {
  sc.id = id;
  sc.competences = Object.keys(COMPETENCES).filter((cle) => COMPETENCES[cle].sousClasse === id);
  sc.signature = sc.competences.find((cle) => COMPETENCES[cle].signature) || null;
});

// Et chaque classe de base connaît ses sous-classes, dans l'ordre.
Object.entries(CLASSES_BASE).forEach(([id, classe]) => {
  classe.id = id;
  classe.sousClasses = Object.keys(SOUS_CLASSES).filter((cle) => SOUS_CLASSES[cle].classe === id);
  classe.signature = classe.competences.find((cle) => (COMPETENCES[cle] || {}).signature) || null;
});

// Les compétences de l'Aventurier n'appartiennent plus à aucun rôle, mais
// d'anciens héros les portent encore : on les marque comme héritées, ce qui
// les garde utilisables sans les rattacher à une classe qui n'existe plus.
const CLASSES_HERITEES = ['aventurier'];

Object.values(COMPETENCES).forEach((comp) => {
  if (CLASSES_HERITEES.includes(comp.classe)) comp.heritee = true;
});

function classeBaseDe(p) {
  return CLASSES_BASE[p && p.classe] || null;
}

function sousClasseDe(p) {
  return SOUS_CLASSES[p && p.sousClasse] || null;
}

// Le nom complet affiché partout : « Gardien » puis « Gardien — Templier ».
function nomCompletClasse(p) {
  const base = classeBaseDe(p);
  if (!base) return 'Aventurier';
  const sc = sousClasseDe(p);
  return sc ? `${base.nom} — ${sc.nom}` : base.nom;
}

function emojiClasse(p) {
  const sc = sousClasseDe(p);
  if (sc) return sc.emoji;
  const base = classeBaseDe(p);
  return base ? base.emoji : '🎒';
}

// =====================================================================
// 7. Le jeu ne connaît plus que six classes
//
// CLASSES et MODELES sont reconstruits sur les six rôles : l'écran de
// création propose six choix lisibles au lieu de vingt et un, et tout le
// code qui les lisait continue de fonctionner sans changement.
// =====================================================================
const STATS_DEPART = {
  gardien:        { vit: 8, for: 6, dex: 3, int: 2, esp: 3, cha: 2 },
  guerrier:       { for: 8, vit: 7, dex: 3, int: 2, esp: 2, cha: 2 },
  'franc-tireur': { dex: 8, vit: 5, for: 4, int: 2, esp: 2, cha: 3 },
  arcaniste:      { int: 8, vit: 5, dex: 3, esp: 3, for: 2, cha: 3 },
  devin:          { esp: 8, int: 5, vit: 5, dex: 2, for: 2, cha: 2 },
  runelame:       { int: 8, vit: 6, for: 3, dex: 3, esp: 2, cha: 2 },
};

// Les quatre compétences communes pré-cochées à la création. Elles restent
// modifiables : ce sont des suggestions, pas une assignation.
const COMMUNES_DEPART = {
  gardien:        ['provocation', 'second-souffle', 'frappe-heroique', 'bouclier-magique'],
  guerrier:       ['frappe-heroique', 'coup-etourdissant', 'tourbillon', 'second-souffle'],
  'franc-tireur': ['tir-precis', 'pluie-de-fleches', 'lame-empoisonnee', 'concentration'],
  arcaniste:      ['boule-de-feu', 'eclair', 'nova-de-givre', 'concentration'],
  devin:          ['soin', 'cercle-de-soin', 'benediction', 'regeneration'],
  runelame:       ['drain-de-vie', 'eclair', 'lame-empoisonnee', 'bouclier-magique'],
};

// On vide les anciennes entrées sans casser les références : MODELES et
// CLASSES sont des constantes, on les remplit à nouveau.
MODELES.length = 0;
Object.keys(CLASSES).forEach((cle) => { delete CLASSES[cle]; });

Object.entries(CLASSES_BASE).forEach(([id, base]) => {
  MODELES.push({
    id,
    nom: base.nom,
    emoji: base.emoji,
    role: base.role,
    resume: base.resume,
    stats: { ...STATS_DEPART[id] },
    competences: [...COMMUNES_DEPART[id]],
  });
  CLASSES[id] = {
    nom: base.nom,
    emoji: base.emoji,
    role: base.role,
    signature: base.signature,
  };
});

// L'Aventurier reste déclaré : d'anciennes sauvegardes le portent encore,
// et le code du réseau s'en sert comme valeur de repli.
CLASSES.aventurier = { nom: 'Aventurier', emoji: '🎒', role: 'Sans voie', signature: 'signature-panache' };
