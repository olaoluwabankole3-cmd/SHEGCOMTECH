import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight,
  Clock3, FileUp, Headphones, Laptop, Menu, Monitor, PackageCheck, Printer,
  Search, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Truck, X, Zap,
  Building2, Camera, Gamepad2, Plus, Minus, Trash2
} from "lucide-react";
import "./style.css";

const categories = [
  { name: "All products", icon: ShoppingBag, count: "Explore all" },
  { name: "Laptops", icon: Laptop, count: "Work & study" },
  { name: "Monitors", icon: Monitor, count: "Build your setup" },
  { name: "Phones", icon: Smartphone, count: "Stay connected" },
  { name: "CCTV & security", icon: Camera, count: "Protect your space" },
  { name: "Gaming", icon: Gamepad2, count: "Game on" },
  { name: "Appliances", icon: Zap, count: "Home & office" },
  { name: "Networking", icon: Monitor, count: "Connected spaces" },
  { name: "Printers & supplies", icon: Printer, count: "Print essentials" },
  { name: "Accessories", icon: Zap, count: "The little extras" },
];
const photo = (id, width = 800) => "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + width + "&q=85";

const heroSlides = [
  {
    kicker: "THE TECH EDIT",
    titleLead: "Make room for",
    titleAccent: "better tech.",
    description: "Laptops, phones, gaming and everyday essentials.",
    primary: "Browse technology",
    primaryHref: "#shop",
    secondary: "Find a specific model",
    secondaryHref: "#shop",
    image: "photo-1496181133206-80ce9b88a853",
    alt: "Laptop on a modern desk",
    imageCaption: "TECH FOR WORK, PLAY & EVERYTHING BETWEEN",
    tabTitle: "Shop technology",
    tabSubtitle: "Everyday devices"
  },
  {
    kicker: "FOR WORK THAT MOVES",
    titleLead: "Business tech.",
    titleAccent: "Sorted.",
    description: "Office devices, displays and security equipment for your team.",
    primary: "Request a business quote",
    primaryHref: "#business",
    secondary: "Explore the store",
    secondaryHref: "#shop",
    image: "photo-1497366754035-f200968a6e72",
    alt: "Bright contemporary office workspace",
    imageCaption: "TECHNOLOGY FOR TEAMS & PROJECTS",
    tabTitle: "Business supply",
    tabSubtitle: "Single orders & bulk"
  },
  {
    kicker: "PRINT & DIGITAL",
    titleLead: "Send it from",
    titleAccent: "home.",
    description: "Prepare document and print requests before you visit.",
    primary: "Start a print request",
    primaryHref: "#services",
    secondary: "Shop devices",
    secondaryHref: "#shop",
    image: "photo-1587829741301-dc798b83add3",
    alt: "Modern keyboard and workspace accessories",
    imageCaption: "YOUR LOCAL DIGITAL WORKSPACE",
    tabTitle: "Print & digital",
    tabSubtitle: "Start online"
  }
];

function App() {
  const [products, setProducts] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [activeHero, setActiveHero] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All products");
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [serviceFiles, setServiceFiles] = useState([]);
  const [serviceType, setServiceType] = useState("Printing");
  const [serviceNote, setServiceNote] = useState("");
  const [serviceSent, setServiceSent] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: "", company: "", email: "", phone: "", items: "", quantity: "" });
  const fileInput = useRef(null);

  useEffect(() => {
    let active = true;
    fetch("/catalog.json", { headers: { Accept: "application/json" } })
      .then(response => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        return response.json();
      })
      .then(data => {
        if (!active) return;
        if (!Array.isArray(data)) throw new Error("Catalogue must be a list");
        const cleanProducts = data.filter(product =>
          product && product.id != null && typeof product.name === "string" && typeof product.category === "string"
        ).map(product => ({
          ...product,
          priceNgn: Number.isFinite(product.priceNgn) && product.priceNgn >= 0 ? product.priceNgn : null,
        }));
        setProducts(cleanProducts);
        setCatalogStatus(cleanProducts.length ? "ready" : "empty");
      })
      .catch(() => { if (active) setCatalogStatus("error"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (heroPaused || (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return undefined;
    const timer = window.setInterval(() => setActiveHero(index => (index + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [heroPaused]);

  // Reveal each section as it enters the viewport, including catalogue items loaded later.
  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return undefined;

    const selector = [
      "main > .service-strip", ".section-heading", ".strip-item", ".category-launch-item",
      ".product-card", ".business-copy", ".business-visual", ".service-copy-card",
      ".upload-card", ".promise-intro", ".promise-item", ".footer-main > *", ".footer-bottom"
    ].join(", ");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

    const register = root => {
      const elements = [];
      if (root instanceof Element && root.matches(selector)) elements.push(root);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll(selector));
      elements.forEach(element => {
        if (element.classList.contains("scroll-reveal")) return;
        element.classList.add("scroll-reveal");
        observer.observe(element);
      });
    };

    register(document);
    const main = document.querySelector("main");
    const mutations = main ? new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof Element) register(node);
      }));
    }) : null;
    if (main && mutations) mutations.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (mutations) mutations.disconnect();
    };
  }, []);

  // Pointer-driven depth on large visual surfaces and product/category items.
  useEffect(() => {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const selector = ".hero-visual, .business-visual, .product-card, .category-launch-item";
    let activeSurface = null;
    const clearSurface = surface => {
      if (!surface) return;
      surface.style.removeProperty("--tilt-x");
      surface.style.removeProperty("--tilt-y");
      surface.style.removeProperty("--pointer-x");
      surface.style.removeProperty("--pointer-y");
    };
    const move = event => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const surface = event.target instanceof Element ? event.target.closest(selector) : null;
      if (activeSurface && activeSurface !== surface) clearSurface(activeSurface);
      if (!surface) { activeSurface = null; return; }
      const bounds = surface.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      const intensity = surface.matches(".product-card") ? 5 : surface.matches(".category-launch-item") ? 3 : 2.6;
      surface.style.setProperty("--tilt-x", ((0.5 - y) * intensity).toFixed(2) + "deg");
      surface.style.setProperty("--tilt-y", ((x - 0.5) * intensity).toFixed(2) + "deg");
      surface.style.setProperty("--pointer-x", (x * 100).toFixed(1) + "%");
      surface.style.setProperty("--pointer-y", (y * 100).toFixed(1) + "%");
      activeSurface = surface;
    };
    const out = event => {
      if (!activeSurface) return;
      const leaving = event.target instanceof Element ? event.target.closest(selector) : null;
      if (leaving === activeSurface && (!event.relatedTarget || !activeSurface.contains(event.relatedTarget))) {
        clearSurface(activeSurface);
        activeSurface = null;
      }
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", out);
      clearSurface(activeSurface);
    };
  }, []);

  // A slim scroll indicator plus low-amplitude image parallax keeps the page feeling responsive.
  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty("--page-progress", String(scrollable > 0 ? window.scrollY / scrollable : 0));
        if (reduceMotion) return;
        document.querySelectorAll(".hero-visual img, .business-photo img").forEach(image => {
          const bounds = image.parentElement.getBoundingClientRect();
          if (bounds.bottom < -80 || bounds.top > window.innerHeight + 80) return;
          const distance = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) * 0.018;
          image.style.setProperty("--parallax-y", Math.max(-12, Math.min(12, distance)).toFixed(2) + "px");
        });
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const visibleProducts = useMemo(() => products.filter(product =>
    (activeCategory === "All products" || product.category === activeCategory) &&
    [product.name, product.description, product.detail, product.brand, product.category]
      .filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  ), [products, activeCategory, search]);
  const addToCart = (product) => setCart(current => [...current, product]);
  const cartTotal = cart.reduce((sum, product) => sum + product.priceNgn, 0);
  const formatMoney = (amount) => "₦" + amount.toLocaleString("en-NG");
  const submitService = (event) => {
    event.preventDefault();
    if (!serviceFiles.length) return;
    setServiceSent(true);
  };
  const submitQuote = (event) => {
    event.preventDefault();
    setQuoteSent(true);
  };

  return <div className="site-shell">
    <div className="announcement"><span className="announce-dot" /> Gadgets for everyday. Technology for business. <a href="#business">Bulk supply <ArrowUpRight size={13} /></a></div>
    <header className="header">
      <a className="brand" href="#top" aria-label="SHEGCOMTECH home"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">SHEGCOM<span>TECH</span><small>TECHNOLOGY, MADE PRACTICAL.</small></span></a>
      <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Main navigation">
        <a className="nav-active" href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
        <a href="#business" onClick={() => setMenuOpen(false)}>Business supply</a>
        <a href="#services" onClick={() => setMenuOpen(false)}>Print & digital</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>About us</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <div className="header-actions">
        <form className="header-search" role="search" onSubmit={event => { event.preventDefault(); setSearchOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>
          <Search size={17} />
          <input aria-label="Search products" placeholder="Search technology…" value={search} onChange={event => setSearch(event.target.value)} />
          <button type="submit" aria-label="Show search results"><ArrowRight size={16} /></button>
        </form>
        <button className="icon-button search-toggle mobile-search-toggle" aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
        <button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={17} /><span className="cart-label">Bag</span><span className="cart-count">{cart.length}</span></button>
        <button className="mobile-menu icon-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </header>

    {searchOpen && <form className="search-bar" role="search" onSubmit={event => { event.preventDefault(); setSearchOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}><Search size={18} /><input autoFocus placeholder="Search laptops, phones, accessories…" value={search} onChange={event => setSearch(event.target.value)} /><button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} aria-label="Clear and close search"><X size={18} /></button><button type="submit" className="search-submit" aria-label="Show search results"><ArrowRight size={16} /></button></form>}

    <main id="top">
      <section
        className="hero hero-carousel"
        aria-label="Featured SHEGCOMTECH services"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onFocusCapture={() => setHeroPaused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false);
        }}
      >
        <div className={"hero-stage hero-stage-" + activeHero}>
          <div className="hero-copy" key={"hero-copy-" + activeHero}>
            <div className="hero-kicker"><span className="hero-kicker-line" /> {heroSlides[activeHero].kicker}</div>
            <h1>{heroSlides[activeHero].titleLead}<br /><span>{heroSlides[activeHero].titleAccent}</span></h1>
            <p className="hero-description">{heroSlides[activeHero].description}</p>
            <div className="hero-actions">
              <a className="button hero-primary" href={heroSlides[activeHero].primaryHref}>{heroSlides[activeHero].primary}<ArrowRight size={17} /></a>
              <a className="hero-secondary" href={heroSlides[activeHero].secondaryHref}>{heroSlides[activeHero].secondary}<ArrowUpRight size={15} /></a>
            </div>
            <div className="hero-small-note"><span className="hero-live-mark" /> TECHNOLOGY · BUSINESS SUPPLY · DIGITAL SERVICES</div>
          </div>
          <div className="hero-visual" key={"hero-visual-" + activeHero}>
            <img src={photo(heroSlides[activeHero].image, 1300)} alt={heroSlides[activeHero].alt} fetchPriority={activeHero === 0 ? "high" : "auto"} />
            <div className="hero-image-wash" />
            <div className="hero-image-caption"><span>{heroSlides[activeHero].imageCaption}</span><span>0{activeHero + 1} / 03</span></div>
          </div>
        </div>
        <div className="hero-track">
          <div className="hero-tabs" aria-label="Featured areas">
            {heroSlides.map((slide, index) => <button type="button" key={slide.tabTitle} className={activeHero === index ? "hero-tab hero-tab-active" : "hero-tab"} onClick={() => setActiveHero(index)} aria-pressed={activeHero === index}>
              <span className="hero-tab-number">0{index + 1}</span>
              <span className="hero-tab-copy"><strong>{slide.tabTitle}</strong><small>{slide.tabSubtitle}</small></span>
              <span className="hero-tab-line" />
            </button>)}
          </div>
          <div className="hero-arrows">
            <button type="button" aria-label="Previous feature" onClick={() => setActiveHero(index => (index + heroSlides.length - 1) % heroSlides.length)}><ChevronRight size={18} /></button>
            <button type="button" aria-label="Next feature" onClick={() => setActiveHero(index => (index + 1) % heroSlides.length)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      <section className="service-strip" aria-label="Explore SHEGCOMTECH">
        <a href="#shop" className="strip-item"><span className="strip-icon"><ShoppingBag size={20} /></span><span><b>Shop devices</b><small>Everyday tech</small></span><ArrowUpRight size={16} /></a>
        <a href="#business" className="strip-item"><span className="strip-icon"><Building2 size={20} /></span><span><b>Business supply</b><small>Bulk orders</small></span><ArrowUpRight size={16} /></a>
        <a href="#services" className="strip-item"><span className="strip-icon"><Printer size={20} /></span><span><b>Print & digital</b><small>Start online</small></span><ArrowUpRight size={16} /></a>
      </section>

      <section className="shop-section section-wrap" id="shop">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE SHEGCOMTECH STORE</div><h2>Find your next <span>upgrade.</span></h2><p>Browse the catalogue or ask us to source a model.</p></div><a className="view-all" href="#shop" onClick={() => { setActiveCategory("All products"); setSearch(""); }}>View all products <ArrowRight size={16} /></a></div>
        <div className={catalogStatus === "empty" ? "shop-layout shop-layout-empty" : "shop-layout"}>
          {catalogStatus !== "empty" && <aside className="category-sidebar"><span className="category-label">SHOP BY CATEGORY</span>{categories.map(cat => { const Icon = cat.icon; return <button key={cat.name} className={activeCategory === cat.name ? "category-link category-selected" : "category-link"} onClick={() => setActiveCategory(cat.name)}><Icon size={17} /><span>{cat.name}<small>{cat.count}</small></span><ChevronRight size={15} className="category-arrow" /></button>; })}<div className="sidebar-note"><Sparkles size={17} /><p>Not sure what fits? <a href="#contact">Talk to us.</a></p></div></aside>
          <div className="product-area">
            <div className="product-toolbar"><span>{catalogStatus === "empty" && activeCategory === "All products" && !search ? "Shop by category" : search ? "Search results" : activeCategory === "All products" ? "The catalogue" : activeCategory}<b>{catalogStatus === "ready" ? visibleProducts.length.toString().padStart(2, "0") : catalogStatus === "empty" && activeCategory === "All products" && !search ? "09" : ""}</b></span><span className="sort-label">{catalogStatus === "ready" ? "CURRENT LISTING" : catalogStatus === "loading" ? "LOADING" : "BROWSE & ENQUIRE"}</span></div>
            {catalogStatus === "empty" && activeCategory === "All products" && !search ? <div className="category-launch-grid" aria-label="Browse by category">
              {categories.filter(category => category.name !== "All products").map(category => { const Icon = category.icon; return <button className="category-launch-item" type="button" key={category.name} onClick={() => { setQuoteForm(form => ({ ...form, items: category.name })); setQuoteSent(false); setQuoteOpen(true); }}>
                <span className="category-launch-icon"><Icon size={20} strokeWidth={1.6} /></span><span className="category-launch-copy"><strong>{category.name}</strong><small>{category.count}</small></span><ArrowUpRight size={16} className="category-launch-arrow" />
              </button>; })}
            </div> : <div className="product-grid">{visibleProducts.length ? visibleProducts.map((product, i) => <article className="product-card" key={product.id}>
              <div className={"product-image product-" + (product.tone || "neutral")}>
                {product.tag && <span className="product-tag">{product.tag}</span>}
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <div className="product-placeholder"><span>{product.category}</span><PackageCheck size={30} strokeWidth={1.4} /></div>}
                {typeof product.priceNgn === "number" && <button className="quick-add" aria-label={"Add " + product.name + " to bag"} onClick={() => addToCart(product)}><Plus size={19} /></button>}
                <span className="product-number">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><div className="product-bottom"><div><p>{product.description || product.detail || product.brand || ""}</p><strong>{typeof product.priceNgn === "number" ? formatMoney(product.priceNgn) : "Price on request"}</strong></div><button className="add-button" onClick={() => {
                if (typeof product.priceNgn === "number") addToCart(product);
                else { setQuoteForm(form => ({ ...form, items: product.name })); setQuoteSent(false); setQuoteOpen(true); }
              }} aria-label={typeof product.priceNgn === "number" ? "Add " + product.name + " to bag" : "Request price for " + product.name}>{typeof product.priceNgn === "number" ? <Plus size={17} /> : <ArrowUpRight size={17} />}</button></div></div>
            </article>) : <div className="empty-results catalog-empty">
              <span className="catalog-empty-index">{catalogStatus === "loading" ? "01" : "SC"}</span>
              <h3>{catalogStatus === "loading" ? "Preparing the catalogue" : catalogStatus === "error" ? "Catalogue unavailable" : search ? "No matches found" : catalogStatus === "empty" && activeCategory === "All products" ? "We're getting the store ready." : "No products in this category yet."}</h3>
              <p>{catalogStatus === "loading" ? "Checking the current product list." : catalogStatus === "error" ? "The product list could not be loaded. Please contact us to check availability." : search ? "Try a different product name, or ask us to source it." : "We're adding confirmed listings. Tell us what you need and we'll check availability."}</p>
              <div className="catalog-empty-actions"><button className="button button-primary" onClick={() => { setQuoteForm(form => ({ ...form, items: search || activeCategory === "All products" ? "" : activeCategory })); setQuoteSent(false); setQuoteOpen(true); }}>Ask us to source an item <ArrowRight size={16} /></button>{search && <button className="text-link" onClick={() => setSearch("")}>Clear search</button>}</div>
            </div>}</div>}
            {catalogStatus === "ready" && <div className="catalog-note"><span><ShieldCheck size={17} /></span><p><strong>Looking for a specific model?</strong> Our catalogue is only a starting point. Ask us to source the exact device you need.</p><button onClick={() => setQuoteOpen(true)}>Request a quote <ArrowRight size={15} /></button></div>}
          </div>
        </div>
      </section>

      <section className="business-section" id="business">
        <div className="business-inner">
          <div className="business-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> FOR TEAMS THAT MEAN BUSINESS</div><h2>Equipping your business<br />shouldn't be <span>hard work.</span></h2><p>Laptops, displays, CCTV and office essentials — sourced for teams, projects and growing businesses.</p><ul className="business-points"><li><Check size={16} /> Office & personal devices</li><li><Check size={16} /> CCTV, networking & security</li><li><Check size={16} /> Bulk orders & ongoing supply</li></ul><button className="button button-white" onClick={() => { setQuoteOpen(true); setQuoteSent(false); }}>Talk to our supply team <ArrowRight size={17} /></button></div>
          <div className="business-visual"><div className="business-photo"><img src={photo("photo-1497366754035-f200968a6e72", 1000)} alt="Modern office workspace ready for a technology setup" loading="lazy" /></div><div className="business-stamp"><span>SC</span><small>BUSINESS<br />SOLUTIONS</small></div></div>
        </div>
      </section>

      <section className="services-section section-wrap" id="services">
        <div className="section-heading services-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PRINT & DIGITAL</div><h2>Print, scan, <span>done.</span></h2></div></div>
        <div className="services-layout">
          <div className="service-copy-card"><div className="service-number">01 / PRINT & DOCUMENTS</div><div className="service-illustration"><div className="paper-sheet"><span /><span /><span /><span /><b>PDF</b></div><div className="printer-illustration"><Printer size={55} strokeWidth={1.3} /></div><span className="illus-orbit orbit-one" /><span className="illus-orbit orbit-two" /></div><h3>Send it in.<br />Pick it up ready.</h3><p>Send documents from anywhere. We'll confirm details before printing.</p><div className="service-mini-points"><span><Check size={14} /> Document printing</span><span><Check size={14} /> Scanning & copies</span><span><Check size={14} /> Typing & formatting</span></div></div>
          <form className="upload-card" onSubmit={submitService}>
            <div className="upload-card-head"><span className="upload-icon"><FileUp size={20} /></span><div><h3>Start a print request</h3><p>Share your files and requirements.</p></div><span className="secure-label"><ShieldCheck size={13} /> PRIVATE REQUEST</span></div>
            {serviceSent ? <div className="request-success"><span><Check size={24} /></span><h3>Your request is prepared.</h3><p>Your selected files are attached to this form in your browser, but they have <strong>not been uploaded or sent</strong> yet. Connect a secure file-storage and request-processing service to receive real submissions.</p><button type="button" className="button button-primary" onClick={() => { setServiceSent(false); setServiceFiles([]); setServiceNote(""); if (fileInput.current) fileInput.current.value = ""; }}>Start another request</button></div> : <>
              <label className="field-label" htmlFor="service-type">WHAT DO YOU NEED?</label><div className="select-wrap"><select id="service-type" value={serviceType} onChange={e => setServiceType(e.target.value)}><option>Printing</option><option>Scanning & photocopying</option><option>Typing & document formatting</option><option>Online application assistance</option><option>Other digital service</option></select><ChevronDown size={16} /></div>
              <input ref={fileInput} type="file" multiple className="visually-hidden" id="service-files" onChange={e => setServiceFiles(Array.from(e.target.files || []))} />
              <label className="drop-zone" htmlFor="service-files"><span className="drop-icon"><FileUp size={22} /></span><strong>Choose files from your device</strong><span>PDF, DOCX, JPG, PNG and more</span><span className="drop-browse">Browse files <ArrowUpRight size={13} /></span></label>
              {serviceFiles.length > 0 && <div className="selected-files">{serviceFiles.map((file, i) => <div key={file.name + i}><span className="file-mini"><FileUp size={14} /></span><span className="file-name">{file.name}<small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></span><button type="button" aria-label={"Remove " + file.name} onClick={() => { setServiceFiles(old => old.filter((_, index) => index !== i)); if (fileInput.current) fileInput.current.value = ""; }}><X size={15} /></button></div>)}</div>}
              <label className="field-label" htmlFor="service-notes">NOTES FOR OUR TEAM <span>OPTIONAL</span></label><textarea id="service-notes" value={serviceNote} onChange={e => setServiceNote(e.target.value)} placeholder="e.g. A4, black & white, 3 copies…" rows="2" />
              <button className="button button-primary upload-submit" type="submit" disabled={!serviceFiles.length}>Review print request <ArrowRight size={17} /></button>
              <p className="upload-privacy"><ShieldCheck size={13} /> Your documents should be handled securely. Upload delivery will be enabled when the secure backend is connected.</p>
            </>}
          </form>
        </div>
      </section>

      <section className="promise-strip" id="about"><div className="promise-intro"><span className="eyebrow"><span className="eyebrow-line" /> SHEGCOMTECH</span><h2>Good tech.<br /><span>Real support.</span></h2></div><div className="promise-item"><span><Headphones size={20} /></span><b>Human help</b></div><div className="promise-item"><span><Search size={20} /></span><b>We source it</b></div><div className="promise-item"><span><Truck size={20} /></span><b>Single or bulk</b></div></section>
    </main>

    <footer id="contact"><div className="footer-main"><div className="footer-brand-col"><a className="brand brand-footer" href="#top"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">SHEGCOM<span>TECH</span><small>TECHNOLOGY, MADE PRACTICAL.</small></span></a><p>Dependable technology, useful digital services and business supply — all in one place.</p><a href="mailto:hello@shegcomtech.com" className="footer-contact">Let's talk <ArrowUpRight size={15} /></a></div><div className="footer-links"><span>EXPLORE</span><a href="#shop">Shop technology</a><a href="#business">Business supply</a><a href="#services">Print & digital services</a><a href="#about">Why SHEGCOMTECH</a></div><div className="footer-links"><span>HERE TO HELP</span><a href="#contact">Contact the team</a><button onClick={() => setQuoteOpen(true)}>Request a quotation</button><a href="#services">Start a print request</a><small>Business hours and response times to be confirmed.</small></div><div className="footer-cta"><span className="footer-cta-mark"><ArrowUpRight size={24} /></span><h3>Have a list?<br />Let's make it happen.</h3><p>Tell us what you need. We'll help you figure out the next step.</p><button onClick={() => setQuoteOpen(true)}>Start a conversation <ArrowRight size={16} /></button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SHEGCOMTECH. All rights reserved.</span><span>BUILT AROUND WHAT YOU NEED. <span className="footer-blue">SC.</span></span></div></footer>

    {cartOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false); }}><div className="drawer" role="dialog" aria-modal="true" aria-label="Shopping bag"><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <span>({cart.length})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={21} /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((p, i) => <div className="drawer-item" key={p.id + "-" + i}>{p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span className="drawer-product-placeholder"><PackageCheck size={20} /></span>}<div><small>{p.category}</small><strong>{p.name}</strong><b>{formatMoney(p.priceNgn)}</b></div><button aria-label={"Remove " + p.name} onClick={() => setCart(old => old.filter((_, index) => index !== i))}><Trash2 size={16} /></button></div>)}</div><div className="drawer-total"><span>Estimated total</span><strong>{formatMoney(cartTotal)}</strong></div><p className="drawer-disclaimer">Price and stock are confirmed with our team before an order is finalised.</p><button className="button button-primary drawer-checkout" onClick={() => { setCartOpen(false); setQuoteOpen(true); setQuoteForm(f => ({ ...f, items: cart.map(p => p.name).join(", "), quantity: String(cart.length) })); }}>Request availability & price <ArrowRight size={16} /></button><button className="clear-bag" onClick={() => setCart([])}>Clear bag</button></> : <div className="empty-bag"><ShoppingBag size={30} /><h3>Your bag is taking a breather.</h3><p>Add a few things you like and they'll show up here.</p><button className="button button-primary" onClick={() => { setCartOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>Browse the store <ArrowRight size={16} /></button></div>}</div></div>}

    {quoteOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setQuoteOpen(false); }}><div className="quote-modal" role="dialog" aria-modal="true" aria-label="Request a quotation"><div className="drawer-head"><div><span className="eyebrow">LET'S GET YOU SORTED</span><h2>Request a <span>quote.</span></h2></div><button className="icon-button" onClick={() => setQuoteOpen(false)} aria-label="Close quotation form"><X size={21} /></button></div>{quoteSent ? <div className="request-success"><span><Check size={24} /></span><h3>Thanks for the details.</h3><p>This demo has captured your entries in the current page only. To deliver quotations to SHEGCOMTECH, connect a backend or business email workflow before launch.</p><button className="button button-primary" onClick={() => { setQuoteOpen(false); setQuoteSent(false); }}>Close</button></div> : <form className="quote-form" onSubmit={submitQuote}><p>Tell us what you're looking for. This works for individual purchases and business orders.</p><div className="quote-fields"><label>YOUR NAME<input required value={quoteForm.name} onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })} placeholder="Full name" /></label><label>COMPANY <span>OPTIONAL</span><input value={quoteForm.company} onChange={e => setQuoteForm({ ...quoteForm, company: e.target.value })} placeholder="Company or organisation" /></label><label>EMAIL ADDRESS<input required type="email" value={quoteForm.email} onChange={e => setQuoteForm({ ...quoteForm, email: e.target.value })} placeholder="you@example.com" /></label><label>PHONE NUMBER<input value={quoteForm.phone} onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })} placeholder="Best number to reach you" /></label><label className="field-wide">WHAT DO YOU NEED?<textarea required rows="3" value={quoteForm.items} onChange={e => setQuoteForm({ ...quoteForm, items: e.target.value })} placeholder="e.g. 12 laptops, 12 monitors, 2 CCTV kits…" /></label><label className="field-wide">ESTIMATED QUANTITY <span>OPTIONAL</span><input value={quoteForm.quantity} onChange={e => setQuoteForm({ ...quoteForm, quantity: e.target.value })} placeholder="e.g. 12 units or a full office setup" /></label></div><button className="button button-primary quote-submit" type="submit">Prepare my request <ArrowRight size={16} /></button><p className="quote-note">Demo form only — connect an email or database service to receive real enquiries.</p></form>}</div></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
