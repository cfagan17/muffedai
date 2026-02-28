import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isEmailEnabled, sendReportEmail } from "@/lib/email";

/**
 * POST /api/cron/weekly-reports
 *
 * Triggered weekly (e.g., Tuesday morning) by an external cron service
 * (Vercel Cron, GitHub Actions, Railway cron, etc.).
 *
 * For each user who has a generated report that hasn't been emailed yet,
 * send them the report via email.
 *
 * Protected by a CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ error: "Email not configured (RESEND_API_KEY missing)" }, { status: 500 });
  }

  // Use service role client for admin access to all users' data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find generated reports that haven't been emailed yet
  // (emailed_at is null means not yet sent — see migration-003)
  const { data: reports, error: fetchError } = await supabase
    .from("reports")
    .select("id, user_id, week_number, season, total_points, grade, week_narrative")
    .eq("status", "generated")
    .is("emailed_at", null)
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Failed to fetch reports:", fetchError);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({ sent: 0, message: "No pending reports to email" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fantasyplaybook.app";
  let sent = 0;
  let failed = 0;

  for (const report of reports) {
    // Skip reports without enough data for a meaningful email
    if (!report.total_points || !report.grade) continue;

    // Get user email from Supabase Auth
    const { data: userData } = await supabase.auth.admin.getUserById(report.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    // Fetch player breakdowns for this report
    const { data: players } = await supabase
      .from("report_players")
      .select("points, nfl_players(name, position)")
      .eq("report_id", report.id)
      .order("points", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerSummaries = ((players ?? []) as any[])
      .filter((p) => p.points != null)
      .map((p) => ({
        name: p.nfl_players?.name ?? "Unknown",
        points: p.points as number,
        position: p.nfl_players?.position ?? "??",
      }));

    const success = await sendReportEmail({
      to: email,
      reportId: report.id,
      weekNumber: report.week_number,
      season: report.season,
      totalPoints: report.total_points,
      grade: report.grade,
      playerSummaries,
      weekNarrative: report.week_narrative ?? "Report narrative not available.",
      appUrl,
    });

    if (success) {
      // Mark report as emailed via emailed_at timestamp
      await supabase
        .from("reports")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", report.id);
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: reports.length });
}
