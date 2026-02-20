"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import MuleyLogo from "@/components/MuleyLogo";
import { Season, Session, Participant } from "@/lib/types";
import { FloatingShapes } from "@/components/SquidShapes";
import Link from "next/link";

interface SeasonWithSessions extends Season {
  sessions: (Session & { participants: Participant[] })[];
}

export default function HistoryPage() {
  const [closedSeasons, setClosedSeasons] = useState<SeasonWithSessions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const { data } = await supabase
        .from("seasons")
        .select("*, sessions(*, participants(*))")
        .eq("status", "closed")
        .order("created_at", { ascending: false });

      if (data) setClosedSeasons(data as SeasonWithSessions[]);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-[family-name:var(--font-heading)] text-3xl text-squid-pink animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 md:p-8">
      <FloatingShapes />

      <div className="relative z-20 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="text-squid-light/30 text-sm hover:text-squid-light/60 transition-colors"
          >
            &larr; Back to Home
          </Link>
          <div className="flex items-center justify-center gap-4 mt-4 mb-2">
            <MuleyLogo size="md" animated variant="squid" />
            <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl text-squid-gold glitch-text">
              HISTORY
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-3 h-3 rounded-full border border-squid-gold" />
            <svg viewBox="0 0 100 100" className="w-3 h-3">
              <polygon points="50,5 95,95 5,95" fill="none" stroke="#FFD700" strokeWidth="8" />
            </svg>
            <div className="w-3 h-3 border border-squid-gold" />
          </div>
          <p className="text-squid-light/40">
            Trial by Tokens - Past Champions
          </p>
        </div>

        {closedSeasons.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full border-4 border-squid-grey mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-squid-grey">?</span>
            </div>
            <p className="font-[family-name:var(--font-heading)] text-2xl text-squid-light/30 tracking-wider">
              NO COMPLETED SEASONS YET
            </p>
            <p className="text-squid-light/20 mt-2 text-sm">
              Champions will appear here after the first season finale.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {closedSeasons.map((season, index) => {
              const finaleSession = season.sessions.find((s) => s.is_finale);
              const regularSessions = season.sessions.filter((s) => !s.is_finale);
              const allParticipants = season.sessions.flatMap((s) => s.participants);
              const uniqueNames = [...new Set(allParticipants.map((p) => p.name))];

              return (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-squid-dark border border-squid-gold/30 rounded-2xl p-6 md:p-8"
                >
                  {/* Season Header */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-squid-gold tracking-wider">
                        {season.name.toUpperCase()}
                      </h2>
                      <p className="text-squid-light/40 text-sm mt-1">
                        {regularSessions.length} sessions · Completed{" "}
                        {new Date(season.created_at).getFullYear()}
                      </p>
                    </div>
                    {season.total_prize_pot && (
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-heading)] text-3xl text-squid-gold">
                          ${season.total_prize_pot}
                        </p>
                        <p className="text-squid-light/40 text-xs">PRIZE POT</p>
                      </div>
                    )}
                  </div>

                  {/* Winner */}
                  {season.winner_name && (
                    <div className="mb-8">
                      <div className="flex items-center gap-4 p-4 bg-squid-gold/10 border border-squid-gold/30 rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-squid-gold/20 border-2 border-squid-gold flex items-center justify-center shrink-0">
                          <span className="text-2xl">👑</span>
                        </div>
                        <div>
                          <p className="text-xs text-squid-gold/60 uppercase tracking-wider">
                            Season Champion
                          </p>
                          <p className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl text-squid-gold tracking-wider">
                            {season.winner_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finale Results */}
                  {finaleSession && finaleSession.participants.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl text-squid-light/60 tracking-wider mb-3">
                        FINALE RESULTS
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {finaleSession.participants
                          .sort((a, b) => b.vote_count - a.vote_count)
                          .map((p) => (
                            <div
                              key={p.id}
                              className={`p-3 rounded-xl border ${
                                p.status === "alive"
                                  ? "border-squid-gold/50 bg-squid-gold/5"
                                  : "border-squid-grey/30 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {p.status === "alive" && <span className="text-sm">👑</span>}
                                <span className="font-[family-name:var(--font-heading)] text-lg text-squid-light tracking-wider">
                                  {p.name}
                                </span>
                              </div>
                              <p className="text-xs text-squid-light/40">
                                {p.vote_count} votes
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* All Participants */}
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-xl text-squid-light/60 tracking-wider mb-3">
                      ALL PARTICIPANTS ({uniqueNames.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {uniqueNames.map((name) => (
                        <span
                          key={name}
                          className={`px-3 py-1 rounded-full text-sm ${
                            name === season.winner_name
                              ? "bg-squid-gold/20 text-squid-gold border border-squid-gold/30"
                              : "bg-squid-grey/50 text-squid-light/60"
                          }`}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
