import {
  enable3d,
  Scene3D,
  Canvas,
  ExtendedObject3D,
  THREE,
  FirstPersonControls,
} from "@enable3d/phaser-extension";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class MainScene extends Scene3D {
  wallFlag: boolean = false;
  fallFlag: boolean  = false;
  rearFallFlag: boolean  = false;
  antiFall: number = 100;
  rightFlag: boolean  = false;
  leftFlag: boolean  = false;
  rightTurn : boolean = false;
  leftTurn : boolean = false ;
  maxLoop: number = 0;
  redDot: Phaser.GameObjects.Arc | undefined;
  rabbit: ExtendedObject3D = new ExtendedObject3D;
  rabbitTimer: number  = 0;
  rabbitRandomDirection : number = 0
  scene: ExtendedObject3D | any;
  player: ExtendedObject3D  = new ExtendedObject3D;
  firstPersonControls: FirstPersonControls | undefined;
  move: { x: number; y: number; z: number };
  keys:
    | {
        space: Phaser.Input.Keyboard.Key;
        z: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
        q: Phaser.Input.Keyboard.Key;
        e: Phaser.Input.Keyboard.Key;
      }
    | undefined;

  constructor() {
    super({ key: "MainScene" });
    this.move = { x: 0, y: 0, z: 0 };
  }

  async create() {
    this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 180 });
    // this.third.warpSpeed("-orbitControls");
    const { ground }: any = await this.third.warpSpeed(
      "-orbitControls",
      "-ground"
    );
    //this.third.haveSomeFun(50)
    this.third.renderer.gammaFactor = 1.5;

    // const { lights } = await this.third.warpSpeed("-ground", "-orbitControls");
    // const hemisphereLight: any = lights?.hemisphereLight;
    // const ambientLight: any = lights?.ambientLight;
    // const directionalLight: any = lights?.directionalLight;
    // const intensity = 0.4;
    // hemisphereLight.intensity = intensity;
    // ambientLight.intensity = intensity;
    // directionalLight.intensity = intensity;
    // this.third.warpSpeed("light", "camera", "sky", "ground", "orbitControls");
    //this.third.physics.debug?.enable();
    // this.third.renderer.gammaFactor = 1.5;
    const pos = { x: 1, y: 4, z: -1 };
    const sensorGroundLeft : ExtendedObject3D = this.third.physics.add.box(
      {
        x: pos.x - 4,
        y: pos.y - 0.1,
        z: pos.z - 1.5,
        width: 0.1,
        height: 0.7,
        depth: 0.1,
        collisionFlags: 4, // set the flag to static
        mass: 0.00001,
      },
      { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
    );
    sensorGroundLeft.castShadow = sensorGroundLeft.receiveShadow = false;
    //sensorGroundLeft.body.setCollisionFlags(4);
    const sensorGroundRight : ExtendedObject3D = this.third.physics.add.box(
      {
        x: pos.x - 4,
        y: pos.y - 0.1,
        z: pos.z + 1.5,
        width: 0.1,
        height: 0.7,
        depth: 0.1,
        collisionFlags: 4, // set the flag to static
        mass: 0.00001,
      },
      { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
    );
    sensorGroundRight.castShadow = sensorGroundRight.receiveShadow = false;

    const sensorGroundFall : ExtendedObject3D= this.third.physics.add.box(
      {
        x: pos.x - 1.2,
        y: pos.y - 0.2,
        z: pos.z,
        width: 0.1,
        height: 0.8,
        depth: 0.1,
        collisionFlags: 4, // set the flag to static
        mass: 0.0001,
      },
      { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
    );
    sensorGroundFall.castShadow = sensorGroundRight.receiveShadow = false;
    const sensorRearFall : ExtendedObject3D = this.third.physics.add.box(
      {
        x: pos.x + 0.7,
        y: pos.y - 0.2,
        z: pos.z,
        width: 0.1,
        height: 0.8,
        depth: 0.1,
        collisionFlags: 4, // set the flag to static
        mass: 0.00001,
      },
      { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
    );
    sensorRearFall.castShadow = sensorGroundRight.receiveShadow = false;

    const sensorLeftTurn : ExtendedObject3D = this.third.physics.add.box(
      {
        x: pos.x ,
        y: pos.y - 0.1,
        z: pos.z - 3,
        width: 0.1,
        height: 0.6,
        depth: 0.1,
        collisionFlags: 4, // set the flag to static
        mass: 0.00001,
      },
      { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
    );
    sensorLeftTurn.castShadow = sensorLeftTurn.receiveShadow = false;
    const sensorRightTurn : ExtendedObject3D = this.third.physics.add.box(
        {
          x: pos.x ,
          y: pos.y - 0.1,
          z: pos.z + 3,
          width: 0.1,
          height: 0.6,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.2 } }
      );
      sensorRightTurn.castShadow = sensorRightTurn.receiveShadow = false;
    const addCurrentMap = async () => {
      const object = await this.third.load.gltf("/assets/world.gltf");
      const scene = object.scenes[0];

      const currentMap: ExtendedObject3D = new ExtendedObject3D();
      currentMap.name = "scene";
      currentMap.add(scene);
      currentMap.scale.x = 10;
      currentMap.scale.y = 10;
      currentMap.scale.z = 10;
      currentMap.position.x = -11;
      currentMap.position.z = 11;

      this.third.add.existing(currentMap);

      currentMap.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = false;
          if (/mesh/i.test(child.name)) {
            this.third.physics.add.existing(child, {
              shape: "concave",
              mass: 1,
              collisionFlags: 1,
              autoCenter: false,
            });
            child.body.setAngularFactor(0, 0, 0);
            child.body.setLinearFactor(0, 0, 0);
          }
        }
      });

      sensorGroundFall.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.fallFlag = true;
          } else if (event === "start") {
            this.fallFlag = false;        
          } else this.rabbit?.body.setAngularVelocityY(0);
        }
      });
      sensorRearFall.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
        if (event === "end") {
          this.rearFallFlag = true;
        } else if (event === "start") {
          this.rearFallFlag = false;
        } else this.rabbit?.body.setAngularVelocityY(0);
    }
      });
      sensorGroundLeft.body.on.collision((otherObject, event) => {
          
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            if (this.rightFlag === false) {
              this.leftFlag = true;
            }
          } else if (event === "start") {
            this.leftFlag = false;
            this.maxLoop = 0;
          } else this.rabbit?.body.setAngularVelocityY(0);
        }
      });
      sensorGroundRight.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            if (this.leftFlag === false) {
              this.rightFlag = true;
            }
          } else if (event === "start") {
            this.rightFlag = false;
            this.maxLoop = 0;
          } else this.rabbit?.body.setAngularVelocityY(0);
        }
      });
      sensorLeftTurn.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.leftTurn = true;
            //this.rabbit?.body.setAngularVelocityY(5);
          } else if (event === "start") {
            this.leftTurn = false;
          } else {
            this.rabbit?.body.setAngularVelocityY(0);
          }
        }
      });
      sensorRightTurn.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.rightTurn = true;
          } else if (event === "start") {
            this.rightTurn = false;
          } else {
            this.rabbit?.body.setAngularVelocityY(0);
          }
        }
      });

      //this.third.haveSomeFun(20);
    };
    addCurrentMap();

    this.third.load.gltf("/assets/rabbit.gltf").then((gltf) => {
      const child = gltf.scene.children[0];
      this.rabbit = new ExtendedObject3D();
      this.rabbit.name = "rabbit";
      this.rabbit.add(child);

      this.rabbit.scale.x = 1;
      this.rabbit.scale.y = 1;
      this.rabbit.scale.z = 1;
      this.rabbit.position.x = pos.x;
      this.rabbit.position.y = pos.y;
      this.rabbit.position.z = pos.z;
      this.rabbit.rotation.set(0, -Math.PI / 2, 0);
      this.third.scene.add(this.rabbit);
      this.third.physics.add.existing(this.rabbit, {
        shape: "box",
        ignoreScale: true,
        width: 0.6,
        depth: 0.6,
        height: 0.2,
        mass: 10,
      });
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorLeftTurn.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorRightTurn.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorGroundLeft.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorGroundRight.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorGroundFall.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit.body,
        sensorRearFall.body
      );
    });

    // add red dot
    this.redDot = this.add.circle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      4,
      0xff0000
    );
    this.redDot.depth = 1;

    // add player

    this.player = this.third.physics.add.box(
      {
        x: 10,
        y: 10,
        z: 10,
        width: 0.5,
        height: 0.5,
        depth: 0.5,
        mass: 1,
        collisionFlags: 0,
      },
      { lambert: { color: "blue" } }
    );
    //this.player.position.setY(2)

    // add first person controls
    this.firstPersonControls = new FirstPersonControls(
      this.third.camera,
      this.player,
      {}
    );

    this.input.on("pointerdown", () => {
      this.input.mouse.requestPointerLock();
    });
    this.input.on("pointermove", (pointer) => {
      if (this.input.mouse.locked) {
        this.firstPersonControls?.update(pointer.movementX, pointer.movementY);
      }
    });

    this.input.keyboard.on("keydown", (key) => {
      //console.log("key", key);
    });

    this.events.on("update", (e) => {
      this.firstPersonControls?.update(0, 0);
    });

    // add keys
    this.keys = {
      z: this.input.keyboard.addKey("z"),
      q: this.input.keyboard.addKey("q"),
      s: this.input.keyboard.addKey("s"),
      d: this.input.keyboard.addKey("d"),
      a: this.input.keyboard.addKey("q"),
      e: this.input.keyboard.addKey("e"),
      space: this.input.keyboard.addKey(32),
    };
  }
  jump() {
    if (!this.player) return;
    //this.canJump = false
    //this.isJumping = true

    this.time.addEvent({
      delay: 750,
      //  callback: () => (this.canJump = true)
    });
    this.time.addEvent({
      delay: 750,
      callback: () => {
        // this.isJumping = false
      },
    });
    this.player.body.applyForceY(0.5);
  }

  update(time : number, delta : number) {
    const speed = 8.5;
    const direction = new THREE.Vector3();
    const rotation = this.third.camera.getWorldDirection(direction);
    const theta = Math.atan2(rotation.x, rotation.z);

    if (this.player) {
      if (this.keys?.z.isDown) {
        this.player.body.setVelocity(
          Math.sin(theta) * speed,
          this.player.body.velocity.y,
          Math.cos(theta) * speed
        );
        this.player.position.x += Math.sin(theta) * speed;
        this.player.position.z += Math.cos(theta) * speed;
      } else if (this.keys?.s.isDown) {
        this.player.body.setVelocity(
          -Math.sin(theta) * speed,
          this.player.body.velocity.y,
          -Math.cos(theta) * speed
        );
        this.player.position.x -= Math.sin(theta) * speed;
        this.player.position.z -= Math.cos(theta) * speed;
      }

      // move sideways
      if (this.keys?.q.isDown) {
        this.player.body.setVelocity(
          Math.sin(theta + Math.PI * 0.5) * speed,
          this.player.body.velocity.y,
          Math.cos(theta + Math.PI * 0.5) * speed
        );
        this.player.position.x += Math.sin(theta + Math.PI * 0.5) * speed;
        this.player.position.z += Math.cos(theta + Math.PI * 0.5) * speed;
      } else if (this.keys?.d.isDown) {
        this.player.body.setVelocity(
          Math.sin(theta - Math.PI * 0.5) * speed,
          this.player.body.velocity.y,
          Math.cos(theta - Math.PI * 0.5) * speed
        );
        this.player.position.x += Math.sin(theta - Math.PI * 0.5) * speed;
        this.player.position.z += Math.cos(theta - Math.PI * 0.5) * speed;
      }
    }
    /**
     * Player Jump
     */
    if (this.keys?.space.isDown) {
      this.jump();
    }

    if (this.rabbit && this.rabbit.body) {
      const speed = 4;
     
      const rotation = this.rabbit.getWorldDirection(
        this.rabbit.rotation.toVector3()
      );
      const theta = Math.atan2(rotation.x, rotation.z);

      let x = Math.sin(theta) * speed,
        y = this.rabbit.body.velocity.y,
        z = Math.cos(theta) * speed;

      if (this.leftFlag === true && this.maxLoop < 10 && this.rightTurn === false) {
        this.maxLoop++;
        this.rabbit?.body.setAngularVelocityY(5);
        x = x/2
        z = z/2
      }
      if (this.leftFlag === true && this.maxLoop < 10 && this.rightTurn === true) {
        this.maxLoop++;
        this.rabbit?.body.setAngularVelocityY(-5);
        x = x/2
        z = z/2
      }
      if (this.rightFlag === true && this.maxLoop < 10 && this.leftTurn === false) {
        this.maxLoop++;
        this.rabbit?.body.setAngularVelocityY(-5);
        x = x/2
        z = z/2
      }
      if (this.rightFlag === true && this.maxLoop < 10 && this.leftTurn === true) {
        this.maxLoop++;
        this.rabbit?.body.setAngularVelocityY(5);
        x = x/2
        z = z/2
      }
      if (this.antiFall < 40 && this.rearFallFlag === false) {
        x = x/10;
        z = z/10;
        this.antiFall++;
        this.rabbit?.body.setAngularVelocityY(0);
        console.log(this.antiFall, "antifall");
      }
      if (this.antiFall < 40 && this.rearFallFlag === true) {
        this.antiFall = 41;
      }
      if (this.antiFall >= 41 && this.antiFall < 61) {
        this.antiFall++;
        x = 0;
        z = 0;
      }
      if (this.fallFlag === true && this.antiFall > 40) {
        this.antiFall = 0;
      }
      if (
        this.rabbitTimer < 40 &&
        this.rightFlag === false &&
        this.leftFlag === false
      ) {
        this.rabbitTimer++;
      } else if (
        this.rabbitTimer === 40 &&
        this.rightFlag === false &&
        this.leftFlag === false
      ) {
        this.rabbitTimer ++;
        this.rabbitRandomDirection =  -5 * Math.random() + 5 * Math.random()
        
      }else if (
        this.rabbitTimer > 40 &&
        this.rabbitTimer <= 45 &&
        this.rightFlag === false &&
        this.leftFlag === false &&
        this.fallFlag===false
      ){
        if (this.leftTurn === true){
            if (this.rabbitRandomDirection < 0 ) this.rabbitRandomDirection = -1* this.rabbitRandomDirection
        }
        if (this.rightTurn === true){
            if (this.rabbitRandomDirection > 0 ) this.rabbitRandomDirection = -1* this.rabbitRandomDirection
        }
          console.log('turnrurn')
        this.rabbitTimer ++;
        this.rabbit?.body.setAngularVelocityY(
            this.rabbitRandomDirection
          );
      }else if (this.rabbitTimer > 45){
          this.rabbitTimer = 0
      }
      this.rabbit.body.setVelocity(x, y, z);
    }
  }
}
