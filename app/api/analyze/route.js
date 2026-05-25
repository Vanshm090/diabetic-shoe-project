// app/api/analyze/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { age, gender, weight, leftCsvData, rightCsvData } = await request.json();
    
    // Default to 70kg if weight isn't provided to prevent NaN errors
    const w = parseFloat(weight) || 70; 

    // CLINICAL BASELINES (Personalized by Weight)
    // Adjusting expected normal baseline based on weight
    const MU_P = { toe: w * 1.5, met: w * 3.5, heel: w * 3.5, mid: w * 1.0 };
    const SIGMA_P = w * 1.0; 
    
    const MU_T = 31.0; const SIGMA_T = 1.5;
    const MU_RH = 60.0; const SIGMA_RH = 15.0;

    // HELPER: Robust CSV Parser
    const parseCSV = (csvData) => {
        const rows = csvData.trim().split('\n');
        let P1=[], P2=[], P3=[], P4=[], T=[], RH=[];
        
        for (let i = 0; i < rows.length; i++) {
            const line = rows[i].trim();
            // Skip empty lines or header rows
            if (!line || line.toLowerCase().includes('time') || line.toLowerCase().includes('p1')) continue;

            const parts = line.split(/[\s,]+/);
            if (parts.length >= 7) {
                // Multiplied by 100 to convert raw sensor float to kPa
                P1.push(parseFloat(parts[1]) * 100); // Toe
                P2.push(parseFloat(parts[2]) * 100); // Metatarsal
                P3.push(parseFloat(parts[3]) * 100); // Heel
                P4.push(parseFloat(parts[4]) * 100); // Midfoot
                T.push(parseFloat(parts[5]));        // Temp
                RH.push(parseFloat(parts[6]));       // Humidity
            }
        }
        return { P1, P2, P3, P4, T, RH, numSamples: T.length };
    };

    const leftData = parseCSV(leftCsvData);
    const rightData = parseCSV(rightCsvData);

    if (leftData.numSamples === 0 || rightData.numSamples === 0) throw new Error("Invalid CSV Data format.");

    // CALCULATE BILATERAL TEMPERATURE DIFFERENCE (Strongest predictor of DFU)
    const leftMeanT = leftData.T.reduce((a,b)=>a+b,0) / leftData.numSamples;
    const rightMeanT = rightData.T.reduce((a,b)=>a+b,0) / rightData.numSamples;
    const abs_deltaT = Math.abs(leftMeanT - rightMeanT);

    // HELPER: Core Algorithm Logic for each foot
    const analyzeFoot = (data, deltaT) => {
        const { P1, P2, P3, P4, T, RH, numSamples } = data;
        
        // Z-Score: Only penalize values ABOVE the personalized normal
        const calcZ = (val, mu, sigma) => Math.max(0, (val - mu) / sigma);

        let EWMA_P1=0, EWMA_P2=0, EWMA_P3=0, EWMA_P4=0;
        let EWMA_T=0, EWMA_RH=0;
        const lambda = 0.2; // Smoothing factor
        let duty_P = 0, duty_RH = 0;

        for (let i = 0; i < numSamples; i++) {
            EWMA_P1 = lambda * calcZ(P1[i], MU_P.toe, SIGMA_P) + (1-lambda)*EWMA_P1;
            EWMA_P2 = lambda * calcZ(P2[i], MU_P.met, SIGMA_P) + (1-lambda)*EWMA_P2;
            EWMA_P3 = lambda * calcZ(P3[i], MU_P.heel, SIGMA_P) + (1-lambda)*EWMA_P3;
            EWMA_P4 = lambda * calcZ(P4[i], MU_P.mid, SIGMA_P) + (1-lambda)*EWMA_P4;
            EWMA_T  = lambda * calcZ(T[i], MU_T, SIGMA_T) + (1-lambda)*EWMA_T;
            EWMA_RH = lambda * calcZ(RH[i], MU_RH, SIGMA_RH) + (1-lambda)*EWMA_RH;

            if ((P1[i]+P2[i]+P3[i]+P4[i])/4 > w*2.5) duty_P++;
            if (RH[i] > 75) duty_RH++;
        }

        const dutyCycleP = duty_P / numSamples;
        const dutyCycleRH = duty_RH / numSamples;
        const Z_deltaT = Math.max(0, (deltaT - 1.0) / 1.0); 

        // SUB-SCORES (With Resting Baselines applied via Math.max)
        let rawPRS = ((EWMA_P1+EWMA_P2+EWMA_P3+EWMA_P4) * 12) + (dutyCycleP * 40);
        let PRS = Math.min(100, Math.max(8.0, rawPRS)); // Floor at 8.0
        
        let rawTRS = (Z_deltaT * 40) + (EWMA_T * 20);
        let TRS = Math.min(100, Math.max(5.0, rawTRS)); // Floor at 5.0
        
        let rawMRS = (EWMA_RH * 25) + (dutyCycleRH * 50);
        let MRS = Math.min(100, Math.max(12.0, rawMRS)); // Floor at 12.0
        
        // TBI is a multiplicative risk of Pressure, Temp, and Moisture
        let rawTBI = (PRS * 0.4) + (TRS * 0.3) + (MRS * 0.3);
        let TBI = Math.min(100, Math.max(8.3, rawTBI));

        // FINAL DFU SCORE (0-100 linear map)
        let rawDFU = (0.4*PRS) + (0.3*TRS) + (0.2*MRS) + (0.1*TBI);
        let DFU_score = Math.round(Math.min(100, Math.max(11, rawDFU))); 

        let riskLevel = "LOW";
        if (DFU_score > 75) riskLevel = "HIGH";
        else if (DFU_score > 45 || deltaT > 2.2) riskLevel = "MODERATE";

        return {
            pressures: {
                toe: Math.round(P1.reduce((a,b)=>a+b,0)/numSamples),
                met: Math.round(P2.reduce((a,b)=>a+b,0)/numSamples),
                heel: Math.round(P3.reduce((a,b)=>a+b,0)/numSamples),
                mid: Math.round(P4.reduce((a,b)=>a+b,0)/numSamples),
            },
            temp: (T.reduce((a,b)=>a+b,0)/numSamples).toFixed(1),
            humidity: Math.round(RH.reduce((a,b)=>a+b,0)/numSamples),
            scores: { PRS: PRS.toFixed(1), TRS: TRS.toFixed(1), MRS: MRS.toFixed(1), TBI: TBI.toFixed(1) },
            dfuScore: DFU_score,
            riskLevel
        };
    };

    const leftResult = analyzeFoot(leftData, abs_deltaT);
    const rightResult = analyzeFoot(rightData, abs_deltaT);

    const maxScore = Math.max(leftResult.dfuScore, rightResult.dfuScore);
    let overallStatus = "Healthy Distribution";
    
    if (maxScore > 75) overallStatus = "CRITICAL ALERT";
    else if (maxScore > 45 || abs_deltaT > 2.2) overallStatus = "DFU WARNING";

    return NextResponse.json({
        age, gender, weight, abs_deltaT: abs_deltaT.toFixed(2), overallStatus,
        left: leftResult, right: rightResult
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}