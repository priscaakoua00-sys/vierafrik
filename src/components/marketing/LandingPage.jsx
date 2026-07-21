import { useEffect, useRef, useState } from "react";
import { PLANS } from "../../data/pricing.js";

// ══════════════════════════════════════════════════════
//  Page publique VierAfrik — restaurée à partir de la version
//  d'origine (photo et histoire de la fondatrice, eBook + QR code,
//  captures de chaque fonctionnalité, moyens de paiement, avis,
//  programme ambassadeur), simplement rebranchée sur l'app React
//  au lieu de pointer vers un lien externe séparé.
// ══════════════════════════════════════════════════════

const CSS = `
:root{
  --ink:#05080E; --ink-2:#080F17; --surface:#0C1620; --surface-2:#14232F;
  --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.14);
  --green:#00D478; --green-br:#2BF39A; --gold:#E9B949; --gold-2:#F6D488;
  --violet:#7C5CFF; --blue:#2E90FA; --red:#FF6B6B;
  --text:#EDF3EE; --muted:#93A6AE; --muted-2:#5F727A;
  --maxw:1200px; --display:'Sora',sans-serif; --body:'Inter',sans-serif; --mono:'Space Mono',monospace;
}
.vaf-landing *{box-sizing:border-box}
.vaf-landing{background:var(--ink);color:var(--text);font-family:var(--body);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.vaf-landing a{color:inherit;text-decoration:none}
.vaf-landing img{max-width:100%;display:block}
.vaf-landing .wrap{max-width:var(--maxw);margin:0 auto;padding:0 22px}
.vaf-landing .eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--green-br)}
.vaf-landing h1,.vaf-landing h2,.vaf-landing h3{font-family:var(--display);line-height:1.08;letter-spacing:-.02em;font-weight:700}
.vaf-landing .accent{color:var(--green-br)} .vaf-landing .accent-gold{color:var(--gold)}
.vaf-landing .btn{display:inline-flex;align-items:center;gap:9px;font-family:var(--display);font-weight:600;font-size:.95rem;padding:14px 24px;border-radius:13px;cursor:pointer;border:1px solid transparent;transition:transform .18s,box-shadow .18s,background .18s;white-space:nowrap}
.vaf-landing .btn svg{width:18px;height:18px}
.vaf-landing .btn-primary{background:linear-gradient(135deg,var(--green),#00B884);color:#fff;box-shadow:0 10px 34px rgba(15,160,59,.42),inset 0 1px 0 rgba(255,255,255,.25)}
.vaf-landing .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 46px rgba(15,160,59,.55)}
.vaf-landing .btn-ghost{background:rgba(255,255,255,.05);color:var(--text);border-color:var(--line-2);backdrop-filter:blur(6px)}
.vaf-landing .btn-ghost:hover{background:rgba(255,255,255,.1);transform:translateY(-2px)}
.vaf-landing .btn-sm{padding:11px 17px;font-size:.86rem}
.vaf-landing header{position:sticky;top:0;z-index:80;background:rgba(6,11,16,.78);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.vaf-landing .nav{display:flex;align-items:center;justify-content:space-between;height:66px}
.vaf-landing .brand{font-family:var(--display);font-weight:800;font-size:1.22rem;letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
.vaf-landing .brand b{color:var(--green-br)}
.vaf-landing .nav-links{display:flex;align-items:center;gap:26px}
.vaf-landing .nav-links a{font-size:.9rem;color:var(--muted);font-weight:500;transition:color .15s}
.vaf-landing .nav-links a:hover{color:var(--text)}
.vaf-landing .nav-cta{display:flex;align-items:center;gap:10px}
.vaf-landing .hamb{display:none;background:none;border:1px solid var(--line-2);border-radius:10px;width:42px;height:42px;color:var(--text);cursor:pointer;align-items:center;justify-content:center}
.vaf-landing .hamb svg{width:22px;height:22px}
.vaf-landing .mobile-panel{display:none;border-top:1px solid var(--line);background:var(--ink-2)}
.vaf-landing .mobile-panel.open{display:block}
.vaf-landing .mobile-panel a{display:block;padding:14px 22px;border-bottom:1px solid var(--line);color:var(--text);font-weight:500}
.vaf-landing .mobile-panel .btn{margin:16px 22px;width:calc(100% - 44px);justify-content:center}
@keyframes vafFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
@keyframes vafFloatPhone{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 14px))}}
@keyframes vafFloatY2{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-12px) rotate(-3deg)}}
@keyframes vafFloatY3{0%,100%{transform:translateY(0) rotate(4deg)}50%{transform:translateY(-16px) rotate(4deg)}}
@keyframes vafGlowPulse{0%,100%{opacity:.75}50%{opacity:1}}
.vaf-landing .f-slow{animation:vafFloatY 6.5s ease-in-out infinite}
.vaf-landing .f-a{animation:vafFloatY 4.6s ease-in-out infinite}
.vaf-landing .f-b{animation:vafFloatY 5.3s ease-in-out infinite .5s}
.vaf-landing .f-c{animation:vafFloatY 5.9s ease-in-out infinite .3s}
.vaf-landing .f-r1{animation:vafFloatY2 5s ease-in-out infinite}
.vaf-landing .f-r2{animation:vafFloatY3 5.6s ease-in-out infinite .4s}
.vaf-landing .hero{position:relative;padding:72px 0 60px;overflow:hidden}
.vaf-landing .hero::before{content:"";position:absolute;inset:0;z-index:-2;background:
  radial-gradient(720px 460px at 82% 6%,rgba(15,160,59,.22),transparent 62%),
  radial-gradient(620px 420px at 6% 92%,rgba(233,185,73,.12),transparent 60%),
  radial-gradient(500px 500px at 60% 60%,rgba(124,92,255,.08),transparent 60%)}
.vaf-landing .hero::after{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:46px 46px;mask-image:radial-gradient(700px 500px at 70% 30%,#000,transparent 75%)}
.vaf-landing .hero-grid{display:grid;grid-template-columns:1.02fr .98fr;gap:40px;align-items:center}
.vaf-landing .pill{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;background:rgba(15,160,59,.12);border:1px solid rgba(15,160,59,.34);color:var(--green-br);padding:7px 14px;border-radius:999px;margin-bottom:22px}
.vaf-landing .pill .dot{width:7px;height:7px;border-radius:50%;background:var(--green-br);box-shadow:0 0 0 4px rgba(15,160,59,.2)}
.vaf-landing .hero h1{font-size:clamp(2.4rem,5.6vw,3.9rem);font-weight:800;margin-bottom:20px}
.vaf-landing .hero h1 .grad{background:linear-gradient(120deg,var(--green-br),var(--gold));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.vaf-landing .hero p.lead{font-size:1.13rem;color:var(--muted);max-width:520px;margin-bottom:28px}
.vaf-landing .hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px}
.vaf-landing .hero-badges{display:flex;flex-wrap:wrap;gap:10px 20px}
.vaf-landing .hero-badges span{display:inline-flex;align-items:center;gap:7px;font-size:.83rem;color:var(--muted)}
.vaf-landing .hero-badges svg{width:16px;height:16px;color:var(--green-br)}
.vaf-landing .flags{margin-top:22px;font-size:1.15rem;letter-spacing:3px}
.vaf-landing .flags small{display:block;font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-2);margin-bottom:7px}
.vaf-landing .scene{position:relative;height:560px;width:100%}
.vaf-landing .scene .halo{position:absolute;top:50%;left:52%;transform:translate(-50%,-50%);width:420px;height:420px;border-radius:50%;
  background:radial-gradient(circle,rgba(15,160,59,.4),transparent 62%);filter:blur(30px);z-index:0;animation:vafGlowPulse 6s ease-in-out infinite}
.vaf-landing .phone{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:vafFloatPhone 6.5s ease-in-out infinite;width:270px;height:540px;border-radius:42px;z-index:3;
  background:linear-gradient(160deg,#1a2a36,#0a141c);padding:12px;
  box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.06),inset 0 1px 0 rgba(255,255,255,.14)}
.vaf-landing .phone-screen{width:100%;height:100%;border-radius:32px;background:#0B1620;overflow:hidden;position:relative;border:1px solid rgba(255,255,255,.05)}
.vaf-landing .app-top{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 10px}
.vaf-landing .app-brand{font-family:var(--display);font-weight:700;font-size:.95rem;display:flex;align-items:center;gap:6px}
.vaf-landing .app-bell{width:16px;height:16px;color:var(--muted)}
.vaf-landing .app-balance{margin:0 14px;padding:15px;border-radius:16px;background:linear-gradient(140deg,var(--green),#00A06C);position:relative;overflow:hidden}
.vaf-landing .app-balance .lbl{font-size:.68rem;color:rgba(255,255,255,.85)}
.vaf-landing .app-balance .val{font-family:var(--mono);font-weight:700;font-size:1.32rem;color:#fff;margin-top:2px}
.vaf-landing .app-balance svg{position:absolute;right:8px;bottom:6px;width:96px;height:34px;opacity:.85}
.vaf-landing .app-rows{padding:12px 14px 0}
.vaf-landing .app-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.8rem}
.vaf-landing .app-row .l{display:flex;align-items:center;gap:8px;color:#cdd8dc}
.vaf-landing .app-row .ic{width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center}
.vaf-landing .app-row .ic svg{width:13px;height:13px;color:#fff}
.vaf-landing .app-row .n{font-family:var(--mono);font-weight:700;color:#fff}
.vaf-landing .app-nav{position:absolute;bottom:0;left:0;right:0;height:52px;background:#0E1D28;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-around}
.vaf-landing .app-nav .item{font-size:.6rem;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:3px}
.vaf-landing .app-nav .item svg{width:16px;height:16px}
.vaf-landing .app-nav .plus{width:42px;height:42px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin-top:-18px;box-shadow:0 8px 20px rgba(15,160,59,.5)}
.vaf-landing .app-nav .plus svg{width:20px;height:20px;color:#fff}
.vaf-landing .fcard{position:absolute;z-index:5;background:rgba(19,32,42,.82);backdrop-filter:blur(14px);border:1px solid var(--line-2);border-radius:16px;padding:13px 15px;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.vaf-landing .fcard .row{display:flex;align-items:center;gap:10px}
.vaf-landing .fcard .badge{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.vaf-landing .fcard .badge svg{width:18px;height:18px;color:#fff}
.vaf-landing .fcard .t{font-size:.7rem;color:var(--muted)}
.vaf-landing .fcard .v{font-family:var(--mono);font-weight:700;font-size:.98rem}
.vaf-landing .fc-invoice{top:34px;left:-6px}
.vaf-landing .fc-pay{top:120px;right:-14px}
.vaf-landing .fc-stat{bottom:96px;right:6px;display:flex;align-items:center;gap:8px}
.vaf-landing .fc-stat .up{font-family:var(--mono);font-weight:700;color:var(--green-br);font-size:1.1rem}
.vaf-landing .fc-person{bottom:24px;left:-10px;padding:10px 13px 10px 10px}
.vaf-landing .fc-person img{width:44px;height:44px;border-radius:12px;object-fit:cover}
.vaf-landing .fc-person .who b{font-family:var(--display);font-size:.82rem;display:block}
.vaf-landing .fc-person .who span{font-size:.68rem;color:var(--muted)}
.vaf-landing .chip{position:absolute;z-index:4;width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 16px 34px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.3)}
.vaf-landing .chip svg{width:24px;height:24px;color:#fff}
.vaf-landing .chip-1{top:6px;right:70px;background:linear-gradient(150deg,#17b84c,#00B884)}
.vaf-landing .chip-2{top:70px;left:-2px;background:linear-gradient(150deg,#ffd06b,#d99a2a)}
.vaf-landing .chip-3{bottom:150px;left:8px;background:linear-gradient(150deg,#9b7cff,#6a45e6)}
.vaf-landing .chip-4{bottom:60px;right:-4px;background:linear-gradient(150deg,#48a9ff,#2170d6)}
.vaf-landing .section{padding:80px 0;position:relative}
.vaf-landing .section-head{max-width:700px;margin:0 auto 48px;text-align:center}
.vaf-landing .section-head h2{font-size:clamp(1.9rem,4vw,2.7rem);margin:14px 0}
.vaf-landing .section-head p{color:var(--muted);font-size:1.06rem}
.vaf-landing .tint{background:linear-gradient(180deg,var(--ink-2),var(--ink));border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.vaf-landing .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.vaf-landing .stat{text-align:center;padding:28px 14px;background:linear-gradient(160deg,var(--surface),var(--ink-2));border:1px solid var(--line);border-radius:18px;position:relative;overflow:hidden}
.vaf-landing .stat::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--green),var(--gold))}
.vaf-landing .stat .n{font-family:var(--mono);font-size:2.1rem;font-weight:700}
.vaf-landing .stat .t{font-size:.86rem;color:var(--muted);margin-top:4px}
.vaf-landing .logowall{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
.vaf-landing .ltile{aspect-ratio:1/.72;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff;font-family:var(--display);font-weight:600;font-size:.82rem;box-shadow:0 14px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.22);transition:transform .2s}
.vaf-landing .ltile:hover{transform:translateY(-5px)}
.vaf-landing .ltile svg{width:26px;height:26px}
.vaf-landing .lt1{background:linear-gradient(150deg,#17b84c,#00A06C)}
.vaf-landing .lt2{background:linear-gradient(150deg,#ffcf6a,#cf9526)}
.vaf-landing .lt3{background:linear-gradient(150deg,#9b7cff,#5f3fd6)}
.vaf-landing .lt4{background:linear-gradient(150deg,#4aa9ff,#1f6fd0)}
.vaf-landing .lt5{background:linear-gradient(150deg,#ff8a6b,#d9532c)}
.vaf-landing .lt6{background:linear-gradient(150deg,#2bd4c0,#128a7c)}
.vaf-landing .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.vaf-landing .card{background:linear-gradient(160deg,var(--surface),var(--ink-2));border:1px solid var(--line);border-radius:18px;padding:26px;transition:transform .2s,border-color .2s;position:relative}
.vaf-landing .card:hover{transform:translateY(-4px);border-color:var(--line-2)}
.vaf-landing .icon-box{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 10px 24px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25)}
.vaf-landing .icon-box svg{width:23px;height:23px;color:#fff}
.vaf-landing .ib-green{background:linear-gradient(150deg,#17b84c,#00A06C)}
.vaf-landing .ib-gold{background:linear-gradient(150deg,#ffcf6a,#cf9526)}
.vaf-landing .ib-violet{background:linear-gradient(150deg,#9b7cff,#5f3fd6)}
.vaf-landing .ib-blue{background:linear-gradient(150deg,#4aa9ff,#1f6fd0)}
.vaf-landing .card h3{font-size:1.12rem;margin-bottom:8px}
.vaf-landing .card p{color:var(--muted);font-size:.94rem}
.vaf-landing .prob .solve{display:flex;align-items:center;gap:9px;color:var(--green-br);font-weight:600;font-size:.9rem;background:rgba(15,160,59,.08);border:1px solid rgba(15,160,59,.2);border-radius:11px;padding:11px 13px;margin-top:14px}
.vaf-landing .prob .solve svg{width:17px;height:17px;flex-shrink:0}
.vaf-landing .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.vaf-landing .step{padding:28px 22px;background:linear-gradient(160deg,var(--surface),var(--ink-2));border:1px solid var(--line);border-radius:18px}
.vaf-landing .step .num{font-family:var(--mono);font-size:.8rem;color:#fff;background:linear-gradient(150deg,var(--green),#00A06C);width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:16px;box-shadow:0 8px 18px rgba(15,160,59,.4)}
.vaf-landing .step h3{font-size:1.06rem;margin-bottom:7px}
.vaf-landing .step p{color:var(--muted);font-size:.9rem}
.vaf-landing .imgwrap{display:grid;gap:24px}
.vaf-landing .imgwrap.two{grid-template-columns:1fr 1fr}
@keyframes vafFloatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
.vaf-landing .fl{animation:vafFloatCard 6s ease-in-out infinite}
.vaf-landing .fl2{animation:vafFloatCard 6.7s ease-in-out infinite .5s}
.vaf-landing .fl3{animation:vafFloatCard 7.3s ease-in-out infinite .3s}
.vaf-landing .fl4{animation:vafFloatCard 6.9s ease-in-out infinite .8s}
.vaf-landing .imgcard{display:block;border-radius:20px;overflow:hidden;border:1px solid var(--line-2);background:var(--surface);position:relative;box-shadow:0 26px 60px rgba(0,0,0,.55);transition:transform .35s,box-shadow .35s}
.vaf-landing .imgcard::after{content:"";position:absolute;inset:0;border-radius:20px;box-shadow:inset 0 0 0 1px rgba(0,212,120,.18);pointer-events:none}
.vaf-landing .imgcard:hover{transform:translateY(-8px) scale(1.01);box-shadow:0 42px 90px rgba(0,212,120,.3)}
.vaf-landing .imgcard img{width:100%;display:block}
.vaf-landing .pay-cat{font-family:var(--mono);font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:34px 0 18px;display:flex;align-items:center;gap:10px}
.vaf-landing .pay-cat::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(0,212,120,.2)}
.vaf-landing .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.vaf-landing .tcard{background:linear-gradient(160deg,var(--surface),var(--ink-2));border:1px solid var(--line);border-radius:18px;padding:24px;display:flex;flex-direction:column}
.vaf-landing .stars{color:var(--gold);font-size:.9rem;letter-spacing:2px;margin-bottom:12px}
.vaf-landing .tcard q{font-size:.96rem;color:var(--text);line-height:1.6;margin-bottom:18px;display:block}
.vaf-landing .tcard q b{color:var(--green-br);font-weight:600}
.vaf-landing .tperson{display:flex;align-items:center;gap:12px;margin-top:auto}
.vaf-landing .avatar{width:46px;height:46px;border-radius:50%;flex-shrink:0;background:linear-gradient(140deg,var(--surface-2),var(--ink-2));border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;color:var(--green-br);font-size:1.05rem;overflow:hidden}
.vaf-landing .tperson .who b{display:block;font-family:var(--display);font-weight:600;font-size:.95rem}
.vaf-landing .tperson .who span{font-size:.8rem;color:var(--muted)}
.vaf-landing .price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch}
.vaf-landing .plan{background:linear-gradient(160deg,var(--surface),var(--ink-2));border:1px solid var(--line);border-radius:18px;padding:30px 26px;display:flex;flex-direction:column;position:relative}
.vaf-landing .plan.pop{border-color:rgba(15,160,59,.5);box-shadow:0 24px 70px rgba(15,160,59,.18)}
.vaf-landing .plan .ribbon{position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:.66rem;letter-spacing:.08em;background:linear-gradient(135deg,var(--green),#00A06C);color:#fff;padding:5px 13px;border-radius:8px;font-weight:700;white-space:nowrap;box-shadow:0 8px 18px rgba(15,160,59,.4)}
.vaf-landing .plan h3{font-size:1.25rem;margin-bottom:4px}
.vaf-landing .plan .sub{color:var(--muted);font-size:.85rem;margin-bottom:16px}
.vaf-landing .plan .amt{font-family:var(--mono);font-size:2rem;font-weight:700;margin-bottom:20px}
.vaf-landing .plan .amt small{font-family:var(--body);font-size:.85rem;color:var(--muted);font-weight:400}
.vaf-landing .plan ul{list-style:none;margin-bottom:24px;flex:1;padding:0}
.vaf-landing .plan li{display:flex;gap:10px;align-items:flex-start;padding:7px 0;font-size:.9rem}
.vaf-landing .plan li svg{width:16px;height:16px;color:var(--green-br);flex-shrink:0;margin-top:4px}
.vaf-landing .plan .btn{width:100%;justify-content:center}
.vaf-landing .band{background:linear-gradient(150deg,var(--surface),var(--ink-2));border:1px solid var(--line-2);border-radius:26px;padding:46px;position:relative;overflow:hidden}
.vaf-landing .band::before{content:"";position:absolute;top:-40%;right:-10%;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(15,160,59,.22),transparent 65%)}
.vaf-landing .amb-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:26px 0 30px;position:relative}
.vaf-landing .amb-num{text-align:center}
.vaf-landing .amb-num .n{font-family:var(--mono);font-size:1.9rem;font-weight:700;color:var(--gold)}
.vaf-landing .amb-num .t{font-size:.82rem;color:var(--muted);margin-top:4px}
.vaf-landing .ebook-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:40px;align-items:center;position:relative}
.vaf-landing .ebook-seal{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);border:1px solid rgba(233,185,73,.34);padding:6px 13px;border-radius:999px;margin-bottom:18px}
.vaf-landing .ebook-grid h2{font-size:clamp(1.7rem,3.6vw,2.4rem);margin-bottom:16px}
.vaf-landing .ebook-quote{font-family:var(--display);font-size:1.2rem;font-weight:600;border-left:2px solid var(--green);padding-left:16px;margin-bottom:18px}
.vaf-landing .ebook-list{list-style:none;margin:18px 0 24px;padding:0}
.vaf-landing .ebook-list li{display:flex;gap:10px;padding:6px 0;color:var(--muted);font-size:.92rem}
.vaf-landing .ebook-list li svg{width:16px;height:16px;color:var(--green-br);flex-shrink:0;margin-top:5px}
.vaf-landing .qr-card{background:var(--surface);border:1px solid var(--line-2);border-radius:20px;padding:24px;text-align:center}
.vaf-landing .qr-card img{margin:0 auto 12px;border-radius:10px}
.vaf-landing .qr-card span{font-size:.8rem;color:var(--muted);font-family:var(--mono)}
.vaf-landing .founder-grid{display:grid;grid-template-columns:1fr 360px;gap:44px;align-items:center}
.vaf-landing .founder-grid h2{font-size:clamp(1.7rem,3.6vw,2.4rem);margin-bottom:18px}
.vaf-landing .founder-grid p{color:var(--muted);margin-bottom:16px}
.vaf-landing .founder-grid .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.vaf-landing .founder-card{position:relative;border-radius:24px;overflow:hidden;border:1px solid var(--line-2);box-shadow:0 30px 70px rgba(0,0,0,.5)}
.vaf-landing .founder-card img{width:100%;display:block}
.vaf-landing .founder-card .cap{position:absolute;left:0;right:0;bottom:0;padding:22px 20px 18px;background:linear-gradient(0deg,rgba(6,11,16,.95),transparent)}
.vaf-landing .founder-card .cap b{font-family:var(--display);font-size:1.15rem;display:block}
.vaf-landing .founder-card .cap span{color:var(--muted);font-size:.84rem}
.vaf-landing .founder-badge{position:absolute;top:14px;left:14px;font-family:var(--mono);font-size:.64rem;letter-spacing:.08em;background:rgba(15,160,59,.9);color:#fff;padding:5px 11px;border-radius:8px}
.vaf-landing .founder-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}
.vaf-landing .chip-t{font-family:var(--mono);font-size:.68rem;background:rgba(255,255,255,.05);border:1px solid var(--line);padding:6px 11px;border-radius:9px;color:var(--muted)}
.vaf-landing .faq{max-width:820px;margin:0 auto}
.vaf-landing .faq details{border:1px solid var(--line);border-radius:14px;margin-bottom:12px;background:var(--surface);overflow:hidden}
.vaf-landing .faq summary{list-style:none;cursor:pointer;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;font-family:var(--display);font-weight:600;font-size:1.02rem;gap:16px}
.vaf-landing .faq summary::-webkit-details-marker{display:none}
.vaf-landing .faq summary .plus{width:24px;height:24px;flex-shrink:0;color:var(--green-br);transition:transform .2s}
.vaf-landing .faq details[open] summary .plus{transform:rotate(45deg)}
.vaf-landing .faq .answer{padding:0 22px 20px;color:var(--muted);font-size:.94rem}
.vaf-landing .final{text-align:center;background:radial-gradient(680px 340px at 50% 0%,rgba(15,160,59,.18),transparent 62%);padding:92px 0}
.vaf-landing .final h2{font-size:clamp(2rem,4.4vw,3rem);margin-bottom:16px}
.vaf-landing .final p{color:var(--muted);max-width:520px;margin:0 auto 28px;font-size:1.05rem}
.vaf-landing .final .cta-line{font-family:var(--mono);font-size:.8rem;color:var(--muted-2);margin-top:20px}
.vaf-landing footer{border-top:1px solid var(--line);background:var(--ink-2);padding:56px 0 30px}
.vaf-landing .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px;margin-bottom:36px}
.vaf-landing .foot-brand p{color:var(--muted);font-size:.9rem;margin:12px 0 16px;max-width:280px}
.vaf-landing .foot-social{display:flex;gap:10px;flex-wrap:wrap}
.vaf-landing .foot-social a{width:40px;height:40px;border:1px solid var(--line);border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--muted);transition:.2s}
.vaf-landing .foot-social a:hover{color:#fff;border-color:var(--green);background:rgba(15,160,59,.12)}
.vaf-landing .foot-social svg{width:18px;height:18px}
.vaf-landing .foot-col h4{font-family:var(--display);font-size:.9rem;margin-bottom:14px}
.vaf-landing .foot-col a{display:block;color:var(--muted);font-size:.88rem;padding:5px 0;transition:color .15s}
.vaf-landing .foot-col a:hover{color:var(--green-br)}
.vaf-landing .foot-bottom{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.vaf-landing .foot-bottom .copy{font-size:.82rem;color:var(--muted-2)}
.vaf-landing .foot-bottom .trust{display:flex;gap:16px;font-family:var(--mono);font-size:.72rem;color:var(--muted-2)}
.vaf-landing .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.vaf-landing .reveal.in{opacity:1;transform:none}
@media(max-width:980px){
  .vaf-landing .hero-grid{grid-template-columns:1fr;gap:20px}
  .vaf-landing .scene{height:520px;transform:scale(.94)}
  .vaf-landing .stats{grid-template-columns:repeat(2,1fr)}
  .vaf-landing .logowall{grid-template-columns:repeat(3,1fr)}
  .vaf-landing .feat-grid,.vaf-landing .tgrid,.vaf-landing .price-grid,.vaf-landing .steps,.vaf-landing .grid-2,.vaf-landing .imgwrap.two{grid-template-columns:1fr}
  .vaf-landing .steps{grid-template-columns:1fr 1fr}
  .vaf-landing .pay-grid{grid-template-columns:repeat(2,1fr)}
  .vaf-landing .ebook-grid,.vaf-landing .founder-grid{grid-template-columns:1fr}
  .vaf-landing .foot-grid{grid-template-columns:1fr 1fr}
  .vaf-landing .amb-nums{grid-template-columns:1fr}
}
@media(max-width:640px){
  .vaf-landing .nav-links{display:none}.vaf-landing .nav-cta .btn-ghost{display:none}.vaf-landing .hamb{display:flex}
  .vaf-landing .steps{grid-template-columns:1fr}
  .vaf-landing .logowall{grid-template-columns:repeat(2,1fr)}
  .vaf-landing .foot-grid{grid-template-columns:1fr}.vaf-landing .section{padding:60px 0}.vaf-landing .band{padding:30px 22px}
  .vaf-landing .scene{transform:scale(.8);transform-origin:top center;height:470px;max-width:360px;margin:0 auto}
  .vaf-landing .fc-invoice{top:20px;left:0}
  .vaf-landing .fc-pay{top:120px;right:0}
  .vaf-landing .fc-stat{bottom:120px;right:0}
  .vaf-landing .fc-person{bottom:18px;left:0}
  .vaf-landing .chip-1{right:40px;top:0}
  .vaf-landing .chip-4{right:2px}
}
@media(prefers-reduced-motion:reduce){
  .vaf-landing *{animation:none!important}
  .vaf-landing .reveal{opacity:1;transform:none;transition:none}
}
`;

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function LandingPage({ onGetStarted, onLogin }) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (fn) => (e) => { e.preventDefault(); setMenuOpen(false); fn(); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="vaf-landing" ref={rootRef}>
      <style>{CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`}</style>

      <header>
        <div className="wrap nav">
          <a className="brand" href="#top" aria-label="VierAfrik accueil">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5L20 4.5" stroke="currentColor" strokeWidth="3.2" /><path d="M12 20.5L6.4 7.8" stroke="#00D478" strokeWidth="3.2" /></svg>
            Vier<b>Afrik</b>
          </a>
          <nav className="nav-links" aria-label="Navigation principale">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#paiements">Paiements</a>
            <a href="#plans">Tarifs</a>
            <a href="#ambassadeur">Ambassadeur</a>
            <a href="#ebook">eBook</a>
            <a href="#fondatrice">À propos</a>
          </nav>
          <div className="nav-cta">
            <a className="btn btn-ghost btn-sm" href="#" onClick={go(onLogin)}>Se connecter</a>
            <a className="btn btn-primary btn-sm" href="#" onClick={go(onGetStarted)}>Essai gratuit</a>
            <button className="hamb" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
        <div className={`mobile-panel${menuOpen ? " open" : ""}`}>
          <a href="#fonctionnalites" onClick={closeMenu}>Fonctionnalités</a>
          <a href="#paiements" onClick={closeMenu}>Paiements</a>
          <a href="#plans" onClick={closeMenu}>Tarifs</a>
          <a href="#ambassadeur" onClick={closeMenu}>Ambassadeur</a>
          <a href="#ebook" onClick={closeMenu}>eBook</a>
          <a href="#fondatrice" onClick={closeMenu}>À propos</a>
          <a className="btn btn-primary" href="#" onClick={go(onGetStarted)}>Créer mon compte, gratuit</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="reveal">
              <span className="pill"><span className="dot"></span> Pour les entrepreneurs africains, gratuit pour commencer</span>
              <h1>Gère ton business <span className="grad">comme un pro.</span></h1>
              <p className="lead">Factures, paiements Mobile Money, clients, Coach IA, réseau business. Tout ton business au bout des doigts, depuis ton téléphone, en 30 secondes.</p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#" onClick={go(onGetStarted)}><Arrow /> Créer mon compte, gratuit</a>
                <a className="btn btn-ghost" href="#fonctionnalites">Voir les fonctionnalités</a>
              </div>
              <div className="hero-badges">
                <span><Check /> Gratuit pour commencer</span>
                <span><Check /> Mobile Money</span>
                <span><Check /> 100% en français</span>
              </div>
              <div className="flags"><small>Disponible dans 10 pays</small>🇨🇮 🇸🇳 🇧🇯 🇨🇲 🇧🇫 🇹🇬 🇬🇭 🇲🇱 🇳🇪 🇬🇳</div>
            </div>

            <div className="reveal">
              <div className="scene">
                <div className="halo"></div>
                <div className="phone">
                  <div className="phone-screen">
                    <div className="app-top">
                      <span className="app-brand"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5L20 4.5" stroke="#fff" strokeWidth="3.4" /><path d="M12 20.5L6.4 7.8" stroke="#00D478" strokeWidth="3.4" /></svg> VierAfrik</span>
                      <svg className="app-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
                    </div>
                    <div className="app-balance">
                      <div className="lbl">Solde total</div>
                      <div className="val">1 250 000 F</div>
                      <svg viewBox="0 0 100 34" fill="none"><path d="M2 28 L18 22 L34 25 L50 14 L66 18 L82 8 L98 4" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" /></svg>
                    </div>
                    <div className="app-rows">
                      <div className="app-row"><span className="l"><span className="ic" style={{ background: "#17b84c" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h9l4 4v14H6z" /></svg></span> Factures</span><span className="n">24</span></div>
                      <div className="app-row"><span className="l"><span className="ic" style={{ background: "#d99a2a" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5" /></svg></span> Paiements</span><span className="n">15</span></div>
                      <div className="app-row"><span className="l"><span className="ic" style={{ background: "#6a45e6" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M2 20c0-3 3-5 7-5" /></svg></span> Clients</span><span className="n">32</span></div>
                      <div className="app-row"><span className="l"><span className="ic" style={{ background: "#2170d6" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg></span> Produits</span><span className="n">12</span></div>
                      <div className="app-row"><span className="l"><span className="ic" style={{ background: "#128a7c" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 12h8M8 12l8-6M8 12l8 6" /></svg></span> Réseau</span><span className="n">120</span></div>
                    </div>
                    <div className="app-nav">
                      <span className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>Accueil</span>
                      <span className="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg></span>
                      <span className="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" /></svg>Profil</span>
                    </div>
                  </div>
                </div>

                <div className="fcard fc-invoice f-a">
                  <div className="row"><span className="badge" style={{ background: "linear-gradient(150deg,#17b84c,#00A06C)" }}><Check /></span><div><div className="t">Facture VAF-0042</div><div className="v">125 000 F payée</div></div></div>
                </div>
                <div className="fcard fc-pay f-b">
                  <div className="row"><span className="badge" style={{ background: "linear-gradient(150deg,#ffcf6a,#cf9526)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg></span><div><div className="t">Mobile Money reçu</div><div className="v">+45 000 F</div></div></div>
                </div>
                <div className="fcard fc-stat f-c"><span className="up">+15%</span><div className="t">de bénéfice<br />ce mois</div></div>
                <div className="fcard fc-person f-a">
                  <div className="row"><img src="/landing/prisca.jpg" alt="Prisca, fondatrice" /><div className="who"><b>Prisca A.</b><span>Fondatrice VierAfrik</span></div></div>
                </div>

                <span className="chip chip-1 f-r1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></svg></span>
                <span className="chip chip-2 f-r2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg></span>
                <span className="chip chip-3 f-r2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="9" cy="8" r="3" /><path d="M2 20c0-3.4 3-5.5 7-5.5" /><path d="M17 11a3 3 0 100-5" /></svg></span>
                <span className="chip chip-4 f-r1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="18" cy="18" r="2.2" /><path d="M8 12l8-5M8 12l8 5" /></svg></span>
              </div>
            </div>
          </div>
        </section>

        <section className="section tint" style={{ padding: "52px 0" }}>
          <div className="wrap">
            <div className="stats">
              <div className="stat reveal"><div className="n">1200<span className="accent-gold">+</span></div><div className="t">Commerçants inscrits</div></div>
              <div className="stat reveal"><div className="n">10<span className="accent-gold">+</span></div><div className="t">Pays couverts</div></div>
              <div className="stat reveal"><div className="n">30 <span style={{ fontSize: "1.2rem" }}>sec</span></div><div className="t">Pour s'inscrire</div></div>
              <div className="stat reveal"><div className="n">4.8<span className="accent-gold">★</span></div><div className="t">Note utilisateurs</div></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Pour tous les métiers</span>
              <h2>Ils gèrent déjà leur business <span className="accent">avec VierAfrik</span></h2>
              <p>Boutiques, restaurants, couturières, salons et prestataires pilotent leur activité ici, dans plus de dix pays.</p>
            </div>
            <div className="logowall reveal">
              <div className="ltile lt1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l1-5h16l1 5M5 9v11h14V9M9 20v-6h6v6" /></svg>Boutique</div>
              <div className="ltile lt2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 3v8a3 3 0 006 0V3M7 3v18M17 3c-1.5 1-2 3-2 6s.5 4 2 4v8" /></svg>Restaurant</div>
              <div className="ltile lt3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="3" /><path d="M8.5 8.5L20 20M15 4l5 5M9 9l-5 5" /></svg>Couture</div>
              <div className="ltile lt4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a4 4 0 014 4c0 3-4 8-4 8s-4-5-4-8a4 4 0 014-4zM6 21h12" /></svg>Beauté</div>
              <div className="ltile lt5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 3l7 7-4 4-7-7zM10 7L3 14v7h7l7-7" /></svg>Artisanat</div>
              <div className="ltile lt6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></svg>Services</div>
            </div>
          </div>
        </section>

        <section className="section tint">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Le problème qu'on résout</span>
              <h2>Vous travaillez dur. Mais <span className="accent">vous perdez de l'argent</span> sans le savoir.</h2>
              <p>Chaque jour, des milliers de commerçants africains perdent des clients et des revenus faute d'outils adaptés à leur réalité.</p>
            </div>
            <div className="grid-2">
              <div className="card prob reveal"><div className="icon-box ib-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg></div><h3>Vous ne savez pas combien vous gagnez vraiment</h3><p>Tout est dans votre tête ou sur des cahiers. Impossible de voir clair sur votre activité.</p><div className="solve"><Check /> Vos chiffres en temps réel</div></div>
              <div className="card prob reveal"><div className="icon-box ib-violet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.6 3.1-6 7-6M16 11l5 5M21 11l-5 5" /></svg></div><h3>Vos clients partent sans laisser leurs coordonnées</h3><p>Vous perdez des prospects chaque semaine faute d'un suivi client.</p><div className="solve"><Check /> Ne perdez plus jamais un client</div></div>
              <div className="card prob reveal"><div className="icon-box ib-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg></div><h3>Pas de factures, pas de crédibilité</h3><p>Les gros clients veulent des factures pro. Sans elles, vous ratez des opportunités.</p><div className="solve"><Check /> Factures PDF pro en 10 secondes</div></div>
              <div className="card prob reveal"><div className="icon-box ib-gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg></div><h3>Encaisser est compliqué, vous perdez des ventes</h3><p>Le client veut payer, mais le processus est trop long. La vente est perdue.</p><div className="solve"><Check /> Encaissez via Mobile Money en un clic</div></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Comment ça marche</span>
              <h2>De zéro à <span className="accent">votre business organisé</span> en 4 étapes</h2>
              <p>Simple comme envoyer un message WhatsApp. Aucune compétence technique requise.</p>
            </div>
            <div className="steps">
              <div className="step reveal"><div className="num">1</div><h3>Créez votre compte</h3><p>Email, nom, mot de passe. 30 secondes, sans carte bancaire.</p></div>
              <div className="step reveal"><div className="num">2</div><h3>Publiez votre profil</h3><p>Des milliers d'entrepreneurs peuvent vous trouver sur WhatsApp.</p></div>
              <div className="step reveal"><div className="num">3</div><h3>Enregistrez vos ventes</h3><p>5 secondes par transaction. Vos bénéfices s'affichent tout seuls.</p></div>
              <div className="step reveal"><div className="num">4</div><h3>Encaissez et grandissez</h3><p>Mobile Money, factures PDF, QR codes, carte de visite.</p></div>
            </div>
            <div style={{ textAlign: "center", marginTop: 34 }} className="reveal"><a className="btn btn-primary" href="#" onClick={go(onGetStarted)}>Commencer maintenant, gratuit <Arrow /></a></div>
          </div>
        </section>

        <section className="section tint" id="fonctionnalites">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">L'application</span>
              <h2>Tout votre business. <span className="accent">Dans votre poche.</span></h2>
              <p>Des outils puissants, pensés pour les entrepreneurs africains. Chaque fonction expliquée en images.</p>
            </div>
            <div className="imgwrap two reveal">
              <div className="fl"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-clients.jpg" loading="lazy" alt="Clients, gérez et fidélisez vos clients" /></a></div>
              <div className="fl2"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-factures-qr.jpg" loading="lazy" alt="Factures QR, créez et recevez vos paiements" /></a></div>
              <div className="fl3"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-ia.jpg" loading="lazy" alt="IA Business, votre assistant intelligent" /></a></div>
              <div className="fl4"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-reseau.jpg" loading="lazy" alt="Réseau Business, connectez-vous aux entrepreneurs" /></a></div>
              <div className="fl"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-stats.jpg" loading="lazy" alt="Statistiques avancées, analysez vos performances" /></a></div>
              <div className="fl3"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-objectifs.jpg" loading="lazy" alt="Objectifs mensuels, fixez et atteignez vos buts" /></a></div>
              <div className="fl2"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-employes.jpg" loading="lazy" alt="Gestion des employés, suivez votre équipe" /></a></div>
              <div className="fl4"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-international.jpg" loading="lazy" alt="Paiement international, recevez du monde entier" /></a></div>
              <div className="fl"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-logo.jpg" loading="lazy" alt="Générateur de logo professionnel" /></a></div>
            </div>
          </div>
        </section>

        <section className="section" id="paiements">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Paiements</span>
              <h2>Tous les moyens de paiement <span className="accent">de vos clients</span></h2>
              <p>Afrique, Europe, international. Vos clients paient avec ce qu'ils ont déjà.</p>
            </div>
            <div className="pay-cat">Afrique, Mobile Money</div>
            <div className="imgwrap two reveal">
              <div className="fl"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-orange.jpg" loading="lazy" alt="Orange Money, encaissez instantanément" /></a></div>
              <div className="fl2"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-mtn.jpg" loading="lazy" alt="MTN MoMo, validez vos paiements" /></a></div>
              <div className="fl3"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-wave.jpg" loading="lazy" alt="Wave, paiements simples et rapides" /></a></div>
              <div className="fl4"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-moov.jpg" loading="lazy" alt="Moov Money, encaissez partout" /></a></div>
            </div>
            <div className="pay-cat">Europe et international</div>
            <div className="imgwrap two reveal">
              <div className="fl"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-stripe.jpg" loading="lazy" alt="Stripe, paiements par carte dans 190+ pays" /></a></div>
              <div className="fl2"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-paypal.jpg" loading="lazy" alt="PayPal, paiements internationaux" /></a></div>
              <div className="fl3"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-ideal.jpg" loading="lazy" alt="iDEAL, paiements Pays-Bas" /></a></div>
              <div className="fl4"><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/pay-paystack.jpg" loading="lazy" alt="Paystack, paiements simplifiés" /></a></div>
            </div>
          </div>
        </section>

        <section className="section tint">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Témoignages</span>
              <h2>Des entrepreneurs comme vous. <span className="accent">Des résultats réels.</span></h2>
              <p>Ils ont testé VierAfrik. Voici ce qu'ils en disent.</p>
            </div>
            <div className="tgrid">
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Avant je savais jamais si je gagnais ou perdais. Maintenant je vois tout en direct. <b>J'ai arrêté 3 dépenses inutiles et gagné 15% de plus ce mois.</b></q><div className="tperson"><div className="avatar">K</div><div className="who"><b>Koffi A.</b><span>Commerce alimentaire · Abidjan</span></div></div></div>
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Le réseau m'a apporté 3 nouveaux clients en une semaine. <b>Je reçois des messages directement sur WhatsApp.</b></q><div className="tperson"><div className="avatar">A</div><div className="who"><b>Awa D.</b><span>Couture et création · Dakar</span></div></div></div>
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Mes clients voulaient des factures, j'avais honte. Maintenant <b>j'envoie une facture pro avec QR paiement en 10 secondes.</b></q><div className="tperson"><div className="avatar">M</div><div className="who"><b>Moussa K.</b><span>Restauration · Cotonou</span></div></div></div>
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Je gère mes clients en Côte d'Ivoire depuis les Pays-Bas. <b>Le QR code a tout changé, ils paient sans me déranger.</b></q><div className="tperson"><div className="avatar">P</div><div className="who"><b>Patricia D.</b><span>Services · Rotterdam vers Abidjan</span></div></div></div>
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Ma carte de visite est partagée par mes clients. <b>En 1 mois, 12 nouveaux contacts sans dépenser un franc.</b></q><div className="tperson"><div className="avatar">F</div><div className="who"><b>Fatou B.</b><span>Services beauté · Douala</span></div></div></div>
              <div className="tcard reveal"><div className="stars">★★★★★</div><q>Le Coach IA m'a montré que mes dépenses marketing dépassaient 25% du CA. <b>J'ai économisé 300 000 FCFA le mois suivant.</b></q><div className="tperson"><div className="avatar">M</div><div className="who"><b>Mamadou K.</b><span>Services · Plateau Abidjan</span></div></div></div>
            </div>
          </div>
        </section>

        <section className="section" id="plans">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow">Tarifs</span>
              <h2>Commencez gratuitement. <span className="accent">Grandissez quand vous êtes prêt.</span></h2>
              <p>Pas d'engagement. Pas de surprise. Changez de plan à tout moment.</p>
            </div>
            <div className="price-grid">
              <div className="plan reveal"><h3>{PLANS.free.label}</h3><div className="sub">Pour démarrer sans risque</div><div className="amt">{PLANS.free.price} F <small>/ mois</small></div>
                <ul>
                  <li><Check />10 transactions par mois</li>
                  <li><Check />3 clients, 2 factures par mois</li>
                  <li><Check />Profil réseau commerçants</li>
                  <li><Check />QR Code et générateur de logo</li>
                  <li><Check />Carte de visite, 1 style</li>
                </ul>
                <a className="btn btn-ghost" href="#" onClick={go(onGetStarted)}>Commencer gratuitement</a>
              </div>
              <div className="plan pop reveal"><div className="ribbon">Le plus populaire</div><h3>{PLANS.pro.label}</h3><div className="sub">Pour les entrepreneurs actifs</div><div className="amt">{PLANS.pro.price.toLocaleString("fr-FR")} F <small>/ mois</small></div>
                <ul>
                  <li><Check />Transactions, clients et factures illimités</li>
                  <li><Check />Factures PDF professionnelles</li>
                  <li><Check />Paiement Mobile Money</li>
                  <li><Check />Coach IA et statistiques avancées</li>
                  <li><Check />Carte de visite 4 styles, badge Pro</li>
                </ul>
                <a className="btn btn-primary" href="#" onClick={go(onGetStarted)}>Passer au Pro</a>
              </div>
              <div className="plan reveal"><h3>{PLANS.business.label}</h3><div className="sub">Pour les ambitieux</div><div className="amt">{PLANS.business.price.toLocaleString("fr-FR")} F <small>/ mois</small></div>
                <ul>
                  <li><Check />Tout du plan Pro inclus</li>
                  <li><Check />Badge Business et position top réseau</li>
                  <li><Check />Dashboard analytique avancé</li>
                  <li><Check />Équipe illimitée, support prioritaire</li>
                </ul>
                <a className="btn btn-ghost" href="#" onClick={go(onGetStarted)}>Choisir Business</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section tint" id="ambassadeur">
          <div className="wrap">
            <div className="band reveal" style={{ textAlign: "center" }}>
              <span className="eyebrow">Gagnez de l'argent</span>
              <h2 style={{ fontSize: "clamp(1.7rem,3.6vw,2.4rem)", margin: "14px 0 12px" }}>Parlez de VierAfrik. <span className="accent-gold">Soyez rémunéré.</span></h2>
              <p style={{ color: "var(--muted)", maxWidth: 620, margin: "0 auto" }}>Le programme Ambassadeur vous paie pour chaque commerçant que vous invitez. Lien unique, suivi en temps réel, paiement Mobile Money.</p>
              <div className="fl" style={{ maxWidth: 840, margin: "26px auto 0", position: "relative" }}><a className="imgcard" href="#" onClick={go(onGetStarted)}><img src="/landing/feat-ambassadeur.jpg" loading="lazy" alt="Programme Ambassadeur, gagnez 20% de commission" /></a></div>
              <div className="amb-nums">
                <div className="amb-num"><div className="n">980 F</div><div className="t">par inscription Pro</div></div>
                <div className="amb-num"><div className="n">1 980 F</div><div className="t">par inscription Business</div></div>
                <div className="amb-num"><div className="n">∞</div><div className="t">Pas de limite de parrainages</div></div>
              </div>
              <a className="btn btn-primary" href="#" onClick={go(onGetStarted)}>Devenir Ambassadeur <Arrow /></a>
            </div>
          </div>
        </section>

        <section className="section" id="ebook">
          <div className="wrap">
            <div className="band reveal">
              <div className="ebook-grid">
                <div>
                  <span className="ebook-seal">eBook, 100% gratuit</span>
                  <h2>L'Afrique a besoin de <span className="accent">bâtisseurs.</span></h2>
                  <p className="ebook-quote">"L'Afrique n'a pas besoin de plus de spectateurs. Elle a besoin de bâtisseurs."</p>
                  <p style={{ color: "var(--muted)" }}>L'histoire vraie derrière VierAfrik, et pourquoi Prisca Akoua s'est battue pour créer des outils pour les entrepreneurs africains.</p>
                  <ul className="ebook-list">
                    <li><Check />L'histoire vraie derrière la création de VierAfrik</li>
                    <li><Check />La vision d'une Afrique d'entrepreneurs libres</li>
                    <li><Check />Des conseils concrets pour débuter son business</li>
                  </ul>
                  <a className="btn btn-primary" href="https://payhip.com/b/8tdPF" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg> Télécharger gratuitement</a>
                </div>
                <div className="qr-card">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://payhip.com/b/8tdPF&bgcolor=0F1B24&color=00D478&qzone=2" width="150" height="150" alt="QR code eBook VierAfrik" loading="lazy" />
                  <span>Scanner pour télécharger</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section tint" id="fondatrice">
          <div className="wrap">
            <div className="founder-grid">
              <div className="reveal">
                <span className="eyebrow">À propos</span>
                <h2>Créée par une <span className="accent">entrepreneure africaine</span> pour les siens.</h2>
                <p>VierAfrik est née d'une frustration simple. Les outils business existants ne sont pas faits pour la réalité africaine. Pas de Mobile Money, pas de FCFA, des interfaces incompréhensibles.</p>
                <p>Prisca Akoua, fondatrice et développeuse, a tout construit seule depuis les Pays-Bas, avec 14 ans d'expérience en entrepreneuriat et une conviction, <strong style={{ color: "var(--text)" }}>les entrepreneurs africains méritent des outils professionnels.</strong></p>
                <div className="founder-chips">
                  <span className="chip-t">React et Supabase</span>
                  <span className="chip-t">14 ans entrepreneuriat</span>
                  <span className="chip-t">FR · EN · NL</span>
                  <span className="chip-t">Fondatrice solo</span>
                </div>
                <div className="btns">
                  <a className="btn btn-primary" href="#" onClick={go(onGetStarted)}>Essayer l'application <Arrow /></a>
                  <a className="btn btn-ghost" href="https://wa.me/31627374813?text=Bonjour%2C%20je%20veux%20en%20savoir%20plus%20sur%20VierAfrik" target="_blank" rel="noopener noreferrer">Contacter Prisca</a>
                </div>
              </div>
              <div className="founder-card reveal">
                <span className="founder-badge">Fondatrice</span>
                <img src="/landing/prisca-hero.jpg" alt="Prisca Akoua, fondatrice de VierAfrik" />
                <div className="cap"><b>Prisca Akoua</b><span>Fondatrice et développeuse de VierAfrik</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head reveal"><span className="eyebrow">Questions fréquentes</span><h2>Tout ce que vous <span className="accent">voulez savoir.</span></h2></div>
            <div className="faq reveal">
              <details><summary>Est-ce vraiment gratuit pour commencer ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">Oui, complètement. Le plan Free ne demande aucune carte bancaire. Vous l'utilisez gratuitement aussi longtemps que vous voulez, et passez au Pro seulement quand vous en avez besoin.</div></details>
              <details><summary>Comment fonctionne le paiement Mobile Money ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">VierAfrik utilise FedaPay. Vous créez une facture, envoyez le lien ou le QR au client, il paie via MTN, Orange Money, Wave ou Moov, et la facture se met à jour automatiquement.</div></details>
              <details><summary>Est-ce que ça marche sur les anciens téléphones ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">Oui. VierAfrik est optimisé pour tout smartphone Android, même les modèles d'entrée de gamme avec une connexion 3G. L'application est légère et rapide.</div></details>
              <details><summary>Comment fonctionne le programme Ambassadeur ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">Vous recevez un lien unique. Chaque commerçant qui s'inscrit via ce lien et prend un plan payant vous rapporte une commission, payée par Mobile Money, sans limite.</div></details>
              <details><summary>Est-ce que mes données sont sécurisées ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">Vos données sont stockées de manière sécurisée avec chiffrement SSL. Chaque utilisateur n'accède qu'à ses propres données, et nous ne les partageons jamais avec des tiers.</div></details>
              <details><summary>Puis-je annuler mon abonnement à tout moment ?<svg className="plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></summary><div className="answer">Oui, sans condition ni frais. Vous repassez au plan Free quand vous voulez, et toutes vos données restent accessibles.</div></details>
            </div>
          </div>
        </section>

        <section className="final">
          <div className="wrap reveal">
            <h2>Prêt à voir vos <span className="accent">vrais chiffres</span> ?</h2>
            <p>Rejoignez les entrepreneurs africains qui prennent le contrôle de leur business. Gratuit pour commencer.</p>
            <a className="btn btn-primary" href="#" onClick={go(onGetStarted)} style={{ fontSize: "1.05rem", padding: "16px 32px" }}>Commencer maintenant <Arrow /></a>
            <div className="cta-line">Gratuit pour commencer · Aucune carte requise · En 30 secondes</div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="#top">Vier<b>Afrik</b></a>
              <p>La plateforme de gestion business pour les entrepreneurs africains. Simple, rapide, professionnel. 100% en français.</p>
              <div className="foot-social">
                <a href="https://wa.me/31627374813" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.4-5.1-4.6-.2-.2-1.3-1.7-1.3-3.2s.8-2.3 1.1-2.6c.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.3.3c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .2 0 .8-.2 1.4z" /></svg></a>
                <a href="https://www.facebook.com/share/167MyhFG2iF/" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" /></svg></a>
                <a href="https://www.tiktok.com/@vierafrik" aria-label="TikTok" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.3 2 1.6 3.6 3.5 3.9v2.6c-1.3.1-2.5-.3-3.6-1v6.8a5.7 5.7 0 11-5.7-5.7c.3 0 .6 0 .9.1v2.7a3 3 0 103.1 3V3z" /></svg></a>
                <a href="mailto:contactvierafrik@gmail.com" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></svg></a>
                <a href="https://payhip.com/b/8tdPF" aria-label="eBook" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 19a2 2 0 012-2h13" /></svg></a>
              </div>
            </div>
            <div className="foot-col"><h4>Application</h4><a href="#fonctionnalites">Fonctionnalités</a><a href="#paiements">Paiements</a><a href="#plans">Tarifs</a><a href="#" onClick={go(onLogin)}>Ouvrir l'app</a></div>
            <div className="foot-col"><h4>Ressources</h4><a href="#ebook">eBook gratuit</a><a href="#fondatrice">À propos</a></div>
            <div className="foot-col"><h4>Contact</h4><a href="https://wa.me/31627374813?text=Bonjour%2C%20je%20veux%20en%20savoir%20plus%20sur%20VierAfrik" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="mailto:contactvierafrik@gmail.com">Email</a><a href="https://www.tiktok.com/@vierafrik" target="_blank" rel="noopener noreferrer">TikTok</a></div>
          </div>
          <div className="foot-bottom">
            <div className="copy">© {new Date().getFullYear()} VierAfrik · vierafrik.com · Prisca Akoua</div>
            <div className="trust"><span>SSL sécurisé</span><span>10+ pays</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
