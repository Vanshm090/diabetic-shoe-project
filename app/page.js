// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Clinical Color Palette for Heatmap ---
const getPressureColor = (value) => {
    if (value < 100) return "#10b981"; // Healthy Green
    if (value < 180) return "#3b82f6"; // Safe Blue
    if (value < 240) return "#f59e0b"; // Warning Amber
    return "#ef4444"; // Clinical Red
};

// --- COMPONENT: Clean Footmap ---
const FootMapZones = ({ pressures }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };

  return (
    <svg viewBox="0 0 100 240" className="w-full h-full max-h-80 mx-auto">
       <path 
         d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" 
         fill="#f8fafc" 
         stroke="#cbd5e1" 
         strokeWidth="2"
       />
       <circle cx="35" cy="40" r="18" fill={getPressureColor(p.toe)} className="opacity-80 blur-[6px] transition-colors duration-1000" />
       <circle cx="35" cy="90" r="16" fill={getPressureColor(p.met)} className="opacity-80 blur-[6px] transition-colors duration-1000" />
       <circle cx="50" cy="145" r="14" fill={getPressureColor(p.mid)} className="opacity-70 blur-[8px] transition-colors duration-1000" />
       <circle cx="50" cy="200" r="20" fill={getPressureColor(p.heel)} className="opacity-90 blur-[6px] transition-colors duration-1000" />
    </svg>
  );
};

// --- MAIN APP ---
export default function Home() {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  
  const [csvData, setCsvData] = useState("");
  const [fileName, setFileName] = useState("");

  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("System Ready");
  const [result, setResult] = useState(null);
  const [sessionID, setSessionID] = useState("---");

  useEffect(() => {
    // Generate a clean, hospital-style Patient ID format (e.g., PT-8492)
    setSessionID(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setCsvData(e.target.result);
      reader.readAsText(file);
    }
  };

  // --- LOGIC: Upload & Process Data ---
  useEffect(() => {
    if (step === 2) {
      setProgress(0);
      setScanMessage("Parsing Telemetry Log...");
      setResult(null); 

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
                if(data.error) {
                    alert("Error processing CSV: " + data.error);
                    setStep(1);
                }
                else { setResult(data); setStep(3); }
            });
            return 100;
          }
          if (old === 20) setScanMessage("Applying Z-Score Normalizations...");
          if (old === 50) setScanMessage("Running EWMA & CUSUM Filters...");
          if (old === 80) setScanMessage("Calculating Logistic Risk Model...");
          return old + 2; 
        });
      }, 80); 

      return () => clearInterval(interval);
    }
  }, [step]);


  // --- SCREEN 0: CLINICAL LANDING PAGE ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 text-slate-800">
        <div className="flex-grow flex flex-col items-center justify-center space-y-6 mt-10 w-full max-w-4xl text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm mb-4">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">SmartSole <span className="text-blue-600 font-medium">Clinical</span></h1>
            <p className="text-slate-500 text-lg max-w-xl">Advanced predictive analytics for Diabetic Foot Ulcer (DFU) detection using multi-parametric sensor arrays.</p>
            <button onClick={() => setStep(1)} className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all">Start Patient Assessment</button>
        </div>

        {/* Clean, professional footer */}
        <div className="w-full py-6 mt-12 border-t border-slate-200 flex flex-col items-center justify-center text-slate-500 text-sm">
            <p className="font-medium text-slate-700">Developed by Module Group</p>
            <p>Under the Guidance of Dr. JaiMala Gambhir • PEC Project Showcase</p>
        </div>
      </main>
    );
  }

  // --- SCREEN 1: INPUT & UPLOAD FILE ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-semibold text-slate-800">New Assessment</h2>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {sessionID}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Patient Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="e.g. 55" />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Biological Sex</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
          </div>

          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Telemetry Data Log</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer relative mb-8 bg-white group">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-slate-700 font-medium">{fileName ? fileName : "Select Device Log (.csv)"}</p>
              <p className="text-slate-400 text-xs mt-1 font-mono">Time, P1, P2, P3, P4, T, RH</p>
          </div>

          <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="w-1/3 py-3 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button disabled={!age || !csvData} onClick={() => setStep(2)} className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all">Process Algorithm</button>
          </div>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: PROCESSING ---
  if (step === 2) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
         <h2 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Patient Data</h2>
         <p className="text-slate-500 text-sm mb-6 h-6">{scanMessage}</p>
         <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full overflow-hidden">
             <div className="h-full bg-blue-600 transition-all duration-75" style={{width: `${progress}%`}}></div>
         </div>
      </main>
    );
  }

  // --- SCREEN 3: RESULTS (CLINICAL DASHBOARD) ---
  if (step === 3 && result) {
    const isRisk = result.status.includes("WARNING") || result.status.includes("CRITICAL");
    const statusBg = isRisk ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200";
    const statusText = isRisk ? "text-red-700" : "text-emerald-700";
    const badgeBg = isRisk ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800";

    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Report</h1>
               <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">Patient: {sessionID}</span>
                  <span>Age: {result.age}</span>
                  <span>Sex: {result.gender}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
               </div>
            </div>
            <button onClick={() => setStep(0)} className="mt-4 md:mt-0 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors shadow-sm">Start New Session</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Main Score & Heatmap */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Main Score Card */}
                <div className={`border rounded-2xl p-6 text-center shadow-sm ${statusBg}`}>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/50 shadow-sm bg-white/50 text-slate-800">
                        {result.riskLevel} RISK LEVEL
                    </div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">DFU Logistic Score</div>
                    <div className={`text-7xl font-black tracking-tighter mb-2 ${statusText}`}>{result.dfuScore}</div>
                    <div className={`font-semibold text-lg ${statusText}`}>{result.status}</div>
                </div>

                {/* Visual Heatmap Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-6 flex items-center justify-between">
                        Plantar Heatmap
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Avg Normalization</span>
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <FootMapZones pressures={result.pressures} />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Algorithmic Data */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Sub-Scores Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <h3 className="text-sm font-semibold text-slate-800">Algorithmic Risk Decomposition</h3>
                        <span className="text-xs text-slate-500">EWMA / CUSUM Applied</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PRS</div>
                            <div className="text-xs text-slate-600 mb-1">Pressure Risk</div>
                            <div className="text-2xl font-bold text-slate-800">{result.scores.PRS}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TRS</div>
                            <div className="text-xs text-slate-600 mb-1">Thermal Risk</div>
                            <div className="text-2xl font-bold text-slate-800">{result.scores.TRS}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">MRS</div>
                            <div className="text-xs text-slate-600 mb-1">Moisture Risk</div>
                            <div className="text-2xl font-bold text-slate-800">{result.scores.MRS}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TBI</div>
                            <div className="text-xs text-slate-600 mb-1">Tissue Breakdown</div>
                            <div className="text-2xl font-bold text-slate-800">{result.scores.TBI}</div>
                        </div>
                    </div>
                </div>

                {/* Raw Averages Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Aggregated Sensor Baselines</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {['Heel', 'Toe', 'Met', 'Mid'].map(zone => (
                            <div key={zone} className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <span className="text-sm font-medium text-slate-500">{zone} Pressure</span>
                                <span className="font-mono font-semibold text-slate-700">{result.pressures[zone.toLowerCase()]} <span className="text-xs text-slate-400">kPa</span></span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm font-medium text-slate-500">Skin Temp</span>
                            <span className="font-mono font-semibold text-slate-700">{result.temp} <span className="text-xs text-slate-400">°C</span></span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm font-medium text-slate-500">Surface Hum.</span>
                            <span className="font-mono font-semibold text-slate-700">{result.humidity} <span className="text-xs text-slate-400">%</span></span>
                        </div>
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