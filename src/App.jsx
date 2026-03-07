import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════ HELPERS ═══════════════════════ */
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const uid = () => Math.random().toString(36).slice(2,9);
const isSameDay = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt = (d) => new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});

const store = {
  load(k,fb){try{const r=localStorage.getItem(k);return r?JSON.parse(r):fb;}catch{return fb;}},
  save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

/* ═══════════════════════ THEME ═══════════════════════ */
const c = {
  bg:"#09090b",surface:"#111114",surfaceAlt:"#0c0c0e",border:"#1c1c22",borderLight:"#26262e",
  brown:"#a0846b",brownSoft:"#a0846b14",brownMed:"#a0846b2a",brownLight:"#c4a882",
  blue:"#7cb5c9",blueSoft:"#7cb5c912",blueMed:"#7cb5c928",
  white:"#f2ede8",whiteSoft:"#f2ede815",
  green:"#7cb57c",greenSoft:"#7cb57c18",red:"#b07070",
  text:"#f2ede8",sub:"#9c958a",dim:"#5e584f",input:"#0d0d10",
};

const BOARD_COLORS = [
  {bg:"#2d4a3e",border:"#3d6354"},{bg:"#1e3a4f",border:"#2d5270"},{bg:"#3b4a3a",border:"#516b4f"},
  {bg:"#2a3f4f",border:"#3a5a6f"},{bg:"#3d3830",border:"#584f42"},{bg:"#2f4040",border:"#426060"},
  {bg:"#3a3530",border:"#554d44"},{bg:"#2a3d3d",border:"#3d5858"},{bg:"#354535",border:"#4a634a"},
  {bg:"#2d3545",border:"#3f4d65"},
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
    @keyframes taskComplete{0%{transform:scale(1);opacity:1}20%{transform:scale(1.03);opacity:1}40%{transform:scale(1);opacity:1}100%{transform:scale(0.95) translateX(8px);opacity:0}}
    @keyframes checkPop{0%{transform:scale(0) rotate(-45deg);opacity:0}50%{transform:scale(1.3) rotate(0deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
    @keyframes checkGlow{0%{box-shadow:0 0 0 0 rgba(124,181,124,0.5)}50%{box-shadow:0 0 8px 3px rgba(124,181,124,0.4)}100%{box-shadow:0 0 0 0 rgba(124,181,124,0)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
  `}</style>
);

const Svg = ({d,size=15,color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const I = {
  cal:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  check:"M20 6L9 17l-5-5",plus:"M12 5v14M5 12h14",
  trash:"M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  cloud:"M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  chevL:"M15 18l-6-6 6-6",chevR:"M9 18l6-6-6-6",chevD:"M6 9l6 6 6-6",
  x:"M18 6L6 18M6 6l12 12",
  link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
  send:"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  bot:"M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1H3v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3 18h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z",
  key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  note:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  grid:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  loc:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  info:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
  help:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
};

const Btn = ({variant="primary",children,style,...props}) => {
  const base = {border:"none",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit"};
  const v = {
    primary:{...base,background:c.brown,color:"#fff",padding:"7px 14px",...style},
    ghost:{...base,background:"transparent",color:c.sub,border:`1px solid ${c.border}`,padding:"5px 10px",fontSize:11,...style},
    icon:{...base,background:"transparent",color:c.dim,padding:5,borderRadius:6,...style},
    danger:{...base,background:c.red,color:"#fff",padding:"7px 14px",...style},
  };
  return <button style={v[variant]} onMouseEnter={e=>e.currentTarget.style.opacity=0.8} onMouseLeave={e=>e.currentTarget.style.opacity=1} {...props}>{children}</button>;
};

/* Modal wrapper */
const Modal = ({onClose,children,width=400}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,animation:"fadeIn 0.15s ease"}} onClick={onClose}>
    <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:24,width,maxWidth:"90vw",animation:"slideDown 0.25s ease"}} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

/* Tooltip */
const Tip = ({text,children}) => {
  const [show,setShow] = useState(false);
  return (
    <div style={{position:"relative",display:"inline-flex"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:"#222",border:`1px solid ${c.border}`,borderRadius:6,padding:"4px 8px",fontSize:10,color:c.white,whiteSpace:"nowrap",zIndex:50,animation:"fadeIn 0.15s ease"}}>{text}</div>}
    </div>
  );
};

/* ═══════════════════════ WELCOME / ONBOARDING ═══════════════════════ */
function WelcomeModal({onClose}) {
  const [step,setStep] = useState(0);
  const steps = [
    { title:"Welcome to your Dashboard", body:"A productivity hub that brings your calendar, tasks, AI assistant, and notes into one place. Everything saves automatically in your browser.", icon:I.grid },
    { title:"Weekly Calendar + Tasks", body:"The main view shows your week with daily to-do columns. Add tasks by typing in the input at the bottom of each day. Click the checkbox to mark them done with a satisfying animation. You can also add local events to any day.", icon:I.cal },
    { title:"Google Calendar Sync", body:"Click \"Connect Google\" in the top bar to link your Google Calendar. Your events appear alongside your tasks. You'll need a Google Cloud Client ID — the setup modal walks you through each step.", icon:I.link },
    { title:"AI Assistant", body:"The chat panel on the right supports Claude (Anthropic), GPT (OpenAI), and Gemini (Google). Click \"Setup\" to choose your provider and paste your API key. Gemini offers free API keys at aistudio.google.com.", icon:I.bot },
    { title:"Boards — Scroll Down", body:"Below the main dashboard, you'll find color-coded boards for organizing tasks by course, project, or life area — like Google Keep. Scroll down to find them, and click \"New Board\" to create your first one.", icon:I.grid },
    { title:"Set Your Location", body:"The weather widget in the top-right corner shows local conditions. Click the location name to change it to your city, or let the app auto-detect your location.", icon:I.loc },
  ];
  const s = steps[step];
  return (
    <Modal onClose={onClose} width={440}>
      <div style={{textAlign:"center",padding:"8px 0"}}>
        <div style={{marginBottom:16}}><Svg d={s.icon} size={32} color={c.brownLight}/></div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8,color:c.white}}>{s.title}</h2>
        <p style={{fontSize:14,color:c.sub,lineHeight:1.7,marginBottom:24,maxWidth:340,margin:"0 auto 24px"}}>{s.body}</p>
        <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:20}}>
          {steps.map((_,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===step?c.brownLight:c.border,transition:"background 0.2s"}}/>)}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {step>0 && <Btn variant="ghost" onClick={()=>setStep(step-1)}>Back</Btn>}
          {step<steps.length-1 ? (
            <Btn onClick={()=>setStep(step+1)}>Next</Btn>
          ) : (
            <Btn onClick={()=>{store.save("onboarded",true);onClose();}}>Get Started</Btn>
          )}
        </div>
        {step<steps.length-1 && <div style={{marginTop:10}}><span onClick={()=>{store.save("onboarded",true);onClose();}} style={{fontSize:11,color:c.dim,cursor:"pointer",textDecoration:"underline"}}>Skip tour</span></div>}
      </div>
    </Modal>
  );
}

/* ═══════════════════════ CONFIRM MODAL ═══════════════════════ */
function ConfirmModal({title,message,onConfirm,onCancel,danger=false}) {
  return (
    <Modal onClose={onCancel} width={340}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>{title}</h3>
      <p style={{fontSize:13,color:c.sub,lineHeight:1.6,marginBottom:18}}>{message}</p>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant={danger?"danger":"primary"} onClick={onConfirm}>{danger?"Delete":"Confirm"}</Btn>
      </div>
    </Modal>
  );
}

/* ═══════════════════════ LOCATION PICKER ═══════════════════════ */
function useLocation() {
  const [loc,setLoc] = useState(()=>store.load("user-location",{lat:42.57,lon:-71.10,name:"North Reading, MA"}));
  const saveLoc = (l)=>{setLoc(l);store.save("user-location",l);};
  return {loc,saveLoc};
}

function LocationModal({loc,onSave,onClose}) {
  const [name,setName] = useState(loc.name);
  const [lat,setLat] = useState(String(loc.lat));
  const [lon,setLon] = useState(String(loc.lon));
  const [detecting,setDetecting] = useState(false);

  const autoDetect = ()=>{
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        const la=pos.coords.latitude,lo=pos.coords.longitude;
        setLat(String(la.toFixed(4)));setLon(String(lo.toFixed(4)));
        try{
          const res=await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${la}&longitude=${lo}&count=1&format=json`);
          // Reverse isn't available, so use forward geocode as fallback
        }catch{}
        setName("My Location");setDetecting(false);
      },
      ()=>setDetecting(false),
      {timeout:10000}
    );
  };

  const searchCity = async()=>{
    if(!name.trim())return;
    try{
      const res=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=1&language=en&format=json`);
      const data=await res.json();
      if(data.results?.length){
        const r=data.results[0];
        setLat(String(r.latitude));setLon(String(r.longitude));
        setName(`${r.name}, ${r.admin1||r.country}`);
      }
    }catch{}
  };

  return (
    <Modal onClose={onClose} width={380}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontSize:16,fontWeight:700}}>Set Location</h3>
        <Btn variant="icon" onClick={onClose}><Svg d={I.x} size={16}/></Btn>
      </div>
      <p style={{fontSize:12,color:c.sub,marginBottom:14}}>Your location is used for weather only and is stored locally in your browser.</p>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input placeholder="City name (e.g. Boston, MA)" value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&searchCity()}
          style={{flex:1,background:c.input,border:`1px solid ${c.border}`,borderRadius:8,padding:"9px 13px",color:c.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <Btn onClick={searchCity}>Search</Btn>
      </div>
      <Btn variant="ghost" onClick={autoDetect} style={{width:"100%",marginBottom:12,justifyContent:"center"}}>
        <Svg d={I.loc} size={12}/> {detecting?"Detecting...":"Auto-detect my location"}
      </Btn>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1}}>
          <label style={{fontSize:10,color:c.dim,marginBottom:3,display:"block"}}>Latitude</label>
          <input value={lat} onChange={e=>setLat(e.target.value)} style={{width:"100%",background:c.input,border:`1px solid ${c.border}`,borderRadius:7,padding:"7px 10px",color:c.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:10,color:c.dim,marginBottom:3,display:"block"}}>Longitude</label>
          <input value={lon} onChange={e=>setLon(e.target.value)} style={{width:"100%",background:c.input,border:`1px solid ${c.border}`,borderRadius:7,padding:"7px 10px",color:c.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        </div>
      </div>
      <Btn onClick={()=>{onSave({lat:parseFloat(lat),lon:parseFloat(lon),name:name.trim()||"My Location"});onClose();}} style={{width:"100%"}}>Save Location</Btn>
    </Modal>
  );
}

/* ═══════════════════════ GOOGLE CALENDAR HOOK ═══════════════════════ */
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function useGoogleCalendar() {
  const [token,setToken]=useState(()=>localStorage.getItem("gcal_token")||null);
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(false);
  const [clientId,setClientId]=useState(()=>localStorage.getItem("gcal_client_id")||"");
  const clientRef=useRef(null);
  const [gsiReady,setGsiReady]=useState(false);

  useEffect(()=>{
    if(!clientId)return;
    if(document.getElementById("gsi-script")){setGsiReady(true);return;}
    const s=document.createElement("script");
    s.id="gsi-script";s.src="https://accounts.google.com/gsi/client";s.async=true;
    s.onload=()=>setGsiReady(true);document.body.appendChild(s);
  },[clientId]);

  useEffect(()=>{
    if(!gsiReady||!clientId||!window.google)return;
    clientRef.current=window.google.accounts.oauth2.initTokenClient({
      client_id:clientId,scope:SCOPES,
      callback:(r)=>{if(r.access_token){setToken(r.access_token);localStorage.setItem("gcal_token",r.access_token);}},
    });
  },[gsiReady,clientId]);

  const signIn=useCallback(()=>{
    if(clientRef.current){clientRef.current.requestAccessToken();}
    else if(clientId&&window.google){
      clientRef.current=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPES,
        callback:(r)=>{if(r.access_token){setToken(r.access_token);localStorage.setItem("gcal_token",r.access_token);}},
      });clientRef.current.requestAccessToken();
    }
  },[clientId]);
  const signOut=useCallback(()=>{if(window.google&&token){try{window.google.accounts.oauth2.revoke(token);}catch{}}setToken(null);setEvents([]);localStorage.removeItem("gcal_token");},[token]);
  const switchAccount=useCallback(()=>{if(window.google&&token){try{window.google.accounts.oauth2.revoke(token);}catch{}}setToken(null);setEvents([]);localStorage.removeItem("gcal_token");setTimeout(()=>{if(clientRef.current)clientRef.current.requestAccessToken({prompt:"select_account"});},300);},[token]);
  const disconnect=useCallback(()=>{if(window.google&&token){try{window.google.accounts.oauth2.revoke(token);}catch{}}setToken(null);setEvents([]);localStorage.removeItem("gcal_token");localStorage.removeItem("gcal_client_id");setClientId("");},[token]);
  const saveClientId=useCallback((id)=>{setClientId(id);localStorage.setItem("gcal_client_id",id);},[]);

  const fetchEvents=useCallback(async(start,end)=>{
    if(!token)return;setLoading(true);
    try{
      const url=`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`;
      const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
      if(res.status===401){signOut();return;}
      const data=await res.json();
      setEvents((data.items||[]).map(ev=>({id:ev.id,title:ev.summary||"(No title)",start:ev.start?.dateTime||ev.start?.date,end:ev.end?.dateTime||ev.end?.date,allDay:!ev.start?.dateTime,source:"google"})));
    }catch(e){console.error(e);}setLoading(false);
  },[token,signOut]);

  return {token,events,loading,signIn,signOut,switchAccount,disconnect,fetchEvents,clientId,saveClientId};
}

/* ═══════════════════════ HEADER BAR ═══════════════════════ */
function HeaderBar({gcal,weekOffset,setWeekOffset,weekLabel,loc,onLocClick}) {
  const now=new Date();
  const h=now.getHours();
  const greeting=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const [w,setW]=useState(null);
  const [showSetup,setShowSetup]=useState(false);
  const [setupId,setSetupId]=useState(gcal.clientId);

  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&timezone=auto&daily=temperature_2m_max,temperature_2m_min&forecast_days=1`);
        const data=await res.json();
        setW({...data.current,high:data.daily?.temperature_2m_max?.[0],low:data.daily?.temperature_2m_min?.[0]});
      }catch{}
    })();
  },[loc.lat,loc.lon]);

  const desc=(code)=>{
    if(code<=3)return{e:"☀️",l:"Clear"};if(code<=48)return{e:"☁️",l:"Cloudy"};
    if(code<=67)return{e:"🌧️",l:"Rain"};if(code<=77)return{e:"❄️",l:"Snow"};
    if(code<=82)return{e:"🌦️",l:"Showers"};return{e:"⛈️",l:"Storms"};
  };

  return (
    <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",background:c.surface,border:`1px solid ${c.border}`,borderRadius:12,animation:"fadeUp 0.4s ease",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:16}}>
          <h1 style={{fontSize:20,fontWeight:700,color:c.white}}>{greeting}</h1>
          <span style={{fontSize:13,color:c.sub}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {gcal.token?(
            <div style={{display:"flex",gap:4}}>
              <Tip text="Google Calendar connected"><Btn variant="ghost" style={{color:c.green,borderColor:`${c.green}30`}}><Svg d={I.link} size={11} color={c.green}/> Connected</Btn></Tip>
              <Tip text="Sign in with a different Google account"><Btn variant="ghost" onClick={gcal.switchAccount}>Switch</Btn></Tip>
              <Tip text="Remove Google Calendar connection"><Btn variant="ghost" onClick={gcal.disconnect} style={{color:c.red,borderColor:`${c.red}30`}}>Disconnect</Btn></Tip>
            </div>
          ):(
            <Tip text="Link your Google Calendar to see events"><Btn variant="ghost" onClick={()=>gcal.clientId?gcal.signIn():setShowSetup(true)}><Svg d={I.link} size={11}/> Connect Google</Btn></Tip>
          )}
          <div style={{width:1,height:16,background:c.border,margin:"0 4px"}}/>
          <Btn variant="ghost" onClick={()=>setWeekOffset(w=>w-1)}><Svg d={I.chevL} size={12}/></Btn>
          <span style={{fontSize:13,color:c.brownLight,minWidth:170,textAlign:"center",fontWeight:500}}>{weekLabel}</span>
          <Btn variant="ghost" onClick={()=>setWeekOffset(w=>w+1)}><Svg d={I.chevR} size={12}/></Btn>
          {weekOffset!==0&&<Btn variant="ghost" onClick={()=>setWeekOffset(0)} style={{fontSize:10}}>Today</Btn>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {w&&(
            <>
              <span style={{fontSize:20}}>{desc(w.weather_code).e}</span>
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                  <span style={{fontSize:18,fontWeight:700,color:c.white}}>{Math.round(w.temperature_2m)}°F</span>
                  <span style={{fontSize:11,color:c.sub}}>{desc(w.weather_code).l}</span>
                </div>
                <div style={{fontSize:10,color:c.dim}}>
                  H:{Math.round(w.high||0)}° L:{Math.round(w.low||0)}° · {Math.round(w.wind_speed_10m)} mph ·{" "}
                  <span onClick={onLocClick} style={{cursor:"pointer",textDecoration:"underline",transition:"color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color=c.blue} onMouseLeave={e=>e.currentTarget.style.color=c.dim}>{loc.name}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Google Setup Modal — improved instructions */}
      {showSetup&&(
        <Modal onClose={()=>setShowSetup(false)} width={460}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{fontSize:16,fontWeight:700}}>Connect Google Calendar</h3>
            <Btn variant="icon" onClick={()=>setShowSetup(false)}><Svg d={I.x} size={16}/></Btn>
          </div>
          <div style={{fontSize:13,color:c.sub,lineHeight:1.7,marginBottom:16}}>
            <p style={{marginBottom:10}}>This requires a <strong style={{color:c.white}}>Google Cloud Client ID</strong> (free, takes ~5 minutes):</p>
            <ol style={{paddingLeft:18,display:"flex",flexDirection:"column",gap:5}}>
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{color:c.blue,textDecoration:"none"}}>Google Cloud Credentials</a> and create or select a project</li>
              <li>Click <strong style={{color:c.white}}>+ Create Credentials → OAuth Client ID</strong></li>
              <li>If prompted to configure a consent screen, choose <strong style={{color:c.white}}>External</strong>, fill in your email, then under <strong style={{color:c.white}}>Test Users</strong> add your Gmail address</li>
              <li>For Application type, choose <strong style={{color:c.white}}>Web application</strong></li>
              <li>Under <strong style={{color:c.white}}>Authorized JavaScript Origins</strong>, add:<br/>
                <code style={{background:c.input,padding:"2px 6px",borderRadius:4,fontSize:12}}>{window.location.origin}</code>
              </li>
              <li>Enable the <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" style={{color:c.blue,textDecoration:"none"}}>Google Calendar API</a></li>
              <li>Copy the <strong style={{color:c.white}}>Client ID</strong> and paste below</li>
            </ol>
          </div>
          <input placeholder="Paste Client ID (ends with .apps.googleusercontent.com)" value={setupId} onChange={e=>setSetupId(e.target.value)}
            style={{width:"100%",background:c.input,border:`1px solid ${c.border}`,borderRadius:8,padding:"10px 14px",color:c.text,fontSize:13,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
          <Btn onClick={()=>{if(!setupId.trim())return;gcal.saveClientId(setupId.trim());setShowSetup(false);setTimeout(()=>gcal.signIn(),1000);}} style={{width:"100%"}}>Save & Connect</Btn>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════ WEEK VIEW ═══════════════════════ */
function WeekView({gcal,weekOffset}) {
  const now=new Date();
  const [todos,setTodos]=useState(()=>store.load("weekly-todos",{}));
  const [localEvents,setLocalEvents]=useState(()=>store.load("cal-events",[]));
  const [inputs,setInputs]=useState({});
  const [addingEvent,setAddingEvent]=useState(null);
  const [newEv,setNewEv]=useState({title:""});
  const [completing,setCompleting]=useState(new Set());
  const [editing,setEditing]=useState(null); // {dk,id}
  const [editText,setEditText]=useState("");

  useEffect(()=>{store.save("weekly-todos",todos);},[todos]);
  useEffect(()=>{store.save("cal-events",localEvents);},[localEvents]);

  const startOfWeek=new Date(now);
  startOfWeek.setDate(now.getDate()-now.getDay()+(weekOffset*7));
  const weekDates=Array.from({length:7},(_,i)=>{const d=new Date(startOfWeek);d.setDate(startOfWeek.getDate()+i);return d;});

  useEffect(()=>{
    if(gcal.token){const s=new Date(weekDates[0]);s.setHours(0,0,0,0);const e=new Date(weekDates[6]);e.setHours(23,59,59,999);gcal.fetchEvents(s,e);}
  },[weekOffset,gcal.token]);

  const allEvents=[...localEvents,...gcal.events];
  const eventsForDay=(date)=>allEvents.filter(e=>isSameDay(new Date(e.start),date));

  const addTodo=(dk)=>{const t=(inputs[dk]||"").trim();if(!t)return;setTodos(p=>({...p,[dk]:[...(p[dk]||[]),{id:uid(),text:t,done:false}]}));setInputs(p=>({...p,[dk]:""}));};
  const toggleTodo=(dk,id)=>{
    const todo=(todos[dk]||[]).find(t=>t.id===id);
    if(todo&&!todo.done){
      setCompleting(prev=>new Set(prev).add(id));
      setTimeout(()=>{setTodos(p=>({...p,[dk]:(p[dk]||[]).map(t=>t.id===id?{...t,done:true}:t)}));setCompleting(prev=>{const s=new Set(prev);s.delete(id);return s;});},600);
    }else{setTodos(p=>({...p,[dk]:(p[dk]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}));}
  };
  const removeTodo=(dk,id)=>setTodos(p=>({...p,[dk]:(p[dk]||[]).filter(t=>t.id!==id)}));
  const saveEdit=()=>{if(!editing||!editText.trim())return;setTodos(p=>({...p,[editing.dk]:(p[editing.dk]||[]).map(t=>t.id===editing.id?{...t,text:editText.trim()}:t)}));setEditing(null);};
  const addEvent=(dk)=>{if(!newEv.title.trim())return;setLocalEvents(ev=>[...ev,{id:uid(),title:newEv.title.trim(),start:`${dk}T09:00:00`,end:null,allDay:true,source:"local"}]);setNewEv({title:""});setAddingEvent(null);};
  const removeEvent=(id)=>setLocalEvents(ev=>ev.filter(x=>x.id!==id));

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:6,height:"100%"}}>
      {weekDates.map(date=>{
        const dk=dateKey(date);const isToday=isSameDay(date,now);const dayEv=eventsForDay(date);
        const dayTodos=todos[dk]||[];const active=dayTodos.filter(t=>!t.done);const done=dayTodos.filter(t=>t.done);
        return (
          <div key={dk} style={{background:isToday?c.brownSoft:c.surfaceAlt,border:`1px solid ${isToday?c.brownMed:c.border}`,borderRadius:10,padding:10,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
            <div style={{textAlign:"center",marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:isToday?c.brownLight:c.dim}}>{DAYS_SHORT[date.getDay()]}</div>
              <div style={{fontSize:22,fontWeight:isToday?700:400,color:isToday?c.brownLight:c.white,lineHeight:1.2}}>{date.getDate()}</div>
            </div>
            {dayEv.length>0&&(
              <div style={{marginBottom:6,paddingBottom:4,borderBottom:`1px dashed ${c.border}`,flexShrink:0}}>
                {dayEv.map(ev=>(
                  <div key={ev.id} style={{display:"flex",gap:5,alignItems:"flex-start",padding:"2px 0",fontSize:11}}>
                    <div style={{width:2,height:14,borderRadius:1,background:ev.source==="google"?c.blue:c.brownLight,flexShrink:0,marginTop:2}}/>
                    <div style={{flex:1,lineHeight:1.3}}><div style={{fontWeight:500,color:c.white}}>{ev.title}</div>{!ev.allDay&&<div style={{fontSize:9,color:c.dim}}>{fmt(ev.start)}</div>}</div>
                    {ev.source==="local"&&<Tip text="Remove event"><span onClick={()=>removeEvent(ev.id)} style={{cursor:"pointer",color:c.dim,fontSize:8,opacity:0.5}}>✕</span></Tip>}
                  </div>
                ))}
              </div>
            )}
            <div style={{flexShrink:0,marginBottom:4}}>
              {addingEvent===dk?(
                <div style={{animation:"slideDown 0.15s ease"}}>
                  <input placeholder="Event title" value={newEv.title} onChange={e=>setNewEv({title:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")addEvent(dk);if(e.key==="Escape")setAddingEvent(null);}} autoFocus style={{width:"100%",background:"transparent",border:`1px solid ${c.borderLight}`,borderRadius:5,padding:"3px 6px",color:c.text,fontSize:10,outline:"none",marginBottom:3,fontFamily:"inherit"}}/>
                  <div style={{display:"flex",gap:3}}><Btn variant="primary" onClick={()=>addEvent(dk)} style={{fontSize:9,padding:"2px 6px",borderRadius:4}}>Add</Btn><Btn variant="ghost" onClick={()=>setAddingEvent(null)} style={{fontSize:9,padding:"2px 6px",borderRadius:4}}>Cancel</Btn></div>
                </div>
              ):(
                <Tip text="Add a calendar event"><div onClick={()=>setAddingEvent(dk)} style={{fontSize:9,color:c.dim,cursor:"pointer",padding:"2px 0",transition:"color 0.15s",display:"flex",alignItems:"center",gap:3}} onMouseEnter={e=>e.currentTarget.style.color=c.blue} onMouseLeave={e=>e.currentTarget.style.color=c.dim}><Svg d={I.plus} size={9}/> event</div></Tip>
              )}
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:2,overflowY:"auto",minHeight:0}}>
              {active.map(todo=>{
                const isC=completing.has(todo.id);
                const isEditing=editing&&editing.dk===dk&&editing.id===todo.id;
                return (
                <div key={todo.id} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,lineHeight:1.35,padding:"2px 0",...(isC?{animation:"taskComplete 0.6s ease forwards"}:{})}}>
                  <Tip text="Mark complete"><div onClick={()=>toggleTodo(dk,todo.id)} style={{width:14,height:14,borderRadius:3,flexShrink:0,cursor:"pointer",marginTop:1,transition:"all 0.2s",...(isC?{background:c.green,border:`1.5px solid ${c.green}`,animation:"checkGlow 0.6s ease",display:"flex",alignItems:"center",justifyContent:"center"}:{border:`1.5px solid ${c.borderLight}`,background:"transparent"})}} onMouseEnter={e=>{if(!isC)e.currentTarget.style.borderColor=c.blue;}} onMouseLeave={e=>{if(!isC)e.currentTarget.style.borderColor=c.borderLight;}}>
                    {isC&&<svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{animation:"checkPop 0.3s ease forwards"}}><path d="M20 6L9 17l-5-5"/></svg>}
                  </div></Tip>
                  {isEditing?(
                    <input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditing(null);}} onBlur={saveEdit} autoFocus style={{flex:1,background:"transparent",border:`1px solid ${c.blue}`,borderRadius:4,padding:"1px 4px",color:c.white,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                  ):(
                    <span onDoubleClick={()=>{setEditing({dk,id:todo.id});setEditText(todo.text);}} style={{flex:1,color:isC?c.green:c.white,wordBreak:"break-word",transition:"color 0.2s",cursor:"default",...(isC?{textDecoration:"line-through"}:{})}}>{todo.text}</span>
                  )}
                  <Tip text="Delete task"><span onClick={()=>removeTodo(dk,todo.id)} style={{cursor:"pointer",color:c.dim,fontSize:8,opacity:0.3,flexShrink:0}}>✕</span></Tip>
                </div>);
              })}
              {done.map(todo=>(
                <div key={todo.id} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,lineHeight:1.35,padding:"2px 0",opacity:0.35}}>
                  <Tip text="Mark incomplete"><div onClick={()=>toggleTodo(dk,todo.id)} style={{width:14,height:14,borderRadius:3,background:c.greenSoft,border:`1.5px solid ${c.green}40`,flexShrink:0,cursor:"pointer",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}><Svg d={I.check} size={8} color={c.green}/></div></Tip>
                  <span style={{flex:1,textDecoration:"line-through",color:c.dim,wordBreak:"break-word"}}>{todo.text}</span>
                </div>
              ))}
            </div>
            <input placeholder="+ task" value={inputs[dk]||""} onChange={e=>setInputs(p=>({...p,[dk]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTodo(dk)} style={{marginTop:4,background:"transparent",border:`1px solid ${c.border}`,borderRadius:6,padding:"4px 7px",color:c.text,fontSize:10,outline:"none",width:"100%",transition:"border-color 0.15s",flexShrink:0,fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=c.blue} onBlur={e=>e.target.style.borderColor=c.border}/>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ AI CHAT ═══════════════════════ */
function AIChat() {
  const [messages,setMessages]=useState(()=>store.load("ai-chat",[]));
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("ai_api_key")||"");
  const [showKeyModal,setShowKeyModal]=useState(false);
  const [tempKey,setTempKey]=useState("");
  const [provider,setProvider]=useState(()=>localStorage.getItem("ai_provider")||"anthropic");
  const scrollRef=useRef(null);

  useEffect(()=>{store.save("ai-chat",messages);},[messages]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages,loading]);

  const saveKey=()=>{localStorage.setItem("ai_api_key",tempKey.trim());localStorage.setItem("ai_provider",provider);setApiKey(tempKey.trim());setShowKeyModal(false);};
  const providerLabel=()=>({anthropic:"Claude",openai:"GPT",gemini:"Gemini"}[provider]||"AI");

  const sendMessage=async()=>{
    if(!input.trim()||!apiKey)return;
    const userMsg={role:"user",content:input.trim()};
    const newMessages=[...messages,userMsg];setMessages(newMessages);setInput("");setLoading(true);
    try{
      let txt="";const sys="You are a helpful, concise assistant embedded in a productivity dashboard. Keep responses brief and actionable.";
      if(provider==="anthropic"){
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1024,system:sys,messages:newMessages.map(m=>({role:m.role,content:m.content}))})});
        const data=await res.json();txt=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n")||data.error?.message||"Error.";
      }else if(provider==="openai"){
        const res=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({model:"gpt-4o-mini",max_tokens:1024,messages:[{role:"system",content:sys},...newMessages.map(m=>({role:m.role,content:m.content}))]})});
        const data=await res.json();txt=data.choices?.[0]?.message?.content||data.error?.message||"Error.";
      }else if(provider==="gemini"){
        const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:newMessages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:1024}})});
        const data=await res.json();txt=data.candidates?.[0]?.content?.parts?.[0]?.text||data.error?.message||"Error.";
      }
      setMessages(prev=>[...prev,{role:"assistant",content:txt}]);
    }catch(e){setMessages(prev=>[...prev,{role:"assistant",content:`Error: ${e.message}`}]);}
    setLoading(false);
  };

  return (
    <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden",height:"100%",animation:"fadeUp 0.45s ease 0.15s both"}}>
      <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <Svg d={I.bot} color={c.dim} size={14}/>
          <span style={{fontSize:12,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:c.sub}}>{apiKey?providerLabel():"AI Assistant"}</span>
          {apiKey&&<div style={{width:5,height:5,borderRadius:"50%",background:c.green}}/>}
        </div>
        <div style={{display:"flex",gap:4}}>
          <Tip text="Configure AI provider and API key"><Btn variant="ghost" onClick={()=>{setTempKey(apiKey);setShowKeyModal(true);}}><Svg d={I.key} size={11}/> {apiKey?"Key":"Setup"}</Btn></Tip>
          {messages.length>0&&<Tip text="Clear chat history"><Btn variant="ghost" onClick={()=>{setMessages([]);store.save("ai-chat",[]);}}><Svg d={I.trash} size={11}/></Btn></Tip>}
        </div>
      </div>
      <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8,minHeight:0}}>
        {messages.length===0&&!loading&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,color:c.dim}}><Svg d={I.bot} size={22} color={c.border}/><span style={{fontSize:12}}>{apiKey?"Ask me anything":"Click Setup to add an API key"}</span></div>}
        {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",padding:"8px 11px",borderRadius:m.role==="user"?"11px 11px 3px 11px":"11px 11px 11px 3px",background:m.role==="user"?c.brownMed:c.surfaceAlt,border:`1px solid ${m.role==="user"?c.brown+"30":c.border}`,fontSize:13,lineHeight:1.55,color:c.text,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.content}</div>)}
        {loading&&<div style={{alignSelf:"flex-start",padding:"8px 11px",borderRadius:"11px 11px 11px 3px",background:c.surfaceAlt,border:`1px solid ${c.border}`}}><span style={{fontSize:12,color:c.dim,animation:"blink 1s infinite"}}>thinking...</span></div>}
      </div>
      <div style={{padding:"8px 12px",borderTop:`1px solid ${c.border}`,display:"flex",gap:6,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder={apiKey?"Type a message...":"Set API key first..."} disabled={!apiKey} style={{flex:1,background:c.input,border:`1px solid ${c.border}`,borderRadius:8,padding:"8px 11px",color:c.text,fontSize:13,outline:"none",opacity:apiKey?1:0.5,fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=c.blue} onBlur={e=>e.target.style.borderColor=c.border}/>
        <Btn onClick={sendMessage} style={{padding:"8px 12px",opacity:(!input.trim()||!apiKey)?0.4:1}}><Svg d={I.send} size={14} color="#fff"/></Btn>
      </div>
      {/* API Key Modal — improved with direct links */}
      {showKeyModal&&(
        <Modal onClose={()=>setShowKeyModal(false)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:16,fontWeight:700}}>AI Assistant Setup</h3><Btn variant="icon" onClick={()=>setShowKeyModal(false)}><Svg d={I.x} size={16}/></Btn></div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,color:c.sub,marginBottom:6,display:"block"}}>Choose your provider</label>
            <div style={{display:"flex",gap:5}}>
              {[["anthropic","Claude"],["openai","GPT"],["gemini","Gemini"]].map(([k,l])=>
                <button key={k} onClick={()=>setProvider(k)} style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${provider===k?c.brown:c.border}`,background:provider===k?c.brownSoft:"transparent",color:provider===k?c.brownLight:c.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
              )}
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,color:c.sub,marginBottom:6,display:"block"}}>API Key</label>
            <input type="password" placeholder={provider==="anthropic"?"sk-ant-...":provider==="openai"?"sk-...":"AIza..."} value={tempKey} onChange={e=>setTempKey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveKey()} style={{width:"100%",background:c.input,border:`1px solid ${c.border}`,borderRadius:8,padding:"10px 13px",color:c.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <div style={{fontSize:12,color:c.sub,lineHeight:1.6,marginBottom:16,padding:"10px 12px",background:c.surfaceAlt,borderRadius:8,border:`1px solid ${c.border}`}}>
            {provider==="gemini"&&<><strong style={{color:c.white}}>Gemini is free!</strong> Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{color:c.blue,textDecoration:"none"}}>aistudio.google.com/apikey</a>. Click "Create API Key" and copy it.</>}
            {provider==="anthropic"&&<>Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{color:c.blue,textDecoration:"none"}}>console.anthropic.com</a>. Requires a paid account with credits ($5+ to start).</>}
            {provider==="openai"&&<>Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{color:c.blue,textDecoration:"none"}}>platform.openai.com/api-keys</a>. Requires a paid account with credits.</>}
            <div style={{marginTop:6,fontSize:11,color:c.dim}}>Your key is stored in your browser only. It's sent directly to the provider's API and never to our servers.</div>
          </div>
          <Btn onClick={saveKey} style={{width:"100%"}}>Save</Btn>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════ QUICK NOTES ═══════════════════════ */
function QuickNotes() {
  const [notes,setNotes]=useState(()=>store.load("dashboard-notes",[]));
  const [input,setInput]=useState("");
  useEffect(()=>{store.save("dashboard-notes",notes);},[notes]);
  const add=()=>{if(!input.trim())return;setNotes(n=>[{id:uid(),text:input.trim(),createdAt:Date.now()},...n]);setInput("");};
  const remove=(id)=>setNotes(n=>n.filter(x=>x.id!==id));
  return (
    <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:12,padding:12,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",animation:"fadeUp 0.45s ease 0.2s both"}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexShrink:0}}><Svg d={I.note} color={c.dim} size={13}/><span style={{fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:c.sub}}>Notes</span></div>
      <div style={{display:"flex",gap:6,marginBottom:8,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Quick note..." style={{flex:1,background:c.input,border:`1px solid ${c.border}`,borderRadius:7,padding:"6px 10px",color:c.text,fontSize:12,outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=c.blue} onBlur={e=>e.target.style.borderColor=c.border}/>
        <Btn onClick={add} style={{padding:"6px 10px",fontSize:11}}><Svg d={I.plus} size={12} color="#fff"/></Btn>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,minHeight:0}}>
        {notes.map(n=><div key={n.id} style={{padding:"7px 10px",borderRadius:7,fontSize:12,background:c.surfaceAlt,borderLeft:`2px solid ${c.brownLight}40`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}><span style={{flex:1,wordBreak:"break-word",color:c.white}}>{n.text}</span><span onClick={()=>remove(n.id)} style={{cursor:"pointer",color:c.dim,fontSize:9,opacity:0.4}}>✕</span></div>)}
        {notes.length===0&&<p style={{textAlign:"center",color:c.dim,fontSize:11,padding:10}}>Notes appear here</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════ COURSE BOARDS ═══════════════════════ */
function CourseBoards() {
  const [boards,setBoards]=useState(()=>store.load("course-boards",[]));
  const [addingBoard,setAddingBoard]=useState(false);
  const [newName,setNewName]=useState("");
  const [taskInputs,setTaskInputs]=useState({});
  const [boardCompleting,setBoardCompleting]=useState(new Set());
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [editingBoard,setEditingBoard]=useState(null);
  const [editBoardName,setEditBoardName]=useState("");
  const [editingTask,setEditingTask]=useState(null);
  const [editTaskText,setEditTaskText]=useState("");

  useEffect(()=>{store.save("course-boards",boards);},[boards]);

  const addBoard=()=>{if(!newName.trim())return;setBoards(b=>[...b,{id:uid(),name:newName.trim(),color:b.length%BOARD_COLORS.length,tasks:[]}]);setNewName("");setAddingBoard(false);};
  const removeBoard=(id)=>{setBoards(b=>b.filter(x=>x.id!==id));setConfirmDelete(null);};
  const saveBoardName=()=>{if(!editingBoard||!editBoardName.trim())return;setBoards(b=>b.map(x=>x.id===editingBoard?{...x,name:editBoardName.trim()}:x));setEditingBoard(null);};
  const addTask=(boardId)=>{const text=(taskInputs[boardId]||"").trim();if(!text)return;setBoards(b=>b.map(board=>board.id===boardId?{...board,tasks:[...board.tasks,{id:uid(),text,done:false}]}:board));setTaskInputs(p=>({...p,[boardId]:""}));};
  const toggleTask=(boardId,taskId)=>{setBoardCompleting(prev=>new Set(prev).add(taskId));setTimeout(()=>{setBoards(b=>b.map(board=>board.id===boardId?{...board,tasks:board.tasks.filter(t=>t.id!==taskId)}:board));setBoardCompleting(prev=>{const s=new Set(prev);s.delete(taskId);return s;});},600);};
  const removeTask=(boardId,taskId)=>{setBoards(b=>b.map(board=>board.id===boardId?{...board,tasks:board.tasks.filter(t=>t.id!==taskId)}:board));};
  const saveTaskEdit=(boardId)=>{if(!editingTask||!editTaskText.trim())return;setBoards(b=>b.map(board=>board.id===boardId?{...board,tasks:board.tasks.map(t=>t.id===editingTask?{...t,text:editTaskText.trim()}:t)}:board));setEditingTask(null);};

  return (
    <div style={{animation:"fadeUp 0.45s ease 0.25s both"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Svg d={I.grid} color={c.dim} size={15}/>
          <span style={{fontSize:13,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:c.sub}}>Boards</span>
          <span style={{fontSize:11,color:c.dim}}>{boards.length} {boards.length===1?"board":"boards"}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <Tip text="Need help?"><Btn variant="ghost" onClick={()=>{}}><Svg d={I.info} size={11}/> Double-click to edit tasks</Btn></Tip>
          {!addingBoard&&<Btn variant="ghost" onClick={()=>setAddingBoard(true)}><Svg d={I.plus} size={11}/> New Board</Btn>}
        </div>
      </div>
      {addingBoard&&(
        <div style={{display:"flex",gap:8,marginBottom:14,animation:"slideDown 0.2s ease"}}>
          <input placeholder="Board name (e.g. Marketing Analytics)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addBoard();if(e.key==="Escape")setAddingBoard(false);}} autoFocus style={{flex:1,background:c.input,border:`1px solid ${c.border}`,borderRadius:8,padding:"10px 14px",color:c.text,fontSize:14,outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=c.blue} onBlur={e=>e.target.style.borderColor=c.border}/>
          <Btn onClick={addBoard}>Create</Btn>
          <Btn variant="ghost" onClick={()=>{setAddingBoard(false);setNewName("");}}>Cancel</Btn>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10}}>
        {boards.map(board=>{
          const colors=BOARD_COLORS[board.color%BOARD_COLORS.length];
          return (
            <div key={board.id} style={{background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:12,padding:16,minHeight:140,display:"flex",flexDirection:"column",transition:"transform 0.15s, box-shadow 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 4px 20px ${colors.bg}80`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                {editingBoard===board.id?(
                  <input value={editBoardName} onChange={e=>setEditBoardName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveBoardName();if(e.key==="Escape")setEditingBoard(null);}} onBlur={saveBoardName} autoFocus style={{flex:1,background:"transparent",border:`1px solid ${c.blue}`,borderRadius:6,padding:"2px 6px",color:c.white,fontSize:17,fontWeight:700,outline:"none",fontFamily:"inherit",marginRight:8}}/>
                ):(
                  <h3 onDoubleClick={()=>{setEditingBoard(board.id);setEditBoardName(board.name);}} style={{fontSize:17,fontWeight:700,color:c.white,lineHeight:1.25,flex:1,cursor:"default"}}>{board.name}</h3>
                )}
                <Tip text="Delete this board"><Btn variant="icon" onClick={()=>setConfirmDelete(board.id)} style={{opacity:0.3,marginTop:-2}}><Svg d={I.trash} size={12}/></Btn></Tip>
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                {board.tasks.map(task=>{
                  const isC=boardCompleting.has(task.id);
                  const isEditing=editingTask===task.id;
                  return (
                  <div key={task.id} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"3px 0",...(isC?{animation:"taskComplete 0.6s ease forwards"}:{})}}>
                    <Tip text="Complete & remove"><div onClick={()=>toggleTask(board.id,task.id)} style={{width:16,height:16,borderRadius:3,flexShrink:0,cursor:"pointer",marginTop:1,transition:"all 0.2s",...(isC?{background:c.green,border:`1.5px solid ${c.green}`,animation:"checkGlow 0.6s ease",display:"flex",alignItems:"center",justifyContent:"center"}:{border:`1.5px solid ${colors.border}`,background:"transparent"})}} onMouseEnter={e=>{if(!isC){e.currentTarget.style.borderColor=c.blue;e.currentTarget.style.background=c.blueSoft;}}} onMouseLeave={e=>{if(!isC){e.currentTarget.style.borderColor=colors.border;e.currentTarget.style.background="transparent";}}}>
                      {isC&&<svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{animation:"checkPop 0.3s ease forwards"}}><path d="M20 6L9 17l-5-5"/></svg>}
                    </div></Tip>
                    {isEditing?(
                      <input value={editTaskText} onChange={e=>setEditTaskText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveTaskEdit(board.id);if(e.key==="Escape")setEditingTask(null);}} onBlur={()=>saveTaskEdit(board.id)} autoFocus style={{flex:1,background:"transparent",border:`1px solid ${c.blue}`,borderRadius:4,padding:"1px 6px",color:c.white,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                    ):(
                      <span onDoubleClick={()=>{setEditingTask(task.id);setEditTaskText(task.text);}} style={{flex:1,fontSize:13,color:isC?c.green:c.white,lineHeight:1.4,wordBreak:"break-word",transition:"color 0.2s",cursor:"default",...(isC?{textDecoration:"line-through"}:{})}}>{task.text}</span>
                    )}
                    <Tip text="Delete task"><span onClick={()=>removeTask(board.id,task.id)} style={{cursor:"pointer",color:c.dim,fontSize:9,opacity:0.3,flexShrink:0,marginTop:2}}>✕</span></Tip>
                  </div>);
                })}
              </div>
              <input placeholder="+ Add task" value={taskInputs[board.id]||""} onChange={e=>setTaskInputs(p=>({...p,[board.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTask(board.id)} style={{marginTop:10,background:"rgba(0,0,0,0.2)",border:`1px solid ${colors.border}`,borderRadius:7,padding:"6px 10px",color:c.white,fontSize:12,outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=c.blue} onBlur={e=>e.target.style.borderColor=colors.border}/>
            </div>
          );
        })}
        {boards.length===0&&!addingBoard&&(
          <div onClick={()=>setAddingBoard(true)} style={{background:c.surfaceAlt,border:`2px dashed ${c.border}`,borderRadius:12,padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",minHeight:140,gridColumn:"1/-1",maxWidth:300}} onMouseEnter={e=>e.currentTarget.style.borderColor=c.brownLight} onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}>
            <Svg d={I.plus} size={20} color={c.dim}/><span style={{fontSize:13,color:c.sub}}>Create your first board</span><span style={{fontSize:11,color:c.dim}}>Organize tasks by course, project, or area of life</span>
          </div>
        )}
      </div>
      {confirmDelete&&<ConfirmModal title="Delete Board?" message="This will permanently delete this board and all its tasks. This can't be undone." danger onConfirm={()=>removeBoard(confirmDelete)} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
}

/* ═══════════════════════ SCROLL HINT ═══════════════════════ */
function ScrollHint() {
  const [show,setShow]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setShow(false),6000);return()=>clearTimeout(t);},[]);
  if(!show)return null;
  return (
    <div onClick={()=>{window.scrollTo({top:window.innerHeight,behavior:"smooth"});setShow(false);}}
      style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:c.surface,border:`1px solid ${c.border}`,borderRadius:20,cursor:"pointer",animation:"fadeUp 0.4s ease",zIndex:50,transition:"opacity 0.3s"}}>
      <span style={{fontSize:12,color:c.sub}}>Scroll down for Boards</span>
      <span style={{animation:"bounce 1.5s infinite"}}><Svg d={I.chevD} size={14} color={c.brownLight}/></span>
    </div>
  );
}

/* ═══════════════════════ APP ═══════════════════════ */
export default function App() {
  const gcal=useGoogleCalendar();
  const {loc,saveLoc}=useLocation();
  const now=new Date();
  const [weekOffset,setWeekOffset]=useState(0);
  const [showWelcome,setShowWelcome]=useState(()=>!store.load("onboarded",false));
  const [showLocModal,setShowLocModal]=useState(false);

  const startOfWeek=new Date(now);
  startOfWeek.setDate(now.getDate()-now.getDay()+(weekOffset*7));
  const endOfWeek=new Date(startOfWeek);endOfWeek.setDate(startOfWeek.getDate()+6);
  const weekLabel=startOfWeek.getMonth()===endOfWeek.getMonth()
    ?`${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`
    :`${MONTHS[startOfWeek.getMonth()].slice(0,3)} ${startOfWeek.getDate()} – ${MONTHS[endOfWeek.getMonth()].slice(0,3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;

  return (
    <div style={{minHeight:"100vh",background:c.bg,overflow:"auto"}}>
      <GlobalCSS/>
      {showWelcome&&<WelcomeModal onClose={()=>setShowWelcome(false)}/>}
      {showLocModal&&<LocationModal loc={loc} onSave={saveLoc} onClose={()=>setShowLocModal(false)}/>}
      <div style={{height:"100vh",padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
        <HeaderBar gcal={gcal} weekOffset={weekOffset} setWeekOffset={setWeekOffset} weekLabel={weekLabel} loc={loc} onLocClick={()=>setShowLocModal(true)}/>
        <div style={{display:"flex",gap:10,flex:1,minHeight:0}}>
          <div style={{flex:1,minWidth:0}}><WeekView gcal={gcal} weekOffset={weekOffset}/></div>
          <div style={{width:330,flexShrink:0,display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
            <div style={{flex:3,minHeight:0}}><AIChat/></div>
            <div style={{flex:1,minHeight:0}}><QuickNotes/></div>
          </div>
        </div>
      </div>
      <div style={{padding:"30px 18px 40px",borderTop:`1px solid ${c.border}`}}><CourseBoards/></div>
      <ScrollHint/>
    </div>
  );
}
