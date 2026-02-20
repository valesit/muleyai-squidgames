import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { status } = await request.json();

  const validStatuses = ["lobby", "voting", "results", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch the session to check if it's a finale
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isFinale = session.is_finale;

  // When transitioning to "results", tally votes and determine outcomes
  if (status === "results") {
    const { data: participants, error: pError } = await supabaseAdmin
      .from("participants")
      .select("id, player_number, name")
      .eq("session_id", sessionId);

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 });
    }

    // Finale with 1 player: auto-win, close season immediately
    if (isFinale && (participants || []).length === 1) {
      const winner = participants![0];
      await supabaseAdmin
        .from("participants")
        .update({ status: "alive", vote_count: 0 })
        .eq("id", winner.id);

      if (session.season_id) {
        const { data: seasonSessions } = await supabaseAdmin
          .from("sessions")
          .select("pot_contribution")
          .eq("season_id", session.season_id)
          .eq("is_finale", false);

        const totalPrizePot = (seasonSessions || []).reduce(
          (sum, s) => sum + (s.pot_contribution || 25), 0
        );

        await supabaseAdmin
          .from("seasons")
          .update({ status: "closed", winner_name: winner.name, total_prize_pot: totalPrizePot })
          .eq("id", session.season_id);

        await supabaseAdmin
          .from("sessions")
          .update({ status: "completed" })
          .eq("season_id", session.season_id)
          .neq("id", sessionId);
      }
    } else if ((participants || []).length <= 2 && !isFinale) {
      const allIds = (participants || []).map((p) => p.id);
      if (allIds.length > 0) {
        await supabaseAdmin
          .from("participants")
          .update({ status: "alive", vote_count: 0 })
          .in("id", allIds);
      }
    } else {
      // Count votes per participant
      const { data: votes, error: vError } = await supabaseAdmin
        .from("votes")
        .select("participant_id")
        .eq("session_id", sessionId);

      if (vError) {
        return NextResponse.json({ error: vError.message }, { status: 500 });
      }

      const voteCounts: Record<string, number> = {};
      for (const p of participants || []) {
        voteCounts[p.id] = 0;
      }
      for (const v of votes || []) {
        voteCounts[v.participant_id] = (voteCounts[v.participant_id] || 0) + 1;
      }

      // Update vote_count on each participant
      for (const p of participants || []) {
        await supabaseAdmin
          .from("participants")
          .update({ vote_count: voteCounts[p.id] || 0 })
          .eq("id", p.id);
      }

      // Sort by votes descending
      const sorted = [...(participants || [])].sort(
        (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
      );

      if (isFinale) {
        // FINALE: only 1 winner (top vote-getter), everyone else eliminated
        const winnerId = sorted[0]?.id;
        const loserIds = sorted.slice(1).map((p) => p.id);

        if (winnerId) {
          await supabaseAdmin
            .from("participants")
            .update({ status: "alive" })
            .eq("id", winnerId);
        }

        if (loserIds.length > 0) {
          await supabaseAdmin
            .from("participants")
            .update({ status: "eliminated" })
            .in("id", loserIds);
        }

        // Officially close the season
        if (session.season_id) {
          // Compute total prize pot from all sessions in this season
          const { data: seasonSessions } = await supabaseAdmin
            .from("sessions")
            .select("pot_contribution")
            .eq("season_id", session.season_id)
            .eq("is_finale", false);

          const totalPrizePot = (seasonSessions || []).reduce(
            (sum, s) => sum + (s.pot_contribution || 25),
            0
          );

          const winnerName = sorted[0]?.name || "Unknown";

          await supabaseAdmin
            .from("seasons")
            .update({
              status: "closed",
              winner_name: winnerName,
              total_prize_pot: totalPrizePot,
            })
            .eq("id", session.season_id);

          // Archive all sessions in this season (mark as completed)
          await supabaseAdmin
            .from("sessions")
            .update({ status: "completed" })
            .eq("season_id", session.season_id)
            .neq("id", sessionId);
        }
      } else {
        // REGULAR SESSION: bottom 2 eliminated, top 2 survive
        const sortedAsc = [...(participants || [])].sort(
          (a, b) => (voteCounts[a.id] || 0) - (voteCounts[b.id] || 0)
        );

        const eliminatedIds = sortedAsc.slice(0, 2).map((p) => p.id);
        const survivorIds = sortedAsc.slice(2).map((p) => p.id);

        if (eliminatedIds.length > 0) {
          await supabaseAdmin
            .from("participants")
            .update({ status: "eliminated" })
            .in("id", eliminatedIds);
        }

        if (survivorIds.length > 0) {
          await supabaseAdmin
            .from("participants")
            .update({ status: "alive" })
            .in("id", survivorIds);
        }
      }
    }
  }

  // Update session status (for finale going to "results", it's already being set)
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
