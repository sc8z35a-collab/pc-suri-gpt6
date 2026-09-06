import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { buildMicroDetail } from './pc-detail.js';

// Every visible component is real geometry: PCB traces, solder, heatsink fins,
// fan blades, sleeved cables and machined chassis. No product photographs.
const container = document.getElementById('scene-container');
const loading = document.getElementById('scene-loading');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
} catch (error) {
  loading.innerHTML = '<div class="scene-error"><strong>3D表示を開始できませんでした</strong><p class="small-note">WebGLを有効にした最新版のSafari / Chromeで開いてください。<br>下のパーツボタンから修理・経営は引き続きプレイできます。</p><button class="secondary-button" onclick="location.reload()">再読み込み</button></div>';
  console.error('WebGL initialization failed', error);
}
if (renderer) startScene();
function startScene() {
  // Keep native resolution on real GPUs; avoid oversized drawing buffers on CPU rasterizers.
  const glInfo=renderer.getContext(),debugInfo=glInfo.getExtension('WEBGL_debug_renderer_info');
  const adapterName=debugInfo?String(glInfo.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)):'';
  const softwareRasterizer=/SwiftShader|llvmpipe|software rasterizer/i.test(adapterName);
  renderer.setPixelRatio(softwareRasterizer?1:(window.devicePixelRatio||1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.setClearColor(0x101a21, 1);
  // Present complete rendered frames through a 2D surface. This avoids stale
  // or missing WebGL compositor layers while retaining the full 3D renderer.
  const displayCanvas=document.createElement('canvas');
  const presentation=displayCanvas.getContext('2d',{alpha:false});
  let framePixels=null,frameImage=null,sceneInitialized=false;
  function presentFrame(){
    const fw=renderer.domElement.width,fh=renderer.domElement.height;
    if(!frameImage||frameImage.width!==fw||frameImage.height!==fh){framePixels=new Uint8Array(fw*fh*4);frameImage=presentation.createImageData(fw,fh);}
    const gl=renderer.getContext();gl.readPixels(0,0,fw,fh,gl.RGBA,gl.UNSIGNED_BYTE,framePixels);
    const stride=fw*4;for(let y=0;y<fh;y++)frameImage.data.set(framePixels.subarray((fh-1-y)*stride,(fh-y)*stride),y*stride);
    presentation.putImageData(frameImage,0,0);
  }
  container.append(displayCanvas);
  displayCanvas.setAttribute('aria-label','修理用PCの3Dビュー');
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x101a21, .035);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  const controls = new OrbitControls(camera, displayCanvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.minDistance = 1.2; controls.maxDistance = 19;
  controls.minPolarAngle = .4; controls.maxPolarAngle = Math.PI * .51;
  controls.target.set(0, 1.9, 0); controls.enablePan = true; controls.panSpeed = .6; controls.rotateSpeed = .6;
  controls.touches.ONE = THREE.TOUCH.ROTATE; controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment(); const environmentMap = pmrem.fromScene(environment, .04);
  scene.environment = environmentMap.texture; environment.dispose(); pmrem.dispose();
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
  const ao=new SSAOPass(scene,camera,800,500,32);ao.kernelRadius=.14;ao.minDistance=.001;ao.maxDistance=.13;composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(800,500), .43, .48, 1.3); composer.addPass(bloom); composer.addPass(new OutputPass());
  const pc = new THREE.Group(); scene.add(pc);
  const parts = {}; const pickables = []; const fanRotors = []; const lightsRGB = []; const repairedGlow = [];
  const highlight = new THREE.Box3Helper(new THREE.Box3(),0xbeef62); highlight.visible = false; scene.add(highlight);
  const mat = (color,metalness=.5,roughness=.5,extra={}) => new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
  const chassis = mat(0x151b22,.85,.32), edge = mat(0x303d47,.8,.3), dark = mat(0x080d13,.5,.52), rubber = mat(0x171b20,.05,.9);
  const silver = mat(0xa1aeb6,.92,.26), screwMat = mat(0x70818b,.95,.28), pcbMat = mat(0x172f2d,.35,.7), chipMat = mat(0x111519,.4,.54);
  const gold = mat(0xac8651,.85,.45), pale = mat(0xc5d1ce,.5,.45), copper = mat(0x684323,.78,.5);
  const cyan = mat(0x65cfd7,.25,.25,{emissive:0x18c4e8,emissiveIntensity:2.2});
  const green = mat(0xbdef71,.25,.28,{emissive:0xa2ec35,emissiveIntensity:1.2});
  const blue = mat(0x6da9eb,.22,.25,{emissive:0x4079ee,emissiveIntensity:1.7});
  const violet = mat(0xb394fa,.22,.25,{emissive:0x8f58ee,emissiveIntensity:1.7});
  const whiteLed = mat(0xc9ebeb,.2,.25,{emissive:0xb1e5ef,emissiveIntensity:1.2});
  const pcbTrace = mat(0x557669,.6,.65); const silk = mat(0x8eaca3,.1,.8);
  const fanMaterial = mat(0x354552,.56,.4); const glassMat = new THREE.MeshPhysicalMaterial({color:0xa9d7dd,metalness:.2,roughness:.06,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false,clearcoat:1,clearcoatRoughness:.08});
  function mesh(geo,material,parent,x=0,y=0,z=0) { const m = new THREE.Mesh(geo,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
  function box(parent,w,h,d,x,y,z,material=chassis) { return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z); }
  function cylinder(parent,r,depth,x,y,z,material=chassis,axis='z',segments=32) { const m = mesh(new THREE.CylinderGeometry(r,r,depth,segments),material,parent,x,y,z); if(axis==='z') m.rotation.x=Math.PI/2; if(axis==='x') m.rotation.z=Math.PI/2; return m; }
  function ring(parent,r,t,x,y,z,material=cyan,axis='z') { const m=mesh(new THREE.TorusGeometry(r,t,10,80),material,parent,x,y,z); if(axis==='x') m.rotation.y=Math.PI/2; if(axis==='y') m.rotation.x=Math.PI/2; return m; }
  function screw(parent,x,y,z,axis='z',r=.031) { const s=cylinder(parent,r,.017,x,y,z,screwMat,axis,10); if(axis==='z'){box(parent,r*1.2,.008,.005,x,y,z+.012,dark);box(parent,.008,r*1.2,.005,x,y,z+.012,dark);} return s; }
  function tube(parent,points,r,material,segments=50) { const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))); return mesh(new THREE.TubeGeometry(curve,segments,r,8,false),material,parent); }
  function label(parent,text,w,h,x,y,z,color='#d6e1e1',bg=null,rotation=null) {
    const c=document.createElement('canvas'); c.width=1024;c.height=128;const ctx=c.getContext('2d'); if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 60px Arial';ctx.fillText(text,512,65);
    const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}),parent,x,y,z);
    if(rotation) m.rotation.set(...rotation); return m;
  }
  function component(key){const group=new THREE.Group();group.userData.part=key;parts[key]=group;pc.add(group);return group;}
  function addTarget(parent,key,w,h,d,x,y,z) { const hit = box(parent,w,h,d,x,y,z,new THREE.MeshBasicMaterial({visible:false})); hit.userData.part=key;pickables.push(hit);return hit; }
  // Structural anodized-aluminium chassis, feet and rear steel tray.
  box(pc,3.38,.13,1.86,0,.17,0); box(pc,3.38,.10,1.86,0,4.22,0);
  box(pc,3.3,4.02,.065,0,2.19,-.9,mat(0x202b32,.8,.44));
  for(const x of [-1.66,1.66])for(const z of [-.88,.88])box(pc,.09,4.12,.09,x,2.18,z,edge);
  for(const y of [.31,4.13])box(pc,3.2,.045,.055,0,y,.93,edge);
  for(const x of [-1.28,1.28])for(const z of [-.61,.61]) { box(pc,.45,.15,.32,x,.045,z,rubber); box(pc,.34,.09,.25,x,-.03,z,dark); }
  // Ventilated roof: inset mesh, long stamped ribs and front I/O.
  box(pc,2.76,.028,1.44,-.1,4.284,0,dark);
  for(let i=0;i<49;i++) box(pc,.018,.02,1.32,-1.37+i*.052,4.305,-.025,edge);
  for(let j=0;j<12;j++) box(pc,2.65,.007,.008,-.1,4.319,-.65+j*.114,silver);
  cylinder(pc,.074,.019,1.47,4.289,.47,silver,'y'); ring(pc,.052,.008,1.47,4.304,.47,cyan,'y');
  for(const z of [-.12,.08]) box(pc,.045,.012,.102,1.49,4.288,z,dark);
  cylinder(pc,.027,.01,1.49,4.29,-.36,dark,'y');
  // Rear I/O slot, real connectors and ventilation slots.
  box(pc,.065,3.65,1.59,-1.66,2.17,0,chassis);
  box(pc,.08,1.42,.56,-1.707,3.18,-.4,silver);
  for(let n=0;n<7;n++){box(pc,.09,.075,.16,-1.758,2.64+n*.16,-.4,dark);box(pc,.093,.038,.1,-1.76,2.64+n*.16,-.4,n%3===0?blue:rubber);}
  for(let i=0;i<8;i++)for(let k=0;k<4;k++)box(pc,.02,.055,.12,-1.704,1.24+i*.12,-.45+k*.2,dark);
  // Motherboard with layered traces and physical surface-mount components.
  const board=new THREE.Group();pc.add(board);
  box(board,2.7,2.77,.052,-.16,2.63,-.795,pcbMat);
  for(const x of [-1.46,1.13])for(const y of [1.31,2.5,3.95]){cylinder(board,.054,.013,x,y,-.757,gold);screw(board,x,y,-.744);}
  // Deterministic pseudo-random layout, never randomise the simulation.
  let seed=7295;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const tracePositions=[];
  for(let i=0;i<145;i++){
    const x=-1.38+random()*2.45,y=1.35+random()*2.55,len=.08+random()*.43;
    const dir=random()>.5?1:-1;tracePositions.push(x,y,-.761,x+len*dir,y,-.761,x+len*dir,y,-.761,x+len*dir,y+.1,-.761);
  }
  const traceGeo=new THREE.BufferGeometry();traceGeo.setAttribute('position',new THREE.Float32BufferAttribute(tracePositions,3));board.add(new THREE.LineSegments(traceGeo,new THREE.LineBasicMaterial({color:0x496f61,transparent:true,opacity:.7})));
  for(let i=0;i<95;i++){
    const x=-1.35+random()*2.4,y=1.37+random()*2.5;
    const w=.035+random()*.055,h=.02+random()*.034;
    box(board,w,h,.026,x,y,-.742,i%3===0?copper:chipMat);
    box(board,.012,h,.03,x-w/2,y,-.739,silver);box(board,.012,h,.03,x+w/2,y,-.739,silver);
  }
  // VRM thermal blocks and capacitor banks around the CPU socket.
  for(let i=0;i<15;i++){box(board,.031,.76,.2,-1.37+i*.032,3.24,-.605,edge);box(board,.044,.34,.16,-.93+i*.085,3.89,-.6,edge);}
  label(board,'TUF GAMING',.55,.07,-1.13,3.23,-.489,'#b5c7c9',null,[0,0,Math.PI/2]);
  for(let i=0;i<9;i++){cylinder(board,.045,.12,-.81+i*.12,3.61,-.62,silver);cylinder(board,.031,.007,-.81+i*.12,3.61,-.552,dark);}
  for(let i=0;i<5;i++)cylinder(board,.045,.1,-1.31,1.44+i*.14,-.66,silver);
  box(board,.55,.4,.1,-.26,1.79,-.67,edge);label(board,'B650 · WIFI',.47,.058,-.26,1.77,-.612);
  box(board,1.57,.12,.13,-.31,1.22,-.66,dark);
  for(let n=0;n<28;n++)box(board,.016,.08,.015,-1.02+n*.052,1.22,-.585,gold);
  label(board,'ASUS     PRIME / B650-A',1.33,.074,-.48,1.4,-.714,'#a2b8b1');
  for(let n=0;n<4;n++)box(board,.21,.17,.19,1.16,1.46+n*.22,-.65,dark);
  // CPU cooler: copper base, machined pump housing, ARGB ring and live display.
  const cpu=component('cpu');
  box(cpu,.74,.74,.045,-.36,2.97,-.716,silver);
  box(cpu,.61,.61,.055,-.36,2.97,-.66,copper);
  for(const dx of [-.39,.39])for(const dy of [-.39,.39]){box(cpu,.11,.11,.19,-.36+dx,2.97+dy,-.59,edge);screw(cpu,-.36+dx,2.97+dy,-.483,'z',.04);}
  cylinder(cpu,.405,.28,-.36,2.97,-.452,chassis);
  ring(cpu,.384,.025,-.36,2.97,-.292,cyan);
  cylinder(cpu,.34,.014,-.36,2.97,-.296,dark);
  ring(cpu,.287,.008,-.36,2.97,-.278,edge);
  label(cpu,'NZXT',.36,.062,-.36,3.055,-.275,'#d4eced');
  const tempLabel=label(cpu,'98°',.34,.16,-.36,2.91,-.27,'#8ce8ed');
  addTarget(cpu,'cpu',.95,.93,.63,-.36,2.98,-.4);
  // Water hoses with tight cable sleeving and proper fittings, routed to roof radiator.
  for(let side=0;side<2;side++){
    const x=-.36+side*.18;
    cylinder(cpu,.077,.14,x,3.24,-.24,edge,'y');
    tube(cpu,[[x,3.26,-.22],[x+.16,3.61,.15],[.45+side*.21,3.84,.25],[.91+side*.22,3.8,-.09],[1.08+side*.15,3.95,-.24]],.058,rubber);
    for(let q=0;q<5;q++)ring(cpu,.067,.011,x,3.27+q*.024,-.24,edge,'y');
  }
  box(cpu,2.63,.15,1.3,-.09,3.98,-.04,dark);
  for(let n=0;n<55;n++)box(cpu,.017,.125,1.17,-1.32+n*.046,3.97,-.03,silver);
  // DIMM slots: gold contacts, heat spreaders, miniature PCBs and diffused RGB.
  const ram=component('ram');
  for(let n=0;n<4;n++)box(ram,.09,1.31,.16,.49+n*.17,2.9,-.67,dark);
  for(let n=0;n<2;n++){
    const x=.64+n*.34;box(ram,.064,1.2,.33,x,2.94,-.45,pcbMat);
    for(let q=0;q<8;q++){box(ram,.07,.084,.18,x,2.49+q*.13,-.3,chipMat);box(ram,.073,.016,.04,x,2.49+q*.13,-.202,silver);}
    box(ram,.12,1.22,.21,x,2.94,-.18,edge);
    box(ram,.10,1.08,.058,x,2.94,-.039,n===0?cyan:violet);
    for(let j=0;j<13;j++)box(ram,.13,.014,.065,x,2.41+j*.083,-.04,chassis);
    for(const y of [2.3,3.59])box(ram,.12,.12,.18,x,y,-.51,pale);
    label(ram,'VENGEANCE',.66,.038,x,2.94,.001,'#e1f7ef',null,[0,0,Math.PI/2]);
  }
  addTarget(ram,'ram',.78,1.48,.8,.81,2.95,-.37);
  // NVMe SSD with screw, controller, NAND and foil product label.
  const ssd=component('ssd');box(ssd,.79,.22,.027,-.8,2.15,-.66,pcbMat);
  for(let n=0;n<3;n++)box(ssd,.16,.16,.035,-1.04+n*.19,2.15,-.628,chipMat);
  box(ssd,.72,.16,.009,-.8,2.15,-.6,dark);label(ssd,'980 PRO   NVMe 1TB',.63,.06,-.82,2.15,-.591,'#c8cacb');
  screw(ssd,-1.24,2.15,-.621,'z',.026);box(ssd,.08,.23,.064,-.36,2.15,-.668,edge);
  addTarget(ssd,'ssd',.98,.31,.17,-.81,2.15,-.62);
  // Triple-fan graphics card: a real multilayer assembly with exposed heatsink fins.
  const gpu=component('gpu');box(gpu,2.7,.075,.75,-.1,1.88,-.13,dark);
  box(gpu,2.55,.028,.78,-.1,1.93,-.13,edge);
  for(let i=0;i<14;i++)box(gpu,.03,.012,.51,-1.2+i*.17,1.95,-.1,silver);
  box(gpu,2.68,.28,.65,-.12,1.68,-.13,dark);
  for(let i=0;i<80;i++)box(gpu,.012,.28,.68,-1.42+i*.033,1.71,-.09,silver);
  for(let i=0;i<3;i++)tube(gpu,[[-1.28,1.73,-.41+i*.18],[-.76,1.68,-.46+i*.18],[.4,1.68,-.46+i*.18],[1.06,1.73,-.41+i*.18]],.021,copper);
  box(gpu,2.81,.48,.08,-.13,1.67,.31,chassis);
  box(gpu,2.74,.042,.09,-.13,1.936,.34,cyan);
  box(gpu,2.74,.032,.086,-.13,1.421,.34,edge);
  label(gpu,'GEFORCE RTX',1.31,.145,-.12,1.665,.358,'#d6e5e7');
  label(gpu,'4070',.26,.095,1.055,1.66,.36,'#bde47b');
  label(gpu,'ROG',.21,.1,-1.24,1.66,.36,'#adc5c8');
  for(const x of [-1.37,1.1])for(const y of [1.49,1.87])screw(gpu,x,y,.367,'z',.025);
  // GPU cooling fans on the underside are visible when the view is rotated.
  for(let n=0;n<3;n++){
    const g=new THREE.Group();g.position.set(-.99+n*.88,1.41,-.05);g.rotation.x=Math.PI/2;gpu.add(g);
    cylinder(g,.35,.04,0,0,0,dark);ring(g,.318,.018,0,0,.026,edge);const rotor=new THREE.Group();g.add(rotor);rotor.position.z=.029;fanRotors.push({rotor,speed:-1.6});
    for(let b=0;b<9;b++){const blade=box(rotor,.13,.215,.012,0,.18,0,fanMaterial);const a=b/9*Math.PI*2;blade.position.set(-Math.sin(a)*.18,Math.cos(a)*.18,0);blade.rotation.z=a+.45;}
    cylinder(g,.088,.02,0,0,.048,chassis);
  }
  box(gpu,.11,.59,.83,-1.56,1.67,-.08,silver);
  for(let n=0;n<3;n++)box(gpu,.13,.085,.17,-1.59,1.69,-.28+n*.2,dark);
  addTarget(gpu,'gpu',2.86,.56,1.0,-.13,1.7,-.06);
  // PSU bay and branding, honeycomb ventilation, modular cable sockets.
  const psu=component('psu');box(psu,2.03,.82,1.52,-.59,.66,-.035,chassis);
  box(psu,3.2,.064,1.66,0,1.12,-.018,edge);
  box(psu,2.98,.76,.065,-.02,.66,.85,chassis);
  box(psu,1.2,.38,.009,-.81,.66,.891,dark);
  label(psu,'RM750',.93,.22,-.82,.68,.901,'#b6c6c8');label(psu,'80 PLUS GOLD',.6,.063,-.8,.48,.901,'#a79b7b');
  label(psu,'CORSAIR',.66,.11,.58,.67,.892,'#a9b8bc');
  for(let i=0;i<12;i++)for(let j=0;j<4;j++)box(psu,.043,.033,.014,-1.43+i*.245,1.015+j*.017,.89,dark);
  for(let i=0;i<19;i++)box(psu,.018,.01,1.18,-1.42+i*.073,1.158,-.04,dark);
  for(let i=0;i<5;i++)box(psu,.1,.23,.3,.42,.68,-.58+i*.235,dark);
  addTarget(psu,'psu',3.08,.88,1.65,0,.68,.02);
  // Front face: three deep recessed RGB intake fans, fine wire intake grille.
  const fan=component('fan');
  box(fan,.14,3.9,1.82,1.64,2.15,0,chassis);
  box(fan,.18,3.72,1.62,1.71,2.19,0,dark);
  function caseFan(parent,y,index,roof=false){
    const g=new THREE.Group();parent.add(g);
    if(roof){g.position.set(-.7+index*1.32,3.84,-.03);g.rotation.x=Math.PI/2;}else{g.position.set(1.829,y,0);g.rotation.y=Math.PI/2;}
    box(g,1.43,1.12,.115,0,0,0,chassis);
    cylinder(g,.502,.14,0,0,.056,dark);
    ring(g,.465,.042,0,0,.154,index===1?violet:cyan);
    ring(g,.506,.014,0,0,.172,index===1?blue:violet);
    ring(g,.392,.012,0,0,.154,whiteLed);
    const rotor=new THREE.Group();g.add(rotor);rotor.position.z=.116;fanRotors.push({rotor,speed:1.4+index*.12});
    const shape=new THREE.Shape();shape.moveTo(.05,.09);shape.bezierCurveTo(.30,.03,.48,.12,.37,.28);shape.bezierCurveTo(.24,.44,.15,.35,.11,.17);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:true,bevelThickness:.007,bevelSize:.008,bevelSegments:1,steps:1,curveSegments:8});
    for(let i=0;i<9;i++){const b=mesh(geo,fanMaterial,rotor);b.rotation.z=i/9*Math.PI*2;}
    cylinder(g,.139,.06,0,0,.166,chassis);ring(g,.106,.009,0,0,.201,whiteLed);cylinder(g,.056,.009,0,0,.206,silver);
    for(const x of [-.585,.585])for(const yy of [-.455,.455])screw(g,x,yy,.074,'z',.028);
    for(let j=0;j<4;j++){const a=j*Math.PI/2;const strut=box(g,.021,.83,.025,0,0,.215,edge);strut.rotation.z=a+.5;}
  }
  for(let n=0;n<3;n++)caseFan(fan,.98+n*1.17,n);
  // Grill is intentionally open enough to show every fan blade and its rotor.
  for(const z of [-.82,.82])box(fan,.19,3.86,.06,1.9,2.17,z,edge);
  for(let n=0;n<34;n++)box(fan,.012,3.65,.008,2.067,2.15,-.78+n*.047,edge);
  for(let n=0;n<48;n++)box(fan,.011,.008,1.56,2.07,.38+n*.075,edge);
  box(fan,.195,.13,1.73,1.95,.3,0,chassis);box(fan,.195,.11,1.73,1.95,4.03,0,chassis);
  label(fan,'NZXT',.4,.08,2.055,.5,0,'#ced7d5',null,[0,Math.PI/2,0]);
  addTarget(fan,'fan',.49,3.7,1.75,1.91,2.2,0);
  // Top exhaust fans and cabling visible from the open side.
  for(let n=0;n<2;n++)caseFan(cpu,0,n,true);
  const cableMat=mat(0x24303a,.1,.8), cableWhite=mat(0x84949c,.2,.64);
  // Mainboard 24-pin cable: twenty-four separate wires curved down into the bay.
  for(let n=0;n<12;n++){
    const z=-.44+n*.027;
    tube(pc,[[1.13,2.8,z],[1.35,2.8,z+.1],[1.43,2.57,z+.18],[1.41,1.54,z+.2],[1.31,1.06,z+.1]],.016,n%3===0?cableWhite:cableMat,40);
  }
  box(pc,.19,.43,.34,1.145,2.65,-.36,dark);
  for(const y of [1.62,2.15,2.5])box(pc,.16,.045,.47,1.42,y,-.09,chassis);
  // GPU power is eight individual braided wires, with combs holding the run.
  for(let n=0;n<8;n++){
    tube(pc,[[.77+n*.035,1.91,.04],[.78+n*.038,2.19,.39],[1.08+n*.031,2.08,.59],[1.25+n*.018,1.51,.51],[1.16+n*.015,1.13,.2]],.014,n%2?cableWhite:cableMat,45);
  }
  for(const y of [1.46,1.75])box(pc,.19,.04,.12,1.32,y,.52,chassis);
  box(pc,.36,.11,.16,.9,1.98,.15,dark);
  // Small front panel wires and SATA cables behind the glass.
  for(let n=0;n<3;n++)tube(pc,[[.2+n*.1,1.34,-.54],[.24+n*.08,1.2,-.22],[.71+n*.11,1.18,.14],[1.33,1.34,.14+n*.1]],.012,n===0?copper:rubber);
  // Transparent tempered-glass side panel on a separately animated transform.
  const panel=new THREE.Group();pc.add(panel);
  box(panel,3.2,3.82,.019,0,2.23,.956,glassMat);
  for(const x of [-1.59,1.59])box(panel,.035,3.86,.024,x,2.22,.976,edge);
  for(const y of [.31,4.14])box(panel,3.22,.036,.024,0,y,.976,edge);
  for(const x of [-1.48,1.48])for(const y of [.45,4.0]){cylinder(panel,.056,.028,x,y,.995,dark);screw(panel,x,y,1.016,'z',.04);}
  label(panel,'TEMPERED GLASS',.56,.044,-1.04,.54,.98,'#71868f');
  // Dust is a physical point cloud on the cooler and intake, removed by cleaning.
  const dustPoints=[];for(let n=0;n<440;n++){dustPoints.push(-1.35+random()*2.85,1.15+random()*2.72,-.53+random()*1.13);}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPoints,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x9c9a86,size:.012,transparent:true,opacity:.28,depthWrite:false}));pc.add(dust);
  const detail=buildMicroDetail({pc,board,parts,renderer,materials:{chassis,edge,silver,gold,dark,pcbMat,chipMat,rubber,copper,cyan},box,cylinder,ring,tube,label,screw});
  container.dataset.microInstances=String(detail.instances);
  // Workbench surface, recessed maintenance mat and measurement grid.
  const floorMat=mat(0x131e25,.4,.77);
  box(scene,200,.13,200,0,-.27,0,floorMat);
  box(scene,6.4,.029,4.5,0,-.19,0,mat(0x1c2d34,.18,.87));
  const grid=new THREE.GridHelper(6,30,0x38515b,0x283d46);grid.position.set(0,-.171,0);grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
  // Calibration markings on the mat.
  for(let i=0;i<51;i++)box(scene,.01,.005,i%5===0?.105:.05,-2.5+i*.1,-.164,1.99,mat(0x566a70,.1,.9));
  label(scene,'RIG REPAIR     /     ELECTROSTATIC SAFE WORKSPACE',3.4,.09,.05,-.151,1.77,'#5c767d',null,[-Math.PI/2,0,0]);
  // Precision screwdriver and magnetic parts tray add scale to the desktop scene.
  const driver=new THREE.Group();scene.add(driver);driver.position.set(-2.35,-.1,.4);driver.rotation.y=-.35;
  cylinder(driver,.06,.72,0,.042,0,chassis);cylinder(driver,.022,.56,0,.041,.62,silver);cylinder(driver,.016,.09,0,.041,.94,dark);
  for(let n=0;n<9;n++)ring(driver,.063,.009,0,.042,-.29+n*.065,edge);
  ring(driver,.062,.018,0,.042,.34,green);
  const tray=new THREE.Group();scene.add(tray);tray.position.set(2.6,-.12,.65);
  box(tray,.6,.035,.77,0,0,0,dark);for(const x of [-.3,.3])box(tray,.025,.1,.78,x,.03,0,edge);for(const z of [-.39,.39])box(tray,.6,.1,.025,0,.03,z,edge);
  for(let i=0;i<7;i++)screw(tray,-.2+random()*.4,.045,-.29+random()*.55,'y',.025);
  // Studio lighting, practical LED spill and cinematic reflections.
  const ambient=new THREE.HemisphereLight(0xafcad9,0x182219,1.4);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xd5e8f0,4.1);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(4096,4096);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=8;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.radius=4;scene.add(key);
  const rim=new THREE.DirectionalLight(0x74bdd9,2.7);rim.position.set(4,4,-4);scene.add(rim);
  const fill=new THREE.RectAreaLight(0xccdfeb,5.5,5,5);fill.position.set(0,4,6);fill.lookAt(0,2,0);scene.add(fill);
  const inside=new THREE.PointLight(0x6fcae2,3.8,6,2);inside.position.set(.2,2.8,.68);scene.add(inside);
  const intakeGlow=new THREE.PointLight(0x669adc,3,4,2);intakeGlow.position.set(2.35,1.8,0);scene.add(intakeGlow);
  const groundGlow=new THREE.PointLight(0x7199e8,1.3,3,2);groundGlow.position.set(1.2,.18,.4);scene.add(groundGlow);
  const warmer=new THREE.PointLight(0xc8df94,1,6,2);warmer.position.set(-3,3,1);scene.add(warmer);
  const inspection={macro:false,exploded:false,thermal:false,light:false,rgb:0};
  const inspectionLight=new THREE.PointLight(0xe6f2e9,0,9,2);scene.add(inspectionLight);
  let mobile=false, camTarget=null;
  function defaultPosition(){return mobile?new THREE.Vector3(6.55,4.05,8.8):new THREE.Vector3(5.7,3.85,7.9);}
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;const wasMobile=mobile;mobile=w/h<1.2;
    renderer.setSize(w,h);displayCanvas.width=renderer.domElement.width;displayCanvas.height=renderer.domElement.height;composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
    if(sceneInitialized){
      if(inspection.macro){focusComponent();camera.position.copy(camTarget);camTarget=null;}
      else if(wasMobile!==mobile){if(inspection.exploded){camera.position.set(8.6,5.4,12.4);controls.target.set(0,2.15,.55);}else{camera.position.copy(defaultPosition());controls.target.set(0,1.9,0);}camTarget=null;}
      controls.update();composer.render();presentFrame();
    }
  }
  resize(); camera.position.copy(defaultPosition()); controls.update();
  const ro=new ResizeObserver(resize);ro.observe(container);
  let currentState=window.RigGame?.state,selected=window.RigGame?.selected||'cpu',panelDestination=0,repairPulse=0,powered=false,cleaned=false;
  function updateState(){
    const s=window.RigGame?.state;if(!s)return;currentState=s;selected=window.RigGame?.selected||selected;panelDestination=s.active?.panelOpen?1:0;powered=!!s.active?.powered;cleaned=!!s.active?.cleaned;dust.visible=!cleaned&&!!s.active;pc.visible=!!s.active;document.getElementById('part-tooltip').hidden=!s.settings.labels||!s.active;
    const faulty=s.active?.faults.includes('cpu')&&!s.active?.repaired.includes('cpu');
    const canvas=tempLabel.material.map.image,ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=faulty?'#f7ab78':'#a4eac6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 60px Arial';ctx.fillText(faulty?'98°':'38°',512,65);tempLabel.material.map.needsUpdate=true;
  }
  updateState();window.addEventListener('rig-state',updateState);window.addEventListener('rig-ready',updateState);
  window.addEventListener('rig-select',e=>{selected=e.detail;repairPulse=.4;if(inspection.macro)focusComponent();});
  window.addEventListener('rig-repair',e=>{selected=e.detail;repairPulse=1.7;});
  window.addEventListener('rig-clean',()=>{dust.visible=false;});
  function resetCamera(){inspection.macro=false;controls.target.set(0,inspection.exploded?2.15:1.9,inspection.exploded?.55:0);camTarget=inspection.exploded?new THREE.Vector3(8.6,5.4,12.4):defaultPosition();syncInspection();}
  window.addEventListener('rig-reset-view',resetCamera);
  window.addEventListener('rig-view',e=>{inspection.macro=false;syncInspection();controls.target.set(0,1.95,0);camTarget=e.detail==='side'?new THREE.Vector3(0,2.95,mobile?10.7:9.3):new THREE.Vector3(mobile?10.8:9.4,3.0,.65);});
  function focusComponent(){
    const o=detail.origins[selected],v=detail.offsets[selected],e=inspection.exploded?1:0;
    const target=new THREE.Vector3(o[0]+v[0]*e,o[1]+v[1]*e,o[2]+v[2]*e);
    controls.target.copy(target);const distance={cpu:2.0,ram:2.8,gpu:5.0,ssd:1.8,psu:5.0,fan:6.8}[selected];
    camTarget=target.clone().add(selected==='fan'?new THREE.Vector3(distance,.4,1.7):new THREE.Vector3(.24,.3,distance));
  }
  function syncInspection(){
    for(const name of ['macro','exploded','thermal','light'])document.querySelector(`[data-inspection="${name}"]`)?.setAttribute('aria-pressed',String(inspection[name]));
    document.getElementById('macro-hud').hidden=!inspection.macro;
    document.getElementById('thermal-legend').hidden=!inspection.thermal;
    document.getElementById('inspection-caption').textContent=inspection.exploded?'分解図は観察用です。実際の作業状態は変わりません。':inspection.macro?'透視接写モード · 左右ボタンで部品を切り替え':inspection.thermal?'温度分布は診断結果から生成するゲーム内の模式表示です。':'部品の裏側まで、あなたの目で。';
    document.getElementById('stage').classList.toggle('macro-active',inspection.macro);
  }
  function inspectionAction(name){
    if(!window.RigGame?.state.active){window.RigGame?.toast('観察するPCがありません。新しい依頼を受けてください。');return;}
    if(name==='rgb'){inspection.rgb=(inspection.rgb+1)%4;document.getElementById('rgb-mode-label').textContent=['ICE','SPECTRUM','WHITE','OFF'][inspection.rgb];detail.setRGB(inspection.rgb);[cyan,blue,violet,green,whiteLed].forEach(m=>{if(!m.userData.baseEmission)m.userData.baseEmission={color:m.emissive.clone(),intensity:m.emissiveIntensity};m.emissive.copy(inspection.rgb===2?new THREE.Color(0xd5e5df):m.userData.baseEmission.color);m.emissiveIntensity=inspection.rgb===3?0:m.userData.baseEmission.intensity;});return;}
    inspection[name]=!inspection[name];
    if(name==='macro'){if(inspection.macro)focusComponent();else resetCamera();}
    if(name==='exploded'){if(inspection.macro)focusComponent();else resetCamera();}
    syncInspection();
  }
  document.querySelectorAll('[data-inspection]').forEach(b=>b.addEventListener('click',()=>inspectionAction(b.dataset.inspection)));
  document.querySelectorAll('[data-macro-step]').forEach(b=>b.addEventListener('click',()=>{const keys=Object.keys(parts),index=keys.indexOf(selected);window.RigGame?.focus(keys[(index+Number(b.dataset.macroStep)+keys.length)%keys.length]);}));
  window.addEventListener('rig-macro',()=>{inspection.macro=true;focusComponent();syncInspection();});
  window.addEventListener('rig-inspection',e=>inspectionAction(e.detail));
  controls.addEventListener('start',()=>{camTarget=null;});
  syncInspection();
  // Raycast only on a tap, never at the end of a drag or multi-touch gesture.
  const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let pointerStart=null,activePointers=new Set(),multiTouch=false;
  displayCanvas.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1)multiTouch=true;if(activePointers.size===1){pointerStart={x:e.clientX,y:e.clientY,t:performance.now()};multiTouch=false;}});
  displayCanvas.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(multiTouch||!pointerStart||performance.now()-pointerStart.t>500||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>7){pointerStart=null;return;}pointerStart=null;const rect=displayCanvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits.length&&pc.visible){if(inspection.macro)window.RigGame?.focus(hits[0].object.userData.part);else window.RigGame?.select(hits[0].object.userData.part);}});
  displayCanvas.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);pointerStart=null;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.style.display='flex';loading.innerHTML='<strong>3D表示が一時停止しました</strong><small>ページを再読み込みすると復帰できます。進行は保存済みです。</small>';});
  const tooltip=document.getElementById('part-tooltip'),tooltipText=document.getElementById('part-tooltip-text');const projected=new THREE.Vector3();
  const anchors={cpu:[-.36,3.3,.05],ram:[.85,3.49,.06],gpu:[-.1,1.96,.48],ssd:[-.82,2.37,-.42],psu:[-.65,.89,1.01],fan:[2.05,3.85,.05]};
  const clock=new THREE.Clock();let panelProgress=0,frameCount=0,lastLoggedView='';
  function animate(){
    const elapsed=clock.getDelta(),dt=Math.min(elapsed,.05),t=clock.elapsedTime;
    if(camTarget){camera.position.lerp(camTarget,1-Math.exp(-Math.min(elapsed,.5)*9));if(camera.position.distanceTo(camTarget)<.015)camTarget=null;}
    controls.update();detail.update(Math.min(elapsed,.25),t,{exploded:inspection.exploded,heat:inspection.thermal,job:currentState?.active});
    panel.visible=!inspection.macro;panelProgress=THREE.MathUtils.lerp(panelProgress,inspection.exploded?1:panelDestination,1-Math.exp(-dt*5));
    inspectionLight.position.copy(camera.position);inspectionLight.intensity=inspection.light?18:0;
    document.getElementById('macro-part-label').textContent=(window.RepairCore?.PARTS[selected]?.short||'CPU')+' / MACRO';
    panel.position.set(-panelProgress*1.9,panelProgress*.13,panelProgress*1.75);panel.rotation.y=-panelProgress*.27;
    // Standby RGB is powered by the workbench's isolated low-voltage lighting feed.
    for(const f of fanRotors)f.rotor.rotation.z+=dt*f.speed*(powered?9:0);
    inside.intensity=3.6+Math.sin(t*.6)*.25;
    if(repairPulse>0){repairPulse-=dt;const target=pickables.find(o=>o.userData.part===selected);if(target){highlight.box.setFromObject(target);highlight.visible=pc.visible;highlight.material.transparent=true;highlight.material.opacity=Math.min(.5,repairPulse*.7);}}else highlight.visible=false;
    if(currentState?.settings.labels&&pc.visible){projected.set(...anchors[selected]).add(parts[selected].position).applyMatrix4(pc.matrixWorld).project(camera);const x=(projected.x*.5+.5)*container.clientWidth,y=(-projected.y*.5+.5)*container.clientHeight;tooltip.hidden=projected.z>1||x<75||x>container.clientWidth-70||y<100||y>container.clientHeight-50;if(!tooltip.hidden){tooltip.style.left=x+'px';tooltip.style.top=(y-12)+'px';tooltipText.textContent=window.RepairCore?.PARTS[selected]?.short||selected.toUpperCase();}}else tooltip.hidden=true;
    composer.render();
    presentFrame();
    if(!camTarget&&Math.abs(detail.explosion-(inspection.exploded?1:0))<.01)container.dataset.viewSettled=inspection.macro?'macro':inspection.exploded?'exploded':inspection.thermal?'thermal':'normal';else delete container.dataset.viewSettled;
    if(frameCount===2){loading.style.display='none';container.dataset.ready='true';console.info('RIG 3D ready — '+detail.instances+' additional physical micro-details; SSAO, 4K shadows and macro optics active.');
      const view=new URLSearchParams(location.search).get('view');if(new URLSearchParams(location.search).get('qa')==='1'){if(view==='macro')inspectionAction('macro');if(view==='exploded')inspectionAction('exploded');if(view==='thermal')inspectionAction('thermal');}}
    if(container.dataset.viewSettled&&container.dataset.viewSettled!==lastLoggedView){lastLoggedView=container.dataset.viewSettled;console.info('3D view settled',lastLoggedView,'distance',camera.position.distanceTo(controls.target).toFixed(2),'camera',camera.position.toArray().map(v=>v.toFixed(2)).join(','),'viewport',container.clientWidth+'x'+container.clientHeight);
      if(new URLSearchParams(location.search).get('qa')==='1'){const gl=renderer.getContext(),px=new Uint8Array(32*32*4);gl.readPixels(Math.floor(renderer.domElement.width/2)-16,Math.floor(renderer.domElement.height/2)-16,32,32,gl.RGBA,gl.UNSIGNED_BYTE,px);const colors=new Set();let max=0;for(let i=0;i<px.length;i+=4){colors.add(px[i]+','+px[i+1]+','+px[i+2]);max=Math.max(max,px[i],px[i+1],px[i+2]);}console.info('CANVAS QA',JSON.stringify({rect:displayCanvas.getBoundingClientRect().toJSON(),buffer:[renderer.domElement.width,renderer.domElement.height],visible:pc.visible,uniqueColors:colors.size,max,firstPixel:Array.from(px.slice(0,4)),display:getComputedStyle(renderer.domElement).display,visibility:getComputedStyle(renderer.domElement).visibility,opacity:getComputedStyle(renderer.domElement).opacity}));}}
    frameCount++;
  }
  sceneInitialized=true;
  renderer.setAnimationLoop(animate);
}
