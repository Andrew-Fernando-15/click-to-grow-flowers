import * as THREE from 'https://cdn.skypack.dev/three@0.133.1/build/three.module.js';

const canvasEl = document.querySelector('#canvas');
const cleanBtn = document.querySelector('.clean-btn');

const pointer = {
  x: 0.66,
  y: 0.3,
  clicked: true,
};

// small auto-click for preview
window.setTimeout(() => {
  pointer.x = 0.75;
  pointer.y = 0.5;
  pointer.clicked = true;
}, 700);

let basicMaterial;
let shaderMaterial;

const renderer = new THREE.WebGLRenderer({
  canvas: canvasEl,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const sceneShader = new THREE.Scene();
const sceneBasic = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
const clock = new THREE.Clock();

let renderTargets = [
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
];

createPlane();
updateSize();

window.addEventListener('resize', () => {
  updateSize();
  cleanCanvas();
});

render();

let isTouchScreen = false;

window.addEventListener('click', (e) => {
  if (!isTouchScreen) {
    pointer.x = e.pageX / window.innerWidth;
    pointer.y = e.pageY / window.innerHeight;
    pointer.clicked = true;
  }
});

window.addEventListener('touchstart', (e) => {
  isTouchScreen = true;
  pointer.x = e.targetTouches[0].pageX / window.innerWidth;
  pointer.y = e.targetTouches[0].pageY / window.innerHeight;
  pointer.clicked = true;
});

cleanBtn.addEventListener('click', cleanCanvas);

function cleanCanvas() {
  pointer.vanishCanvas = true;
  setTimeout(() => {
    pointer.vanishCanvas = false;
  }, 50);
}

function createPlane() {
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_stop_time: { type: 'f', value: 0 },
      u_stop_randomizer: {
        type: 'v2',
        value: new THREE.Vector2(Math.random(), Math.random()),
      },
      u_cursor: {
        type: 'v2',
        value: new THREE.Vector2(pointer.x, pointer.y),
      },
      u_ratio: { type: 'f', value: window.innerWidth / window.innerHeight },
      u_texture: { type: 't', value: null },
      u_clean: { type: 'f', value: 1 },
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
  });

  basicMaterial = new THREE.MeshBasicMaterial();

  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const planeBasic = new THREE.Mesh(planeGeometry, basicMaterial);
  const planeShader = new THREE.Mesh(planeGeometry, shaderMaterial);

  sceneBasic.add(planeBasic);
  sceneShader.add(planeShader);
}

function render() {
  shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1;
  shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;

  if (pointer.clicked) {
    shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(
      pointer.x,
      1 - pointer.y
    );
    shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(
      Math.random(),
      Math.random()
    );
    shaderMaterial.uniforms.u_stop_time.value = 0;
    pointer.clicked = false;
  }

  shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();

  renderer.setRenderTarget(renderTargets[1]);
  renderer.render(sceneShader, camera);
  basicMaterial.map = renderTargets[1].texture;
  renderer.setRenderTarget(null);
  renderer.render(sceneBasic, camera);

  const tmp = renderTargets[0];
  renderTargets[0] = renderTargets[1];
  renderTargets[1] = tmp;

  requestAnimationFrame(render);
}

function updateSize() {
  if (!shaderMaterial) return;
  shaderMaterial.uniforms.u_ratio.value =
    window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const hintText = document.getElementById('hint-text');

// hide the "Click To Add Flowers" text after 3 seconds
setTimeout(() => {
  if (hintText) {
    hintText.style.opacity = '0';
    hintText.style.transition = 'opacity 0.5s ease';
    // or to completely remove:
    // hintText.style.display = 'none';
  }
}, 2000);
