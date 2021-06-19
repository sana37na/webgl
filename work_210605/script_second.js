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

    // 汎用変数
    let run = true;     // レンダリングループフラグ
    let isDown = false; // スペースキーが押されているかどうかのフラグ
    let timer = 0; // タイマー

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let geometry;         // ジオメトリ
    let material;         // マテリアル
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）
    let raycaster;
    let hourGroup, minGroup, secGroup;
    let composer;
    let renderPass;
    let glitchPass;
    let dotScreenPass;

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 50.0,
        x: -10.0,
        y: 0.0,
        z: 25.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0xcccccc,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xffffff,
        specular: 0xc7b197,
    };
    const SILVER_MATERIAL_PARAM = {
        color: 0xffffff,
        specular: 0xf7fc9c, //specular light
    };
    const SUB_MATERIAL_PARAM = {
        color: 0x425A9F,
    }
    const SELECTED_PARAM = {
        color: 0xf0c31f,
    }
    // ライトに関するパラメータの定義
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 5.0,
        y: 4.0,
        z: 5.0
    };
    // アンビエントライトに関するパラメータの定義
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffaaaa,
        intensity: 0.2,
    };

    function init() {
        // シーン
        scene = new THREE.Scene();

        // レンダラ
        renderer = new THREE.WebGLRenderer({
            alpha: true, // シーンを透過
        });
        // renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        const wrapper = document.querySelector('#webgl');
        wrapper.appendChild(renderer.domElement);

        // カメラ
        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);

        // コンポーザー
        composer = new THREE.EffectComposer(renderer);
        renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        // dotScreenPass = new THREE.DotScreenPass();
        // composer.addPass(dotScreenPass);
        renderPass.renderToScreen = true;

        // グループ
        hourGroup = new THREE.Group();
        minGroup = new THREE.Group();
        secGroup = new THREE.Group();

        // マテリアル
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        subMaterial = new THREE.MeshToonMaterial(SUB_MATERIAL_PARAM);
        subMaterial.side = THREE.DoubleSide; // 両面表示

        silverMaterial = new THREE.MeshPhongMaterial(SILVER_MATERIAL_PARAM);
        hourMaterial = new THREE.MeshToonMaterial({ color: 0xff0000 });
        minMaterial = new THREE.MeshToonMaterial({ color: 0x00ff00 });
        secMaterial = new THREE.MeshToonMaterial({ color: 0x0000ff });

        // 時計皿のジオメトリの生成 上の広がり、下の広がり、高さ、セグメント
        geometry = new THREE.CylinderGeometry(5.0, 5.0, 0.2, 36);
        base = new THREE.Mesh(geometry, material);
        base.rotation.x = -Math.PI / 2.0;
        scene.add(base);

        // 針のジオメトリ
        geometry = new THREE.BoxGeometry(0.2, 3.0, 0.1);
        hour_pic = new THREE.Mesh(geometry, hourMaterial);
        hour_pic.position.set(0, 1.5, 0.2);
        hourGroup.add(hour_pic);

        geometry = new THREE.BoxGeometry(0.2, 4.0, 0.1);
        min_pic = new THREE.Mesh(geometry, minMaterial);
        min_pic.position.set(0, 2, 0.2)
        minGroup.add(min_pic);

        geometry = new THREE.BoxGeometry(0.1, 4.0, 0.1);
        second_pic = new THREE.Mesh(geometry, secMaterial);
        second_pic.position.set(0, 2, 0.2);
        secGroup.add(second_pic);

        scene.add(hourGroup);
        scene.add(minGroup);
        scene.add(secGroup);

        // 中心
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12);
        center = new THREE.Mesh(geometry, subMaterial);
        center.position.z = 0.2;
        center.rotation.x = -Math.PI / 2.0;
        scene.add(center);

        // フレーム
        geometry = new THREE.CylinderGeometry(6.0, 6.0, 3, 36);
        frame = new THREE.Mesh(geometry, subMaterial);
        frame.rotation.x = -Math.PI / 2.0;
        frame.position.z = -1.5;
        frame.castShadow = true;
        scene.add(frame);

        // 足
        geometry = new THREE.IcosahedronGeometry(1, 0);
        foot_left = new THREE.Mesh(geometry, subMaterial);
        foot_left.position.set(3.5, -5.5, -1.5);
        scene.add(foot_left);
        foot_right = new THREE.Mesh(geometry, subMaterial);
        foot_right.position.set(-3.5, -5.5, -1.5);
        scene.add(foot_right);

        // 耳
        geometry = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI, 0, Math.PI);
        ear_right = new THREE.Mesh(geometry, subMaterial);
        ear_right.position.set(-3.5, 4.5, -1.5);
        ear_right.rotation.x = -Math.PI / 2;
        ear_right.rotation.y = -0.7;
        scene.add(ear_right);
        ear_left = new THREE.Mesh(geometry, subMaterial);
        ear_left.position.set(3.5, 4.5, -1.5);
        ear_left.rotation.x = -Math.PI / 2;
        ear_left.rotation.y = 0.7;
        scene.add(ear_left);

        // 銀
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 12);
        joint_right = new THREE.Mesh(geometry, silverMaterial);
        joint_right.position.set(-4.5, 5.8, -1.5);
        joint_right.rotation.z = 0.8;
        scene.add(joint_right);
        joint_left = new THREE.Mesh(geometry, silverMaterial);
        joint_left.position.set(4.5, 5.8, -1.5);
        joint_left.rotation.z = -0.8;
        scene.add(joint_left);

        // ベル
        joint_bell = new THREE.Mesh(geometry, silverMaterial);
        joint_bell.position.set(0, 6, -1.5);
        scene.add(joint_bell);
        bell = new THREE.Mesh(geometry, silverMaterial);
        bell.scale.set(2, 0.8, 1.5);
        bell.rotation.x = Math.PI / 2.0;
        bell.rotation.z = Math.PI / 2.0;
        bell.position.set(0, 7.5, -1.5);
        scene.add(bell);

        // カーブ
        class CustomSinCurve extends THREE.Curve {
            constructor( scale = 1 ) {
                super();
                this.scale = scale;
            }
            getPoint( t, optionalTarget = new THREE.Vector3() ) {
                const tx = t * 3.5 - 1.75;
                const ty = Math.sin(Math.PI * t) / 1.25;
                const tz = 0;
                return optionalTarget.set( tx, ty, tz ).multiplyScalar(this.scale);
            }
        }
        const path = new CustomSinCurve(4);
        geometry = new THREE.TubeGeometry(path, 20, 0.2, 8, false);
        curve = new THREE.Mesh(geometry, silverMaterial);
        curve.position.set(0, 6.5, -1.5);
        scene.add(curve);

        // テーブル
        geometry = new THREE.BoxGeometry(15, 3, 8);
        table = new THREE.Mesh(geometry, material);
        table.position.set(0, -7.9, -1.5);
        table.receiveShadow = true;
        scene.add(table);

        // 文字盤
        const loader = new THREE.FontLoader();
        loader.load('fonts/Raleway_Thin_Regular.json', function (font) {
            // 12
            const geometry_12 = new THREE.TextGeometry('12', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
            });
            const num_12 = new THREE.Mesh(geometry_12, subMaterial);
            num_12.position.set(-0.25, 4, 0);
            scene.add(num_12);

            // 3
            const geometry_3 = new THREE.TextGeometry('3', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
            });
            const num_3 = new THREE.Mesh(geometry_3, subMaterial);
            num_3.position.set(4, -0.25, 0);
            scene.add(num_3);

            // 6
            const geometry_6 = new THREE.TextGeometry('6', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
            });
            const num_6 = new THREE.Mesh(geometry_6, subMaterial);
            num_6.position.set(-0.25, -4, 0);
            scene.add(num_6);

            // 9
            const geometry_9 = new THREE.TextGeometry('9', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 2,
            });
            const num_9 = new THREE.Mesh(geometry_9, subMaterial);
            num_9.position.set(-4, -0.25, 0);
            scene.add(num_9);
        });

        // ディレクショナルライト
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // アンビエントライト
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // 軸ヘルパー
        axesHelper = new THREE.AxesHelper(5.0);
        scene.add(axesHelper);
        d_lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        scene.add(d_lightHelper);

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        raycaster = new THREE.Raycaster();
    }



    function render() {
        if (run === true) {
            requestAnimationFrame(render);
        }

        // スイッチが押されている場合
        // if(isDown === true) {
        //     timer += 1;
        // }


        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();

        // deg
        // 秒速 = 時間針 * 30deg + 分針 * (1秒ごと0.00833..deg)
        const deg_h = hour * (30 * Math.PI / 180) + minute * ((360 * Math.PI / 180) / 12 / 60);
        const deg_m = minute * ((360 / 60) * Math.PI / 180);
        const deg_s = - second * ((360 / 60) * Math.PI / 180);

        // get
        const pick_h = hourGroup;
        const pick_m = minGroup;
        const pick_s = secGroup;

        // move
        pick_h.rotation.z = -deg_h;
        pick_m.rotation.z = -deg_m;
        pick_s.rotation.z = deg_s;

        composer.render();
    }
})();

