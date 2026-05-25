// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Gentle Color Palette ---
const getPressureColor = (value, weight) => {
    const w = weight || 70;
    if (value < w * 2.0) return "#2dd4bf"; // Teal (Healthy)
    if (value < w * 3.5) return "#60a5fa"; // Blue
    if (value < w * 5.0) return "#fbbf24"; // Amber
    return "#f87171"; // Red (Critical)
};

// --- COMPONENT: Detailed Info Tooltip ---
const InfoTooltip = ({ title, desc, optimal, danger }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative inline-block ml-2 z-50" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} onBlur={() => setIsOpen(false)} className="cursor-help w-5 h-5 rounded-full bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-black hover:bg-teal-500 hover:text-white transition-all shadow-sm focus:outline-none">i</button>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900/95 backdrop-blur-xl text-slate-200 text-xs rounded-2xl shadow-2xl transition-all duration-300 transform text-left border border-slate-700 pointer-events-none ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                <p className="font-black text-teal-400 mb-2 text-sm">{title}</p>
                <p className="mb-3 leading-relaxed text-slate-300">{desc}</p>
                <div className="space-y-1.5 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                    <p><span className="text-teal-400 font-bold uppercase tracking-wider text-[10px]">Optimal:</span> <br/>{optimal}</p>
                    <p><span className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Danger:</span> <br/>{danger}</p>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
            </div>
        </div>
    );
};

// --- COMPONENT: Footmap SVG Visualizer ---
const FootMapZones = ({ pressures, isLeft, weight }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };
  const w = weight || 70;
  
  const renderZone = (cx, cy, r, value) => {
      const isCritical = value >= (w * 5.0);
      return (
          <g>
              {isCritical && <circle cx={cx} cy={cy} r={r * 1.5} fill="#f87171" className="opacity-50 animate-ping blur-md origin-center" />}
              <circle cx={cx} cy={cy} r={r} fill={getPressureColor(value, w)} className="opacity-90 blur-[3px] transition-colors duration-1000 drop-shadow-md" />
          </g>
      );
  };

  return (
    <svg viewBox="0 0 100 240" className={`w-full h-full max-h-80 mx-auto drop-shadow-2xl transition-transform duration-700 hover:scale-105 ${isLeft ? 'scale-x-[-1]' : ''}`}>
       <path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
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
  const [weight, setWeight] = useState("");
  
  const [leftCsv, setLeftCsv] = useState("");
  const [leftName, setLeftName] = useState("");
  const [rightCsv, setRightCsv] = useState("");
  const [rightName, setRightName] = useState("");

  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("Initializing...");
  const [result, setResult] = useState(null);
  
  const [sessionID, setSessionID] = useState("---");
  const [currentDate, setCurrentDate] = useState("---");

  useEffect(() => {
    setSessionID(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  const handleLeftUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setLeftName(file.name); const reader = new FileReader(); reader.onload = (e) => setLeftCsv(e.target.result); reader.readAsText(file); }
  };

  const handleRightUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setRightName(file.name); const reader = new FileReader(); reader.onload = (e) => setRightCsv(e.target.result); reader.readAsText(file); }
  };

  // --- CSV GENERATOR: Instantly creates perfect 200-row test files ---
  const downloadTestFiles = (scenario) => {
      const generateData = (side, type) => {
          let rows = ["Time,P1_Toe,P2_Met,P3_Heel,P4_Mid,Temp,Hum"];
          let timeDate = new Date();
          timeDate.setHours(20, 45, 18, 0); // Start time

          for(let i=0; i<200; i++) {
              timeDate.setMilliseconds(timeDate.getMilliseconds() + 100); // 100ms intervals
              const t = timeDate.toISOString().substring(11, 23);
              let p1, p2, p3, p4, temp, hum;
              
              if (type === "healthy") {
                  p1 = (Math.random() * (1.1 - 0.8) + 0.8).toFixed(2);
                  p2 = (Math.random() * (1.4 - 1.2) + 1.2).toFixed(2);
                  p3 = (Math.random() * (1.5 - 1.3) + 1.3).toFixed(2);
                  p4 = (Math.random() * (0.5 - 0.3) + 0.3).toFixed(2);
                  temp = (Math.random() * (30.6 - 30.2) + 30.2).toFixed(1);
                  hum = (Math.random() * (45 - 40) + 40).toFixed(1);
              } else if (type === "critical" && side === "Left") {
                  // Massive ulcer forming on Left Foot
                  p1 = (Math.random() * (4.8 - 3.5) + 3.5).toFixed(2); 
                  p2 = (Math.random() * (4.5 - 3.8) + 3.8).toFixed(2); 
                  p3 = (Math.random() * (1.5 - 1.3) + 1.3).toFixed(2); 
                  p4 = (Math.random() * (0.5 - 0.3) + 0.3).toFixed(2); 
                  temp = (Math.random() * (35.8 - 35.0) + 35.0).toFixed(1); 
                  hum = (Math.random() * (92 - 85) + 85).toFixed(1); 
              } else if (type === "critical" && side === "Right") {
                  // Right foot healthy to create huge Thermal Variance
                  p1 = (Math.random() * (1.1 - 0.8) + 0.8).toFixed(2);
                  p2 = (Math.random() * (1.4 - 1.2) + 1.2).toFixed(2);
                  p3 = (Math.random() * (1.5 - 1.3) + 1.3).toFixed(2);
                  p4 = (Math.random() * (0.5 - 0.3) + 0.3).toFixed(2);
                  temp = (Math.random() * (30.6 - 30.2) + 30.2).toFixed(1); 
                  hum = (Math.random() * (45 - 40) + 40).toFixed(1);
              }
              rows.push(`${t}, ${p1}, ${p2}, ${p3}, ${p4}, ${temp}, ${hum}`);
          }
          return rows.join('\n');
      };

      const triggerDownload = (filename, content) => {
          const blob = new Blob([content], { type: 'text/csv' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
      };

      triggerDownload(`left_${scenario}.csv`, generateData("Left", scenario));
      setTimeout(() => { triggerDownload(`right_${scenario}.csv`, generateData("Right", scenario)); }, 500);
      
      // Auto-fill form for user convenience
      setWeight("70"); 
      setAge("45");
  };

  useEffect(() => {
    if (step === 2) {
      setProgress(0);
      setScanMessage("Synchronizing Telemetry Arrays...");
      setResult(null); 

      const fetchDataPromise = fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ age, gender, weight, leftCsvData: leftCsv, rightCsvData: rightCsv }),
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
          return old + 1.5; 
        });
      }, 80); 
      return () => clearInterval(interval);
    }
  }, [step, age, gender, weight, leftCsv, rightCsv]);

  const GlassBackground = () => (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <img src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=2070&auto=format&fit=crop" alt="Medical background" className="absolute inset-0 w-full h-full object-cover opacity-[0.35] mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/90 via-slate-50/90 to-blue-50/90 backdrop-blur-[40px]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-400/30 blur-[120px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 blur-[120px] animate-blob animation-delay-2000"></div>
      </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob { 0%, 100% { transform: translate(0px, 0px) scale(1); } 50% { transform: translate(20px, -30px) scale(1.05); } }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .glass-card { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.7); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05); }
        .glass-input { background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: inset 0 2px 10px 0 rgba(0, 0, 0, 0.03); }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanline { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(200px); opacity: 0; } }
        .animate-scanner { animation: scanline 2.5s ease-in-out infinite; }
      `}} />

      <GlassBackground />

      {/* --- SCREEN 0: LANDING --- */}
      {step === 0 && (
        <main className="min-h-screen relative z-10 flex items-center justify-center p-4 md:p-8 font-sans">
          <div className="max-w-7xl w-full grid grid-cols-1 gap-8 items-center text-center">
            <div className="flex flex-col items-center space-y-8 animate-fade-in z-10">
                <div className="glass-card px-5 py-2.5 rounded-full inline-flex items-center gap-3 shadow-sm border border-white/80">
                   <span className="w-7 h-7 bg-teal-600 text-white rounded-full flex items-center justify-center font-black text-[10px]">PEC</span>
                   <span className="text-xs font-black text-slate-800 tracking-widest uppercase">Made In PEC</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight drop-shadow-sm">
                    Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Sole</span><br/>System.
                </h1>
                <p className="text-slate-600 text-xl font-medium max-w-xl leading-relaxed">Advanced personalized telemetry and predictive algorithms for early-stage Diabetic Foot Ulcer detection.</p>
                <button onClick={() => setStep(1)} className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-all transform hover:-translate-y-1">Initiate Assessment &rarr;</button>
            </div>
          </div>
        </main>
      )}

      {/* --- SCREEN 1: DUAL UPLOAD & TEST GENERATOR --- */}
      {step === 1 && (
        <main className="min-h-screen relative z-10 flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-5xl glass-card p-8 md:p-12 rounded-[3rem] grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
            <div className="col-span-1 border-r border-slate-300/30 pr-0 lg:pr-8 flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Patient Profile</h2>
                    <p className="text-slate-600 text-sm font-medium mb-8">Enter subject demographic details to calculate a personalized biomechanical baseline.</p>
                    <div className="glass-input p-5 rounded-2xl mb-4 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Generated Session ID</p>
                        <p className="text-2xl font-mono font-black text-teal-600">{sessionID}</p>
                    </div>
                </div>

                {/* TEST SUITE GENERATOR */}
                <div className="mt-8 p-5 rounded-2xl bg-slate-800 text-white shadow-xl">
                    <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">🛠️ Engineering Test Suite</p>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => downloadTestFiles('healthy')} className="text-xs py-3 px-3 bg-slate-700 hover:bg-teal-500 rounded-lg font-bold transition-colors shadow-sm">Download Healthy Set (70kg)</button>
                        <button onClick={() => downloadTestFiles('critical')} className="text-xs py-3 px-3 bg-slate-700 hover:bg-red-500 rounded-lg font-bold transition-colors shadow-sm">Download Critical Set (70kg)</button>
                    </div>
                </div>
            </div>

            <div className="col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full glass-input text-slate-900 p-5 rounded-2xl outline-none font-bold text-lg" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Sex</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full glass-input text-slate-900 p-5 rounded-2xl outline-none font-bold text-lg"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full glass-input text-slate-900 p-5 rounded-2xl outline-none font-bold text-lg" /></div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Bilateral Telemetry Upload</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-input border-dashed border-2 hover:border-teal-400 rounded-3xl p-8 text-center cursor-pointer relative group transition-all hover:bg-white/80">
                            <input type="file" accept=".csv,.txt" onChange={handleLeftUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="w-14 h-14 bg-white/90 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><span className="font-black text-xl">L</span></div>
                            <p className="text-slate-800 font-bold">{leftName ? leftName : "Left Shoe Log"}</p>
                        </div>
                        <div className="glass-input border-dashed border-2 hover:border-teal-400 rounded-3xl p-8 text-center cursor-pointer relative group transition-all hover:bg-white/80">
                            <input type="file" accept=".csv,.txt" onChange={handleRightUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="w-14 h-14 bg-white/90 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><span className="font-black text-xl">R</span></div>
                            <p className="text-slate-800 font-bold">{rightName ? rightName : "Right Shoe Log"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={() => setStep(0)} className="px-8 py-5 text-slate-600 font-bold hover:bg-white/80 rounded-2xl transition-all">Cancel</button>
                    <button disabled={!age || !weight || !leftCsv || !rightCsv} onClick={() => setStep(2)} className="px-10 py-5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-xl transition-all">Execute Diagnostics &rarr;</button>
                </div>
            </div>
          </div>
        </main>
      )}

      {/* --- SCREEN 2: BIO-SCANNER --- */}
      {step === 2 && (
        <main className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in">
           <div className="glass-card p-12 rounded-[3rem] w-full max-w-lg flex flex-col items-center relative overflow-hidden mt-4 shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-t from-teal-400/20 to-transparent animate-[pulse_2s_infinite]"></div>
               <div className="relative w-32 h-40 mb-8 z-10">
                  <svg viewBox="0 0 100 240" className="w-full h-full opacity-40 drop-shadow-xl"><path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="#334155" /></svg>
                  <div className="absolute top-0 left-[-10%] w-[120%] h-1 bg-teal-400 shadow-[0_0_20px_#2dd4bf] animate-scanner"></div>
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">Processing Telemetry</h2>
               <p className="text-slate-600 font-bold mb-10 h-6 relative z-10">{scanMessage}</p>
               <div className="w-full bg-white/70 border border-white p-1 rounded-full shadow-inner relative z-10">
                   <div className="h-3 bg-teal-500 rounded-full transition-all duration-200" style={{width: `${progress}%`}}></div>
               </div>
           </div>
        </main>
      )}

      {/* --- SCREEN 3: DASHBOARD --- */}
      {step === 3 && result && (
        <main className="min-h-screen relative z-10 text-slate-800 p-4 md:p-8 font-sans pb-20 animate-fade-in">
          <div className="max-w-[1400px] mx-auto">
            <div className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center mb-8 shadow-md">
              <div className="flex items-center gap-5">
                 <div className="sm:-mt-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Assessment</h1>
                    <p className="text-sm font-bold text-slate-600">Subject: {sessionID} • Weight: {result.weight}kg • Date: {currentDate}</p>
                 </div>
              </div>
              <button onClick={() => setStep(0)} className="mt-4 md:mt-0 px-8 py-4 bg-white/90 hover:bg-white text-slate-800 font-black rounded-2xl shadow-sm transition-all border border-slate-200">Close Session</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Overall Status Bar */}
              <div className="lg:col-span-12 glass-card rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between overflow-hidden relative border-l-8 border-l-teal-500 shadow-xl">
                  <div className="relative z-10">
                      <div className="flex items-center mb-2">
                          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Bilateral Diagnosis</p>
                          <InfoTooltip title="Bilateral Diagnosis" desc="Overall prediction based on the worst-performing foot." optimal="Healthy Distribution" danger="DFU WARNING or CRITICAL ALERT" />
                      </div>
                      <h2 className={`text-6xl font-black tracking-tighter ${result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL") ? "text-red-600" : "text-slate-900"}`}>{result.overallStatus}</h2>
                  </div>
                  <div className="mt-6 md:mt-0 text-center md:text-right relative z-10">
                      <div className="flex items-center justify-end mb-1">
                          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Thermal Variance (ΔT)</p>
                          <InfoTooltip title="Thermal Variance (ΔT)" desc="Difference in average temp between feet." optimal="0.0°C to 1.0°C" danger="> 2.2°C" />
                      </div>
                      <p className={`text-5xl font-black drop-shadow-sm ${parseFloat(result.abs_deltaT) > 2.2 ? 'text-red-600' : 'text-orange-500'}`}>{result.abs_deltaT}°C</p>
                  </div>
              </div>

              {/* Left Foot Panel */}
              <div className={`lg:col-span-6 glass-card rounded-[3rem] p-8 flex flex-col items-center relative transition-transform shadow-xl ${result.left.riskLevel === 'HIGH' ? 'border-2 border-red-500/50 bg-red-50/30' : ''}`}>
                  <div className="w-full flex justify-between items-center mb-8 border-b border-slate-300/40 pb-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Left Foot</h3>
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${result.left.riskLevel === 'HIGH' ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200'}`}>{result.left.riskLevel} Risk</span>
                  </div>
                  <div className="h-72 w-full mb-8"><FootMapZones pressures={result.left.pressures} isLeft={true} weight={result.weight} /></div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="glass-input p-6 rounded-3xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">DFU Model Score</p>
                          <p className={`text-5xl font-black ${result.left.dfuScore > 75 ? 'text-red-600' : 'text-slate-900'}`}>{result.left.dfuScore}</p>
                      </div>
                      <div className="glass-input p-6 rounded-3xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Skin Temp</p>
                          <p className="text-5xl font-black text-orange-500">{result.left.temp}°</p>
                      </div>
                      <div className="glass-input p-5 rounded-2xl col-span-2 flex justify-between items-center">
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pressure (PRS)</p><p className="text-2xl font-black text-blue-600">{result.left.scores.PRS}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tissue (TBI)</p><p className="text-2xl font-black text-purple-600">{result.left.scores.TBI}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Moisture (MRS)</p><p className="text-2xl font-black text-teal-600">{result.left.scores.MRS}</p></div>
                      </div>
                  </div>
              </div>

              {/* Right Foot Panel */}
              <div className={`lg:col-span-6 glass-card rounded-[3rem] p-8 flex flex-col items-center relative transition-transform shadow-xl ${result.right.riskLevel === 'HIGH' ? 'border-2 border-red-500/50 bg-red-50/30' : ''}`}>
                  <div className="w-full flex justify-between items-center mb-8 border-b border-slate-300/40 pb-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Right Foot</h3>
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${result.right.riskLevel === 'HIGH' ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200'}`}>{result.right.riskLevel} Risk</span>
                  </div>
                  <div className="h-72 w-full mb-8"><FootMapZones pressures={result.right.pressures} isLeft={false} weight={result.weight} /></div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="glass-input p-6 rounded-3xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">DFU Model Score</p>
                          <p className={`text-5xl font-black ${result.right.dfuScore > 75 ? 'text-red-600' : 'text-slate-900'}`}>{result.right.dfuScore}</p>
                      </div>
                      <div className="glass-input p-6 rounded-3xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Skin Temp</p>
                          <p className="text-5xl font-black text-orange-500">{result.right.temp}°</p>
                      </div>
                      <div className="glass-input p-5 rounded-2xl col-span-2 flex justify-between items-center">
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pressure (PRS)</p><p className="text-2xl font-black text-blue-600">{result.right.scores.PRS}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tissue (TBI)</p><p className="text-2xl font-black text-purple-600">{result.right.scores.TBI}</p></div>
                          <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Moisture (MRS)</p><p className="text-2xl font-black text-teal-600">{result.right.scores.MRS}</p></div>
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