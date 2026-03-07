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

  // Set ID and change Tip on every step change to avoid Hydration errors
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
    <div className="mt-8 p-5 bg-teal-50/80 border border-teal-100 rounded-2xl flex items-start gap-4 shadow-sm w-full max-w-lg mx-auto backdrop-blur-sm">
        <div className="text-teal-500 text-2xl mt-0.5">💡</div>
        <div className="text-left">
            <h4 className="text-teal-800 font-bold text-xs uppercase tracking-widest mb-1">Daily Care Tip</h4>
            <p className="text-teal-700 text-sm font-medium leading-relaxed">{currentTip}</p>
        </div>
    </div>
  );

  // --- COMPONENT: Academic Credit Footer ---
  const AcademicCredit = () => (
    <div className="w-full text-center space-y-1 my-6 text-slate-500">
        <p className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Made in PEC</p>
        <p className="text-xs">Under the Expert Guidance of <span className="font-semibold text-teal-700">Dr. Jai Mala Gambhir</span></p>
    </div>
  );


  // --- SCREEN 0: SOOTHING LANDING PAGE ---
  if (step === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-6 text-slate-800 font-sans selection:bg-teal-200">
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl text-center">
            
            <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-3xl flex items-center justify-center shadow-sm mb-6 transform hover:scale-105 transition-transform">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight mb-4">
                Smart<span className="text-teal-500">Sole</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-xl font-medium mb-10">
                Gentle, predictive care for Diabetic Foot Health. Early detection starts with a single step.
            </p>
            
            <button onClick={() => setStep(1)} className="px-10 py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-semibold rounded-2xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                Begin Health Assessment
            </button>

            <CareTip />
        </div>
        <AcademicCredit />
      </main>
    );
  }

  // --- SCREEN 1: INPUT & UPLOAD FILE ---
  if (step === 1) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-white border border-slate-100 p-8 rounded-3xl shadow-sm z-10">
          
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">Patient Profile</h2>
                  <p className="text-slate-500 text-sm mt-1">Please enter your details below.</p>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg">ID: {sessionID}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all" placeholder="e.g. 55" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Biological Sex</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sensor Data</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-teal-50/50 hover:border-teal-400 transition-colors cursor-pointer relative mb-8 bg-slate-50 group">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-14 h-14 bg-white shadow-sm text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-slate-700 font-semibold">{fileName ? fileName : "Upload SmartSole Log"}</p>
              <p className="text-slate-400 text-xs mt-2">.CSV format supported</p>
          </div>

          <div className="flex gap-4">
              <button onClick={() => setStep(0)} className="w-1/3 py-4 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors">Back</button>
              <button disabled={!age || !csvData} onClick={() => setStep(2)} className="w-2/3 py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-sm transition-all">Start Analysis</button>
          </div>
        </div>
        
        <div className="mt-4"><CareTip /></div>
      </main>
    );
  }

  // --- SCREEN 2: SOOTHING LOADING SCREEN ---
  if (step === 2) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
         <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md">
             <div className="w-20 h-20 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mb-8 shadow-sm"></div>
             <h2 className="text-2xl font-bold text-slate-800 mb-3">Reviewing Health Data</h2>
             <p className="text-slate-500 font-medium mb-10 h-6 animate-pulse">{scanMessage}</p>
             
             <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner mb-12">
                 <div className="h-full bg-teal-500 transition-all duration-75 ease-out" style={{width: `${progress}%`}}></div>
             </div>

             <CareTip />
         </div>
         <AcademicCredit />
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
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
               <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Your Health Report</h1>
               <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 mt-2">
                  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">ID: {sessionID}</span>
                  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Age: {result.age}</span>
                  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Date: {new Date().toLocaleDateString()}</span>
               </div>
            </div>
            <button onClick={() => setStep(0)} className="mt-6 md:mt-0 px-6 py-3 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 font-bold rounded-xl shadow-sm transition-all">Done</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Main Score & Heatmap */}
            <div className="lg:col-span-5 space-y-8">
                
                <div className={`border-2 rounded-3xl p-8 text-center shadow-sm ${statusBg}`}>
                    <div className="text-4xl mb-4">{statusIcon}</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Overall Wellness Score</div>
                    <div className={`text-7xl font-black tracking-tighter mb-4 ${statusText}`}>{result.dfuScore}</div>
                    <div className={`font-bold text-xl px-4 py-2 bg-white/60 rounded-xl inline-block ${statusText}`}>{result.status}</div>
                    {isRisk && <p className="text-red-600 text-sm mt-4 font-medium">Please consult with a healthcare professional regarding these results.</p>}
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Pressure Map</h3>
                    <div className="h-72 flex items-center justify-center">
                        <FootMapZones pressures={result.pressures} />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Algorithmic Data & Tips */}
            <div className="lg:col-span-7 space-y-8">
                
                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Care Metrics Breakdown</h3>
                        <p className="text-sm text-slate-500 mt-1">Calculated using our predictive EWMA algorithm.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pressure Index</div>
                            <div className="text-3xl font-black text-slate-700">{result.scores.PRS}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thermal Index</div>
                            <div className="text-3xl font-black text-slate-700">{result.scores.TRS}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Moisture Index</div>
                            <div className="text-3xl font-black text-slate-700">{result.scores.MRS}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tissue Integrity</div>
                            <div className="text-3xl font-black text-slate-700">{result.scores.TBI}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Average Sensor Readings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {['Heel', 'Toe', 'Met', 'Mid'].map(zone => (
                            <div key={zone} className="flex flex-col border-l-4 border-teal-200 pl-4 py-1">
                                <span className="text-sm font-bold text-slate-400 uppercase">{zone} Pressure</span>
                                <span className="font-bold text-slate-800 text-xl">{result.pressures[zone.toLowerCase()]} <span className="text-sm text-slate-400 font-medium">kPa</span></span>
                            </div>
                        ))}
                        <div className="flex flex-col border-l-4 border-orange-200 pl-4 py-1">
                            <span className="text-sm font-bold text-slate-400 uppercase">Skin Temp</span>
                            <span className="font-bold text-slate-800 text-xl">{result.temp} <span className="text-sm text-slate-400 font-medium">°C</span></span>
                        </div>
                        <div className="flex flex-col border-l-4 border-blue-200 pl-4 py-1">
                            <span className="text-sm font-bold text-slate-400 uppercase">Humidity</span>
                            <span className="font-bold text-slate-800 text-xl">{result.humidity} <span className="text-sm text-slate-400 font-medium">%</span></span>
                        </div>
                    </div>
                </div>

                <CareTip />

            </div>
          </div>
        </div>
      </main>
    );
  }
  return null;
}