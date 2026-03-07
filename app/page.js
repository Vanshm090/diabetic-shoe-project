// app/page.js
"use client";
import { useState, useEffect } from "react";

const getPressureColor = (value) => {
    if (value < 100) return "#10b981"; 
    if (value < 180) return "#06b6d4"; 
    if (value < 240) return "#facc15"; 
    return "#ef4444"; 
};

const FootMapZones = ({ pressures }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };
  return (
    <svg viewBox="0 0 100 240" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
       <path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="none" stroke="#334155" strokeWidth="2" />
       <circle cx="35" cy="40" r="18" fill={getPressureColor(p.toe)} className="opacity-70 blur-md transition-colors duration-1000" />
       <circle cx="35" cy="90" r="16" fill={getPressureColor(p.met)} className="opacity-70 blur-md transition-colors duration-1000" />
       <circle cx="50" cy="145" r="14" fill={getPressureColor(p.mid)} className="opacity-60 blur-lg transition-colors duration-1000" />
       <circle cx="50" cy="200" r="20" fill={getPressureColor(p.heel)} className="opacity-80 blur-md transition-colors duration-1000" />
    </svg>
  );
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  
  // NEW: Store uploaded CSV text
  const [csvData, setCsvData] = useState("");
  const [fileName, setFileName] = useState("");

  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("SYSTEM READY");
  const [result, setResult] = useState(null);
  const [sessionID, setSessionID] = useState("---");

  useEffect(() => {
    setSessionID(Math.floor(Math.random() * 99999).toString());
  }, []);

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setCsvData(e.target.result);
      reader.readAsText(file);
    }
  };

  // --- LOGIC: Upload & Process Data (Step 2) ---
  useEffect(() => {
    if (step === 2) {
      setProgress(0);
      setScanMessage("PROCESSING BLUETOOTH DATA LOG...");
      setResult(null); 

      // Send to API
      const fetchDataPromise = fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ age, gender, csvData }),
      })
      .then(res => res.json());

      const interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 100) {
            clearInterval(interval);
            fetchDataPromise.then(data => {
                if(data.error) alert("Error processing CSV: " + data.error);
                else { setResult(data); setStep(3); }
            });
            return 100;
          }
          if (old === 20) setScanMessage("CALCULATING Z-SCORE NORMALIZATIONS...");
          if (old === 50) setScanMessage("RUNNING EWMA & CUSUM ALGORITHMS...");
          if (old === 80) setScanMessage("CALCULATING FINAL DFU RISK SCORES...");
          return old + 2; // Speeds up the fake timer since it's just processing a file
        });
      }, 100); 

      return () => clearInterval(interval);
    }
  }, [step]);


  // --- SCREEN 0: WELCOME ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-between p-4 font-mono">
        <div className="flex-grow flex flex-col items-center justify-center space-y-8 mt-10">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">SMART<span className="text-white">SOLE</span></h1>
            <p className="text-slate-400 text-xs md:text-sm">DFU LOG & ANALYZE SYSTEM</p>
            <button onClick={() => setStep(1)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full">START NEW SESSION</button>
        </div>
      </main>
    );
  }

  // --- SCREEN 1: INPUT & UPLOAD FILE ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-3xl">
          <h2 className="text-xl text-cyan-400 tracking-widest mb-6 border-b border-slate-700 pb-2">PATIENT & DATA LOG</h2>
          
          <div className="space-y-4 mb-6">
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-black border border-slate-700 text-white p-3 rounded" placeholder="Age" />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-black border border-slate-700 text-white p-3 rounded">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors cursor-pointer relative mb-6">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="text-4xl mb-2">📄</div>
              <p className="text-slate-300 font-bold">{fileName ? fileName : "Upload Bluetooth Log (.csv)"}</p>
              <p className="text-slate-500 text-xs mt-1">Format: Time, P1, P2, P3, P4, T, RH</p>
          </div>

          <button disabled={!age || !csvData} onClick={() => setStep(2)} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-bold rounded">PROCESS ALGORITHM</button>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: PROCESSING ---
  if (step === 2) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono text-white text-center">
         <div className="text-6xl mb-6 animate-spin">⚙️</div>
         <h2 className="text-xl text-cyan-400 mb-4">{scanMessage}</h2>
         <div className="w-full max-w-md bg-slate-800 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-400" style={{width: `${progress}%`}}></div>
         </div>
      </main>
    );
  }

  // --- SCREEN 3: RESULTS (NEW DASHBOARD) ---
  if (step === 3 && result) {
    const isRisk = result.status.includes("WARNING") || result.status.includes("CRITICAL");
    const statusColor = isRisk ? "text-red-500" : "text-emerald-400";

    return (
      <main className="min-h-screen bg-black text-white p-4 font-mono overflow-y-auto">
        <div className="max-w-6xl mx-auto pt-6 pb-12">
          
          <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
            <div>
               <h1 className="text-2xl font-bold tracking-tighter text-white">ALGORITHMIC REPORT</h1>
               <div className="text-xs text-slate-500 mt-1">ID: {sessionID} | AGE: {result.age} | LOG PARSED: SUCCESS</div>
            </div>
            <button onClick={() => setStep(0)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs">NEW REPORT</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Overall Status & Score */}
            <div className="space-y-6">
                <div className={`bg-slate-900 border ${isRisk ? 'border-red-500' : 'border-emerald-500'} rounded-2xl p-6 text-center`}>
                    <h3 className="text-slate-400 text-xs uppercase mb-2">DFU Logistic Score</h3>
                    <div className={`text-6xl font-black ${statusColor}`}>{result.dfuScore}</div>
                    <div className="text-slate-500 text-xs mt-2">Scale: 0-100</div>
                </div>

                <div className={`bg-slate-900 border ${isRisk ? 'border-red-500' : 'border-emerald-500'} rounded-2xl p-6`}>
                    <h3 className="text-slate-400 text-xs uppercase mb-1">System Status</h3>
                    <div className={`text-xl font-bold ${statusColor}`}>{result.status}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-center h-64">
                    <FootMapZones pressures={result.pressures} />
                </div>
            </div>

            {/* RIGHT: Algorithmic Breakdown */}
            <div className="col-span-2 space-y-6">
                
                <h3 className="text-slate-300 font-bold border-b border-slate-800 pb-2">ALGORITHM SUB-SCORES (EWMA/CUSUM Applied)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="text-slate-500 text-xs uppercase mb-1">Pressure Risk Score (PRS)</div>
                        <div className="text-3xl text-blue-400 font-bold">{result.scores.PRS}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="text-slate-500 text-xs uppercase mb-1">Thermal Risk Score (TRS)</div>
                        <div className="text-3xl text-orange-400 font-bold">{result.scores.TRS}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="text-slate-500 text-xs uppercase mb-1">Moisture Risk Score (MRS)</div>
                        <div className="text-3xl text-cyan-400 font-bold">{result.scores.MRS}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="text-slate-500 text-xs uppercase mb-1">Tissue Breakdown Index (TBI)</div>
                        <div className="text-3xl text-purple-400 font-bold">{result.scores.TBI}</div>
                    </div>
                </div>

                <h3 className="text-slate-300 font-bold border-b border-slate-800 pb-2 mt-8">AVERAGED SENSOR RAW DATA</h3>
                <div className="grid grid-cols-3 gap-4">
                    {['Heel', 'Toe', 'Met', 'Mid'].map(zone => (
                        <div key={zone} className="bg-slate-900 border border-slate-800 rounded p-3 text-center">
                            <span className="text-slate-500 text-xs">{zone}: </span>
                            <span className="text-white font-bold">{result.pressures[zone.toLowerCase()]} kPa</span>
                        </div>
                    ))}
                    <div className="bg-slate-900 border border-slate-800 rounded p-3 text-center">
                        <span className="text-slate-500 text-xs">Temp: </span>
                        <span className="text-orange-400 font-bold">{result.temp}°C</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-3 text-center">
                        <span className="text-slate-500 text-xs">Hum: </span>
                        <span className="text-cyan-400 font-bold">{result.humidity}%</span>
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