import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };

export default function MapView({ home, radiusKm, points }) {
  const ref = useRef(null);
  useEffect(() => {
    let map; let dead = false;
    (async () => {
      const L = (await import('leaflet')).default;
      window.L = L;
      try { await import('leaflet.markercluster'); } catch { /* plain markers */ }
      if (dead || !ref.current) return;
      map = L.map(ref.current).setView(home ? [home.lat, home.lon] : [20, 0], home ? 8 : 2);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);
      const group = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
      points.forEach((p) => {
        const m = L.circleMarker([p.pt.lat, p.pt.lon], { radius: 8, color: '#e3a857', fillOpacity: 0.8 });
        const box = el('div');
        box.append(el('b', p.title), el('div', p.company));
        if (p.salary) box.append(el('div', `Salary as posted: ${p.salary}`));
        if (p.url.startsWith('https:')) { const a = el('a', 'Open posting'); a.href = p.url; a.target = '_blank'; box.append(a); }
        m.bindPopup(box);
        group.addLayer(m);
      });
      group.addTo(map);
      if (home) {
        L.circle([home.lat, home.lon], { radius: radiusKm * 1000, color: '#8fb7e8', fillOpacity: 0.05 }).addTo(map);
        L.circleMarker([home.lat, home.lon], { radius: 5, color: '#8fb7e8' }).addTo(map);
      }
    })();
    return () => { dead = true; if (map) map.remove(); };
  }, [home?.lat, home?.lon, radiusKm, points.length]);
  return <div className="map" ref={ref} />;
}
