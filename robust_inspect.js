
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
    let output = "";
    
    const tables = ['ai_evaluations', 'human_evaluations', 'idealens_submissions2', 'idea_submissions', 'teams'];
    
    for (const table of tables) {
        output += `--- Table: ${table} ---\n`;
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                output += `Error: ${error.message}\n`;
                if (error.details) output += `Details: ${error.details}\n`;
                if (error.hint) output += `Hint: ${error.hint}\n`;
            } else if (data && data.length > 0) {
                output += `Status: FOUND DATA\n`;
                output += `Columns: ${Object.keys(data[0]).join(', ')}\n`;
                output += `Sample: ${JSON.stringify(data[0])}\n`;
            } else {
                output += `Status: EMPTY\n`;
            }
        } catch (e) {
            output += `Exception: ${e.message}\n`;
        }
        output += "\n";
    }
    
    fs.writeFileSync('inspection_output.txt', output);
    console.log("Inspection complete. Results in inspection_output.txt");
}

inspect().catch(e => {
    fs.writeFileSync('inspection_output.txt', "FATAL ERROR: " + e.message);
    console.log("CATCH:", e.message);
});
