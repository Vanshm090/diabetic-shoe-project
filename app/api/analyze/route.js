// app/api/analyze/route.js
import { NextResponse } from 'next/server';

const MU = { P: 50, T: 31.0, RH: 50 };
const SIGMA = { P: 20, T: 1.5, RH: 15 };

// HELPER: Robust Bluetooth CSV Parser
const parseCSV = (csvData) => {
    const rows = csvData.trim().split('\n');
    let P1=[], P2=[], P3=[], P4=[], T=[], RH=[];
    
    for (let i = 0; i < rows.length; i++) {
        const line = rows[i].trim();
        if (!line) continue; 
        if (line.toLowerCase().includes('time') || line.toLowerCase().includes('p1')) continue;

        const parts = line.split(/[\s,]+/);
        if (parts.length >= 7) {
            P1.push(parseFloat(parts[1]) * 100); 
            P2.push(parseFloat(parts[2]) * 100); 
            P3.push(parseFloat(parts[3]) * 100); 
            P4.push(parseFloat(parts[4]) * 100); 
            T.push(parseFloat(parts[5]));
            RH.push(parseFloat(parts[6]));
        }
    }
    return { P1, P2, P3, P4, T, RH, numSamples: T.length };
};

// HELPER: Run the Core Algorithm for One Foot
const analyzeFoot = (data, abs_deltaT) => {
    const { P1, P2, P3, P4, T, RH, numSamples } = data;
    const calcZ = (val, mu, sigma) => (val - mu) / sigma;
    const Z_deltaT = calcZ(abs_deltaT, 0, SIGMA.T);

    let EWMA_P1 = 0, EWMA_P2 = 0, EWMA_P3 = 0, EWMA_P4 = 0;
    let EWMA_T = 0, EWMA_RH = 0;
    let CUSUM_P1 = 0, CUSUM_P2 = 0, CUSUM_P3 = 0, CUSUM_P4 = 0;
    
    const lambda = 0.2;
    const k_cusum = 0.5;
    let highRHCount = 0;
    let duty_P1 = 0, duty_P2 = 0, duty_P3 = 0, duty_P4 = 0;
    let MAI_sum = 0;

    for (let i = 0; i < numSamples; i++) {
        let zP1 = calcZ(P1[i], MU.P, SIGMA.P);
        let zP2 = calcZ(P2[i], MU.P, SIGMA.P);
        let zP3 = calcZ(P3[i], MU.P, SIGMA.P);
        let zP4 = calcZ(P4[i], MU.P, SIGMA.P);
        let zT = calcZ(T[i], MU.T, SIGMA.T);
        let zRH = calcZ(RH[i], MU.RH, SIGMA.RH);

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

        if (P1[i] > 20) duty_P1++;
        if (P2[i] > 20) duty_P2++;
        if (P3[i] > 20) duty_P3++;
        if (P4[i] > 20) duty_P4++;
        if (RH[i] > 75) highRHCount++;
        MAI_sum += Math.max(0, RH[i] - 70);
    }

    duty_P1 /= numSamples; duty_P2 /= numSamples; duty_P3 /= numSamples; duty_P4 /= numSamples;
    const duty_RH = highRHCount / numSamples;
    const ROC_T = (T[numSamples - 1] - T[0]) / Math.max(1, (numSamples / 30)); 

    // (A) Pressure Risk Score
    const calcPRS = (ewma, cusum, duty) => (0.4 * ewma) + (0.4 * cusum) + (0.2 * duty);
    const PRS = (0.35 * calcPRS(EWMA_P2, CUSUM_P2, duty_P2)) + 
                (0.30 * calcPRS(EWMA_P4, CUSUM_P4, duty_P4)) + 
                (0.20 * calcPRS(EWMA_P1, CUSUM_P1, duty_P1)) + 
                (0.15 * calcPRS(EWMA_P3, CUSUM_P3, duty_P3));

    // (B) Thermal Risk Score (Using Bilateral Delta T)
    let TRS = (0.5 * Math.abs(Z_deltaT)) + (0.3 * EWMA_T) + (0.2 * ROC_T);
    if (abs_deltaT > 2.2) TRS += 1; 

    // (C) Moisture Risk Score
    let MRS = (0.5 * duty_RH) + (0.3 * EWMA_RH) + (0.2 * (MAI_sum / numSamples));
    if (duty_RH > 0.5) MRS += 1; 

    // (D) Tissue Breakdown Index
    const ZP_mean = (EWMA_P1 + EWMA_P2 + EWMA_P3 + EWMA_P4) / 4;
    const TBI = ZP_mean * EWMA_T * EWMA_RH;

    const DFU_raw = (0.4 * PRS) + (0.25 * TRS) + (0.15 * MRS) + (0.2 * TBI);
    let DFU_score = 100 / (1 + Math.exp(-DFU_raw));
    DFU_score = Math.max(1, Math.min(99.9, DFU_score));

    let riskLevel = "LOW";
    if (DFU_score > 85) riskLevel = "HIGH";
    else if (DFU_score > 70 || CUSUM_P4 > 5 || abs_deltaT > 2.2) riskLevel = "MODERATE";

    return {
        pressures: {
            toe: Math.round(P1.reduce((a,b)=>a+b,0)/numSamples),
            met: Math.round(P2.reduce((a,b)=>a+b,0)/numSamples),
            mid: Math.round(P3.reduce((a,b)=>a+b,0)/numSamples),
            heel: Math.round(P4.reduce((a,b)=>a+b,0)/numSamples),
        },
        temp: (T.reduce((a,b)=>a+b,0)/numSamples).toFixed(1),
        humidity: Math.round(RH.reduce((a,b)=>a+b,0)/numSamples),
        scores: { PRS: PRS.toFixed(2), TRS: TRS.toFixed(2), MRS: MRS.toFixed(2), TBI: TBI.toFixed(2) },
        dfuScore: DFU_score.toFixed(1),
        riskLevel
    };
};

export async function POST(request) {
  try {
    const { age, gender, leftCsvData, rightCsvData } = await request.json();

    if (!leftCsvData || !rightCsvData) throw new Error("Both Left and Right shoe data logs are required.");

    const leftData = parseCSV(leftCsvData);
    const rightData = parseCSV(rightCsvData);

    if (leftData.numSamples === 0 || rightData.numSamples === 0) throw new Error("Invalid CSV Data.");

    // CALCULATE BILATERAL TEMPERATURE DIFFERENCE
    const leftMeanT = leftData.T.reduce((a,b)=>a+b,0) / leftData.numSamples;
    const rightMeanT = rightData.T.reduce((a,b)=>a+b,0) / rightData.numSamples;
    const abs_deltaT = Math.abs(leftMeanT - rightMeanT);

    // Run independent algorithms, sharing the delta_T
    const leftResult = analyzeFoot(leftData, abs_deltaT);
    const rightResult = analyzeFoot(rightData, abs_deltaT);

    // Overall Status
    const maxScore = Math.max(parseFloat(leftResult.dfuScore), parseFloat(rightResult.dfuScore));
    let overallStatus = "Healthy Distribution";
    if (maxScore > 85) overallStatus = "CRITICAL ALERT";
    else if (maxScore > 70 || abs_deltaT > 2.2) overallStatus = "DFU WARNING";

    return NextResponse.json({
        age, gender, abs_deltaT: abs_deltaT.toFixed(2), overallStatus,
        left: leftResult, right: rightResult
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}