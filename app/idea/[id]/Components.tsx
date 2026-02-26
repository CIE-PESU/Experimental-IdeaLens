"use client";

import Image from "next/image";
import { ReactNode } from "react";

export function LogoBar() {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 py-4">
            <div className="flex-1 flex items-center justify-center md:justify-start">
                <Image src="/pes_v2.png" alt="PES" width={180} height={54} priority className="object-contain h-14 w-auto" />
            </div>
            <div className="flex items-center justify-center">
                <Image src="/idealens.png" alt="IdeaLens" width={240} height={60} className="object-contain h-14 w-auto" />
            </div>
            <div className="flex-1 flex items-center justify-center md:justify-end">
                <Image src="/cie.png" alt="CIE" width={260} height={78} priority className="object-contain h-16 w-auto" />
            </div>
        </div>
    );
}

export function AvgCard({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-zinc-50 border-zinc-100'}`}>
            <span className="text-[10px] uppercase font-bold text-zinc-400">{label}</span>
            <span className={`text-xl font-bold ${highlight ? 'text-indigo-600' : 'text-zinc-800'}`}>{value}</span>
        </div>
    );
}

export function Section({ title, text, subHeader }: { title: string; text: string | null | undefined; subHeader?: string | null }) {
    return (
        <div className="group">
            <h3 className="text-base font-bold text-zinc-900 uppercase tracking-wider mb-2 transition-colors">{title}</h3>
            {subHeader && <div className="text-lg font-bold text-zinc-900 mb-2">{subHeader}</div>}
            <div className="text-zinc-800 leading-relaxed text-lg">
                {text || <span className="text-zinc-300 italic">No content provided</span>}
            </div>
        </div>
    );
}

export function ChipRow({ title, items, color = "blue" }: { title: string; items: string | string[] | null | undefined; color?: string }) {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    };
    const itemList = typeof items === 'string' ? items.split(',').map(x => x.trim()).filter(Boolean) : (items || []);

    return (
        <div>
            <h3 className="text-base font-bold text-zinc-900 uppercase tracking-wider mb-2">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {itemList.length === 0 ? (
                    <span className="text-zinc-300 italic">—</span>
                ) : (
                    itemList.map((x, i) => (
                        <span key={i} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${colorClasses[color] || colorClasses.blue}`}>
                            {x}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}

export function BulletRow({ title, items }: { title: string; items: string | string[] | null | undefined }) {
    const itemList = typeof items === 'string' ? items.split(',').map(x => x.trim()).filter(Boolean) : (items || []);
    return (
        <div>
            <h3 className="text-base font-bold text-zinc-900 uppercase tracking-wider mb-2">{title}</h3>
            <ul className="space-y-2">
                {itemList.length === 0 ? <li className="text-zinc-300 italic">—</li> : itemList.map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-zinc-800">
                        <span className="text-blue-500 mt-1.5 text-[0.6rem]">●</span>
                        <span>{x}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function ScoreCard({
    title,
    emoji,
    value,
    onChange,
    submitted,
    ai,
    aiRevealed,
    isManualOnly = false,
    disabled = false,
}: {
    title: string;
    emoji: string;
    value: string;
    onChange: (v: string) => void;
    submitted: boolean;
    ai: number | null;
    aiRevealed: boolean;
    isManualOnly?: boolean;
    disabled?: boolean;
}) {
    const numVal = Number(value);
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
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-900">{title}</span>
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
                    disabled={disabled}
                    className={`w-full bg-transparent text-5xl font-black text-center outline-none border-b-2 transition-colors py-2 placeholder-zinc-200 disabled:opacity-50 ${numVal > 10 ? 'text-red-600 border-red-600 animate-pulse' : 'text-zinc-900 border-zinc-200 focus:border-blue-500 focus:text-blue-600'}`}
                />
                <div className="text-center text-xs text-zinc-400 mt-2 font-medium">/ 10</div>
            </div>

            {!isManualOnly && (
                <div className="mt-6 pt-4 border-t border-dashed border-zinc-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400 font-medium">AI Score</span>
                        <div className="text-right">
                            {aiRevealed ? (
                                <>
                                    <div className="font-bold text-zinc-700 text-lg">{ai ?? "N/A"}</div>
                                    {ai !== null && value !== "" && (
                                        <div className={`text-[10px] font-bold ${Math.abs(numVal - ai) > 2 ? 'text-orange-500' : 'text-green-500'}`}>
                                            Δ {(numVal - ai).toFixed(1)}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="font-bold text-zinc-300 italic text-sm">Hidden</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isManualOnly && (
                <div className="mt-6 pt-4 border-t border-dashed border-zinc-200">
                    <div className="text-center text-xs text-zinc-300 italic">Manual entry only</div>
                </div>
            )}
        </div>
    );
}
