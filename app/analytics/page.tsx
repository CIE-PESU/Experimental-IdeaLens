"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function AnalyticsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase
                .from("ai_evaluations")
                .select("team_name, average_dfv_score, execution_risk, desirability_score, feasibility_score, viability_score")
                .order("average_dfv_score", { ascending: false });
            setStats(data || []);
            setLoading(false);
        };
        fetchStats();
    }, []);

    const topTeams = stats.slice(0, 5);
    const scoreDistribution = useMemo(() => {
        const dist = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
        stats.forEach(s => {
            const score = Number(s.average_dfv_score);
            if (score <= 2) dist[0]++;
            else if (score <= 4) dist[1]++;
            else if (score <= 6) dist[2]++;
            else if (score <= 8) dist[3]++;
            else dist[4]++;
        });
        return dist;
    }, [stats]);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse">ANALYZING CLUSTER...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-10 space-y-12">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-3 rounded-2xl glass-card hover:bg-slate-100 transition-all font-bold">&larr; HUB</button>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Strategic <span className="text-brand-accent">Analytics</span></h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Score Distribution Chart (CSS-based) */}
                <div className="lg:col-span-2 glass-card p-10 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Innovation Score Distribution</h3>
                    <div className="flex items-end justify-around h-64 gap-4">
                        {scoreDistribution.map((count, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div
                                    className="w-full bg-brand-blue rounded-t-2xl transition-all duration-700 group-hover:bg-brand-accent relative"
                                    style={{ height: `${(count / Math.max(...scoreDistribution, 1)) * 100}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {count} TEAMS
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">Tier {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-10 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Elite Performance (Top 5)</h3>
                    <div className="space-y-6">
                        {topTeams.map((team, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-slate-200 group-hover:text-brand-accent transition-colors">0{i + 1}</span>
                                    <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]">{team.team_name}</span>
                                </div>
                                <div className="text-xl font-black text-brand-blue">{Number(team.average_dfv_score).toFixed(1)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card p-10">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Risk Cluster Heatmap</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {stats.map((team, i) => {
                        const risk = Number(team.execution_risk);
                        const color = risk < 4 ? 'bg-emerald-500' : risk > 7 ? 'bg-rose-500' : 'bg-amber-500';
                        return (
                            <div key={i} className={`p-4 rounded-2xl ${color} shadow-lg shadow-black/5 flex flex-col items-center text-white relative group cursor-pointer`}>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                                <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{team.team_name}</span>
                                <span className="text-xs font-black mt-1">{risk.toFixed(1)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
