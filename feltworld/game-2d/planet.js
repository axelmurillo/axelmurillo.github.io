import * as THREE from './vendor/three.module.js';
export class Planet {
  constructor(host,health,reduced=false){
    this.active=true;this.health=health;this.reduced=reduced;this.rotation=0;
    try{
      this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(this.renderer.domElement);
      this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);this.camera.position.z=3;
      this.texture=new THREE.TextureLoader().load('assets/felt-world.png');this.texture.colorSpace=THREE.SRGBColorSpace;
      this.material=new THREE.SpriteMaterial({map:this.texture,transparent:true,color:health<20?0xb9a8c6:0xffffff});
      this.world=new THREE.Sprite(this.material);this.world.scale.set(2.1,2.1,1);this.scene.add(this.world);
      this.observer=new ResizeObserver(()=>this.renderer.setSize(host.clientWidth||100,host.clientHeight||100));this.observer.observe(host);this.renderer.setSize(host.clientWidth||100,host.clientHeight||100);this.tick(0);
    }catch(e){host.classList.add('planet-fallback');this.error=e.message;}
  }
  tick(t){if(!this.active||!this.renderer)return;if(!this.reduced&&!document.hidden){this.rotation=Math.sin(t*.0007)*.05;this.world.material.rotation=this.rotation;this.world.position.y=Math.sin(t*.001)*.025;}this.renderer.render(this.scene,this.camera);this.frame=requestAnimationFrame(t=>this.tick(t));}
  destroy(){this.active=false;cancelAnimationFrame(this.frame);this.observer?.disconnect();this.texture?.dispose();this.material?.dispose();this.renderer?.dispose();}
}
