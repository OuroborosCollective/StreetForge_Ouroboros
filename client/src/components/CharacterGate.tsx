import { useState } from "react";
import { CheckCircle2, LogIn, Plus, Shield, UserRound, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const archetypes = [
  { id: "runner", label: "RUNNER", detail: "Schnell, direkt, immer in Bewegung." },
  { id: "enforcer", label: "ENFORCER", detail: "Hält die Linie und bricht den Widerstand." },
  { id: "scout", label: "SCOUT", detail: "Liest Routen, Dächer und Schwachstellen." },
  { id: "fixer", label: "FIXER", detail: "Findet Kontakte, Aufträge und sichere Wege." },
] as const;

export function CharacterGate({ open, onClose, onEnter }: { open: boolean; onClose: () => void; onEnter: () => void }) {
  const { isAuthenticated, loading } = useAuth();
  const [callsign, setCallsign] = useState("");
  const [archetype, setArchetype] = useState<(typeof archetypes)[number]["id"]>("runner");
  const [presentation, setPresentation] = useState<"street" | "industrial" | "night_ops">("street");
  const characters = trpc.characters.mine.useQuery(undefined, { enabled: open && isAuthenticated, retry: false });
  const createCharacter = trpc.characters.create.useMutation({ onSuccess: () => { setCallsign(""); characters.refetch(); } });
  const enter = trpc.characters.enter.useMutation({ onSuccess: () => { onClose(); onEnter(); } });

  return <div className={`character-overlay ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="StreetForge character selection">
    <section className="character-dialog">
      <button className="character-close" onClick={onClose} aria-label="Charakterauswahl schließen"><X size={18} /></button>
      {!isAuthenticated && !loading ? <div className="character-login"><Shield size={34} /><span className="eyebrow">ACCOUNT UPLINK REQUIRED</span><h2>ANMELDEN.<br />DANN REVIER<br />BETRETEN.</h2><p>Dein Manus-Account sichert Charaktere, Progression, Inventar und Gangzugehörigkeit serverseitig.</p><button className="forge-button" onClick={startLogin}><LogIn size={16} /><b>MIT MANUS ANMELDEN</b></button></div> : <><header><div><span className="eyebrow">STREETFORGE // CHARACTER ROSTER</span><h2>WÄHLE DEINEN<br />EINSATZ.</h2></div></header>{characters.isLoading ? <div className="console-loading">LOADING CHARACTER PROFILES</div> : <div className="character-grid">{characters.data?.map((character) => <article className={`character-card ${character.isActive ? "active" : ""}`} key={character.id}><div><span>{character.archetype.toUpperCase()} // {character.presentation.toUpperCase()}</span><h3>{character.callsign}</h3><em>{character.isActive ? "ACTIVE PROFILE" : "AVAILABLE PROFILE"}</em></div><button disabled={enter.isPending} onClick={() => enter.mutate({ characterId: character.id })}>{enter.isPending ? "JOINING" : <><CheckCircle2 size={14} /> SPIEL BEITRETEN</>}</button></article>)}</div>}<form className="character-forge" onSubmit={(event) => { event.preventDefault(); createCharacter.mutate({ callsign, archetype, presentation }); }}><div className="character-forge-head"><Plus size={16} /><span>CREATE CHARACTER</span></div><input value={callsign} onChange={(event) => setCallsign(event.target.value)} placeholder="RUFNAME // 3–32 ZEICHEN" minLength={3} maxLength={32} required /><div className="archetype-grid">{archetypes.map((entry) => <button type="button" className={archetype === entry.id ? "active" : ""} onClick={() => setArchetype(entry.id)} key={entry.id}><b>{entry.label}</b><span>{entry.detail}</span></button>)}</div><div className="presentation-row"><label><input type="radio" name="presentation" checked={presentation === "street"} onChange={() => setPresentation("street")} /> STREET</label><label><input type="radio" name="presentation" checked={presentation === "industrial"} onChange={() => setPresentation("industrial")} /> INDUSTRIAL</label><label><input type="radio" name="presentation" checked={presentation === "night_ops"} onChange={() => setPresentation("night_ops")} /> NIGHT OPS</label></div>{createCharacter.error && <p className="console-error">{createCharacter.error.message}</p>}<button className="forge-button character-create" disabled={createCharacter.isPending}><UserRound size={16} /><b>{createCharacter.isPending ? "PROFILE WIRD ERSTELLT" : "CHARAKTER ERSTELLEN"}</b></button></form></>}
    </section>
  </div>;
}
