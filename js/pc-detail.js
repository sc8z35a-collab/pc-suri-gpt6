import * as THREE from 'three';

/** High-density physical detail layer; the base machine and repair engine are retained. */
export function buildMicroDetail({pc,board,parts,renderer,materials,box,cylinder,ring,tube,label,screw}) {
  const {chassis,edge,silver,gold,dark,pcbMat,chipMat,rubber,copper,cyan}=materials;
  let seed=41937;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
  let instances=0;
  function batch(parent,geometry,material,transforms){
    const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);mesh.castShadow=true;mesh.receiveShadow=true;
    transforms.forEach((p,i)=>{position.set(p[0],p[1],p[2]);scale.set(p[3]??1,p[4]??1,p[5]??1);rotation.setFromEuler(new THREE.Euler(p[6]||0,p[7]||0,p[8]||0));matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);});
    mesh.instanceMatrix.needsUpdate=true;parent.add(mesh);instances+=transforms.length;return mesh;
  }
  // Fine directional tool marks and micro-pitting are physical bump/roughness maps.
  function surfaceTexture(type,size=1024){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');
    ctx.fillStyle=type==='rough'?'#bbbbbb':'#808080';ctx.fillRect(0,0,size,size);
    for(let i=0;i<17000;i++){const v=Math.floor(90+rand()*80);ctx.fillStyle=`rgba(${v},${v},${v},${.07+rand()*.2})`;ctx.fillRect(rand()*size,rand()*size,type==='brushed'?10+rand()*130:1+rand()*2,.5+rand());}
    for(let i=0;i<130;i++){ctx.strokeStyle=`rgba(240,240,240,${rand()*.12})`;ctx.lineWidth=.3+rand()*.7;const x=rand()*size,y=rand()*size;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*100,y+rand()*10);ctx.stroke();}
    const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex;
  }
  const brushed=surfaceTexture('brushed'),roughness=surfaceTexture('rough');
  [chassis,edge,silver,copper].forEach(m=>{m.bumpMap=brushed;m.bumpScale=.011;m.roughnessMap=roughness;m.needsUpdate=true;});
  // A woven cable jacket catches light at a different angle on each fibre.
  const weave=document.createElement('canvas');weave.width=weave.height=256;const wc=weave.getContext('2d');wc.fillStyle='#606060';wc.fillRect(0,0,256,256);
  for(let i=-256;i<512;i+=12){wc.strokeStyle=i%24?'#aaa':'#888';wc.lineWidth=4;wc.beginPath();wc.moveTo(i,0);wc.lineTo(i+256,256);wc.stroke();wc.strokeStyle='#333';wc.beginPath();wc.moveTo(i,256);wc.lineTo(i+256,0);wc.stroke();}
  const woven=new THREE.CanvasTexture(weave);woven.wrapS=woven.wrapT=THREE.RepeatWrapping;woven.repeat.set(2,15);rubber.bumpMap=woven;rubber.bumpScale=.016;rubber.needsUpdate=true;
  // Actual plated vias and solder joints, not merely dots on an image.
  const viaPositions=[],solderPositions=[],resistorPositions=[],terminations=[];
  for(let i=0;i<1400;i++){const x=-1.44+rand()*2.58,y=1.29+rand()*2.66;viaPositions.push([x,y,-.756]);}
  batch(board,new THREE.TorusGeometry(.009,.0026,6,12),gold,viaPositions);
  for(let i=0;i<1250;i++){const x=-1.43+rand()*2.57,y=1.3+rand()*2.65;solderPositions.push([x,y,-.749,.007+rand()*.003,.005,.004]);}
  batch(board,new THREE.SphereGeometry(1,8,6),silver,solderPositions);
  for(let i=0;i<520;i++){const x=-1.4+rand()*2.52,y=1.31+rand()*2.57,w=.013+rand()*.018;resistorPositions.push([x,y,-.738,w,.012,.013]);terminations.push([x-w*.56,y,-.736,.008,.013,.016],[x+w*.56,y,-.736,.008,.013,.016]);}
  batch(board,new THREE.BoxGeometry(1,1,1),chipMat,resistorPositions);batch(board,new THREE.BoxGeometry(1,1,1),silver,terminations);
  // Fan-out bundles and differential pairs routed at 45-degree angles.
  const traces=[];
  for(let bus=0;bus<42;bus++){
    const x=-1.38+rand()*2.3,y=1.38+rand()*2.25,dx=.06+rand()*.17,dy=.07+rand()*.17;
    for(let lane=0;lane<8;lane++){const oy=lane*.008;traces.push(x,y+oy,-.751,x+dx,y+oy,-.751,x+dx,y+oy,-.751,x+dx+.06,y+oy+.06,-.751,x+dx+.06,y+oy+.06,-.751,x+dx+.06,y+dy+oy,-.751);}
  }
  const traceGeo=new THREE.BufferGeometry();traceGeo.setAttribute('position',new THREE.Float32BufferAttribute(traces,3));board.add(new THREE.LineSegments(traceGeo,new THREE.LineBasicMaterial({color:0x769487,transparent:true,opacity:.55})));
  // Silkscreen: reference designators, polarity marks, outlines and inspection stamps.
  const print=document.createElement('canvas');print.width=print.height=2048;const ctx=print.getContext('2d');
  ctx.strokeStyle='rgba(194,215,199,.5)';ctx.fillStyle='rgba(209,221,205,.65)';ctx.lineWidth=1.1;ctx.font='11px monospace';
  for(let i=0;i<300;i++){const x=25+rand()*1940,y=25+rand()*1950;ctx.strokeRect(x,y,18+rand()*20,12);ctx.fillText((i%3===0?'R':i%3===1?'C':'U')+(101+i),x,y-3);if(i%5===0)ctx.fillText('+',x-9,y+10);}
  ctx.font='bold 25px monospace';ctx.fillText('B650-A  /  REV 1.02',130,1910);ctx.font='15px monospace';ctx.fillText('RoHS   Pb FREE   ESD SENSITIVE',130,1945);ctx.fillText('ENGINEERED FOR PRECISION',980,90);
  const printTexture=new THREE.CanvasTexture(print);printTexture.colorSpace=THREE.SRGBColorSpace;printTexture.anisotropy=16;
  const markings=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.77),new THREE.MeshBasicMaterial({map:printTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));markings.position.set(-.16,2.63,-.745);board.add(markings);
  // CMOS cell with embossed voltage marking and a curved retaining clip.
  cylinder(board,.143,.024,.52,1.67,-.676,silver);ring(board,.151,.018,.52,1.67,-.659,edge);
  label(board,'CR2032',.23,.033,.52,1.695,-.659,'#4f5b60');label(board,'3V  +',.14,.034,.52,1.637,-.658,'#4f5b60');
  box(board,.21,.023,.026,.52,1.54,-.637,edge);
  // Discrete audio codec, crystal can, BIOS IC and each gull-wing lead.
  function ic(parent,x,y,z,w,h,pins,text){
    box(parent,w,h,.035,x,y,z,chipMat);const leads=[];
    for(let p=0;p<pins;p++){const py=y-h*.42+p*h*.84/(pins-1);leads.push([x-w/2-.023,py,z+.004,.045,.008,.014],[x+w/2+.023,py,z+.004,.045,.008,.014]);}
    batch(parent,new THREE.BoxGeometry(1,1,1),silver,leads);label(parent,text,w*.86,h*.16,x,y,z+.02,'#9fada6');cylinder(parent,.012,.003,x-w*.3,y+h*.32,z+.02,gold);
  }
  ic(board,-1.13,1.76,-.703,.23,.34,12,'ALC 4080');ic(board,.74,2.05,-.71,.24,.19,8,'WINBOND');ic(board,-.97,2.63,-.704,.2,.24,8,'DIGI+');
  box(board,.21,.08,.054,.72,1.37,-.688,silver);label(board,'25.000',.18,.045,.72,1.37,-.659,'#434f50');
  // Socket under the pump, visible when exploded: individual land-grid contacts.
  const socket=new THREE.Group();board.add(socket);
  box(socket,.9,.91,.065,-.36,2.97,-.686,edge);box(socket,.76,.76,.025,-.36,2.97,-.637,dark);
  const pins=[];for(let y=0;y<36;y++)for(let x=0;x<38;x++)pins.push([-.702+x*.018,2.655+y*.018,-.616,.009,.009,.022]);
  batch(socket,new THREE.BoxGeometry(1,1,1),gold,pins);
  const processor=box(socket,.56,.56,.034,-.36,2.97,-.589,silver);
  label(socket,'AMD RYZEN',.4,.048,-.36,3.02,-.568,'#516263');label(socket,'7800X • AM5',.33,.034,-.36,2.94,-.568,'#677571');
  tube(socket,[[-.85,2.57,-.6],[-.86,3.36,-.6],[-.76,3.42,-.6]],.018,silver,30);
  for(const yy of [2.56,3.38])box(socket,.94,.06,.075,-.36,yy,-.62,edge);
  // Gold-finger DIMM edges: every land is a separate metal contact.
  const dimmPins=[];for(let n=0;n<2;n++)for(let p=0;p<70;p++)dimmPins.push([.64+n*.34,2.34+p*.017,-.58,.089,.007,.025]);
  batch(parts.ram,new THREE.BoxGeometry(1,1,1),gold,dimmPins);
  // GPU exposed PCB assembly, shown in the illustrative exploded view only.
  const gpuBoard=new THREE.Group();parts.gpu.add(gpuBoard);gpuBoard.visible=false;
  box(gpuBoard,2.56,1.0,.048,-.1,1.79,.52,pcbMat);box(gpuBoard,.68,.67,.034,-.05,1.83,.565,edge);
  box(gpuBoard,.45,.44,.024,-.05,1.83,.602,new THREE.MeshPhysicalMaterial({color:0x576f83,metalness:.92,roughness:.13,clearcoat:1,iridescence:.8,iridescenceIOR:1.35}));
  label(gpuBoard,'AD104-250',.35,.043,-.05,1.83,.617,'#aeced1');
  for(const x of [-.66,.56])for(const y of [1.57,1.89,2.2])ic(gpuBoard,x,y,.568,.3,.19,8,'GDDR6X');
  for(let p=0;p<9;p++){box(gpuBoard,.115,.12,.08,1.01,1.37+p*.091,.58,edge);cylinder(gpuBoard,.033,.067,.84,1.38+p*.092,.578,silver);}
  const gpuGold=[];for(let p=0;p<78;p++)gpuGold.push([-1.26+p*.03,1.246,.544,.018,.084,.015]);batch(gpuBoard,new THREE.BoxGeometry(1,1,1),gold,gpuGold);
  for(const x of [-1.3,1.11])for(const y of [1.37,2.2])screw(gpuBoard,x,y,.568,'z',.023);
  label(gpuBoard,'PCB REV 2.3  /  12GB',.65,.042,-.81,1.32,.551,'#b9c8b1');
  const pads=new THREE.Group();gpuBoard.add(pads);const thermalPad=new THREE.MeshStandardMaterial({color:0x8ba9b6,roughness:.96,metalness:0});
  for(const x of [-.66,.56])for(const y of [1.57,1.89,2.2])box(pads,.285,.176,.016,x,y,.66,thermalPad);
  // M.2 contact fingers, serial plate, controller connection pads.
  const contacts=[];for(let i=0;i<22;i++)contacts.push([-.382,2.046+i*.0095,-.607,.062,.005,.009]);batch(parts.ssd,new THREE.BoxGeometry(1,1,1),gold,contacts);
  const ssdSerial=label(parts.ssd,'S/N: RR-980-26A017',.57,.024,-.84,2.092,-.588,'#9baaac');
  // Open rear sockets are supplied by the engineering layer.
  // ARGB diodes around each front intake ring; diffusers remain separate.
  const leds=[];const rgbMaterials=[];
  for(let f=0;f<3;f++){
    const m=new THREE.MeshStandardMaterial({color:0xc9e9ff,emissive:new THREE.Color().setHSL(.51+f*.1,.85,.52),emissiveIntensity:3,roughness:.3});rgbMaterials.push(m);
    const points=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;points.push([2.012,.98+f*1.17+Math.sin(a)*.45,Math.cos(a)*.45,.012,.018,.018]);}leds.push(batch(parts.fan,new THREE.BoxGeometry(1,1,1),m,points));
  }
  // Pump fittings have actual collars, threads and compression knurling.
  for(let n=0;n<2;n++)for(let i=0;i<10;i++){const a=i/10*Math.PI*2;box(parts.cpu,.012,.065,.012,-.36+n*.18+Math.cos(a)*.081,3.28,-.24+Math.sin(a)*.081,edge);}
  const engineering=buildEngineeringDetail({pc,board,parts,materials,box,cylinder,ring,tube,label,screw,batch});
  const layers=buildDeviceLayers({pc,parts,materials,box,cylinder,ring,tube,label,screw,batch});
  // Thermal overlay follows each component's explosion transform.
  const thermalRoot=new THREE.Group();pc.add(thermalRoot);const heatMeshes={};
  const thermalSpecs={cpu:[-.36,2.97,-.16,.43,.44,.08],ram:[.82,2.95,.1,.36,.69,.07],gpu:[-.1,1.7,.42,1.39,.25,.08],ssd:[-.8,2.15,-.55,.46,.14,.03],psu:[-.15,.69,.93,1.47,.39,.06],fan:[2.1,2.17,0,.09,1.79,.79]};
  for(const [name,p] of Object.entries(thermalSpecs)){
    const m=new THREE.MeshBasicMaterial({color:0x387efe,transparent:true,opacity:.64,depthWrite:false});const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,36,24),m);mesh.position.set(p[0],p[1],p[2]);mesh.scale.set(p[3],p[4],p[5]);mesh.userData.base=mesh.position.clone();thermalRoot.add(mesh);heatMeshes[name]=mesh;
  }
  thermalRoot.visible=false;
  // Reference projection lines make the exploded illustration readable.
  const lineGeometry=new THREE.BufferGeometry();const lineArray=new Float32Array(6*6);lineGeometry.setAttribute('position',new THREE.BufferAttribute(lineArray,3));
  const assemblyLines=new THREE.LineSegments(lineGeometry,new THREE.LineDashedMaterial({color:0xa9da80,dashSize:.05,gapSize:.04,transparent:true,opacity:.42}));pc.add(assemblyLines);assemblyLines.visible=false;
  const origins={cpu:[-.36,2.97,-.5],ram:[.8,2.95,-.4],gpu:[-.1,1.7,.15],ssd:[-.8,2.15,-.6],psu:[-.15,.7,.4],fan:[1.85,2.2,0]};
  const offsets={cpu:[-.62,.95,1.65],ram:[.66,.62,1.45],gpu:[-.18,-.05,1.7],ssd:[-1.02,-.12,1.45],psu:[-.42,-.06,.8],fan:[1.05,.06,0]};
  let explosion=0,thermal=false,rgbMode=0;
  function update(dt,t,{exploded,heat,job,cutaway=false,spread=.65}){
    explosion=THREE.MathUtils.damp(explosion,exploded?1:0,5,dt);thermal=heat;
    for(const key of Object.keys(parts)){const a=offsets[key];parts[key].position.set(a[0]*explosion,a[1]*explosion,a[2]*explosion);}
    layers.update(dt,cutaway||explosion>.08,spread);
    gpuBoard.visible=cutaway||explosion>.08;gpuBoard.rotation.x=-Math.PI/2;
    gpuBoard.position.set(0,1.43+layers.amount*.42,1.72);pads.position.z=layers.amount*.18;
    ssdSerial.visible=!cutaway&&explosion<.08;
    processor.position.z=-.589;
    engineering.update(dt,{cutaway,explosion,powered:!!job?.powered});
    thermalRoot.visible=thermal;assemblyLines.visible=explosion>.04;
    Object.entries(origins).forEach(([key,o],i)=>{
      lineArray.set(o,i*6);lineArray.set([o[0]+offsets[key][0]*explosion,o[1]+offsets[key][1]*explosion,o[2]+offsets[key][2]*explosion],i*6+3);
      const fault=job?.faults.includes(key)&&!job?.repaired.includes(key),known=job?.diagnosed.includes(key);
      const color=!known?0x536573:fault?0xff493b:key==='cpu'?0xa1d839:0x38bdd1;
      heatMeshes[key].material.color.setHex(color);heatMeshes[key].position.copy(heatMeshes[key].userData.base).add(parts[key].position);
      heatMeshes[key].material.opacity=thermal?(.47+Math.sin(t*2+i)*.04):0;
    });lineGeometry.attributes.position.needsUpdate=true;assemblyLines.computeLineDistances();
    rgbMaterials.forEach((m,i)=>{if(rgbMode===0)m.emissive.setHSL(.51+i*.1,.85,.5);else if(rgbMode===1)m.emissive.setHSL((t*.05+i*.15)%1,.92,.48);else if(rgbMode===2)m.emissive.set(0xdbedee);else m.emissive.set(0x000000);});
  }
  return {update,offsets,origins,instances,engineering,layers,setRGB(mode){rgbMode=mode;},get explosion(){return explosion;}};
}

/** Independently movable physical layers; all transforms are presentation-only. */
function buildDeviceLayers({pc,parts,materials,box,cylinder,ring,tube,label,screw,batch}){
  const {chassis,edge,silver,gold,dark,pcbMat,chipMat,rubber,copper}=materials;
  const cube=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,6,4);
  const padMat=new THREE.MeshStandardMaterial({color:0x829caf,roughness:.96});
  const ceramic=new THREE.MeshStandardMaterial({color:0xbba676,roughness:.8});
  const groups={},moving=[],internal=[];
  function group(parent,name,offset,onlyOpen=false){
    const g=new THREE.Group();g.name=name;parent.add(g);groups[name]=g;
    if(offset)moving.push({g,offset:new THREE.Vector3(...offset)});if(onlyOpen)internal.push(g);return g;
  }
  const ssd=group(parts.ssd,'ssd-layers'),chips=group(ssd,'ssd-chips',[0,.11,.15]);
  const solder=[],caps=[],ends=[],tracks=[];
  for(let n=0;n<3;n++){
    const x=-1.055+n*.195;box(chips,.16,.14,.024,x,2.15,-.618,chipMat);
    label(chips,n===2?'CTRL':'V-NAND',.13,.026,x,2.163,-.604,'#c1cbbb');
    label(chips,n===2?'PCIe 4.0':'128L',.09,.019,x,2.118,-.603,'#94aaa1');
    for(let row=0;row<9;row++)for(let col=0;col<10;col++)solder.push([x-.064+col*.0142,2.098+row*.013,-.636,.0045,.0045,.004]);
    for(let i=0;i<12;i++){const px=x-.074+i*.013;tracks.push(px,2.065,-.643,px,2.043,-.643,px,2.043,-.643,px+.01,2.027,-.643);}
  }
  batch(ssd,ball,silver,solder);
  for(let i=0;i<22;i++){
    const x=-1.14+i*.027;caps.push([x,2.235,-.635,.014,.01,.011]);
    for(const dx of [-.008,.008])ends.push([x+dx,2.235,-.635,.005,.011,.012]);
  }
  batch(ssd,cube,ceramic,caps);batch(ssd,cube,silver,ends);
  const traceGeo=new THREE.BufferGeometry();traceGeo.setAttribute('position',new THREE.Float32BufferAttribute(tracks,3));ssd.add(new THREE.LineSegments(traceGeo,new THREE.LineBasicMaterial({color:0x9db879})));
  const ssdPad=group(ssd,'ssd-pad',[0,.26,.29],true);box(ssdPad,.69,.155,.012,-.83,2.15,-.582,padMat);
  const ssdShield=group(ssd,'ssd-shield',[0,.41,.45],true);box(ssdShield,.73,.182,.014,-.82,2.15,-.561,copper);
  label(ssdShield,'NVMe / COPPER SHIELD',.64,.032,-.82,2.15,-.552,'#e4c394');
  const via=[];for(let i=0;i<32;i++)via.push([-1.164+i*.022,2.052,-.641]);batch(ssd,new THREE.TorusGeometry(.004,.0012,4,8),gold,via);
  cylinder(ssd,.023,.025,-1.24,2.15,-.684,gold);ring(ssd,.032,.006,-1.24,2.15,-.633,silver);
  label(ssd,'M.2 2280 / KEY M',.32,.022,-.81,2.056,-.636,'#b1c7aa');

  const ram=group(parts.ram,'ram-layers'),dram=group(ram,'dram',[.12,0,.04]);
  const ramPad=group(ram,'ram-pad',[.25,0,.11],true),ramShield=group(ram,'ram-shield',[.4,0,.18],true);
  const ramBalls=[],passives=[],ramEnds=[];
  for(let n=0;n<2;n++){
    const x=.64+n*.34;
    for(let i=0;i<8;i++){
      const y=2.49+i*.13;box(dram,.026,.088,.2,x+.047,y,-.42,chipMat);box(ramPad,.014,.086,.194,x+.069,y,-.42,padMat);
      for(let r=0;r<6;r++)for(let c=0;c<9;c++)ramBalls.push([x+.035,y-.032+r*.0128,-.5+c*.02,.004,.004,.004]);
      for(let j=0;j<3;j++){passives.push([x+.04,y+.053,-.49+j*.06,.012,.012,.027]);for(const dz of [-.017,.017])ramEnds.push([x+.04,y+.053,-.49+j*.06+dz,.013,.013,.008]);}
    }
    box(ram,.026,.075,.06,x+.05,3.46,-.47,chipMat);box(ram,.027,.066,.053,x+.05,2.4,-.45,chipMat);
    label(ram,'PMIC',.071,.022,x+.071,3.46,-.47,'#c4d7c5',null,[0,Math.PI/2,0]);
    box(ramShield,.014,1.16,.29,x+.09,2.96,-.41,edge);
    label(ramShield,'DDR5 / 16GB / 6000',.85,.04,x+.1,2.96,-.41,'#a8bfba',null,[0,Math.PI/2,Math.PI/2]);
    for(const y of [2.3,3.59]){cylinder(ram,.023,.12,x,y,-.48,silver,'x');ring(ram,.023,.005,x+.067,y,-.48,silver,'x');}
  }
  batch(ram,ball,silver,ramBalls);batch(ram,cube,ceramic,passives);batch(ram,cube,silver,ramEnds);

  const gpu=group(parts.gpu,'gpu-layers'),backplate=group(gpu,'gpu-backplate',[0,.83,0],true);
  for(const z of [-.51,.28])box(backplate,2.58,.023,.085,-.1,1.986,z,edge);
  for(const x of [-1.35,1.15])box(backplate,.082,.023,.78,x,1.986,-.13,edge);
  const ribs=[],springs=[],washers=[];for(let i=0;i<19;i++)ribs.push([-1.25+i*.128,1.986,-.13,.025,.023,.66,0,.28,0]);batch(backplate,cube,chassis,ribs);
  label(backplate,'THERMAL ARMOR / RTX',1.2,.06,-.1,2.002,.24,'#a4b9b6',null,[-Math.PI/2,0,0]);
  for(const x of [-.52,.28])for(const z of [-.38,.23]){
    washers.push([x,1.988,z,1,1,1,Math.PI/2,0,0]);for(let i=0;i<5;i++)springs.push([x,1.975+i*.007,z,1,1,1,Math.PI/2,0,0]);screw(backplate,x,2.025,z,'y',.026);
  }
  batch(backplate,new THREE.TorusGeometry(.033,.006,5,12),silver,washers);batch(backplate,new THREE.TorusGeometry(.022,.0035,5,12),silver,springs);
  const coldplate=group(gpu,'gpu-coldplate',[0,.19,0],true);box(coldplate,.77,.029,.59,-.12,1.894,-.09,copper);
  for(let i=0;i<4;i++)tube(coldplate,[[-.42,1.913,-.31+i*.14],[-.16,1.924,-.3+i*.14],[.26,1.913,-.3+i*.14]],.017,copper,16);

  const chassisDetail=group(pc,'chassis-hardware'),filter=group(pc,'dust-filter',[.75,0,0]);
  const threads=[];for(const x of [-1.48,1.48])for(const y of [.45,4]){
    cylinder(chassisDetail,.029,.11,x,y,.915,silver);ring(chassisDetail,.053,.009,x,y,.943,rubber);
    for(let i=0;i<7;i++)threads.push([x,y,.873+i*.012]);
  }
  batch(chassisDetail,new THREE.TorusGeometry(.03,.004,5,12),silver,threads);
  for(const x of [-1.58,1.58])for(const y of [.34,4.05]){
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.21,0);shape.lineTo(0,.21);shape.closePath();
    const brace=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false}),edge);brace.position.set(x,y,.85);brace.scale.set(x>0?-1:1,y>2?-1:1,1);chassisDetail.add(brace);
    screw(chassisDetail,x+(x>0?-.052:.052),y+(y>2?-.052:.052),.884,'z',.022);
  }
  const wire=[];for(let i=0;i<75;i++)wire.push([-1.46+i*.039,.251,0,.007,.007,1.45]);for(let i=0;i<36;i++)wire.push([0,.252,-.71+i*.041,2.93,.007,.007]);batch(filter,cube,edge,wire);
  for(const z of [-.75,.75])box(filter,2.97,.023,.031,0,.249,z,rubber);box(filter,.15,.042,.28,1.56,.25,0,chassis);
  label(chassisDetail,'M3 / CAPTIVE',.4,.035,-1.24,.38,.956,'#9aafac');
  let amount=0;
  return {groups,get amount(){return amount;},update(dt,open,spread){
    amount=THREE.MathUtils.damp(amount,open?THREE.MathUtils.clamp(spread,0,1):0,8,dt);
    for(const {g,offset} of moving)g.position.copy(offset).multiplyScalar(amount);
    for(const g of internal)g.visible=open;
  }};
}

/** Purposefully arranged assemblies, in the same coordinate system as the base PC.
 * Repeated contacts, windings and fins are instanced rather than separate draw calls.
 * Cutaways are illustrative only; nothing here mutates repair or inventory state.
 */
function buildEngineeringDetail({pc,board,parts,materials,box,cylinder,ring,tube,label,screw,batch}) {
  const {chassis,edge,silver,gold,dark,pcbMat,chipMat,rubber,copper}=materials;
  const ceramic=new THREE.MeshStandardMaterial({color:0xc0aa72,roughness:.72});
  const winding=new THREE.MeshStandardMaterial({color:0xbf692d,metalness:.83,roughness:.3});
  const insulator=new THREE.MeshStandardMaterial({color:0xdbad4a,roughness:.68});
  const bluePlastic=new THREE.MeshStandardMaterial({color:0x306181,roughness:.66});
  const geometry=new THREE.BoxGeometry(1,1,1);
  const group=(parent,name)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
  const assemblies=[];
  function register(root,name){root.name=name;assemblies.push(root);return root;}

  // Rear I/O is modelled facing -X. Each socket has an open, four-sided shield,
  // an inset tongue and individual contacts; no solid box across the opening.
  const io=register(group(pc,'rear-io'),'rear-io');io.position.set(-1.765,3.19,-.41);io.rotation.y=-Math.PI/2;
  function port(x,y,w,h,kind){
    const z=.025;
    box(io,w+.024,.014,.095,x,y+h/2,z,silver);box(io,w+.024,.014,.095,x,y-h/2,z,silver);
    box(io,.014,h,.095,x-w/2,y,z,silver);box(io,.014,h,.095,x+w/2,y,z,silver);
    box(io,w,h,.008,x,y,-.026,dark);
    const tongue=kind==='LAN'?dark:kind==='USB'?bluePlastic:chipMat;
    box(io,w*.76,h*.24,.054,x,y-.008,.019,tongue);
    const count=kind==='LAN'?8:kind==='USB'?9:12;
    const contacts=[];for(let i=0;i<count;i++)contacts.push([x-w*.32+i*w*.64/(count-1),y+.008,.049,.008,.007,.032]);
    batch(io,geometry,gold,contacts);
    if(kind==='LAN'){
      box(io,.035,.016,.013,x-w*.36,y+h*.35,.077,insulator);
      box(io,.035,.016,.013,x+w*.36,y+h*.35,.077,new THREE.MeshStandardMaterial({color:0x91bd68,roughness:.5}));
      box(io,.05,.025,.038,x,y-h*.4,.05,dark);
    }
  }
  for(const x of [-.13,.13])for(const y of [.12,.36])port(x,y,.185,.105,'USB');
  port(-.12,-.12,.18,.08,'TYPE C');port(.12,-.15,.19,.2,'LAN');
  for(let i=0;i<3;i++){
    const x=-.15+i*.15;cylinder(io,.045,.048,x,-.43,.03,silver);
    cylinder(io,.032,.052,x,-.43,.042,[bluePlastic,insulator,rubber][i]);cylinder(io,.019,.055,x,-.43,.049,dark);
  }
  for(const x of [-.15,.15]){cylinder(io,.035,.12,x,.64,.03,gold);ring(io,.04,.006,x,.64,.09,gold);}
  label(io,'WIFI 6E',.28,.039,0,.75,.012,'#a9b9b8');
  label(io,'USB 3.2     10G',.4,.034,0,.5,.012,'#c8d6d0');
  label(io,'TYPE-C   2.5G LAN',.43,.034,0,-.3,.012,'#c8d6d0');
  label(io,'LINE / MIC / OUT',.43,.03,0,-.53,.012,'#b7c3bc');
  // Rear exhaust wire guard, vibration gaskets, bearing and rotor support.
  const exhaust=register(group(pc,'rear-exhaust'),'rear-exhaust');exhaust.position.set(-1.73,3.14,.4);exhaust.rotation.y=-Math.PI/2;
  cylinder(exhaust,.355,.035,0,0,0,dark);
  const rearRotor=group(exhaust,'exhaust-rotor');rearRotor.position.z=.025;
  const bladeShape=new THREE.Shape();bladeShape.moveTo(.035,.07);bladeShape.bezierCurveTo(.22,.02,.36,.08,.27,.22);bladeShape.lineTo(.09,.13);bladeShape.closePath();
  const bladeGeo=new THREE.ExtrudeGeometry(bladeShape,{depth:.012,bevelEnabled:false,curveSegments:8});
  for(let i=0;i<7;i++){const blade=new THREE.Mesh(bladeGeo,edge);blade.rotation.z=i*Math.PI*2/7;rearRotor.add(blade);}
  cylinder(exhaust,.077,.05,0,0,.035,silver);
  for(let r=.12;r<.36;r+=.049)ring(exhaust,r,.008,0,0,.075,silver);
  for(const angle of [0,Math.PI/2]){const brace=box(exhaust,.72,.015,.014,0,0,.082,edge);brace.rotation.z=angle;}
  for(const x of [-.34,.34])for(const y of [-.34,.34]){cylinder(exhaust,.04,.024,x,y,.026,rubber);screw(exhaust,x,y,.048);}
  // Expansion-slot stamped covers and display sockets attached to the GPU.
  const rearSlots=group(pc,'expansion-covers');rearSlots.position.x=-1.73;rearSlots.rotation.y=-Math.PI/2;
  const slots=[];for(let row=0;row<4;row++)for(let col=0;col<11;col++)slots.push([-.48+col*.084,1.22+row*.145,.012,.05,.067,.012]);
  batch(rearSlots,geometry,dark,slots);
  const gpuIO=group(parts.gpu,'display-connectors');gpuIO.position.set(-1.635,1.69,-.04);gpuIO.rotation.y=-Math.PI/2;
  for(let i=0;i<3;i++){
    const x=-.23+i*.23;box(gpuIO,.2,.095,.025,x,0,0,silver);box(gpuIO,.17,.065,.027,x,0,.017,dark);
    box(gpuIO,.13,.014,.028,x,0,.029,chipMat);
    const contacts=[];for(let p=0;p<19;p++)contacts.push([x-.065+p*.0072,.012,.047,.003,.007,.014]);batch(gpuIO,geometry,gold,contacts);
  }
  label(gpuIO,'DP      DP      HDMI',.62,.028,0,-.085,.033,'#c1cbd1');

  // Mainboard connectors: keyed shrouds, separate cavities and plated pins.
  const connectors=register(group(board,'board-connectors'),'board-connectors');
  function header(x,y,columns,rows,pitch,name){
    const w=columns*pitch+.032,h=rows*pitch+.032;
    box(connectors,w,h,.06,x,y,-.695,dark);
    const sockets=[],pins=[];
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const px=x+(col-(columns-1)/2)*pitch,py=y+(row-(rows-1)/2)*pitch;
      sockets.push([px,py,-.655,pitch*.7,pitch*.7,.022]);pins.push([px,py,-.634,.008,.008,.041]);
    }
    batch(connectors,geometry,edge,sockets);batch(connectors,geometry,gold,pins);
    box(connectors,w*.33,.024,.045,x,y-h/2,-.631,rubber);
    label(connectors,name,Math.max(w,.19),.026,x,y+h/2+.034,-.654,'#bec9b6');
  }
  header(.98,3.77,4,2,.058,'EPS 8P');header(.31,3.48,4,1,.035,'CPU FAN');
  header(.56,1.31,5,2,.038,'USB 2.0');header(.99,1.31,5,2,.038,'F PANEL');header(-1.18,1.31,5,2,.035,'HD AUDIO');
  const atx=group(board,'atx-24-contact-bank');
  const atxCavities=[],atxPins=[];
  for(let row=0;row<12;row++)for(let col=0;col<2;col++){
    atxCavities.push([1.095+col*.071,2.39+row*.035,-.173,.056,.029,.016]);
    atxPins.push([1.095+col*.071,2.39+row*.035,-.16,.014,.012,.016]);
  }
  batch(atx,geometry,edge,atxCavities);batch(atx,geometry,gold,atxPins);
  label(board,'ATX / 24 PIN',.3,.028,1.13,2.91,-.56,'#b5c7b2');
  // Plated audio-isolation seam and intentionally aligned RC filter network.
  tube(board,[[-1.4,1.34,-.741],[-1.4,2.07,-.741],[-1.17,2.17,-.741],[-1.17,2.44,-.741]],.004,gold,32);
  const ceramicParts=[],ceramicEnds=[];
  for(let row=0;row<5;row++)for(let col=0;col<8;col++){
    const x=-.74+col*.062,y=3.41+row*.033;
    ceramicParts.push([x,y,-.727,.033,.015,.015]);
    for(const dx of [-.019,.019])ceramicEnds.push([x+dx,y,-.726,.009,.016,.017]);
  }
  batch(board,geometry,ceramic,ceramicParts);batch(board,geometry,silver,ceramicEnds);
  // Spring-loaded PCIe latch and adjustable GPU anti-sag support.
  box(board,.105,.17,.13,1.07,1.89,-.53,edge);cylinder(board,.022,.15,1.07,1.96,-.52,silver,'x');
  const support=group(parts.gpu,'gpu-support');
  cylinder(support,.057,.25,1.11,1.3,.46,edge,'y');cylinder(support,.025,.16,1.11,1.48,.46,silver,'y');
  for(let i=0;i<9;i++)ring(support,.029,.006,1.11,1.42+i*.014,.46,silver,'y');
  box(support,.21,.033,.18,1.11,1.58,.46,rubber);box(support,.3,.024,.29,1.11,1.175,.46,dark);

  // The cold plate and impeller are visible in the non-destructive cutaway.
  const pump=register(group(parts.cpu,'pump-internals'),'pump-internals');
  cylinder(pump,.315,.029,-.36,2.97,-.53,copper);ring(pump,.301,.016,-.36,2.97,-.495,rubber);
  const microfins=[];for(let i=0;i<49;i++)microfins.push([-.596+i*.0098,2.97,-.486,.004,.36,.049]);batch(pump,geometry,winding,microfins);
  const impeller=group(pump,'pump-impeller');impeller.position.set(-.36,2.97,-.422);
  cylinder(impeller,.115,.025,0,0,0,dark);cylinder(impeller,.045,.051,0,0,.02,silver);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,blade=box(impeller,.024,.15,.019,Math.sin(angle)*.16,Math.cos(angle)*.16,0,edge);blade.rotation.z=-angle+.38;
  }
  ring(pump,.273,.021,-.36,2.97,-.418,edge);
  const threadRings=[];for(const x of [-.36,-.18])for(let i=0;i<7;i++)threadRings.push([x,3.275+i*.012,-.24,1,1,1,Math.PI/2,0,0]);
  batch(parts.cpu,new THREE.TorusGeometry(.077,.004,5,24),silver,threadRings);
  // Brazed serpentine radiator fins between longitudinal coolant channels.
  const radiator=register(group(parts.cpu,'radiator-brazing'),'radiator-brazing');
  const finSegments=[];for(let i=0;i<54;i++)for(let j=0;j<18;j++){
    finSegments.push([-1.305+i*.046,3.986,-.57+j*.06,.004,.068,.072, j%2?.42:-.42,0,0]);
  }
  batch(radiator,geometry,silver,finSegments);
  for(const z of [-.65,.57])box(radiator,2.67,.18,.053,-.09,3.98,z,edge);
  for(const x of [-1.4,1.24])for(const z of [-.58,.5])screw(radiator,x,4.08,z,'y',.029);

  // PSU internals: primary reservoir capacitor, transformer, wound inductors,
  // secondary filtering and modular daughterboard. A visual model, not wiring advice.
  const psu=register(group(parts.psu,'psu-internals'),'psu-internals');
  box(psu,1.88,.047,1.37,-.59,.31,-.035,pcbMat);
  for(const x of [-1.44,.26])for(const z of [-.61,.55]){cylinder(psu,.033,.05,x,.35,z,gold,'y');screw(psu,x,.385,z,'y',.021);}
  const caps=[];
  function capacitor(x,z,r,h){
    cylinder(psu,r,h,x,.36+h/2,z,dark,'y');cylinder(psu,r*.92,.014,x,.36+h,z,silver,'y');
    box(psu,r*1.4,.008,.008,x,.371+h,z,edge);box(psu,.008,.008,r*1.4,x,.371+h,z,edge);
    const stripe=box(psu,.018,h*.8,.008,x,.36+h/2,z+r,rubber);stripe.material=ceramic;
    for(const dx of [-r*.4,r*.4])caps.push([x+dx,.348,z,.012,.055,.012]);
  }
  capacitor(-1.12,-.34,.15,.46);capacitor(-.79,-.34,.13,.41);
  for(let i=0;i<6;i++)capacitor(-.04+(i%2)*.18,-.42+Math.floor(i/2)*.21,.06,.2);
  batch(psu,geometry,silver,caps);
  const transformer=group(psu,'llc-transformer');
  box(transformer,.44,.24,.33,-.68,.49,.21,dark);box(transformer,.34,.25,.24,-.68,.5,.21,insulator);
  box(transformer,.095,.28,.34,-.68,.5,.21,chassis);
  label(transformer,'LLC / T1',.25,.048,-.68,.53,.386,'#5b471e');
  const toroids=[];
  for(const [x,z,r] of [[-1.17,.27,.13],[-.29,.31,.1]]){
    ring(psu,r,.04,x,.49,z,insulator,'y');
    for(let i=0;i<28;i++){
      const a=i*Math.PI*2/28;toroids.push([x+Math.cos(a)*r,.49,z+Math.sin(a)*r,1,1,1,0,-a,0]);
    }
  }
  batch(psu,new THREE.TorusGeometry(.044,.009,6,12),winding,toroids);
  const fins=[];
  for(const x of [-.48,-1.35]){
    box(psu,.056,.035,1.1,x,.38,-.02,silver);
    for(let i=0;i<15;i++)fins.push([x,.51,-.52+i*.071,.17,.25,.012]);
  }
  batch(psu,geometry,silver,fins);
  box(psu,.034,.4,1.12,.27,.55,-.04,pcbMat);
  for(let i=0;i<4;i++){box(psu,.13,.15,.19,.31,.59,-.44+i*.26,dark);box(psu,.008,.1,.14,.382,.59,-.44+i*.26,edge);}
  // Fuse glass body and capped terminals, safe behind the illustrative cover.
  cylinder(psu,.032,.25,-1.36,.42,-.35,silver,'z');cylinder(psu,.035,.17,-1.36,.42,-.35,new THREE.MeshPhysicalMaterial({color:0xc7ddd9,transparent:true,opacity:.35,roughness:.15}),'z');
  const psuTracks=[];
  for(let i=0;i<24;i++)psuTracks.push([-1.4+i*.069,.338,.48,.014,.008,.14+(i%4)*.11]);
  batch(psu,geometry,gold,psuTracks);
  label(psu,'ILLUSTRATIVE CUTAWAY — NOT A SERVICE GUIDE',1.7,.052,-.6,.34,.653,'#dcc58c');
  psu.visible=false;pump.visible=false;

  // Behind the motherboard tray: combed EPS/ATX harness, tie-down saddles,
  // rubber grommets and a controller with individually terminated fan leads.
  const harness=register(group(pc,'rear-harness'),'rear-harness');
  for(let i=0;i<16;i++){
    const x=.93+i*.024;
    tube(harness,[[x,.43,-1.01],[x,1.28,-1.07],[x-.18,2.05,-1.08],[x-.12,3.11,-1.04],[x-.38,3.75,-.97]],.01,i%4===0?edge:rubber,28);
  }
  for(let i=0;i<8;i++)tube(harness,[[-.7+i*.025,.52,-1.01],[-.7+i*.025,1.48,-1.1],[-.63+i*.025,2.7,-1.1],[-.81+i*.025,3.68,-1.02]],.012,rubber,30);
  for(const y of [1.36,2.17,3.08])for(const x of [-.62,1.03]){
    box(harness,.39,.058,.019,x,y,-1.125,edge);box(harness,.047,.094,.026,x+.17,y,-1.146,dark);
  }
  const hub=group(harness,'pwm-controller');box(hub,.59,.78,.072,-.15,2.15,-1.02,chassis);
  const hubPrint=label(hub,'PWM / ARGB',.46,.048,-.15,2.15,-1.063,'#b5d4d0');hubPrint.rotation.y=Math.PI;
  for(let i=0;i<4;i++){
    box(hub,.1,.091,.042,.16,1.88+i*.17,-1.03,dark);
    tube(hub,[[.2,1.88+i*.17,-1.04],[.37,1.89+i*.17,-1.12],[.48,2.5+i*.18,-1.1],[1.49,2.6+i*.21,-1.01]],.012,rubber,24);
  }
  // Rivets are arranged on structural seams, not scattered through components.
  const rivets=[];for(const x of [-1.61,1.61])for(let i=0;i<13;i++)rivets.push([x,.4+i*.292,-.949,1,1,1]);
  batch(harness,new THREE.SphereGeometry(.017,8,6),silver,rivets);
  const serial=label(harness,'CHASSIS RR-026 / CABLE MANAGEMENT',1.35,.056,0,3.94,-.956,'#829fa6');serial.rotation.y=Math.PI;

  return {
    assemblies,
    update(dt,{cutaway,explosion,powered}){
      psu.visible=pump.visible=cutaway||explosion>.08;
      if(powered){rearRotor.rotation.z-=dt*11;impeller.rotation.z+=dt*16;}
    }
  };
}
