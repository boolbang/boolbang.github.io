// three.js의 코드를 참조 하였습니다.

let scene, camera, renderer, mixer;
let horses = [];
const horseCount = 10;
const clock = new THREE.Clock();
let raceStarted = false;
const snowflakes = [];

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 10, 30);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x000000);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.id = "labelCanvas";
  labelCanvas.style.position = "absolute";
  labelCanvas.style.top = 0;
  labelCanvas.style.left = 0;
  labelCanvas.style.pointerEvents = "none";
  labelCanvas.width = window.innerWidth;
  labelCanvas.height = window.innerHeight;
  document.body.appendChild(labelCanvas);
  const labelCtx = labelCanvas.getContext("2d");

  const numberColors = [
    "#ffffff", "#ff4444", "#44ff44", "#4444ff", "#ffff44",
    "#ff44ff", "#44ffff", "#ffaa00", "#00ffaa", "#aa00ff"
  ];

  for (let i = 0; i < horseCount; i++) {
    const label = document.createElement("label");
    label.textContent = `${i + 1}등:`;
    Object.assign(label.style, {
      position: "absolute",
      top: `${10 + i * 30}px`,
      left: "10px",
      color: "white",
      zIndex: 10
    });
    document.body.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = 10;
    input.id = `rankInput_${i + 1}`;
    Object.assign(input.style, {
      position: "absolute",
      top: `${10 + i * 30}px`,
      left: "60px",
      width: "40px",
      zIndex: 10
    });
    document.body.appendChild(input);
  }

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "순위 적용";
  Object.assign(applyBtn.style, {
    position: "absolute",
    top: "10px",
    left: "120px",
    padding: "5px 10px",
    zIndex: 10
  });
  document.body.appendChild(applyBtn);
  applyBtn.addEventListener("click", updateRanking);

  const resultBtn = document.createElement("button");
  resultBtn.textContent = "결과 보기";
  resultBtn.style.position = "absolute";
  resultBtn.style.top = "10px";
  resultBtn.style.left = "640px";
  resultBtn.style.zIndex = 10;
  document.body.appendChild(resultBtn);
  resultBtn.addEventListener("click", showResult);

  const resetButton = document.createElement("button");
  resetButton.textContent = "초기화";
  resetButton.style.position = "absolute";
  resetButton.style.top = "10px";
  resetButton.style.left = "540px";
  resetButton.style.zIndex = 10;
  document.body.appendChild(resetButton);
  resetButton.addEventListener("click", () => {
    horses.forEach(horse => {
      gsap.to(horse.mesh.position, { x: 0, duration: 1 });
    });
    for (let i = 0; i < horseCount; i++) {
      const input = document.getElementById(`rankInput_${i + 1}`);
      if (input) input.value = "";
    }
    const res = document.getElementById("resultBox");
    if (res) res.innerHTML = "";
  });

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1.0;
  controls.enablePan = true;

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(100, 0.3, 40),
    new THREE.MeshStandardMaterial({ color: 0xcccccc })
  );
  ground.position.y = -0.15;
  scene.add(ground);

  const finishLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 35),
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
  );
  finishLine.rotation.x = -Math.PI / 2;
  finishLine.position.set(30.5, 0.01, 0);
  scene.add(finishLine);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  const snowGeo = new THREE.BufferGeometry();
  const snowCount = 500;
  const snowPositions = new Float32Array(snowCount * 3);

  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = Math.random() * 100 - 50;
    snowPositions[i * 3 + 1] = Math.random() * 50 + 10;
    snowPositions[i * 3 + 2] = Math.random() * 100 - 50;
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snowMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
  const snow = new THREE.Points(snowGeo, snowMaterial);
  scene.add(snow);
  snowflakes.push({ geometry: snowGeo, points: snow });

  const loader = new THREE.GLTFLoader();
  loader.load("../models/horse_run.glb", (gltf) => {
    const baseModel = gltf.scene;
    baseModel.traverse(obj => {
      if (obj.isMesh) obj.castShadow = true;
    });

    for (let i = 0; i < horseCount; i++) {
      const horse = baseModel.clone();
      horse.scale.set(0.1, 0.1, 0.1);
      horse.rotation.y = Math.PI / 2;
      horse.position.set(0, 0, -i * 2.5 + 12);
      scene.add(horse);

      const localMixer = new THREE.AnimationMixer(horse);
      gltf.animations.forEach(clip => localMixer.clipAction(clip).play());
      horses.push({ id: i + 1, mesh: horse, mixer: localMixer });
    }

    const resultBox = document.createElement("div");
    resultBox.id = "resultBox";
    Object.assign(resultBox.style, {
      position: "absolute",
      top: "340px",
      left: "10px",
      color: "yellow",
      fontSize: "16px",
      fontWeight: "bold",
      whiteSpace: "pre-line",
      zIndex: 10
    });
    document.body.appendChild(resultBox);
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelCanvas.width = window.innerWidth;
    labelCanvas.height = window.innerHeight;
  });

  animate();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    horses.forEach(h => h.mixer.update(delta));
    renderer.render(scene, camera);
    updateLabels();

    // ❄️ 눈 내림 목록 복잡
    const pos = snowflakes[0].geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] -= 0.03;
      if (pos.array[i * 3 + 1] < 0) {
        pos.array[i * 3 + 1] = Math.random() * 50 + 10;
      }
    }
    pos.needsUpdate = true;
  }

  function updateLabels() {
    labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    labelCtx.font = "bold 24px Pretendard, sans-serif";
    labelCtx.textAlign = "center";
    labelCtx.textBaseline = "middle"; // 수직 중앙 정렬
  
    horses.forEach(horse => {
      const pos = new THREE.Vector3();
      horse.mesh.getWorldPosition(pos);
      pos.y += 1.2;
      pos.project(camera);
  
      const x = (pos.x * 0.5 + 0.5) * labelCanvas.width;
      const y = (-pos.y * 0.5 + 0.5) * labelCanvas.height;
  
      if (pos.z < 1) {
        const color = numberColors[(horse.id - 1) % numberColors.length];
  
        // 🔵 동그란 배경
        labelCtx.beginPath();
        labelCtx.arc(x, y, 16, 0, Math.PI * 2);
        labelCtx.fillStyle = "#000000bb"; // 반투명 검정 배경
        labelCtx.fill();
  
        // 숫자 텍스트
        labelCtx.fillStyle = color;
        labelCtx.fillText(horse.id.toString(), x, y);
      }
    });
  }
  
}

function updateRanking() {
  const rankArray = Array(horseCount).fill(null);

  for (let i = 0; i < horseCount; i++) {
    const input = document.getElementById(`rankInput_${i + 1}`);
    const horseId = parseInt(input.value);
    if (!isNaN(horseId) && horseId >= 1 && horseId <= horseCount) {
      rankArray[i] = horseId;
    }
  }

  rankArray.forEach((horseId, rankIndex) => {
    if (horseId !== null) {
      const horse = horses.find(h => h.id === horseId);
      if (horse) {
        const targetX = -(rankIndex) * 5 + 30.5;
        gsap.to(horse.mesh.position, { x: targetX, duration: 1.5, ease: "power2.out" });
      }
    }
  });
}

function showResult() {
  const resultBox = document.getElementById("resultBox");
  const lines = [];
  for (let i = 0; i < horseCount; i++) {
    const input = document.getElementById(`rankInput_${i + 1}`);
    const horseId = input.value;
    if (horseId) {
      lines.push(`${i + 1}등: ${horseId}번 말`);
    }
  }
  resultBox.innerText = lines.join("\n");
}
