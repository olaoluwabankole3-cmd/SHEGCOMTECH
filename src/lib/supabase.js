// Compatibility adapter: keeps the existing React screens intact while the backend moves to Cloudflare Pages Functions.
const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: "same-origin", ...options, headers: { Accept: "application/json", ...(options.headers || {}) } });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
  return data;
};
const listeners = new Set();
let currentSession = null;
let sessionChecked = false;
const notify = (event, session) => listeners.forEach(callback => callback(event, session));
async function getSession() {
  if (!sessionChecked) {
    try { const data = await api("/api/auth/session"); currentSession = data.authenticated ? { user: { id: data.email, email: data.email } } : null; }
    catch { currentSession = null; }
    sessionChecked = true;
  }
  return { data: { session: currentSession }, error: null };
}
class Query {
  constructor(table) { this.table = table; this.action = "select"; this.payload = null; this.filters = []; this.orders = []; this.single = false; }
  select() { return this; }
  eq(column, value) { this.filters.push([column, value]); return this; }
  order(column, options = {}) { this.orders.push([column, options.ascending !== false]); return this; }
  maybeSingle() { this.single = true; return this.execute(); }
  insert(payload) { this.action = "insert"; this.payload = payload; return this; }
  update(payload) { this.action = "update"; this.payload = payload; return this; }
  delete() { this.action = "delete"; return this; }
  async execute() {
    try {
      if (this.table === "admin_users") { const session = await getSession(); return { data: session.data.session ? { user_id: session.data.session.user.id } : null, error: null }; }
      if (this.table !== "products") throw new Error("Unsupported data table.");
      let data;
      if (this.action === "insert") data = await api("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(this.payload) });
      else if (this.action === "update" || this.action === "delete") {
        const id = this.filters.find(([column]) => column === "id")?.[1];
        if (!id) throw new Error("A product ID is required.");
        data = this.action === "delete" ? await api("/api/products/" + encodeURIComponent(id), { method: "DELETE" }) : await api("/api/products/" + encodeURIComponent(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(this.payload) });
      } else {
        const adminList = !this.filters.some(([column, value]) => column === "is_active" && value === true);
        data = await api("/api/products" + (adminList ? "?all=1" : ""));
        for (const [column, value] of this.filters) data = data.filter(row => String(row[column]) === String(value));
        for (const [column, ascending] of [...this.orders].reverse()) data.sort((a,b) => { const left = a[column] ?? "", right = b[column] ?? ""; return (left < right ? -1 : left > right ? 1 : 0) * (ascending ? 1 : -1); });
      }
      return { data: this.single && Array.isArray(data) ? (data[0] || null) : (data ?? null), error: null };
    } catch (error) { return { data: null, error }; }
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}
export const supabaseConfigured = true;
export const supabase = {
  auth: {
    getSession,
    onAuthStateChange(callback) { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }; },
    async signInWithPassword({ email, password }) {
      try { const data = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); currentSession = { user: { id: data.email, email: data.email } }; sessionChecked = true; notify("SIGNED_IN", currentSession); return { data: { session: currentSession }, error: null }; }
      catch (error) { return { data: { session: null }, error }; }
    },
    async signOut() { try { await api("/api/auth/session", { method: "DELETE" }); } catch {} currentSession = null; sessionChecked = true; notify("SIGNED_OUT", null); return { error: null }; }
  },
  from(table) { return new Query(table); },
  storage: { from() { return {
    async upload(_path, file) { try { const data = await api("/api/images/upload", { method: "POST", headers: { "Content-Type": file.type }, body: file }); return { data: { path: data.key }, error: null }; } catch (error) { return { data: null, error }; } },
    getPublicUrl(path) { return { data: { publicUrl: "/api/images/" + encodeURIComponent(path) } }; },
    async remove(paths) { try { await api("/api/images/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keys: paths }) }); return { data: [], error: null }; } catch (error) { return { data: null, error }; } }
  }; } }
};
