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
  label(parts.ssd,'S/N: RR-980-26A017',.57,.024,-.84,2.092,-.588,'#9baaac');
  // Detailed rear socket housing, ethernet pins and shield seams.
  const io=new THREE.Group();pc.add(io);
  for(let k=0;k<4;k++){box(io,.035,.145,.28,-1.756,3.09+k*.18,-.36,silver);box(io,.039,.089,.216,-1.778,3.09+k*.18,-.36,dark);}
  for(let k=0;k<8;k++)box(io,.041,.009,.013,-1.788,3.645,-.45+k*.025,gold);
  // ARGB diodes around each front intake ring; diffusers remain separate.
  const leds=[];const rgbMaterials=[];
  for(let f=0;f<3;f++){
    const m=new THREE.MeshStandardMaterial({color:0xc9e9ff,emissive:new THREE.Color().setHSL(.51+f*.1,.85,.52),emissiveIntensity:3,roughness:.3});rgbMaterials.push(m);
    const points=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;points.push([2.012,.98+f*1.17+Math.sin(a)*.45,Math.cos(a)*.45,.012,.018,.018]);}leds.push(batch(parts.fan,new THREE.BoxGeometry(1,1,1),m,points));
  }
  // Pump fittings have actual collars, threads and compression knurling.
  for(let n=0;n<2;n++)for(let i=0;i<10;i++){const a=i/10*Math.PI*2;box(parts.cpu,.012,.065,.012,-.36+n*.18+Math.cos(a)*.081,3.28,-.24+Math.sin(a)*.081,edge);}
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
  function update(dt,t,{exploded,heat,job}){
    explosion=THREE.MathUtils.damp(explosion,exploded?1:0,5,dt);thermal=heat;
    for(const key of Object.keys(parts)){const a=offsets[key];parts[key].position.set(a[0]*explosion,a[1]*explosion,a[2]*explosion);}
    gpuBoard.visible=explosion>.08;gpuBoard.position.set(0,explosion*.8,explosion*.2);pads.position.z=explosion*.18;
    processor.position.z=-.589+explosion*.08;
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
  return {update,offsets,origins,instances,setRGB(mode){rgbMode=mode;},get explosion(){return explosion;}};
}
