const Stats = require("stats.js");
// const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');
const { PointerLockManager } = require("./PointerLockManager")

const { RectAreaLightHelper } = require('three/examples/jsm/helpers/RectAreaLightHelper.js');
const { RectAreaLightUniformsLib } = require('three/examples/jsm/lights/RectAreaLightUniformsLib.js');

const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
const { RenderPass } = require('three/examples/jsm/postprocessing/RenderPass.js');
const { ShaderPass } = require('three/examples/jsm/postprocessing/ShaderPass.js');
const { UnrealBloomPass } = require('three/examples/jsm/postprocessing/UnrealBloomPass.js');

window.THREE = require("three");

let stats, particles, scene, group, deltaTime, composer,
    videoWidth, videoHeight, imageCache,
    renderer, camera, clock,
    width, height, video, controls,
    raycaster, mouse,
    soundBg, soundFx1, listener,
    raycasterFloor,
    frameCounter = 0,
    lastVisited = -1,
    currentFrame = 0,
    guideCubes = [],
    targetCube,
    allParticles = [],
    rectLightHelper, rectLight,
    capturedParticles = [];

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const classNameForLoading = "loading";
const debug = true;

const vertex = new THREE.Vector3();
const color = new THREE.Color();

const sceneBg = 0x202050;

const params = {
    exposure: 2,
    bloomStrength: 2.5,
    bloomThreshold: 0.2,
    bloomRadius: 0.5
};

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

    renderer = new THREE.WebGLRenderer({antialias:true, alpha: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById("content").appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneBg);
    scene.fog = new THREE.FogExp2( 0x502020, 0.002 );
    // scene.fog = new THREE.Fog(0x333333, 0, 750 );

    const light = new THREE.HemisphereLight( 0x502020, 0x202050, 0.5 );
    light.position.set( 0.5, 1, 0.5 );
    scene.add( light );

    // scene.add( new THREE.AmbientLight( 0x502020, 0.5 ) );

    // RectAreaLightUniformsLib.init();

    // rectLight = new THREE.RectAreaLight( 0xffffff, 2, 100, 10 );
    // rectLight.position.set( -50, 200, 10 );
    // rectLight.rotateY(95);
    // rectLight.rotateX(30)
    // scene.add( rectLight );

    // rectLightHelper = new RectAreaLightHelper( rectLight );
    // rectLight.add( rectLightHelper );

    const geoFloor = new THREE.BoxBufferGeometry( 10000, 0.1, 10000 );
    const matStdFloor = new THREE.MeshStandardMaterial( { color: 0x502020, roughness: 1, metalness: 0. } );
    const mshStdFloor = new THREE.Mesh( geoFloor, matStdFloor );
    mshStdFloor.receiveShadow = true;
    scene.add( mshStdFloor );

    particleSystem = createParticleSystem();
    scene.add(particleSystem);

    clock = new THREE.Clock();

    // Use only one group for all assets for now
    group = new THREE.Group();
    scene.add(group);

    // Camera
    initCamera();

    // Audio
    initAudio();

    // FPS Controls
    controls =  new PointerLockManager(camera, scene);

    // Interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Floor / ground

    composer = new EffectComposer( renderer );

    var renderPass = new RenderPass( scene, camera );
    
    
  
    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    composer.addPass( renderPass );
    // composer.addPass( fxaaPass );
    composer.addPass( bloomPass );

    // const renderScene = new RenderPass( scene, camera );

   
    // composer.addPass( renderScene );
    // composer.addPass( bloomPass );

    // initFloor();
    // raycasterFloor = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    onResize();

    initKeys();

    initMouse();

    draw();

    initImages();
};

const initAudio = () => {
    const listener = new THREE.AudioListener();
    camera.add( listener );

    const audioLoader = new THREE.AudioLoader();
    soundBg = new THREE.Audio( listener );
    soundFx1 = new THREE.Audio( listener );
    soundFx2 = new THREE.Audio( listener );
    soundFx3 = new THREE.Audio( listener );

    window.soundBg = soundBg;
    window.soundFx1 = soundFx1;

    audioLoader.load( 'audio/drone_nofx.mp3', ( buffer ) => {

        soundBg.setBuffer( buffer );
        // soundBg.setLoop( true );
        soundBg.setVolume( 0.1 );
        // soundBg.play();

    } );

    audioLoader.load( 'audio/fx_click.mp3', ( buffer ) => {

        soundFx1.setBuffer( buffer );
        soundFx1.setVolume( 0.5 );

    } );

    audioLoader.load( 'audio/fx_impulse.mp3', ( buffer ) => {

        soundFx2.setBuffer( buffer );
        soundFx2.setVolume( 0.5 );

    } );

    audioLoader.load( 'audio/bass_delay_hit.mp3', ( buffer ) => {

        soundFx3.setBuffer( buffer );
        soundFx3.setVolume( 0.5 );

    } );
};

const initFloor = () => {
    

};

function createParticleSystem() {
	
	// The number of particles in a particle system is not easily changed.
    var particleCount = 1000;
    
    // Particles are just individual vertices in a geometry
    // Create the geometry that will hold all of the vertices
    var particles = new THREE.Geometry();

	// Create the vertices and add them to the particles geometry
	for (var p = 0; p < particleCount; p++) {
	
		// This will create all the vertices in a range of -200 to 200 in all directions
		var x = Math.random() * 400 - 200;
		var y = Math.random() * 400 - 200;
		var z = Math.random() * 400 - 200;
		      
		// Create the vertex
		var particle = new THREE.Vector3(x, y, z);
		
		// Add the vertex to the geometry
		particles.vertices.push(particle);
	}

	// Create the material that will be used to render each vertex of the geometry
	var particleMaterial = new THREE.PointsMaterial(
			{color: 0x502020, 
			 size: 1,
			 blending: THREE.AdditiveBlending,
			 transparent: true,
			});
	 

	particleSystem = new THREE.Points(particles, particleMaterial);

	return particleSystem;	
}

const initImages = () => {

    // for (let i=1; i<=10; i+=1) {
    //     const margin = 200;
    //     const str_i = `${i}`.padStart(4, 0);
    //     loadImage(`vhs_caps/${str_i}.jpg`, 0,  0, i*margin);
    // }
    loadImage(currentFrame, 0,  0, 0);

};

//
// Load an image as particles using some threshold for RGB as fake depth on z-axis
//
const loadImage = (index, anchorX, anchorY, anchorZ) => {

    const str_i = `${index+1}`.padStart(4, 0);
    const uri = `vhs_caps/${str_i}.jpg`;

    const loader = new THREE.ImageLoader();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = uri;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
        // How much of original image size to scale down
        const factor = 0.1;
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
            sizeAttenuation: true,
            transparent: true
        })

        // Guiding cube
        const guideGeo = new THREE.TetrahedronGeometry(10, 0); // THREE.BoxGeometry(5,5,5);
        const guideMat = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true } );
        const guideCube = new THREE.Mesh( guideGeo, guideMat );
        guideCube.position.x = anchorX  + (parseInt(w*factor)/2);
        // if (Math.random() > 0.5) {
        //     guideCube.position.x += Math.random() * 50;
        // } else {
        //     guideCube.position.x -= Math.random() * 50;
        // }
        guideCube.position.y = anchorY + 10;
        // if (Math.random() > 0.5) {
        //     guideCube.position.y += Math.random() * 20;
        // } else {
        //     guideCube.position.y -= Math.random() * 20;
        // }

        guideCube.position.z = anchorZ - 100;
        let randomAngle = Math.random() * Math.PI/10;
        // guideCube.rotation.y = randomAngle;
        guideCubes.push(guideCube);
        //guideCubes.push(new THREE.Vector3(guideCube.position.x, guideCube.position.y, guideCube.position.z));
        
        scene.add( guideCube );

        let i = 0;
        for (let y = 0, height = imageData.height; y < height; y += 1) {
            for (let x = 0, width = imageData.width; x < width; x += 1) {
                const vertex = new THREE.Vector3(
                    anchorX + x, //(x - imageData.width / 2),
                    anchorY + y, // (-y + imageData.height / 2),
                    anchorZ
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
                
                vertex.z += anchorZ;
                //vertex.z *= -1;

                const color = new THREE.Color(r/255,g/255,b/255);
                geometry.vertices.push(vertex);
                geometry.colors.push(color);

                i += 1;
            }
        }

        console.log("Created particles:", geometry.vertices.length, geometry.colors.length)

        const part = new THREE.Points(geometry, materialVertexColor);
        // part.rotation.y = randomAngle;
        part.geometry.verticesNeedUpdate = true;
        part.geometry.colorsNeedUpdate = true;
        allParticles.push(part);

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

const initMouse = () => {
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
};

const onDocumentMouseMove = (event) => {
    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
};

//
// Setup camera
//
const initCamera = () => {
    const fov = 60;
    const aspect = width / height;

    camera = new THREE.PerspectiveCamera(fov, aspect, 1, 10000);

    camera.rotation.y = Math.PI * 3;
    camera.position.set(55, 20, -150);
    //camera.lookAt(0, 0, 0);

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
        size: 3,
        vertexColors: THREE.VertexColors,
        transparent: true
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
            vertexColors: THREE.VertexColors,
            transparent: true
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

function animateParticles() {
	var verts = particleSystem.geometry.vertices;
	for(var i = 0; i < verts.length; i++) {
		var vert = verts[i];
		if (vert.y < -200) {
			vert.y = Math.random() * 400 - 200;
		}
		vert.y = vert.y - (12 * deltaTime);
	}
	
	
    particleSystem.rotation.y -= .1 * deltaTime;
    particleSystem.position.x = controls.getObject().position.x;
    particleSystem.position.z = controls.getObject().position.z;
    particleSystem.geometry.verticesNeedUpdate = true;
}

//
// Main rendering loop
//
const draw = (t) => {
    deltaTime = clock.getDelta();
    const time = clock.elapsedTime;
    let r, g, b;

    if (debug) {
        stats.begin();
    }

    raycaster.setFromCamera( mouse, camera );

    let playerPos = controls.getObject().position;
    if (currentFrame < guideCubes.length) {
        let guidePos = guideCubes[currentFrame];
        let dist = Math.sqrt( 
                Math.pow( playerPos.x - guidePos.position.x, 2 ) +
                Math.pow( playerPos.z - guidePos.position.z, 2 )
        );
        if (dist < 10 && currentFrame > lastVisited) {
            guidePos.material.color.set(0x202050)
            if (!soundFx2.isPlaying) {
                soundFx2.play();
            }

            lastVisited = currentFrame;
            currentFrame++;
            let rx = 100 + 500 * Math.random();
            if (Math.random() > 0.5) {
                rx *= -1;
            }
            loadImage(currentFrame, playerPos.x + rx, 0, playerPos.z + 500);
            // loadImage(currentFrame, 0, 0, playerPos.z + 500);
        }
    }

    window.currentFrame = currentFrame;

    for (let i=0; i<guideCubes.length; i+=1) {
        let guideC = guideCubes[i];
        guideC.rotation.y += 0.01;
        guideC.position.y = 10 + Math.sin(frameCounter/50);
    }

    animateParticles();

    // renderer.render(scene, camera);
    composer.render();

    frameCounter += 1;

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
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;

    composer.setSize( width, height );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
};

window.addEventListener("resize", onResize);

init();
