import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════ HELPERS ═══════════════════════ */
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const uid = () => Math.random().toString(36).slice(2, 9);
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const store = {
  load(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } },
  save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} },
};

/* ═══════════════════════ EARTHY THEME ═══════════════════════ */
const c = {
  bg: "#09090b", surface: "#111114", surfaceAlt: "#0c0c0e", border: "#1c1c22", borderLight: "#26262e",
  brown: "#a0846b", brownSoft: "#a0846b14", brownMed: "#a0846b2a", brownLight: "#c4a882",
  blue: "#7cb5c9", blueSoft: "#7cb5c912", blueMed: "#7cb5c928",
  white: "#f2ede8", whiteSoft: "#f2ede815",
  green: "#7cb57c", greenSoft: "#7cb57c18",
  text: "#f2ede8", sub: "#9c958a", dim: "#5e584f", input: "#0d0d10",
};

/* Board card colors — earthy, no yellows/reds/purples */
const BOARD_COLORS = [
  { bg: "#2d4a3e", border: "#3d6354", label: "Forest" },
  { bg: "#1e3a4f", border: "#2d5270", label: "Deep Sea" },
  { bg: "#3b4a3a", border: "#516b4f", label: "Olive" },
  { bg: "#2a3f4f", border: "#3a5a6f", label: "Steel Blue" },
  { bg: "#3d3830", border: "#584f42", label: "Walnut" },
  { bg: "#2f4040", border: "#426060", label: "Teal" },
  { bg: "#3a3530", border: "#554d44", label: "Espresso" },
  { bg: "#2a3d3d", border: "#3d5858", label: "Slate Teal" },
  { bg: "#354535", border: "#4a634a", label: "Sage" },
  { bg: "#2d3545", border: "#3f4d65", label: "Navy" },
];

/* ═══════════════════════ STYLES ═══════════════════════ */
const GlobalCSS = () => (
  <style>{`
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%}
    html{-webkit-font-smoothing:antialiased}
    body{background:${c.bg};color:${c.text};font-family:'Times New Roman',Times,Georgia,serif;font-size:14px;line-height:1.5}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${c.border};border-radius:10px}
    input,textarea,button{font-family:inherit}
    ::selection{background:${c.brownMed}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
    @keyframes blink{0%,100%{opacity:.4}50%{opacity:1}}
  `}</style>
);

const Svg = ({ d, size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const I = {
  cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  cloud: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  x: "M18 6L6 18M6 6l12 12",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  bot: "M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1H3v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3 18h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  note: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
};

const Btn = ({ variant = "primary", children, style, ...props }) => {
  const base = { border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "inherit" };
  const v = {
    primary: { ...base, background: c.brown, color: "#fff", padding: "7px 14px", ...style },
    ghost: { ...base, background: "transparent", color: c.sub, border: `1px solid ${c.border}`, padding: "5px 10px", fontSize: 11, ...style },
    icon: { ...base, background: "transparent", color: c.dim, padding: 5, borderRadius: 6, ...style },
  };
  return <button style={v[variant]} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1} {...props}>{children}</button>;
};

/* ═══════════════════════ GOOGLE CALENDAR HOOK ═══════════════════════ */
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function useGoogleCalendar() {
  const [token, setToken] = useState(() => localStorage.getItem("gcal_token") || null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem("gcal_client_id") || "");
  const clientRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    if (document.getElementById("gsi-script")) { setGsiReady(true); return; }
    const s = document.createElement("script");
    s.id = "gsi-script"; s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => setGsiReady(true);
    document.body.appendChild(s);
  }, [clientId]);

  useEffect(() => {
    if (!gsiReady || !clientId || !window.google) return;
    clientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPES,
      callback: (r) => { if (r.access_token) { setToken(r.access_token); localStorage.setItem("gcal_token", r.access_token); } },
    });
  }, [gsiReady, clientId]);

  const signIn = useCallback(() => { if (clientRef.current) clientRef.current.requestAccessToken(); }, []);
  const signOut = useCallback(() => { setToken(null); setEvents([]); localStorage.removeItem("gcal_token"); if (window.google && token) window.google.accounts.oauth2.revoke(token); }, [token]);
  const saveClientId = useCallback((id) => { setClientId(id); localStorage.setItem("gcal_client_id", id); }, []);

  const fetchEvents = useCallback(async (start, end) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { signOut(); return; }
      const data = await res.json();
      setEvents((data.items || []).map(ev => ({
        id: ev.id, title: ev.summary || "(No title)",
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        allDay: !ev.start?.dateTime, source: "google",
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, signOut]);

  return { token, events, loading, signIn, signOut, fetchEvents, clientId, saveClientId };
}

/* ═══════════════════════ HEADER BAR ═══════════════════════ */
function HeaderBar({ gcal, weekOffset, setWeekOffset, weekLabel }) {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const [w, setW] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupId, setSetupId] = useState(gcal.clientId);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=42.57&longitude=-71.10&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&timezone=America/New_York&daily=temperature_2m_max,temperature_2m_min&forecast_days=1");
        const data = await res.json();
        setW({ ...data.current, high: data.daily?.temperature_2m_max?.[0], low: data.daily?.temperature_2m_min?.[0] });
      } catch {}
    })();
  }, []);

  const desc = (code) => {
    if (code <= 3) return { e: "☀️", l: "Clear" }; if (code <= 48) return { e: "☁️", l: "Cloudy" };
    if (code <= 67) return { e: "🌧️", l: "Rain" }; if (code <= 77) return { e: "❄️", l: "Snow" };
    if (code <= 82) return { e: "🌦️", l: "Showers" }; return { e: "⛈️", l: "Storms" };
  };

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
        animation: "fadeUp 0.4s ease", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.01em", color: c.white }}>{greeting}</h1>
          <span style={{ fontSize: 13, color: c.sub }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {gcal.token ? (
            <Btn variant="ghost" onClick={gcal.signOut} style={{ color: c.green, borderColor: `${c.green}30` }}><Svg d={I.link} size={11} color={c.green} /> Google</Btn>
          ) : (
            <Btn variant="ghost" onClick={() => gcal.clientId ? gcal.signIn() : setShowSetup(true)}><Svg d={I.link} size={11} /> Connect</Btn>
          )}
          <div style={{ width: 1, height: 16, background: c.border, margin: "0 4px" }} />
          <Btn variant="ghost" onClick={() => setWeekOffset(w => w-1)}><Svg d={I.chevL} size={12} /></Btn>
          <span style={{ fontSize: 13, color: c.brownLight, minWidth: 170, textAlign: "center", fontWeight: 500 }}>{weekLabel}</span>
          <Btn variant="ghost" onClick={() => setWeekOffset(w => w+1)}><Svg d={I.chevR} size={12} /></Btn>
          {weekOffset !== 0 && <Btn variant="ghost" onClick={() => setWeekOffset(0)} style={{ fontSize: 10 }}>Today</Btn>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {w && (
            <>
              <span style={{ fontSize: 20 }}>{desc(w.weather_code).e}</span>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: c.white }}>{Math.round(w.temperature_2m)}°F</span>
                  <span style={{ fontSize: 11, color: c.sub }}>{desc(w.weather_code).l}</span>
                </div>
                <div style={{ fontSize: 10, color: c.dim }}>H:{Math.round(w.high || 0)}° L:{Math.round(w.low || 0)}° · {Math.round(w.wind_speed_10m)} mph · North Reading</div>
              </div>
            </>
          )}
        </div>
      </div>

      {showSetup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.15s ease" }} onClick={() => setShowSetup(false)}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw", animation: "slideDown 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Connect Google Calendar</h3>
              <Btn variant="icon" onClick={() => setShowSetup(false)}><Svg d={I.x} size={16} /></Btn>
            </div>
            <div style={{ fontSize: 13, color: c.sub, lineHeight: 1.7, marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}>You need a <strong style={{ color: c.white }}>Google Cloud Client ID</strong>:</p>
              <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: c.blue, textDecoration: "none" }}>console.cloud.google.com</a></li>
                <li>Create a project & enable <strong style={{ color: c.white }}>Google Calendar API</strong></li>
                <li><strong style={{ color: c.white }}>Credentials → OAuth Client ID → Web app</strong></li>
                <li>Add your site URL to Authorized JavaScript Origins</li>
                <li>Add yourself as a <strong style={{ color: c.white }}>Test User</strong></li>
              </ol>
            </div>
            <input placeholder="Paste Client ID" value={setupId} onChange={e => setSetupId(e.target.value)}
              style={{ width: "100%", background: c.input, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", color: c.text, fontSize: 13, outline: "none", marginBottom: 12, fontFamily: "inherit" }} />
            <Btn onClick={() => { if (!setupId.trim()) return; gcal.saveClientId(setupId.trim()); setShowSetup(false); setTimeout(() => gcal.signIn(), 1000); }} style={{ width: "100%" }}>Save & Connect</Btn>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════ WEEK VIEW ═══════════════════════ */
function WeekView({ gcal, weekOffset }) {
  const now = new Date();
  const [todos, setTodos] = useState(() => store.load("weekly-todos", {}));
  const [localEvents, setLocalEvents] = useState(() => store.load("cal-events", []));
  const [inputs, setInputs] = useState({});
  const [addingEvent, setAddingEvent] = useState(null);
  const [newEv, setNewEv] = useState({ title: "" });

  useEffect(() => { store.save("weekly-todos", todos); }, [todos]);
  useEffect(() => { store.save("cal-events", localEvents); }, [localEvents]);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });

  useEffect(() => {
    if (gcal.token) {
      const s = new Date(weekDates[0]); s.setHours(0,0,0,0);
      const e = new Date(weekDates[6]); e.setHours(23,59,59,999);
      gcal.fetchEvents(s, e);
    }
  }, [weekOffset, gcal.token]);

  const allEvents = [...localEvents, ...gcal.events];
  const eventsForDay = (date) => allEvents.filter(e => isSameDay(new Date(e.start), date));

  const addTodo = (dk) => { const t = (inputs[dk] || "").trim(); if (!t) return; setTodos(p => ({ ...p, [dk]: [...(p[dk] || []), { id: uid(), text: t, done: false }] })); setInputs(p => ({ ...p, [dk]: "" })); };
  const toggleTodo = (dk, id) => setTodos(p => ({ ...p, [dk]: (p[dk] || []).map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const removeTodo = (dk, id) => setTodos(p => ({ ...p, [dk]: (p[dk] || []).filter(t => t.id !== id) }));
  const addEvent = (dk) => { if (!newEv.title.trim()) return; setLocalEvents(ev => [...ev, { id: uid(), title: newEv.title.trim(), start: `${dk}T09:00:00`, end: null, allDay: true, source: "local" }]); setNewEv({ title: "" }); setAddingEvent(null); };
  const removeEvent = (id) => setLocalEvents(ev => ev.filter(x => x.id !== id));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, height: "100%" }}>
      {weekDates.map(date => {
        const dk = dateKey(date);
        const isToday = isSameDay(date, now);
        const dayEv = eventsForDay(date);
        const dayTodos = todos[dk] || [];
        const active = dayTodos.filter(t => !t.done);
        const done = dayTodos.filter(t => t.done);
        return (
          <div key={dk} style={{ background: isToday ? c.brownSoft : c.surfaceAlt, border: `1px solid ${isToday ? c.brownMed : c.border}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div style={{ textAlign: "center", marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: isToday ? c.brownLight : c.dim }}>{DAYS_SHORT[date.getDay()]}</div>
              <div style={{ fontSize: 22, fontWeight: isToday ? 700 : 400, color: isToday ? c.brownLight : c.white, lineHeight: 1.2 }}>{date.getDate()}</div>
            </div>
            {dayEv.length > 0 && (
              <div style={{ marginBottom: 6, paddingBottom: 4, borderBottom: `1px dashed ${c.border}`, flexShrink: 0 }}>
                {dayEv.map(ev => (
                  <div key={ev.id} style={{ display: "flex", gap: 5, alignItems: "flex-start", padding: "2px 0", fontSize: 11 }}>
                    <div style={{ width: 2, height: 14, borderRadius: 1, background: ev.source === "google" ? c.blue : c.brownLight, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, lineHeight: 1.3 }}><div style={{ fontWeight: 500, color: c.white }}>{ev.title}</div>{!ev.allDay && <div style={{ fontSize: 9, color: c.dim }}>{fmt(ev.start)}</div>}</div>
                    {ev.source === "local" && <span onClick={() => removeEvent(ev.id)} style={{ cursor: "pointer", color: c.dim, fontSize: 8, opacity: 0.5 }}>✕</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ flexShrink: 0, marginBottom: 4 }}>
              {addingEvent === dk ? (
                <div style={{ animation: "slideDown 0.15s ease" }}>
                  <input placeholder="Event title" value={newEv.title} onChange={e => setNewEv({ title: e.target.value })} onKeyDown={e => { if (e.key === "Enter") addEvent(dk); if (e.key === "Escape") setAddingEvent(null); }} autoFocus style={{ width: "100%", background: "transparent", border: `1px solid ${c.borderLight}`, borderRadius: 5, padding: "3px 6px", color: c.text, fontSize: 10, outline: "none", marginBottom: 3, fontFamily: "inherit" }} />
                  <div style={{ display: "flex", gap: 3 }}><Btn variant="primary" onClick={() => addEvent(dk)} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>Add</Btn><Btn variant="ghost" onClick={() => setAddingEvent(null)} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>Cancel</Btn></div>
                </div>
              ) : (
                <div onClick={() => setAddingEvent(dk)} style={{ fontSize: 9, color: c.dim, cursor: "pointer", padding: "2px 0", transition: "color 0.15s", display: "flex", alignItems: "center", gap: 3 }} onMouseEnter={e => e.currentTarget.style.color = c.blue} onMouseLeave={e => e.currentTarget.style.color = c.dim}><Svg d={I.plus} size={9} /> event</div>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
              {active.map(todo => (
                <div key={todo.id} style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11, lineHeight: 1.35, padding: "2px 0" }}>
                  <div onClick={() => toggleTodo(dk, todo.id)} style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${c.borderLight}`, flexShrink: 0, cursor: "pointer", marginTop: 1, transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = c.blue} onMouseLeave={e => e.currentTarget.style.borderColor = c.borderLight} />
                  <span style={{ flex: 1, color: c.white, wordBreak: "break-word" }}>{todo.text}</span>
                  <span onClick={() => removeTodo(dk, todo.id)} style={{ cursor: "pointer", color: c.dim, fontSize: 8, opacity: 0.3, flexShrink: 0 }}>✕</span>
                </div>
              ))}
              {done.map(todo => (
                <div key={todo.id} style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11, lineHeight: 1.35, padding: "2px 0", opacity: 0.35 }}>
                  <div onClick={() => toggleTodo(dk, todo.id)} style={{ width: 14, height: 14, borderRadius: 3, background: c.greenSoft, border: `1.5px solid ${c.green}40`, flexShrink: 0, cursor: "pointer", marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Svg d={I.check} size={8} color={c.green} /></div>
                  <span style={{ flex: 1, textDecoration: "line-through", color: c.dim, wordBreak: "break-word" }}>{todo.text}</span>
                </div>
              ))}
            </div>
            <input placeholder="+ task" value={inputs[dk] || ""} onChange={e => setInputs(p => ({ ...p, [dk]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTodo(dk)} style={{ marginTop: 4, background: "transparent", border: `1px solid ${c.border}`, borderRadius: 6, padding: "4px 7px", color: c.text, fontSize: 10, outline: "none", width: "100%", transition: "border-color 0.15s", flexShrink: 0, fontFamily: "inherit" }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.border} />
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ AI CHAT ═══════════════════════ */
function AIChat() {
  const [messages, setMessages] = useState(() => store.load("ai-chat", []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("ai_api_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [provider, setProvider] = useState(() => localStorage.getItem("ai_provider") || "anthropic");
  const scrollRef = useRef(null);

  useEffect(() => { store.save("ai-chat", messages); }, [messages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

  const saveKey = () => { localStorage.setItem("ai_api_key", tempKey.trim()); localStorage.setItem("ai_provider", provider); setApiKey(tempKey.trim()); setShowKeyModal(false); };
  const providerLabel = () => ({ anthropic: "Claude", openai: "GPT", gemini: "Gemini" }[provider] || "AI");

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      let assistantText = "";
      const sys = "You are a helpful, concise assistant embedded in a productivity dashboard. Keep responses brief and actionable.";
      if (provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1024, system: sys, messages: newMessages.map(m => ({ role: m.role, content: m.content })) }) });
        const data = await res.json(); assistantText = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || data.error?.message || "Error.";
      } else if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 1024, messages: [{ role: "system", content: sys }, ...newMessages.map(m => ({ role: m.role, content: m.content }))] }) });
        const data = await res.json(); assistantText = data.choices?.[0]?.message?.content || data.error?.message || "Error.";
      } else if (provider === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: newMessages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 1024 } }) });
        const data = await res.json(); assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || "Error.";
      }
      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
    } catch (e) { setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]); }
    setLoading(false);
  };

  return (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%", animation: "fadeUp 0.45s ease 0.15s both" }}>
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Svg d={I.bot} color={c.dim} size={14} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: c.sub }}>{apiKey ? providerLabel() : "AI Assistant"}</span>
          {apiKey && <div style={{ width: 5, height: 5, borderRadius: "50%", background: c.green }} />}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn variant="ghost" onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}><Svg d={I.key} size={11} /> {apiKey ? "Key" : "Setup"}</Btn>
          {messages.length > 0 && <Btn variant="ghost" onClick={() => { setMessages([]); store.save("ai-chat", []); }}><Svg d={I.trash} size={11} /></Btn>}
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {messages.length === 0 && !loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, color: c.dim }}><Svg d={I.bot} size={22} color={c.border} /><span style={{ fontSize: 12 }}>{apiKey ? "Ask me anything" : "Add an API key to start"}</span></div>}
        {messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", padding: "8px 11px", borderRadius: m.role === "user" ? "11px 11px 3px 11px" : "11px 11px 11px 3px", background: m.role === "user" ? c.brownMed : c.surfaceAlt, border: `1px solid ${m.role === "user" ? c.brown + "30" : c.border}`, fontSize: 13, lineHeight: 1.55, color: c.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>)}
        {loading && <div style={{ alignSelf: "flex-start", padding: "8px 11px", borderRadius: "11px 11px 11px 3px", background: c.surfaceAlt, border: `1px solid ${c.border}` }}><span style={{ fontSize: 12, color: c.dim, animation: "blink 1s infinite" }}>thinking...</span></div>}
      </div>
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${c.border}`, display: "flex", gap: 6, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder={apiKey ? "Type a message..." : "Set API key first..."} disabled={!apiKey} style={{ flex: 1, background: c.input, border: `1px solid ${c.border}`, borderRadius: 8, padding: "8px 11px", color: c.text, fontSize: 13, outline: "none", transition: "border-color 0.15s", opacity: apiKey ? 1 : 0.5, fontFamily: "inherit" }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.border} />
        <Btn onClick={sendMessage} style={{ padding: "8px 12px", opacity: (!input.trim() || !apiKey) ? 0.4 : 1 }}><Svg d={I.send} size={14} color="#fff" /></Btn>
      </div>
      {showKeyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.15s ease" }} onClick={() => setShowKeyModal(false)}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24, width: 400, maxWidth: "90vw", animation: "slideDown 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Setup</h3><Btn variant="icon" onClick={() => setShowKeyModal(false)}><Svg d={I.x} size={16} /></Btn></div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: c.sub, marginBottom: 6, display: "block" }}>Provider</label><div style={{ display: "flex", gap: 5 }}>{[["anthropic","Claude"],["openai","GPT"],["gemini","Gemini"]].map(([k,l]) => <button key={k} onClick={() => setProvider(k)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${provider === k ? c.brown : c.border}`, background: provider === k ? c.brownSoft : "transparent", color: provider === k ? c.brownLight : c.sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}</div></div>
            <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: c.sub, marginBottom: 6, display: "block" }}>API Key</label><input type="password" placeholder={provider === "anthropic" ? "sk-ant-..." : provider === "openai" ? "sk-..." : "AIza..."} value={tempKey} onChange={e => setTempKey(e.target.value)} onKeyDown={e => e.key === "Enter" && saveKey()} style={{ width: "100%", background: c.input, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 13px", color: c.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} /><p style={{ fontSize: 11, color: c.dim, marginTop: 6 }}>Stored locally. Sent only to {provider === "gemini" ? "Google" : provider === "anthropic" ? "Anthropic" : "OpenAI"}'s API.</p></div>
            <Btn onClick={saveKey} style={{ width: "100%" }}>Save</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ QUICK NOTES ═══════════════════════ */
function QuickNotes() {
  const [notes, setNotes] = useState(() => store.load("dashboard-notes", []));
  const [input, setInput] = useState("");
  useEffect(() => { store.save("dashboard-notes", notes); }, [notes]);
  const add = () => { if (!input.trim()) return; setNotes(n => [{ id: uid(), text: input.trim(), createdAt: Date.now() }, ...n]); setInput(""); };
  const remove = (id) => setNotes(n => n.filter(x => x.id !== id));

  return (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", animation: "fadeUp 0.45s ease 0.2s both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, flexShrink: 0 }}>
        <Svg d={I.note} color={c.dim} size={13} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: c.sub }}>Notes</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Quick note..." style={{ flex: 1, background: c.input, border: `1px solid ${c.border}`, borderRadius: 7, padding: "6px 10px", color: c.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} onFocus={e => e.target.style.borderColor = c.blue} onBlur={e => e.target.style.borderColor = c.border} />
        <Btn onClick={add} style={{ padding: "6px 10px", fontSize: 11 }}><Svg d={I.plus} size={12} color="#fff" /></Btn>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
        {notes.map(n => <div key={n.id} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, background: c.surfaceAlt, borderLeft: `2px solid ${c.brownLight}40`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}><span style={{ flex: 1, wordBreak: "break-word", color: c.white }}>{n.text}</span><span onClick={() => remove(n.id)} style={{ cursor: "pointer", color: c.dim, fontSize: 9, opacity: 0.4 }}>✕</span></div>)}
        {notes.length === 0 && <p style={{ textAlign: "center", color: c.dim, fontSize: 11, padding: 10 }}>Notes appear here</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════ COURSE / CATEGORY BOARDS ═══════════════════════ */
function CourseBoards() {
  const [boards, setBoards] = useState(() => store.load("course-boards", []));
  const [addingBoard, setAddingBoard] = useState(false);
  const [newName, setNewName] = useState("");
  const [taskInputs, setTaskInputs] = useState({});

  useEffect(() => { store.save("course-boards", boards); }, [boards]);

  const addBoard = () => {
    if (!newName.trim()) return;
    const colorIdx = boards.length % BOARD_COLORS.length;
    setBoards(b => [...b, { id: uid(), name: newName.trim(), color: colorIdx, tasks: [] }]);
    setNewName(""); setAddingBoard(false);
  };

  const removeBoard = (id) => setBoards(b => b.filter(x => x.id !== id));

  const addTask = (boardId) => {
    const text = (taskInputs[boardId] || "").trim();
    if (!text) return;
    setBoards(b => b.map(board =>
      board.id === boardId ? { ...board, tasks: [...board.tasks, { id: uid(), text, done: false }] } : board
    ));
    setTaskInputs(p => ({ ...p, [boardId]: "" }));
  };

  const toggleTask = (boardId, taskId) => {
    setBoards(b => b.map(board =>
      board.id === boardId ? { ...board, tasks: board.tasks.filter(t => t.id !== taskId) } : board
    ));
  };

  const removeTask = (boardId, taskId) => {
    setBoards(b => b.map(board =>
      board.id === boardId ? { ...board, tasks: board.tasks.filter(t => t.id !== taskId) } : board
    ));
  };

  return (
    <div style={{ animation: "fadeUp 0.45s ease 0.25s both" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Svg d={I.grid} color={c.dim} size={15} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: c.sub }}>Boards</span>
          <span style={{ fontSize: 11, color: c.dim }}>{boards.length} {boards.length === 1 ? "board" : "boards"}</span>
        </div>
        {!addingBoard && (
          <Btn variant="ghost" onClick={() => setAddingBoard(true)}><Svg d={I.plus} size={11} /> New Board</Btn>
        )}
      </div>

      {/* Add board input */}
      {addingBoard && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, animation: "slideDown 0.2s ease" }}>
          <input placeholder="Board name (e.g. Marketing Analytics)" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addBoard(); if (e.key === "Escape") setAddingBoard(false); }}
            autoFocus
            style={{ flex: 1, background: c.input, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", color: c.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = c.blue}
            onBlur={e => e.target.style.borderColor = c.border} />
          <Btn onClick={addBoard}>Create</Btn>
          <Btn variant="ghost" onClick={() => { setAddingBoard(false); setNewName(""); }}>Cancel</Btn>
        </div>
      )}

      {/* Board grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {boards.map(board => {
          const colors = BOARD_COLORS[board.color % BOARD_COLORS.length];

          return (
            <div key={board.id} style={{
              background: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: 16, minHeight: 140,
              display: "flex", flexDirection: "column",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${colors.bg}80`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

              {/* Board header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: c.white, lineHeight: 1.25, flex: 1 }}>{board.name}</h3>
                <Btn variant="icon" onClick={() => removeBoard(board.id)} style={{ opacity: 0.3, marginTop: -2 }}><Svg d={I.trash} size={12} /></Btn>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                {board.tasks.map(task => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}>
                    <div onClick={() => toggleTask(board.id, task.id)} style={{
                      width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${colors.border}`,
                      flexShrink: 0, cursor: "pointer", marginTop: 1, transition: "all 0.15s",
                      background: "transparent",
                    }} onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue; e.currentTarget.style.background = c.blueSoft; }} onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = "transparent"; }} />
                    <span style={{ flex: 1, fontSize: 13, color: c.white, lineHeight: 1.4, wordBreak: "break-word" }}>{task.text}</span>
                    <span onClick={() => removeTask(board.id, task.id)} style={{ cursor: "pointer", color: c.dim, fontSize: 9, opacity: 0.3, flexShrink: 0, marginTop: 2 }}>✕</span>
                  </div>
                ))}
              </div>

              {/* Add task */}
              <input placeholder="+ Add task" value={taskInputs[board.id] || ""}
                onChange={e => setTaskInputs(p => ({ ...p, [board.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addTask(board.id)}
                style={{
                  marginTop: 10, background: "rgba(0,0,0,0.2)", border: `1px solid ${colors.border}`,
                  borderRadius: 7, padding: "6px 10px", color: c.white, fontSize: 12,
                  outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = c.blue}
                onBlur={e => e.target.style.borderColor = colors.border} />
            </div>
          );
        })}

        {/* Empty state / add prompt */}
        {boards.length === 0 && !addingBoard && (
          <div onClick={() => setAddingBoard(true)} style={{
            background: c.surfaceAlt, border: `2px dashed ${c.border}`, borderRadius: 12,
            padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, cursor: "pointer", transition: "border-color 0.2s", minHeight: 140,
            gridColumn: "1 / -1", maxWidth: 300,
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.brownLight}
            onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
            <Svg d={I.plus} size={20} color={c.dim} />
            <span style={{ fontSize: 13, color: c.sub }}>Create your first board</span>
            <span style={{ fontSize: 11, color: c.dim }}>Organize tasks by course, project, or area of life</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ APP ═══════════════════════ */
export default function App() {
  const gcal = useGoogleCalendar();
  const now = new Date();
  const [weekOffset, setWeekOffset] = useState(0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekLabel = startOfWeek.getMonth() === endOfWeek.getMonth()
    ? `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`
    : `${MONTHS[startOfWeek.getMonth()].slice(0,3)} ${startOfWeek.getDate()} – ${MONTHS[endOfWeek.getMonth()].slice(0,3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;

  return (
    <div style={{ minHeight: "100vh", background: c.bg, overflow: "auto" }}>
      <GlobalCSS />

      {/* Top section — fixed viewport height */}
      <div style={{ height: "100vh", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <HeaderBar gcal={gcal} weekOffset={weekOffset} setWeekOffset={setWeekOffset} weekLabel={weekLabel} />
        <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}><WeekView gcal={gcal} weekOffset={weekOffset} /></div>
          <div style={{ width: 330, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            <div style={{ flex: 3, minHeight: 0 }}><AIChat /></div>
            <div style={{ flex: 1, minHeight: 0 }}><QuickNotes /></div>
          </div>
        </div>
      </div>

      {/* Boards section — scroll down */}
      <div style={{ padding: "30px 18px 40px", borderTop: `1px solid ${c.border}` }}>
        <CourseBoards />
      </div>
    </div>
  );
}
