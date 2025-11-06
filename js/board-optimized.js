import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  orderBy,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";
import { parseMedia, formatDate } from "./utils.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let postList = [];
let currentPage = 1;
const postsPerPage = 10;
let currentPostPages = [];
let currentPostPageIndex = 0;

async function fetchPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  const querySnapshot = await getDocs(q);

  postList = querySnapshot.docs.map((docSnap) => {
    const { title, author, createdAt, date, views } = docSnap.data();
    return {
      id: docSnap.id,
      title,
      author,
      createdAt,
      date,
      views,
    };
  });

  renderPosts();
}

function renderPosts() {
  const tbody = document.querySelector("#postTable tbody");
  tbody.innerHTML = "";
  const start = (currentPage - 1) * postsPerPage;
  const end = start + postsPerPage;
  const paginatedPosts = postList.slice(start, end);

  paginatedPosts.forEach((post, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${postList.length - (start + index)}</td>
      <td><a href="#" onclick="viewPostById('${post.id}')">${
      post.title
    }</a></td>
      <td data-label="작성자">${post.author}</td>
      <td>${post.date || formatDate(post.createdAt)}</td>
      <td>${typeof post.views === "number" ? post.views : 0}</td>
    `;
    tbody.appendChild(row);
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  const totalPages = Math.ceil(postList.length / postsPerPage);
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  if (totalPages <= 1) return;

  if (currentPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "이전";
    prev.onclick = () => {
      currentPage--;
      renderPosts();
    };
    container.appendChild(prev);
  }

  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` ${currentPage} / ${totalPages} `;
  container.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const next = document.createElement("button");
    next.textContent = "다음";
    next.onclick = () => {
      currentPage++;
      renderPosts();
    };
    container.appendChild(next);
  }
}

async function viewPostById(postId) {
  const docRef = doc(db, "posts", postId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return alert("글을 찾을 수 없습니다.");

  const post = snap.data();
  const currentViews = typeof post.views === "number" ? post.views : 0;
  const newViews = currentViews + 1;

  try {
    await updateDoc(docRef, { views: newViews });
    post.views = newViews;
  } catch (e) {
    console.error("조회수 업데이트 실패:", e);
  }

  document.getElementById("modalTitle").textContent = post.title;
  document.getElementById("modalAuthor").textContent = post.author;
  document.getElementById("modalDate").textContent =
    post.date || formatDate(post.createdAt);

  const rawContent = post.content || "";
  const contentPages = rawContent
    .split(/\[\[PAGE\]\]/i)
    .map((p) => parseMedia(p.trim()));
  currentPostPages = contentPages;
  currentPostPageIndex = 0;
  renderPostPage();

  const imageContainer = document.getElementById("modalImage");
  imageContainer.innerHTML = "";

  if (Array.isArray(post.images)) {
    post.images.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      img.loading = "lazy";
      imageContainer.appendChild(img);
    });
  } else if (post.image) {
    const img = document.createElement("img");
    img.src = post.image;
    img.loading = "lazy";
    imageContainer.appendChild(img);
  }

  document.getElementById("postModal").style.display = "block";
}

function renderPostPage() {
  const contentEl = document.getElementById("modalContent");
  contentEl.innerHTML = currentPostPages[currentPostPageIndex] || "";
  const controls = document.getElementById("postPagination");
  controls.innerHTML = "";

  if (currentPostPages.length <= 1) return;

  if (currentPostPageIndex > 0) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "이전";
    prevBtn.onclick = () => {
      currentPostPageIndex--;
      renderPostPage();
    };
    controls.appendChild(prevBtn);
  }

  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` ${currentPostPageIndex + 1} / ${
    currentPostPages.length
  } `;
  controls.appendChild(pageInfo);

  if (currentPostPageIndex < currentPostPages.length - 1) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "다음";
    nextBtn.onclick = () => {
      currentPostPageIndex++;
      renderPostPage();
    };
    controls.appendChild(nextBtn);
  }
}

function closeModal() {
  document.getElementById("postModal").style.display = "none";
  fetchPosts();
}

// formatDate와 parseMedia 함수는 utils.js에서 import

window.viewPostById = viewPostById;
window.closeModal = closeModal;

window.addEventListener("DOMContentLoaded", () => {
  fetchPosts().then(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");
    if (postId) viewPostById(postId);
  });
});
