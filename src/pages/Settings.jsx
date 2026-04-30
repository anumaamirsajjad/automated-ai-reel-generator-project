import { useState, useEffect } from "react";
import { buildApiUrl } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [initialProfile, setInitialProfile] = useState({ email: "", username: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'email'|'username'|'avatar'|'password'
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const getStoredUser = () => user || JSON.parse(localStorage.getItem("user") || "null") || {};
  const buildAuthHeaders = (token, includeJson = false) => {
    const currentUser = getStoredUser();
    const headers = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    if (currentUser?.id) headers["X-User-Id"] = String(currentUser.id);
    return headers;
  };

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return buildApiUrl(url);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("authToken");
      const localUser = user || JSON.parse(localStorage.getItem("user") || "null") || {};

      // Show known local values immediately so Settings never looks empty.
      setEmail(localUser.email || "");
      setUsername(localUser.username || "");
      setInitialProfile({
        email: localUser.email || "",
        username: localUser.username || "",
        profilePicture: localUser.profilePicture || null,
      });
      setAvatarPreview(resolveMediaUrl(localUser.profilePicture || null));

      if (!token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetch(buildApiUrl("/api/user"), {
          method: "GET",
          headers: buildAuthHeaders(token),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setMessage({ type: "error", text: err.error || err.message || "Could not refresh profile from server." });
          return;
        }
        const data = await res.json();
        const u = data.user || {};
        setEmail(u.email || "");
        setUsername(u.username || "");
        setInitialProfile({ email: u.email || "", username: u.username || "", profilePicture: u.profilePicture || null });
        setAvatarPreview(resolveMediaUrl(u.profilePicture || null));
      } catch (err) {
        setMessage({ type: "error", text: "Unable to load profile. Check backend connection." });
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setMessage({ type: "error", text: "Not authenticated" });
      setSaving(false);
      return;
    }

    try {
      // Update profile
      const profileRes = await fetch(buildApiUrl("/api/user"), {
        method: "PUT",
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({ email: email.trim(), username: username.trim() }),
      });

      const profileJson = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) {
        setMessage({ type: "error", text: profileJson.error || profileJson.message || "Failed to update profile" });
        setSaving(false);
        return;
      }

      // If password change requested
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: "error", text: "New password and confirmation do not match" });
          setSaving(false);
          return;
        }

        const pwRes = await fetch(buildApiUrl("/api/user/password"), {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword }),
        });

        const pwJson = await pwRes.json().catch(() => ({}));
        if (!pwRes.ok) {
          setMessage({ type: "error", text: pwJson.error || pwJson.message || "Failed to change password" });
          setSaving(false);
          return;
        }
      }

      // Update auth context & localStorage user snapshot
      const updatedUser = profileJson.user || { username, email };
      const existingToken = localStorage.getItem("authToken");
      try {
        login(updatedUser, existingToken);
      } catch {
        // fallback: update localStorage manually
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setMessage({ type: "success", text: "Profile saved" });
      const newPic = profileJson && profileJson.user && profileJson.user.profilePicture ? profileJson.user.profilePicture : initialProfile.profilePicture;
      setInitialProfile({ email: updatedUser.email || email, username: updatedUser.username || username, profilePicture: newPic });
      setAvatarPreview(resolveMediaUrl(newPic || avatarPreview));
      setEditing(false);
      setEditingField(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEmail(initialProfile.email || "");
    setUsername(initialProfile.username || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    setEditing(false);
    setEditingField(null);
  };

  const handleStartEditField = (field) => {
    setEditing(true);
    setEditingField(field);
    setMessage(null);
  };

  const passwordStrength = (pw) => {
    if (!pw) return { score: 0, label: 'Too short' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[Math.min(score, labels.length - 1)] };
  };

  return (
    <div style={{ padding: 28, maxWidth: 720, margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#1E3A8A", letterSpacing: "-0.5px" }}>Profile</h1>
      <p style={{ color: "#1E40AF", marginTop: 6, fontWeight: 600, fontSize: 15, letterSpacing: "0.5px" }}>Edit your email, name, and password.</p>

      {loadingProfile && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#E0F2FE", color: "#1E3A8A", fontWeight: 600 }}>
          Loading profile...
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: message.type === "error" ? "#fee2e2" : "#ecfdf5",
            color: message.type === "error" ? "#991b1b" : "#065f46",
            border: message.type === "error" ? "2px solid #fca5a5" : "2px solid #a7f3d0",
            fontWeight: 600,
            fontSize: 14
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: 12, overflow: 'hidden', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1DB5E6' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: 28 }}>🙂</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Profile Picture</div>
            <div style={{ marginTop: 6 }}>
              <button type="button" onClick={() => handleStartEditField('avatar')} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A', letterSpacing: '0.5px' }}>Edit</button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Gmail</div>
            <div style={{ fontSize: 15, color: '#111827', marginTop: 6, fontWeight: 600 }}>{initialProfile.email || email || '—'}</div>
          </div>
          <div>
            <button type="button" onClick={() => handleStartEditField('email')} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A', letterSpacing: '0.5px' }}>Edit</button>
          </div>
        </div>

        {/* Name */}
        <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Name</div>
            <div style={{ fontSize: 15, color: '#111827', marginTop: 6, fontWeight: 600 }}>{initialProfile.username || username || '—'}</div>
          </div>
          <div>
            <button type="button" onClick={() => handleStartEditField('username')} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A', letterSpacing: '0.5px' }}>Edit</button>
          </div>
        </div>

        {/* Password */}
        <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Password</div>
            <div style={{ fontSize: 15, color: '#111827', marginTop: 6, fontWeight: 600 }}>••••••••</div>
          </div>
          <div>
            <button type="button" onClick={() => handleStartEditField('password')} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A', letterSpacing: '0.5px' }}>Change Password</button>
          </div>
        </div>

        {/* Editing panels */}
            {editingField === 'avatar' && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6' }}>
                <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Upload Profile Picture</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = URL.createObjectURL(f);
                  setAvatarPreview(url);
                  setAvatarFile(f);
                  setMessage(null);
                }} style={{ marginTop: 8 }} />
                {avatarPreview && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 88, height: 88, borderRadius: 8, overflow: 'hidden', background: '#E0F2FE', border: '2px solid #1DB5E6' }}>
                      <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(resolveMediaUrl(initialProfile.profilePicture || null)); setEditingField(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A' }}>Cancel</button>
                      <button type="button" onClick={async () => {
                        if (!avatarFile) { setMessage({ type: 'error', text: 'Select an image first' }); return; }
                        const token = localStorage.getItem('authToken');
                        if (!token) { setMessage({ type: 'error', text: 'Not authenticated' }); return; }
                        const form = new FormData(); form.append('file', avatarFile, avatarFile.name);
                        setSaving(true); setMessage(null);
                        try {
                          const res = await fetch(buildApiUrl('/api/user/avatar'), { method: 'POST', headers: buildAuthHeaders(token), body: form });
                          const j = await res.json().catch(()=>({}));
                          if (!res.ok) { setMessage({ type: 'error', text: j.error || 'Upload failed' }); return; }
                          const pic = j.profilePicture;
                          setAvatarPreview(resolveMediaUrl(pic));
                          const existingToken = localStorage.getItem('authToken');
                          const curUser = JSON.parse(localStorage.getItem('user') || '{}');
                          const updatedUser = { ...curUser, profilePicture: pic };
                          try { login(updatedUser, existingToken); } catch { localStorage.setItem('user', JSON.stringify(updatedUser)); }
                          setInitialProfile(prev => ({ ...prev, profilePicture: pic }));
                          setMessage({ type: 'success', text: 'Avatar uploaded' });
                          setAvatarFile(null);
                          setEditingField(null);
                        } catch (err) { setMessage({ type: 'error', text: 'Upload failed' }); }
                        finally { setSaving(false); }
                      }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #1DB5E6, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Upload</button>
                    </div>
                  </div>
                )}
              </div>
            )}

        {editingField === 'email' && (
          <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6' }}>
            <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Gmail (email)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: '2px solid #1DB5E6', marginTop: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#f0f7ff', fontWeight: 500 }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleCancel} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A' }}>Cancel</button>
              <button type="button" onClick={async (e) => { e.preventDefault(); await handleSave(e); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #1DB5E6, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}

        {editingField === 'username' && (
          <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6' }}>
            <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Name</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: '2px solid #1DB5E6', marginTop: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#f0f7ff', fontWeight: 500 }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleCancel} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A' }}>Cancel</button>
              <button type="button" onClick={async (e) => { e.preventDefault(); await handleSave(e); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #1DB5E6, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}

        {editingField === 'password' && (
          <div style={{ padding: 12, borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6' }}>
            <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '2px solid #1DB5E6', marginTop: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#f0f7ff', fontWeight: 500 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '2px solid #1DB5E6', marginTop: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#f0f7ff', fontWeight: 500 }} />
                <div style={{ fontSize: 13, color: '#1E40AF', marginTop: 6, fontWeight: 600 }}>Minimum 6 characters. Use mixed case, numbers, symbols for stronger password.</div>
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700, letterSpacing: '0.5px' }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '2px solid #1DB5E6', marginTop: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#f0f7ff', fontWeight: 500 }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 700 }}>Strength: <span style={{ fontWeight: 900, color: '#2563EB' }}>{passwordStrength(newPassword).label}</span></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleCancel} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '2px solid #1DB5E6', cursor: 'pointer', fontWeight: 700, color: '#1E3A8A' }}>Cancel</button>
              <button type="button" onClick={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('authToken');
                  if (!token) { setMessage({ type: 'error', text: 'Not authenticated' }); return; }
                  if (!currentPassword || !newPassword) { setMessage({ type: 'error', text: 'Fill passwords' }); return; }
                  if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Passwords do not match' }); return; }
                  if (newPassword.length < 6) { setMessage({ type: 'error', text: 'New password must be at least 6 characters' }); return; }
                  setSaving(true);
                  try {
                    const res = await fetch(buildApiUrl('/api/user/password'), { method: 'PUT', headers: buildAuthHeaders(token, true), body: JSON.stringify({ currentPassword, newPassword }) });
                    const j = await res.json().catch(()=>({}));
                    if (!res.ok) { setMessage({ type: 'error', text: j.error || 'Failed to change password' }); return; }
                    setMessage({ type: 'success', text: 'Password changed' });
                    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setEditingField(null);
                  } catch (err) { setMessage({ type: 'error', text: 'Unexpected error' }); }
                  finally { setSaving(false); }
              }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #1DB5E6, #2563EB)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }} disabled={saving}>Change</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


