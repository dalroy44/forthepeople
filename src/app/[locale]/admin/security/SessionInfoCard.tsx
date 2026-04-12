"use client";

/**
 * Current session + audit log + team members cards, rendered above the
 * existing 2FA setup UI on the Security page.
 */

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Download, LogOut, Plus, Shield, UserCog, X } from "lucide-react";

interface AuthInfo {
  totpEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  backupCodeCount: number;
}

interface AdminUserRow {
  id: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIP: string | null;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  actorLabel: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
  marginBottom: 16,
};

export default function SecurityExtras({ locale }: { locale: string }) {
  return (
    <div>
      <SessionCard locale={locale} />
      <TeamMembersCard />
      <AuditLogCard />
    </div>
  );
}

function SessionCard({ locale }: { locale: string }) {
  const [auth, setAuth] = useState<AuthInfo | null>(null);

  useEffect(() => {
    fetch("/api/admin/security")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AuthInfo | null) => d && setAuth(d))
      .catch(() => {});
  }, []);

  const loginMethod = auth?.totpEnabled ? "Password + 2FA" : "Password only";

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Shield size={16} color="#2563EB" />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
          Current Session
        </h3>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          fontSize: 12,
        }}
      >
        <Info label="Logged in as" value="Admin (Owner)" />
        <Info label="Login method" value={loginMethod} />
        <Info
          label="Last login"
          value={
            auth?.lastLoginAt
              ? `${formatDistanceToNow(new Date(auth.lastLoginAt), { addSuffix: true })}`
              : "—"
          }
        />
        <Info label="Last IP" value={auth?.lastLoginIp ?? "—"} />
        <Info
          label="2FA status"
          value={
            auth?.totpEnabled ? (
              <span style={{ color: "#16A34A", fontWeight: 600 }}>✅ Enabled</span>
            ) : (
              <span style={{ color: "#D97706", fontWeight: 600 }}>Disabled</span>
            )
          }
        />
        <Info
          label="Backup codes"
          value={auth ? `${auth.backupCodeCount} remaining` : "—"}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <form action={`/${locale}/admin?logout=1`}>
          {/* Logout form posts to the existing logout action via admin sidebar too, but we link here for discoverability */}
        </form>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#9B9B9B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#1A1A1A", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function TeamMembersCard() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { users: AdminUserRow[] } | null) => d && setUsers(d.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserCog size={16} color="#7C3AED" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
            Team Members
          </h3>
          <span style={{ fontSize: 11, color: "#9B9B9B" }}>
            · foundation only — per-user login is future work
          </span>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{
            padding: "5px 10px",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Plus size={11} /> Add user
        </button>
      </div>

      {showAdd && <AddUserForm onClose={() => setShowAdd(false)} onSaved={load} />}

      {loading ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>Loading...</div>
      ) : users.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>
          No users yet. Legacy auth uses ADMIN_PASSWORD; added users are stored but don&apos;t yet
          gate login.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
              <th style={th}>Username</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              <th style={th}>Last login</th>
              <th style={th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F5F5F0" }}>
                <td style={{ padding: "5px 8px", fontWeight: 500, color: "#1A1A1A" }}>
                  {u.username}
                  {u.email && <span style={{ color: "#9B9B9B", marginLeft: 4 }}>· {u.email}</span>}
                </td>
                <td style={{ padding: "5px 8px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 3,
                      background:
                        u.role === "owner"
                          ? "#EDE9FE"
                          : u.role === "admin"
                          ? "#DBEAFE"
                          : "#F3F4F6",
                      color:
                        u.role === "owner"
                          ? "#7C3AED"
                          : u.role === "admin"
                          ? "#2563EB"
                          : "#4B5563",
                    }}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "5px 8px", color: u.isActive ? "#16A34A" : "#9B9B9B" }}>
                  {u.isActive ? "Active" : "Inactive"}
                </td>
                <td style={{ padding: "5px 8px", color: "#6B6B6B" }}>
                  {u.lastLoginAt
                    ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })
                    : "Never"}
                </td>
                <td style={{ padding: "5px 8px", color: "#9B9B9B", fontSize: 11 }}>
                  {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 10 }}>
        Roles: <strong>Owner</strong> (all access, vault + users), <strong>Admin</strong> (no vault/users),{" "}
        <strong>Viewer</strong> (Dashboard / Health / Analytics / Traffic only).
      </div>
    </div>
  );
}

function AddUserForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim() || null,
          password,
          role,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        background: "#FAFAF8",
        padding: 12,
        borderRadius: 6,
        marginBottom: 10,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr auto",
        gap: 8,
        alignItems: "end",
      }}
    >
      <Field label="Username *">
        <input
          required
          minLength={3}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={input}
        />
      </Field>
      <Field label="Email">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
      </Field>
      <Field label="Temp password (≥8) *">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />
      </Field>
      <Field label="Role">
        <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </Field>
      {error && (
        <div
          style={{
            gridColumn: "1 / -1",
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
          onClick={onClose}
          style={{
            padding: "5px 10px",
            background: "#fff",
            color: "#6B6B6B",
            border: "1px solid #E8E8E4",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <X size={10} /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "5px 10px",
            background: "#16A34A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Create user"}
        </button>
      </div>
    </form>
  );
}

function AuditLogCard() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", page: String(Math.floor(offset / 50) + 1) });
    if (action !== "all") params.set("action", action);
    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: { entries: AuditEntry[]; total: number } | null) => {
          if (d) {
            setEntries(d.entries);
            setTotal(d.total);
          }
        }
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [action, offset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const exportCsv = () => {
    const rows = [
      ["timestamp", "actor", "action", "resource", "resourceId", "ip", "details"],
      ...entries.map((e) => [
        e.timestamp,
        e.actorLabel ?? "",
        e.action,
        e.resource ?? "",
        e.resourceId ?? "",
        e.ipAddress ?? "",
        e.details ? JSON.stringify(e.details) : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""').replace(/\n/g, " ")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftp-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ACTIONS = useMemoActions(entries);

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <LogOut size={16} color="#D97706" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
            Audit Log
          </h3>
          <span style={{ fontSize: 11, color: "#9B9B9B" }}>
            · {total.toLocaleString("en-IN")} entries
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={action}
            onChange={(e) => {
              setOffset(0);
              setAction(e.target.value);
            }}
            style={{ ...input, padding: "4px 8px", fontSize: 11 }}
          >
            <option value="all">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            style={{
              padding: "4px 10px",
              background: "#fff",
              color: "#16A34A",
              border: "1px solid #BBF7D0",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Download size={10} /> CSV
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9B9B9B" }}>No audit entries yet.</div>
      ) : (
        <div style={{ maxHeight: 400, overflow: "auto", fontSize: 11 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
              <tr style={{ borderBottom: "1px solid #E8E8E4" }}>
                <th style={{ ...th, fontSize: 10 }}>Time</th>
                <th style={{ ...th, fontSize: 10 }}>Actor</th>
                <th style={{ ...th, fontSize: 10 }}>Action</th>
                <th style={{ ...th, fontSize: 10 }}>Resource</th>
                <th style={{ ...th, fontSize: 10 }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #F5F5F0" }}>
                  <td style={{ padding: "4px 6px", color: "#6B6B6B", whiteSpace: "nowrap" }}>
                    {new Date(e.timestamp).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td style={{ padding: "4px 6px", color: "#1A1A1A", fontWeight: 500 }}>
                    {e.actorLabel ?? "system"}
                  </td>
                  <td style={{ padding: "4px 6px", color: "#2563EB", fontWeight: 600 }}>
                    {e.action}
                  </td>
                  <td style={{ padding: "4px 6px", color: "#6B6B6B" }}>
                    {e.resource ?? "—"}
                    {e.resourceId && (
                      <span style={{ color: "#9B9B9B", marginLeft: 3 }}>
                        #{e.resourceId.slice(-6)}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "4px 6px",
                      color: "#9B9B9B",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {e.ipAddress ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {entries.length > 0 && total > entries.length && (
        <button
          onClick={() => setOffset((o) => o + 50)}
          style={{
            marginTop: 8,
            padding: "4px 10px",
            background: "#fff",
            color: "#2563EB",
            border: "1px solid #DBEAFE",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Load older
        </button>
      )}
    </div>
  );
}

function useMemoActions(entries: AuditEntry[]): string[] {
  // Simple unique-actions list, derived from current page.
  const set = new Set<string>();
  for (const e of entries) set.add(e.action);
  return Array.from(set).sort();
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: "#6B6B6B", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "5px 8px",
  color: "#9B9B9B",
  fontWeight: 600,
  fontSize: 11,
};

const input: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 12,
  background: "#fff",
};
