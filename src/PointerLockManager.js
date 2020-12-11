const { PointerLockControls } = require('three/examples/jsm/controls/PointerLockControls.js');

export class PointerLockManager {
  constructor(camera, scene) {

    this.controls;

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );
  
    const havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
  
    if ( havePointerLock ) {
      const element = document.body;
      
      const pointerlockchange = function ( event ) {
        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
          //this.controls.enabled = true;
          blocker.style.display = 'none';
        } else {
          // this.controls.enabled = false;
          // blocker.style.display = '-webkit-box';
          // blocker.style.display = '-moz-box';
          // blocker.style.display = 'box';
          // instructions.style.display = '';
          blocker.style.display = '';
        }
      };
      const pointerlockerror = function ( event ) {
        // instructions.style.display = '';
        instructions.innerHTML = 'error';
      };
  
      // Hook pointer lock state change events
      document.addEventListener( 'pointerlockchange', pointerlockchange, false );
      document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
      document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
      document.addEventListener( 'pointerlockerror', pointerlockerror, false );
      document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
      document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
      blocker.addEventListener( 'click', function ( event ) {
        
        blocker.style.display = 'none';
  
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
  
      }, false );
    } else {
      instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }
  
    this.init(camera, scene);
  
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
  
    this.velocity = new THREE.Vector3();
    this.speed = 150;
    this.deltaTime = 0.06;

  }

	init(camera, scene) {
		this.controls = new PointerLockControls(camera);
		scene.add(this.controls.getObject());

		var onKeyDown = function ( event ) {
			switch ( event.keyCode ) {
				case 38: // up
				case 87: // w
					this.moveForward = true;
					break;
				case 37: // left
				case 65: // a
					this.moveLeft = true; break;
				case 40: // down
				case 83: // s
					this.moveBackward = true;
					break;
				case 39: // right
				case 68: // d
					this.moveRight = true;
					break;
				case 32: // space
					// if ( canJump === true ) this.velocity.y += 350;
					// canJump = false;
					break;
			}
		};
		var onKeyUp = function ( event ) {
			switch( event.keyCode ) {
				case 38: // up
				case 87: // w
					this.moveForward = false;
					break;
				case 37: // left
				case 65: // a
					this.moveLeft = false;
					break;
				case 40: // down
				case 83: // s
					this.moveBackward = false;
					break;
				case 39: // right
				case 68: // d
					this.moveRight = false;
					break;
			}
		};

		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );
	}

	update() {
		if ( this.controls.enabled ) {

			this.velocity.x -= this.velocity.x * 10.0 * this.deltaTime;
			this.velocity.z -= this.velocity.z * 10.0 * this.deltaTime;

			if ( this.moveForward ) this.velocity.z -= this.speed * this.deltaTime;
			if ( this.moveBackward ) this.velocity.z += this.speed * this.deltaTime;
			if ( this.moveLeft ) this.velocity.x -= this.speed * this.deltaTime;
			if ( this.moveRight ) this.velocity.x += this.speed * this.deltaTime;

			this.controls.getObject().translateX( this.velocity.x * this.deltaTime );
			this.controls.getObject().translateZ( this.velocity.z * this.deltaTime );
		}
	}

	getObject() {
		return this.controls.getObject();
	}
}
