let scene, camera, renderer, mixer, controls;
const clock = new THREE.Clock();
let model;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isJumping = false;
let isRunning = false;
let velocityY = 0;
const gravity = -0.01;
const jumpPower = 0.25;
let gameOver = false;
let gameStarted = false;
let lastFootprintPos = null;
const footprintSpacing = 1.5;
let walkAction, runAction;

const holes = [];
let holesAvoided = 0;

init();
animate();

function onGameOver(reasonText) {
  if (gameOver) return;
  gameOver = true;

  const overlay = document.getElementById('rankingOverlay');
  if (overlay) {
    overlay.style.display = 'flex'; 
    setTimeout(() => overlay.classList.add('show'), 10); 
  }

  // ✅  랭킹 데이터 불러오기
  if (typeof loadRanking === "function") loadRanking();

  // ✅  점수 입력 받기
  const score = holesAvoided;
  const name = prompt(`${reasonText}\n당신의 똘배지수: ${score}\n닉네임을 입력하세요:`);

  // ✅  점수 저장
  if (name && typeof saveScore === "function") {
  saveScore(name, score)
  .then(() => {
    setTimeout(() => window.location.reload(), 5000);
  })
  .catch((err) => {
    alert("❌ 점수 저장 실패: " + err);
    setTimeout(() => window.location.reload(), 5000);
  });

  } else {
    setTimeout(() => window.location.reload(), 5000);
  }
}


function createHoles() {
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;

    const preview = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 32),
      new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.5 })
    );
    preview.rotation.x = -Math.PI / 2;
    preview.position.set(x, 0.01, z);
    scene.add(preview);

    setTimeout(() => {
      scene.remove(preview);
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(4.8, 32),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB })
      );
      hole.rotation.x = -Math.PI / 2;
      hole.position.set(x, 0.01, z);
      hole.userData.radius = 4.8;
      scene.add(hole);
      holes.push(hole);
    }, 1000);
  }
}

function checkHoleCollision() {
  if (!model) return;
  const pos = model.position;
  for (let hole of holes) {
    const dx = pos.x - hole.position.x;
    const dz = pos.z - hole.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const radius = hole.userData.radius || 4.8;
    if (!isJumping && distance < radius * 0.95) {
      onGameOver("☠️ 세상이 날 억까하네 ㅠㅠ");
      break;
    }
  }
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 1, 0);
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const loader = new THREE.GLTFLoader();
  loader.load('../models/run_ps2.glb', function (gltf) {
    model = gltf.scene;
    model.scale.set(3.9, 3.9, 3.9);
    model.position.set(0, 0, 0);
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;
    walkAction = mixer.clipAction(animations[0]);
    runAction = mixer.clipAction(animations[0]);
    walkAction.play();
  });

 setInterval(() => {
  if (gameStarted && !gameOver) {
    createHoles();
    holesAvoided += 10;
  }
}, 5000);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (model && gameStarted && !gameOver) {
    // 캐릭터 움직임, 점프, 중력, 충돌 등
    const baseSpeed = 0.1;
    const runSpeed = 0.2;
    const moveSpeed = isRunning ? runSpeed : baseSpeed;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const side = new THREE.Vector3().copy(dir).cross(new THREE.Vector3(0, 1, 0));
    let moveVector = new THREE.Vector3();

    if (moveForward) moveVector.add(dir);
    if (moveBackward) moveVector.sub(dir);
    if (moveLeft) moveVector.sub(side);
    if (moveRight) moveVector.add(side);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(moveSpeed);
      model.position.add(moveVector);
      model.lookAt(model.position.clone().add(moveVector));
      maybeLeaveFootprint();
    }

    velocityY += gravity;
    model.position.y += velocityY;

    const onGround = model.position.y <= 0 && Math.abs(model.position.x) <= 50 && Math.abs(model.position.z) <= 50;
    if (onGround) {
      model.position.y = 0;
      velocityY = 0;
      isJumping = false;
    }

    checkHoleCollision();

    if (model.position.y < -5) {
      onGameOver("💀 거길 왜 떨어져? 염소니?");
    }
  }

  controls.update();
  renderer.render(scene, camera);
}


function maybeLeaveFootprint() {
  const currentPos = new THREE.Vector3(model.position.x, 0, model.position.z);
  if (!lastFootprintPos || currentPos.distanceTo(lastFootprintPos) > footprintSpacing) {
    leaveFootprint(currentPos);
    lastFootprintPos = currentPos.clone();
  }
}

function leaveFootprint(pos) {
  const geom = new THREE.CircleGeometry(0.15, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pos.x, 0.01, pos.z);
  scene.add(mesh);
}

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('titleScreen').style.display = 'none';
  const bgm = document.getElementById('bgm');
  bgm.volume = 0.3;
  bgm.play().catch(err => console.error('BGM 재생 실패:', err));
  gameStarted = true; 
});

document.addEventListener('keydown', e => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': moveForward = true; break;
    case 'KeyS': case 'ArrowDown': moveBackward = true; break;
    case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
    case 'KeyD': case 'ArrowRight': moveRight = true; break;
    case 'ShiftLeft': case 'ShiftRight': isRunning = true; break;
    case 'Space':
      if (!isJumping && model) {
        velocityY = jumpPower;
        isJumping = true;
      }
      break;
  }
});

document.addEventListener('keyup', e => {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp': moveForward = false; break;
    case 'KeyS': case 'ArrowDown': moveBackward = false; break;
    case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
    case 'KeyD': case 'ArrowRight': moveRight = false; break;
    case 'ShiftLeft': case 'ShiftRight': isRunning = false; break;
  }
});

const bindMobileButton = (id, downFn, upFn) => {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); downFn(); });
  el.addEventListener('touchend', e => { e.preventDefault(); if (upFn) upFn(); });
};

bindMobileButton('btn-run', () => isRunning = true, () => isRunning = false);
bindMobileButton('btn-jump', () => {
  if (!isJumping && model) {
    velocityY = jumpPower;
    isJumping = true;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
