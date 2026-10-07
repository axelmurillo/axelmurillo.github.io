// Cylindrical isometry in sheet coordinates. No per-row sag or size change.
export function foldSpec(w,h,p,anchor=.5,pullY=0){
 const phase=Math.sin(Math.PI*p);
 // A sideways grab starts at its chosen corner; a deliberate vertical pull can
 // steer that same sheet upward or downward instead of locking it to the corner.
 const anchorWeight=1/(1+(pullY/.025)**2);
 const angle=Math.max(-.55,Math.min(.55,(.5-anchor)*1.05*anchorWeight+pullY*7))*phase;
 const nx=Math.cos(angle),ny=Math.sin(angle),radius=w*.045*phase,spineExtent=Math.hypot(ny*h/2,h*.001*phase);
 return{p,nx,ny,radius,offset:spineExtent+nx*w*(1-p)**2};
}

// Slice the material at the bend, so even a tiny late curl keeps enough triangles.
// The flat parts need no dense grid: the cylinder is linear along its own axis.
export function paperMesh(w,h,s,bendSteps=48){
 const rectangle=[{x:0,y:-h/2},{x:w,y:-h/2},{x:w,y:h/2},{x:0,y:h/2}];
 const n=q=>q.x*s.nx+q.y*s.ny;
 const corners=rectangle.map(n),low=Math.min(...corners),high=Math.max(...corners);
 const cuts=[...corners];
 for(let i=0;i<=bendSteps;i++){
  const cut=s.offset+Math.PI*s.radius*i/bendSteps;
  if(cut>low&&cut<high)cuts.push(cut);
 }
 cuts.sort((a,b)=>a-b);
 const levels=cuts.filter((v,i)=>i===0||v-cuts[i-1]>1e-7);
 function clip(points,cut,sign){
  const result=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],da=sign*(n(a)-cut),db=sign*(n(b)-cut);
   if(da>=-1e-8)result.push(a);
   if((da>1e-8&&db< -1e-8)||(da< -1e-8&&db>1e-8)){
    const t=da/(da-db);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
   }
  }
  return result;
 }
 const vertices=[];
 for(let j=0;j<levels.length-1;j++){
  const polygon=clip(clip(rectangle,levels[j],1),levels[j+1],-1);
  for(let k=1;k<polygon.length-1;k++){
   const a=polygon[0],b=polygon[k],c=polygon[k+1];
   if(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))<1e-8)continue;
   vertices.push(a,b,c);
  }
 }
 return vertices;
}

export function foldNormal(x,y,s){
 if(s.p<=0)return{x:0,y:0,z:1};if(s.p>=1)return{x:0,y:0,z:-1};
 const d=x*s.nx+y*s.ny-s.offset,t=Math.max(0,Math.min(Math.PI,d/Math.max(1e-8,s.radius)));
 return{x:-s.nx*Math.sin(t),y:-s.ny*Math.sin(t),z:Math.cos(t)};
}
export function foldPoint(x,y,s){
 if(s.p<=0)return{x,y,z:0};if(s.p>=1)return{x:-x,y,z:0};
 const n=x*s.nx+y*s.ny,a=-x*s.ny+y*s.nx,d=n-s.offset;
 if(d<=0)return{x,y,z:0};
 const r=Math.max(1e-8,s.radius),t=Math.min(Math.PI,d/r);
 const curved=d<Math.PI*r;
 const q=s.offset+(curved?r*Math.sin(t):Math.PI*r-d),z=curved?r*(1-Math.cos(t)):2*r;
 return{x:q*s.nx-a*s.ny,y:q*s.ny+a*s.nx,z};
}
