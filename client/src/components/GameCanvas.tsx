// Asphalt Opera component: React frames the Babylon street with edge-bound tactical HUD, never a dashboard.
import { useEffect, useRef, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { ArrowUpRight, CheckCircle2, Crosshair, Github, GitPullRequestDraft, Hand, LoaderCircle, Map, Share2, Shield, ShieldCheck, SlidersHorizontal, Sword, Volume2, VolumeX, X, Zap } from "lucide-react";
import { assets } from "@/game/assets";
import { createGameScene, type GameHandle } from "@/game/scene";
import type { AbilityId, GameSnapshot } from "@/game/types";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { WorldConsole } from "@/components/WorldConsole";
import { AdminPanel } from "@/components/AdminPanel";
import { useDeviceClass } from "@/hooks/useDeviceClass";
import { CharacterGate } from "@/components/CharacterGate";

const emptySnapshot: GameSnapshot = {
  active: false, playerHp: 120, playerMaxHp: 120, stamina: 100, maxStamina: 100, xp: 0, level: 3,
  kills: 0, loot: 0, objective: "SECURE THE BLOCK", objectiveDetail: "0 / 3 RIVALS DOWN", objectiveDone: false,
  equipped: "SPLIT BAR", nearestEnemy: null, cooldowns: { quick: 0, dash: 0, heavy: 0 }, enemies: [], pickups: [], toast: null, respawnTicks: 0,
};

const cooldownPct = (ticks: number, total: number) => Math.min(100, (ticks / total) * 100);

function Meter({ label, value, max, kind }: { label: string; value: number; max: number; kind: "health" | "stamina" }) {
  return <div className="meter-row"><div className="meter-meta"><span>{label}</span><strong>{value}</strong></div><div className={`meter-track ${kind}`}><span style={{ width: `${Math.max(0, (value / max) * 100)}%` }} /></div></div>;
}

function Ability({ id, keycap, label, cooldown, maxCooldown, onClick, icon }: { id: AbilityId; keycap: string; label: string; cooldown: number; maxCooldown: number; onClick: () => void; icon: React.ReactNode }) {
  const ready = cooldown === 0;
  return <button className={`ability ${ready ? "ready" : "cooling"}`} onClick={onClick} aria-label={`${label}, Taste ${keycap}`}><span className="ability-key">{keycap}</span><span className="ability-icon">{icon}</span><span className="ability-label">{label}</span>{!ready && <i style={{ height: `${cooldownPct(cooldown, maxCooldown)}%` }} />}</button>;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const handleRef = useRef<GameHandle | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importResult, setImportResult] = useState<{ pullRequestUrl: string; branch: string; fileCount: number } | null>(null);
  const [canvasHealth, setCanvasHealth] = useState<"starting" | "ready" | "unsupported" | "error">("starting");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.22);
  const ambienceRef = useRef<HTMLAudioElement>(null);
  const strikeRef = useRef<HTMLAudioElement>(null);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const device = useDeviceClass();
  const importStatus = trpc.githubImport.status.useQuery(undefined, { enabled: githubOpen, retry: false });
  const playerProfile = trpc.world.profile.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const activeCharacter = trpc.characters.active.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const equippedItems = trpc.world.equipment.useQuery({ characterId: activeCharacter.data?.id ?? 0 }, { enabled: isAuthenticated && Boolean(activeCharacter.data?.id), retry: false });
  const stageImport = trpc.githubImport.stage.useMutation({
    onSuccess: (result) => setImportResult(result),
  });
  const recordWeaponUse = trpc.world.weaponUse.useMutation({ onSuccess: () => playerProfile.refetch() });
  const claimShareReward = trpc.world.claimShareReward.useMutation({ onSuccess: () => playerProfile.refetch() });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) { setCanvasHealth("unsupported"); return; }
    startedRef.current = true;
    let engine: Engine;
    try { engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true }); } catch { setCanvasHealth("error"); return; }
    let disposed = false;
    createGameScene(engine, canvas, { onSnapshot: setSnapshot, onArmoryToggle: () => setArmoryOpen((value) => !value) }).then((handle) => {
      if (disposed) { handle.dispose(); return; }
      handleRef.current = handle;
      setCanvasHealth("ready");
      engine.runRenderLoop(() => handle.scene.render());
    }).catch(() => { setCanvasHealth("error"); engine.dispose(); });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handleRef.current?.dispose();
      handleRef.current = null;
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const ambience = ambienceRef.current;
    if (!ambience) return;
    ambience.volume = audioVolume;
    if (audioEnabled && snapshot.active) ambience.play().catch(() => setAudioEnabled(false));
    else { ambience.pause(); ambience.currentTime = 0; }
  }, [audioEnabled, audioVolume, snapshot.active]);

  const start = () => {
    setCharacterOpen(true);
  };
  const enterActiveCharacter = () => handleRef.current?.start();
  const invoke = (action: "attack" | "dash" | "heavy" | "collect" | "toggleArmory") => {
    handleRef.current?.action(action);
    if (audioEnabled && (action === "attack" || action === "heavy")) { const strike = strikeRef.current; if (strike) { strike.volume = Math.min(0.55, audioVolume * 2); strike.currentTime = 0; strike.play().catch(() => undefined); } }
    if (isAuthenticated && (action === "attack" || action === "heavy") && !recordWeaponUse.isPending) {
      recordWeaponUse.mutate({ equippedCategory: "melee", actionCategory: "melee", masteryXp: action === "heavy" ? 12 : 7, playerXp: action === "heavy" ? 9 : 5 });
    }
  };
  const openGitHubImport = () => { setGithubOpen(true); setImportConfirmed(false); setImportResult(null); };
  const shareStreetForge = async () => {
    const url = window.location.origin;
    const shareApi = (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share;
    const usedNativeShare = typeof shareApi === "function";
    try { if (usedNativeShare) await shareApi!({ title: "StreetForge: Neon District", text: "Betritt den Neon District.", url }); else await navigator.clipboard.writeText(url); }
    catch { return; }
    if (isAuthenticated && !claimShareReward.isPending) claimShareReward.mutate({ channel: usedNativeShare ? "web-share" : "clipboard" });
  };
  const stageGitHubImport = () => {
    if (!isAuthenticated) { startLogin(); return; }
    if (!importConfirmed || stageImport.isPending) return;
    stageImport.mutate({ confirmation: "PUSH_STREETFORGE_TO_OUROBOROS" });
  };
  const isActive = snapshot.active;

  return <div className={`streetforge-shell ${device.isTouch ? "is-touch" : ""} ${device.isAndroid ? "is-android" : ""} ${device.isPortrait ? "is-portrait" : "is-landscape"}`} data-device={device.isAndroid ? "android" : device.isTouch ? "touch" : "desktop"} data-runtime={canvasHealth}>
    <canvas ref={canvasRef} className="streetforge-canvas" tabIndex={0} style={{ touchAction: "none" }} />
    <audio ref={ambienceRef} src="/manus-storage/streetforge-district-ambience_ee8bc8f5.ogg" loop preload="none" />
    <audio ref={strikeRef} src="/manus-storage/qubodupPunch03_897a38a0.ogg" preload="auto" />
    {(canvasHealth === "unsupported" || canvasHealth === "error") && <div className="canvas-fallback"><img src={assets.logo} alt="StreetForge" /><span className="eyebrow">CANVAS LINK UNAVAILABLE</span><h1>DEIN GERÄT<br />BRAUCHT WEBGL.</h1><p>{canvasHealth === "unsupported" ? "Dieser Browser stellt keine unterstützte WebGL-Umgebung bereit. Aktualisiere deinen Browser oder öffne StreetForge auf einem grafikfähigen Gerät." : "Die Spielszenenverbindung konnte nicht gestartet werden. Lade die Seite neu oder versuche es erneut."}</p><button className="forge-button" onClick={() => window.location.reload()}><span>RETRY</span><b>VERBINDUNG NEU LADEN</b></button></div>}
    <div className={`start-cover ${isActive ? "is-hidden" : ""}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(5,8,10,.94) 0%, rgba(5,8,10,.72) 43%, rgba(5,8,10,.18) 100%), url(${assets.reference})` }}>
      <div className="cover-safety-line" />
      <div className="brand-lockup"><img src={assets.logo} alt="StreetForge Mark" /><div><p>STREETFORGE // DISTRICT 01</p><h1>NEON<br />DISTRICT</h1></div></div>
      <div className="cover-brief"><span className="eyebrow">NIGHT SHIFT // 00:43</span><h2>DER BLOCK<br />ERINNERT SICH.</h2><p>Drei Rivalen halten die Westspur. Nimm den Job an, sichere die Shards und behalte deinen Rücken frei.</p><button className="forge-button" onClick={start}><span>ENTER</span><b>DEN BLOCK BETRETEN</b></button><button className={`audio-toggle ${audioEnabled ? "on" : ""}`} onClick={() => setAudioEnabled((value) => !value)}>{audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {audioEnabled ? "AUDIO AN" : "AUDIO AUS"}</button><small>W A S D bewegen <i /> SPACE schlagen <i /> Q sprinten <i /> 1 schwerer Schlag</small></div>
      <div className="cover-coordinates">W-17 / N-09<br />WEST END</div>
      <button className="cover-github" onClick={openGitHubImport}><Github size={17} /><span>GITHUB</span><b>PROJEKT IMPORTIEREN</b><ArrowUpRight size={14} /></button>
    </div>
    <div className={`game-hud ${isActive ? "visible" : ""}`}>
      <header className="hud-topbar"><div className="hud-brand"><img src={assets.logo} alt="" /><span>STREET<span>FORGE</span></span></div><div className="district-tag">DISTRICT 01 <b>WEST END</b></div><div className="hud-actions"><button className="audio-hud-control" onClick={() => setAudioEnabled((value) => !value)} aria-label={audioEnabled ? "Audio stummschalten" : "Audio aktivieren"}>{audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><button className="github-trigger" onClick={shareStreetForge} disabled={claimShareReward.isPending}><Share2 size={14} /> SHARE</button><button className="github-trigger" onClick={openGitHubImport}><Github size={14} /> GITHUB</button>{user?.role === "admin" && <button className="admin-trigger" onClick={() => setAdminOpen(true)}><SlidersHorizontal size={14} /> ADMIN</button>}<button className="world-trigger" onClick={() => setWorldOpen(true)}><Map size={14} /> OPERATIONS</button><button className="armory-trigger" onClick={() => invoke("toggleArmory")}><Shield size={15} /> ARMORY <kbd>I</kbd></button></div></header>
      <section className="vitals-card"><div className="level-disc">{playerProfile.data?.profile.level ?? snapshot.level}<span>LVL</span></div><div className="vitals"><Meter label="VITAL" value={snapshot.playerHp} max={snapshot.playerMaxHp} kind="health" /><Meter label="STAMINA" value={snapshot.stamina} max={snapshot.maxStamina} kind="stamina" /></div></section>
      <section className={`objective-card ${snapshot.objectiveDone ? "complete" : ""}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(11,15,17,.94), rgba(11,15,17,.75)), url(${assets.hudPlate})` }}><div className="objective-pin"><Crosshair size={16} /></div><div><span>ACTIVE ORDER</span><strong>{snapshot.objective}</strong><p>{snapshot.objectiveDetail}</p></div></section>
      <section className="loadout-callout"><span>ACTIVE CATEGORY</span><b>MELEE // {snapshot.equipped}</b><em>{snapshot.pickups[0] ? `NEXT CACHE · ${snapshot.pickups[0].kind.toUpperCase()} · ${snapshot.pickups[0].label}` : "NO CACHE IN RANGE"}</em></section>
      <section className="minimap"><div className="mini-grid" /><span className="mini-road horizontal" /><span className="mini-road vertical" /><b className="mini-player" /><i className="mini-hostile one" /><i className="mini-hostile two" /><i className="mini-hostile three" /><em>WEST END</em></section>
      {snapshot.nearestEnemy && <section className="target-card"><span>MARKED RIVAL</span><strong>{snapshot.nearestEnemy}</strong><div><i /><b>{snapshot.enemies.find((enemy) => enemy.label === snapshot.nearestEnemy)?.hp ?? 0} HP</b></div></section>}
      {snapshot.toast && <div className="event-toast">{snapshot.toast}</div>}
      {snapshot.respawnTicks > 0 && <section className="respawn-card"><span>SAFE ROUTE // WEST END</span><strong>DU BIST AM BODEN.</strong><p>DEIN CHARAKTER WIRD IN {Math.max(1, Math.ceil(snapshot.respawnTicks / 20))} SEKUNDEN AM SICHEREN EINSATZPUNKT WIEDER EINGESETZT.</p></section>}
      <div className="bottom-rail"><div className="xp-block"><span>XP // {snapshot.xp} / 120</span><div><i style={{ width: `${(snapshot.xp % 120) / 1.2}%` }} /></div></div><div className="ability-bar"><Ability id="quick" keycap="SPACE" label="STRIKE" cooldown={snapshot.cooldowns.quick} maxCooldown={7} onClick={() => invoke("attack")} icon={<Sword size={20} />} /><Ability id="dash" keycap="Q" label="DASH" cooldown={snapshot.cooldowns.dash} maxCooldown={20} onClick={() => invoke("dash")} icon={<Zap size={20} />} /><Ability id="heavy" keycap="1" label="HEAVY" cooldown={snapshot.cooldowns.heavy} maxCooldown={28} onClick={() => invoke("heavy")} icon={<Hand size={19} />} /><button className="ability collect-button" onClick={() => invoke("collect")}><span className="ability-key">E</span><span className="shard-icon">◆</span><span className="ability-label">LOOT</span></button></div><div className="loot-block"><span>SHARDS</span><strong>{String(snapshot.loot).padStart(2, "0")}</strong></div></div>
      {device.isTouch && <div className="touch-command-bar" aria-label="Mobile Spielsteuerung"><button onPointerDown={() => handleRef.current?.move(0, -1)} aria-label="Vorwärts bewegen"><i>↑</i><span>MOVE</span></button><button onPointerDown={() => handleRef.current?.move(-1, 0)} aria-label="Links bewegen"><i>←</i><span>LEFT</span></button><button onPointerDown={() => handleRef.current?.move(1, 0)} aria-label="Rechts bewegen"><i>→</i><span>RIGHT</span></button><button onPointerDown={() => handleRef.current?.move(0, 1)} aria-label="Rückwärts bewegen"><i>↓</i><span>BACK</span></button><button onClick={() => invoke("attack")} aria-label="Angreifen"><Sword size={23} /><span>STRIKE</span></button><button onClick={() => invoke("dash")} aria-label="Ausweichen"><Zap size={23} /><span>DASH</span></button><button onClick={() => invoke("heavy")} aria-label="Schwerer Schlag"><Hand size={22} /><span>HEAVY</span></button><button onClick={() => invoke("collect")} aria-label="Beute aufnehmen"><i>◆</i><span>LOOT</span></button></div>}
      {audioEnabled && <label className="audio-volume">AUDIO <input aria-label="Audiolautstärke" type="range" min="0" max="0.5" step="0.01" value={audioVolume} onChange={(event) => setAudioVolume(Number(event.target.value))} /></label>}
      <aside className={`armory-card ${armoryOpen ? "open" : ""}`}><button className="armory-close" onClick={() => setArmoryOpen(false)}>×</button><span className="eyebrow">LOADOUT // SERVER ISSUE</span><h2>{snapshot.equipped}</h2><div className="weapon-diagram"><span /><i /><b>FORGE<br />GRADE</b></div><p>{activeCharacter.data ? `${activeCharacter.data.callsign.toUpperCase()} // ${equippedItems.data?.length ?? 0} PERSISTED SLOTS` : "CHARAKTER WÄHLEN, UM DIE PERSISTENTE AUSRÜSTUNG ZU LADEN."}</p><div className="armory-stats">{["weapon", "head", "torso", "gloves", "legs", "shoes", "cape", "shoulder", "offhand"].map((slot) => <span key={slot}>{slot.toUpperCase()} <b>{equippedItems.data?.some((item) => item.slot === slot) ? "ON" : "—"}</b></span>)}</div><button className="forge-button small" onClick={() => setArmoryOpen(false)}><span>LOCKED</span><b>AUSRÜSTUNG SICHERN</b></button></aside>
    </div>
    <WorldConsole open={worldOpen} onClose={() => setWorldOpen(false)} />
    {user?.role === "admin" && <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />}
    <CharacterGate open={characterOpen} onClose={() => setCharacterOpen(false)} onEnter={enterActiveCharacter} />
    <div className={`github-overlay ${githubOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="StreetForge GitHub Import">
      <section className="github-dialog">
        <button className="github-close" onClick={() => setGithubOpen(false)} aria-label="GitHub-Import schließen"><X size={18} /></button>
        {importResult ? <div className="github-success"><CheckCircle2 size={34} /><span className="eyebrow">IMPORT VORBEREITET</span><h2>DRAFT PR<br />ANGELEGT.</h2><p><b>{importResult.fileCount} Projektdateien</b> wurden auf <code>{importResult.branch}</code> übertragen. Die Pull Request bleibt als Entwurf für deine Prüfung offen.</p><a href={importResult.pullRequestUrl} target="_blank" rel="noreferrer" className="forge-button"><span>PR</span><b>DRAFT PULL REQUEST ÖFFNEN</b><ArrowUpRight size={15} /></a></div> : <><div className="github-dialog-head"><div className="github-mark"><Github size={22} /></div><div><span className="eyebrow">STREETFORGE // SOURCE CONTROL</span><h2>GITHUB<br />IMPORT</h2></div></div><p className="github-intro">Übertrage den aktuellen StreetForge-Vertical-Slice in das vorgegebene Repository. Der Import wird auf einen neuen Branch geschrieben und als <b>Draft Pull Request</b> vorbereitet.</p><div className="repo-card"><div className="repo-icon"><Github size={18} /></div><div><span>TARGET REPOSITORY</span><strong>OuroborosCollective/<b>StreetForge_Ouroboros</b></strong>{importStatus.data ? <em>{importStatus.data.fileCount} TEXTDATEIEN · BASIS: {importStatus.data.defaultBranch.toUpperCase()}{importStatus.data.isEmpty ? " · LEERES REPOSITORY" : ""}</em> : <em>{importStatus.isLoading ? "REPOSITORY WIRD GEPRÜFT" : "VERBINDUNG BEREIT"}</em>}</div><ShieldCheck size={18} /></div><div className="import-steps"><div><span>01</span><p>Branch erzeugen</p></div><i /><div><span>02</span><p>Projekt-Snapshot übertragen</p></div><i /><div><span>03</span><p>Draft PR anlegen</p></div></div>{!isAuthenticated && !authLoading ? <button className="login-github" onClick={startLogin}><Shield size={16} /> MIT MANUS ANMELDEN, UM FORTZUFAHREN</button> : <label className={`import-confirm ${importConfirmed ? "checked" : ""}`}><input type="checkbox" checked={importConfirmed} onChange={(event) => setImportConfirmed(event.target.checked)} /><span>Ich bestätige den Push des aktuellen StreetForge-Projektstands in dieses Repository. Es wird kein Hauptbranch überschrieben.</span></label>}{stageImport.error && <p className="github-error">{stageImport.error.message === "You do not have required permission (10002)" ? "Dein Manus-Konto benötigt für diesen Import die Administratorrolle." : stageImport.error.message}</p>}<button className="forge-button github-submit" onClick={stageGitHubImport} disabled={!isAuthenticated || !importConfirmed || stageImport.isPending || importStatus.isError}>{stageImport.isPending ? <LoaderCircle className="spin" size={16} /> : <GitPullRequestDraft size={16} />}<b>{stageImport.isPending ? "IMPORT WIRD VORBEREITET" : "BRANCH & DRAFT PR ERSTELLEN"}</b></button><small className="github-note">Der GitHub-Token bleibt serverseitig. Keine Zugangsdaten werden an den Browser übertragen.</small></>}
      </section>
    </div>
  </div>;
}
