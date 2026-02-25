
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for debugging
const supabaseUrl = "https://ntuumejquznibyskzjaq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dXVtZWpxdXpuaWJ5c2t6amFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODUwOTksImV4cCI6MjA4NTc2MTA5OX0.BQsVg84h6a_ZTQnzTiiLcw3tSBgrE7tD4uOTsYMJK0A";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking Supabase Data...");

    // 1. Check Teams
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('team_name, idea_id')
        .limit(5);

    if (teamsError) {
        console.error("Error fetching teams:", teamsError.message);
        return;
    }

    console.log(`Found ${teams.length} teams.`);
    if (teams.length === 0) {
        console.log("No teams found. Cannot check results.");
        return;
    }

    // 2. Check Idea Results
    console.log("Checking idea_results table...");
    const { data: results, error: resultsError } = await supabase
        .from('idea_results')
        .select('*')
        .limit(5);

    if (resultsError) {
        if (resultsError.code === '42P01' || resultsError.message.includes('Could not find the table')) {
            console.error("TABLE 'idea_results' DOES NOT EXIST! (Confirmed via error code used in app)");
        } else {
            console.error("Error fetching idea_results:", resultsError.message);
        }
    } else {
        console.log(`Found ${results.length} results in idea_results.`);
    }
}

checkData();
