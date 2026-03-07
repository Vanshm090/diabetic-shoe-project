// app/page.js
"use client";
import { useState, useEffect } from "react";

// --- HELPER: Gentle Color Palette for Heatmap ---
const getPressureColor = (value) => {
    if (value < 100) return "#2dd4bf"; // Soft Teal (Healthy)
    if (value < 180) return "#60a5fa"; // Calm Blue
    if (value < 240) return "#fbbf24"; // Warm Amber
    return "#f87171"; // Soft Coral/Red (Risk)
};

// --- COMPONENT: Clean, Soft Footmap ---
const FootMapZones = ({ pressures }) => {
  const p = pressures || { heel: 100, toe: 100, met: 100, mid: 50 };

  return (
    <svg viewBox="0 0 100 240" className="w-full h-full max-h-80 mx-auto drop-shadow-sm">
       <path 
         d="M30,10 C10,30 0,70 10,110 C15,140 20,180 20,200 C20,220 35,235 50,235 C65,235 80,220 80,200 C80,180 85,140 90,110 C100,70 90,30 70,10 C60,0 40,0 30,10 Z" 
         fill="#f8fafc" 
         stroke="#e2e8f0" 
         strokeWidth="2"
       />
       <circle cx="35" cy="40" r="18" fill={getPressureColor(p.toe)} className="opacity-80 blur-[6px] transition-colors duration-1000" />
       <circle cx="35" cy="90" r="16" fill={getPressureColor(p.met)} className="opacity-80 blur-[6px] transition-colors duration-1000" />
       <circle cx="50" cy="145" r="14" fill={getPressureColor(p.mid)} className="opacity-70 blur-[8px] transition-colors duration-1000" />
       <circle cx="50" cy="200" r="20" fill={getPressureColor(p.heel)} className="opacity-90 blur-[6px] transition-colors duration-1000" />
    </svg>
  );
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  
  const [csvData, setCsvData] = useState("");
  const [fileName, setFileName] = useState("");

  const [progress, setProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState("Preparing environment...");
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
      setScanMessage("Reading sensor log...");
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
          if (old === 30) setScanMessage("Analyzing pressure distribution...");
          if (old === 60) setScanMessage("Checking thermal and moisture levels...");
          if (old === 85) setScanMessage("Finalizing care report...");
          return old + 1.5; 
        });
      }, 80); 

      return () => clearInterval(interval);
    }
  }, [step]);

  // --- COMPONENT: Tip of the Day ---
  const CareTip = () => (
    <div className="mt-10 p-5 bg-white border border-slate-100 rounded-3xl flex items-start gap-4 shadow-sm w-full max-w-lg mx-auto">
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 text-xl flex-shrink-0">💡</div>
        <div className="text-left pt-0.5">
            <h4 className="text-slate-800 font-bold text-xs uppercase tracking-widest mb-1">Daily Care Tip</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{currentTip}</p>
        </div>
    </div>
  );

  // --- COMPONENT: World-Class Trust Badge (Centered Credits) ---
  const InstitutionalBadge = () => (
    <div className="inline-flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-3xl shadow-sm mb-10 transition-all hover:shadow-md cursor-default">
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


  // --- SCREEN 0: ELEGANT LANDING PAGE ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-800 font-sans selection:bg-teal-200">
        <div className="flex flex-col items-center justify-center w-full max-w-4xl text-center">
            
            <InstitutionalBadge />
            
            <div className="w-24 h-24 bg-gradient-to-tr from-teal-100 to-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center shadow-sm border border-white mb-8">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
                Smart<span className="text-teal-500">Sole</span>
            </h1>
            <p className="text-slate-500 text-xl max-w-2xl font-medium mb-12 leading-relaxed">
                Gentle, predictive care for Diabetic Foot Health. Early detection starts with a single step.
            </p>
            
            <button onClick={() => setStep(1)} className="px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:shadow-teal-500/20 transition-all transform hover:-translate-y-0.5">
                Begin Health Assessment
            </button>

            <CareTip />
        </div>
      </main>
    );
  }

  // --- SCREEN 1: INPUT & UPLOAD FILE ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        
        <div className="w-full max-w-xl bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm z-10">
          
          <div className="flex items-center justify-between mb-10">
              <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Profile</h2>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Please enter the subject details.</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl shadow-sm">ID: {sessionID}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-slate-900 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 focus:outline-none transition-all font-semibold" placeholder="e.g. 55" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Biological Sex</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50 border border-slate-100 text-slate-900 p-5 rounded-2xl focus:ring-4 focus:ring-teal-50 focus:border-teal-400 focus:outline-none transition-all appearance-none cursor-pointer font-semibold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sensor Data Log</label>
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-teal-50/30 hover:border-teal-300 transition-all cursor-pointer relative mb-10 bg-slate-50 group">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-slate-800 font-bold text-lg">{fileName ? fileName : "Upload SmartSole Log"}</p>
              <p className="text-slate-400 text-sm mt-2 font-medium">.CSV format supported</p>
          </div>

          <div className="flex gap-4">
              <button onClick={() => setStep(0)} className="w-1/3 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors">Back</button>
              <button disabled={!age || !csvData} onClick={() => setStep(2)} className="w-2/3 py-5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-md transition-all">Start Analysis</button>
          </div>
        </div>
        
        <CareTip />
      </main>
    );
  }

  // --- SCREEN 2: SOOTHING LOADING SCREEN ---
  if (step === 2) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
         <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md">
             
             <InstitutionalBadge />

             <div className="w-24 h-24 border-[5px] border-slate-100 border-t-teal-500 rounded-full animate-spin mb-10 shadow-sm"></div>
             <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Reviewing Health Data</h2>
             <p className="text-slate-500 font-medium mb-12 h-6 animate-pulse">{scanMessage}</p>
             
             <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner mb-12">
                 <div className="h-full bg-teal-500 transition-all duration-75 ease-out rounded-full" style={{width: `${progress}%`}}></div>
             </div>

             <CareTip />
         </div>
      </main>
    );
  }

  // --- SCREEN 3: CARING RESULTS DASHBOARD ---
  if (step === 3 && result) {
    const isRisk = result.status.includes("WARNING") || result.status.includes("CRITICAL");
    const statusBg = isRisk ? "bg-red-50 border-red-100" : "bg-teal-50 border-teal-100";
    const statusText = isRisk ? "text-red-700" : "text-teal-700";
    const statusIcon = isRisk ? "⚠️" : "✨";

    return (
      <main className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 font-sans pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
               <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Health Assessment</h1>
               <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500 mt-4">
                  <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">ID: {sessionID}</span>
                  <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">Age: {result.age}</span>
                  <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">Date: {new Date().toLocaleDateString()}</span>
               </div>
            </div>
            <button onClick={() => setStep(0)} className="mt-6 md:mt-0 px-8 py-4 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 font-bold rounded-2xl shadow-sm transition-all">Done</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Main Score & Heatmap */}
            <div className="lg:col-span-5 space-y-8">
                
                <div className={`border-[3px] rounded-[2.5rem] p-10 text-center shadow-sm ${statusBg}`}>
                    <div className="text-5xl mb-6">{statusIcon}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Overall Wellness Score</div>
                    <div className={`text-8xl font-black tracking-tighter mb-6 ${statusText}`}>{result.dfuScore}</div>
                    <div className={`font-bold text-xl px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm inline-block ${statusText}`}>{result.status}</div>
                    {isRisk && <p className="text-red-600 text-sm mt-6 font-semibold bg-red-100/50 p-4 rounded-xl">Please consult with a healthcare professional regarding these results.</p>}
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                    <h3 className="text-xl font-extrabold text-slate-800 mb-8 text-center tracking-tight">Pressure Distribution Map</h3>
                    <div className="h-72 flex items-center justify-center">
                        <FootMapZones pressures={result.pressures} />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Algorithmic Data & Tips */}
            <div className="lg:col-span-7 space-y-8">
                
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                    <div className="mb-8 flex justify-between items-center border-b border-slate-100 pb-6">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Care Metrics Breakdown</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Calculated using EWMA predictive modeling.</p>
                        </div>
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold shadow-sm">PEC</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:scale-[1.02]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pressure Index</div>
                            <div className="text-4xl font-black text-slate-700">{result.scores.PRS}</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:scale-[1.02]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Thermal Index</div>
                            <div className="text-4xl font-black text-slate-700">{result.scores.TRS}</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:scale-[1.02]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Moisture Index</div>
                            <div className="text-4xl font-black text-slate-700">{result.scores.MRS}</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:scale-[1.02]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tissue Integrity</div>
                            <div className="text-4xl font-black text-slate-700">{result.scores.TBI}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                    <h3 className="text-xl font-extrabold text-slate-800 mb-8 tracking-tight">Average Sensor Readings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        {['Heel', 'Toe', 'Met', 'Mid'].map(zone => (
                            <div key={zone} className="flex flex-col border-l-4 border-teal-200 pl-5 py-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{zone} Pressure</span>
                                <span className="font-extrabold text-slate-800 text-2xl tracking-tight">{result.pressures[zone.toLowerCase()]} <span className="text-sm text-slate-400 font-medium">kPa</span></span>
                            </div>
                        ))}
                        <div className="flex flex-col border-l-4 border-orange-200 pl-5 py-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Skin Temp</span>
                            <span className="font-extrabold text-slate-800 text-2xl tracking-tight">{result.temp} <span className="text-sm text-slate-400 font-medium">°C</span></span>
                        </div>
                        <div className="flex flex-col border-l-4 border-blue-200 pl-5 py-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Humidity</span>
                            <span className="font-extrabold text-slate-800 text-2xl tracking-tight">{result.humidity} <span className="text-sm text-slate-400 font-medium">%</span></span>
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