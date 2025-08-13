import type { SpaceObject } from "@/types/game";

import * as THREE from "three";

import { SpaceGenerator } from "./spaceGeneration";

export interface ObjectMesh extends THREE.Mesh {
  userData: {
    spaceObject: SpaceObject;
    originalScale: THREE.Vector3;
    hovered: boolean;
    selected: boolean;
  };
}

export class SpaceObjectManager {
  private scene: THREE.Scene;
  private objectMeshes: Map<string, ObjectMesh> = new Map();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private domElement: HTMLElement;

  // Interaction state
  private hoveredObject: ObjectMesh | null = null;
  private selectedObject: ObjectMesh | null = null;

  // Event callbacks
  private onObjectHover?: (object: SpaceObject | null) => void;
  private onObjectSelect?: (object: SpaceObject | null) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("click", this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateHover();
  }

  private onClick(event: MouseEvent) {
    // Only handle left clicks and ignore if dragging
    if (event.button === 0) {
      this.updateSelection();
    }
  }

  private updateHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      Array.from(this.objectMeshes.values()),
    );

    // Clear previous hover
    if (this.hoveredObject) {
      this.hoveredObject.userData.hovered = false;
      this.updateObjectAppearance(this.hoveredObject);
    }

    if (intersects.length > 0) {
      const mesh = intersects[0].object as ObjectMesh;

      if (mesh.userData && mesh.userData.spaceObject) {
        this.hoveredObject = mesh;
        mesh.userData.hovered = true;
        this.updateObjectAppearance(mesh);

        if (this.onObjectHover) {
          this.onObjectHover(mesh.userData.spaceObject);
        }

        // Change cursor
        this.domElement.style.cursor = "pointer";
      }
    } else {
      this.hoveredObject = null;
      this.domElement.style.cursor = "default";

      if (this.onObjectHover) {
        this.onObjectHover(null);
      }
    }
  }

  private updateSelection() {
    if (this.hoveredObject) {
      // Clear previous selection
      if (this.selectedObject) {
        this.selectedObject.userData.selected = false;
        this.updateObjectAppearance(this.selectedObject);
      }

      // Set new selection
      this.selectedObject = this.hoveredObject;
      this.selectedObject.userData.selected = true;
      this.updateObjectAppearance(this.selectedObject);

      if (this.onObjectSelect) {
        this.onObjectSelect(this.selectedObject.userData.spaceObject);
      }
    } else {
      // Deselect if clicking empty space
      if (this.selectedObject) {
        this.selectedObject.userData.selected = false;
        this.updateObjectAppearance(this.selectedObject);
        this.selectedObject = null;

        if (this.onObjectSelect) {
          this.onObjectSelect(null);
        }
      }
    }
  }

  private updateObjectAppearance(mesh: ObjectMesh) {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const { hovered, selected, originalScale } = mesh.userData;

    // Scale effects
    if (selected) {
      mesh.scale.copy(originalScale).multiplyScalar(1.3);
    } else if (hovered) {
      mesh.scale.copy(originalScale).multiplyScalar(1.1);
    } else {
      mesh.scale.copy(originalScale);
    }

    // Material effects
    if (selected) {
      material.emissive.setHex(0x444444);
      material.emissiveIntensity = 0.3;
    } else if (hovered) {
      material.emissive.setHex(0x222222);
      material.emissiveIntensity = 0.2;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  public addSpaceObject(spaceObject: SpaceObject): ObjectMesh {
    const geometry = SpaceGenerator.getObjectGeometry(spaceObject);
    const color = SpaceGenerator.getObjectColor(spaceObject);

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: this.getMetalness(spaceObject),
      roughness: this.getRoughness(spaceObject),
      transparent: spaceObject.type === "resource_node",
      opacity: spaceObject.type === "resource_node" ? 0.9 : 1.0,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Set position, rotation, and scale
    mesh.position.set(
      spaceObject.position[0],
      spaceObject.position[1],
      spaceObject.position[2],
    );
    mesh.rotation.set(
      spaceObject.rotation[0],
      spaceObject.rotation[1],
      spaceObject.rotation[2],
    );
    mesh.scale.set(
      spaceObject.scale[0],
      spaceObject.scale[1],
      spaceObject.scale[2],
    );

    // Setup user data with proper typing
    mesh.userData = {
      spaceObject,
      originalScale: mesh.scale.clone(),
      hovered: false,
      selected: false,
    };

    // Type assertion through unknown to satisfy TypeScript
    const objectMesh = mesh as unknown as ObjectMesh;

    // Enable shadows
    objectMesh.castShadow = true;
    objectMesh.receiveShadow = true;

    // Add to scene and tracking
    this.scene.add(objectMesh);
    this.objectMeshes.set(spaceObject.id, objectMesh);

    return objectMesh;
  }

  public removeSpaceObject(objectId: string) {
    const mesh = this.objectMeshes.get(objectId);

    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.objectMeshes.delete(objectId);

      // Clear references if this was the hovered/selected object
      if (this.hoveredObject === mesh) {
        this.hoveredObject = null;
      }
      if (this.selectedObject === mesh) {
        this.selectedObject = null;
      }
    }
  }

  public updateSpaceObject(spaceObject: SpaceObject) {
    const mesh = this.objectMeshes.get(spaceObject.id);

    if (mesh) {
      mesh.position.set(
        spaceObject.position[0],
        spaceObject.position[1],
        spaceObject.position[2],
      );
      mesh.rotation.set(
        spaceObject.rotation[0],
        spaceObject.rotation[1],
        spaceObject.rotation[2],
      );
      mesh.scale.set(
        spaceObject.scale[0],
        spaceObject.scale[1],
        spaceObject.scale[2],
      );
      mesh.userData.spaceObject = spaceObject;
      mesh.userData.originalScale = mesh.scale.clone();
    }
  }

  public getSpaceObject(objectId: string): SpaceObject | null {
    const mesh = this.objectMeshes.get(objectId);

    return mesh ? mesh.userData.spaceObject : null;
  }

  public getAllSpaceObjects(): SpaceObject[] {
    return Array.from(this.objectMeshes.values()).map(
      (mesh) => mesh.userData.spaceObject,
    );
  }

  public animateObjects(deltaTime: number) {
    this.objectMeshes.forEach((mesh) => {
      const obj = mesh.userData.spaceObject;

      // Rotate objects slowly
      switch (obj.type) {
        case "asteroid":
          mesh.rotation.x += deltaTime * 0.1;
          mesh.rotation.y += deltaTime * 0.15;
          break;
        case "resource_node":
          mesh.rotation.y += deltaTime * 0.3;
          // Gentle floating animation
          mesh.position.y =
            obj.position[1] +
            Math.sin(Date.now() * 0.001 + obj.position[0]) * 0.1;
          break;
        case "station":
          mesh.rotation.y += deltaTime * 0.05;
          break;
      }
    });
  }

  private getMetalness(spaceObject: SpaceObject): number {
    switch (spaceObject.type) {
      case "asteroid":
        return 0.1;
      case "resource_node":
        return 0.7;
      case "station":
        return 0.8;
      default:
        return 0.3;
    }
  }

  private getRoughness(spaceObject: SpaceObject): number {
    switch (spaceObject.type) {
      case "asteroid":
        return 0.9;
      case "resource_node":
        return 0.2;
      case "station":
        return 0.3;
      default:
        return 0.5;
    }
  }

  public setOnObjectHover(callback: (object: SpaceObject | null) => void) {
    this.onObjectHover = callback;
  }

  public setOnObjectSelect(callback: (object: SpaceObject | null) => void) {
    this.onObjectSelect = callback;
  }

  public getHoveredObject(): SpaceObject | null {
    return this.hoveredObject ? this.hoveredObject.userData.spaceObject : null;
  }

  public getSelectedObject(): SpaceObject | null {
    return this.selectedObject
      ? this.selectedObject.userData.spaceObject
      : null;
  }

  public clearSelection() {
    if (this.selectedObject) {
      this.selectedObject.userData.selected = false;
      this.updateObjectAppearance(this.selectedObject);
      this.selectedObject = null;

      if (this.onObjectSelect) {
        this.onObjectSelect(null);
      }
    }
  }

  public dispose() {
    this.domElement.removeEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
    );
    this.domElement.removeEventListener("click", this.onClick.bind(this));

    // Clean up all meshes
    this.objectMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });

    this.objectMeshes.clear();
  }
}
