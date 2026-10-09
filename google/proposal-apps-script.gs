/**
 * 제안서 요청 접수 (Google Apps Script 웹 앱)
 *
 * 메인 페이지 "제안서" 모달에서 회사명·이메일을 보내면
 *   1) 이 스크립트가 붙은 구글 시트에 한 줄 기록하고
 *   2) NOTIFY_EMAIL로 알림 메일을 보낸다 (답장하면 요청한 사람에게 바로 감)
 *
 * 설치: 구글 시트 → 확장 프로그램 → Apps Script → 이 코드를 붙여넣고 저장
 *       → 배포 → 새 배포 → 유형 "웹 앱", 실행 계정 "나", 액세스 "모든 사용자"
 *       → 나온 웹 앱 URL을 index.html의 PROPOSAL_ENDPOINT에 넣는다.
 * 코드를 고친 뒤에는 배포 → 배포 관리 → 수정(연필) → 버전 "새 버전"으로 다시 배포해야 반영된다.
 */

const NOTIFY_EMAIL = "fromboolbang@gmail.com";
const SHEET_NAME = "제안서 요청";
const HEADER = ["요청 시각", "회사명", "이메일", "발송 완료"];
const SAME_EMAIL_WINDOW_SEC = 300; // 같은 이메일 재요청은 5분 동안 무시 (중복·연타 방지)
const MAX_MAILS_PER_HOUR = 20; // 시간당 알림 메일 상한 (도배 시 메일함 보호, 시트 기록은 계속)

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // 스팸봇만 채우는 숨은 칸 — 저장하지 않고 성공한 척
    if (data.hp) return json({ ok: true });

    const company = String(data.company || "").trim().slice(0, 50);
    const email = String(data.email || "").trim().slice(0, 100);
    if (!company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: "invalid" });
    }

    const cache = CacheService.getScriptCache();
    const dupKey = "pp_" + email.toLowerCase();
    if (cache.get(dupKey)) return json({ ok: true });
    cache.put(dupKey, "1", SAME_EMAIL_WINDOW_SEC);

    getSheet().appendRow([new Date(), safeCell(company), safeCell(email), ""]);

    const hourKey = "pp_mails_" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMddHH");
    const sent = Number(cache.get(hourKey) || 0);
    if (sent < MAX_MAILS_PER_HOUR) {
      cache.put(hourKey, String(sent + 1), 3600);
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: "[제안서 요청] " + company,
        body: [
          "boolbang.com에서 제안서 요청이 들어왔습니다.",
          "",
          "회사명: " + company,
          "이메일: " + email,
          "시각: " + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm"),
          "",
          "이 메일에 답장하면 요청한 분께 바로 보내집니다.",
          "요청 목록: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        ].join("\n"),
      });
    }

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server" });
  }
}

// 배포 주소를 브라우저로 열었을 때 동작 확인용
function doGet() {
  return json({ ok: true, service: "boolbang proposal" });
}

// 시트가 없으면 만들고 첫 줄에 제목을 넣는다
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// =, +, -, @로 시작하는 값은 시트가 수식으로 실행하므로 글자로 저장
function safeCell(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// 설치 직후 한 번 실행해서 메일·시트 권한을 승인하고 동작을 확인하는 용도
function testNotify() {
  doPost({ postData: { contents: JSON.stringify({ company: "테스트 회사", email: NOTIFY_EMAIL }) } });
}
