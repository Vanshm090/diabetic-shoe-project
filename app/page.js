// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Gentle Color Palette ---
const getPressureColor = (value) => {
    if (value < 100) return "#2dd4bf"; // Teal (Healthy)
    if (value < 180) return "#60a5fa"; // Blue (Normal)
    if (value < 240) return "#fbbf24"; // Amber (Warning)
    return "#f87171"; // Red (Critical/Ulcer Risk)
};

// --- COMPONENT: Footmap with "Inflammation/Ulcer" Pulsing Effect ---
const FootMapZones = ({ pressures, isLeft }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };
  
  // Helper to render a zone with an optional throbbing inflammation aura if risk is high
  const renderZone = (cx, cy, r, value) => {
      const isCritical = value >= 240;
      return (
          <g>
              {isCritical && (
                  <circle cx={cx} cy={cy} r={r * 1.5} fill="#f87171" className="opacity-40 animate-ping blur-md origin-center" />
              )}
              <circle cx={cx} cy={cy} r={r} fill={getPressureColor(value)} className="opacity-85 blur-[4px] transition-colors duration-1000" />
          </g>
      );
  };

  return (
    <svg viewBox="0 0 100 240" className={`w-full h-full max-h-80 mx-auto drop-shadow-md ${isLeft ? 'scale-x-[-1]' : ''}`}>
       <path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
       {renderZone(35, 40, 18, p.toe)}
       {renderZone(35, 90, 16, p.met)}
       {renderZone(50, 145, 14, p.mid)}
       {renderZone(50, 200, 20, p.heel)}
    </svg>
  );
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  
  // DUAL FILES
  const [leftCsv, setLeftCsv] = useState("");
  const [leftName, setLeftName] = useState("");
  const [rightCsv, setRightCsv] = useState("");
  const [rightName, setRightName] = useState("");

  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("Initializing Bio-Sensors...");
  const [result, setResult] = useState(null);
  const [sessionID, setSessionID] = useState("---");

  useEffect(() => {
    if (step === 0) setSessionID(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [step]);

  const handleLeftUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeftName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setLeftCsv(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleRightUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRightName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setRightCsv(e.target.result);
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (step === 2) {
      setProgress(0);
      setScanMessage("Synchronizing Left and Right shoes...");
      setResult(null); 

      const fetchDataPromise = fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ age, gender, leftCsvData: leftCsv, rightCsvData: rightCsv }),
      }).then(res => res.json());

      const interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 100) {
            clearInterval(interval);
            fetchDataPromise.then(data => {
                if(data.error) { alert("Error: " + data.error); setStep(1); }
                else { setResult(data); setStep(3); }
            });
            return 100;
          }
          if (old === 25) setScanMessage("Isolating Plantar Pressure Spikes...");
          if (old === 50) setScanMessage("Calculating Bilateral Temp Difference (ΔT)...");
          if (old === 75) setScanMessage("Screening for Tissue Inflammation...");
          return old + 1; // Slower, dramatic loading
        });
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [step, age, gender, leftCsv, rightCsv]);

  // --- COMPONENT: Trust Badge ---
  const InstitutionalBadge = () => (
    <div className="inline-flex flex-col items-center justify-center p-5 bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 cursor-default relative overflow-hidden z-10">
       <div className="absolute inset-0 bg-gradient-to-tr from-teal-50/50 to-transparent z-0"></div>
       <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-black text-xs tracking-widest shadow-sm">PEC</div>
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="text-sm font-black text-slate-800 tracking-widest uppercase">Made In PEC</span>
       </div>
       <div className="text-xs font-medium text-slate-600 bg-white/80 px-5 py-2 rounded-full border border-slate-100 shadow-sm relative z-10">
          Module Group • Under the expert guidance of <span className="font-bold text-teal-700">Dr. Jai Mala Gambhir</span>
       </div>
    </div>
  );

  // --- COMPONENT: Medical Animated Background ---
  const MedicalBackground = () => (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#F8FAFC]">
          {/* Subtle clinical grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          {/* Animated Circulation Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-400/10 blur-[120px] mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-400/10 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-emerald-400/10 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>
  );

  return (
    <>
      {/* --- INJECT CUSTOM MEDICAL ANIMATIONS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        .animate-scanner { animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        @keyframes ecg {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-ecg { stroke-dasharray: 400; animation: ecg 3s linear infinite; }
      `}} />

      <MedicalBackground />

      {/* --- SCREEN 0: LANDING --- */}
      {step === 0 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
          <div className="flex flex-col items-center justify-center w-full max-w-4xl text-center">
              <InstitutionalBadge />
              <div className="w-24 h-24 bg-white text-teal-600 rounded-[2rem] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 mb-8 relative">
                 <div className="absolute inset-0 rounded-[2rem] border border-teal-200 animate-ping opacity-20"></div>
                 <svg className="w-12 h-12 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">Smart<span className="text-teal-500">Sole</span></h1>
              <p className="text-slate-500 text-xl max-w-2xl font-medium mb-12">Clinical predictive care for Diabetic Foot Ulcers (DFU). Upload bilateral telemetry for a complete diagnosis.</p>
              <button onClick={() => setStep(1)} className="px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:-translate-y-0.5">
                  Begin Diagnostics
              </button>
          </div>
        </main>
      )}

      {/* --- SCREEN 1: DUAL UPLOAD --- */}
      {step === 1 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 font-sans">
          <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-white/50 p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] z-10">
            <div className="flex items-center justify-between mb-8">
                <div><h2 className="text-3xl font-extrabold text-slate-900">Patient Profile</h2><p className="text-slate-500 text-sm font-medium">Please enter details and upload both shoe logs.</p></div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    ID: {sessionID}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 outline-none font-semibold transition-all" placeholder="e.g. 55" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Biological Sex</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 outline-none appearance-none font-semibold transition-all"><option value="Male">Male</option><option value="Female">Female</option></select></div>
            </div>

            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bilateral Sensor Logs</label>
            <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/30 hover:border-teal-300 transition-all cursor-pointer relative bg-slate-50/50 group">
                    <input type="file" accept=".csv,.txt" onChange={handleLeftUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-12 h-12 bg-white border border-slate-100 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><span className="font-bold">L</span></div>
                    <p className="text-slate-800 font-bold">{leftName ? leftName : "Left Shoe Log"}</p>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/30 hover:border-teal-300 transition-all cursor-pointer relative bg-slate-50/50 group">
                    <input type="file" accept=".csv,.txt" onChange={handleRightUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-12 h-12 bg-white border border-slate-100 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><span className="font-bold">R</span></div>
                    <p className="text-slate-800 font-bold">{rightName ? rightName : "Right Shoe Log"}</p>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => setStep(0)} className="w-1/3 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors">Cancel</button>
                <button disabled={!age || !leftCsv || !rightCsv} onClick={() => setStep(2)} className="w-2/3 py-5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-md transition-all">Execute Bilateral Scan</button>
            </div>
          </div>
        </main>
      )}

      {/* --- SCREEN 2: BIO-SCANNER LOADING --- */}
      {step === 2 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-center font-sans">
           <InstitutionalBadge />
           
           {/* Bio-Scanner Animation */}
           <div className="relative w-32 h-40 mb-10">
              <svg viewBox="0 0 100 240" className="w-full h-full opacity-20">
                 <path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="#64748b" />
              </svg>
              {/* Laser line */}
              <div className="absolute top-0 left-[-10%] w-[120%] h-1 bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-scanner"></div>
           </div>

           <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Processing Telemetry</h2>
           <p className="text-slate-500 font-medium mb-8 h-6 flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
              {scanMessage}
           </p>
           
           {/* ECG Progress Bar */}
           <div className="w-full max-w-md relative mb-12">
               <svg viewBox="0 0 400 30" className="absolute top-[-30px] w-full h-8 opacity-40">
                  <polyline points="0,15 50,15 60,5 70,25 80,15 150,15 160,5 170,25 180,15 400,15" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" className="animate-ecg" />
               </svg>
               <div className="w-full bg-white border border-slate-200 p-1 rounded-full shadow-inner">
                   <div className="h-3 bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-100 ease-linear rounded-full" style={{width: `${progress}%`}}></div>
               </div>
           </div>
        </main>
      )}

      {/* --- SCREEN 3: BILATERAL DASHBOARD --- */}
      {step === 3 && result && (
        <main className="min-h-screen relative z-10 text-slate-800 p-4 md:p-8 font-sans pb-20">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
              <div>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Assessment</h1>
                 <div className="flex gap-3 text-sm font-semibold text-slate-500 mt-2">
                    <span className="bg-white/80 border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">ID: {sessionID}</span>
                    <span className="bg-white/80 border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">ΔT: {result.abs_deltaT}°C</span>
                 </div>
              </div>
              <button onClick={() => setStep(0)} className="px-8 py-4 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 font-bold rounded-2xl shadow-sm transition-all hover:shadow-md">New Patient Session</button>
            </div>

            {/* Overall Status Banner */}
            <div className={`border-[3px] rounded-[2.5rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-md relative overflow-hidden ${
                result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL") ? "border-red-200" : "border-teal-200"
            }`}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70 text-slate-500">System Diagnosis</div>
                <div className={`font-black text-5xl tracking-tighter ${
                    result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL") ? "text-red-600 animate-pulse" : "text-teal-600"
                }`}>
                    {result.overallStatus}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Foot Card */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-slate-200"></div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">Left Foot</h3>
                    <div className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 ${result.left.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{result.left.riskLevel} Risk</div>
                    <div className="h-64 w-full mb-8 relative"><FootMapZones pressures={result.left.pressures} isLeft={true} /></div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">DFU Logistic Score</div>
                            <div className="text-4xl font-black text-slate-800">{result.left.dfuScore}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🌡️</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Skin Temp</div>
                            <div className="text-4xl font-black text-orange-500">{result.left.temp}°</div>
                        </div>
                    </div>
                </div>

                {/* Right Foot Card */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-slate-200"></div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2">Right Foot</h3>
                    <div className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 ${result.right.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{result.right.riskLevel} Risk</div>
                    <div className="h-64 w-full mb-8 relative"><FootMapZones pressures={result.right.pressures} isLeft={false} /></div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">DFU Logistic Score</div>
                            <div className="text-4xl font-black text-slate-800">{result.right.dfuScore}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">🌡️</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Skin Temp</div>
                            <div className="text-4xl font-black text-orange-500">{result.right.temp}°</div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </main>
      )}
    </>
  );
}