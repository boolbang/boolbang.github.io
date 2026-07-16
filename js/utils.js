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
