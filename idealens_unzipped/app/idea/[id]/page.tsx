"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type TeamRow = {
    idea_id: string; // Still needed for routing/linking
    team_name: string; // PK now
    problem_title: string | null;
    problem_statement: string | null;
    team_size: number | null;
    team_members: string[] | null;
    team_roles: string[] | null;
    contact_email: string | null;
    // Mapped fields from your request
    proposed_solution: string | null;
    target_users: string[] | null;
    innovation_highlights: string[] | null;
    tech_stack: string[] | null;
    business_model: string | null;
    market_insight: string | null;
};

type ResultRow = {
    idea_id: string;
    summary: string | null;
    desirability_score: number | null;
    feasibility_score: number | null;
    viability_score: number | null;
    weighted_dfv: number | null;
    insights: string | null;
    transaction_details: any | null;
    created_at: string;
};

// Update Type Definition
type JuryScoreRow = {
    id: number;
    team_name: string; // Changed from idea_id
    desirability: number;
    feasibility: number;
    viability: number;
    presentation: number;
    created_at: string;
};

export default function IdeaPage() {
    const params = useParams();
    const router = useRouter(); // Access router
    const ideaId = (params?.id as string) || "";

    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<TeamRow | null>(null);
    const [result, setResult] = useState<ResultRow | null>(null);
    const [juryScores, setJuryScores] = useState<JuryScoreRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Jury input (0–10)
    const [jury, setJury] = useState({
        desirability: "",
        feasibility: "",
        viability: "",
        presentation: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [missingTableError, setMissingTableError] = useState(false);

    const aiScores10 = useMemo(() => {
        const d = result?.desirability_score ?? null;
        const f = result?.feasibility_score ?? null;
        const v = result?.viability_score ?? null;

        // Your table uses 0..100 range. Convert to 0..10 for UI.
        const to10 = (x: number | null) => (x === null ? null : Math.round((x / 10) * 10) / 10);

        return { d: to10(d), f: to10(f), v: to10(v) };
    }, [result]);

    const averages = useMemo(() => {
        if (juryScores.length === 0) return null;
        const sum = juryScores.reduce((acc, curr) => ({
            d: acc.d + Number(curr.desirability || 0),
            f: acc.f + Number(curr.feasibility || 0),
            v: acc.v + Number(curr.viability || 0),
            p: acc.p + Number(curr.presentation || 0),
        }), { d: 0, f: 0, v: 0, p: 0 });

        const count = juryScores.length;
        return {
            d: (sum.d / count).toFixed(1),
            f: (sum.f / count).toFixed(1),
            v: (sum.v / count).toFixed(1),
            p: (sum.p / count).toFixed(1),
        };
    }, [juryScores]);

    // Update useEffect logic to use team_name
    useEffect(() => {
        if (!ideaId) return;

        const run = async () => {
            setLoading(true);
            setError(null);
            setMissingTableError(false);

            // Fetch team row
            const teamRes = await supabase
                .from("teams")
                .select("*")
                .eq("idea_id", ideaId)
                .maybeSingle();

            if (teamRes.error) {
                setError(`Teams fetch error: ${teamRes.error.message}`);
                setLoading(false);
                return;
            }
            const teamData = teamRes.data as TeamRow;
            setTeam(teamData);

            // Fetch AI evaluation row
            const resRes = await supabase
                .from("idea_results")
                .select("*")
                .eq("idea_id", ideaId)
                .maybeSingle();

            if (resRes.error) {
                if (resRes.error.code === '42P01' || resRes.error.message.includes('Could not find the table')) {
                    setMissingTableError(true);
                } else {
                    console.error("AI results fetch error:", resRes.error.message);
                }
            }
            setResult(resRes.data as ResultRow | null);

            // Fetch existing Jury Scores using team_name
            if (teamData?.team_name) {
                await fetchJuryScores(teamData.team_name);
            }

            setLoading(false);
        };

        run();
    }, [ideaId]);

    const fetchJuryScores = async (teamName: string) => {
        const { data, error } = await supabase
            .from("jury_scores")
            .select("*")
            .eq("team_name", teamName) // Filter by team_name
            .order("created_at", { ascending: false });

        if (error) {
            if (error.code === '42P01' || error.message.includes('Could not find the table')) {
                setMissingTableError(true);
            } else {
                console.error("Error fetching jury scores:", error);
            }
        } else {
            setJuryScores(data as JuryScoreRow[] || []);
        }
    };

    const clamp10 = (s: string) => {
        const n = Number(s);
        if (Number.isNaN(n) || s.trim() === "") return null;
        if (n < 0) return 0;
        if (n > 10) return 10;
        return n;
    };

    const onSubmit = async () => {
        setSubmitted(false);
        setError(null);

        if (!team?.team_name) {
            setError("Team data not loaded properly.");
            return;
        }

        const d = clamp10(jury.desirability);
        const f = clamp10(jury.feasibility);
        const v = clamp10(jury.viability);
        const p = clamp10(jury.presentation);

        if (d === null || f === null || v === null || p === null) {
            setError("Enter valid jury scores (0 to 10) for all 4 categories.");
            return;
        }

        setSubmitting(true);
        try {
            // Insert with team_name
            const { error: insertError } = await supabase.from("jury_scores").insert([{
                team_name: team.team_name,
                desirability: d,
                feasibility: f,
                viability: v,
                presentation: p,
            }]);

            if (insertError) throw insertError;

            setSubmitted(true);
            // Refresh the list
            await fetchJuryScores(team.team_name);

            // Optional: clear inputs
            setJury({ desirability: "", feasibility: "", viability: "", presentation: "" });

        } catch (e: any) {
            setError(e?.message || "Submit failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 font-sans">
                <LogoBar />
                <div className="flex items-center justify-center p-20 text-xl text-zinc-500 animate-pulse">
                    Loading Idea details...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans pb-20">
            <LogoBar />

            <div className="max-w-6xl mx-auto p-6 md:p-8">
                {missingTableError && (
                    <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <div className="font-bold">Database Setup Required</div>
                            <div className="text-sm opacity-90 mb-2">
                                The `idea_results` or `jury_scores` tables are missing. AI scores cannot be displayed.
                            </div>
                            <div className="text-xs font-mono bg-yellow-100 px-2 py-1 rounded inline-block">
                                Run the SQL script from `setup_missing_tables.sql` in Supabase.
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
                        🚨 {error}
                    </div>
                )}

                {!team ? (
                    <div className="rounded-xl bg-white border p-8 shadow-sm text-center">
                        <div className="text-xl font-semibold mb-2">No team found</div>
                        <div className="text-zinc-500">
                            ID: <span className="font-mono bg-zinc-100 px-2 py-1 rounded">{ideaId}</span>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white border shadow-sm p-8 mb-8">
                        {/* HEADER: Name, ID, Email, Size */}
                        <div className="border-b pb-6 mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">{team.team_name}</h1>
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-mono text-zinc-500">
                                    <span className="bg-zinc-100 px-2 py-1 rounded">ID: {team.idea_id.slice(0, 8)}...</span>
                                    {team.team_size && (
                                        <span className="flex items-center gap-1 text-zinc-600 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                                            👥 {team.team_size} Members
                                        </span>
                                    )}
                                    {team.contact_email && (
                                        <span className="flex items-center gap-1 text-zinc-600 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                                            ✉️ {team.contact_email}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* AVERAGES SCOREBOARD */}
                            {averages && (
                                <div className="flex gap-2">
                                    <AvgCard label="Desirability" value={averages.d} />
                                    <AvgCard label="Feasibility" value={averages.f} />
                                    <AvgCard label="Viability" value={averages.v} />
                                    <AvgCard label="Presentation" value={averages.p} highlight />
                                </div>
                            )}
                        </div>

                        {/* TEAM MEMBERS ROW */}
                        {team.team_members && team.team_members.length > 0 && (
                            <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-100">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    Team Structure
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {team.team_members.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-zinc-200 shadow-sm">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {member.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900 text-sm">{member}</span>
                                                <span className="text-xs text-zinc-500">{team.team_roles?.[idx] || "Member"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <Section
                                title="Problem"
                                text={team.problem_statement}
                                subHeader={team.problem_title}
                            />
                            <Section title="Proposed Solution" text={team.proposed_solution} />

                            <ChipRow title="Target Users" items={team.target_users} color="blue" />
                            <ChipRow title="Technology Stack" items={team.tech_stack} color="indigo" />

                            <BulletRow title="Innovation Highlights" items={team.innovation_highlights} />

                            <Section title="Business Model" text={team.business_model} />
                            <Section title="Market Insight" text={team.market_insight} />
                        </div>
                    </div>
                )}

                {/* SCORING SECTION */}
                <div className="rounded-2xl bg-white border shadow-sm p-8 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-blue-900">
                        Jury Scoring Board
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <ScoreCard
                            title="Desirability"
                            emoji="❤️"
                            value={jury.desirability}
                            onChange={(v) => setJury((s) => ({ ...s, desirability: v }))}
                            submitted={submitted}
                            ai={aiScores10.d}
                        />
                        <ScoreCard
                            title="Feasibility"
                            emoji="🛠️"
                            value={jury.feasibility}
                            onChange={(v) => setJury((s) => ({ ...s, feasibility: v }))}
                            submitted={submitted}
                            ai={aiScores10.f}
                        />
                        <ScoreCard
                            title="Viability"
                            emoji="💰"
                            value={jury.viability}
                            onChange={(v) => setJury((s) => ({ ...s, viability: v }))}
                            submitted={submitted}
                            ai={aiScores10.v}
                        />
                        <ScoreCard
                            title="Presentation"
                            emoji="🎤"
                            value={jury.presentation}
                            onChange={(v) => setJury((s) => ({ ...s, presentation: v }))}
                            submitted={submitted}
                            ai={null}
                            isManualOnly
                        />
                    </div>

                    <div className="mt-8 flex items-center justify-end border-t pt-6">
                        <button
                            onClick={onSubmit}
                            disabled={submitting}
                            className="px-8 py-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? (
                                <><span>⏳</span> Submitting...</>
                            ) : (
                                "Submit"
                            )}
                        </button>
                    </div>

                    {submitted && (
                        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-2xl">🎉</div>
                            <div>
                                <div className="font-bold">Scores Submitted Successfully!</div>
                                <div className="text-sm opacity-90">Thank you for evaluating this project.</div>
                            </div>
                        </div>
                    )}

                    {submitted && result?.summary && (
                        <div className="mt-8">
                            <details className="group rounded-xl border border-zinc-200 bg-zinc-50 p-4 open:bg-white open:shadow-sm transition-all">
                                <summary className="cursor-pointer font-semibold text-zinc-700 flex items-center gap-2 select-none">
                                    <span>🤖</span> Reveal AI Reasoning
                                    <span className="group-open:rotate-180 transition-transform ml-auto">▼</span>
                                </summary>
                                <div className="mt-4 text-zinc-600 leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-zinc-200">
                                    {result.summary}
                                </div>
                            </details>
                        </div>
                    )}
                </div>

                {/* LIVE SCORES FEED */}
            </div>
        </div>
    );
}

// Internal Components

// 1. Update the Search/Logo Bar
function LogoBar() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ idea_id: string, team_name: string }[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Debounced search
    useEffect(() => {
        const fetchTeams = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("teams")
                    .select("idea_id, team_name")
                    .ilike("team_name", `%${query}%`)
                    .limit(5);

                if (error) {
                    // Check for specific error code '42P01' (undefined_table)
                    if (error.code === '42P01') {
                        // Table does not exist, return empty results without logging an error
                        setResults([]);
                        return;
                    }
                    // Log other errors
                    console.error("Error fetching teams:", error);
                    setResults([]);
                    return;
                }

                if (data) {
                    setResults(data as any[]);
                    setShowResults(true);
                }
            } catch (e) {
                console.error("Unexpected error during team fetch:", e);
                setResults([]);
            }
        };

        const timeoutId = setTimeout(fetchTeams, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (ideaId: string) => {
        router.push(`/idea/${ideaId}`);
        setQuery("");
        setShowResults(false);
    };

    return (
        <div className="relative flex items-center justify-between px-6 py-3 bg-white border-b z-50 shadow-sm h-32">
            {/* LEFT: PES Logo */}
            <div className="flex items-center z-10">
                <Image src="/pes_v2.png" alt="PES" width={160} height={48} priority className="object-contain" />
            </div>

            {/* CENTER: IdeaLens Logo (Independent) + Search Bar (Independent) */}

            {/* 1. IdeaLens Logo - Centered in top portion */}
            <div className="absolute left-1/2 top-10 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <Image src="/idealens.png" alt="IdeaLens" width={240} height={60} className="object-contain" />
            </div>

            {/* 2. Search Bar - Positioned below */}
            <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 w-full max-w-lg z-20 px-4">
                <div className="relative w-full">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        placeholder="Search Team Name..."
                        className="w-full bg-white border border-zinc-200 rounded-full px-4 py-1.5 pl-10 text-sm text-zinc-800 placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20"
                    />
                    <div className="absolute left-3 top-2 text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showResults && results.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-[60]">
                            {results.map((team) => (
                                <button
                                    key={team.idea_id}
                                    onClick={() => handleSelect(team.idea_id)}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-sm text-zinc-700 transition-colors border-b border-zinc-50 last:border-none"
                                >
                                    {team.team_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: CIE Logo */}
            <div className="flex items-center justify-end z-10 w-64">
                <Image src="/cie.png" alt="CIE" width={240} height={60} priority className="object-contain" />
            </div>
        </div>
    );
}

function AvgCard({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-zinc-50 border-zinc-100'}`}>
            <span className="text-[10px] uppercase font-bold text-zinc-400">{label}</span>
            <span className={`text-xl font-bold ${highlight ? 'text-indigo-600' : 'text-zinc-800'}`}>{value}</span>
        </div>
    );
}


function Section({ title, text, subHeader }: { title: string; text: string | null | undefined; subHeader?: string | null }) {
    return (
        <div className="group">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 group-hover:text-zinc-600 transition-colors">{title}</h3>
            {subHeader && (
                <div className="text-lg font-bold text-zinc-900 mb-2">{subHeader}</div>
            )}
            <div className="text-zinc-800 leading-relaxed text-lg">
                {text || <span className="text-zinc-300 italic">No content provided</span>}
            </div>
        </div>
    );
}

function ChipRow({ title, items, color = "blue" }: { title: string; items: string[] | null | undefined; color?: string }) {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    };

    return (
        <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {(items || []).length === 0 ? (
                    <span className="text-zinc-300 italic">—</span>
                ) : (
                    items!.map((x, i) => (
                        <span key={i} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${colorClasses[color] || colorClasses.blue}`}>
                            {x}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}

function BulletRow({ title, items }: { title: string; items: string[] | null | undefined }) {
    return (
        <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">{title}</h3>
            <ul className="space-y-2">
                {(items || []).length === 0 ? <li className="text-zinc-300 italic">—</li> : items!.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-zinc-800">
                        <span className="text-blue-500 mt-1.5 text-[0.6rem]">●</span>
                        <span>{x}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ScoreItem({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400">{label}</span>
            <span className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-zinc-800'}`}>{value}</span>
        </div>
    );
}

function ScoreCard({
    title,
    emoji,
    value,
    onChange,
    submitted,
    ai,
    isManualOnly = false,
}: {
    title: string;
    emoji: string;
    value: string;
    onChange: (v: string) => void;
    submitted: boolean;
    ai: number | null;
    isManualOnly?: boolean;
}) {
    const numVal = Number(value);

    // Dynamic Emoji Interaction
    let feedbackEmoji = emoji;
    if (value !== "") {
        if (numVal >= 9) feedbackEmoji = "🤩";
        else if (numVal >= 7) feedbackEmoji = "🙂";
        else if (numVal >= 5) feedbackEmoji = "😐";
        else if (numVal >= 1) feedbackEmoji = "🤔";
    }

    return (
        <div className="group relative rounded-2xl border bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-500">{title}</span>
                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{feedbackEmoji}</span>
            </div>

            <div className="relative">
                <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="—"
                    className="w-full bg-transparent text-5xl font-black text-center outline-none border-b-2 border-zinc-200 focus:border-blue-500 focus:text-blue-600 transition-colors py-2 placeholder-zinc-200"
                />
                <div className="text-center text-xs text-zinc-400 mt-2 font-medium">
                    / 10
                </div>
            </div>

            {!isManualOnly && (
                <div className="mt-6 pt-4 border-t border-dashed border-zinc-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400 font-medium">AI Score</span>
                        <div className="text-right">
                            <div className="font-bold text-zinc-700 text-lg">{ai ?? "N/A"}</div>
                            {ai !== null && value !== "" && (
                                <div className={`text-[10px] font-bold ${Math.abs(numVal - ai) > 2 ? 'text-orange-500' : 'text-green-500'}`}>
                                    Δ {(numVal - ai).toFixed(1)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isManualOnly && (
                <div className="mt-6 pt-4 border-t border-dashed border-zinc-200">
                    <div className="text-center text-xs text-zinc-300 italic">
                        Manual entry only
                    </div>
                </div>
            )}
        </div>
    );
}
