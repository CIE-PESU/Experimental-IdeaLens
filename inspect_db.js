
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("--- FINAL INSPECTION ---");

    // First, let's just get ONE row from ai_evaluations to see columns
    const { data: aiData, error: aiError } = await supabase.from('ai_evaluations').select('*').limit(1);

    if (aiError) {
        console.log("ai_evaluations Error:", aiError.message);
    } else if (aiData && aiData.length > 0) {
        console.log("ai_evaluations Columns:", Object.keys(aiData[0]).join(', '));
        console.log("ai_evaluations Row:", JSON.stringify(aiData[0]));
    } else {
        console.log("ai_evaluations is EMPTY.");
    }

    // Now check teams column names
    const { data: teamData, error: teamError } = await supabase.from('teams').select('*').limit(1);
    if (teamData && teamData.length > 0) {
        console.log("teams Columns:", Object.keys(teamData[0]).join(', '));
    }

    // Check idea_results
    const { data: resData, error: resError } = await supabase.from('idea_results').select('*').limit(1);
    if (resData && resData.length > 0) {
        console.log("idea_results Columns:", Object.keys(resData[0]).join(', '));
    }
}

inspect().catch(e => console.log("CATCH:", e.message));
