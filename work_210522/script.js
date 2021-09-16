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
    let axesHelper;
    let directionalLight;
    let ambientLight;

    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 10.0,
        far: 1000.0,
        x: 0.0,
        y: 5.0,
        z: 10.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    const RENDERER_PARAM = {
        clearColor: 0xcccccc,
        width: window.innerWidth,
        height: window.innerHeight,
    };

    const MATERIAL_PARAM = {
        color: 0x003399,
        specular: 0xff0000, //specular light
    };

    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xeeccaa,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };

    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2,
    };

    function init() {
        scene = new THREE.Scene();

        // フォグを設定
        scene.fog = new THREE.Fog(0xffffff, 1, 20);

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
        const wrapper = document.querySelector('#webgl');
        wrapper.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);


        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);

        // box
        geometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);
        boxArray = [];
        const count = 100;
        for (let i = 0; i < count; ++i) {
            const box = new THREE.Mesh(geometry, material);
            box.position.x =  (Math.random() - 0.5) * 15;
            box.position.y =  (Math.random() - 0.5) * 15;
            box.position.z =  (Math.random() - 0.5) * 15;

            const scale = Math.random() * 0.5 + 0.5;
            box.scale.setScalar(scale);

            boxArray.push(box);
            scene.add(box);
        }

        // light
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);

        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        hemisohereLight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
        scene.add(hemisohereLight);

        // helper
        axesHelper = new THREE.AxesHelper(5.0);
//         scene.add(axesHelper);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
    }

    function render() {
        if (run === true) {
            requestAnimationFrame(render);
        }

        controls.update();

        if (isDown === true) {
            directionalLight.position.z += 0.05;

            boxArray.forEach((box) => {
                box.rotation.set(Math.random() * 1, Math.random() * 1, 1);
            });
        }

        renderer.render(scene, camera);
    }

})();
