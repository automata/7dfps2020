const Stats = require("stats.js");
const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls.js');
// const { PointerLockManager } = require("./PointerLockManager")

const { RectAreaLightHelper } = require('three/examples/jsm/helpers/RectAreaLightHelper.js');
const { RectAreaLightUniformsLib } = require('three/examples/jsm/lights/RectAreaLightUniformsLib.js');
const { VertexNormalsHelper } = require('three/examples/jsm/helpers/VertexNormalsHelper.js');

window.THREE = require("three");

// Boom!

const vertex = new THREE.Vector3();
const color = new THREE.Color();

const sceneBg = 0x000000;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

var axes = new THREE.AxesHelper(50);
scene.add(axes);
var gridXZ = new THREE.GridHelper(500, 10);
scene.add(gridXZ);


// cube 1
var geometry = new THREE.BoxGeometry( 1, 1, 2 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// cube 2
var geometry2 = new THREE.BoxGeometry( 1, 1, 2 );
var material2 = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
var cube2 = new THREE.Mesh( geometry2, material2 );
scene.add( cube2 );


cube.position.z -= 10;

camera.position.z = 10;
camera.position.y = 10;
camera.lookAt(cube.position);

// const normals = new VertexNormalsHelper( cube, 2, 0x00ff00, 1 );
// scene.add(normals);

let frameCounter = 0;

var animate = function () {
	requestAnimationFrame( animate );
    cube.lookAt(cube2.position);
    cube2.lookAt(cube.position);
    console.log(cube2);
	cube2.position.x = Math.sin((frameCounter)/100) * 10;
	cube2.rotation.y += 0.01;

    renderer.render( scene, camera );
    
    frameCounter += 1;
};

animate();
///////////////
