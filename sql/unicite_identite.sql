-- =====================================================================
-- Unicité de l'identité d'un héros dans le monde en ligne.
-- (Migration appliquée au projet Supabase le 2026-08-19 :
--  « unicite_nom_et_code_recuperation ».)
--
-- Avant : creer_personnage acceptait n'importe quel nom (y compris un nom
-- déjà porté), et le code de récupération n'était vérifié qu'après coup,
-- par un appel séparé qui échouait en silence. Résultat constaté en
-- production : deux « Aramis », et la possibilité de créer deux héros
-- avec le même nom ET le même email de récupération.
--
-- Après : le nom est unique (insensible à la casse), le code de
-- récupération est unique, et les deux sont vérifiés AU MOMENT de la
-- création, atomiquement, avec un message d'erreur lisible par le jeu.
-- =====================================================================

-- 1) Dédoublonnage des noms existants : le doublon le moins récemment
--    actif reçoit un suffixe numérique, le plus actif garde son nom.
with doublons as (
  select id,
         row_number() over (
           partition by lower(trim(nom))
           order by derniere_activite desc, cree_le desc
         ) as rang
  from personnages
)
update personnages p
   set nom = left(p.nom, 12) || ' ' || d.rang::text
  from doublons d
 where d.id = p.id and d.rang > 1;

-- 2) Les verrous en base : plus aucun doublon ne peut naître, même par
--    une écriture qui contournerait les fonctions.
create unique index if not exists personnages_nom_unique
  on personnages (lower(trim(nom)));
create unique index if not exists personnages_recuperation_unique
  on personnages (lower(recuperation)) where recuperation is not null;

-- 3) La création vérifie tout, d'un bloc, et attache le code de
--    récupération atomiquement. L'ancien appel à trois arguments reste
--    valable (p_recuperation a une valeur par défaut).
drop function if exists public.creer_personnage(text, text, jsonb);
create or replace function public.creer_personnage(
  p_nom text, p_avatar text, p_donnees jsonb, p_recuperation text default null
) returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_id uuid;
  v_token uuid;
  v_nom text := trim(coalesce(p_nom, ''));
  v_code text := nullif(lower(trim(coalesce(p_recuperation, ''))), '');
begin
  if char_length(v_nom) < 1 or char_length(v_nom) > 24 then
    return jsonb_build_object('erreur', 'Nom invalide : 1 à 24 caractères.');
  end if;
  if exists (select 1 from personnages where lower(trim(nom)) = lower(v_nom)) then
    return jsonb_build_object('erreur',
      'Ce nom est déjà porté par un héros du monde — choisissez-en un autre.');
  end if;
  if v_code is not null then
    if char_length(v_code) < 4 then
      return jsonb_build_object('erreur', 'Code de récupération trop court : 4 caractères minimum.');
    end if;
    if exists (select 1 from personnages where lower(recuperation) = v_code) then
      return jsonb_build_object('erreur',
        'Ce code de récupération est déjà utilisé par un autre héros.');
    end if;
  end if;
  insert into personnages (nom, avatar, donnees, recuperation)
  values (v_nom, coalesce(p_avatar, '⚔️'), coalesce(p_donnees, '{}'::jsonb), v_code)
  returning id, token into v_id, v_token;
  return jsonb_build_object('id', v_id, 'token', v_token);
end;
$$;

-- 4) Le renommage respecte la même règle : pas de collision de nom.
create or replace function public.renommer_personnage(p_id uuid, p_token uuid, p_nom text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_nom text := left(trim(p_nom), 16);
begin
  if v_nom is null or v_nom = '' then
    return jsonb_build_object('erreur', 'nom vide');
  end if;
  if exists (select 1 from personnages
              where lower(trim(nom)) = lower(v_nom) and id <> p_id) then
    return jsonb_build_object('erreur',
      'Ce nom est déjà porté par un autre héros du monde.');
  end if;
  update personnages
     set nom = v_nom, derniere_activite = now()
   where id = p_id and token = p_token;
  if not found then
    return jsonb_build_object('erreur', 'personnage inconnu');
  end if;
  return jsonb_build_object('ok', true, 'nom', v_nom);
end;
$$;

-- 5) La disponibilité se vérifie AVANT de créer : le jeu peut dire au
--    joueur, pendant la création, que le nom ou l'email est pris.
--    Deux booléens, rien d'autre : aucun détail d'un autre héros ne fuit.
create or replace function public.verifier_disponibilite(p_nom text, p_code text default null)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_nom text := lower(trim(coalesce(p_nom, '')));
  v_code text := nullif(lower(trim(coalesce(p_code, ''))), '');
begin
  return jsonb_build_object(
    'nom_pris', v_nom <> '' and exists (
      select 1 from personnages where lower(trim(nom)) = v_nom),
    'code_pris', v_code is not null and exists (
      select 1 from personnages where lower(recuperation) = v_code));
end;
$$;

grant execute on function public.verifier_disponibilite(text, text) to anon;
grant execute on function public.creer_personnage(text, text, jsonb, text) to anon;
