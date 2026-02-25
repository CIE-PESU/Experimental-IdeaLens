"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type TeamPreview = {
  idea_id: string;
  team_name: string | null;
  problem_title: string | null;
  problem_statement: string | null;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<TeamPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("idea_id, team_name, problem_title, problem_statement")
        .order("team_name", { ascending: true });

      if (error) {
        console.error("Error fetching teams:", error);
        setError("Failed to load teams.");
      } else {
        setTeams(data as TeamPreview[] || []);
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) =>
    (team.team_name || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">

      {/* HERO SECTION */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
          {/* LOGOS */}
          <div className="flex items-center gap-6 mb-8 opacity-90 grayscale hover:grayscale-0 transition-all duration-700">
            <Image src="/pes_v2.png" alt="PES" width={140} height={48} className="object-contain h-12 w-auto" priority />
            <div className="h-10 w-px bg-zinc-300"></div>
            <Image src="/cie.png" alt="CIE" width={160} height={48} className="object-contain h-10 w-auto" priority />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-4">
            Project Evaluation Board
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl">
            Browse and evaluate the innovative projects submitted by the teams.
            Search by team name below.
          </p>

          {/* SEARCH BOX */}
          <div className="relative w-full max-w-xl mt-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full rounded-2xl border-zinc-300 shadow-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg border-0 px-6 py-4 outline-none transition-all placeholder:text-zinc-400"
            />
            <div className="absolute right-4 top-4 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* TEAMS GRID */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-zinc-200 rounded-2xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-12 bg-red-50 text-red-600 rounded-2xl border border-red-100">
            {error}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center p-20 text-zinc-400 italic">
            {query ? `No teams found matching "${query}"` : "No teams available."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Link
                key={team.idea_id}
                href={`/idea/${team.idea_id}`}
                className="group block bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {team.team_name?.charAt(0) || "T"}
                  </div>
                  <span className="text-xs font-mono text-zinc-300">{team.idea_id.slice(0, 4)}...</span>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {team.team_name || "Untitled Team"}
                </h3>

                <div className="text-zinc-500 text-sm line-clamp-3 leading-relaxed">
                  {team.problem_title && (
                    <span className="font-bold text-zinc-800 block mb-1">{team.problem_title}</span>
                  )}
                  {team.problem_statement || "No problem statement provided."}
                </div>

                <div className="mt-6 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  Evaluate Team &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
