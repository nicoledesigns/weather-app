import { useState, useCallback, useEffect } from "react";
import DynamicWeatherBackground from './DynamicWeatherBackground';


const API_BASE = "http://localhost:5050/api/weather";


const WMO_CODES = {
  0:  { label: "Clear Sky", icon: "☀️" },
  1:  { label: "Mainly Clear", icon: "🌤️" },
  2:  { label: "Partly Cloudy", icon: "⛅" },
  3:  { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Icy Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy Drizzle", icon: "🌧️" },
  61: { label: "Light Rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy Rain", icon: "🌧️" },
  71: { label: "Light Snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy Snow", icon: "❄️" },
  77: { label: "Snow Grains", icon: "🌨️" },
  80: { label: "Light Showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Heavy Showers", icon: "🌧️" },
  85: { label: "Snow Showers", icon: "🌨️" },
  86: { label: "Heavy Snow Showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm + Hail", icon: "⛈️" },
  99: { label: "Thunderstorm + Hail", icon: "⛈️" },
};

const getWMO = (code) =>
  WMO_CODES[code] ?? { label: "Unknown", icon: "🌡️" };

const formatDay = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

function WindArrow({ deg }) {
  return (
    <span
      title={`Wind direction: ${deg}°`}
      style={{
        display: "inline-block",
        transform: `rotate(${deg}deg)`,
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      ↑
    </span>
  );
}

async function fetchWeatherFromBackend(location, startDate, endDate) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, startDate, endDate }), 
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Weather fetch failed.");
  return data;
}

async function fetchHistory() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Could not load search history.");
  return res.json();
}

async function deleteRecord(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed.");
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1&language=en&format=json`
  );
  if (!res.ok) return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  const data = await res.json();
  return data.results?.[0]?.name ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

export default function WeatherApp() {
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("C");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weatherEffect, setWeatherEffect] = useState('clear');
  const cur = weather?.current;
  const daily = weather?.daily;
  const wmo = cur ? getWMO(cur.weathercode) : null;

useEffect(() => {
  if (cur?.weathercode) {
    const code = cur.weathercode;
    if ([61,63,65,51,53,55,80,81,82].includes(code)) setWeatherEffect('rain');
    else if ([71,73,75,77,85,86].includes(code)) setWeatherEffect('snow');
    else if ([45,48].includes(code)) setWeatherEffect('fog');
    else if ([95,96,99].includes(code)) setWeatherEffect('storm');
    else setWeatherEffect('clear');
  }
}, [cur]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch {}
    finally {
      setHistoryLoading(false);
    }
  }

  const search = useCallback(async (locationStr) => {
    if (!locationStr.trim()) {
      setError("Please enter a city, postal code, landmark, or coordinates.");
      return;
    }

    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const data = await fetchWeatherFromBackend(locationStr.trim(), startDate, endDate);  
      setWeather(data);
      loadHistory();
    } catch (e) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  },[startDate, endDate]);

  const handleSearch = () => search(query);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        setGeoLoading(false);
        const cityName = await reverseGeocode(lat, lon);
        setQuery(cityName);
        search(cityName);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1)
          setError("Location access denied.");
        else if (err.code === 2)
          setError("Location unavailable.");
        else
          setError("Geolocation timed out.");
      },
      { timeout: 10000 }
    );
  };

  const handleDelete = async (id) => {
    try {
      await deleteRecord(id);
      setHistory((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setError("Could not delete that record.");
    }
  };

  const handleHistoryClick = (record) => {
    setQuery(record.location);
    search(record.location);
  };

  const convertTemp = (c) =>
    unit === "F" ? Math.round((c * 9) / 5 + 32) : Math.round(c);

  const deg = unit === "C" ? "°C" : "°F";



  return (
    <>
      <style>{`
    
        :root {
          --accent: #646cff;
          --accent-bg: rgba(100, 108, 255, 0.08);
          --accent-border: rgba(100, 108, 255, 0.4);
          --border: rgba(0, 0, 0, 0.12);
          --shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
          --text-h: #213547;
          --social-bg: #f6f6f7;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .counter {
          font-size: 16px;
          padding: 6px 12px;
          border-radius: 8px;
          color: #ffffff;
          background: rgba(100, 108, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.4);
          font-weight: 600;
          backdrop-filter: blur(6px);
        }
        .counter:hover { border-color: var(--accent-border); }
        .counter:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .counter.inactive {
          color: #1f2937; /* strong dark gray */
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(6px);
        }
        .counter.inactive:hover { border-color: var(--accent-border); }

        #center {
          display: flex;
          flex-direction: column;
          gap: 25px;
          place-content: center;
          place-items: center;
          flex-grow: 1;
        }
        @media (max-width: 1024px) { #center { padding: 32px 20px 24px; gap: 18px; } }

        .ticks {
          position: relative;
          width: 100%;
          border-top: 1px solid var(--border);
        }
        .ticks::before, .ticks::after {
          content: '';
          position: absolute;
          top: -4.5px;
          border: 5px solid transparent;
        }
        .ticks::before { left: 0;  border-left-color: var(--border); }
        .ticks::after  { right: 0; border-right-color: var(--border); }

        #spacer {
          height: 88px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        @media (max-width: 1024px) { #spacer { height: 48px; } }

        .weather-input:focus { outline: 2px solid var(--accent); outline-offset: 0; border-color: transparent; }

        .btn-primary {
          padding: 10px 18px; font-size: 14px; font-weight: 500;
          border: none; border-radius: 8px; cursor: pointer;
          background: var(--accent); color: #fff; white-space: nowrap;
          transition: opacity 0.2s;
        }
        .btn-primary:hover    { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          padding: 10px 18px; font-size: 14px; font-weight: 500;
          border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
          background: var(--social-bg); color: var(--text-h); white-space: nowrap;
          transition: box-shadow 0.3s;
        }
        .btn-secondary:hover    { box-shadow: var(--shadow); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .fc-card { background: var(--social-bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px 12px; text-align: center; }
        .fc-card.today { background: var(--accent-bg); border: 1.5px solid var(--accent-border); }
        .fc-day-label { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
        .fc-day-label.today { color: var(--accent); }
        .fc-day-label.other { color: #555; }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--social-bg);
          cursor: pointer;
          transition: box-shadow 0.2s;
          gap: 8px;
        }
        .history-item:hover { box-shadow: var(--shadow); }
        .history-delete {
          background: none;
          border: none;
          cursor: pointer;
          color: #aaa;
          font-size: 14px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .history-delete:hover { color: #991b1b; background: #fef2f2; }
      `}</style>

{weather && cur && (
    <div className="weather-bg">
  <DynamicWeatherBackground
    effect={
      [61,63,65,51,53,55,80,81,82].includes(cur.weathercode)
        ? "rain"
        : [71,73,75,77,85,86].includes(cur.weathercode)
        ? "snow"
        : [45,48].includes(cur.weathercode)
        ? "fog"
        : [95,96,99].includes(cur.weathercode)
        ? "storm"
        : "clear"
    }
    windSpeed={cur?.wind_speed_10m || 10}
  />

  </div>
  
)}

<div style={{
  position: "relative",
  zIndex: 1,
  fontFamily: "system-ui, sans-serif",
  maxWidth: 760,
  margin: "0 auto",
  padding: "24px 16px",
  color: "var(--text-h, #213547)"
}}>
        {/* Header */}
        <div style={{marginBottom: 20}}>
  <h1 style={{fontSize: 26}}>Weather App - Nicole Antoun</h1>
  <p style={{fontSize: 14, color: "#666"}}>
    Built for <a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank">
    Product Manager Accelerator
    </a> - Technical Assessment
  </p>
</div>
        

        <div className="ticks" style={{ marginBottom: 20 }} />

        {/* Search row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            className="weather-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='Enter city, postal code, or coordinates'
            style={{
              flex: "1 1 200px", padding: "10px 14px", fontSize: 15,
              border: "1px solid var(--border)", borderRadius: 8,
              background: "#fff", color: "var(--text-h)",
            }}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            Search
          </button>
          <button className="btn-secondary" onClick={handleGeolocate} disabled={geoLoading || loading}>
            {geoLoading ? "Locating…" : "📍 My Location"}
          </button>
</div>
<div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16}}>

<input 
    type="date" 
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    style={{padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8}}
  />
  <input 
    type="date" 
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    style={{padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8}}
  />
  </div> 
  

        {/* Unit toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["C", "F"].map((u) => (
            <button key={u} className={`counter${unit === u ? "" : " inactive"}`} onClick={() => setUnit(u)}>
              °{u}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" style={{
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8,
            padding: "12px 16px", color: "#991b1b", fontSize: 14, marginBottom: 16,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div><strong>Error: </strong>{error}</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#666", fontSize: 14, padding: "32px 0", justifyContent: "center" }}>
            <div style={{
              display: "inline-block", width: 18, height: 18,
              border: "2px solid #e2e8f0", borderTop: "2px solid var(--accent)",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            Fetching weather…
          </div>
        )}

        {/* Weather results */}
        {weather && !loading && cur && (
          <>
            {/* Hero card */}
            <div style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
              borderRadius: 16, padding: "28px 28px 24px",
              color: "#fff", marginBottom: 16, position: "relative", overflow: "hidden",
            }}>
              <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>
                {weather.location?.name}
              </p>
              <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 16px" }}>
                {weather.location?.country}
              </p>
              <div style={{ fontSize: 56, position: "absolute", top: 24, right: 28 }}>{wmo.icon}</div>
              <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, margin: "0 0 4px" }}>
                {convertTemp(cur.temperature_2m)}{deg}
              </div>
              <p style={{ fontSize: 18, opacity: 0.9, margin: "0 0 20px" }}>{wmo.label}</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, opacity: 0.85 }}>
                {[
                  ["Feels like", `${convertTemp(cur.apparent_temperature)}${deg}`],
                  ["Humidity",   `${cur.relative_humidity_2m}%`],
                  ["Pressure",   `${Math.round(cur.surface_pressure)} hPa`],
                  cur.visibility != null && ["Visibility", `${(cur.visibility / 1000).toFixed(1)} km`],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wind</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    <WindArrow deg={cur.wind_direction_10m} /> {Math.round(cur.wind_speed_10m)} km/h
                  </span>
                </div>
              </div>
            </div>

            <div className="ticks" style={{ marginBottom: 16 }} />

            {/* 5-day forecast */}
            {daily && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
                {daily.time.map((dateStr, i) => {
                  const fc = getWMO(daily.weathercode[i]);
                  const isToday = i === 0;
                  return (
                    <div key={dateStr} className={`fc-card${isToday ? " today" : ""}`}>
                      <div className={`fc-day-label ${isToday ? "today" : "other"}`}>
                        {isToday ? "Today" : formatDay(dateStr)}
                      </div>
                      <span style={{ fontSize: 28, display: "block", margin: "0 auto 8px" }}>{fc.icon}</span>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{fc.label}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{convertTemp(daily.temperature_2m_max[i])}{deg}</span>
                        <span style={{ color: "#888" }}>{convertTemp(daily.temperature_2m_min[i])}{deg}</span>
                      </div>
                      {daily.precipitation_probability_max[i] != null && (
                        <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
                          💧 {daily.precipitation_probability_max[i]}%
                        </div>
                      )}
                      {daily.uv_index_max[i] != null && (
                        <div style={{ fontSize: 11, color: "#d97706", marginTop: 4 }}>
                          UV {daily.uv_index_max[i]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div id="spacer">
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                Data from Open-Meteo · Updated {new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </>
        )}

        {/* Search History (from DB via GET /api/weather) */}
        {(history.length > 0 || historyLoading) && (
          <>
            <div className="ticks" style={{ margin: "24px 0 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Recent searches</h2>
              <button
  className="btn-secondary"
  onClick={() => {
    window.open("http://localhost:5050/api/weather/export");
  }}
>
  ⬇️ Export CSV
</button>
<button
      className="btn-primary"
      onClick={() => window.open("http://localhost:5050/api/weather/export?format=pdf")}
      title="PDF Export"
    >
      📄 PDF
    </button>
              {historyLoading && (
                <div style={{
                  width: 14, height: 14,
                  border: "2px solid #e2e8f0", borderTop: "2px solid var(--accent)",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {history.map((record) => (
                <div key={record._id} className="history-item" onClick={() => handleHistoryClick(record)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{record.location}</span>
                    {record.startDate && (
                  <span style={{ fontSize: 11, color: "#888" }}>
                  📅 {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                  </span>
                   )}
                    {record.date && (
                      <span style={{ fontSize: 11, color: "#888" }}>
                        {new Date(record.date).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <button
                    className="history-delete"
                    title="Delete this record"
                    onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}


