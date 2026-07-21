// Skeleton de chargement, même silhouette qu'une FeedCard pour éviter
// tout saut de mise en page quand les vraies données arrivent.
export default function SkeletonCard({ Tc }) {
  const shimmer = { background:`linear-gradient(90deg,${Tc.c2} 25%,${Tc.c3} 50%,${Tc.c2} 75%)`, backgroundSize:"200% 100%", animation:"skeletonShimmer 1.4s ease infinite" };
  return (
    <div style={{ background:Tc.c1, border:`1px solid ${Tc.border}`, borderRadius:18, overflow:"hidden" }}>
      <div style={{ aspectRatio:"16/11", ...shimmer }}/>
      <div style={{ padding:"13px 15px" }}>
        <div style={{ height:12, width:"40%", borderRadius:6, marginBottom:12, ...shimmer }}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
          {[0,1,2,3].map(k=><div key={k} style={{ height:44, borderRadius:10, ...shimmer }}/>)}
        </div>
      </div>
    </div>
  );
}
