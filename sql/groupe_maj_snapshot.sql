-- =====================================================================
-- v20 : le salon de groupe respire.
--
-- Jusqu'ici, l'instantané d'un héros n'était envoyé qu'à la création ou à
-- l'arrivée dans le groupe (groupe_creer / groupe_rejoindre). Passer à
-- l'auberge, monter de niveau, apprendre une compétence ou changer
-- d'équipement ne changeait donc RIEN pour les autres écrans : le chef
-- lançait l'expédition avec des héros figés. On ne pouvait s'en sortir
-- qu'en rechargeant la page… ce qui faisait perdre le groupe et obligeait
-- à en recréer un.
--
-- Cette fonction rafraîchit l'instantané d'un membre DÉJÀ présent :
--   • en place, sans toucher à l'ordre des membres (donc des tours) ;
--   • sans faire entrer personne (c'est le rôle de groupe_rejoindre) ;
--   • uniquement au salon — une expédition lancée fige les combattants.
--
-- À appliquer sur le projet Supabase du jeu (déjà déployé le 2026-08-16).
-- =====================================================================
create or replace function public.groupe_maj_snapshot(
  p_id uuid, p_token uuid, p_groupe bigint, p_snapshot jsonb
) returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_perso personnages;
  v_groupe groupes;
begin
  v_perso := _verifier_perso(p_id, p_token);
  select * into v_groupe from groupes where id = p_groupe for update;
  if not found then return false; end if;
  -- Uniquement au salon : personne ne se soigne au milieu d'un combat.
  if v_groupe.statut <> 'lobby' then return false; end if;
  if not exists (
    select 1 from jsonb_array_elements(v_groupe.membres) m where m->>'id' = p_id::text
  ) then
    return false;
  end if;

  -- Remplacement EN PLACE : « with ordinality » préserve l'ordre d'entrée,
  -- donc l'ordre d'affichage et l'ordre des tours.
  --
  -- On ne touche PAS à « maj » : les membres surveillent sa fraîcheur pour
  -- repérer un chef déconnecté, et un simple battement de cœur ne doit pas
  -- faire croire que le chef est encore là.
  update groupes
  set membres = (
    select coalesce(jsonb_agg(
      case when t.m->>'id' = p_id::text then p_snapshot else t.m end
      order by t.ord), '[]'::jsonb)
    from jsonb_array_elements(v_groupe.membres) with ordinality as t(m, ord)
  )
  where id = p_groupe;
  return true;
end;
$function$;
