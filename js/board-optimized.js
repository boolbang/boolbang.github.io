import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, query, getDocs, getDoc, doc,
  orderBy, updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqAQCELh1q2pWxrXtx-8lBwRe2CTSG_HdQ",
  authDomain: "boolbang-board.firebaseapp.com",
  projectId: "boolbang-board",
  storageBucket: "boolbang-board.appspot.com",
  messagingSenderId: "1563061617526",
  appId: "1:1563061617526:web:066768f311fc53cd017257"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let postList = [];
let currentPage = 1;
const postsPerPage = 10;
let currentPostPages = [];
let currentPostPageIndex = 0;

// 🔽 글 목록 가져오기
async function fetchPosts() {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  postList = querySnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  renderPosts();
}

function renderPosts() {
  const tbody = document.querySelector('#postTable tbody');
  tbody.innerHTML = '';
  const start = (currentPage - 1) * postsPerPage;
  const end = start + postsPerPage;
  const paginatedPosts = postList.slice(start, end);

  paginatedPosts.forEach((post, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${postList.length - (start + index)}</td>
      <td><a href="#" onclick="viewPostById('${post.id}')">${post.title}</a></td>
      <td data-label="작성자">${post.author}</td>
      <td>${post.date || formatDate(post.createdAt)}</td>
      <td>${typeof post.views === 'number' ? post.views : 0}</td>
    `;
    tbody.appendChild(row);
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  const totalPages = Math.ceil(postList.length / postsPerPage);
  const container = document.getElementById('pagination');
  container.innerHTML = '';
  if (totalPages <= 1) return;

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = '이전';
    prev.onclick = () => { currentPage--; renderPosts(); };
    container.appendChild(prev);
  }

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` ${currentPage} / ${totalPages} `;
  container.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const next = document.createElement('button');
    next.textContent = '다음';
    next.onclick = () => { currentPage++; renderPosts(); };
    container.appendChild(next);
  }
}

// 🔍 상세 보기 클릭 시 본문/이미지 로드
async function viewPostById(postId) {
  const docRef = doc(db, "posts", postId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return alert("글을 찾을 수 없습니다.");

  const post = snap.data();
  const currentViews = typeof post.views === 'number' ? post.views : 0;
  const newViews = currentViews + 1;

  try {
    await updateDoc(docRef, { views: newViews });
    post.views = newViews;
  } catch (e) {
    console.error("조회수 업데이트 실패:", e);
  }

  document.getElementById('modalTitle').textContent = post.title;
  document.getElementById('modalAuthor').textContent = post.author;
  document.getElementById('modalDate').textContent = post.date || formatDate(post.createdAt);

  const rawContent = post.content || '';
  const contentPages = rawContent.split(/\[\[PAGE\]\]/i).map(p => parseMedia(p.trim()));
  currentPostPages = contentPages;
  currentPostPageIndex = 0;
  renderPostPage();

  const imageContainer = document.getElementById('modalImage');
  imageContainer.innerHTML = '';

  if (Array.isArray(post.images)) {
    post.images.forEach((url) => {
      const img = document.createElement('img');
      img.src = url;
      img.loading = "lazy";
      imageContainer.appendChild(img);
    });
  } else if (post.image) {
    const img = document.createElement('img');
    img.src = post.image;
    img.loading = "lazy";
    imageContainer.appendChild(img);
  }

  document.getElementById('postModal').style.display = 'block';
}

function renderPostPage() {
  const contentEl = document.getElementById('modalContent');
  contentEl.innerHTML = currentPostPages[currentPostPageIndex] || '';
  const controls = document.getElementById('postPagination');
  controls.innerHTML = '';

  if (currentPostPages.length <= 1) return;

  if (currentPostPageIndex > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.onclick = () => { currentPostPageIndex--; renderPostPage(); };
    controls.appendChild(prevBtn);
  }

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` ${currentPostPageIndex + 1} / ${currentPostPages.length} `;
  controls.appendChild(pageInfo);

  if (currentPostPageIndex < currentPostPages.length - 1) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.onclick = () => { currentPostPageIndex++; renderPostPage(); };
    controls.appendChild(nextBtn);
  }
}

function closeModal() {
  document.getElementById('postModal').style.display = 'none';
   fetchPosts();
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.seconds) return '';
  const date = new Date(timestamp.seconds * 1000);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Asia/Seoul'
  }).format(date);
}

function parseMedia(content) {
  let parsed = content.replace(/\n/g, '<br>');
  parsed = parsed.replace(/(https?:\/\/[^\s<]+?\.(jpg|jpeg|png|gif|webp|bmp|svg))/gi,
    (_, url) => `<img src="${url}" style="max-width:100%; margin:10px auto; display:block;" loading="lazy" />`);
  parsed = parsed.replace(/(https?:\/\/[^\s<]*(gstatic\.com|googleusercontent\.com)[^\s<]*)/gi,
    (_, url) => `<img src="${url}" style="max-width:100%; margin:10px auto; display:block;" loading="lazy" />`);
  parsed = parsed.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)[^\s<]*/g,
    (_, videoId) => `<div class="youtube-wrap"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>`);
  parsed = parsed.replace(/https?:\/\/youtu\.be\/([\w-]+)[^\s<]*/g,
    (_, videoId) => `<div class="youtube-wrap"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe></div>`);
  parsed = parsed.replace(/(?<!src=")(https?:\/\/[^\s<]+)(?![^>]*>)/g,
    '<a href="$1" target="_blank">$1</a>');
  return parsed;
}

window.viewPostById = viewPostById;
window.closeModal = closeModal;

window.addEventListener('DOMContentLoaded', () => {
  fetchPosts().then(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) viewPostById(postId);
  });
});
