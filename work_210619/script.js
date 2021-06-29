(() => {
    window.addEventListener('DOMContentLoaded', () => {
        // キーダウンイベント
        window.addEventListener('keydown', (event) => {
            switch(event.key){
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                default:
            }
        }, false);
        // リサイズイベント
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // ２つの画像のロードとテクスチャの生成 @@@
        const loader = new THREE.TextureLoader();
        earthTexture = loader.load('./img/earth_color-small.jpg', () => {
            // 月の画像がテクスチャとして生成できたら init を呼ぶ
            moonTexture = loader.load('./img/moon_color_1k.jpg');
            moonDepthTexture = loader.load('./img/moon_dep_8bit.jpg');
            marsTexture = loader.load('./img/mars_color.jpg');
            jupiterTexture = loader.load('./img/jupiter_color.jpg');
            venusTexture = loader.load('./img/venus_color.jpg');
            neptuneTexture = loader.load('./img/neptune_color.jpg');
            saturnTexture = loader.load('./img/saturn_color.jpg');
            sunTexture = loader.load('./img/sun.jpg', init);
        });
    }, false);

    // 汎用変数
    let run = true;    // レンダリングループフラグ
    let startTime = 0;

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let geometry;         // ジオメトリ
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）

    let earth;            // 地球のメッシュ
    let earthMaterial;    // 地球用マテリアル
    let earthTexture;     // 地球用テクスチャ
    let moon;             // 月のメッシュ
    let moonMaterial;     // 月用マテリアル
    let moonTexture;      // 月用テクスチャ
    let moonDepthTexture;
    let sunTexture;
    let marsTexture, neptuneTexture, saturnTexture, venusTexture;

    let earthGroup;

    // 周回距離
    // 太陽から地球までの距離を2として考える
    const EARTH_RANGE = 2.0;
    // 月の地球からの距離は 平均380000 km
    const MOON_RANGE = 0.16;
    // 水星の太陽からの距離は57900000km（地球の約2/5）
    const MERCURY_RANGE = 1.4;
    // 金星の太陽からの距離は1億8200000km
    const VENUS_RANGE = 1.7;
    // 火星の太陽からの距離は2億2790万km
    const MARS_RANGE = 2.5;
    // 木星の太陽からの距離は7億7830万km(地球と太陽の距離の約5.2倍)
    const JUPITER_RANGE = 6.0;
    // 土星の太陽からの距離は14億2940万km(地球と太陽の距離の約9.6倍)
    const SATURN_RANGE = 11.0;
    // 天王星の太陽からの距離は28億7500万km（地球と太陽の距離の約19.2倍）
    const URANUS_RANGE = 20.0;
    // 海王星の太陽からの距離は45億440万km(地球と太陽の距離の約30倍)
    const NEPTUNE_RANGE = 31.0;

    // グループ
    earthGroup = new THREE.Group();

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100.0,
        x: 0.5,
        y: 1.5,
        z: 6.0,
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
    };
    const SUN_MATERIAL_PARAM = {
        color: 0xffffff,
        emissive: 0x0ff0000,
    }
    const LINE_MATERIAL_PARAM = {
        color: 0xffffff,
        linewidth: 1,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin:  'round', //ignored by WebGLRenderer
        opacity: 0.5,
    }
    // ライトに関するパラメータ
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータ
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2,
    };

    function init(){
        // シーン
        scene = new THREE.Scene();

        // レンダラ
        renderer = new THREE.WebGLRenderer({
            alpha: true,
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

        // スフィアジオメトリの生成
        geometry = new THREE.SphereGeometry(1.0, 64, 64);

        // マテリアルを生成し、テクスチャを設定する
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;
        sunMaterial = new THREE.MeshStandardMaterial(SUN_MATERIAL_PARAM);
        sunMaterial.bumpMap = moonDepthTexture;
        sunMaterial.map = sunTexture;
        jupiterMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        jupiterMaterial.map = jupiterTexture;
        marsMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        marsMaterial.map = marsTexture;
        neptuneMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        neptuneMaterial.map = neptuneTexture;
        saturnMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        saturnMaterial.map = saturnTexture;
        venusMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        venusMaterial.map = venusTexture;

        lineMaterial = new THREE.LineBasicMaterial(LINE_MATERIAL_PARAM);
        lineMaterial.transparent = true;

        // 太陽系のメッシュの生成（ジオメトリは使いまわし）
        earth = new THREE.Mesh(geometry, earthMaterial);
        // 地球の直径は 12756.3 km
        earth.scale.setScalar(0.127);
        scene.add(earth);

        moon = new THREE.Mesh(geometry, moonMaterial);
        // 月の直径は 3475 km
        moon.scale.setScalar(0.034);
        moon.position.set(MOON_RANGE, 0.0, 0.0);
        earthGroup.add(moon);

        sun = new THREE.Mesh(geometry, sunMaterial);
        sun.scale.setScalar(1.09); // 本当は地球の109倍だが収まらない
        scene.add(sun);

        mercury = new THREE.Mesh(geometry, moonMaterial);
        // 水星の直径は 4879km（地球の約2/5）
        mercury.scale.setScalar(0.048);
        scene.add(mercury);

        venus = new THREE.Mesh(geometry, venusMaterial);
        // 金星の直径は 12104km(地球とほぼ同じ)
        venus.scale.setScalar(0.121);
        scene.add(venus);

        mars = new THREE.Mesh(geometry, marsMaterial);
        // 火星の直径は 6792km(地球の約半分)
        mars.scale.setScalar(0.067);
        scene.add(mars);

        jupiter = new THREE.Mesh(geometry, jupiterMaterial);
        // 木星の直径は 142984km (地球の11倍)
        jupiter.scale.setScalar(1.429);
        scene.add(jupiter);

        saturn = new THREE.Mesh(geometry, saturnMaterial);
        // 土星の直径は 120536km（地球の約10倍）
        saturn.scale.setScalar(1.205);
        scene.add(saturn);

        uranus = new THREE.Mesh(geometry, moonMaterial);
        // 天王星の直径は 51118km(地球の約4倍)
        uranus.scale.setScalar(0.511);
        scene.add(uranus);

        neptune = new THREE.Mesh(geometry, neptuneMaterial);
        // 海王星の直径は 49528km（地球の約3.9倍）
        neptune.scale.setScalar(0.495);
        scene.add(neptune);

        // 軌道のジオメトリ
        geometry = new THREE.RingGeometry(1, 1.01, 64);

        earth_line = new THREE.Mesh(geometry, lineMaterial);
        earth_line.rotation.x = -Math.PI / 2.0;
        earth_line.scale.setScalar(EARTH_RANGE);
        scene.add(earth_line);

        moon_line = new THREE.Mesh(geometry, lineMaterial);
        moon_line.rotation.x = -Math.PI / 2.0;
        moon_line.scale.setScalar(MOON_RANGE);
        earthGroup.add(moon_line);

        // 水星
        mercury_line = new THREE.Mesh(geometry, lineMaterial);
        mercury_line.rotation.x = -Math.PI / 2.0;
        mercury_line.scale.setScalar(MERCURY_RANGE);
        scene.add(mercury_line);

        // 金星
        venus_line = new THREE.Mesh(geometry, lineMaterial);
        venus_line.rotation.x = -Math.PI / 2.0;
        venus_line.scale.setScalar(VENUS_RANGE);
        scene.add(venus_line);

        // 火星
        mars_line = new THREE.Mesh(geometry, lineMaterial);
        mars_line.rotation.x = -Math.PI / 2.0;
        mars_line.scale.setScalar(MARS_RANGE);
        scene.add(mars_line);

        // 木星
        jupiter_line = new THREE.Mesh(geometry, lineMaterial);
        jupiter_line.rotation.x = -Math.PI / 2.0;
        jupiter_line.scale.setScalar(JUPITER_RANGE);
        scene.add(jupiter_line);

        // 土星
        saturn_line = new THREE.Mesh(geometry, lineMaterial);
        saturn_line.rotation.x = -Math.PI / 2.0;
        saturn_line.scale.setScalar(SATURN_RANGE);
        scene.add(saturn_line);

        // 天王星
        uranus_line = new THREE.Mesh(geometry, lineMaterial);
        uranus_line.rotation.x = -Math.PI / 2.0;
        uranus_line.scale.setScalar(URANUS_RANGE);
        scene.add(uranus_line);

        // 海王星
        neptune_line = new THREE.Mesh(geometry, lineMaterial);
        neptune_line.rotation.x = -Math.PI / 2.0;
        neptune_line.scale.setScalar(NEPTUNE_RANGE);
        scene.add(neptune_line);

        scene.add(earthGroup);

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

        // 軸ヘルパー
        axesHelper = new THREE.AxesHelper(5.0);
        // scene.add(axesHelper);

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        run = true;
        startTime = Date.now();
        render();
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // 自転
        sun.rotation.y += 0.0027;
        earthGroup.rotation.y += 0.05; // 月の動き

        // 月の位置を正規化
        // const moonPosition = moon.position.clone();
        // const moonMove = moonPosition.normalize();

        // 恒星周期 地球を1と考える
        const nowTime = (Date.now() - startTime) / 1000;
        const sin = Math.sin(nowTime);
        const cos = Math.cos(nowTime);

        // 水星の公転周期 88地球日
        const sin_m = Math.sin(nowTime * 0.2);
        const cos_m = Math.cos(nowTime * 0.2);
        // 金星の公転周期 225地球日
        const sin_v = Math.sin(nowTime * 0.6);
        const cos_v = Math.cos(nowTime * 0.6);
        // 火星の公転周期 687地球日
        const sin_ma = Math.sin(nowTime * 1.8);
        const cos_ma = Math.cos(nowTime * 1.8);
        // 木星の公転周期 11.9地球年
        const sin_j = Math.sin(nowTime / 12);
        const cos_j = Math.cos(nowTime / 12);
        // 土星の公転周期 29.5地球年
        const sin_s = Math.sin(nowTime / 29.5);
        const cos_s = Math.cos(nowTime / 29.5);
        // 天王星の公転周期 84地球年
        const sin_u = Math.sin(nowTime / 84);
        const cos_u = Math.cos(nowTime / 84);
        // 海王星の公転周期 165地球年
        const sin_n = Math.sin(nowTime / 165);
        const cos_n = Math.cos(nowTime / 165);
        
        // 公転
        earth.position.set(cos * EARTH_RANGE, 0, sin * EARTH_RANGE);
        earthGroup.position.set(cos * EARTH_RANGE, 0, sin * EARTH_RANGE);
        moon.position.set(cos * MOON_RANGE, 0, sin * MOON_RANGE);
        mercury.position.set(cos_m * MERCURY_RANGE, 0, sin_m * MERCURY_RANGE);
        venus.position.set(cos_v * VENUS_RANGE, 0, sin_v * VENUS_RANGE);
        mars.position.set(cos_ma * MARS_RANGE, 0, sin_ma * MARS_RANGE);
        jupiter.position.set(cos_j * JUPITER_RANGE, 0, sin_j * JUPITER_RANGE);
        saturn.position.set(cos_s * SATURN_RANGE, 0, sin_s * SATURN_RANGE);
        uranus.position.set(cos_u * URANUS_RANGE, 0, sin_u * URANUS_RANGE);
        neptune.position.set(cos_n * NEPTUNE_RANGE, 0, sin_n * NEPTUNE_RANGE);

        // moon.position.add(moonMove.multiplyScalar(0.03));
        
        // レンダリング
        renderer.render(scene, camera);
    }
})();

