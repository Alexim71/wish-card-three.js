import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import * as THREE from 'three';

@Component({
  selector: 'app-three-book',
  templateUrl: './three-book.page.html',
  styleUrls: ['./three-book.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ThreeBookPage implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId = 0;

  // Book parts
  private spine: THREE.Object3D = new THREE.Object3D();
  private leftCoverPivot!: THREE.Object3D;
  private rightCoverPivot!: THREE.Object3D;
  private leftCover!: THREE.Mesh;
  private rightCover!: THREE.Mesh;
  private leftPage!: THREE.Mesh;
  private rightPage!: THREE.Mesh;

  // parameters
  private BOOK_WIDTH = 2.4;   // unité three.js
  private BOOK_HEIGHT = 1.6;
  private PAGE_THICK = 0.02;

  // interaction
  isOpen = false; // fermé au départ
  showHint = true; // afficher aide au départ
  private targetAngle = 0; // radians (0 = closed, Math.PI/2 = fully open)
  private currentAngle = Math.PI/2;

  // pointer drag
  private isPointerDown = false;
  private pointerStartX = 0;
  private startAngle = 0;

  constructor() {}

  ngAfterViewInit() {
    this.initScene();
    this.loadBookTexturesAndBuild();
    this.animate();

    window.addEventListener('resize', this.onResize);
    const el: HTMLElement = this.rendererContainer.nativeElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    const el: HTMLElement = this.rendererContainer.nativeElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer?.dispose();
  }

  private initScene() {
    const width = this.rendererContainer.nativeElement.clientWidth || window.innerWidth;
    const height = this.rendererContainer.nativeElement.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, -0.9, 3.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);

    // group for book centered at origin
    this.spine.position.set(0, 0, 0);
    this.scene.add(this.spine);
  }

  private loadBookTexturesAndBuild() {
    const loader = new THREE.TextureLoader();

    // images must be in src/assets/book/...
    const assets = {
      coverFront: 'assets/image4.jpeg',
      coverBack:  'assets/image3.jpeg',
      pageLeft:   'assets/image2.jpeg',
      pageRight:  'assets/image1.jpeg'
    };

    // load all (if a load fails, fallback to color)
    Promise.all([
      this.loadTextureSafe(loader, assets.coverFront),
      this.loadTextureSafe(loader, assets.coverBack),
      this.loadTextureSafe(loader, assets.pageLeft),
      this.loadTextureSafe(loader, assets.pageRight)
    ]).then(([tCoverFront, tCoverBack, tPageLeft, tPageRight]) => {
      this.buildBook(tCoverFront, tCoverBack, tPageLeft, tPageRight);
    });
  }

  private loadTextureSafe(loader: THREE.TextureLoader, url: string): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      loader.load(
        url,
        (tex) => { tex.anisotropy = 4; resolve(tex); },
        undefined,
        () => resolve(null) // on error
      );
    });
  }

  private buildBook(tcFront: THREE.Texture | null, tcBack: THREE.Texture | null, tpLeft: THREE.Texture | null, tpRight: THREE.Texture | null) {
    const halfW = this.BOOK_WIDTH / 2;
    const H = this.BOOK_HEIGHT;
    const depth = this.PAGE_THICK;


    // Texte souhaités (personnalise)
const leftPageText = "Bonne Année !\nQue tous tes rêves se réalisent 🌟";
const rightPageText = "Avec amour,\nNormil Nitshai";

    // Materials fallback
    // const matCoverFront = tcFront ? new THREE.MeshStandardMaterial({ map: tcFront, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0x8B0000, side: THREE.DoubleSide });
    // const matCoverBack = tcBack ? new THREE.MeshStandardMaterial({ map: tcBack, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });

    // const matPageLeft = tpLeft ? new THREE.MeshStandardMaterial({ map: tpLeft, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    // const matPageRight = tpRight ? new THREE.MeshStandardMaterial({ map: tpRight, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0xfff8e1, side: THREE.DoubleSide });

    // Créer matériaux pages intérieures en combinant l'image (tpLeft/tpRight) et le texte
const matPageLeft = this.createMaterialFromImageAndText(tpLeft, leftPageText);
const matPageRight = this.createMaterialFromImageAndText(tpRight, rightPageText);

    

// Si tu veux aussi ajouter du texte sur la couverture (titre), fais de même
const coverTitle = "Carte de Vœux 2025";
const matCoverFront = tcFront
  ? this.createMaterialFromImageAndText(tcFront, coverTitle)
  : new THREE.MeshStandardMaterial({ color: 0x8B0000, side: THREE.DoubleSide });
const matCoverBack = tcBack
  ? this.createMaterialFromImageAndText(tcBack, "De la part de\nNormil Nitshai")
  : new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });


    // Right half (cover front + inner right page)
    const rightGroup = new THREE.Object3D();
    // pivot at spine (left edge of right half)
    this.rightCoverPivot = new THREE.Object3D();
    this.rightCoverPivot.position.set(0, 0, 0); // spine center
    rightGroup.add(this.rightCoverPivot);

    // Geometry: plane for cover (slightly thicker)
    const coverGeom = new THREE.BoxGeometry(halfW, H, depth);
    // position center of right cover: x = halfW/2
    this.rightCover = new THREE.Mesh(coverGeom, matCoverFront);
    this.rightCover.position.set(halfW / 2, 0, 0);
    this.rightCoverPivot.add(this.rightCover);

    // inner right page (slightly above cover)
    const pageGeom = new THREE.BoxGeometry(halfW - 0.02, H - 0.02, depth / 2);
    this.rightPage = new THREE.Mesh(pageGeom, matPageRight);
    this.rightPage.position.set(halfW / 2, 0, depth + 0.001);
    this.rightCoverPivot.add(this.rightPage);

    // Left half (cover back + inner left page)
    const leftGroup = new THREE.Object3D();
    this.leftCoverPivot = new THREE.Object3D();
    this.leftCoverPivot.position.set(0, 0, 0); // spine
    leftGroup.add(this.leftCoverPivot);

    // left cover: geometry same, positioned with center at -halfW/2
    this.leftCover = new THREE.Mesh(coverGeom, matCoverBack);
    this.leftCover.position.set(-halfW / 2, 0, 0);
    this.leftCoverPivot.add(this.leftCover);

    // inner left page
    this.leftPage = new THREE.Mesh(pageGeom, matPageLeft);
    this.leftPage.position.set(-halfW / 2, 0, depth + 0.001);
    this.leftCoverPivot.add(this.leftPage);

    // attach to spine
    this.spine.add(rightGroup);
    this.spine.add(leftGroup);

    // initial closed state: both covers flat on top of each other (right on top)
    this.setOpenAngle(2*Math.PI, false);
  }

  

  // set target angle in radians, animate optional
  private setOpenAngle(angleRad: number, animate = true) {
    // clamp 0..Math.PI/2 (90deg)
    this.targetAngle = Math.max(0, Math.min(Math.PI / 2, angleRad));
    if (!animate) {
      this.currentAngle = this.targetAngle;
      this.applyAngle(this.currentAngle);
    }
  }

  // apply angle: right cover rotates negative around Y from 0 to -PI/2, left rotates positive 0..PI/2
  private applyAngle(a: number) {
    if (!this.rightCoverPivot || !this.leftCoverPivot) return;
    // right cover opens to the right (negative)
    this.rightCoverPivot.rotation.y = -a;
    // left cover opens to the left (positive)
    this.leftCoverPivot.rotation.y = a;
  }

  // toggle open/close
  toggleOpen() {
    this.isOpen = !this.isOpen;
     this.showHint = false; // cacher aide dès clic
    this.setOpenAngle(this.isOpen ? Math.PI / 2 : 0);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    // simple easing to targetAngle
    const diff = this.targetAngle - this.currentAngle;
    this.currentAngle += diff * 0.15; // smoothing factor
    if (Math.abs(diff) < 0.0005) this.currentAngle = this.targetAngle;
    this.applyAngle(this.currentAngle);

    // slight idle motion for realism
    const t = performance.now() * 0.0020;
    this.spine.rotation.y = Math.sin(t) * 0.10;
    this.spine.rotation.x = Math.sin(t * 0.6) * 0.01;

    this.renderer.render(this.scene, this.camera);
  };

  // pointer events for drag-to-open (horizontal)
  private onPointerDown = (ev: PointerEvent) => {
    this.isPointerDown = true;
    this.pointerStartX = ev.clientX;
    this.startAngle = this.currentAngle;
  };

  private onPointerMove = (ev: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = ev.clientX - this.pointerStartX;
    // translate dx into angle change: screen width -> PI/2
    const width = this.rendererContainer.nativeElement.clientWidth || window.innerWidth;
    const deltaAngle = (dx / width) * (Math.PI);
    const newAngle = this.startAngle - deltaAngle; // drag right closes right cover
    this.setOpenAngle(newAngle, false); // immediate (no easing) for direct drag feel
  };

  private onPointerUp = (ev: PointerEvent) => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    // snap open/closed depending on currentAngle
    if (this.currentAngle > Math.PI / 4) {
      this.isOpen = true;
      this.showHint = false; // cacher aide dès ouverture
      this.setOpenAngle(Math.PI / 2);
    } else {
      this.isOpen = false;
      this.setOpenAngle(0);
    }
  };

  // resize handling
  private onResize = () => {
    const width = this.rendererContainer.nativeElement.clientWidth || window.innerWidth;
    const height = this.rendererContainer.nativeElement.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };


  /**
 * Compose une texture à partir d'une texture (peut être null) et d'un texte.
 * Retourne un THREE.Texture prêt à appliquer comme map d'un material.
 */
private composeImageAndTextTexture(srcTex: THREE.Texture | null, text: string, canvasW = 1024, canvasH = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // Si on a une image source utilisable, la dessiner comme fond
  if (srcTex && (srcTex.image instanceof HTMLImageElement || srcTex.image instanceof ImageBitmap)) {
    try {
      ctx.drawImage(srcTex.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      // fallback si drawImage échoue
      ctx.fillStyle = '#fff8dc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    // Fond par défaut (dégradé crème)
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#fff8dc');
    grad.addColorStop(1, '#ffe4c4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // -- Décor : bordure légère
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Style du texte (tu peux ajuster police / taille)
  ctx.fillStyle = '#8B0000';
  // police adaptative selon longueur du texte
  const lines = text.split('\n');
  const baseSize = Math.floor(canvasW / 30); // ex: 1024 -> ~56
  ctx.font = `bold ${baseSize}px "Georgia", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.shadowBlur = 6;

  // calculer position verticale pour centrer plusieurs lignes
  const lineHeight = baseSize * 1.2;
  const startY = (canvasH / 2) - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvasW / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Crée un material MeshStandardMaterial avec image + texte.
 * si srcTex === null, on récupère un material couleur de fallback.
 */
private createMaterialFromImageAndText(srcTex: THREE.Texture | null, text: string, doubleSided = true): THREE.MeshStandardMaterial {
  const map = this.composeImageAndTextTexture(srcTex, text);
  return new THREE.MeshStandardMaterial({
    map,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    roughness: 0.7,
    metalness: 0.05
  });
}


  

}
