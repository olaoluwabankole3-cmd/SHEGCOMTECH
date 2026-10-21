import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck,
  Boxes, Check, CheckCircle2, ChevronDown, CircleDollarSign, ExternalLink,
  Eye, EyeOff, FileImage, Filter, LayoutDashboard, LoaderCircle, LockKeyhole,
  LogOut, Package, Pencil, Plus, Search, ShieldCheck, ShoppingBag, Star,
  Trash2, UploadCloud, X
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase.js";
import "./admin.css";

const PRODUCT_CATEGORIES = [
  "Laptops", "Monitors", "Phones", "CCTV & security", "Gaming",
  "Appliances", "Networking", "Printers & supplies", "Accessories"
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const currency = value => value == null || value === "" ? "Price on request" : "₦" + Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 });
const slugify = value => String(value || "").normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const emptyProduct = () => ({
  name: "", brand: "", sku: "", category: "Laptops", description: "",
  price: "", comparePrice: "", stock: "0", badge: "", isFeatured: false,
  isActive: true, imageUrl: "", imagePath: ""
});

function BrandMark() {
  return <span className="admin-brand-mark"><i /><i /><i /></span>;
}

function SetupScreen() {
  return <main className="admin-gate">
    <div className="gate-brand"><BrandMark /><span>SHEGCOM<span>TECH</span></span></div>
    <div className="gate-card">
      <span className="gate-icon"><LockKeyhole size={24} /></span>
      <span className="admin-overline">ADMIN CONNECTION REQUIRED</span>
      <h1>Connect the catalogue.</h1>
      <p>The admin interface connects to Cloudflare Pages Functions, with product records stored in D1 and product images stored in R2.</p>
      <div className="setup-step"><span>01</span><div><strong>Run the database setup</strong><small>Confirm the <code>SHEGCOMTECH_DB</code> D1 binding points to <code>shegcomtech-db</code>.</small></div></div>
      <div className="setup-step"><span>02</span><div><strong>Add Cloudflare variables</strong><small>Set the server-side <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> secrets in Cloudflare Pages, then redeploy.</small></div></div>
      <a className="admin-primary-link" href="https://dash.cloudflare.com/ target="_blank" rel="noreferrer">Open Cloudflare <ExternalLink size={15} /></a>
    </div>
    <p className="gate-foot">SHEGCOMTECH · PRIVATE STORE MANAGEMENT</p>
  </main>;
}

function SignInScreen({ onSignIn, busy, error }) {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  return <main className="admin-gate">
    <div className="gate-brand"><BrandMark /><span>SHEGCOM<span>TECH</span></span></div>
    <form className="gate-card signin-card" onSubmit={event => { event.preventDefault(); onSignIn(credentials); }}>
      <span className="gate-icon"><ShieldCheck size={24} /></span>
      <span className="admin-overline">PRIVATE ACCESS</span>
      <h1>Welcome back.</h1>
      <p>Sign in to manage the live store catalogue.</p>
      {error && <div className="admin-alert alert-error"><AlertCircle size={16} />{error}</div>}
      <label className="admin-field">EMAIL ADDRESS<input autoComplete="username" type="email" required value={credentials.email} onChange={event => setCredentials({ ...credentials, email: event.target.value })} placeholder="admin@yourcompany.com" /></label>
      <label className="admin-field">PASSWORD<input autoComplete="current-password" type="password" required value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })} placeholder="Your password" /></label>
      <button className="admin-button primary-button full-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}{busy ? "Signing in…" : "Sign in"}</button>
      <span className="signin-security"><LockKeyhole size={13} /> Access is restricted to approved admin accounts.</span>
    </form>
    <p className="gate-foot">SHEGCOMTECH · PRIVATE STORE MANAGEMENT</p>
  </main>;
}

function ProductEditor({ product, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(() => product ? {
    name: product.name || "", brand: product.brand || "", sku: product.sku || "",
    category: product.category || "Laptops", description: product.description || "",
    price: product.price_ngn == null ? "" : String(product.price_ngn),
    comparePrice: product.compare_at_price_ngn == null ? "" : String(product.compare_at_price_ngn),
    stock: String(product.stock_quantity ?? 0), badge: product.badge || "",
    isFeatured: Boolean(product.is_featured), isActive: Boolean(product.is_active),
    imageUrl: product.image_url || "", imagePath: product.image_path || ""
  } : emptyProduct());
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [preview, setPreview] = useState(product?.image_url || "");

  useEffect(() => {
    if (!imageFile) { setPreview(form.imageUrl || ""); return undefined; }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, form.imageUrl]);

  const patch = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const handleImage = file => {
    setImageError("");
    if (!file) { setImageFile(null); return; }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { setImageError("Use a JPG, PNG, WebP or AVIF image."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setImageError("Image must be 5 MB or smaller."); return; }
    setImageFile(file);
  };

  return <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <form className="product-editor" onSubmit={event => { event.preventDefault(); if (imageError) return; onSave(form, imageFile); }}>
      <header className="editor-header"><div><span className="admin-overline">{product ? "UPDATE LISTING" : "NEW LISTING"}</span><h2>{product ? "Edit product" : "Add a product"}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close editor" disabled={saving}><X size={20} /></button></header>
      {error && <div className="admin-alert alert-error"><AlertCircle size={16} />{error}</div>}
      <div className="editor-body">
        <section className="editor-photo-section">
          <div className="editor-photo-preview">{preview ? <img src={preview} alt="Product preview" /> : <div><FileImage size={32} /><span>Product photo</span></div>}</div>
          <label className="admin-upload-button"><UploadCloud size={16} />{imageFile ? "Choose another image" : preview ? "Replace image" : "Upload product image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => handleImage(event.target.files?.[0] || null)} /></label>
          <small>JPG, PNG, WebP or AVIF · up to 5 MB</small>
          {imageError && <p className="image-error">{imageError}</p>}
        </section>
        <div className="editor-fields">
          <label className="admin-field field-span-two">PRODUCT NAME *<input required minLength="2" maxLength="160" value={form.name} onChange={event => patch("name", event.target.value)} placeholder="e.g. Lenovo ThinkPad E14 Gen 5" /></label>
          <label className="admin-field">BRAND<input value={form.brand} onChange={event => patch("brand", event.target.value)} placeholder="Lenovo" /></label>
          <label className="admin-field">SKU / MODEL CODE<input value={form.sku} onChange={event => patch("sku", event.target.value)} placeholder="THINKPAD-E14" /></label>
          <label className="admin-field">CATEGORY *<span className="admin-select-wrap"><select required value={form.category} onChange={event => patch("category", event.target.value)}>{PRODUCT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select><ChevronDown size={15} /></span></label>
          <label className="admin-field">BADGE<input maxLength="24" value={form.badge} onChange={event => patch("badge", event.target.value)} placeholder="New, Featured, Sale…" /></label>
          <label className="admin-field field-span-two">SHORT DESCRIPTION<textarea rows="3" maxLength="500" value={form.description} onChange={event => patch("description", event.target.value)} placeholder="Key detail customers should know." /></label>
          <div className="editor-divider field-span-two"><span>PRICE & STOCK</span></div>
          <label className="admin-field">SELLING PRICE (NGN)<span className="input-with-prefix"><b>₦</b><input type="number" min="0" step="0.01" value={form.price} onChange={event => patch("price", event.target.value)} placeholder="0.00" /></span><small>Leave blank to show “Price on request”.</small></label>
          <label className="admin-field">COMPARE-AT PRICE (NGN)<span className="input-with-prefix"><b>₦</b><input type="number" min="0" step="0.01" value={form.comparePrice} onChange={event => patch("comparePrice", event.target.value)} placeholder="Optional" /></span><small>Optional previous or regular price.</small></label>
          <label className="admin-field">STOCK QUANTITY<input type="number" required min="0" step="1" value={form.stock} onChange={event => patch("stock", event.target.value)} /></label>
          <div className="field-span-two editor-toggles">
            <label className="admin-toggle"><input type="checkbox" checked={form.isFeatured} onChange={event => patch("isFeatured", event.target.checked)} /><span className="toggle-ui" /><span><strong>Featured product</strong><small>Prioritise it in the storefront.</small></span><Star size={16} /></label>
            <label className="admin-toggle"><input type="checkbox" checked={form.isActive} onChange={event => patch("isActive", event.target.checked)} /><span className="toggle-ui" /><span><strong>Publish to storefront</strong><small>Only published items are public.</small></span><Eye size={16} /></label>
          </div>
        </div>
      </div>
      <footer className="editor-footer"><button type="button" className="admin-button secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="admin-button primary-button" disabled={saving || Boolean(imageError)}>{saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{saving ? "Saving…" : product ? "Save changes" : "Create product"}</button></footer>
    </form>
  </div>;
}

function AdminApp() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [accessState, setAccessState] = useState("checking");
  const [accessError, setAccessError] = useState("");
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [editorError, setEditorError] = useState("");
  const [toast, setToast] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    if (!supabase) { setSessionLoading(false); return undefined; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setSessionLoading(false); }
    }).catch(() => { if (mounted) setSessionLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
      setSignInError("");
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshProducts = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    setProducts(data || []);
  }, []);

  useEffect(() => {
    if (!session) { setAccessState("login"); setProducts([]); return undefined; }
    let current = true;
    const initialiseAdmin = async () => {
      setAccessState("checking");
      setAccessError("");
      try {
        const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
        if (error) throw error;
        if (!data) { setAccessState("denied"); return; }
        await refreshProducts();
        if (current) setAccessState("allowed");
      } catch (error) {
        if (current) { setAccessError(error.message || "Could not load catalogue permissions."); setAccessState("error"); }
      }
    };
    initialiseAdmin();
    return () => { current = false; };
  }, [session, refreshProducts, reloadCounter]);

  const filteredProducts = useMemo(() => products.filter(product => {
    const searchText = [product.name, product.brand, product.sku, product.category, product.description].filter(Boolean).join(" ").toLowerCase();
    return (categoryFilter === "All categories" || product.category === categoryFilter) && searchText.includes(query.trim().toLowerCase());
  }), [products, query, categoryFilter]);

  const signIn = async credentials => {
    setSignInBusy(true); setSignInError("");
    const { error } = await supabase.auth.signInWithPassword({ email: credentials.email.trim(), password: credentials.password });
    if (error) setSignInError(error.message || "Unable to sign in.");
    setSignInBusy(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAccessState("login");
    setProducts([]);
  };

  const openCreate = () => {
    setEditingProduct(null); setEditorError(""); setEditorOpen(true);
  };
  const openEdit = product => {
    setEditingProduct(product); setEditorError(""); setEditorOpen(true);
  };

  const saveProduct = async (form, imageFile) => {
    setSaving(true); setEditorError("");
    let uploadedPath = "";
    const existingImagePath = editingProduct?.image_path || "";
    try {
      if (!form.name.trim()) throw new Error("Product name is required.");
      if (form.price !== "" && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)) throw new Error("Enter a valid non-negative selling price.");
      if (form.comparePrice !== "" && (!Number.isFinite(Number(form.comparePrice)) || Number(form.comparePrice) < 0)) throw new Error("Enter a valid compare-at price.");
      if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) throw new Error("Stock must be a whole number of zero or more.");

      let imageUrl = form.imageUrl || null;
      let imagePath = form.imagePath || null;
      if (imageFile) {
        const extension = (imageFile.name.split(".").pop() || "jpg").toLowerCase();
        const safeExtension = ["jpg", "jpeg", "png", "webp", "avif"].includes(extension) ? extension : "jpg";
        const path = slugify(form.name || "product") + "-" + crypto.randomUUID() + "." + safeExtension;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("product-images").upload(path, imageFile, {
          cacheControl: "3600", contentType: imageFile.type, upsert: false
        });
        if (uploadError) throw uploadError;
        uploadedPath = uploadData.path;
        imagePath = uploadedPath;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name),
        sku: form.sku.trim() || null,
        brand: form.brand.trim() || null,
        category: form.category,
        description: form.description.trim() || null,
        price_ngn: form.price === "" ? null : Number(form.price),
        compare_at_price_ngn: form.comparePrice === "" ? null : Number(form.comparePrice),
        stock_quantity: Number(form.stock),
        image_url: imageUrl,
        image_path: imagePath,
        badge: form.badge.trim() || null,
        is_featured: Boolean(form.isFeatured),
        is_active: Boolean(form.isActive),
      };
      const response = editingProduct
        ? await supabase.from("products").update(payload).eq("id", editingProduct.id)
        : await supabase.from("products").insert(payload);
      if (response.error) throw response.error;

      if (uploadedPath && existingImagePath && existingImagePath !== uploadedPath) {
        await supabase.storage.from("product-images").remove([existingImagePath]);
      }
      await refreshProducts();
      setEditorOpen(false);
      setToast(editingProduct ? "Product updated." : "Product created.");
      setTimeout(() => setToast(""), 3500);
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("product-images").remove([uploadedPath]);
      setEditorError(error.message || "Could not save product. Check database permissions and try again.");
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (product, patch) => {
    setBusyId(product.id);
    try {
      const { error } = await supabase.from("products").update(patch).eq("id", product.id);
      if (error) throw error;
      await refreshProducts();
    } catch (error) {
      setToast(error.message || "Could not update product.");
      setTimeout(() => setToast(""), 4000);
    } finally { setBusyId(""); }
  };

  const deleteProduct = async product => {
    const confirmed = window.confirm("Delete " + product.name + "? This permanently removes the listing.");
    if (!confirmed) return;
    setBusyId(product.id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      if (product.image_path) await supabase.storage.from("product-images").remove([product.image_path]);
      await refreshProducts();
      setToast("Product deleted.");
      setTimeout(() => setToast(""), 3500);
    } catch (error) {
      setToast(error.message || "Could not delete product.");
      setTimeout(() => setToast(""), 4000);
    } finally { setBusyId(""); }
  };

  if (!supabaseConfigured) return <SetupScreen />;
  if (sessionLoading || (session && accessState === "checking")) return <main className="admin-loading"><BrandMark /><LoaderCircle className="spin" size={22} /><span>Checking admin access…</span></main>;
  if (!session) return <SignInScreen onSignIn={signIn} busy={signInBusy} error={signInError} />;
  if (accessState === "denied") return <main className="admin-gate"><div className="gate-brand"><BrandMark /><span>SHEGCOM<span>TECH</span></span></div><div className="gate-card"><span className="gate-icon"><ShieldCheck size={24} /></span><span className="admin-overline">ACCESS RESTRICTED</span><h1>Not on the admin list.</h1><p>This account is signed in, but it has not been granted store-management access. Add the user's ID to <code>public.admin_users</code> in Supabase.</p><button className="admin-button secondary-button full-button" onClick={signOut}><LogOut size={16} /> Sign out</button></div></main>;
  if (accessState === "error") return <main className="admin-gate"><div className="gate-brand"><BrandMark /><span>SHEGCOM<span>TECH</span></span></div><div className="gate-card"><span className="gate-icon"><AlertCircle size={24} /></span><span className="admin-overline">BACKEND CHECK FAILED</span><h1>Could not load inventory.</h1><p>{accessError}</p><p>Confirm that the SQL setup has been run and the admin account is allowlisted.</p><button className="admin-button primary-button full-button" onClick={() => setReloadCounter(value => value + 1)}><ArrowRight size={16} /> Try again</button><button className="admin-button secondary-button full-button" onClick={signOut}><LogOut size={16} /> Sign out</button></div></main>;

  const activeCount = products.filter(product => product.is_active).length;
  const draftCount = products.length - activeCount;
  const lowStockCount = products.filter(product => product.is_active && Number(product.stock_quantity) <= 3).length;
  const unitsInStock = products.reduce((total, product) => total + Number(product.stock_quantity || 0), 0);

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="admin-logo" href="/"><BrandMark /><span>SHEGCOM<span>TECH</span><small>STORE ADMIN</small></span></a>
      <div className="sidebar-section-label">WORKSPACE</div>
      <a className="sidebar-nav sidebar-nav-active" href="/admin"><LayoutDashboard size={18} />Catalogue</a>
      <a className="sidebar-nav" href="/" target="_blank" rel="noreferrer"><ExternalLink size={17} />View storefront</a>
      <div className="sidebar-spacer" />
      <div className="sidebar-user"><span className="user-avatar">{(session.user.email || "A").slice(0,1).toUpperCase()}</span><span><strong>{session.user.email}</strong><small>Store administrator</small></span></div>
      <button className="sidebar-signout" onClick={signOut}><LogOut size={16} />Sign out</button>
      <span className="sidebar-version">SHEGCOMTECH / INVENTORY</span>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span className="admin-overline">STORE MANAGEMENT</span><strong>Catalogue</strong></div><div className="topbar-actions"><a className="storefront-link" href="/" target="_blank" rel="noreferrer"><ExternalLink size={15} />Storefront</a><button className="admin-button primary-button" onClick={openCreate}><Plus size={17} />Add product</button></div></header>
      <section className="admin-page-content">
        <div className="admin-page-title"><div><h1>Products <span>{products.length.toString().padStart(2, "0")}</span></h1><p>Manage prices, availability and product details.</p></div><span className="sync-indicator"><span />LIVE CATALOGUE</span></div>
        <div className="admin-stats">
          <article className="stat-item"><span className="stat-icon"><Boxes size={18} /></span><span className="stat-label">TOTAL PRODUCTS</span><strong>{products.length}</strong><small>All catalogue items</small></article>
          <article className="stat-item"><span className="stat-icon stat-icon-blue"><ShoppingBag size={18} /></span><span className="stat-label">PUBLISHED</span><strong>{activeCount}</strong><small>Visible on storefront</small></article>
          <article className="stat-item"><span className="stat-icon stat-icon-amber"><Activity size={18} /></span><span className="stat-label">LOW STOCK</span><strong>{lowStockCount}</strong><small>3 units or fewer</small></article>
          <article className="stat-item"><span className="stat-icon stat-icon-green"><CircleDollarSign size={18} /></span><span className="stat-label">STOCK UNITS</span><strong>{unitsInStock.toLocaleString("en-NG")}</strong><small>Across all products</small></article>
        </div>

        <section className="inventory-section">
          <div className="inventory-toolbar"><div><h2>Inventory</h2><span>{filteredProducts.length} of {products.length} products</span></div><div className="inventory-filters"><label className="admin-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products…" /></label><label className="admin-category-filter"><Filter size={15} /><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option>All categories</option>{PRODUCT_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select><ChevronDown size={14} /></label></div></div>
          {products.length === 0 ? <div className="inventory-empty"><div className="empty-graphic"><Package size={25} /><Plus size={15} /></div><h3>Your catalogue starts here.</h3><p>Add the first confirmed product, set its price and stock, then publish it to the storefront.</p><button className="admin-button primary-button" onClick={openCreate}><Plus size={17} />Add your first product</button></div> : filteredProducts.length === 0 ? <div className="filter-empty"><Search size={20} /><span>No products match this search.</span><button onClick={() => { setQuery(""); setCategoryFilter("All categories"); }}>Clear filters</button></div> : <div className="inventory-table-wrap">
            <div className="inventory-table-head"><span>PRODUCT</span><span>PRICE</span><span>STOCK</span><span>STATUS</span><span>ACTIONS</span></div>
            <div className="inventory-table-body">{filteredProducts.map(product => <article className="inventory-row" key={product.id}>
              <div className="inventory-product"><span className="inventory-thumb">{product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <FileImage size={20} />}</span><span className="inventory-product-copy"><strong>{product.name}</strong><small>{[product.brand, product.sku || "No SKU"].filter(Boolean).join(" · ")}</small><em>{product.category}</em></span></div>
              <div className="inventory-price"><strong>{currency(product.price_ngn)}</strong>{product.compare_at_price_ngn != null && <small>Compare: {currency(product.compare_at_price_ngn)}</small>}</div>
              <div className="inventory-stock"><strong>{Number(product.stock_quantity).toLocaleString("en-NG")}</strong><small>{Number(product.stock_quantity) <= 0 ? "Out of stock" : Number(product.stock_quantity) <= 3 ? "Low stock" : "In stock"}</small></div>
              <div><span className={product.is_active ? "product-status status-published" : "product-status status-draft"}><span />{product.is_active ? "Published" : "Draft"}</span>{product.is_featured && <small className="featured-label"><Star size={11} fill="currentColor" /> Featured</small>}</div>
              <div className="inventory-actions"><button title={product.is_active ? "Unpublish" : "Publish"} aria-label={product.is_active ? "Unpublish " + product.name : "Publish " + product.name} disabled={busyId === product.id} onClick={() => quickUpdate(product, { is_active: !product.is_active })}>{product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}</button><button title={product.is_featured ? "Remove featured" : "Feature product"} aria-label={product.is_featured ? "Remove featured " + product.name : "Feature " + product.name} disabled={busyId === product.id} onClick={() => quickUpdate(product, { is_featured: !product.is_featured })}><Star size={16} fill={product.is_featured ? "currentColor" : "none"} /></button><button title="Edit product" aria-label={"Edit " + product.name} disabled={busyId === product.id} onClick={() => openEdit(product)}><Pencil size={16} /></button><button className="delete-action" title="Delete product" aria-label={"Delete " + product.name} disabled={busyId === product.id} onClick={() => deleteProduct(product)}><Trash2 size={16} /></button></div>
            </article>)}</div>
          </div>}
        </section>
      </section>
    </main>
    {toast && <div className="admin-toast"><CheckCircle2 size={17} />{toast}</div>}
    {editorOpen && <ProductEditor product={editingProduct} onClose={() => setEditorOpen(false)} onSave={saveProduct} saving={saving} error={editorError} />}
  </div>;
}

export default AdminApp;
