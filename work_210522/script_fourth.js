import { DragControls } from '../../lib/DragControls.js';

// ページの読み込みを待つ
(() => {
    window.addEventListener('DOMContentLoaded', () => {
        init();

        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                default:
            }
        }, false);
        window.addEventListener('keyup', (event) => {
            isDown = false;
        }, false);

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        run = true;
        render();

    }, false);

    let run = true;
    let isDown = false;

    let scene;
    let camera;
    let renderer;
    let geometry;
    let material;
    let boxControls;
    let group;
    let enableSelection = false;

    const raycaster = new THREE.Raycaster();

    const CAMERA_PARAM = {
        fovy: 30,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        x: 5.0,
        y: 5.0,
        z: 10.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    const RENDERER_PARAM = {
        // clearColor: 0x0E1544,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    function init() {
        scene = new THREE.Scene();

        // canvas 要素の参照を取得する
        const canvas = document.querySelector('#webgl');

        // マウス座標管理用のベクトルを作成
        const mouse = new THREE.Vector2();

        // レンダラーを作成
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true, // シーンを透過
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);

        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);

        // グループを作る
        group = new THREE.Group();
        // 3D空間にグループを追加する
        scene.add(group);

        // box
        geometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);
        // マウスとの交差を調べたいものは配列に格納する
        const meshList = [];
        for (let i = 0; i < 10; i++) {
            material = new THREE.MeshToonMaterial({color: 0xffffff});

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.position.set(
                Math.random() * 5 - 2.5, // X座標
                Math.random() - 1, // Y座標
                Math.random() * 5 -2.5 // Z座標
            );

            mesh.scale.set((Math.random() - 0.5) * 5, 1.0, 1.0);
            group.add(mesh);

            // 配列に保存
            meshList.push(mesh);
        }

        // 半球光源を作成
        // new THREE.HemisphereLight(空の色, 地の色, 光の強さ)
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1.0);
        scene.add(hemisphereLight);

        // 軸ヘルパー
        // axesHelper = new THREE.AxesHelper(5.0);
        // scene.add(axesHelper);

        // 積み木
        boxControls = new DragControls( [... meshList], camera, renderer.domElement );
        boxControls.addEventListener('drag', render);
    }

    function render() {
        if (run === true) {
            requestAnimationFrame(render);
        }

        // レンダリング
        renderer.render(scene, camera);
    }

})();
