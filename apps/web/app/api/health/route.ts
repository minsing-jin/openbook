export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "openbook-web",
    timestamp: new Date().toISOString()
  });
}
