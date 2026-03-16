// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Gentle Color Palette ---
const getPressureColor = (value) => {
    if (value < 100) return "#2dd4bf"; // Teal
    if (value < 180) return "#60a5fa"; // Blue
    if (value < 240) return "#fbbf24"; // Amber
    return "#f87171"; // Red
};

// --- COMPONENT: Footmap (Mirrors for Left Foot) ---
const FootMapZones = ({ pressures, isLeft }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };
  return (
    <svg viewBox="0 0 100 240" className={`w-full h-full max-h-80 mx-auto drop-shadow-sm ${isLeft ? 'scale-x-[-1]' : ''}`}>
       <path d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
       <circle cx="35" cy="40" r="18" fill={getPressureColor(p.toe)} className="opacity-80 blur-[6px] transition-colors" />
       <circle cx="35" cy="90" r="16" fill={getPressureColor(p.met)} className="opacity-80 blur-[6px] transition-colors" />
       <circle cx="50" cy="145" r="14" fill={getPressureColor(p.mid)} className="opacity-70 blur-[8px] transition-colors" />
       <circle cx="50" cy="200" r="20" fill={getPressureColor(p.heel)} className="opacity-90 blur-[6px] transition-colors" />
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
  const [scanMessage, setScanMessage] = useState("Preparing environment...");
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
          if (old === 30) setScanMessage("Calculating Bilateral Temp Difference (ΔT)...");
          if (old === 60) setScanMessage("Running EWMA on independent arrays...");
          return old + 1.5; 
        });
      }, 80); 
      return () => clearInterval(interval);
    }
  }, [step]);

  // --- COMPONENT: Trust Badge ---
  const InstitutionalBadge = () => (
    <div className="inline-flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-3xl shadow-sm mb-10 cursor-default">
       <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-black text-xs tracking-widest shadow-sm">PEC</div>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="text-sm font-black text-slate-800 tracking-widest uppercase">Made In PEC</span>
       </div>
       <div className="text-xs font-medium text-slate-500 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
          Module Group • Under the expert guidance of <span className="font-bold text-teal-700">Dr. Jai Mala Gambhir</span>
       </div>
    </div>
  );

  // --- SCREEN 0: LANDING ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="flex flex-col items-center justify-center w-full max-w-4xl text-center">
            <InstitutionalBadge />
            <div className="w-24 h-24 bg-gradient-to-tr from-teal-100 to-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center shadow-sm border border-white mb-8">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">Smart<span className="text-teal-500">Sole</span></h1>
            <p className="text-slate-500 text-xl max-w-2xl font-medium mb-12">Bilateral predictive care for Diabetic Foot Health. Upload both shoes for complete analysis.</p>
            <button onClick={() => setStep(1)} className="px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-full shadow-lg transition-all">Begin Bilateral Assessment</button>
        </div>
      </main>
    );
  }

  // --- SCREEN 1: DUAL UPLOAD ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-3xl bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm z-10">
          <div className="flex items-center justify-between mb-8">
              <div><h2 className="text-3xl font-extrabold text-slate-900">Patient Profile</h2><p className="text-slate-500 text-sm font-medium">Please enter details and upload both shoe logs.</p></div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl">ID: {sessionID}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 outline-none font-semibold" placeholder="e.g. 55" /></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Biological Sex</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 outline-none appearance-none font-semibold"><option value="Male">Male</option><option value="Female">Female</option></select></div>
          </div>

          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bilateral Sensor Logs</label>
          <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/30 cursor-pointer relative bg-slate-50">
                  <input type="file" accept=".csv,.txt" onChange={handleLeftUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-12 h-12 bg-white text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><span className="font-bold">L</span></div>
                  <p className="text-slate-800 font-bold">{leftName ? leftName : "Left Shoe Log"}</p>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-teal-50/30 cursor-pointer relative bg-slate-50">
                  <input type="file" accept=".csv,.txt" onChange={handleRightUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-12 h-12 bg-white text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><span className="font-bold">R</span></div>
                  <p className="text-slate-800 font-bold">{rightName ? rightName : "Right Shoe Log"}</p>
              </div>
          </div>

          <div className="flex gap-4">
              <button onClick={() => setStep(0)} className="w-1/3 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">Back</button>
              <button disabled={!age || !leftCsv || !rightCsv} onClick={() => setStep(2)} className="w-2/3 py-5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all">Start Bilateral Analysis</button>
          </div>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: LOADING ---
  if (step === 2) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
         <InstitutionalBadge />
         <div className="w-24 h-24 border-[5px] border-slate-100 border-t-teal-500 rounded-full animate-spin mb-10"></div>
         <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Reviewing Bilateral Data</h2>
         <p className="text-slate-500 font-medium mb-12 animate-pulse">{scanMessage}</p>
         <div className="w-full max-w-md bg-slate-200 h-3 rounded-full overflow-hidden mb-12"><div className="h-full bg-teal-500 transition-all" style={{width: `${progress}%`}}></div></div>
      </main>
    );
  }

  // --- SCREEN 3: BILATERAL DASHBOARD ---
  if (step === 3 && result) {
    const isRisk = result.overallStatus.includes("WARNING") || result.overallStatus.includes("CRITICAL");
    const statusBg = isRisk ? "bg-red-50 border-red-100 text-red-700" : "bg-teal-50 border-teal-100 text-teal-700";

    const FootCard = ({ title, data, isLeft }) => (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">{title}</h3>
            <div className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 ${data.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{data.riskLevel} Risk</div>
            
            <div className="h-64 w-full mb-8"><FootMapZones pressures={data.pressures} isLeft={isLeft} /></div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">DFU Score</div>
                    <div className="text-3xl font-black text-slate-800">{data.dfuScore}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Temp</div>
                    <div className="text-3xl font-black text-orange-500">{data.temp}°</div>
                </div>
            </div>
        </div>
    );

    return (
      <main className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 font-sans pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
               <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Bilateral Health Assessment</h1>
               <div className="flex gap-3 text-sm font-semibold text-slate-500 mt-4">
                  <span className="bg-white px-4 py-1.5 rounded-full shadow-sm">ID: {sessionID}</span>
                  <span className="bg-white px-4 py-1.5 rounded-full shadow-sm">ΔT: {result.abs_deltaT}°C</span>
               </div>
            </div>
            <button onClick={() => setStep(0)} className="px-8 py-4 bg-white border border-slate-200 hover:text-teal-700 font-bold rounded-2xl shadow-sm transition-all">New Patient</button>
          </div>

          <div className={`border-[3px] rounded-[2.5rem] p-8 text-center shadow-sm ${statusBg}`}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Overall Patient Status</div>
              <div className="font-black text-4xl tracking-tighter">{result.overallStatus}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FootCard title="Left Foot" data={result.left} isLeft={true} />
              <FootCard title="Right Foot" data={result.right} isLeft={false} />
          </div>

        </div>
      </main>
    );
  }
  return null;
}