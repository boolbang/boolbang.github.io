// 방명록 사진 업로드 Worker (Cloudflare 대시보드 Workers에 이 파일 내용을 그대로 붙여넣음)
//
// 흐름: 방명록 페이지 → (사진 + Turnstile 토큰) POST /upload → 검사 → R2 저장 → 공개 주소 반환
// 비밀 키는 이 Worker 안에만 있고, 페이지 코드에는 들어가지 않는다.
//
// 대시보드에서 연결해야 하는 것 (Settings → Bindings / Variables and Secrets):
//   BUCKET            R2 버킷 바인딩 (작업일지 이미지가 있는 기존 버킷)
//   TURNSTILE_SECRET  Turnstile 비밀 키 (Secret 타입)

// 사진 공개 주소 앞부분 = 버킷의 r2.dev 공개 주소
const PUBLIC_BASE = "https://pub-60b7f1bf1596496f8212ba01605e4e74.r2.dev";

// 업로드를 허용할 사이트 주소 (그 외 사이트에서의 요청은 거부).
// 로컬 개발 서버(localhost / 127.0.0.1, 포트 무관)도 허용
const ALLOWED_ORIGINS = ["https://boolbang.com", "https://www.boolbang.com"];
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin);
}

const MAX_BYTES = 2 * 1024 * 1024; // 1장 2MB (페이지에서 줄여서 보내므로 보통 수백 KB)

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

// 파일 앞부분(매직 바이트)으로 진짜 이미지인지 확인 — 확장자/타입 속이기 방지
function detectImage(bytes) {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return { ext: "webp", type: "image/webp" };
  return null;
}

async function verifyTurnstile(token, secret, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return data.success === true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!isAllowedOrigin(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/upload") {
      return json({ error: "not_found" }, 404, origin);
    }

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > MAX_BYTES + 64 * 1024) return json({ error: "too_large" }, 413, origin);

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return json({ error: "bad_request" }, 400, origin);
    }
    const file = form.get("file");
    const token = form.get("token");
    if (!file || typeof file === "string" || !token) {
      return json({ error: "bad_request" }, 400, origin);
    }
    if (file.size > MAX_BYTES) return json({ error: "too_large" }, 413, origin);

    // 봇 차단: Turnstile 토큰 검증 (토큰은 1회용)
    const ip = request.headers.get("CF-Connecting-IP");
    const human = await verifyTurnstile(String(token), env.TURNSTILE_SECRET, ip);
    if (!human) return json({ error: "captcha" }, 403, origin);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = detectImage(bytes);
    if (!kind) return json({ error: "not_image" }, 415, origin);

    // guestbook/2026/09/<랜덤ID>.webp 형태로 저장
    const now = new Date();
    const key =
      "guestbook/" +
      now.getUTCFullYear() + "/" +
      String(now.getUTCMonth() + 1).padStart(2, "0") + "/" +
      crypto.randomUUID() + "." + kind.ext;

    await env.BUCKET.put(key, bytes, {
      httpMetadata: {
        contentType: kind.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    return json({ url: PUBLIC_BASE + "/" + key }, 200, origin);
  },
};
