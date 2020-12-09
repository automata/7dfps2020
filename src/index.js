const Stats = require("stats.js");
// const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');
const { FirstPersonControls } = require('three/examples/jsm/controls/FirstPersonControls.js');

window.THREE = require("three");

let stats, particles, scene, group,
    videoWidth, videoHeight, imageCache,
    renderer, camera, clock,
    width, height, video, controls,
    capturedParticles = [];

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const classNameForLoading = "loading";
const debug = true;

const sceneBg = 0x111111;

//
// Setup all scene, controls, particle systems, etc.
//
const init = () => {
    // Add loading UI
    // document.body.classList.add(classNameForLoading);

    // Add stats
    if (debug) {
        stats = new Stats();
        stats.showPanel(0);
        document.body.appendChild( stats.dom );
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneBg);

    renderer = new THREE.WebGLRenderer();
    document.getElementById("content").appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Use only one group for all assets for now
    group = new THREE.Group();
    scene.add(group);

    initCamera();

    // FPS Controls
    controls =  new FirstPersonControls(camera);
    controls.lookSpeed = 1.5;
    controls.movementSpeed = 1500;

    onResize();

    navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
        getUserMedia: (c) => {
            return new Promise(function (y, n) {
                (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
            });
        }
    } : null);

    if (navigator.mediaDevices) {
        // initVideo();
    } else {
        showAlert();
    }

    initKeys();

    draw();

    initImages();
};

//
// Load an image as particles using some threshold for RGB as fake depth on z-axis
//
const initImages = () => {
    const loader = new THREE.ImageLoader();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    // img.src = 'https://i.imgur.com/X8JjyKz.jpg';
    img.src = '/vhs_caps/009.jpg';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
        // How much of original image size to scale down
        const factor = 0.20;
        ctx.scale(factor, factor);
        ctx.drawImage(img, 0, 0);

        const w = img.width;
        const h = img.height;
        img.style.display = 'none';

        const imageData = ctx.getImageData(0, 0, parseInt(w*factor), parseInt(h*factor));

        const geometry = new THREE.Geometry();
        geometry.morphAttributes = {};

        const materialVertexColor = new THREE.PointsMaterial({
            size: 1,
            vertexColors: THREE.VertexColors,
            sizeAttenuation: false
        })

        let i = 0;
        for (let y = 0, height = imageData.height; y < height; y += 1) {
            for (let x = 0, width = imageData.width; x < width; x += 1) {
                const vertex = new THREE.Vector3(
                    x - imageData.width / 2,
                    -y + imageData.height / 2,
                    0
                );
                
                let index = i*4;
                r = imageData.data[index + 0]
                g = imageData.data[index + 1]
                b = imageData.data[index + 2]

                let gray = (r + g + b) / 3;
                let threshold = 100;

                // Z is based on fake depth given by gray (rgb average)
                vertex.z = 255/gray * 5;

                if (gray < threshold) {
                    if (gray < threshold / 3) {
                            vertex.z = gray * 2;

                    } else if (gray < threshold / 2) {
                            vertex.z = gray * 2.5;

                    } else {
                            vertex.z = gray * 3;
                    }
                } else {
                    vertex.z = gray;
                }
                vertex.z *= -1;

                const color = new THREE.Color(r/255,g/255,b/255);
                geometry.vertices.push(vertex);
                geometry.colors.push(color);

                i += 1;
            }
        }

        console.log("Created particles:", geometry.vertices.length, geometry.colors.length)

        const part = new THREE.Points(geometry, materialVertexColor);
        part.geometry.verticesNeedUpdate = true;
        part.geometry.colorsNeedUpdate = true;

        group.add(part);
    };
};

//
// Setup some keyboard event listeners
//
const initKeys = () => {
    
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        // console.log('keydown event\n\n' + 'key: ' + keyName);
        if (keyName === " ") {
            captureParticles();
        }
    });

};

//
// Setup camera
//
const initCamera = () => {
    const fov = 70;
    const aspect = width / height;

    camera = new THREE.PerspectiveCamera(fov, aspect, 1, 10000);
    const z = Math.min(window.innerWidth, window.innerHeight);
    //camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);

    scene.add(camera);
};

//
// Setup webcam
//
const initVideo = () => {
    video = document.getElementById("video");
    video.autoplay = true;

    const option = {
        video: true,
        audio: false
    };
    navigator.mediaDevices.getUserMedia(option)
        .then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", () => {
                videoWidth = video.videoWidth;
                videoHeight = video.videoHeight;

                document.body.classList.remove(classNameForLoading);
                createParticles();
            });
        })
        .catch((error) => {
            console.log(error);
            showAlert();
        });
};

//
// Create particle system for webcam
//
const createParticles = () => {
    const imageData = getImageData(video);
    const geometry = new THREE.Geometry();
    geometry.morphAttributes = {};

    const materialVertexColor = new THREE.PointsMaterial({
        size: 5,
        vertexColors: THREE.VertexColors
    })

    for (let y = 0, height = imageData.height; y < height; y += step) {
        for (let x = 0, width = imageData.width; x < width; x += step) {
            const vertex = new THREE.Vector3(
                x - imageData.width / 2,
                -y + imageData.height / 2,
                0
            );
            const color = new THREE.Color(0,0,0);
            geometry.vertices.push(vertex);
            geometry.colors.push(color);
        }
    }
    console.log("Created particles:", geometry.vertices.length)

    particles = new THREE.Points(geometry, materialVertexColor);

    group.add(particles);
};

const getImageData = (image, useCache) => {
    if (useCache && imageCache) {
        return imageCache;
    }

    const w = image.videoWidth;
    const h = image.videoHeight;

    canvas.width = w;
    canvas.height = h;

    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(image, 0, 0);
    imageCache = ctx.getImageData(0, 0, w, h);

    return imageCache;
};

//
// Capture/store particles we created before from webcam video at a global storage
//
const captureParticles = () => {
    if (capturedParticles) {
        const geometry = new THREE.Geometry();
        geometry.morphAttributes = {};

        const materialVertexColor = new THREE.PointsMaterial({
            size: 1,
            vertexColors: THREE.VertexColors
        })

        for (let i=0, len = particles.geometry.vertices.length; i < len; i += 1) {
            const v = particles.geometry.vertices[i].clone();
            v.x += 1000 * (capturedParticles.length+1);
            geometry.vertices.push(v);
            geometry.colors.push(particles.geometry.colors[i].clone());
        }

        const newParticles = new THREE.Points(geometry, materialVertexColor);
    
        capturedParticles.push(newParticles);

        if (group) {
            group.add(newParticles);
        }

        console.log("Captured!", newParticles);
    }
};

//
// Main rendering loop
//
const draw = (t) => {
    clock.getDelta();
    const time = clock.elapsedTime;
    let r, g, b;

    if (debug) {
        stats.begin();
    }

    // Webcam particles
    if (particles) {
        const density = 3;
        const useCache = parseInt(t) % 2 === 0;
        const imageData = getImageData(video, useCache);
        for (let i = 0, length = particles.geometry.vertices.length; i < length; i += 1) {
            const particle = particles.geometry.vertices[i];
            if (i % density !== 0) {
                particle.z = 10000;
                continue;
            }
            let index = i * 4;
            let gray = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
            let threshold = 300;

            r = imageData.data[index + 0]
            g = imageData.data[index + 1]
            b = imageData.data[index + 2]
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            particles.geometry.colors[i].set((r << 16) | (g << 8) | b);

            if (gray < threshold) {
                if (gray < threshold / 3) {
                    particle.z = gray * 2;

                } else if (gray < threshold / 2) {
                    particle.z = gray * 2.5;

                } else {
                    particle.z = gray * 3;
                }
            } else {
                particle.z = gray;
            }
        }
        particles.geometry.verticesNeedUpdate = true;
        particles.geometry.colorsNeedUpdate = true;
    }

    // TODO: We can iterate over all particles here and swing or interact in other ways
    // if (capturedParticles) {
    //     for (let i = 0, il = capturedParticles.length; i < il; i += 1) {

    //         for (let j = 0, jl = capturedParticles[i].geometry.vertices.length; j < jl; j += 1) {

    //             const particle = capturedParticles[i].geometry.vertices[j];
                
    //             capturedParticles[i].geometry.colors[j].set(0x0000ff);
    //             // particle.z = 100;
                
    //         }
    //         particles.geometry.verticesNeedUpdate = true;
    //         capturedParticles[i].geometry.colorsNeedUpdate = true;
    //     }
    // }

    renderer.render(scene, camera);

    if (debug) {
        stats.end();
    }

    requestAnimationFrame(draw);

    controls.update(clock.getDelta());
};

const showAlert = () => {
    document.getElementById("message").classList.remove("hidden");
};

const onResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
};

window.addEventListener("resize", onResize);

init();
