"use client";

/**
 * ForThePeople.in — API Key Vault tab
 * Gated by a separate 10-minute TOTP session (ftp_vault_session cookie).
 * Reveals are rate-limited per session and auto-hidden after 30s client-side.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface VaultKey {
  id: string;
  provider: string;
  envVarName: string | null;
  maskedKey: string | null;
  label: string | null;
  notes: string | null;
  isActive: boolean;
  lastTestedAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EnvRef {
  name: string;
  inVault: boolean;
  inEnvironment: boolean;
}

interface SessionStatus {
  unlocked: boolean;
  remainingSeconds: number;
  reveals: number;
  maxReveals: number;
  ttl: number;
}

const VAULT_HELP =
  "The API Key Vault stores API keys encrypted with AES-256. Access requires a 2FA code and auto-locks after 10 minutes. Key reveals are rate-limited and every view is audit-logged. Keys here are for reference — your app reads from Vercel env vars at runtime.";

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

export default function VaultTab() {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [keys, setKeys] = useState<VaultKey[]>([]);
  const [envReference, setEnvReference] = useState<EnvRef[]>([]);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(() => {
    fetch("/api/admin/vault/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SessionStatus | null) => d && setStatus(d))
      .catch(() => {});
  }, []);

  const loadKeys = useCallback(() => {
    fetch("/api/admin/vault")
      .then((r) => {
        if (r.status === 403) return null;
        return r.ok ? r.json() : null;
      })
      .then((d: { keys: VaultKey[]; envReference: EnvRef[] } | null) => {
        if (d) {
          setKeys(d.keys ?? []);
          setEnvReference(d.envReference ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    checkSession();
    loadKeys();
    const interval = setInterval(checkSession, 15_000);
    return () => clearInterval(interval);
  }, [checkSession, loadKeys]);

  const lockNow = async () => {
    await fetch("/api/admin/vault/session", { method: "DELETE" });
    setStatus({ unlocked: false, remainingSeconds: 0, reveals: 0, maxReveals: 5, ttl: 600 });
    setKeys([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
          🔐 API Key Vault
        </h2>
        <ModuleHelp text={VAULT_HELP} size={14} />
      </div>

      {!status?.unlocked ? (
        <VaultGate
          onUnlocked={() => {
            checkSession();
            loadKeys();
          }}
        />
      ) : (
        <>
          <SessionBadge status={status} onLock={lockNow} />
          {loading ? (
            <div style={{ ...card, fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
              Loading keys...
            </div>
          ) : (
            <>
              <KeyList
                keys={keys}
                reloadKeys={loadKeys}
                refreshSession={checkSession}
                status={status}
              />
              <AddKeyForm onSaved={loadKeys} />
              <EnvReference envReference={envReference} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function VaultGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: code.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setCode("");
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        ...card,
        maxWidth: 400,
        margin: "0 auto",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 32 }}>🔐</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: "#1A1A1A" }}>
        Unlock API Key Vault
      </div>
      <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4, marginBottom: 16 }}>
        Enter your Google Authenticator code. Session lasts 10 minutes.
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          name="code"
          placeholder="000 000"
          inputMode="numeric"
          autoFocus
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            padding: "12px 14px",
            border: "1.5px solid #E8E8E4",
            borderRadius: 8,
            fontSize: 24,
            letterSpacing: "0.3em",
            textAlign: "center",
            fontFamily: "monospace",
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 0",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Unlocking..." : "Unlock Vault"}
        </button>
      </form>
      {error && (
        <div
          style={{
            marginTop: 10,
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 14 }}>
        If 2FA isn&apos;t enabled, set it up in Access &amp; 2FA first.
      </div>
    </div>
  );
}

function SessionBadge({ status, onLock }: { status: SessionStatus; onLock: () => void }) {
  const [remaining, setRemaining] = useState(status.remainingSeconds);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(status.remainingSeconds);
  }, [status.remainingSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#DCFCE7",
        border: "1px solid #BBF7D0",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
        color: "#166534",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <LockOpen size={14} />
        <strong>Vault unlocked</strong>
        <span style={{ color: "#15803D" }}>
          · locks in {mm}:{ss} · {status.reveals}/{status.maxReveals} reveals used
        </span>
      </span>
      <button
        onClick={onLock}
        style={{
          background: "#fff",
          color: "#166534",
          border: "1px solid #BBF7D0",
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Lock size={10} /> Lock now
      </button>
    </div>
  );
}

function KeyList({
  keys,
  reloadKeys,
  refreshSession,
  status,
}: {
  keys: VaultKey[];
  reloadKeys: () => void;
  refreshSession: () => void;
  status: SessionStatus;
}) {
  if (keys.length === 0) {
    return (
      <div style={{ ...card, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
        No keys stored yet. Add one below, or run <code>scripts/seed-vault-keys.ts</code>.
      </div>
    );
  }
  const revealsLeft = status.maxReveals - status.reveals;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {keys.map((k) => (
        <KeyRow
          key={k.id}
          k={k}
          onMutated={() => {
            reloadKeys();
            refreshSession();
          }}
          revealsLeft={revealsLeft}
        />
      ))}
    </div>
  );
}

function KeyRow({
  k,
  onMutated,
  revealsLeft,
}: {
  k: VaultKey;
  onMutated: () => void;
  revealsLeft: number;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(k.label ?? "");
  const [notes, setNotes] = useState(k.notes ?? "");
  const [envVarName, setEnvVarName] = useState(k.envVarName ?? "");
  const [isActive, setIsActive] = useState(k.isActive);
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, []);

  const reveal = async () => {
    setRevealing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vault/${k.id}/reveal`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setRevealed(json.key);
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
      autoHideRef.current = setTimeout(() => setRevealed(null), (json.expiresInSeconds ?? 30) * 1000);
      onMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal");
    } finally {
      setRevealing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        label: label || null,
        notes: notes || null,
        envVarName: envVarName || null,
        isActive,
      };
      if (newKey.trim()) payload.key = newKey.trim();
      const res = await fetch(`/api/admin/vault/${k.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditing(false);
      setNewKey("");
      onMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete the ${k.provider} key permanently?`)) return;
    await fetch(`/api/admin/vault/${k.id}`, { method: "DELETE" });
    onMutated();
  };

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            {k.label ?? k.provider}
            {!k.isActive && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: "#F3F4F6",
                  color: "#6B6B6B",
                  padding: "1px 5px",
                  marginLeft: 6,
                  borderRadius: 3,
                }}
              >
                INACTIVE
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6B6B6B",
              marginTop: 2,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {revealed ?? k.maskedKey ?? "••••••••"}
          </div>
          {k.envVarName && (
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
              Env: <code>{k.envVarName}</code>
            </div>
          )}
          {k.lastAccessedAt && (
            <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>
              Last revealed {formatDistanceToNow(new Date(k.lastAccessedAt), { addSuffix: true })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {revealed ? (
            <button
              onClick={() => setRevealed(null)}
              style={iconBtn}
              title="Hide"
            >
              <EyeOff size={14} />
            </button>
          ) : (
            <button
              onClick={reveal}
              disabled={revealing || revealsLeft <= 0}
              style={{
                ...iconBtn,
                opacity: revealsLeft <= 0 ? 0.4 : 1,
                cursor: revealsLeft <= 0 ? "not-allowed" : "pointer",
              }}
              title={
                revealsLeft <= 0 ? "Reveal limit reached for this session" : "Reveal (auto-hides in 30s)"
              }
            >
              <Eye size={14} />
            </button>
          )}
          <button onClick={() => setEditing((e) => !e)} style={iconBtn} title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={remove} style={{ ...iconBtn, color: "#DC2626" }} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editing && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#FAFAF8",
            borderRadius: 6,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <FormField label="Label">
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={input} />
          </FormField>
          <FormField label="Env var name">
            <input
              value={envVarName}
              onChange={(e) => setEnvVarName(e.target.value)}
              placeholder="OPENROUTER_API_KEY"
              style={input}
            />
          </FormField>
          <FormField label="Notes" full>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...input, resize: "vertical" }}
            />
          </FormField>
          <FormField label="Replace key (leave blank to keep)" full>
            <input
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={input}
              placeholder="Paste new value"
            />
          </FormField>
          <label
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ accentColor: "#2563EB" }}
            />
            Active
          </label>
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: "5px 10px",
                background: "#fff",
                color: "#6B6B6B",
                border: "1px solid #E8E8E4",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "5px 10px",
                background: "#16A34A",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 6,
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function AddKeyForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [envVarName, setEnvVarName] = useState("");
  const [label, setLabel] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setProvider("");
    setEnvVarName("");
    setLabel("");
    setKeyValue("");
    setNotes("");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim() || !keyValue.trim()) {
      setError("Provider and key value required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.trim(),
          envVarName: envVarName.trim() || null,
          key: keyValue.trim(),
          label: label.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      reset();
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "6px 12px",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Plus size={12} /> Add Key
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
    >
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Add new key</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "#6B6B6B", cursor: "pointer" }}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      <FormField label="Provider slug *">
        <input
          required
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="openrouter"
          style={input}
        />
      </FormField>
      <FormField label="Env var name">
        <input
          value={envVarName}
          onChange={(e) => setEnvVarName(e.target.value)}
          placeholder="OPENROUTER_API_KEY"
          style={input}
        />
      </FormField>
      <FormField label="Label">
        <input value={label} onChange={(e) => setLabel(e.target.value)} style={input} />
      </FormField>
      <FormField label="Key value *" full>
        <input
          type="password"
          required
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          style={input}
        />
      </FormField>
      <FormField label="Notes" full>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...input, resize: "vertical" }}
        />
      </FormField>
      {error && (
        <div
          style={{
            gridColumn: "1 / -1",
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: "6px 12px",
            background: "#fff",
            color: "#6B6B6B",
            border: "1px solid #E8E8E4",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "6px 12px",
            background: "#16A34A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          Save
        </button>
      </div>
    </form>
  );
}

function EnvReference({ envReference }: { envReference: EnvRef[] }) {
  if (envReference.length === 0) return null;
  return (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
        Env Variable Reference
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {envReference.map((e) => {
          const status = e.inVault
            ? { label: "In vault", color: "#16A34A", icon: "✅" }
            : e.inEnvironment
            ? { label: "Set in Vercel (not in vault)", color: "#D97706", icon: "⚠️" }
            : { label: "Not configured", color: "#DC2626", icon: "❌" };
          return (
            <div
              key={e.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                padding: "3px 0",
              }}
            >
              <span style={{ width: 16 }}>{status.icon}</span>
              <code
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#1A1A1A",
                  flex: 1,
                }}
              >
                {e.name}
              </code>
              <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 8 }}>
        <CheckCircle2 size={10} style={{ display: "inline", marginRight: 3 }} />
        The app reads runtime keys from Vercel env vars — the vault is a managed reference.
      </div>
    </div>
  );
}

function FormField({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <span style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  padding: 5,
  cursor: "pointer",
  color: "#6B6B6B",
  display: "inline-flex",
  alignItems: "center",
};

const input: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 13,
  background: "#FAFAF8",
};
