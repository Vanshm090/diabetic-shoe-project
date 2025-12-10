// app/api/analyze/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { age, gender } = body;

  let status = "Healthy";
  let riskLevel = "Low";
  let ageMultiplier = 1.0;

  // AGE LOGIC: Older patients have higher baseline pressures and temperature variation
  if (age > 50) {
    ageMultiplier = 1.2 + (age - 50) / 100; // e.g., age 70 gets a 1.4x multiplier
  }

  // --- GENERATE 4-ZONE PRESSURE DATA (kPa) ---
  // Logic: Heel is highest, followed by Toe, then 1st Met Head, lowest at Midfoot.
  
  // Base values for a healthy young adult
  const baseHeel = 180 + Math.random() * 40; // Range: 180-220
  const baseToe = 150 + Math.random() * 30;  // Range: 150-180
  const baseMet = 120 + Math.random() * 30;  // Range: 120-150
  const baseMid = 40 + Math.random() * 20;   // Range: 40-60

  // Apply age multiplier and round numbers
  const p_heel = Math.round(baseHeel * ageMultiplier);
  const p_toe = Math.round(baseToe * ageMultiplier);
  const p_met = Math.round(baseMet * ageMultiplier);
  const p_mid = Math.round(baseMid * ageMultiplier);

  // Find the peak pressure for the main display
  const peakPressure = Math.max(p_heel, p_toe, p_met, p_mid);

  // --- GENERATE TEMP & HUMIDITY ---
  let baseTemp = 31.0;
  if (age > 50) baseTemp += 1.0;
  const temp = (baseTemp + Math.random() * 1.5).toFixed(1);
  
  // Older feet tend to be drier (lower humidity)
  const humidityBase = age > 55 ? 30 : 45;
  const humidity = humidityBase + Math.floor(Math.random() * 15);

  // --- DETERMINE RISK STATUS ---
  // Thresholds used to trigger "Risk" state for the demo
  const PRESSURE_RISK_THRESHOLD = 260; // If heel or toe exceeds this
  const TEMP_RISK_THRESHOLD = 33.5;    // Inflammation indicator

  if (p_heel > PRESSURE_RISK_THRESHOLD || p_toe > PRESSURE_RISK_THRESHOLD || temp > TEMP_RISK_THRESHOLD) {
      status = "Ulcer Risk Detected";
      riskLevel = "High";
  } else if (age > 65 && Math.random() > 0.5) {
      // Random risk for very old inputs just to show variation
      status = "Moderate Risk";
      riskLevel = "Medium";
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    age,
    gender,
    pressures: {
        heel: p_heel,
        toe: p_toe,
        met: p_met,
        mid: p_mid,
        peak: peakPressure
    },
    temp,
    humidity,
    status,
    riskLevel
  });
}