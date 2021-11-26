import {
  enable3d,
  Scene3D,
  Canvas,
  ExtendedObject3D,
  THREE,
  FirstPersonControls,
} from "@enable3d/phaser-extension";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class MainScene extends Scene3D {
  wallFlag: Array<boolean> = [];
  fallFlag: Array<boolean> = [];
  rearFallFlag: Array<boolean> = [];
  antiFall: Array<number> = [];
  rightFlag: Array<boolean> = [];
  leftFlag: Array<boolean> = [];
  rightTurn: Array<boolean> = [];
  leftTurn: Array<boolean> = [];
  returnRabbit: Array<boolean> = [];
  maxLoop: Array<number> = [];
  redDot: Phaser.GameObjects.Arc | undefined;
  rabbit: Array<ExtendedObject3D> = [];
  rabbitTimer: Array<number> = [];
  rabbitRandomDirection: Array<number> = [];
  otherRabbit: Array<boolean> = [];

  howMutch: number = 25;
  lifeBars: Array<Array<ExtendedObject3D>> = [];
  rabbitSerial: number = 0;
  reproductionTimer: Array<number> = [];

  sensorRightTurnArray: Array<ExtendedObject3D> = [];
  sensorLeftTurnArray: Array<ExtendedObject3D> = [];
  sensorRearFallArray: Array<ExtendedObject3D> = [];
  sensorGroundFallArray: Array<ExtendedObject3D> = [];
  sensorGroundRightArray: Array<ExtendedObject3D> = [];
  sensorGroundLeftArray: Array<ExtendedObject3D> = [];
  sensorsOtherRabbit: Array<ExtendedObject3D> = [];

  gltfRabbits: Array<GLTF> = [];
  scene: ExtendedObject3D | any;
  player: ExtendedObject3D = new ExtendedObject3D();
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
    const { ground }: any = await this.third.warpSpeed(
      "-orbitControls",
      "-ground"
    );
    this.third.physics.debug?.enable();
 
    this.third.renderer.gammaFactor = 1.5;
     
    for (let i = 0; i <= 25; i++) {
      this.gltfRabbits[i] = await this.third.load.gltf(
        `/assets/rabbits/rabbit${i}.gltf`
      );
    }

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
    };
    addCurrentMap();

    const addRabbits = async (
      posX: number,
      posY: number,
      posZ: number,
      scale: number,
      mass: number,
      name: string,
      number: number
    ) => {
      const pos = { x: posX, y: posY, z: posZ };

      //sensor creation
      const sensorGroundLeft: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorGroundLeft${number}`,
          x: pos.x - 4.5,
          y: pos.y - 0.1,
          z: pos.z - 2,
          width: 0.1,
          height: 2,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorGroundLeft.castShadow = sensorGroundLeft.receiveShadow = false;
      this.sensorGroundLeftArray.splice(number, 1, sensorGroundLeft);

      const sensorGroundRight: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorGroundRight${number}`,
          x: pos.x - 4.5,
          y: pos.y - 0.1,
          z: pos.z + 2,
          width: 0.1,
          height: 2,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorGroundRight.castShadow = sensorGroundRight.receiveShadow = false;
      this.sensorGroundRightArray.splice(number, 1, sensorGroundRight);

      const sensorGroundFall: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorGroundFall${number}`,
          x: pos.x - 2,
          y: pos.y - 0.2,
          z: pos.z,
          width: 0.1,
          height: 0.8,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.0001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorGroundFall.castShadow = sensorGroundRight.receiveShadow = false;
      this.sensorGroundFallArray.splice(number, 1, sensorGroundFall);

      const sensorRearFall: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorRearFall${number}`,
          x: pos.x + 1.5,
          y: pos.y - 0.2,
          z: pos.z,
          width: 0.1,
          height: 0.8,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorRearFall.castShadow = sensorGroundRight.receiveShadow = false;
      this.sensorRearFallArray.splice(number, 1, sensorRearFall);

      const sensorLeftTurn: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorLeftTurn${number}`,
          x: pos.x,
          y: pos.y - 0.1,
          z: pos.z - 3.5,
          width: 0.1,
          height: 0.6,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorLeftTurn.castShadow = sensorLeftTurn.receiveShadow = false;
      this.sensorLeftTurnArray.splice(number, 1, sensorLeftTurn);

      const sensorRightTurn: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorRightTurn${number}`,
          x: pos.x,
          y: pos.y - 0.1,
          z: pos.z + 3.5,
          width: 0.1,
          height: 0.6,
          depth: 0.1,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorRightTurn.castShadow = sensorRightTurn.receiveShadow = false;
      this.sensorRightTurnArray.splice(number, 1, sensorRightTurn);

      const sensorOtherRabbits: ExtendedObject3D = this.third.physics.add.box(
        {
          name: `sensorOtherRabbits${number}`,
          x: pos.x - 1,
          y: pos.y + 0.3,
          z: pos.z,
          width: 1.99,
          height: 0.6,
          depth: 2,
          collisionFlags: 4, // set the flag to static
          mass: 0.00001,
        },
        { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
      );
      sensorOtherRabbits.castShadow = sensorOtherRabbits.receiveShadow = false;
      this.sensorsOtherRabbit.splice(number, 1, sensorOtherRabbits);

      //lifebar creation
      let array: Array<ExtendedObject3D> = [];
      for (let i = 0; i < 10; i++) {
        const lifeBar: ExtendedObject3D = this.third.physics.add.box(
          {
            name: `lifebar${i}${number}`,
            x: pos.x,
            y: pos.y + 0.5,
            z: pos.z + (-0.5 + i / 10),

            width: 0.1,
            height: 0.1,
            depth: 0.1,
            collisionFlags: 4, // set the flag to static
            mass: 0.1,
          },
          { lambert: { color: "red", transparent: true, opacity: 0.95 } }
        );
        lifeBar.castShadow = lifeBar.receiveShadow = false;
        array.splice(i, 1, lifeBar);
      }
      this.lifeBars.splice(number, 1, array);

      //rabbit creation

      const child = this.gltfRabbits[this.rabbitSerial].scenes[0];
      let newRabbit = new ExtendedObject3D();
      newRabbit.name = name;
      newRabbit.add(child);
      newRabbit.scale.x = 1 + scale / 10;
      newRabbit.scale.y = 1 + scale / 10;
      newRabbit.scale.z = 1 + scale / 10;
      newRabbit.position.x = pos.x;
      newRabbit.position.y = pos.y;
      newRabbit.position.z = pos.z;
      newRabbit.rotation.set(0, -Math.PI / 2, 0);
      
      //1 to 10 factors rabbitData

      newRabbit.userData.strength = Math.random() * 10;
      newRabbit.userData.fitness = Math.random() * 10;
      newRabbit.userData.fur = Math.random() * 10;
      newRabbit.userData.fertility = Math.random() * 10;
      newRabbit.userData.speed = Math.random() * 10;
      newRabbit.userData.scale = scale;
      newRabbit.userData.mass = mass;
      newRabbit.userData.sex = Boolean(Math.round(Math.random()));
      newRabbit.userData.serialNumber = number;
      newRabbit.userData.life = 10;
      newRabbit.userData.active = true;
      newRabbit.userData.type = 'rabbit'
      
      this.reproductionTimer[number] = 900;

      this.rabbit.push(newRabbit);
      this.third.scene.add(this.rabbit[number]);
      this.third.physics.add.existing(this.rabbit[number], {
        shape: "box",
        ignoreScale: true,
        width: 0.8,
        depth: 0.8,
        height: 0.2,
        mass: mass,
        collisionGroup: 1,
      });

      // constrain senor > rabbit

      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorLeftTurn.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorRightTurn.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorGroundLeft.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorGroundRight.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorGroundFall.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorRearFall.body
      );
      this.third.physics.add.constraints.lock(
        this.rabbit[number].body,
        sensorOtherRabbits.body
      );
      for (let i = 0; i < 10; i++) {
        this.third.physics.add.constraints.lock(
          this.rabbit[number].body,
          array[i].body
        );
      }

      //add coliders to sensors

      sensorGroundFall.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.fallFlag[number] = true;
          } else if (event === "start") {
            this.fallFlag[number] = false;
          } else if (this.rabbit[number].body !== undefined)
            this.rabbit[number]?.body.setAngularVelocityY(0);
        }
      });
      sensorRearFall.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.rearFallFlag[number] = true;
          } else if (event === "start") {
            this.rearFallFlag[number] = false;
          } else if (this.rabbit[number].body !== undefined)
            this.rabbit[number]?.body.setAngularVelocityY(0);
        }
      });
      sensorGroundLeft.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            if (this.rightFlag[number] === false) {
              this.leftFlag[number] = true;
            }
          } else if (event === "start") {
            this.leftFlag[number] = false;
            this.maxLoop[number] = 0;
          } else if (this.rabbit[number].body !== undefined)
            this.rabbit[number]?.body.setAngularVelocityY(0);
        }
      });
      sensorGroundRight.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            if (this.leftFlag[number] === false) {
              this.rightFlag[number] = true;
            }
          } else if (event === "start") {
            this.rightFlag[number] = false;
            this.maxLoop[number] = 0;
          } else if (this.rabbit[number].body !== undefined)
            this.rabbit[number]?.body.setAngularVelocityY(0);
        }
      });
      sensorLeftTurn.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.leftTurn[number] = true;
          } else if (event === "start") {
            this.leftTurn[number] = false;
          } else if (this.rabbit[number].body !== undefined) {
            this.rabbit[number]?.body.setAngularVelocityY(0);
          }
        }
      });
      sensorRightTurn.body.on.collision((otherObject, event) => {
        if (otherObject.name === "mesh_0") {
          if (event === "end") {
            this.rightTurn[number] = true;
          } else if (event === "start") {
            this.rightTurn[number] = false;
          } else if (this.rabbit[number].body !== undefined) {
            this.rabbit[number]?.body.setAngularVelocityY(0);
          }
        }
      });
      sensorOtherRabbits.body.on.collision((otherObject, event) => {
        if (otherObject.userData.type === "rabbit") {
          if (event === "start") {
            console.log('see')
            this.otherRabbit[number] = true;
            rabbitReproduction(this.rabbit[number], this.rabbit[otherObject.userData.serialNumber]);
          } else if (event === "end") {
            this.otherRabbit[number] = false;
          } else if (this.rabbit[number].body !== undefined) {
            this.rabbit[number]?.body.setAngularVelocityY(0);
          }
        }
      });
      for (let i = 0; i < 10; i++) {
        array[i].body.on.collision((otherObject, event) => {
          if (otherObject.name === "mesh_0") {
            if (event === "start") {
              this.returnRabbit[number] = true;
            } else if (event === "end") {
              this.returnRabbit[number] = false;
            } else if (this.rabbit[number].body !== undefined) {
              this.rabbit[number]?.body.setAngularVelocityY(0);
            }
          }
        });
      }
      if (posY === 12) {
        newRabbit.userData.life = 0.02;
      }
    };
    const recycleRabbits = async (
      posX: number,
      posY: number,
      posZ: number,
      scale: number,
      mass: number,
      name: string,
      number: number
    ) => {
      //1 to 10 factors rabbitData
      let token = 0;
      for (let i = 0; i < this.rabbit.length; i++) {
        if (
          this.rabbit[i].userData.active === false &&
          token === 0
        ) {
          console.log("recycled", i, this.rabbit[i].userData.life);
          token++;
          this.rabbit[i].userData.life = 10;
          this.rabbit[i].userData.strength = Math.random() * 10;
          this.rabbit[i].userData.fitness = Math.random() * 10;
          this.rabbit[i].userData.fur = Math.random() * 10;
          this.rabbit[i].userData.fertility = Math.random() * 10;
          this.rabbit[i].userData.speed = Math.random() * 10;
          this.rabbit[i].userData.scale = scale;
          this.rabbit[i].userData.mass = mass;
          this.rabbit[i].userData.sex = Boolean(Math.round(Math.random()));
          this.rabbit[i].userData.serialNumber = i;
          this.rabbit[i].userData.active = true;  
          this.rabbit[i].userData.type = 'rabbit';
          this.rabbit[i].userData.protection = true;
    
          this.rabbit[i].removeEventListener
          this.rabbit[i].position.set(posX, posY, posZ);
          this.rabbit[i].rotation.set(0, -Math.PI / 2, 0);
          this.reproductionTimer[i] = 1;
          
          if (this.third.physics !==  undefined) {
            this.third.physics.destroy(this.rabbit[i])
            
            
          }

          

          //sensor creation
          const sensorGroundLeft: ExtendedObject3D = this.third.physics.add.box(
            {
              name: `sensorGroundLeft${i}`,
              x: posX - 4.5,
              y: posY - 0.1,
              z: posZ - 2,
              width: 0.1,
              height: 2,
              depth: 0.1,
              collisionFlags: 4, // set the flag to static
              mass: 0.00001,
            },
            { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
          );
          sensorGroundLeft.castShadow = sensorGroundLeft.receiveShadow = false;
          this.sensorGroundLeftArray.splice(i, 1, sensorGroundLeft);

          const sensorGroundRight: ExtendedObject3D =
            this.third.physics.add.box(
              {
                name: `sensorGroundRight${i}`,
                x: posX - 4.5,
                y: posY - 0.1,
                z: posZ + 2,
                width: 0.1,
                height: 2,
                depth: 0.1,
                collisionFlags: 4, // set the flag to static
                mass: 0.00001,
              },
              { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
            );
          sensorGroundRight.castShadow = sensorGroundRight.receiveShadow =
            false;
          this.sensorGroundRightArray.splice(i, 1, sensorGroundRight);

       
          const sensorOtherRabbits: ExtendedObject3D =
            this.third.physics.add.box(
              {
                name: `sensorOtherRabbits${i}`,
                x: posX - 1,
                y: posY + 0.3,
                z: posZ,
                width: 1.99,
                height: 0.6,
                depth: 2,
                collisionFlags: 4, // set the flag to static
                mass: 0.00001,
              },
              { lambert: { color: 0xff00ff, transparent: true, opacity: 0.1 } }
            );
          sensorOtherRabbits.castShadow = sensorOtherRabbits.receiveShadow =
            false;
          this.sensorsOtherRabbit.splice(i, 1, sensorOtherRabbits);
          

          //rabbit physics
          this.third.physics.add.existing(this.rabbit[i], {
            shape: "box",
            ignoreScale: true,
            width: 0.8,
            depth: 0.8,
            height: 0.2,
            mass: mass,
            collisionGroup: 1,
          });
          this.third.physics.add.constraints.lock(
            this.rabbit[i].body,
            this.sensorsOtherRabbit[i].body
          );
         
          this.sensorGroundLeftArray[i].body.on.collision(
            (otherObject, event) => {
              if (otherObject.name === "mesh_0") {
                if (event === "end") {
                  if (this.rightFlag[i] === false) {
                    this.leftFlag[i] = true;
                  }
                } else if (event === "start") {
                  this.leftFlag[i] = false;
                  this.maxLoop[i] = 0;
                } else if (this.rabbit[i].body !== undefined)
                  this.rabbit[i]?.body.setAngularVelocityY(0);
              }
            }
          );
          this.sensorGroundRightArray[i].body.on.collision(
            (otherObject, event) => {
              if (otherObject.name === "mesh_0") {
                if (event === "end") {
                  if (this.leftFlag[i] === false) {
                    this.rightFlag[i] = true;
                  }
                } else if (event === "start") {
                  this.rightFlag[i] = false;
                  this.maxLoop[i] = 0;
                } else if (this.rabbit[i].body !== undefined)
                  this.rabbit[i]?.body.setAngularVelocityY(0);
              }
            }
          );
        
          sensorOtherRabbits.body.on.collision((otherObject, event) => {
            if (otherObject.userData.type === "rabbit") {
              if (event === "start") {
                console.log('see')
                this.otherRabbit[i] = true;
              } else if (event === "end") {
                this.otherRabbit[i] = false;
              } else if (this.rabbit[i].body !== undefined) {
                this.rabbit[i]?.body.setAngularVelocityY(0);
              }
            }
          });
        }
      }
    };

    const generarteRabbits = async () => {
      let posX: number = 1;
      let posY: number = 3;
      let posZ: number = -1;
      let scale: number = 1;
      let mass: number = 3;

      for (let i = 0; i < this.howMutch; i++) {
        const rabbitname: string = `rabbit${this.rabbitSerial}`;
        let serial: number = this.rabbitSerial;
        this.rabbitSerial++;
        posX = 1;
        posZ = -1;
        posX = posX * (i * 5);
        scale = 1 + (scale * i) / 20;
        mass = 10 + (mass * i) / 20;
        if (posX > 100) {
          posX - 100;
          posZ * 40;
        }
        if (this.rabbitSerial > 10) {
          posY = 12;
        }
        addRabbits(posX, posY, posZ, scale, mass, rabbitname, serial);
      }

     
    };
    generarteRabbits();

    const rabbitReproduction = async (
      rabbit1: ExtendedObject3D,
      rabbit2: ExtendedObject3D
    ) => {
      if (
        (rabbit1.userData.sex === true && rabbit2.userData.sex === false) 
      ) {
        if (this.reproductionTimer[rabbit1.userData.serialNumber] === 0) {
          this.reproductionTimer[rabbit1.userData.serialNumber]++;
          this.howMutch = 1;
          const posX: number = rabbit1.position.x + 1.5;
          const posY: number = rabbit1.position.y +0.5;
          const posZ: number = rabbit1.position.z;
          const scale: number =
            (rabbit1.userData.scale + rabbit2.userData.scale) / 2;
          let mass: number =
            (rabbit1.userData.mass + rabbit2.userData.mass) / 2;
            if (mass > 100 ) mass = 100
          const rabbitName: string = `rabbit${this.rabbitSerial}`;
          const serial: number = this.rabbitSerial;
          recycleRabbits(posX, posY, posZ, scale, mass, rabbitName, serial);
        }
      }
    };

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

  update(time: number, delta: number) {
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

    //rabbit section
    for (let i = 0; i < this.rabbit.length; i++) {
      if (this.rabbit[i] && this.rabbit[i].body) {
        if (this.reproductionTimer[i] === undefined)
          this.reproductionTimer[i] = 0;
        if (this.leftFlag[i] === undefined) this.leftFlag[i] = false;
        if (this.rightFlag[i] === undefined) this.rightFlag[i] = false;
        if (this.rightTurn[i] === undefined) this.rightTurn[i] = false;
        if (this.leftTurn[i] === undefined) this.leftTurn[i] = false;
        if (this.antiFall[i] === undefined) this.antiFall[i] = 100;
        if (this.maxLoop[i] === undefined) this.maxLoop[i] = 0;
        if (this.rabbitTimer[i] === undefined) this.rabbitTimer[i] = 0;
        if (this.rabbitRandomDirection[i] === undefined) {
          this.rabbitRandomDirection[i] = 0;
        }
        if (this.reproductionTimer[i] >= 1) this.reproductionTimer[i]++;
        if (this.reproductionTimer[i] >= 1000) this.reproductionTimer[i] = 0;
        if (this.otherRabbit[i] === undefined) this.otherRabbit[i] = false;
        const speed = this.rabbit[i].userData.speed;
        const rotation = this.rabbit[i].getWorldDirection(
          this.rabbit[i].rotation.toVector3()
        );
        const theta = Math.atan2(rotation.x, rotation.z);

        let x = Math.sin(theta) * speed,
          y = this.rabbit[i].body.velocity.y,
          z = Math.cos(theta) * speed;

        //left turn
        if (this.leftFlag[i] === true && this.rightTurn[i] === false) {
          this.rabbit[i]?.body.setAngularVelocityY(5);
          x = x / 2;
          z = z / 2;
        }

        //right turn
        if (this.rightFlag[i] === true && this.leftTurn[i] === false) {
          this.rabbit[i]?.body.setAngularVelocityY(-5);
          x = x / 2;
          z = z / 2;
        }

        // antifall"
        if (this.rearFallFlag[i] === true || this.fallFlag[i] === true) {
          z = z / 10;
          x = x / 10;
          this.rabbit[i]?.body.setAngularVelocityY(5);
        }
        //rabbits colisions
        if (this.otherRabbit[i] === true && this.rearFallFlag[i] === false) {
          z = -z / 5;
          x = -x / 5;
          this.rabbit[i]?.body.setAngularVelocityY(5);
        }
        if (this.otherRabbit[i] === true && this.rearFallFlag[i] === true) {
          z = z / 10;
          x = x / 10;
          this.rabbit[i]?.body.setAngularVelocityY(-5);
        }
        //aleatory displacement
        if (
          this.rabbitTimer[i] < 40 &&
          this.rightFlag[i] === false &&
          this.leftFlag[i] === false
        ) {
          this.rabbitTimer[i]++;
        } else if (
          this.rabbitTimer[i] === 40 &&
          this.rightFlag[i] === false &&
          this.leftFlag[i] === false
        ) {
          this.rabbitTimer[i]++;
          this.rabbitRandomDirection[i] =
            -5 * Math.random() + 5 * Math.random();
        } else if (
          this.rabbitTimer[i] > 40 &&
          this.rabbitTimer[i] <= 45 &&
          this.rightFlag[i] === false &&
          this.leftFlag[i] === false &&
          this.fallFlag[i] === false
        ) {
          if (this.leftTurn[i] === true) {
            if (this.rabbitRandomDirection[i] < 0)
              this.rabbitRandomDirection[i] =
                -2 * this.rabbitRandomDirection[i];
          }
          if (this.rightTurn[i] === true) {
            if (this.rabbitRandomDirection[i] > 0)
              this.rabbitRandomDirection[i] =
                -2 * this.rabbitRandomDirection[i];
          }
          this.rabbitTimer[i]++;
          this.rabbit[i]?.body.setAngularVelocityY(
            this.rabbitRandomDirection[i]
          );
        } else if (this.rabbitTimer[i] > 45) {
          this.rabbitTimer[i] = 0;
        }
        if (this.returnRabbit[i] === true) {
         
          this.rabbit[i].userData.life -= 1;
         
        }
        this.rabbit[i].body.setVelocity(x, y, z);
       
        if ( this.rabbit[i].userData.active === true){
          this.rabbit[i].userData.life -= 0.001;
        this.rabbit[i].userData.life =
          (Math.round(this.rabbit[i].userData.life * 1000)) / 1000;
       
        }
        
        if (
          this.rabbit[i].userData.life === 9 ||
          this.rabbit[i].userData.life === 8 ||
          this.rabbit[i].userData.life === 7 ||
          this.rabbit[i].userData.life === 6 ||
          this.rabbit[i].userData.life === 5 ||
          this.rabbit[i].userData.life === 4 ||
          this.rabbit[i].userData.life === 3 ||
          this.rabbit[i].userData.life === 2 ||
          this.rabbit[i].userData.life === 1
        ) {
         
         //  if (this.lifeBars[i][this.rabbit[i].userData.life] !== undefined )this.lifeBars[i][this.rabbit[i].userData.life].material.opacity = 0.2;
        } else if (
          this.rabbit[i].userData.life <= 0 &&
          this.rabbit[i].userData.active === true &&
          this.rabbit[i].userData.protection !== true
        ) {
          console.log(this.rabbit , this.rabbit[i].userData.life, 'rabit suprim')
         
          
          this.rabbit[i].userData.active = false;
          this.returnRabbit[i] === false
          this.rabbit[i].userData.life = 10;
          if (this.rabbit[i].body !== undefined){
          this.third.physics.destroy(this.rabbit[i]);
          this.rabbit[i].position.set(0, 12, 0);
          
         
          }
         
          
          if(this.sensorGroundFallArray[i].body !== undefined) {
            this.sensorGroundFallArray[i].removeEventListener
            this.third.destroy(this.sensorGroundFallArray[i]);
            this.third.cache.remove(`sensorGroundFall${i}`)
          }
          
          if(this.sensorGroundLeftArray[i].body !== undefined){
            this.sensorGroundLeftArray[i].removeEventListener
            this.third.destroy(this.sensorGroundLeftArray[i]);
            this.third.cache.remove(`sensorGroundLeft${i}`)
          }
         
          if(this.sensorGroundRightArray[i].body !== undefined){
            this.sensorGroundRightArray[i].removeEventListener
            this.third.destroy(this.sensorGroundRightArray[i]);
            this.third.cache.remove(`sensorGroundRight${i}`)
          }
            
          if(this.sensorLeftTurnArray[i].body !== undefined){
            this.sensorLeftTurnArray[i].removeEventListener;
            this.third.destroy(this.sensorLeftTurnArray[i]);
            this.third.cache.remove(`sensorLeftTurn${i}`)
          }
          if(this.sensorRearFallArray[i].body !== undefined){
            this.sensorRearFallArray[i].removeEventListener
            this.third.destroy(this.sensorRearFallArray[i]);
            this.third.cache.remove(`sensorRearFall${i}`)
          }
          
          if(this.sensorRightTurnArray[i].body !== undefined){
            this.sensorRearFallArray[i].removeEventListener
            this.third.destroy(this.sensorRightTurnArray[i]);
            this.third.cache.remove(`sensorRightTurn${i}`)
          }
          
          if(this.sensorsOtherRabbit[i].body !== undefined){
            this.sensorsOtherRabbit[i].removeEventListener
            this.third.destroy(this.sensorsOtherRabbit[i]);
            this.third.cache.remove(`sensorOtherRabbit${i}`)
          }
          
          for (let j = 0; j < 10; j++) {
            if(this.lifeBars[i][j].body !== undefined){
              this.lifeBars[i][j].removeEventListener
              this.third.destroy(this.lifeBars[i][j]);
              this.third.cache.remove(`lifeBar${i}${j}`)
            }
           
          }
        }else if (this.rabbit[i].userData.protection === true) {
          this.rabbit[i].userData.timer === 10
          this.rabbit[i].userData.protection === false
        }
      }
    }
  }
}
