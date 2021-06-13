(() => {
    window.addEventListener('DOMContentLoaded', () => {
        init();

        window.addEventListener('keydown', (event) => {
            switch(event.key){
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

        window.addEventListener('pointerdown', move, false);

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
    let boxArray;       // 羽の配列
    let fanGroup; // 扇風機のグループ
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）
    let selectedMaterial;
    let raycaster;

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 50.0,
        x: 10.0,
        y: 0.0,
        z: 25.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xffffff,
        specular: 0xc7b197,
    };
    const WING_MATERIAL_PARAM = {
        color: 0xffffff,
        specular: 0xf7fc9c, //specular light
        opacity: 0.5,
    };
    const SUB_MATERIAL_PARAM = {
        color: 0xff0000,
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

    function init(){
        // シーン
        scene = new THREE.Scene();

        // レンダラ
        renderer = new THREE.WebGLRenderer({
            alpha: true, // シーンを透過
        });
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
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

        // グループ
        fanGroup = new THREE.Group();
        fanGroup.position.set(0, 0, -1.3);
        wingGroup = new THREE.Group();

        // マテリアル
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        wingMaterial = new THREE.MeshPhongMaterial(WING_MATERIAL_PARAM);
        subMaterial = new THREE.MeshLambertMaterial(SUB_MATERIAL_PARAM);
        selectedMaterial = new THREE.MeshBasicMaterial(SELECTED_PARAM);

        // 羽のジオメトリの生成
        geometry = new THREE.BoxGeometry(5.0, 0.1, 2.0);
        boxArray = [];
        const count = 3;
        for(let i = 0; i < count; ++i){

            box = new THREE.Mesh(geometry, wingMaterial);
            box.material.transparent = true;
            // 位置
            var deg = 360.0/count;
            let radian = i * (deg*Math.PI/180.0);
            box.position.set(
                3 * Math.cos(radian), // X座標
                0, // Y座標
                3 * Math.sin(radian) // Z座標
            );
            // 少し傾ける
            box.rotation.x = 0.05;

            if (i === 1) {
                box.rotation.y = Math.PI / 3;
                box.position.x = -1.5;
                box.position.y = -0.2;
            } else if (i === 2) {
                box.rotation.y = -Math.PI / 3;
                box.position.x = -1.5;
                box.position.y = 0.2;
            }
            boxArray.push(box);
            wingGroup.add(box);
        }
        
        // yを反転
        wingGroup.rotation.x = -Math.PI / 2.0;
        wingGroup.position.z = 2.6;
        fanGroup.add(wingGroup);

        // 羽中心のジオメトリ
        geometry = new THREE.SphereGeometry(1.0, 8, 8);
        sphere = new THREE.Mesh(geometry, subMaterial);
        sphere.position.set(0.0, 0.0, 2.5);
        fanGroup.add(sphere);

        // カバーのジオメトリ 上の広がり、下の広がり、高さ、セグメント
        geometry = new THREE.CylinderGeometry(6.0, 5.0, 1.5, 24);
        cover = new THREE.Line(geometry, material);
        cover.position.set(0.0, 0.0, 3.0);
        cover.rotation.x = -Math.PI / 2.0;
        fanGroup.add(cover);

        // 土台のジオメトリ
        const length = 6, wid = 1;

        const shape = new THREE.Shape();
        shape.moveTo( 0,0 );
        shape.lineTo( 0, wid );
        shape.lineTo( length, wid );
        shape.lineTo( length, 0 );
        shape.lineTo( 0, 0 );

        const extrudeSettings = {
            steps: 2,
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.5,
            bevelOffset: 0,
            bevelSegments: 1
        };

        geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        base = new THREE.Mesh(geometry, material);
        base.position.set(-3.0, -11.0, -2.1);
        scene.add(base);

        // 柱のジオメトリ
        geometry = new THREE.CylinderGeometry(0.6, 0.6, 10.0, 16);
        pillar = new THREE.Mesh(geometry, material);
        pillar.position.set(0.0, -5.0, -2.0);
        scene.add(pillar);

        // 首のジオメトリ
        geometry = new THREE.CylinderGeometry(2.0, 1.2, 4.0, 14);
        neck = new THREE.Mesh(geometry, material);
        neck.position.set(0.0, 0.0, 0.5);
        neck.rotation.x = -Math.PI / 2.0;
        fanGroup.add(neck);

        // 縁のジオメトリ
        geometry = new THREE.RingGeometry(6, 6.5, 24);
        ringOut = new THREE.Mesh( geometry, subMaterial );
        ringOut.position.z = 2.2;
        fanGroup.add(ringOut);
        subMaterial.side = THREE.DoubleSide; // 両面表示

        geometry = new THREE.RingGeometry(2, 2.2, 24);
        ringInner = new THREE.Mesh(geometry, material);
        ringInner.position.z = 4;
        fanGroup.add(ringInner);

        scene.add(fanGroup);

        // スイッチのジオメトリ
        geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 8);
        button = new THREE.Mesh(geometry, subMaterial);
        button.position.set(2.0, -9.7, 2.2);
        button.rotation.x = Math.PI / 3.5;
        scene.add(button);

        // ディレクショナルライト
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);

        // アンビエントライト
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // spot
        const spotLight = new THREE.DirectionalLight(0xededd1);
        spotLight.position.set(-15, -10, -15);
        spotLight.power = 0.01;
        scene.add(spotLight);

        // 軸ヘルパー
        axesHelper = new THREE.AxesHelper(5.0);
        scene.add(axesHelper);
        d_lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        // scene.add(d_lightHelper);
        s_lightHelper = new THREE.DirectionalLightHelper(spotLight, 5);
        // scene.add(s_lightHelper);

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        raycaster = new THREE.Raycaster();
    }

    // 回転の動き
    function move(event) {
        const x = event.clientX / window.innerWidth * 2.0 - 1.0;
        const y = event.clientY / window.innerHeight * 2.0 - 1.0;
        // yだけ反転
        const v = new THREE.Vector2(x, -y);

        raycaster.setFromCamera(v, camera);
        const intersects = raycaster.intersectObject(button);

        if(intersects.length > 0){
            isDown = true;
            intersects[0].object.material = selectedMaterial;
            console.log("ON");
        }

        // 時間制限
        window.setTimeout(function(){
            isDown = false;
            button.material = subMaterial;
            console.log("OFF");
        }, 5000);
    }

    function render() {
        if(run === true) {
            requestAnimationFrame(render);
        }

        // スイッチが押されている場合
        if(isDown === true) {
            timer += 1;
            // ラジアンに変換する
            const roll = (timer * Math.PI) / 180;

            // 回転
            fanGroup.rotation.y = Math.sin(roll) / 2;
            wingGroup.rotation.y += 0.3;
        }

        renderer.render(scene, camera);
    }
})();
