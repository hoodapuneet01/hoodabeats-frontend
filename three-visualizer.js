/* =====================================================
   HOODABEATS 3D MUSIC VISUALIZER
   AUDIO ANALYSER REMOVED
===================================================== */

(function () {

    "use strict";

    const container =
        document.getElementById("hooda3d");

    if (
        !container ||
        typeof THREE === "undefined"
    ) {
        console.warn("3D visualizer requirements missing.");
        return;
    }


    /* =================================================
       SCENE
    ================================================= */

    const scene = new THREE.Scene();


    /* =================================================
       CAMERA
    ================================================= */

    const camera = new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        100
    );

    camera.position.set(0, 0, 13);


    /* =================================================
       RENDERER
    ================================================= */

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.5)
    );

    renderer.setClearColor(0x000000, 0);

    container.innerHTML = "";
    container.appendChild(renderer.domElement);


    /* =================================================
       RESIZE
    ================================================= */

    function resize() {
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 500;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    resize();

    window.addEventListener("resize", resize);


    /* =================================================
       CORE SPHERE
    ================================================= */

    const coreGeometry =
        new THREE.IcosahedronGeometry(2.1, 3);

    const coreMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x9b5cff,
            wireframe: true,
            transparent: true,
            opacity: 0.85
        });

    const coreSphere =
        new THREE.Mesh(
            coreGeometry,
            coreMaterial
        );

    const coreGroup =
        new THREE.Group();

    coreGroup.add(coreSphere);
    scene.add(coreGroup);


    /* =================================================
       INNER SPHERE
    ================================================= */

    const innerGeometry =
        new THREE.IcosahedronGeometry(1.5, 2);

    const innerMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xd946ef,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });

    const innerSphere =
        new THREE.Mesh(
            innerGeometry,
            innerMaterial
        );

    scene.add(innerSphere);


    /* =================================================
       RINGS
    ================================================= */

    const ringGroup =
        new THREE.Group();

    const ringSettings = [
        [3.0, 0.4, 0.2, 0.004],
        [3.5, 1.2, 0.3, -0.005],
        [4.0, 0.2, 1.1, 0.003]
    ];

    ringSettings.forEach((data) => {

        const geometry =
            new THREE.TorusGeometry(
                data[0],
                0.025,
                10,
                100
            );

        const material =
            new THREE.MeshBasicMaterial({
                color: 0xd946ef,
                transparent: true,
                opacity: 0.7
            });

        const ring =
            new THREE.Mesh(
                geometry,
                material
            );

        ring.rotation.x = data[1];
        ring.rotation.y = data[2];
        ring.userData.speed = data[3];

        ringGroup.add(ring);

    });

    scene.add(ringGroup);


    /* =================================================
       OUTER PARTICLES
    ================================================= */

    const particleCount = 350;

    const particlePositions =
        new Float32Array(
            particleCount * 3
        );

    for (let i = 0; i < particleCount; i++) {

        const radius = 3 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 8;

        particlePositions[i * 3] =
            Math.cos(angle) * radius;

        particlePositions[i * 3 + 1] = y;

        particlePositions[i * 3 + 2] =
            Math.sin(angle) * radius;

    }

    const particleGeometry =
        new THREE.BufferGeometry();

    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            particlePositions,
            3
        )
    );

    const particleMaterial =
        new THREE.PointsMaterial({
            color: 0xc084fc,
            size: 0.045,
            transparent: true,
            opacity: 0.8
        });

    const outerParticles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );

    scene.add(outerParticles);


    /* =================================================
       EQUALIZER
    ================================================= */

    const equalizerGroup =
        new THREE.Group();

    const equalizerCount = 35;

    for (let i = 0; i < equalizerCount; i++) {

        const geometry =
            new THREE.BoxGeometry(
                0.08,
                0.5,
                0.08
            );

        const material =
            new THREE.MeshBasicMaterial({
                color: 0xa855f7
            });

        const bar =
            new THREE.Mesh(
                geometry,
                material
            );

        const spacing = 0.18;

        bar.position.x =
            (i - equalizerCount / 2) * spacing;

        bar.position.y = -4.0;
        bar.userData.index = i;

        equalizerGroup.add(bar);

    }

    scene.add(equalizerGroup);


    /* =================================================
       SIMULATED ENERGY
       NO AUDIO CONNECTION
    ================================================= */

    function getEnergy(time) {

        const bass =
            0.18 +
            Math.abs(Math.sin(time * 2.4)) * 0.22;

        const average =
            0.16 +
            Math.abs(Math.sin(time * 1.5)) * 0.12;

        return {
            bass,
            average
        };

    }


    /* =================================================
       ANIMATION
    ================================================= */

    let time = 0;

    let smoothBass = 0;
    let smoothAverage = 0;

    function animate() {

        requestAnimationFrame(animate);

        time += 0.01;

        const energy = getEnergy(time);

        smoothBass +=
            (energy.bass - smoothBass) * 0.12;

        smoothAverage +=
            (energy.average - smoothAverage) * 0.12;


        /* CORE PULSE */

        const pulse =
            1 + smoothBass * 0.6;

        coreGroup.scale.set(
            pulse,
            pulse,
            pulse
        );


        /* CORE ROTATION */

        coreGroup.rotation.x +=
            0.001 + smoothAverage * 0.004;

        coreGroup.rotation.y +=
            0.002 + smoothBass * 0.01;


        /* INNER SPHERE */

        innerSphere.rotation.x -= 0.001;
        innerSphere.rotation.y -= 0.002;

        const innerScale =
            1 + smoothBass * 0.3;

        innerSphere.scale.set(
            innerScale,
            innerScale,
            innerScale
        );


        /* RINGS */

        ringGroup.children.forEach((ring) => {

            ring.rotation.z +=
                ring.userData.speed;

            ring.rotation.x += 0.001;

            const scale =
                1 + smoothBass * 0.2;

            ring.scale.set(
                scale,
                scale,
                scale
            );

        });


        /* OUTER PARTICLES */

        outerParticles.rotation.y +=
            0.0005 + smoothAverage * 0.003;


        /* EQUALIZER BARS */

        equalizerGroup.children.forEach((bar) => {

            const index =
                bar.userData.index;

            const center =
                equalizerCount / 2;

            const distance =
                Math.abs(index - center) / center;

            const wave =
                Math.sin(
                    time * 5 + index * 0.5
                );

            const height =
                0.3 +
                Math.abs(wave) *
                (0.4 + smoothBass * 3) *
                (1 - distance * 0.3);

            bar.scale.y =
                height / 0.5;

            bar.position.y =
                -4.0 + height * 0.5;

        });


        /* CAMERA */

        camera.position.x +=
            (0 - camera.position.x) * 0.02;

        camera.position.y +=
            (0 - camera.position.y) * 0.02;

        camera.lookAt(0, 0, 0);


        /* RENDER */

        renderer.render(
            scene,
            camera
        );

    }

    animate();

})();