
// ページの読み込みを待つ
(() => {
    window.addEventListener('DOMContentLoaded', () => {
        init();

        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                case ' ':
                    isDown = true;
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
    let controls;
    let directionalLight;
    let ambientLight;

    const CAMERA_PARAM = {
        fovy: 30,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 500.0,
        x: 0.0,
        y: 160.0,
        z: 500.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    const RENDERER_PARAM = {
        // clearColor: 0x0E1544,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    const MATERIAL_PARAM = {
        color: 0x003399,
        specular: 0xf7fc9c, //specular light
        opacity: 0.1,
    };

    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xff7700,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };

    const AMBIENT_LIGHT_PARAM = {
        color: 0x7a79aa,
        intensity: 0.2,
    };

    function init() {
        scene = new THREE.Scene();
        let rot = 0;

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
        const group = new THREE.Group();
        // 3D空間にグループを追加する
        scene.add(group);

        // box
        geometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);
        // マウスとの交差を調べたいものは配列に格納する
        const meshList = [];
        for (let i = 0; i < 100; i++) {
            material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;

            let radian = i / 100 * Math.PI * 10;
            mesh.position.set(
                5 * Math.cos(radian), // X座標
                i, // Y座標
                5 * i // Z座標
            );
            mesh.scale.set(i, 1.0, 1.0);
            group.add(mesh);

            // 配列に保存
            meshList.push(mesh);
        }

        // 平行光源
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);

        // 環境光源
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // spot
        const spotLight = new THREE.SpotLight( 0x00ffc4 );
        spotLight.position.set( 10, 100, 10 );

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;

        scene.add(spotLight);

        // spot2
        const spotLight_2 = new THREE.SpotLight( 0x79CBCA );
        spotLight_2.position.set( 40, 200, 0 );
        spotLight_2.power = 1;

        spotLight_2.castShadow = true;

        spotLight_2.shadow.mapSize.width = 1024;
        spotLight_2.shadow.mapSize.height = 1024;

        spotLight_2.shadow.camera.near = 250;
        spotLight_2.shadow.camera.far = 3000;
        spotLight_2.shadow.camera.fov = 30;

        scene.add(spotLight_2);

        // レイキャストを作成
        const raycaster = new THREE.Raycaster();

        canvas.addEventListener('mousemove', handleMouseMove);
        tick();

        // マウスを動かしたときのイベント
        function handleMouseMove(event) {
            const element = event.currentTarget;
            // canvas要素上のXY座標
            const x = event.clientX - element.offsetLeft;
            const y = event.clientY - element.offsetTop;
            // canvas要素の幅・高さ
            const w = element.offsetWidth;
            const h = element.offsetHeight;

            // -1〜+1の範囲で現在のマウス座標を登録する
            mouse.x = (x / w) * 2 - 1;
            mouse.y = -(y / h) * 2 + 1;
        }

        // 軸ヘルパー
        // axesHelper = new THREE.AxesHelper(5.0);
        // scene.add(axesHelper);
        // d_lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        // scene.add(d_lightHelper);
        // s_lightHelper = new THREE.SpotLightHelper(spotLight, 5);
        // scene.add(s_lightHelper);
        // s_lightHelper2 = new THREE.SpotLightHelper(spotLight_2, 5);
        // scene.add(s_lightHelper2);

        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // 毎フレーム時に実行されるループイベント
        function tick() {
            // レイキャスト = マウス位置からまっすぐに伸びる光線ベクトルを生成
            raycaster.setFromCamera(mouse, camera);

            // その光線とぶつかったオブジェクトを得る
            const intersects = raycaster.intersectObjects(meshList);

            meshList.forEach((mesh) => {
                // 交差しているオブジェクトが1つ以上存在し、
                // 交差しているオブジェクトの1番目(最前面)のものだったら
                if (intersects.length > 0 && mesh === intersects[0].object) {
                    // 透過する
                    mesh.material.transparent = true;
                }
            });

            }
    }


    function render() {
        if (run === true) {
            requestAnimationFrame(render);
        }
        controls.update();
        controls.enableRotate = false; // スクロールのみ
        controls.maxDistance = 500.0;
        controls.minDistance = 50.0;

        // レンダリング
        renderer.render(scene, camera);
    }

})();
