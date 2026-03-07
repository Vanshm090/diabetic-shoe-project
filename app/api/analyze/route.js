// app/api/analyze/route.js
import { NextResponse } from 'next/server';

// Standard population baselines for Z-Score normalization
const MU = { P: 50, T: 31.0, RH: 50 };
const SIGMA = { P: 20, T: 1.5, RH: 15 };

export async function POST(request) {
  try {
    const body = await request.json();
    const { age, gender, csvData } = body;

    if (!csvData) {
        throw new Error("No sensor data provided");
    }

    // 1. BULLETPROOF BLUETOOTH PARSER (Handles Spaces + Commas)
    const rows = csvData.trim().split('\n');
    let P1_all=[], P2_all=[], P3_all=[], P4_all=[], T_all=[], RH_all=[];
    
    for (let i = 0; i < rows.length; i++) {
        const line = rows[i].trim();
        
        // Skip completely empty lines
        if (!line) continue; 
        
        // Skip headers if they accidentally exist
        if (line.toLowerCase().includes('time') || line.toLowerCase().includes('p1')) continue;

        // Splitting by EITHER Space or Comma
        const parts = line.split(/[\s,]+/);
        
        // parts[0] is Time
        // parts[1] to parts[4] are Pressures
        // parts[5] is Temp, parts[6] is Humidity
        if (parts.length >= 7) {
            // Multiply raw pressure by 100 to convert to scale (e.g. 2.140 -> 214)
            P1_all.push(parseFloat(parts[1]) * 100); 
            P2_all.push(parseFloat(parts[2]) * 100); 
            P3_all.push(parseFloat(parts[3]) * 100); 
            P4_all.push(parseFloat(parts[4]) * 100); 
            T_all.push(parseFloat(parts[5]));
            RH_all.push(parseFloat(parts[6]));
        }
    }

    const numSamples = T_all.length;
    if (numSamples === 0) throw new Error("Log file contains no valid data rows");

    // Helper: Calculate Z-Score
    const calcZ = (val, mu, sigma) => (val - mu) / sigma;

    // Initialize Algorithm Variables
    let EWMA_P1 = 0, EWMA_P2 = 0, EWMA_P3 = 0, EWMA_P4 = 0;
    let EWMA_T = 0, EWMA_RH = 0;
    let CUSUM_P1 = 0, CUSUM_P2 = 0, CUSUM_P3 = 0, CUSUM_P4 = 0;
    
    const lambda = 0.2;
    const k_cusum = 0.5;
    let highRHCount = 0;
    let duty_P1 = 0, duty_P2 = 0, duty_P3 = 0, duty_P4 = 0;
    let MAI_sum = 0;

    // 2. RUN TIME-SERIES ALGORITHMS (EWMA & CUSUM)
    for (let i = 0; i < numSamples; i++) {
        let zP1 = calcZ(P1_all[i], MU.P, SIGMA.P);
        let zP2 = calcZ(P2_all[i], MU.P, SIGMA.P);
        let zP3 = calcZ(P3_all[i], MU.P, SIGMA.P);
        let zP4 = calcZ(P4_all[i], MU.P, SIGMA.P);
        let zT = calcZ(T_all[i], MU.T, SIGMA.T);
        let zRH = calcZ(RH_all[i], MU.RH, SIGMA.RH);

        EWMA_P1 = lambda * zP1 + (1 - lambda) * EWMA_P1;
        EWMA_P2 = lambda * zP2 + (1 - lambda) * EWMA_P2;
        EWMA_P3 = lambda * zP3 + (1 - lambda) * EWMA_P3;
        EWMA_P4 = lambda * zP4 + (1 - lambda) * EWMA_P4;
        EWMA_T  = lambda * zT  + (1 - lambda) * EWMA_T;
        EWMA_RH = lambda * zRH + (1 - lambda) * EWMA_RH;

        CUSUM_P1 = Math.max(0, CUSUM_P1 + (zP1 - k_cusum));
        CUSUM_P2 = Math.max(0, CUSUM_P2 + (zP2 - k_cusum));
        CUSUM_P3 = Math.max(0, CUSUM_P3 + (zP3 - k_cusum));
        CUSUM_P4 = Math.max(0, CUSUM_P4 + (zP4 - k_cusum));

        if (P1_all[i] > 20) duty_P1++;
        if (P2_all[i] > 20) duty_P2++;
        if (P3_all[i] > 20) duty_P3++;
        if (P4_all[i] > 20) duty_P4++;
        if (RH_all[i] > 75) highRHCount++;
        MAI_sum += Math.max(0, RH_all[i] - 70);
    }

    duty_P1 /= numSamples; duty_P2 /= numSamples; duty_P3 /= numSamples; duty_P4 /= numSamples;
    const duty_RH = highRHCount / numSamples;
    
    const ROC_T = (T_all[numSamples - 1] - T_all[0]) / Math.max(1, (numSamples / 30)); 
    const abs_deltaT = Math.abs(T_all[numSamples - 1] - 31.0);
    const Z_deltaT = calcZ(abs_deltaT, 0, SIGMA.T);

    // 3. SUB-SCORE CALCULATIONS
    const calcPRS = (ewma, cusum, duty) => (0.4 * ewma) + (0.4 * cusum) + (0.2 * duty);
    const PRS_toe = calcPRS(EWMA_P1, CUSUM_P1, duty_P1);
    const PRS_met = calcPRS(EWMA_P2, CUSUM_P2, duty_P2);
    const PRS_mid = calcPRS(EWMA_P3, CUSUM_P3, duty_P3);
    const PRS_heel = calcPRS(EWMA_P4, CUSUM_P4, duty_P4);
    
    const PRS = (0.35 * PRS_met) + (0.30 * PRS_heel) + (0.20 * PRS_toe) + (0.15 * PRS_mid);

    let TRS = (0.5 * Math.abs(Z_deltaT)) + (0.3 * EWMA_T) + (0.2 * ROC_T);
    if (abs_deltaT > 2.2) TRS += 1; 

    let MRS = (0.5 * duty_RH) + (0.3 * EWMA_RH) + (0.2 * (MAI_sum / numSamples));
    if (duty_RH > 0.5) MRS += 1; 

    const ZP_mean = (EWMA_P1 + EWMA_P2 + EWMA_P3 + EWMA_P4) / 4;
    const TBI = ZP_mean * EWMA_T * EWMA_RH;

    // 4. FINAL DFU RISK INDEX
    const DFU_raw = (0.4 * PRS) + (0.25 * TRS) + (0.15 * MRS) + (0.2 * TBI);
    let DFU_score = 100 / (1 + Math.exp(-DFU_raw));
    DFU_score = Math.max(1, Math.min(99.9, DFU_score));

    let status = "Healthy";
    let riskLevel = "LOW";
    if (DFU_score > 85) { status = "CRITICAL ALERT"; riskLevel = "HIGH"; }
    else if (DFU_score > 70 || CUSUM_P4 > 5 || abs_deltaT > 2.2) { status = "DFU WARNING"; riskLevel = "MODERATE"; }

    const finalPressures = {
        toe: Math.round(P1_all.reduce((a,b)=>a+b,0)/numSamples),
        met: Math.round(P2_all.reduce((a,b)=>a+b,0)/numSamples),
        mid: Math.round(P3_all.reduce((a,b)=>a+b,0)/numSamples),
        heel: Math.round(P4_all.reduce((a,b)=>a+b,0)/numSamples),
    };

    return NextResponse.json({
        age, gender,
        pressures: finalPressures,
        temp: (T_all.reduce((a,b)=>a+b,0)/numSamples).toFixed(1),
        humidity: Math.round(RH_all.reduce((a,b)=>a+b,0)/numSamples),
        scores: {
            PRS: PRS.toFixed(2),
            TRS: TRS.toFixed(2),
            MRS: MRS.toFixed(2),
            TBI: TBI.toFixed(2)
        },
        dfuScore: DFU_score.toFixed(1),
        status,
        riskLevel
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}