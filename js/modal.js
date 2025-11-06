/**
 * 재사용 가능한 모달 컴포넌트
 */

import { parseMedia } from "./utils.js";

/**
 * 게시물 모달 클래스
 */
export class PostModal {
  constructor(modalId = "modal") {
    this.modal = document.getElementById(modalId);
    this.modalTitle = document.getElementById("modalTitle");
    this.modalDate = document.getElementById("modalDate");
    this.modalContent = document.getElementById("modalContent");
    this.modalImage = document.getElementById("modalImage");
    this.closeButton = document.getElementById("closeButton");

    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    if (!this.modal) return;

    // 닫기 버튼
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.close());
    }

    // 배경 클릭시 닫기
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // 뒤로가기 버튼 처리
    window.addEventListener("popstate", () => {
      if (this.modal.style.display === "block") {
        this.modal.style.display = "none";
      }
    });
  }

  /**
   * 모달 열기
   * @param {object} postData - 게시물 데이터
   */
  open(postData) {
    if (!this.modal) return;

    // 제목 설정 ([WORKS] 태그 제거)
    let title = postData.title || "제목 없음";
    title = title.replace(/\[WORKS\]/gi, "").trim();
    if (this.modalTitle) {
      this.modalTitle.textContent = title;
    }

    // 날짜 설정
    if (this.modalDate) {
      this.modalDate.textContent = postData.date || "";
    }

    // 내용 설정 (미디어 파싱)
    if (this.modalContent) {
      const rawContent = postData.content || "";
      this.modalContent.innerHTML = parseMedia(rawContent);
    }

    // 이미지 설정
    if (this.modalImage) {
      this.modalImage.innerHTML = "";

      if (Array.isArray(postData.images) && postData.images.length > 0) {
        postData.images.forEach((url) => {
          const img = document.createElement("img");
          img.src = url;
          img.loading = "lazy";
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          img.style.display = "block";
          img.style.margin = "10px auto";
          this.modalImage.appendChild(img);
        });
      } else if (postData.image) {
        const img = document.createElement("img");
        img.src = postData.image;
        img.loading = "lazy";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "10px auto";
        this.modalImage.appendChild(img);
      }
    }

    // 모달 표시
    this.modal.style.display = "block";
    history.pushState({ modal: true }, "", "#modal");
  }

  /**
   * 모달 닫기
   */
  close() {
    if (!this.modal) return;

    this.modal.style.display = "none";
    if (window.location.hash === "#modal") {
      history.back();
    }
  }
}

/**
 * 페이지네이션을 지원하는 게시물 모달 클래스
 */
export class PaginatedPostModal extends PostModal {
  constructor(modalId = "postModal") {
    super(modalId);
    this.currentPages = [];
    this.currentPageIndex = 0;
    this.paginationContainer = document.getElementById("postPagination");
  }

  /**
   * 모달 열기 (페이지네이션 지원)
   * @param {object} postData - 게시물 데이터
   */
  open(postData) {
    if (!this.modal) return;

    // 제목 설정
    if (this.modalTitle) {
      this.modalTitle.textContent = postData.title || "제목 없음";
    }

    // 작성자 설정 (있는 경우)
    const modalAuthor = document.getElementById("modalAuthor");
    if (modalAuthor) {
      modalAuthor.textContent = postData.author || "";
    }

    // 날짜 설정
    if (this.modalDate) {
      this.modalDate.textContent = postData.date || "";
    }

    // 내용을 페이지로 분할
    const rawContent = postData.content || "";
    this.currentPages = rawContent
      .split(/\[\[PAGE\]\]/i)
      .map((p) => parseMedia(p.trim()));
    this.currentPageIndex = 0;
    this.renderPage();

    // 이미지 설정
    if (this.modalImage) {
      this.modalImage.innerHTML = "";

      if (Array.isArray(postData.images)) {
        postData.images.forEach((url) => {
          const img = document.createElement("img");
          img.src = url;
          img.loading = "lazy";
          this.modalImage.appendChild(img);
        });
      } else if (postData.image) {
        const img = document.createElement("img");
        img.src = postData.image;
        img.loading = "lazy";
        this.modalImage.appendChild(img);
      }
    }

    // 모달 표시
    this.modal.style.display = "block";
  }

  /**
   * 현재 페이지 렌더링
   */
  renderPage() {
    if (!this.modalContent) return;

    this.modalContent.innerHTML = this.currentPages[this.currentPageIndex] || "";
    this.renderPagination();
  }

  /**
   * 페이지네이션 컨트롤 렌더링
   */
  renderPagination() {
    if (!this.paginationContainer) return;

    this.paginationContainer.innerHTML = "";

    if (this.currentPages.length <= 1) return;

    // 이전 버튼
    if (this.currentPageIndex > 0) {
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "이전";
      prevBtn.onclick = () => {
        this.currentPageIndex--;
        this.renderPage();
      };
      this.paginationContainer.appendChild(prevBtn);
    }

    // 페이지 정보
    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` ${this.currentPageIndex + 1} / ${
      this.currentPages.length
    } `;
    this.paginationContainer.appendChild(pageInfo);

    // 다음 버튼
    if (this.currentPageIndex < this.currentPages.length - 1) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "다음";
      nextBtn.onclick = () => {
        this.currentPageIndex++;
        this.renderPage();
      };
      this.paginationContainer.appendChild(nextBtn);
    }
  }
}
