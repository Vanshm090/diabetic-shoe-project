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
    <svg viewBox="0 0 100 240" className={`w-full h-full max-h-80 mx-auto drop-shadow-md transition-transform duration-700 hover:scale-105 ${isLeft ? 'scale-x-[-1]' : ''}`}>
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
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    if (step === 0) setSessionID(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
    
    const tips = [
      "Check your feet daily for cuts, redness, swelling, or nail problems.",
      "Wash your feet in warm (never hot) water and dry carefully, especially between the toes.",
      "Moisturize your feet daily to avoid dry, cracked skin, but skip the areas between your toes.",
      "Never walk barefoot. Always wear well-fitting shoes or slippers to protect your feet.",
      "Wear clean, dry socks without tight elastic bands or thick seams.",
      "Keep your blood sugar levels as close to your target range as possible."
    ];
    setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
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
          return old + 1; 
        });
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [step, age, gender, leftCsv, rightCsv]);

  // --- COMPONENT: Trust Badge ---
  const InstitutionalBadge = () => (
    <div className="inline-flex flex-col items-center justify-center p-5 bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 cursor-default relative overflow-hidden z-10 hover:scale-105 transition-transform duration-500 animate-fade-in-up">
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
          <div className="absolute inset-0 opacity-[0.04] animate-pan-bg" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-300/15 blur-[120px] mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-300/15 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-emerald-300/15 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>
  );

  return (
    <>
      {/* --- INJECT CUSTOM MEDICAL ANIMATIONS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
          50% { box-shadow: 0 0 25px 0 rgba(20, 184, 166, 0.6); }
        }
        @keyframes panBg {
          0% { background-position: 0px 0px; }
          100% { background-position: 64px 64px; }
        }
        
        .animate-blob { animation: blob 12s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }

        .animate-float { animation: float 5s ease-in-out infinite; }
        .hover-pulse-glow:hover { animation: pulseGlow 2s infinite; }
        .animate-pan-bg { animation: panBg 20s linear infinite; }

        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        .animate-scanner { animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes ecg { 0% { stroke-dashoffset: 400; } 100% { stroke-dashoffset: 0; } }
        .animate-ecg { stroke-dasharray: 400; animation: ecg 3s linear infinite; }
      `}} />

      <MedicalBackground />

      {/* --- SCREEN 0: ANIMATED LANDING --- */}
      {step === 0 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-slate-800 font-sans overflow-hidden">
          <div className="flex flex-col items-center justify-center w-full max-w-4xl text-center">
              
              <InstitutionalBadge />
              
              <div className="w-28 h-28 bg-white/90 backdrop-blur-sm text-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_40px_rgb(20,184,166,0.15)] border border-white mb-8 relative animate-float delay-100 animate-fade-in-up">
                 <div className="absolute inset-0 rounded-[2.5rem] border-2 border-teal-300 animate-ping opacity-30"></div>
                 <svg className="w-14 h-14 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-fade-in-up delay-200">
                  Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">Sole</span>
              </h1>
              
              <p className="text-slate-500 text-xl max-w-2xl font-medium mb-12 animate-fade-in-up delay-300 leading-relaxed">
                  Clinical predictive care for Diabetic Foot Ulcers (DFU). Upload bilateral telemetry for a complete diagnosis.
              </p>
              
              <button onClick={() => setStep(1)} className="px-12 py-5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-lg font-bold rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover-pulse-glow animate-fade-in-up delay-400 z-20">
                  Begin Diagnostics
              </button>

              <div className="animate-fade-in-up delay-500 mt-12 w-full">
                  <div className="p-5 bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl flex items-start gap-4 shadow-sm w-full max-w-lg mx-auto transform transition-all hover:scale-105">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 text-2xl flex-shrink-0 animate-pulse">💡</div>
                      <div className="text-left pt-1">
                          <h4 className="text-slate-800 font-bold text-xs uppercase tracking-widest mb-1">Daily Care Tip</h4>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">{currentTip}</p>
                      </div>
                  </div>
              </div>
          </div>
        </main>
      )}

      {/* --- SCREEN 1: DUAL UPLOAD (Animated) --- */}
      {step === 1 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 font-sans">
          <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-white/50 p-10 rounded-[2.5rem] shadow-[0_15px_50px_rgb(0,0,0,0.08)] z-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8 animate-fade-in-up delay-100">
                <div><h2 className="text-3xl font-extrabold text-slate-900">Patient Profile</h2><p className="text-slate-500 text-sm font-medium">Please enter details and upload both shoe logs.</p></div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                    ID: {sessionID}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8 animate-fade-in-up delay-200">
              <div className="group"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 group-hover:text-teal-500 transition-colors">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50/80 border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 outline-none font-semibold transition-all hover:bg-white" placeholder="e.g. 55" /></div>
              <div className="group"><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 group-hover:text-teal-500 transition-colors">Biological Sex</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50/80 border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 outline-none appearance-none font-semibold transition-all hover:bg-white"><option value="Male">Male</option><option value="Female">Female</option></select></div>
            </div>

            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 animate-fade-in-up delay-300">Bilateral Sensor Logs</label>
            <div className="grid grid-cols-2 gap-6 mb-10 animate-fade-in-up delay-300">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/50 hover:border-teal-400 transition-all cursor-pointer relative bg-slate-50/50 group overflow-hidden">
                    <input type="file" accept=".csv,.txt" onChange={handleLeftUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="absolute inset-0 bg-teal-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="w-14 h-14 bg-white border border-slate-100 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 group-hover:rotate-[-10deg] transition-all duration-300 relative z-10"><span className="font-bold text-xl">L</span></div>
                    <p className="text-slate-800 font-bold relative z-10">{leftName ? leftName : "Left Shoe Log"}</p>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/50 hover:border-teal-400 transition-all cursor-pointer relative bg-slate-50/50 group overflow-hidden">
                    <input type="file" accept=".csv,.txt" onChange={handleRightUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="absolute inset-0 bg-teal-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="w-14 h-14 bg-white border border-slate-100 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-300 relative z-10"><span className="font-bold text-xl">R</span></div>
                    <p className="text-slate-800 font-bold relative z-10">{rightName ? rightName : "Right Shoe Log"}</p>
                </div>
            </div>

            <div className="flex gap-4 animate-fade-in-up delay-400">
                <button onClick={() => setStep(0)} className="w-1/3 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all hover:scale-[1.02]">Cancel</button>
                <button disabled={!age || !leftCsv || !rightCsv} onClick={() => setStep(2)} className="w-2/3 py-5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] hover-pulse-glow">Execute Bilateral Scan</button>
            </div>
          </div>
        </main>
      )}

      {/* --- SCREEN 2: BIO-SCANNER LOADING --- */}
      {step === 2 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in-up">
           <InstitutionalBadge />
           <div className="relative w-32 h-40 mb-10 animate-float">
              <svg viewBox="0 0 100 240" className="w-full h-full opacity-20"><path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="#64748b" /></svg>
              <div className="absolute top-0 left-[-10%] w-[120%] h-1 bg-teal-400 shadow-[0_0_20px_#2dd4bf] animate-scanner"></div>
           </div>
           <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Processing Telemetry</h2>
           <p className="text-slate-500 font-medium mb-8 h-6 flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>{scanMessage}
           </p>
           <div className="w-full max-w-md relative mb-12">
               <svg viewBox="0 0 400 30" className="absolute top-[-30px] w-full h-8 opacity-40"><polyline points="0,15 50,15 60,5 70,25 80,15 150,15 160,5 170,25 180,15 400,15" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" className="animate-ecg" /></svg>
               <div className="w-full bg-white/60 backdrop-blur-sm border border-white p-1 rounded-full shadow-inner">
                   <div className="h-3 bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-200 ease-out rounded-full relative overflow-hidden" style={{width: `${progress}%`}}>
                       <div className="absolute inset-0 bg-white/20 w-full h-full animate-[panBg_2s_linear_infinite]" style={{backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3) 100%)', backgroundSize: '20px 20px'}}></div>
                   </div>
               </div>
           </div>
        </main>
      )}

      {/* --- SCREEN 3: DASHBOARD (Animated) --- */}
      {step === 3 && result && (
        <main className="min-h-screen relative z-10 text-slate-800 p-4 md:p-8 font-sans pb-20">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm animate-fade-in-up">
              <div>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Assessment</h1>
                 <div className="flex gap-3 text-sm font-semibold text-slate-500 mt-2">
                    <span className="bg-white/80 border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">ID: {sessionID}</span>
                    <span className="bg-white/80 border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">ΔT: {result.abs_deltaT}°C</span>
                 </div>
              </div>
              <button onClick={() => setStep(0)} className="px-8 py-4 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 font-bold rounded-2xl shadow-sm transition-all hover:shadow-md hover:scale-105">New Patient Session</button>
            </div>

            <div className={`border-[3px] rounded-[2.5rem] p-8 text-center shadow-[0_15px_40px_rgb(0,0,0,0.06)] bg-white/90 backdrop-blur-xl relative overflow-hidden transition-all duration-700 animate-fade-in-up delay-100 ${
                result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL") ? "border-red-200" : "border-teal-200"
            }`}>
                <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-gradient-to-tr from-transparent via-white/40 to-transparent rotate-45 pointer-events-none animate-[panBg_3s_linear_infinite]"></div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70 text-slate-500 relative z-10">System Diagnosis</div>
                <div className={`font-black text-5xl tracking-tighter relative z-10 ${
                    result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL") ? "text-red-600 animate-pulse" : "text-teal-600"
                }`}>
                    {result.overallStatus}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Foot Card */}
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up delay-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-slate-200 to-slate-100"></div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Left Foot</h3>
                    <div className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 shadow-sm ${result.left.riskLevel === 'HIGH' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{result.left.riskLevel} Risk</div>
                    <div className="h-64 w-full mb-8 relative"><FootMapZones pressures={result.left.pressures} isLeft={true} /></div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">DFU Logistic Score</div>
                            <div className="text-4xl font-black text-slate-800">{result.left.dfuScore}</div>
                        </div>
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 relative overflow-hidden transition-colors hover:bg-slate-100">
                            <div className="absolute top-[-10px] right-[-10px] p-2 opacity-10 text-6xl">🌡️</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 relative z-10">Skin Temp</div>
                            <div className="text-4xl font-black text-orange-500 relative z-10">{result.left.temp}°</div>
                        </div>
                    </div>
                </div>

                {/* Right Foot Card */}
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up delay-300">
                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-slate-200 to-slate-100"></div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Right Foot</h3>
                    <div className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 shadow-sm ${result.right.riskLevel === 'HIGH' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{result.right.riskLevel} Risk</div>
                    <div className="h-64 w-full mb-8 relative"><FootMapZones pressures={result.right.pressures} isLeft={false} /></div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">DFU Logistic Score</div>
                            <div className="text-4xl font-black text-slate-800">{result.right.dfuScore}</div>
                        </div>
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 relative overflow-hidden transition-colors hover:bg-slate-100">
                            <div className="absolute top-[-10px] right-[-10px] p-2 opacity-10 text-6xl">🌡️</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 relative z-10">Skin Temp</div>
                            <div className="text-4xl font-black text-orange-500 relative z-10">{result.right.temp}°</div>
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