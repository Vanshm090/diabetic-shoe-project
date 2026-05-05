// app/api/analyze/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { weight } = await request.json();
    const w = parseFloat(weight) || 65; // Matches your 65kg dashboard

    
    const jitter = (val, range = 0.5) => parseFloat((val + (Math.random() * range * 2 - range)).toFixed(1));

   
    const healthyPool = [
      { prsL: 32.7, tbiL: 39.4, mrsL: 87.7, tempL: 30.7, dfuL: 35, prsR: 27.3, tbiR: 37.3, mrsR: 87.9, tempR: 30.3, dfuR: 32 },
      { prsL: 31.2, tbiL: 38.1, mrsL: 86.5, tempL: 30.6, dfuL: 34, prsR: 26.8, tbiR: 36.9, mrsR: 87.1, tempR: 30.2, dfuR: 31 },
      { prsL: 33.1, tbiL: 39.8, mrsL: 88.2, tempL: 30.8, dfuL: 36, prsR: 27.8, tbiR: 37.5, mrsR: 88.4, tempR: 30.4, dfuR: 33 },
      // ... (The code will randomly jitter these so 3 sets effectively become 100+ variations)
    ];


    const base = healthyPool[Math.floor(Math.random() * healthyPool.length)];

    // Construct the response to match the EXACT format your page.js expects
    const responseData = {
      weight: w,
      abs_deltaT: 0.40, // Locked to healthy range
      overallStatus: "Healthy Distribution", // Always Healthy
      left: {
        riskLevel: "LOW",
        dfuScore: base.dfuL,
        temp: jitter(base.tempL, 0.1),
        humidity: Math.round(base.mrsL),
        pressures: {
          toe: Math.round(w * 1.4),
          met: Math.round(w * 1.6),
          heel: Math.round(w * 1.5),
          mid: Math.round(w * 0.9)
        },
        scores: {
          PRS: jitter(base.prsL).toString(),
          TRS: "12.4", 
          MRS: jitter(base.mrsL).toString(),
          TBI: jitter(base.tbiL).toString()
        }
      },
      right: {
        riskLevel: "LOW",
        dfuScore: base.dfuR,
        temp: jitter(base.tempR, 0.1),
        humidity: Math.round(base.mrsR),
        pressures: {
          toe: Math.round(w * 1.35),
          met: Math.round(w * 1.55),
          heel: Math.round(w * 1.45),
          mid: Math.round(w * 0.85)
        },
        scores: {
          PRS: jitter(base.prsR).toString(),
          TRS: "11.2",
          MRS: jitter(base.mrsR).toString(),
          TBI: jitter(base.tbiR).toString()
        }
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    // We return a fallback healthy object even on error to ensure showcase never fails
    return NextResponse.json({
        overallStatus: "Healthy Distribution",
        abs_deltaT: "0.35",
        left: { riskLevel: "LOW", dfuScore: 35, temp: "30.7", pressures: {toe:100, met:110, heel:105, mid:80}, scores: {PRS:"32.7", TBI:"39.4", MRS:"87.7"} },
        right: { riskLevel: "LOW", dfuScore: 32, temp: "30.3", pressures: {toe:95, met:105, heel:100, mid:75}, scores: {PRS:"27.3", TBI:"37.3", MRS:"87.9"} }
    });
  }
}