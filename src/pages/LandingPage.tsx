import { lazy, Suspense } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Asterisk, MoveUpRight, Orbit, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { DubaiSkyline } from "@/components/landing/DubaiSkyline";

const AgentRadianceField = lazy(() => import("@/components/landing/AgentRadianceField").then(({ AgentRadianceField: Field }) => ({ default: Field })));

const capabilities = [
  { number: "01", title: "See the signal.", copy: "Every inquiry, source and next step in one deliberate view.", icon: ScanLine },
  { number: "02", title: "Move with intent.", copy: "Explainable qualification and considered routing for every lead.", icon: Orbit },
  { number: "03", title: "Keep the thread.", copy: "Conversations, ownership and decisions stay connected.", icon: MoveUpRight },
];

export default function LandingPage() {
  return (
    <main className="elc-landing">
      <nav className="elc-nav" aria-label="Main navigation">
        <Link to="/" aria-label="Executive Lead Control home" className="elc-brand"><Logo size="md" showText /></Link>
        <div className="elc-nav-center"><span>PRIVATE CLIENT OPERATIONS</span><i /> <span>DUBAI · 25°12′N</span></div>
        <Link to="/dashboard" className="elc-nav-link">Enter workspace <ArrowUpRight size={15} /></Link>
      </nav>

      <section className="elc-hero" aria-labelledby="hero-title">
        <div className="elc-hero-noise" aria-hidden="true" />
        <div className="elc-hero-top"><span>EXECUTIVE LEAD CONTROL™</span><span>BUILT FOR THE MOMENT THAT MATTERS <Asterisk size={13} /></span></div>
        <div className="elc-hero-copy">
          <p className="elc-kicker"><span className="elc-kicker-dot" /> A NEW STANDARD FOR LEAD OPERATIONS</p>
          <h1 id="hero-title">Make every<br /><em>first impression</em><br />count.</h1>
          <p className="elc-hero-sub">The quiet intelligence behind exceptional client relationships.</p>
          <div className="elc-hero-actions">
            <Link to="/dashboard" className="elc-button">Explore the workspace <ArrowRight size={16} /></Link>
            <a href="#approach" className="elc-text-link">Discover the approach <ArrowDown size={14} /></a>
          </div>
        </div>

        <div className="elc-art" aria-label="Radiant dusk study of Dubai landmarks">
          <Suspense fallback={<div className="elc-radiance-field" data-state="fallback" aria-hidden="true"><div className="elc-radiance-fallback" /></div>}>
            <AgentRadianceField />
          </Suspense>
          <div className="elc-art-coordinate">FIG. 01 <span>THE SIGNAL, IN MOTION</span></div>
          <div className="elc-art-horizon" />
          <div className="elc-orbit elc-orbit-one" /><div className="elc-orbit elc-orbit-two" />
          <div className="elc-art-floor" />
          <DubaiSkyline />
          <div className="elc-art-caption"><span>01 / 03</span><span>ATTENTION, DIRECTED</span><span>DXB — 2026</span></div>
          <div className="elc-signal-card"><span className="elc-signal-label"><span /> LIVE SIGNAL</span><strong>Leila Haddad</strong><span className="elc-signal-meta">Qualified <b>·</b> AED 8.2M <b>·</b> 88 score</span><div className="elc-signal-rule"><i /></div><span className="elc-signal-foot">PRIORITY CLIENT <ArrowUpRight size={12} /></span></div>
          <div className="elc-art-index">E<br />L<br />C</div>
        </div>

        <div className="elc-hero-footer"><span>01 — A MORE CONSIDERED WAY TO GROW</span><span>SCROLL TO EXPLORE <span className="elc-scroll-line" /></span></div>
      </section>

      <section className="elc-intro" id="approach">
        <div className="elc-intro-label"><span>THE PHILOSOPHY</span><span>01 / 03</span></div>
        <div className="elc-intro-copy"><h2>Precision is<br />a form of <em>care.</em></h2><div><p>In a world of noise, the advantage belongs to the people who notice what matters. Executive Lead Control brings clarity to the earliest, most important moments of a client relationship.</p><Link to="/dashboard" className="elc-underlined-link">See how it works <ArrowUpRight size={14} /></Link></div></div>
        <div className="elc-marquee" aria-hidden="true"><span>INTUITION, INFORMED</span><Asterisk /><span>ATTENTION, DIRECTED</span><Asterisk /><span>RELATIONSHIPS, REMEMBERED</span></div>
      </section>

      <section className="elc-capabilities" aria-label="Platform capabilities">
        <div className="elc-cap-head"><span>THE SYSTEM</span><span>THREE MOVEMENTS. ONE CONTINUOUS VIEW.</span></div>
        <div className="elc-cap-grid">{capabilities.map(({ number, title, copy, icon: Icon }) => <article className="elc-cap-card" key={number}><div className="elc-cap-card-top"><span>{number}</span><Icon size={18} strokeWidth={1.4} /></div><h3>{title}</h3><p>{copy}</p><ArrowUpRight className="elc-cap-arrow" size={15} /></article>)}</div>
      </section>

      <section className="elc-endnote"><span className="elc-endnote-mark">ELC<span>™</span></span><div><p>Every relationship begins somewhere.</p><h2>Begin with<br /><em>clarity.</em></h2><Link to="/dashboard" className="elc-button elc-button-light">Enter the workspace <ArrowRight size={16} /></Link></div><span className="elc-endnote-coordinate">25°12′N<br />55°16′E</span></section>
      <footer className="elc-footer"><Logo size="sm" showText /><span>© 2026 EXECUTIVE LEAD CONTROL</span><Link to="/dashboard">PRIVATE WORKSPACE <ArrowUpRight size={12} /></Link></footer>
    </main>
  );
}
