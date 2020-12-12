const { PointerLockControls } = require('three/examples/jsm/controls/PointerLockControls.js');

export class PointerLockManager {
  constructor(camera, scene) {

    this.controls;
  
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
  
    this.velocity = new THREE.Vector3();
    this.speed = 500;
    this.deltaTime = 0.06;

    this.init(camera, scene);


  }

	init(camera, scene) {
		this.controls = new PointerLockControls(camera, document.body);
		

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    instructions.addEventListener( 'click', () => {

      this.controls.lock();

    }, false );

    this.controls.addEventListener( 'lock', () => {

      instructions.style.display = 'none';
      blocker.style.display = 'none';

    } );

    this.controls.addEventListener( 'unlock', () => {

      blocker.style.display = 'block';
      instructions.style.display = '';

    } );

    scene.add(this.controls.getObject());

		const onKeyDown =  ( event ) => {
      console.log(event.keyCode);
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
		var onKeyUp =  ( event ) => {
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
    //console.log(this.controls);
		if ( this.controls.isLocked ) {

			this.velocity.x -= this.velocity.x * 10.0 * this.deltaTime;
			this.velocity.z -= this.velocity.z * 10.0 * this.deltaTime;
      // this.velocity.y -= 9.8 * 100.0 * this.deltaTime;
      this.velocity.y = 0;

			if ( this.moveForward ) this.velocity.z -= this.speed * this.deltaTime;
			if ( this.moveBackward ) this.velocity.z += this.speed * this.deltaTime;
			if ( this.moveLeft ) this.velocity.x -= this.speed * this.deltaTime;
			if ( this.moveRight ) this.velocity.x += this.speed * this.deltaTime;

			this.controls.getObject().translateX( this.velocity.x * this.deltaTime );
      this.controls.getObject().translateZ( this.velocity.z * this.deltaTime );
      // Stay on the ground
      this.controls.getObject().position.y = 10;
		}
	}

	getObject() {
		return this.controls.getObject();
	}
}
