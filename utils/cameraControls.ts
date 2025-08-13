import * as THREE from "three";

export interface CameraControlsConfig {
  enableOrbit: boolean;
  enableWASD: boolean;
  enableZoom: boolean;
  minDistance: number;
  maxDistance: number;
  moveSpeed: number;
  rotateSpeed: number;
  zoomSpeed: number;
  dampingFactor: number;
}

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private config: CameraControlsConfig;

  // Orbital controls state
  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();
  private target = new THREE.Vector3();
  private targetEnd = new THREE.Vector3();

  // WASD movement state
  private moveVector = new THREE.Vector3();
  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };

  // Mouse state
  private mouse = new THREE.Vector2();
  private lastMouse = new THREE.Vector2();
  private isMouseDown = false;
  private mouseButton = -1;

  // Touch state for mobile
  private touches = new Map<number, THREE.Vector2>();
  private lastTouchDistance = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config: Partial<CameraControlsConfig> = {},
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = {
      enableOrbit: true,
      enableWASD: true,
      enableZoom: true,
      minDistance: 3,
      maxDistance: 50,
      moveSpeed: 5,
      rotateSpeed: 1,
      zoomSpeed: 1,
      dampingFactor: 0.1,
      ...config,
    };

    this.setupEventListeners();
    this.updateSpherical();
  }

  private setupEventListeners() {
    // Mouse events
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.addEventListener("wheel", this.onWheel.bind(this));

    // Touch events for mobile
    this.domElement.addEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
    );
    this.domElement.addEventListener("touchmove", this.onTouchMove.bind(this));
    this.domElement.addEventListener("touchend", this.onTouchEnd.bind(this));

    // Keyboard events
    if (this.config.enableWASD) {
      window.addEventListener("keydown", this.onKeyDown.bind(this));
      window.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    // Prevent context menu
    this.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private updateSpherical() {
    const offset = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target,
    );

    this.spherical.setFromVector3(offset);
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.config.enableOrbit) return;

    this.isMouseDown = true;
    this.mouseButton = event.button;
    this.lastMouse.set(event.clientX, event.clientY);
  }

  private onMouseMove(event: MouseEvent) {
    this.mouse.set(event.clientX, event.clientY);

    if (!this.isMouseDown || !this.config.enableOrbit) return;

    const deltaX = this.mouse.x - this.lastMouse.x;
    const deltaY = this.mouse.y - this.lastMouse.y;

    if (this.mouseButton === 0) {
      // Left mouse button - rotate
      this.sphericalDelta.theta -= deltaX * 0.01 * this.config.rotateSpeed;
      this.sphericalDelta.phi -= deltaY * 0.01 * this.config.rotateSpeed;
    } else if (this.mouseButton === 2) {
      // Right mouse button - pan
      this.panCamera(deltaX, deltaY);
    }

    this.lastMouse.copy(this.mouse);
  }

  private onMouseUp() {
    this.isMouseDown = false;
    this.mouseButton = -1;
  }

  private onWheel(event: WheelEvent) {
    if (!this.config.enableZoom) return;

    event.preventDefault();
    const delta = event.deltaY > 0 ? 1.1 : 0.9;

    this.spherical.radius *= delta * this.config.zoomSpeed;
    this.spherical.radius = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, this.spherical.radius),
    );
  }

  private onTouchStart(event: TouchEvent) {
    event.preventDefault();

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];

      this.touches.set(
        touch.identifier,
        new THREE.Vector2(touch.clientX, touch.clientY),
      );
    }

    if (event.touches.length === 2) {
      const touch1 = this.touches.get(event.touches[0].identifier)!;
      const touch2 = this.touches.get(event.touches[1].identifier)!;

      this.lastTouchDistance = touch1.distanceTo(touch2);
    }
  }

  private onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 1) {
      // Single touch - rotate
      const touch = event.touches[0];
      const lastTouch = this.touches.get(touch.identifier);

      if (lastTouch) {
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;

        this.sphericalDelta.theta -= deltaX * 0.01 * this.config.rotateSpeed;
        this.sphericalDelta.phi -= deltaY * 0.01 * this.config.rotateSpeed;

        lastTouch.set(touch.clientX, touch.clientY);
      }
    } else if (event.touches.length === 2) {
      // Two touches - zoom
      const touch1 = this.touches.get(event.touches[0].identifier)!;
      const touch2 = this.touches.get(event.touches[1].identifier)!;

      touch1.set(event.touches[0].clientX, event.touches[0].clientY);
      touch2.set(event.touches[1].clientX, event.touches[1].clientY);

      const distance = touch1.distanceTo(touch2);
      const delta = distance / this.lastTouchDistance;

      this.spherical.radius /= delta * this.config.zoomSpeed;
      this.spherical.radius = Math.max(
        this.config.minDistance,
        Math.min(this.config.maxDistance, this.spherical.radius),
      );

      this.lastTouchDistance = distance;
    }
  }

  private onTouchEnd(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      this.touches.delete(touch.identifier);
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.keys.forward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.keys.backward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.keys.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.keys.right = true;
        break;
      case "KeyQ":
        this.keys.up = true;
        break;
      case "KeyE":
        this.keys.down = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.keys.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.keys.backward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.keys.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.keys.right = false;
        break;
      case "KeyQ":
        this.keys.up = false;
        break;
      case "KeyE":
        this.keys.down = false;
        break;
    }
  }

  private panCamera(deltaX: number, deltaY: number) {
    const offset = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target,
    );
    const targetDistance = offset.length();

    // Calculate pan vectors
    const panLeft = new THREE.Vector3();
    const panUp = new THREE.Vector3();

    panLeft.setFromMatrixColumn(this.camera.matrix, 0);
    panUp.setFromMatrixColumn(this.camera.matrix, 1);

    panLeft.multiplyScalar(-deltaX * targetDistance * 0.001);
    panUp.multiplyScalar(deltaY * targetDistance * 0.001);

    this.targetEnd.add(panLeft).add(panUp);
  }

  public update(deltaTime: number) {
    // Update WASD movement
    if (this.config.enableWASD) {
      this.moveVector.set(0, 0, 0);

      if (this.keys.forward) this.moveVector.z -= 1;
      if (this.keys.backward) this.moveVector.z += 1;
      if (this.keys.left) this.moveVector.x -= 1;
      if (this.keys.right) this.moveVector.x += 1;
      if (this.keys.up) this.moveVector.y += 1;
      if (this.keys.down) this.moveVector.y -= 1;

      if (this.moveVector.length() > 0) {
        this.moveVector.normalize();
        this.moveVector.multiplyScalar(this.config.moveSpeed * deltaTime);

        // Transform movement relative to camera orientation
        this.moveVector.applyMatrix3(
          new THREE.Matrix3().setFromMatrix4(this.camera.matrix),
        );
        this.targetEnd.add(this.moveVector);
      }
    }

    // Apply damping to target
    this.target.lerp(this.targetEnd, this.config.dampingFactor);

    // Apply orbital rotation
    this.spherical.theta +=
      this.sphericalDelta.theta * this.config.dampingFactor;
    this.spherical.phi += this.sphericalDelta.phi * this.config.dampingFactor;

    // Constrain phi to prevent camera flipping
    this.spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, this.spherical.phi),
    );

    // Apply damping to rotation
    this.sphericalDelta.theta *= 1 - this.config.dampingFactor;
    this.sphericalDelta.phi *= 1 - this.config.dampingFactor;

    // Update camera position
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);

    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  public dispose() {
    this.domElement.removeEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.domElement.removeEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
    );
    this.domElement.removeEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.removeEventListener("wheel", this.onWheel.bind(this));
    this.domElement.removeEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
    );
    this.domElement.removeEventListener(
      "touchmove",
      this.onTouchMove.bind(this),
    );
    this.domElement.removeEventListener("touchend", this.onTouchEnd.bind(this));

    if (this.config.enableWASD) {
      window.removeEventListener("keydown", this.onKeyDown.bind(this));
      window.removeEventListener("keyup", this.onKeyUp.bind(this));
    }
  }

  public setTarget(target: THREE.Vector3) {
    this.target.copy(target);
    this.targetEnd.copy(target);
  }

  public getTarget(): THREE.Vector3 {
    return this.target.clone();
  }
}
