import { useCallback, useEffect, useState } from "react";
import { Ban, Unlock } from "lucide-react";
import { fetchMyBlocks, moderationErrorMessage, unblockUser, type BlockedMember } from "../../../api/moderation";
import { useBranding } from "../../../contexts/TerritoryContext";
import ConfirmDialog from "../../ConfirmDialog/ConfirmDialog";
import "./MembresBloques.scss";

/** Membres bloqués (mon profil) : même liste que dans l'app mobile, avec déblocage. */
export default function MembresBloques() {
  const { asset } = useBranding();
  const [blocks, setBlocks] = useState<BlockedMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [toUnblock, setToUnblock] = useState<BlockedMember | null>(null);

  const load = useCallback(() => {
    fetchMyBlocks()
      .then((list) => {
        setBlocks(list);
        setError(null);
      })
      .catch(() => setError("Impossible de charger les membres bloqués."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function unblock(member: BlockedMember) {
    setPending(member.userId);
    try {
      await unblockUser(member.userId);
      setBlocks((current) => current?.filter((item) => item.userId !== member.userId) ?? null);
      setToUnblock(null);
    } catch (err) {
      setError(moderationErrorMessage(err, "Le déblocage n'a pas pu aboutir."));
    } finally {
      setPending(null);
    }
  }

  // Section masquée tant qu'aucun membre n'est bloqué : rien à gérer.
  if (!error && (!blocks || blocks.length === 0)) return null;

  return (
    <div className="container-membresBloques">
      <h2>
        <Ban size={15} strokeWidth={2.4} /> Membres bloqués
      </h2>
      <div className="membresBloques-card">
        <p className="membresBloques-card__intro">
          Ils ne voient plus ton profil, tes activités, tes messages ni tes photos, et inversement.
        </p>
        {error && <p className="membresBloques-card__error">{error}</p>}
        <ul>
          {blocks?.map((member) => (
            <li key={member.userId}>
              <img src={member.avatar || asset("avatarDefault")} alt="" />
              <span>{member.pseudo}</span>
              <button type="button" onClick={() => setToUnblock(member)} disabled={pending !== null}>
                {pending === member.userId ? "..." : "Débloquer"}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ConfirmDialog
        isOpen={toUnblock !== null}
        title={toUnblock ? `Débloquer ${toUnblock.pseudo} ?` : ""}
        description="Vous pourrez de nouveau voir vos profils, activités et messages respectifs."
        confirmWord={null}
        confirmLabel="Débloquer"
        submittingLabel="Déblocage..."
        icon={<Unlock size={22} strokeWidth={2.2} />}
        isSubmitting={pending !== null}
        errorMessage={null}
        onConfirm={() => toUnblock && void unblock(toUnblock)}
        onCancel={() => setToUnblock(null)}
      />
    </div>
  );
}
