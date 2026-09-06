/* Device-specific, touch-first service tasks. No backend or real hardware access. */
(() => {
  'use strict';
  const names={cpu:'サーマルグリスの均一塗布',ram:'デュアルチャネルの装着',gpu:'VRAMサーマルパッドの配置',ssd:'起動パーティションの移行',psu:'交換用電源の電圧確認',fan:'温度別ファンカーブの調整'};
  const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));
  const score={paste:(coverage,spill)=>clamp(coverage-spill*30),mistakes:n=>clamp(100-n*12),curve:values=>clamp(100-values.reduce((s,v,i)=>s+Math.abs(v-[25,50,80,100][i]),0)/2)};
  function mount(root,key,{complete,cancel}){
    let disposed=false,mistakes=0,ready=false,grade=0;const abort=new AbortController();
    const $=s=>root.querySelector(s);
    const click=(selector,fn)=>root.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>{if(!disposed)fn(el);},{signal:abort.signal}));
    root.className='microbench';
    root.innerHTML='<div class="micro-meta"><span>PRECISION LAB / '+key.toUpperCase()+'</span><strong id="micro-grade">0%</strong></div><div id="micro-task"></div><div class="micro-progress"><i id="micro-fill" style="width:0%"></i></div><p class="micro-status" id="micro-status" aria-live="polite">部品を傷つけないよう、落ち着いて作業しましょう。</p><div class="micro-actions"><button class="secondary-button" id="micro-cancel">作業方法を選び直す</button><button class="primary-button" id="micro-finish" disabled>整備を完了する</button></div><p class="small-note">85%以上で納品 +¥800、60%以上で +¥400。通常修理と所要時間・部品消費は同じです。<br>ゲーム用の簡略化された作業です。実機の修理手順ではありません。</p>';
    const task=$('#micro-task');
    function status(text,error=false){$('#micro-status').textContent=text;$('#micro-status').classList.toggle('error',error);}
    function update(value,canFinish,progress=value){grade=clamp(value);ready=canFinish;$('#micro-grade').textContent=grade+'%';$('#micro-fill').style.width=clamp(progress)+'%';$('#micro-finish').disabled=!canFinish;}
    function mistake(text){mistakes++;status(text+' 精度 −12。',true);}
    click('#micro-cancel',()=>cancel());
    click('#micro-finish',()=>{if(!ready||disposed)return;disposed=true;complete(grade,names[key]);});
    if(key==='cpu'){
      task.innerHTML='<p class="micro-instructions">指でなぞり、銀色のヒートスプレッダを<strong>薄く均一に</strong>覆いましょう。緑色の基板にはみ出すと減点。塗布率85%以上を目指します。</p><canvas class="micro-canvas" id="paste-canvas" width="400" height="320" aria-label="指でなぞってCPU上にグリスを塗布する"></canvas><button class="secondary-button wide-button" id="paste-reset">塗布をやり直す</button>';
      const c=$('#paste-canvas'),ctx=c.getContext('2d'),paint=document.createElement('canvas');paint.width=400;paint.height=320;const p=paint.getContext('2d');
      const cells=new Set();let strokes=0,spills=0,drawing=false,last=null;
      const bounds={x:90,y:50,w:220,h:220};
      function render(){
        ctx.fillStyle='#18362a';ctx.fillRect(0,0,400,320);ctx.strokeStyle='#49785b';ctx.lineWidth=1;
        for(let i=0;i<22;i++){ctx.beginPath();ctx.moveTo(0,i*16);ctx.lineTo(55+i%4*5,i*16);ctx.lineTo(70+i%4*5,i*16+18);ctx.stroke();ctx.beginPath();ctx.moveTo(400,i*16);ctx.lineTo(350-i%4*5,i*16);ctx.lineTo(335-i%4*5,i*16+18);ctx.stroke();}
        ctx.fillStyle='#917943';for(let i=0;i<22;i++){ctx.fillRect(76,51+i*10,9,5);ctx.fillRect(315,51+i*10,9,5);ctx.fillRect(93+i*10,35,5,9);ctx.fillRect(93+i*10,276,5,9);}
        ctx.fillStyle='#465e52';ctx.fillRect(85,45,230,230);const grad=ctx.createLinearGradient(90,50,310,270);grad.addColorStop(0,'#cbd2d0');grad.addColorStop(.4,'#829693');grad.addColorStop(.55,'#b7c6c3');grad.addColorStop(1,'#718580');ctx.fillStyle=grad;ctx.fillRect(90,50,220,220);
        ctx.strokeStyle='#d9e4d3';ctx.setLineDash([5,5]);ctx.strokeRect(100,60,200,200);ctx.setLineDash([]);ctx.fillStyle='#4d6660';ctx.font='bold 19px monospace';ctx.textAlign='center';ctx.fillText('AMD RYZEN',200,155);ctx.font='11px monospace';ctx.fillText('AM5 / HEAT SPREADER',200,177);
        ctx.drawImage(paint,0,0);ctx.fillStyle='#a4c3a5';ctx.font='9px monospace';ctx.fillText('ESD SAFE     /     EVEN COVERAGE',200,305);
      }
      function mark(x,y){strokes++;if(x<bounds.x||x>bounds.x+bounds.w||y<bounds.y||y>bounds.y+bounds.h)spills++;
        p.fillStyle='rgba(191,198,210,.85)';p.beginPath();p.arc(x,y,17,0,Math.PI*2);p.fill();
        for(let iy=0;iy<18;iy++)for(let ix=0;ix<18;ix++){const xx=90+(ix+.5)*220/18,yy=50+(iy+.5)*220/18;if(Math.hypot(x-xx,y-yy)<18)cells.add(iy*18+ix);}
      }
      function point(e){const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*400,y:(e.clientY-r.top)/r.height*320};}
      function draw(e){const pt=point(e);if(last){const distance=Math.hypot(pt.x-last.x,pt.y-last.y),n=Math.max(1,Math.ceil(distance/5));for(let i=1;i<=n;i++)mark(last.x+(pt.x-last.x)*i/n,last.y+(pt.y-last.y)*i/n);}else mark(pt.x,pt.y);last=pt;render();const cover=cells.size/324*100;update(score.paste(cover,spills/Math.max(1,strokes)),cover>=30,cover);status(`塗布率 ${Math.round(cover)}% / はみ出し ${Math.round(spills/Math.max(1,strokes)*100)}%`);}
      c.addEventListener('pointerdown',e=>{if(disposed)return;e.preventDefault();drawing=true;last=null;c.setPointerCapture(e.pointerId);draw(e);},{signal:abort.signal});
      c.addEventListener('pointermove',e=>{if(drawing&&!disposed)draw(e);},{signal:abort.signal});
      for(const name of ['pointerup','pointercancel'])c.addEventListener(name,()=>{drawing=false;last=null;},{signal:abort.signal});
      click('#paste-reset',()=>{cells.clear();strokes=spills=0;p.clearRect(0,0,400,320);render();update(0,false);status('新しい塗布面でやり直せます。');});render();
    }
    if(key==='gpu'){
      const thickness=[1,1.5,1,1.5,1,1.5];let selected=1;const placed=new Set();
      task.innerHTML='<p class="micro-instructions">交換用GPUの放熱部を整えます。パッドの厚みを選び、<strong>表示と同じ厚み</strong>を各VRAMへ配置。薄すぎても厚すぎても密着しません。</p><div class="micro-kit">'+[.5,1,1.5].map(n=>`<button data-pad-size="${n}" class="${n===1?'selected':''}">${n.toFixed(1)} mm</button>`).join('')+'</div><div class="micro-pcb"><div class="gpu-pad-layout"><div class="gpu-die">AD104<br>GPU DIE</div>'+thickness.map((n,i)=>`<button class="gpu-pad-target" data-pad-index="${i}"><span>VRAM ${i+1}</span><strong>${n.toFixed(1)} mm</strong></button>`).join('')+'</div></div>';
      click('[data-pad-size]',el=>{selected=Number(el.dataset.padSize);root.querySelectorAll('[data-pad-size]').forEach(b=>b.classList.toggle('selected',b===el));});
      click('[data-pad-index]',el=>{const index=Number(el.dataset.padIndex);if(placed.has(index))return;if(selected!==thickness[index])mistake('厚みが違います。モジュールの指定値を確認してください。');else{placed.add(index);el.classList.add('filled');el.disabled=true;status(`VRAM ${index+1} に ${selected.toFixed(1)}mm を配置。 ${placed.size}/6 完了。`);}update(score.mistakes(mistakes),placed.size===6,placed.size/6*100);});
    }
    if(key==='ram'){
      const installed=new Set(),locked=new Set();
      task.innerHTML='<p class="micro-instructions">同容量のメモリ2枚を<strong>A2 と B2</strong>に装着します。装着後、左右の保持ラッチを閉じてデュアルチャネルを確定してください。</p><div class="micro-pcb"><div class="micro-dimms">'+['A1','A2','B1','B2'].map(x=>`<button class="micro-dimm" data-dimm="${x}"><span>${x}</span><span>DDR5</span></button>`).join('')+'</div><div class="latch-row"><button data-latch="A2">A2 ラッチを固定</button><button data-latch="B2">B2 ラッチを固定</button></div></div>';
      click('[data-dimm]',el=>{const slot=el.dataset.dimm;if(slot!=='A2'&&slot!=='B2')mistake('この基板ではA2/B2を優先します。');else if(!installed.has(slot)){installed.add(slot);el.classList.add('installed');el.disabled=true;status(slot+' に16GB DIMMを装着しました。');}update(score.mistakes(mistakes),locked.size===2,(installed.size+locked.size)/4*100);});
      click('[data-latch]',el=>{const slot=el.dataset.latch;if(!installed.has(slot)){status('先に '+slot+' にメモリを装着してください。',true);return;}locked.add(slot);el.classList.add('locked');el.textContent=slot+' LOCKED ✓';el.disabled=true;update(score.mistakes(mistakes),locked.size===2,(installed.size+locked.size)/4*100);if(locked.size===2)status('32GB / DUAL CHANNEL / 両側ラッチ固定完了。');});
    }
    if(key==='ssd'){
      const sectors=[['EFI','260 MB'],['SYSTEM','480 GB'],['DATA','450 GB'],['RECOVERY','1 GB']],order=[2,0,3,1];let selected=null;const mapped=new Set();
      task.innerHTML='<p class="micro-instructions">バックアップ済みの起動構成を新SSDへ復元します。左の区画を選び、右の<strong>同じ名前の復元先</strong>をタップ。4つを正しく対応させます。</p><div class="micro-pcb"><div class="sector-grid"><div class="sector-column"><small>BACKUP SOURCE</small>'+sectors.map(([name,size],i)=>`<button class="sector-tile" data-source="${i}"><strong>${name}</strong><small>${size} / CRC OK</small></button>`).join('')+'</div><div class="sector-column"><small>NEW NVMe / GPT</small>'+order.map(i=>`<button class="sector-tile" data-destination="${i}"><strong>${sectors[i][0]}</strong><small>割り当て待ち</small></button>`).join('')+'</div></div></div>';
      click('[data-source]',el=>{const value=Number(el.dataset.source);if(mapped.has(value))return;selected=value;root.querySelectorAll('[data-source]').forEach(b=>b.classList.toggle('selected',b===el));});
      click('[data-destination]',el=>{const value=Number(el.dataset.destination);if(selected===null){status('先に左側のバックアップ区画を選んでください。',true);return;}if(selected!==value)mistake('区画の名前が一致していません。');else{mapped.add(value);el.classList.add('mapped');el.disabled=true;el.querySelector('small').textContent='VERIFIED ✓';const src=$(`[data-source="${value}"]`);src.disabled=true;src.classList.add('mapped');src.classList.remove('selected');selected=null;status(`${mapped.size}/4 区画の整合性を確認しました。`);}update(score.mistakes(mistakes),mapped.size===4,mapped.size/4*100);});
    }
    if(key==='psu'){
      let grounded=false,index=0;const sequence=['12V','5V','3.3V'],readings=['12.02','5.01','3.31'];
      task.innerHTML='<p class="micro-instructions">これは<strong>ゲーム内の低電圧テスター</strong>です。まずGNDに基準を取り、12V → 5V → 3.3Vの順に測定。現実の電源ケースは開けないでください。</p><div class="micro-pcb"><div class="multimeter-display"><small>DC VOLTAGE / ISOLATED BENCH</small><strong id="meter-value">—.— <small>V</small></strong></div><div class="probe-pins">'+['GND','12V','5V','3.3V'].map(v=>`<button data-probe="${v}">${v}</button>`).join('')+'</div><div class="rail-checks">'+sequence.map(v=>`<span data-rail="${v}">${v} / 未測定</span>`).join('')+'</div></div>';
      click('[data-probe]',el=>{const pin=el.dataset.probe;if(pin==='GND'){grounded=true;el.classList.add('connected');status('基準電位を確保。12Vを測定してください。');return;}if(!grounded){status('まずGNDへ接続してください。',true);return;}if(index>=3)return;if(pin!==sequence[index])mistake('測定順序を確認してください。次は '+sequence[index]+' です。');else{$('#meter-value').innerHTML=readings[index]+' <small>V</small>';el.classList.add('connected');el.disabled=true;const rail=$(`[data-rail="${pin}"]`);rail.textContent=pin+' / PASS';rail.classList.add('checked');index++;status(index===3?'全3系統が許容範囲内。交換用電源の確認が完了しました。':'次は '+sequence[index]+' を測定してください。');}update(score.mistakes(mistakes),index===3,index/3*100);});
    }
    if(key==='fan'){
      const values=[30,30,30,30],temperatures=[35,55,75,90],targets=[25,50,80,100];
      task.innerHTML='<p class="micro-instructions">静音性と冷却能力を両立するファンカーブを設定。<strong>温度が上がるほど回転率を高く</strong>し、下の推奨値へ合わせてください。</p><div class="micro-pcb"><div class="fan-curve-chart"><svg viewBox="0 0 320 160" aria-label="ファンカーブ"><polyline id="fan-polyline" fill="none" stroke="#beef62" stroke-width="3"/><g id="fan-points" fill="#d3ffa9"></g></svg></div>'+temperatures.map((t,i)=>`<div class="fan-curve-row"><label for="curve-${i}">${t}°C</label><input id="curve-${i}" data-curve="${i}" type="range" min="20" max="100" step="5" value="30" aria-label="${t}度での回転率"><output for="curve-${i}">30%</output></div>`).join('')+'<p class="curve-reference">推奨：35°C → 25% / 55°C → 50%<br>75°C → 80% / 90°C → 100%</p></div>';
      function curve(){const points=values.map((v,i)=>`${i*100+10},${155-v*1.4}`);$('#fan-polyline').setAttribute('points',points.join(' '));$('#fan-points').innerHTML=points.map(p=>{const [x,y]=p.split(',');return `<circle cx="${x}" cy="${y}" r="4"/>`;}).join('');const monotonic=values.every((v,i)=>i===0||v>=values[i-1]);update(score.curve(values),monotonic);status(monotonic?'設定値を推奨カーブへ近づけると精度が上がります。':'高温域の回転率が低温域を下回らないようにしてください。',!monotonic);}
      root.querySelectorAll('[data-curve]').forEach(input=>input.addEventListener('input',()=>{values[Number(input.dataset.curve)]=Number(input.value);input.nextElementSibling.textContent=input.value+'%';curve();},{signal:abort.signal}));curve();
    }
    return ()=>{disposed=true;abort.abort();};
  }
  window.RigMicrobench={mount,names,score};
})();
