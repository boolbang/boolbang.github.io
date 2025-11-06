/**
 * 공통 유틸리티 함수 모음
 */

/**
 * 텍스트 내의 미디어 URL을 HTML로 변환
 * @param {string} content - 변환할 텍스트 내용
 * @returns {string} - HTML로 변환된 내용
 */
export function parseMedia(content) {
  let parsed = content.replace(/\n/g, "<br>");

  // 이미지 URL 파싱 (일반 이미지 확장자)
  parsed = parsed.replace(
    /(https?:\/\/[^\s<]+?\.(jpg|jpeg|png|gif|webp|bmp|svg))/gi,
    (_, url) =>
      `<img src="${url}" style="max-width:100%; margin:10px auto; display:block;" loading="lazy" />`
  );

  // Google 이미지 URL 파싱
  parsed = parsed.replace(
    /(https?:\/\/[^\s<]*(gstatic\.com|googleusercontent\.com)[^\s<]*)/gi,
    (_, url) =>
      `<img src="${url}" style="max-width:100%; margin:10px auto; display:block;" loading="lazy" />`
  );

  // YouTube 표준 URL 파싱
  parsed = parsed.replace(
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)[^\s<]*/g,
    (_, videoId) =>
      `<div class="youtube-wrap"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>`
  );

  // YouTube 단축 URL 파싱
  parsed = parsed.replace(
    /https?:\/\/youtu\.be\/([\w-]+)[^\s<]*/g,
    (_, videoId) =>
      `<div class="youtube-wrap"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>`
  );

  // 일반 링크를 <a> 태그로 변환 (이미 src에 포함된 것 제외)
  parsed = parsed.replace(
    /(?<!src=")(https?:\/\/[^\s<]+)(?![^>]*>)/g,
    '<a href="$1" target="_blank">$1</a>'
  );

  return parsed;
}

/**
 * Firebase Timestamp를 포맷된 날짜 문자열로 변환
 * @param {object} timestamp - Firebase Timestamp 객체
 * @returns {string} - 포맷된 날짜 문자열
 */
export function formatDate(timestamp) {
  if (!timestamp || !timestamp.seconds) return "";
  const date = new Date(timestamp.seconds * 1000);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

/**
 * 모달 열기
 * @param {HTMLElement} modal - 모달 요소
 */
export function openModal(modal) {
  if (modal) {
    modal.style.display = "block";
    history.pushState({ modal: true }, "", "#modal");
  }
}

/**
 * 모달 닫기
 * @param {HTMLElement} modal - 모달 요소
 */
export function closeModal(modal) {
  if (modal) {
    modal.style.display = "none";
    if (window.location.hash === "#modal") {
      history.back();
    }
  }
}

/**
 * 모달 이벤트 리스너 설정
 * @param {HTMLElement} modal - 모달 요소
 * @param {HTMLElement} closeButton - 닫기 버튼 요소
 */
export function setupModalListeners(modal, closeButton) {
  if (!modal) return;

  // 닫기 버튼 클릭
  if (closeButton) {
    closeButton.addEventListener("click", () => closeModal(modal));
  }

  // 배경 클릭시 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  // 뒤로가기 버튼 처리
  window.addEventListener("popstate", () => {
    if (modal.style.display === "block") {
      modal.style.display = "none";
    }
  });
}
