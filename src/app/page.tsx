'use client';

import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

/* ── Extend JSX to allow <model-viewer> ── */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX &
        React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src: string;
  'ios-src'?: string;
  alt?: string;
  'camera-controls'?: boolean;
  'disable-zoom'?: boolean;
  'disable-pan'?: boolean;
  'camera-orbit'?: string;
  ref?: React.Ref<any>;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/* ──────────────────────────
   Smooth Cinematic Floating Can
   (always vertically centered, moves horizontally only)
   ────────────────────────── */
const FloatingCan = ({ scrollProgress }: { scrollProgress: number }) => {
  const modelRef = useRef<any>(null);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.cameraOrbit = '0deg 75deg auto';
    }
  }, []);

  // Only the horizontal (left) values change – vertical stays 50%
  const waypoints: [number, number][] = [
    [0,     50],   // hero start – centre
    [0.10,  80],   // hero end   – right
    [0.18,  90],   // energy     – far right
    [0.32,  92],   // features   – even further right
    [0.48,  75],   // showcase   – right column centre
    [0.62,  90],   // formula    – bottom right
    [0.74,  92],   // editions   – further right
    [0.84,  10],   // quote      – bottom left
    [0.91,  90],   // cta        – final hold
  ];

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const getPosition = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    const last = waypoints[waypoints.length - 1];
    if (p >= last[0]) return last[1]; // left value only
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [p0, x0] = waypoints[i];
      const [p1, x1] = waypoints[i + 1];
      if (p >= p0 && p <= p1) {
        const t = (p - p0) / (p1 - p0);
        return lerp(x0, x1, t);
      }
    }
    return last[1];
  };

  const left = getPosition(scrollProgress);

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        width: 'min(70vw, 500px)',
        height: 'min(70vw, 500px)',
        top: '50%',                   // always vertically centred
        left: `${left}%`,
        transform: 'translate(-50%, -50%)',
        willChange: 'left',           // only left changes now
      }}
    >
      <model-viewer
        ref={modelRef}
        src="/redbull.glb"
        alt="Red Bull can"
        camera-controls
        disable-zoom
        disable-pan
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

/* ─────────────────────────────────
   Main Page Component
   ───────────────────────────────── */
export default function RedBullPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cursorHover, setCursorHover] = useState(false);

  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);

  // ── Scroll & mouse tracking ──
  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total > 0) setScrollProgress(window.scrollY / total);
    };
    const onMouse = (e: MouseEvent) => {
      mx.current = e.clientX;
      my.current = e.clientY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  // ── Custom cursor (always visible via mix‑blend‑mode) ──
  useEffect(() => {
    const dot = cursorDot.current;
    const ring = cursorRing.current;
    if (!dot || !ring) return;
    let rx = 0,
      ry = 0;
    const animate = () => {
      rx += (mx.current - rx) * 0.14;
      ry += (my.current - ry) * 0.14;
      dot.style.transform = `translate(${mx.current}px, ${my.current}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // ── Hover effects ──
  useEffect(() => {
    const addHover = () => setCursorHover(true);
    const removeHover = () => setCursorHover(false);
    const els = document.querySelectorAll('.hoverable');
    els.forEach((el) => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });
    return () => {
      els.forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  // ── Scroll reveal ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.rv').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Marquee HTML ──
  const marqueeHtml = (() => {
    const words = [
      'RED BULL',
      '·',
      'GIVES YOU WINGS',
      '·',
      'EST. 1987',
      '·',
      '175 COUNTRIES',
      '·',
      '12B+ CANS',
      '·',
    ];
    let str = '';
    for (let i = 0; i < 6; i++) {
      words.forEach((w) => {
        str += w === '·' ? '<span class="sep">·</span>' : `<span>${w}</span>`;
      });
    }
    return str + str;
  })();

  return (
    <>
      {/* ── Cursor ── */}
      <div
        ref={cursorDot}
        className="fixed top-0 left-0 pointer-events-none z-9999 rounded-full mix-blend-difference transition-all duration-200"
        style={{
          width: cursorHover ? '18px' : '8px',
          height: cursorHover ? '18px' : '8px',
          background: '#fff',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        ref={cursorRing}
        className="fixed top-0 left-0 pointer-events-none z-9999 rounded-full border mix-blend-difference transition-all duration-100"
        style={{
          width: cursorHover ? '50px' : '32px',
          height: cursorHover ? '50px' : '32px',
          borderColor: 'rgba(255,255,255,0.35)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative h-screen min-h-175 flex items-center overflow-hidden bg-[#06060a]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_70%_50%,rgba(232,23,28,.06)_0%,transparent_65%)]" />
        <div className="relative z-20 px-[8vw] max-w-[54%] pointer-events-none">
          <p className="text-xs tracking-[.35em] uppercase text-[#e8171c] mb-7 opacity-0 animate-[fuv_.8s_.2s_forwards] font-[Barlow_Condensed]">
            Est. 1987 · Fuschl am See, Austria
          </p>
          <h1 className="text-[clamp(5rem,11vw,10rem)] leading-[.9] tracking-[.02em] text-[#f2eeea] opacity-0 animate-[fuv_.8s_.45s_forwards] font-[Bebas_Neue]">
            GIVES
            <br />
            YOU
            <br />
            <em className="text-[#e8171c] not-italic">WINGS.</em>
          </h1>
          <p className="text-base leading-7 text-white/40 mt-9 max-w-92.5 font-light opacity-0 animate-[fuv_.8s_.7s_forwards] font-[Barlow]">
            One can. Four decades of energy science. The formula trusted by over
            12 billion people across 175 countries — every single year.
          </p>
          <div className="flex gap-4 mt-12 pointer-events-auto opacity-0 animate-[fuv_.8s_.95s_forwards]">
            <a
              href="#formula"
              className="text-sm tracking-[.2em] uppercase text-[#06060a] bg-[#e8171c] py-4 px-9 rounded-sm hover:bg-[#b01015] hover:-translate-y-0.5 transition-all font-[Barlow_Condensed] hoverable"
            >
              Explore Formula
            </a>
            <a
              href="#showcase"
              className="text-sm tracking-[.2em] uppercase text-[#f2eeea] border border-white/20 py-4 px-9 rounded-sm hover:border-white/40 transition-colors font-[Barlow_Condensed] hoverable"
            >
              View the Can →
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-0 animate-[fuv_.8s_1.3s_forwards]">
          <span className="text-xs tracking-[.3em] uppercase text-white/25 font-[Barlow_Condensed]">
            Scroll
          </span>
          <div className="w-px h-12 bg-linear-to-b from-[#e8171c]/40 to-transparent animate-[spulse_2s_ease-in-out_infinite]" />
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="bg-[#e8171c] py-3 overflow-hidden whitespace-nowrap select-none">
        <div
          className="inline-flex animate-[mq_22s_linear_infinite] [&>span]:text-base [&>span]:tracking-[.18em] [&>span]:text-white [&>span]:px-9 [&>.sep]:text-white/40 font-[Bebas_Neue]"
          dangerouslySetInnerHTML={{ __html: marqueeHtml }}
        />
      </div>

      {/* ── Stats ── */}
      <section
        id="energy"
        className="py-36 bg-[#0e0e14] border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-[6vw] grid grid-cols-4">
          {[
            { value: '12B+', label: 'Cans sold annually' },
            { value: '175+', label: 'Countries worldwide' },
            { value: '80mg', label: 'Caffeine per 250ml' },
            { value: '37+', label: 'Years of energy' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rv p-16 border-r border-white/5 last:border-r-0 relative overflow-hidden group hoverable after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#e8171c] after:transition-all after:duration-500 hover:after:w-full"
            >
              <span className="text-[5.5rem] leading-none text-[#f2eeea] font-[Bebas_Neue]">
                {stat.value}
              </span>
              <span className="text-xs tracking-[.2em] uppercase text-white/30 mt-1 block font-[Barlow_Condensed]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-36">
        <div className="max-w-7xl mx-auto px-[6vw]">
          <span className="text-xs tracking-[.38em] uppercase text-[#e8171c] mb-4 block font-[Barlow_Condensed] rv">
            Why Red Bull
          </span>
          <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[.98] text-[#f2eeea] rv mb-16 font-[Bebas_Neue]">
            ENGINEERED FOR
            <br />
            <em className="text-[#e8171c] not-italic">PERFORMANCE</em>
          </h2>
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {[
              {
                num: '01',
                icon: 'M22 4L5 13v18l17 9 17-9V13L22 4zM22 4v26M5 13l17 9 17-9',
                head: 'Peak Mental Focus',
                body: 'Caffeine and B-vitamins synergise to sharpen concentration and reaction time, keeping you sharp when it matters most.',
              },
              {
                num: '02',
                icon: 'M22 22m-16 0a16 16 0 1 0 32 0 16 16 0 1 0 -32 0M22 10v12l8 5',
                head: 'Sustained Energy',
                body: 'A smooth, lasting energy lift that carries you through long sessions — without the hard crash of a coffee spike.',
              },
              {
                num: '03',
                icon: 'M6 38l8-16 8 8 8-20 8 28',
                head: 'Athletic Performance',
                body: 'Trusted by over 600 elite athletes across 22 disciplines. The science of energy, refined over four decades of competition.',
              },
              {
                num: '04',
                icon: 'M22 5c-9.4 0-17 7.6-17 17s7.6 17 17 17 17-7.6 17-17M28 5l12 6-6 12',
                head: 'Revitalises Body & Mind',
                body: 'Taurine — a naturally occurring amino acid — supports cardiovascular function and electrolyte balance during physical exertion.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="rv bg-[#06060a] p-12 relative overflow-hidden group hover:bg-[#0e0e14] transition-colors hoverable"
              >
                <div className="text-[7rem] leading-none text-[#e8171c]/10 absolute top-4 right-8 pointer-events-none group-hover:text-[#e8171c]/15 transition-colors font-[Bebas_Neue]">
                  {f.num}
                </div>
                <svg
                  className="w-11 h-11 mb-10 text-[#e8171c]"
                  viewBox="0 0 44 44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path
                    d={f.icon}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-4xl tracking-[.03em] text-[#f2eeea] mb-4 leading-tight font-[Bebas_Neue]">
                  {f.head}
                </h3>
                <p className="text-sm leading-7 text-white/40 max-w-xs font-light font-[Barlow]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase (The Can) ── */}
      <section
        id="showcase"
        className="py-32 bg-[#0e0e14] relative z-10"
      >
        <div className="max-w-7xl mx-auto px-[6vw] grid grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-xs tracking-[.38em] uppercase text-[#e8171c] mb-4 block font-[Barlow_Condensed] rv">
              The Can
            </span>
            <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[.98] text-[#f2eeea] mb-8 font-[Bebas_Neue] rv">
              250ml OF
              <br />
              <em className="text-[#e8171c] not-italic">PURE ENERGY</em>
            </h2>
            <p className="text-sm leading-7 text-white/40 font-light mb-6 font-[Barlow] rv">
              Every curve of the Red Bull can is deliberate. Lightweight,
              pressurised aluminium. Engineered for the hand, the shelf, and the
              moment you need it most.
            </p>
            <p className="text-sm leading-7 text-white/40 font-light mb-8 font-[Barlow] rv">
              The iconic blue and silver colourway has become one of the most
              recognised silhouettes in beverage history — in over 175 countries.
            </p>
            <ul className="rv space-y-0 border-y border-white/5">
              {[
                { key: 'Volume', val: '250 ml' },
                { key: 'Caffeine', val: '80 mg' },
                { key: 'Taurine', val: '1,000 mg' },
                { key: 'Calories', val: '110 kcal' },
                { key: 'Sugar', val: '27 g' },
                { key: 'Material', val: 'Recyclable Aluminium' },
              ].map((item) => (
                <li
                  key={item.key}
                  className="flex justify-between items-center py-4 text-sm tracking-wider font-[Barlow_Condensed]"
                >
                  <span className="uppercase tracking-[.15em] text-xs text-white/35">
                    {item.key}
                  </span>
                  <span className="text-[#f2eeea]">{item.val}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full aspect-square" />
        </div>
      </section>

      {/* ── Ingredients ── */}
      <section
        id="formula"
        className="py-32 bg-[#f2eeea] text-[#06060a] relative overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[19vw] text-black/5 whitespace-nowrap font-[Bebas_Neue]">
            FORMULA
          </span>
        </div>
        <div className="max-w-7xl mx-auto px-[6vw] relative z-10">
          <span className="text-xs tracking-[.38em] uppercase text-[#e8171c] mb-4 block font-[Barlow_Condensed] rv">
            The Formula
          </span>
          <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[.98] text-[#06060a] mb-12 font-[Bebas_Neue] rv">
            EVERY INGREDIENT
            <br />
            <em className="text-[#e8171c] not-italic">HAS A PURPOSE</em>
          </h2>
          <div className="grid grid-cols-3 gap-px bg-black/10">
            {[
              {
                name: 'Caffeine',
                dose: '80 mg per 250 ml',
                effect: 'Alertness · Focus',
              },
              {
                name: 'Taurine',
                dose: '1,000 mg · amino acid',
                effect: 'Cardiovascular · Endurance',
              },
              {
                name: 'B3 Niacin',
                dose: '22 mg · 138% NRV',
                effect: 'Energy Metabolism',
              },
              {
                name: 'B5 Pantothenic Acid',
                dose: '5 mg · 83% NRV',
                effect: 'Reduces Fatigue',
              },
              {
                name: 'B6 Pyridoxine',
                dose: '5 mg · 357% NRV',
                effect: 'Protein Metabolism',
              },
              {
                name: 'B12 Cobalamin',
                dose: '5.4 μg · 216% NRV',
                effect: 'Nervous System',
              },
              {
                name: 'Sucrose',
                dose: '11 g carbohydrate',
                effect: 'Rapid Fuel',
              },
              {
                name: 'Glucose',
                dose: '11 g immediate',
                effect: 'Instant Energy',
              },
              {
                name: 'Inositol',
                dose: '50 mg',
                effect: 'Mood · Cognition',
              },
            ].map((ig, i) => (
              <div
                key={i}
                className="rv bg-[#f2eeea] p-8 relative overflow-hidden group hover:bg-[#e8e4dd] transition-colors hoverable before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#e8171c] before:scale-y-0 before:transition-transform before:duration-300 before:ease before:origin-bottom hover:before:scale-y-100"
              >
                <span className="text-lg font-bold tracking-[.07em] uppercase text-[#06060a] block mb-1 font-[Barlow_Condensed]">
                  {ig.name}
                </span>
                <span className="text-sm text-black/40 font-light font-[Barlow]">
                  {ig.dose}
                </span>
                <span className="text-xs text-[#e8171c] tracking-widest uppercase mt-2 block font-[Barlow_Condensed]">
                  {ig.effect}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editions ── */}
      <section id="editions" className="py-36">
        <div className="max-w-7xl mx-auto px-[6vw]">
          <span className="text-xs tracking-[.38em] uppercase text-[#e8171c] mb-4 block font-[Barlow_Condensed] rv">
            Product Range
          </span>
          <h2 className="text-[clamp(3rem,6vw,5.5rem)] leading-[.98] text-[#f2eeea] mb-16 font-[Bebas_Neue] rv">
            THE <em className="text-[#e8171c] not-italic">EDITIONS</em>
          </h2>
          <div className="grid grid-cols-3 gap-px bg-white/5">
            {[
              {
                bar: '#e8171c',
                tag: 'Original',
                name: 'Red Bull Classic',
                desc: 'The original energy drink. The formula that defined a category.',
              },
              {
                bar: '#9bb8d4',
                tag: 'Sugar Free',
                name: 'Sugar Free',
                desc: 'All the energy. None of the sugar.',
              },
              {
                bar: '#2a7a3b',
                tag: 'Green Edition',
                name: 'Kiwi Apple',
                desc: 'Crisp kiwi-apple with full energy formula.',
              },
              {
                bar: '#9b4dca',
                tag: 'Purple Edition',
                name: 'Açaí Berry',
                desc: 'Deep, bold açaí berry. Legendary wings.',
              },
              {
                bar: '#e8a020',
                tag: 'Yellow Edition',
                name: 'Tropical Fruits',
                desc: 'Sun-bright tropical flavour.',
              },
              {
                bar: '#c0392b',
                tag: 'Winter Edition',
                name: 'Pomegranate',
                desc: 'Rich pomegranate. Limited season.',
              },
            ].map((ed, i) => (
              <div
                key={i}
                className="rv bg-[#06060a] p-10 relative overflow-hidden group hover:bg-[#0e0e14] transition-colors hoverable"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400"
                  style={{ background: ed.bar }}
                />
                <span className="text-xs tracking-[.28em] uppercase text-white/30 mb-5 block font-[Barlow_Condensed]">
                  {ed.tag}
                </span>
                <div className="text-3xl text-[#f2eeea] mb-2 leading-none font-[Bebas_Neue]">
                  {ed.name}
                </div>
                <p className="text-sm leading-7 text-white/35 font-light font-[Barlow]">
                  {ed.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section id="quote" className="py-40 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_50%,rgba(232,23,28,.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-225 mx-auto px-[6vw] relative z-10">
          <blockquote className="text-[clamp(3rem,7vw,6.5rem)] leading-[1.05] font-[Bebas_Neue] rv">
            &quot;IT'S NOT JUST AN ENERGY DRINK — IT'S A{' '}
            <em className="text-[#e8171c] not-italic">MINDSET.</em>&quot;
          </blockquote>
          <span className="text-xs tracking-[.3em] uppercase text-white/25 mt-10 block font-[Barlow_Condensed] rv">
            Red Bull Racing · Formula 1 World Champions
          </span>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section id="cta" className="py-40 text-center bg-[#0e0e14]">
        <div className="max-w-7xl mx-auto px-[6vw]">
          <h2 className="text-[clamp(4rem,9vw,8.5rem)] text-[#f2eeea]  leading-[.95] mb-12 font-[Bebas_Neue] rv">
            READY TO
            <em className="text-[#e8171c] not-italic block">FLY?</em>
          </h2>
          <div className="rv flex gap-4 justify-center">
            <a
              href="#"
              className="text-sm tracking-[.2em] uppercase text-[#06060a] bg-[#e8171c] py-4 px-9 rounded-sm hover:bg-[#b01015] transition-colors font-[Barlow_Condensed] hoverable"
            >
              Get Your Wings
            </a>
            <a
              href="#formula"
              className="text-sm tracking-[.2em] uppercase text-[#f2eeea] border border-white/20 py-4 px-9 rounded-sm hover:border-white/40 transition-colors font-[Barlow_Condensed] hoverable"
            >
              Learn More →
            </a>
          </div>
        </div>
      </section>

            {/* ── Footer (NO can) ── */}
      <footer
        id="footer"
        className="border-t border-white/5 py-14 px-[6vw] grid grid-cols-[auto_1fr_auto] items-center gap-8 bg-[#06060a] relative z-60"
      >
        <div className="text-2xl tracking-[.08em] text-[#f2eeea] font-[Bebas_Neue]">
          RED<span className="text-[#e8171c]">BULL</span>
        </div>
        <nav className="flex gap-8 justify-center">
          {['Energy Drinks', 'Athletes', 'Events', 'Media', 'Careers'].map(
            (l) => (
              <a
                key={l}
                href="#"
                className="text-xs tracking-[.18em] uppercase text-white/25 hover:text-white/60 transition-colors font-[Barlow_Condensed] hoverable"
              >
                {l}
              </a>
            )
          )}
        </nav>
        <p className="text-xs text-white/20 tracking-[.08em] text-right font-[Barlow]">
          © 2024 Red Bull GmbH.
          <br />
          All rights reserved.
        </p>
      </footer>


      {/* ── Floating 3D Can (always vertically centered) ── */}
      <FloatingCan scrollProgress={scrollProgress} />

      {/* ── Essential styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;1,300&family=Barlow:ital,wght@0,300;0,400;1,300&display=swap');
        body { cursor: none; }
        @keyframes fuv { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes spulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        .rv { opacity: 0; transform: translateY(36px); transition: opacity 0.85s ease, transform 0.85s ease; }
        .rv.in { opacity: 1; transform: none; }

\
      `}</style>
    </>
  );
}