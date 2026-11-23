'use strict';
// Adapted from the supplied algebra-inspired WebGL recurrences. No network assets.
const PRESETS = {
  heisenberg: {name:'HEISENBERG-WEYL', formula:"[P, Q] = i(h/2pi) | Z' = A*Z*B + kappa[A,Z] + C", typeId:0, values:[0.785,0.45,1.20,1.0]},
  'lie-bracket': {name:'LIE COMMUTATOR', formula:'[X,[Y,Z]] + [Y,[Z,X]] + [Z,[X,Y]] = 0', typeId:1, values:[1.571,0.85,1.65,1.15]},
  quaternion: {name:'QUATERNION ROTOR', formula:"i² = j² = k² = ijk = -1 | q' = p*q*p⁻¹ + c", typeId:2, values:[2.356,0.60,0.95,0.85]},
  clifford: {name:'CLIFFORD GEOMETRIC', formula:'ab = a·b + a∧b | Spin(n) Chiral Bi-vector Reflection', typeId:3, values:[3.141,0.90,1.40,1.25]},
  jordan: {name:'JORDAN OCTONIONIC', formula:'(x o y) o x² = x o (y o x²) | Albert Non-Associative', typeId:4, values:[4.188,0.70,1.80,1.05]},
  spinor: {name:'SU(2) SPINOR FIELD', formula:'[sigma_i,sigma_j] = 2i*eps_ijk*sigma_k | Pauli Eigenspace', typeId:5, values:[5.236,0.50,1.10,0.90]}
};
const THEMES = {
  cyber:[[.5,.5,.5],[.5,.5,.5],[1,1,1],[0,.33,.67],[.22,.74,.97],[.96,.25,.37]],
  solar:[[.5,.4,.2],[.5,.4,.2],[2,1,.5],[0,.15,.30],[1,.65,.1],[1,.2,.1]],
  prism:[[.5,.5,.5],[.5,.5,.5],[1,1,.5],[.8,.90,.30],[.98,.84,.38],[.58,.2,.92]],
  aurora:[[.2,.5,.4],[.4,.5,.4],[1,1,1],[0,.33,.50],[.06,.92,.65],[.22,.74,.97]],
  nebula:[[.5,.2,.6],[.5,.3,.5],[1,.8,.6],[.30,.10,.50],[.85,.3,.95],[.2,.85,1]],
  synthwave:[[.8,.5,.4],[.2,.4,.2],[2,1,1],[0,.25,.25],[1,.35,.7],[.25,.85,.95]]
};
const FRAGMENT_SHADER_SRC = `
precision highp float;
uniform vec2 u_resolution, u_pan;
uniform float u_zoom, u_time, u_twist, u_bias, u_skew, u_scale, u_chromatic_shift, u_cosmic_depth;
uniform int u_iterations, u_preset_type;
uniform vec3 u_palette_a, u_palette_b, u_palette_c, u_palette_d, u_accent_glow, u_spark_color;
mat2 rot2D(float angle){float c=cos(angle),s=sin(angle);return mat2(c,-s,s,c);}
vec4 quatMul(vec4 a,vec4 b){return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
void main(){
 vec2 st=(gl_FragCoord.xy-.5*u_resolution)/min(u_resolution.x,u_resolution.y);
 st=st/max(.0001,u_zoom*u_cosmic_depth)+u_pan;
 mat2 M=mat2(u_scale*u_skew,sin(u_twist)*u_bias,-sin(u_twist*.8)*u_bias,u_scale/max(.01,u_skew));
 vec2 z=st,c=st*.75+vec2(cos(u_time*.15)*.22,sin(u_time*.2)*.22);
 float trapDist=1e6,orbitCross=1e6,smoothVal=0.;
 bool escaped=false;
 for(int i=0;i<96;i++){
  if(i>=u_iterations)break;
  vec2 Mz=M*z;
  mat2 Zmat=mat2(z.x,-z.y,z.y,z.x);
  mat2 commutator=M*Zmat-Zmat*M;
  vec2 commVec=vec2(commutator[0][0]+commutator[1][0],commutator[0][1]+commutator[1][1])*u_bias;
  if(u_preset_type==0){
   vec2 zSquared=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y);z=Mz+zSquared*.6+commVec+c;
  }else if(u_preset_type==1){
   vec2 zCube=vec2(z.x*(z.x*z.x-3.*z.y*z.y),z.y*(3.*z.x*z.x-z.y*z.y));z=rot2D(u_twist)*z+commVec*1.5+zCube*.3+c;
  }else if(u_preset_type==2){
   vec4 qZ=vec4(z.x,z.y,sin(u_time*.3)*u_bias,0.);
   // Unit rotor: only then does conjugation equal inversion and preserve length.
   vec4 qP=normalize(vec4(cos(u_twist),sin(u_twist)*.5,cos(u_twist*.5)*.5,0.));
   vec4 qRes=quatMul(quatMul(qP,qZ),vec4(-qP.xyz,qP.w));
   vec2 zSq=vec2(qRes.x*qRes.x-qRes.y*qRes.y,2.*qRes.x*qRes.y);z=zSq+qRes.xy*u_scale+c;
  }else if(u_preset_type==3){
   float dotP=dot(z,c),wedge=z.x*c.y-z.y*c.x;z=abs(Mz)*1.1-vec2(dotP,wedge)*.5+commVec+c;
  }else if(u_preset_type==4){
   vec2 zInv=z/max(.001,dot(z,z));z=Mz*z.x-zInv*u_bias+c;
  }else{
   mat2 pauliZ=mat2(z.x,z.y,z.y,-z.x);mat2 spinOp=rot2D(u_twist)*pauliZ;
   z=vec2(spinOp[0][0]-spinOp[1][1],spinOp[0][1]+spinOp[1][0])*.7+c+commVec;
  }
  trapDist=min(trapDist,length(z));orbitCross=min(orbitCross,min(abs(z.x),abs(z.y)));
  if(dot(z,z)>64.){escaped=true;smoothVal=float(i)-log2(max(1.,log2(dot(z,z))))+4.;break;}
 }
 vec3 bgCol=vec3(.043,.075,.122),col=bgCol;
 if(escaped){
  float normIter=smoothVal/float(u_iterations);
  float colorPhase=normIter*2.5+u_time*.15+u_chromatic_shift;
  vec3 shade=u_palette_a+u_palette_b*cos(6.28318*(u_palette_c*normIter+u_palette_d+colorPhase*.2));
  col=mix(bgCol,shade,clamp(normIter*1.5+.15,0.,1.));
  col+=u_accent_glow*exp(-orbitCross*12.)*.6;
  col+=u_spark_color*exp(-trapDist*2.5)*.45*max(.4,u_bias);
 }else{col=mix(bgCol,u_accent_glow,exp(-trapDist*3.5)*.55);col+=u_spark_color*exp(-orbitCross*20.)*.6;}
 gl_FragColor=vec4(col,1.);
}`;
const state={preset:'heisenberg',theme:'cyber',twist:.785,bias:.45,skew:1.2,scale:1,iterations:48,cosmicDepth:1,chromaticShift:0,morphSpeed:1,autoMorph:true,panX:0,panY:0,zoom:1.2,time:0};
const canvas=document.getElementById('fractal-canvas');
let gl,program,uniforms={},running=false,lastTime=0,raf=0;
const $=id=>document.getElementById(id);
function notify(message){$('message').textContent=message;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function init(){
 gl=canvas.getContext('webgl',{antialias:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL is unavailable. Enable browser graphics acceleration and reopen the lab.');
 program=gl.createProgram();
 for(const s of [shader(gl.VERTEX_SHADER,'attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}'),shader(gl.FRAGMENT_SHADER,FRAGMENT_SHADER_SRC)]){gl.attachShader(program,s);gl.deleteShader(s);}
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 for(const key of ['resolution','pan','zoom','time','twist','bias','skew','scale','iterations','preset_type','chromatic_shift','cosmic_depth','palette_a','palette_b','palette_c','palette_d','accent_glow','spark_color'])uniforms[key]=gl.getUniformLocation(program,'u_'+key);
 running=true;lastTime=performance.now();raf=requestAnimationFrame(loop);notify('Ready · Offline');
}
function render(){
 if(!running)return;
 const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.floor(innerWidth*dpr)),h=Math.max(1,Math.floor(innerHeight*dpr));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 gl.useProgram(program);gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.pan,state.panX,state.panY);
 for(const key of ['zoom','time','twist','bias','skew','scale'])gl.uniform1f(uniforms[key],state[key]);
 gl.uniform1f(uniforms.cosmic_depth,state.cosmicDepth);gl.uniform1f(uniforms.chromatic_shift,state.chromaticShift);
 gl.uniform1i(uniforms.iterations,state.iterations);gl.uniform1i(uniforms.preset_type,PRESETS[state.preset].typeId);
 ['palette_a','palette_b','palette_c','palette_d','accent_glow','spark_color'].forEach((key,i)=>gl.uniform3fv(uniforms[key],THEMES[state.theme][i]));
 gl.drawArrays(gl.TRIANGLES,0,6);
}
function loop(now){const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(state.autoMorph){state.time+=dt*state.morphSpeed;state.twist=(state.twist+dt*.35*state.morphSpeed)%(2*Math.PI);sync('twist');}render();if(running)raf=requestAnimationFrame(loop);}
const controls=[['twist','Non-Abelian twist (θ)',0,6.283,.01,' rad'],['bias','Commutator bias (κ)',0,1.5,.01,''],['skew','Matrix skew (λ)',.2,2.5,.01,''],['chromaticShift','Chromatic shift',0,6.283,.01,' rad'],['cosmicDepth','Cosmic Depth',.2,4,.01,'x'],['scale','Scale factor (s)',.2,3,.01,'x'],['iterations','Iteration depth (N)',16,96,2,''],['morphSpeed','Morph speed',0,1,.05,'']];
function sync(key){const input=$('slider-'+key);if(document.activeElement!==input)input.value=state[key];$('val-'+key).value=Number(state[key]).toFixed(key==='iterations'?0:3)+controls.find(c=>c[0]===key)[5];}
for(const [key,name,min,max,step] of controls){const label=document.createElement('label');label.htmlFor='slider-'+key;label.append(name);const output=document.createElement('output');output.id='val-'+key;const input=document.createElement('input');Object.assign(input,{type:'range',id:'slider-'+key,min,max,step,value:state[key]});label.append(output,input);$('sliders').append(label);input.addEventListener('input',()=>{state[key]=Number(input.value);if(key==='twist'){state.autoMorph=false;syncMorph();}sync(key);render();});sync(key);}
function syncMorph(){$('morph').setAttribute('aria-pressed',String(state.autoMorph));$('morph').textContent=state.autoMorph?'Morph':'Morph paused';}
function setPreset(key){state.preset=key;[state.twist,state.bias,state.skew,state.scale]=PRESETS[key].values;for(const key of ['twist','bias','skew','scale'])sync(key);$('preset-name').textContent=PRESETS[key].name;$('formula').textContent=PRESETS[key].formula;document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===key)));render();}
for(const [key,preset] of Object.entries(PRESETS)){const button=document.createElement('button');button.textContent=(preset.typeId+1)+'. '+preset.name;button.dataset.preset=key;button.onclick=()=>{setPreset(key);$('rules').close();};$('presets').append(button);}
for(const key of Object.keys(THEMES)){const option=document.createElement('option');option.value=key;option.textContent=key.toUpperCase();$('palette').append(option);}
$('palette').onchange=()=>{state.theme=$('palette').value;render();};
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>$(b.dataset.open).showModal());
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
$('morph').onclick=()=>{state.autoMorph=!state.autoMorph;syncMorph();};
$('reset').onclick=()=>{state.panX=state.panY=0;state.zoom=1.2;notify('Origin reset');render();};
$('code').onclick=()=>{$('code-display').value=FRAGMENT_SHADER_SRC;$('source').showModal();};
const snapshots=[];
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
$('capture').onclick=()=>{
 if(!running){notify('Cannot capture: renderer unavailable');return;}
 render();const preset=state.preset;
 canvas.toBlob(blob=>{if(!blob){notify('PNG capture failed');return;}const url=URL.createObjectURL(blob),name='fractal-'+preset+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';
 snapshots.unshift({url,name,preset});if(snapshots.length>12)URL.revokeObjectURL(snapshots.pop().url);
 $('gallery-list').replaceChildren();for(const snap of snapshots){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption'),a=document.createElement('a');img.src=snap.url;img.alt=PRESETS[snap.preset].name+' snapshot';caption.textContent=PRESETS[snap.preset].name;Object.assign(a,{href:snap.url,download:snap.name,textContent:'Download PNG',className:'download'});figure.append(img,caption,a);$('gallery-list').append(figure);}download(url,name);notify('PNG downloaded · Saved in session gallery');
 },'image/png');
};
const pointers=new Map();let gesture=null;
function baseline(){const p=[...pointers.values()];gesture=p.length===1?{x:p[0].x,y:p[0].y}:p.length>=2?{distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:null;}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});baseline();$('hint').hidden=true;});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()];if(p.length===1&&gesture&&'x'in gesture){const factor=1/(Math.min(innerWidth,innerHeight)*state.zoom*state.cosmicDepth);state.panX-=(p[0].x-gesture.x)*factor;state.panY+=(p[0].y-gesture.y)*factor;}else if(p.length>=2&&gesture&&gesture.distance>0){state.zoom=Math.max(.05,Math.min(50,state.zoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.distance));}baseline();render();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);baseline();});
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.05,Math.min(50,state.zoom*Math.exp(-e.deltaY*.001)));$('hint').hidden=true;render();},{passive:false});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;cancelAnimationFrame(raf);notify('Graphics context lost. Waiting for recovery…');});
canvas.addEventListener('webglcontextrestored',()=>{try{init();}catch(e){notify(e.message);}});
setPreset('heisenberg');
try{init();}catch(e){running=false;notify(e.message);console.error(e);}
