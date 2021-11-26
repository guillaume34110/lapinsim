import {
    enable3d,
    Scene3D,
    Canvas,
    ExtendedObject3D,
    THREE,
    FirstPersonControls,
  } from "@enable3d/phaser-extension";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Rabbit extends Scene3D {
    rabbit: ExtendedObject3D = new ExtendedObject3D;
    rabbitTimer: number  = 0;
    wallFlag: boolean = false;
    fallFlag: boolean  = false;
    rearFallFlag: boolean  = false;
    antiFall: number = 100;
    rightFlag: boolean  = false;
    leftFlag: boolean  = false;
    rightTurn : boolean = false;
    leftTurn : boolean = false ;
    maxLoop: number = 0;
    rabbitRandomDirection : number = 0;
    
    constructor() {
        super({ key: "MainScene" });
      }
    
      async create() {
   
        //this.accessThirdDimension({ maxSubSteps: 10, fixedTimeStep: 1 / 180 });
    

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
    
        this.third.load.gltf("/assets/rabbit.gltf").then((gltf) => {
        const child = gltf.scene.children[0];
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
    }

    update(time : number, delta : number) {
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
          //this.rabbit?.body.setAngularVelocityY(0);
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
