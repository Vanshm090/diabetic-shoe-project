// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Get Color Based on Pressure Value ---
const getPressureColor = (value) => {
    if (value < 100) return "#10b981"; // Emerald (Low)
    if (value < 180) return "#06b6d4"; // Cyan (Normal)
    if (value < 240) return "#facc15"; // Yellow (Warning)
    return "#ef4444"; // Red (High Risk)
};

// --- COMPONENT: The 4-Zone Heatmap Visual ---
const FootMapZones = ({ pressures }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };

  return (
    <svg viewBox="0 0 100 240" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
       <path 
         d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" 
         fill="none" 
         stroke="#334155" 
         strokeWidth="2"
       />
       <circle cx="35" cy="40" r="18" fill={getPressureColor(p.toe)} className="opacity-70 blur-md transition-colors duration-1000" />
       <circle cx="35" cy="90" r="16" fill={getPressureColor(p.met)} className="opacity-70 blur-md transition-colors duration-1000" />
       <circle cx="50" cy="145" r="14" fill={getPressureColor(p.mid)} className="opacity-60 blur-lg transition-colors duration-1000" />
       <circle cx="50" cy="200" r="20" fill={getPressureColor(p.heel)} className="opacity-80 blur-md transition-colors duration-1000" />
    </svg>
  );
};

// --- COMPONENT: Live Graph Animation ---
const LiveGraph = () => (
  <div className="w-full h-24 bg-black/50 border border-slate-800 rounded-lg overflow-hidden relative">
    <svg className="absolute bottom-0 left-0 w-[200%] h-full animate-dash" style={{ stroke: '#0ea5e9', fill: 'none', strokeWidth: 2 }}>
      <path d="M0,50 Q20,40 40,50 T80,50 T120,20 T160,50 T200,80 T240,50 T280,50 T320,30 T360,50 T400,50 T440,50 Q460,60 480,50 T520,50 T560,20 T600,50 T640,80 T680,50 T720,50 T760,30 T800,50 V100 H0 Z" opacity="0.2" fill="#0ea5e9" />
      <path d="M0,50 Q20,40 40,50 T80,50 T120,20 T160,50 T200,80 T240,50 T280,50 T320,30 T360,50 T400,50 T440,50 Q460,60 480,50 T520,50 T560,20 T600,50 T640,80 T680,50 T720,50 T760,30 T800,50" />
    </svg>
    <div className="absolute top-2 left-2 text-[10px] text-cyan-500 font-mono animate-pulse">4-ZONE_SENSOR_ARRAY [ACTIVE]</div>
  </div>
);

// --- MAIN APP ---

export default function Home() {
  // STEPS: 0=Landing, 1=Input, 2=Connect Device, 3=Scanning, 4=Results
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  
  // SCANNING STATE
  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("SYSTEM READY");
  const [messageColor, setMessageColor] = useState("text-slate-400");
  const [result, setResult] = useState(null);

  // CONNECTION STATE
  const [connectionStatus, setConnectionStatus] = useState("searching"); // searching, found, connecting, success

  // --- LOGIC: The 50-Second Scan (Now Step 3) ---
  useEffect(() => {
    if (step === 3) {
      setProgress(0);
      setScanMessage("INITIALIZING BIOSENSORS...");
      setMessageColor("text-cyan-400");
      setResult(null); 

      const fetchData = fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ age, gender }),
      }).then(res => res.json());

      const interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 100) {
            clearInterval(interval);
            fetchData.then(data => {
                setResult(data);
                setStep(4); // Go to results
            });
            return 100;
          }

          if (old === 5) { setScanMessage("CALIBRATING ZONE 1: TOE CONTACT..."); setMessageColor("text-blue-400"); }
          if (old === 20) { setScanMessage("CALIBRATING ZONE 2: METATARSAL HEAD..."); setMessageColor("text-blue-400"); }
          if (old === 35) { setScanMessage("⚠️ KEEP STEADY: MIDFOOT ANALYSIS..."); setMessageColor("text-yellow-400 animate-pulse"); }
          if (old === 55) { setScanMessage("CALIBRATING ZONE 4: HEEL PRESSURE..."); setMessageColor("text-blue-400"); }
          if (old === 70) { setScanMessage("🛑 PEAK PRESSURE LOAD TEST. DO NOT MOVE."); setMessageColor("text-orange-500 font-bold animate-pulse"); }
          if (old === 85) { setScanMessage("MEASURING SKIN HUMIDITY & TEMP..."); setMessageColor("text-emerald-400"); }
          if (old === 95) { setScanMessage("PROCESSING 4-ZONE HEATMAP..."); setMessageColor("text-white"); }

          return old + 1;
        });
      }, 500); 

      return () => clearInterval(interval);
    }
  }, [step]);

  // --- LOGIC: Simulate Connection (Step 2) ---
  useEffect(() => {
    if (step === 2 && connectionStatus === "searching") {
        // Find device after 2 seconds
        const timer = setTimeout(() => {
            setConnectionStatus("found");
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [step, connectionStatus]);

  const handleConnect = () => {
      setConnectionStatus("connecting");
      setTimeout(() => {
          setConnectionStatus("success");
          // Wait a moment then start scan
          setTimeout(() => setStep(3), 1500);
      }, 2000);
  };

  // --- SCREEN 0: WELCOME ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-between p-4 overflow-hidden relative font-mono">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        
        <div className="flex-grow flex flex-col items-center justify-center space-y-8 z-10 mt-10">
            <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-blue-500 border-b-purple-500 border-l-pink-500 animate-spin"></div>
                <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700">
                    <span className="text-5xl">🦶</span>
                </div>
            </div>
            <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tighter drop-shadow-lg">
                SMART<span className="text-white">SOLE</span>
                </h1>
                <p className="text-slate-400 tracking-widest text-xs md:text-sm mt-4">MULTI-ZONE ULCER DETECTION SYSTEM</p>
            </div>
            <button 
                onClick={() => setStep(1)}
                className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full mt-4"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-600 to-blue-700 opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute inset-0 border border-cyan-400 rounded-full opacity-50"></div>
                <span className="relative text-white text-xl tracking-widest font-bold shadow-black drop-shadow-md">INITIATE_DIAGNOSTICS</span>
            </button>
        </div>

        <div className="relative z-20 w-full max-w-3xl mb-4">
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 transform hover:scale-[1.01] transition-transform duration-500">
                <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-6 w-full md:w-auto justify-center md:justify-start">
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 text-cyan-300">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                         </svg>
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-bold tracking-wider text-lg">PEC</span>
                        <span className="block text-cyan-400 text-[10px] tracking-widest uppercase">Project Showcase</span>
                    </div>
                </div>
                <div className="flex-grow text-center md:text-left space-y-2">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Developed By</p>
                        <p className="text-white text-lg font-bold tracking-wide">MODULE GROUP <span className="text-cyan-400">(ULCER DETECTOR)</span></p>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50 mt-2">
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Under The Expert Guidance Of</p>
                        <p className="text-yellow-400 text-xl font-bold tracking-wide drop-shadow-sm">Dr. JaiMala Gambhir</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    );
  }

  // --- SCREEN 1: INPUT ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>  
          <div className="flex items-center space-x-3 mb-8 border-b border-slate-800 pb-4">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl text-cyan-400 tracking-widest">SUBJECT_CALIBRATION</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block">Age</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 text-white p-4 rounded-xl text-2xl text-center focus:border-cyan-500 focus:outline-none transition-colors"
                placeholder="--"
              />
            </div>
            <div>
              <label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-white p-4 rounded-xl text-lg focus:border-cyan-500 focus:outline-none text-center appearance-none">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <button 
              disabled={!age} 
              onClick={() => setStep(2)} 
              className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold tracking-[0.2em] rounded-xl hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-4 shadow-lg shadow-cyan-500/20"
            >
              SEARCH_DEVICE
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: CONNECT TO DEVICE (NEW STEP) ---
  if (step === 2) {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
            <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative text-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                
                <h2 className="text-xl text-white tracking-widest mb-2">DEVICE PAIRING</h2>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-8">Scanning for nearby modules...</p>

                {connectionStatus === "searching" && (
                     <div className="flex flex-col items-center py-8">
                         <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                         <p className="text-blue-400 animate-pulse">Searching...</p>
                     </div>
                )}

                {connectionStatus === "found" && (
                    <div className="py-4 animate-fade-in-up">
                        <div className="bg-slate-900 border border-blue-500/50 p-4 rounded-xl flex items-center justify-between mb-6 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">📶</div>
                                <div className="text-left">
                                    <p className="text-white font-bold">ESP8266EX</p>
                                    <p className="text-xs text-slate-400">Signal: Strong (-42dBm)</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleConnect}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                            >
                                CONNECT
                            </button>
                        </div>
                    </div>
                )}

                {connectionStatus === "connecting" && (
                     <div className="flex flex-col items-center py-8">
                         <div className="w-12 h-12 bg-blue-500 rounded-full animate-ping mb-4 opacity-50"></div>
                         <p className="text-white">Establishing Secure Handshake...</p>
                     </div>
                )}

                {connectionStatus === "success" && (
                     <div className="flex flex-col items-center py-8">
                         <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                            <span className="text-3xl text-black">✓</span>
                         </div>
                         <p className="text-emerald-400 font-bold tracking-widest">DEVICE CONNECTED</p>
                         <p className="text-slate-500 text-xs mt-2">Redirecting to scan...</p>
                     </div>
                )}
            </div>
        </main>
    );
  }

  // --- SCREEN 3: SCANNING ---
  if (step === 3) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan z-0"></div>
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center space-y-10">
          
          <div className="relative w-64 h-80 border border-slate-800 rounded-3xl bg-slate-900/50 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)]">
             <div className="w-32 h-64 opacity-50 animate-pulse">
                <FootMapZones pressures={null} />
             </div>
             <div className="absolute w-full h-2 bg-cyan-400 blur-sm shadow-[0_0_20px_#22d3ee] animate-scan"></div>
             <div className="absolute bottom-4 font-bold text-xl text-white drop-shadow-lg">
                Scanning: {progress}%
             </div>
          </div>

          <div className="w-full space-y-6 text-center">
            <h2 className={`text-lg font-bold tracking-wider uppercase transition-colors duration-300 h-8 ${messageColor}`}>
               {scanMessage}
            </h2>
            <LiveGraph />
          </div>
        </div>
      </main>
    );
  }

  // --- SCREEN 4: RESULTS ---
  if (step === 4 && result) {
    const isRisk = result.status.includes("Risk");
    const statusColor = isRisk ? "text-red-500" : "text-emerald-400";
    const glowColor = isRisk ? "shadow-red-500/20" : "shadow-emerald-500/20";

    // Live Jitter Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setResult(prev => {
                if (!prev) return null;
                const noise = (val) => Math.max(0, val + Math.floor(Math.random() * 5) - 2);
                const tempNoise = (val) => (parseFloat(val) + (Math.random() * 0.2 - 0.1)).toFixed(1);
                return {
                    ...prev,
                    pressures: {
                        heel: noise(prev.pressures.heel),
                        toe: noise(prev.pressures.toe),
                        met: noise(prev.pressures.met),
                        mid: noise(prev.pressures.mid),
                    },
                    temp: tempNoise(prev.temp),
                    humidity: noise(prev.humidity)
                };
            });
        }, 800); 
        return () => clearInterval(interval);
    }, []);

    return (
      <main className="min-h-screen bg-black text-white p-4 font-mono overflow-y-auto">
        <div className="max-w-6xl mx-auto pt-6 pb-12">
          
          <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-4 mb-6">
            <div>
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-white">LIVE MONITORING SESSION</h1>
               </div>
               <div className="flex space-x-4 text-xs text-slate-500 mt-2">
                  <span>ID: {Math.floor(Math.random() * 99999)}</span>
                  <span>AGE: {result.age}</span>
                  <span>SEX: {result.gender}</span>
               </div>
            </div>
            <button onClick={() => setStep(0)} className="mt-4 md:mt-0 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs tracking-widest transition">NEW_SESSION</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className={`lg:col-span-4 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ${glowColor}`}>
               <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-6 w-full text-center border-b border-slate-800 pb-2">Pressure Heatmap</h3>
               <div className="relative z-10 w-40 h-80 my-4">
                 <FootMapZones pressures={result.pressures} />
               </div>
               {isRisk ? (
                   <div className="text-red-500 font-bold animate-pulse text-sm mt-2 bg-red-950/50 px-4 py-2 rounded-full">ABNORMAL DISTRIBUTION</div>
               ) : (
                   <div className="text-emerald-500 font-bold text-sm mt-2 bg-emerald-950/50 px-4 py-2 rounded-full">NORMAL DISTRIBUTION</div>
               )}
            </div>

            <div className="lg:col-span-8 space-y-6">
               <div className={`bg-slate-900/60 backdrop-blur-md rounded-3xl border-l-8 p-8 flex flex-col md:flex-row items-center justify-between shadow-xl ${isRisk ? 'border-red-500' : 'border-emerald-500'}`}>
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-slate-400 text-sm uppercase tracking-widest">System Diagnosis</h3>
                    <div className={`text-3xl md:text-4xl font-black mt-2 tracking-tight uppercase ${statusColor}`}>{result.status}</div>
                    <p className="text-slate-500 text-sm mt-1">Risk Level: {result.riskLevel}</p>
                  </div>
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center bg-black/30 ${isRisk ? 'border-red-500 text-red-500 animate-pulse-ring' : 'border-emerald-500 text-emerald-500'}`}>
                     <span className="text-4xl">{isRisk ? '!' : '✓'}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Heel', 'Toe', 'Met', 'Mid'].map((zone) => {
                      const val = result.pressures[zone.toLowerCase()];
                      const color = getPressureColor(val);
                      return (
                        <div key={zone} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300" style={{backgroundColor: color}}></div>
                             <h3 className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">Zone: {zone}</h3>
                             <div className="text-2xl font-bold tabular-nums" style={{color: color}}>{val}</div>
                             <div className="text-slate-600 text-xs">kPa</div>
                        </div>
                      );
                  })}
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                      <div>
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-1">Skin Temp</h3>
                        <div className={`text-3xl font-bold tabular-nums ${parseFloat(result.temp) > 33 ? "text-orange-400" : "text-emerald-400"}`}>{result.temp}°C</div>
                      </div>
                      <div className="text-3xl opacity-30">🌡️</div>
                   </div>

                   <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                      <div>
                        <h3 className="text-slate-500 text-xs uppercase tracking-widest mb-1">Humidity</h3>
                        <div className="text-3xl font-bold text-cyan-400 tabular-nums">{result.humidity}%</div>
                      </div>
                       <div className="text-3xl opacity-30">💧</div>
                   </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  return null;
}