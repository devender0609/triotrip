"use client";

export default function HotelCard({ item, index, currency }: { item: any; index: number; currency: string; }) {
  const price = item.total_converted ?? item.total_usd ?? item.price_usd ?? 0;
  const curr = currency || item.currency || "USD";
  const name = item.name || "Hotel";

  const qCity = encodeURIComponent(item.city || item.location || "");
  const qIn = encodeURIComponent(item.checkin || "");
  const qOut = encodeURIComponent(item.checkout || "");

  const booking = `https://www.booking.com/searchresults.html?ss=${qCity}&checkin=${qIn}&checkout=${qOut}`;
  const hotels = `https://www.hotels.com/Hotel-Search?destination=${qCity}&startDate=${qIn}&endDate=${qOut}`;

  return (
    <article className="hcard" aria-label={`Hotel option ${index + 1}`}>
      <div className="himg-wrap"><img src={item.imageUrl || `https://source.unsplash.com/featured/480x300/?${encodeURIComponent(item.city || "travel city")}` } alt={name} className="himg" /></div>
      <header className="h">
        <div className="rank">#{index + 1}</div>
        <div className="name">{name}</div>
        <div className="stars">{item.stars ? "★".repeat(item.stars) : ""}</div>
        <div className="price">{curr} {Intl.NumberFormat().format(Math.round(price))}</div>
      </header>
      <footer className="cta">
        <a className="btn" href={booking} target="_blank">Booking.com</a>
        <a className="btn" href={hotels} target="_blank">Hotels.com</a>
      </footer>

      <style jsx>{`
        .hcard { background: linear-gradient(180deg,#ffffff,#f0f7ff); border:1px solid #dbeafe; border-radius:12px; overflow:hidden; }
        .h { display:grid; grid-template-columns:auto 1fr auto auto; gap:10px; align-items:center; padding:10px 12px; border-bottom:1px solid #e5e7eb; }
        .rank { font-weight:900; }
        .name { font-weight:800; }
        .stars { color:#f59e0b; font-weight:900; }
        .price { font-weight:900; text-align:right; }
        .cta { display:flex; gap:8px; padding:10px 12px; justify-content:flex-end; }
        .btn { height:32px; padding:0 10px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; font-weight:800; }
        .himg-wrap{width:100%; height:180px; overflow:hidden; background:#f1f5f9}
        .himg{width:100%; height:100%; object-fit:cover; display:block}
      `}</style>
    </article>
  );
}
