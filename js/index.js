let postList = [];
let postId = 1;
let currentViewIndex = null;
let isEditing = false;
let editingPostId = null;
let currentPage = 1;
const postsPerPage = 5;

let currentPostPageIndex = 0;
let currentPostPages = [];

const savedPosts = localStorage.getItem('postList');
if (savedPosts) {
  postList = JSON.parse(savedPosts);
  postId = postList.length > 0 ? Math.max(...postList.map(p => p.id)) + 1 : 1;
}
renderPosts();

function submitPost() {
  const writer = document.getElementById('postWriter').value.trim();
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const imageUrl = document.getElementById('postImageUrl').value.trim();

  if (!title || !content) {
    alert('제목과 내용을 모두 입력해주세요.');
    return;
  }

  const existingIndex = postList.findIndex(p => p.id === editingPostId);
  const existingPost = existingIndex !== -1 ? postList[existingIndex] : null;

  const post = {
    id: existingPost ? existingPost.id : postId++,
    title,
    content,
    image: imageUrl,
    author: writer || '익명',
    date: existingPost
      ? existingPost.date
      : new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
    views: existingPost ? existingPost.views : 0
  };

  if (existingIndex !== -1) {
    postList.splice(existingIndex, 1, post);
  } else {
    postList.unshift(post);
  }

  savePosts();
  renderPosts();
  clearWriteForm();
  closeWriteModal();

  isEditing = false;
  editingPostId = null;
  currentViewIndex = null;
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
      <td><a href="#" onclick="viewPostById(${post.id})">${post.title}</a></td>
      <td>${post.author}</td>
      <td>${post.date}</td>
      <td>${post.views}</td>
    `;
    tbody.appendChild(row);
  });

  renderPaginationControls();
}

function renderPaginationControls() {
  const totalPages = Math.ceil(postList.length / postsPerPage);
  const container = document.getElementById('pagination');
  if (!container) return;

  container.innerHTML = '';

  if (totalPages <= 1) return;

  if (currentPage > 1) {
    const prev = document.createElement('button');
    prev.textContent = '이전';
    prev.onclick = () => {
      currentPage--;
      renderPosts();
    };
    container.appendChild(prev);
  }

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` ${currentPage} / ${totalPages} `;
  container.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const next = document.createElement('button');
    next.textContent = '다음';
    next.onclick = () => {
      currentPage++;
      renderPosts();
    };
    container.appendChild(next);
  }
}

function viewPost(index) {
  const post = postList[index];
  post.views++;
  savePosts();
  renderPosts();

  currentViewIndex = index;

  // 글 페이지 분할
  const content = post.content.replace(/\n/g, '<br>');
  const pageSize = 500; // 글 한 페이지당 문자 수
  currentPostPages = [];

  for (let i = 0; i < content.length; i += pageSize) {
    currentPostPages.push(content.slice(i, i + pageSize));
  }

  currentPostPageIndex = 0;

  document.getElementById('modalTitle').textContent = post.title;
  document.getElementById('modalAuthor').textContent = post.author;
  document.getElementById('modalDate').textContent = post.date;

  renderPostPage();

  const img = document.getElementById('modalImage');
  if (post.image) {
    img.src = post.image;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  document.getElementById('postModal').style.display = 'block';
}

function renderPostPage() {
  const contentEl = document.getElementById('modalContent');
  contentEl.innerHTML = currentPostPages[currentPostPageIndex] || '';

  const controls = document.getElementById('postPagination');
  if (!controls) return;

  controls.innerHTML = '';

  if (currentPostPages.length <= 1) return;

  if (currentPostPageIndex > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.onclick = () => {
      currentPostPageIndex--;
      renderPostPage();
    };
    controls.appendChild(prevBtn);
  }

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` ${currentPostPageIndex + 1} / ${currentPostPages.length} `;
  controls.appendChild(pageInfo);

  if (currentPostPageIndex < currentPostPages.length - 1) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.onclick = () => {
      currentPostPageIndex++;
      renderPostPage();
    };
    controls.appendChild(nextBtn);
  }
}

function closeModal() {
  document.getElementById('postModal').style.display = 'none';
  currentViewIndex = null;
}

function editPost() {
  if (currentViewIndex === null) return;

  const post = postList[currentViewIndex];
  closeModal();
  document.getElementById('writeModal').style.display = 'block';

  document.getElementById('postWriter').value = post.author;
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postContent').value = post.content;
  document.getElementById('postImageUrl').value = post.image;

  isEditing = true;
  editingPostId = post.id;
}

function deletePost() {
  if (currentViewIndex === null) return;

  if (confirm('정말 이 글을 삭제하시겠습니까?')) {
    postList.splice(currentViewIndex, 1);
    savePosts();
    renderPosts();
    closeModal();
    currentViewIndex = null;
    isEditing = false;
    editingPostId = null;
  }
}

function viewPostById(id) {
  const index = postList.findIndex(p => p.id === id);
  if (index !== -1) {
    viewPost(index);
  }
}

function savePosts() {
  localStorage.setItem('postList', JSON.stringify(postList));
}

function clearWriteForm() {
  document.getElementById('postWriter').value = '';
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postImageUrl').value = '';
}

function closeWriteModal() {
  document.getElementById('writeModal').style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  if (idParam) {
    const index = postList.findIndex(p => String(p.id) === idParam);
    if (index !== -1) {
      viewPost(index);
    }
  }
});
