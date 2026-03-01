import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export function isEmailEnabled(): boolean {
  return !!apiKey;
}

type ReportEmailData = {
  to: string;
  reportId: number;
  weekNumber: number;
  season: number;
  totalPoints: number;
  grade: string;
  playerSummaries: { name: string; points: number; position: string }[];
  weekNarrative: string;
  appUrl: string;
};

export async function sendReportEmail(data: ReportEmailData): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const reportUrl = `${data.appUrl}/dashboard/reports/${data.reportId}`;

  const playerRows = data.playerSummaries
    .sort((a, b) => b.points - a.points)
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155">${p.name}</td>
          <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b">${p.position}</td>
          <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#059669;text-align:right">${p.points}</td>
        </tr>`
    )
    .join("");

  const gradeColor = data.grade.startsWith("A")
    ? "#059669"
    : data.grade.startsWith("B")
      ? "#d97706"
      : "#dc2626";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="margin:0;font-size:24px;color:#0f172a">Muffed</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#64748b">Week ${data.weekNumber} Report &middot; ${data.season} Season</p>
    </div>

    <!-- Grade Card -->
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:24px;margin-bottom:24px;text-align:center">
      <div style="font-size:48px;font-weight:800;color:${gradeColor};line-height:1">${data.grade}</div>
      <div style="margin-top:8px;font-size:18px;font-weight:600;color:#0f172a">${data.totalPoints} Points</div>
    </div>

    <!-- Week Narrative -->
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:24px;margin-bottom:24px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">The Week in Review</h2>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#475569">${data.weekNarrative}</p>
    </div>

    <!-- Player Table -->
    <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:24px;margin-bottom:24px">
      <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a">Player Scores</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="padding:8px 16px;text-align:left;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Player</th>
            <th style="padding:8px 16px;text-align:left;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Pos</th>
            <th style="padding:8px 16px;text-align:right;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Points</th>
          </tr>
        </thead>
        <tbody>${playerRows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px">
      <a href="${reportUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Full Report</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:12px;color:#94a3b8">
      <p style="margin:0">Muffed — Your weekly fantasy football analyst.</p>
      <p style="margin:8px 0 0">You're receiving this because you signed up at Muffed.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: "Muffed <reports@muffed.ai>",
      to: data.to,
      subject: `Week ${data.weekNumber}: ${data.grade} — ${data.totalPoints} pts`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
