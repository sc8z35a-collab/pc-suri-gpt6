/* These tests exercise the production engine and production UI without saves. */
(async () => {
  'use strict';
  const { RepairGame, initialState, PARTS, CATALOG } = window.RepairCore;
  let passed = 0, failed = 0;
  const results = document.getElementById('results');
  const assert = (value, label) => { if (!value) throw new Error(label || 'Assertion failed'); };
  const eq = (a,b) => assert(a === b, `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  const throws = fn => { let thrown = false; try { fn(); } catch (_) { thrown = true; } assert(thrown, 'Expected operation to be rejected'); };
  function test(name, fn) { try { fn(); passed++; results.textContent += `PASS ${name}\n`; console.info('PASS ' + name); } catch (e) { failed++; results.textContent += `FAIL ${name}: ${e.message}\n`; console.error('FAIL ' + name + ': ' + e.message); } }
  const complete = (g, precision = 0) => { g.diagnose(); g.panel(); g.repair('cpu', false, precision); g.clean(); g.panel(); g.test(); return g.deliver(); };
  test('Initial capital, starter inventory and first job', () => { const g = new RepairGame(); eq(g.state.cash,32000); eq(g.state.minute,540); eq(g.active.id,'0042'); eq(g.state.inventory.paste,2); });
  test('Full diagnostic detects CPU fault and consumes 40 minutes', () => { const g = new RepairGame(); eq(g.diagnose().join(','),'cpu'); eq(g.state.minute,580); eq(g.active.diagnosed.length,6); });
  test('Cannot repair behind closed glass; no resource loss', () => { const g = new RepairGame(); g.diagnose(); const before = JSON.stringify(g.state); throws(() => g.repair('cpu')); eq(JSON.stringify(g.state),before); });
  test('Undiagnosed part cannot be replaced', () => { const g = new RepairGame(); g.panel(); throws(() => g.repair('cpu')); });
  test('Healthy part cannot be replaced', () => { const g = new RepairGame(); g.diagnose(); g.panel(); throws(() => g.repair('ram')); eq(g.state.inventory.ram,1); });
  test('Unrepaired PC fails benchmark', () => { const g = new RepairGame(); eq(g.test().pass,false); throws(() => g.deliver()); });
  test('Open chassis cannot run benchmark', () => { const g = new RepairGame(); g.panel(); throws(() => g.test()); });
  test('Full repair, clean, test, payment and precision bonus', () => { const g = new RepairGame(); const r = complete(g,100); eq(r.total,9800); eq(g.state.cash,41800); eq(g.state.minute,670); eq(g.state.inventory.paste,1); eq(g.state.rep,4.32); eq(g.state.completed,1); eq(g.state.active,null); });
  test('Double delivery cannot mint additional money', () => { const g = new RepairGame(); complete(g); throws(() => g.deliver()); eq(g.state.cash,41000); });
  test('Unavailable stock does not consume time', () => { const g = new RepairGame(); g.diagnose(); g.panel(); g.state.inventory.paste=0; const minute=g.state.minute; throws(() => g.repair('cpu')); eq(g.state.minute,minute); });
  test('Standard automatic repair earns no precision bonus', () => { const g = new RepairGame(); const r=complete(g); eq(r.precisionBonus,0); eq(r.total,9000); });
  test('Good precision earns exactly 400 yen', () => { const g = new RepairGame(); const r=complete(g,70); eq(r.precisionBonus,400); });
  test('Premium stock costs 35% extra and earns 2000 yen bonus', () => { const g = new RepairGame(); g.buy('paste',true); eq(g.state.cash,30920); g.diagnose(); g.panel(); g.repair('cpu',true); g.panel(); g.test(); const r=g.deliver(); eq(r.premiumBonus,2000); eq(r.total,10500); eq(g.state.premiumStock.paste,0); });
  test('Rent, daily report, next day and carried-over job', () => { const g = new RepairGame(); g.diagnose(); const r=g.closeDay(); eq(r.expenses,1800); eq(r.profit,-1800); eq(g.state.cash,30200); eq(g.state.day,2); eq(g.state.minute,540); eq(g.active.diagnosed.length,6); });
  test('Late delivery penalty is 15% per day, capped at 60%', () => { const g = new RepairGame(); g.state.day=4; eq(g.quote().penalty,1275); g.state.day=30; eq(g.quote().penalty,5100); });
  test('Supplier upgrade gives permanent 10% discount', () => { const g = new RepairGame(); g.upgrade('supplier'); eq(g.price('paste'),720); eq(g.price('paste',true),972); throws(() => g.upgrade('supplier')); });
  test('Diagnostic equipment reduces full diagnostic to 15 minutes', () => { const g = new RepairGame(); g.upgrade('diagnostic'); g.diagnose(); eq(g.state.minute,555); });
  test('Precision tool upgrade reduces repair to 20 minutes', () => { const g = new RepairGame(); g.upgrade('bench'); g.diagnose(); g.panel(); const t=g.state.minute; g.repair('cpu'); eq(g.state.minute-t,20); });
  test('Unaffordable purchase is atomic', () => { const g = new RepairGame(); g.state.cash=100; const before=JSON.stringify(g.state); throws(() => g.buy('gpu')); eq(JSON.stringify(g.state),before); });
  test('Out-of-hours actions are rejected without consuming stock', () => { const g = new RepairGame(); g.state.minute=1080; throws(() => g.buy('paste')); throws(() => g.diagnose()); eq(g.state.inventory.paste,2); });
  test('Cannot close with insufficient funds', () => { const g = new RepairGame(); g.state.cash=100; throws(() => g.closeDay()); eq(g.state.day,1); });
  test('Loans enforce 30000 limit and 1% daily interest', () => { const g = new RepairGame(); g.loan(); g.loan(); g.loan(); throws(() => g.loan()); const r=g.closeDay(); eq(r.interest,300); eq(g.state.debt,30000); eq(g.state.cash,59900); g.repay(); eq(g.state.debt,20000); });
  test('Inventory resale recovers 60% and cannot go negative', () => { const g = new RepairGame(); const amount=g.sell('ram'); eq(amount,3720); eq(g.state.inventory.ram,0); throws(() => g.sell('ram')); });
  test('Daily cash totals remain correct after ledger truncation', () => { const g = new RepairGame(); for(let i=0;i<90;i++)g.transaction('入金',100); for(let i=0;i<90;i++)g.transaction('支出',-50); const r=g.closeDay(); eq(g.state.ledger.length,60); eq(r.otherIncome,9000); eq(r.expenses,6300); eq(r.profit,2700); eq(g.state.cash,34700); });
  test('All six hardware fault types can be repaired', () => { for(const key of Object.keys(PARTS)) { const g=new RepairGame(); g.active.faults=[key]; g.state.inventory[PARTS[key].fix]=1; g.diagnose(); g.panel(); g.repair(key); g.panel(); eq(g.test().pass,true); g.deliver(); eq(g.state.completed,1); } });
  test('Compound faults require every failed part to be repaired', () => { const g=new RepairGame(); g.active.faults=['cpu','ram']; g.diagnose(); g.panel(); g.repair('cpu'); g.panel(); eq(g.test().pass,false); g.panel(); g.repair('ram'); g.panel(); eq(g.test().pass,true); });
  test('New orders require an empty workbench', () => { const g=new RepairGame(); throws(() => g.accept(g.offers()[0].key)); complete(g); const offer=g.offers()[0]; g.accept(offer.key); eq(g.active.reward,offer.reward); assert(!g.offers().some(o => o.key===offer.key)); });
  test('Higher reputation increases newly quoted rewards', () => { const g=new RepairGame(); g.state.rep=1; const low=g.offers()[0].reward; g.state.rep=5; assert(g.offers()[0].reward>low); });
  test('Third completion unlocks GPU and compound repair orders', () => { const g=new RepairGame(); g.state.completed=3; eq(g.level,2); const offers=g.offers(); assert(offers.some(o=>o.faults.includes('gpu'))); assert(offers.some(o=>o.faults.length>1)); });
  test('Reopening the case invalidates final benchmark', () => { const g=new RepairGame(); g.diagnose(); g.panel(); g.repair('cpu'); g.panel(); g.test(); eq(g.active.tested,true); g.panel(); eq(g.active.tested,false); eq(g.active.powered,false); });
  test('JSON round-trip preserves progress and isolates copies', () => { const g=new RepairGame(); complete(g); const copy=new RepairGame(JSON.parse(JSON.stringify(g.state))); eq(copy.state.cash,g.state.cash); eq(copy.state.completed,1); copy.state.cash++; assert(copy.state.cash!==g.state.cash); });
  test('Diagnostic readings remain unknown until inspection',()=>{const g=new RepairGame();assert(g.readings('cpu').every(r=>r.value==='未測定'));g.diagnose('cpu');eq(g.readings('cpu')[0].value,'98°C');g.panel();g.repair('cpu');eq(g.readings('cpu')[0].value,'38°C');});
  test('Service records preserve technique and precision',()=>{const g=new RepairGame();g.diagnose();g.panel();g.repair('cpu',false,92,'手動グリス塗布');const log=g.active.serviceLog.at(-1);eq(log.part,'cpu');assert(log.details.includes('92%'));assert(log.details.includes('手動グリス塗布'));});
  test('Delivery archives the complete service record',()=>{const g=new RepairGame();complete(g,100);eq(g.state.serviceArchives.length,1);eq(g.state.serviceArchives[0].records.at(-1).action,'お客様へ納品');eq(g.state.serviceArchives[0].total,9800);});
  test('Legacy saves without service logs are still compatible',()=>{const saved=initialState();delete saved.serviceArchives;delete saved.active.serviceLog;const g=new RepairGame(saved);complete(g);eq(g.state.serviceArchives[0].records.length,7);});
  const waitFor = async (fn, timeout=30000) => { const start=Date.now(); while (!fn()) { if(Date.now()-start>timeout)throw new Error('UI wait timed out'); await new Promise(r=>setTimeout(r,70)); } };
  try {
    const frame=document.getElementById('test-app');
    await waitFor(()=>frame.contentWindow?.RigGame,60000);
    const w=frame.contentWindow,d=frame.contentDocument,g=w.RigGame.game;
    g.state.settings.sound=false;
    const click=selector=>{const el=d.querySelector(selector);assert(el,'Missing UI control '+selector);assert(!el.disabled,'Disabled control '+selector);el.click();};
    test('UI: full diagnosis updates state and status cards',()=>{click('#tool-inspect');click('[data-action="diagnose-all"]');eq(g.active.diagnosed.length,6);assert(d.getElementById('modal-content').textContent.includes('要修理'));});
    test('UI: safe panel removal routes to repair selection',()=>{click('#modal-close');click('#tool-repair');click('[data-action="panel-then-repair"]');eq(g.active.panelOpen,true);assert(d.querySelector('[data-action="repair"]'));});
    test('UI: precision task does not consume stock before completion',()=>{click('[data-action="repair"]');eq(g.state.inventory.paste,2);assert(d.querySelector('.precision-board'));});
    test('UI: incorrect screw sequence is rejected',()=>{click('[data-action="screw"][data-key="3"]');eq(d.getElementById('screw-progress').textContent,'0 / 4 RELEASED');});
    test('UI: four screw taps open the timing challenge',()=>{for(let n=1;n<=4;n++)click(`[data-action="screw"][data-key="${n}"]`);assert(d.getElementById('timing-track'));});
    test('UI: precision score uses visible needle position and repairs once',()=>{const needle=d.getElementById('timing-needle');needle.style.animation='none';needle.style.left='50%';click('[data-action="precision-stop"]');eq(g.state.inventory.paste,1);eq(g.active.precisionBonus,800);assert(g.active.repaired.includes('cpu'));});
    test('UI: cleanup and refitting prepare the benchmark',()=>{click('#modal-close');click('#tool-clean');click('#tool-panel');eq(g.active.cleaned,true);eq(g.active.panelOpen,false);});
    click('#tool-test');
    await waitFor(()=>d.querySelector('#modal-content [data-action="deliver"]'),30000);
    test('UI: benchmark completes with five PASS results',()=>{eq(d.querySelectorAll('.terminal-line.pass').length,5);eq(g.active.tested,true);});
    test('UI: delivery pays the quote and clears the workbench',()=>{click('#modal-content [data-action="deliver"]');click('[data-action="deliver-confirm"]');eq(g.state.cash,41800);eq(g.state.active,null);eq(g.state.completed,1);});
    test('UI: next order can be accepted',()=>{click('[data-action="contracts"]');click('[data-action="accept"]');assert(g.state.active);eq(d.getElementById('modal-backdrop').hidden,true);});
    test('UI: shop selection, purchase and inventory are wired',()=>{click('[data-nav="store"]');click('[data-action="purchase-menu"][data-key="ssd"]');click('[data-action="buy"][data-key="ssd"]');eq(g.state.inventory.ssd,1);click('#modal-close');click('[data-nav="inventory"]');assert(d.getElementById('modal-content').textContent.includes('NVMe'));});
    test('UI: financing, upgrade and daily closing update balances',()=>{click('#modal-close');click('[data-nav="business"]');click('[data-action="loan-confirm"]');click('[data-action="loan"]');eq(g.state.debt,10000);click('[data-action="upgrade-confirm"][data-key="diagnostic"]');click('[data-action="upgrade"][data-key="diagnostic"]');eq(g.state.upgrades.diagnostic,true);click('#modal-close');click('#end-day-button');click('[data-action="end-day"]');eq(g.state.day,2);eq(g.state.minute,540);assert(d.getElementById('modal-title').textContent.includes('営業レポート'));});
    test('UI: all QA actions leave player save untouched',()=>{eq(new URL(frame.src).searchParams.get('qa'),'1');eq(d.getElementById('save-status').textContent,'DEMO / NO SAVE');});
    const beginSpecialist=key=>{if(!d.getElementById('modal-backdrop').hidden)click('#modal-close');g.state.minute=540;g.active.faults=[key];g.active.repaired=[];g.active.diagnosed=Object.keys(PARTS);g.active.panelOpen=true;g.active.powered=false;g.active.precisionBonus=0;g.state.inventory[PARTS[key].fix]=1;w.RigGame.focus(key);click('#tool-repair');click('[data-action="repair"]');click('[data-action="specialist"]');};
    test('Specialist: CPU requires actual coverage before completion',()=>{beginSpecialist('cpu');assert(d.getElementById('paste-canvas'));eq(d.getElementById('micro-finish').disabled,true);eq(g.state.inventory.paste,1);click('#micro-cancel');assert(d.querySelector('.precision-board'));eq(g.state.inventory.paste,1);});
    test('Specialist: scoring penalises overspill and calibration errors',()=>{eq(w.RigMicrobench.score.paste(100,0),100);eq(w.RigMicrobench.score.paste(100,1),70);eq(w.RigMicrobench.score.mistakes(2),76);eq(w.RigMicrobench.score.curve([25,50,80,100]),100);});
    test('Specialist: GPU pad thickness is verified and mistakes reduce score',()=>{beginSpecialist('gpu');click('[data-pad-size="0.5"]');click('[data-pad-index="0"]');assert(d.getElementById('micro-status').classList.contains('error'));[1,1.5,1,1.5,1,1.5].forEach((value,index)=>{click(`[data-pad-size="${value}"]`);click(`[data-pad-index="${index}"]`);});click('#micro-finish');assert(g.active.repaired.includes('gpu'));eq(g.state.inventory.gpu,0);assert(g.active.serviceLog.at(-1).details.includes('88%'));});
    test('Specialist: RAM needs correct paired slots and both latches',()=>{beginSpecialist('ram');click('[data-dimm="A2"]');click('[data-dimm="B2"]');eq(d.getElementById('micro-finish').disabled,true);click('[data-latch="A2"]');click('[data-latch="B2"]');click('#micro-finish');assert(g.active.repaired.includes('ram'));eq(g.active.precisionBonus,800);});
    test('Specialist: SSD verifies all four partition mappings',()=>{beginSpecialist('ssd');for(let i=0;i<4;i++){click(`[data-source="${i}"]`);click(`[data-destination="${i}"]`);}click('#micro-finish');assert(g.active.repaired.includes('ssd'));assert(g.active.serviceLog.at(-1).details.includes('起動パーティション'));});
    test('Specialist: PSU requires ground then all three voltage rails',()=>{beginSpecialist('psu');click('[data-probe="12V"]');eq(d.getElementById('micro-finish').disabled,true);click('[data-probe="GND"]');['12V','5V','3.3V'].forEach(v=>click(`[data-probe="${v}"]`));assert(d.getElementById('meter-value').textContent.includes('3.31'));click('#micro-finish');assert(g.active.repaired.includes('psu'));});
    test('Specialist: fan curve sliders drive calibration and reward',()=>{beginSpecialist('fan');[25,50,80,100].forEach((v,i)=>{const el=d.querySelector(`[data-curve="${i}"]`);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));});eq(d.getElementById('micro-grade').textContent,'100%');click('#micro-finish');assert(g.active.repaired.includes('fan'));eq(g.active.precisionBonus,800);});
    test('UI: service records show current and archived repairs',()=>{click('#modal-close');click('[data-action="service-record"]');assert(d.querySelector('.worklog-entry'));click('[data-action="service-record"][data-key="0042"]');assert(d.getElementById('modal-content').textContent.includes('納品済み'));});
    await waitFor(()=>d.getElementById('scene-container').dataset.ready==='true',60000);
    test('3D: more than 6000 additional physical micro-details are loaded',()=>{assert(Number(d.getElementById('scene-container').dataset.microInstances)>6000);});
    test('3D: macro mode and part navigation do not spend game resources',()=>{click('#modal-close');const before=JSON.stringify(g.state);click('[data-inspection="macro"]');eq(d.getElementById('macro-hud').hidden,false);click('[data-macro-step="1"]');eq(JSON.stringify(g.state),before);});
    test('3D: exploded view, thermal overlay, inspection lamp and RGB work',()=>{const before=JSON.stringify(g.state);for(const mode of ['exploded','thermal','light']){click(`[data-inspection="${mode}"]`);eq(d.querySelector(`[data-inspection="${mode}"]`).getAttribute('aria-pressed'),'true');}eq(d.getElementById('thermal-legend').hidden,false);click('[data-inspection="rgb"]');eq(d.getElementById('rgb-mode-label').textContent,'SPECTRUM');eq(JSON.stringify(g.state),before);});
    const stage=d.getElementById('scene-container'),atlas=d.getElementById('atlas-select');
    const chooseAtlas=key=>{atlas.value=key;atlas.dispatchEvent(new w.Event('change',{bubbles:true}));};
    test('3D: ten detail views and more than 9000 instanced details exist',()=>{eq(atlas.options.length,11);assert(Number(stage.dataset.microInstances)>9000);});
    test('3D: every atlas view is selectable without changing game state',()=>{
      const before=JSON.stringify(g.state);
      for(const key of ['io','power','pump','routing','headers','radiator','gpu','ssd','memory','chassis']){chooseAtlas(key);eq(stage.dataset.atlas,key);assert(!d.getElementById('atlas-info').hidden);}
      eq(JSON.stringify(g.state),before);
    });
    test('3D: SSD view exposes four material layers and isolates context',()=>{
      click('#atlas-reset');chooseAtlas('ssd');eq(stage.dataset.cutaway,'true');eq(stage.dataset.isolated,'true');eq(d.querySelectorAll('#layer-legend span').length,4);eq(d.getElementById('layer-spread').disabled,false);
    });
    test('3D: layer slider updates output without spending resources',()=>{
      const before=JSON.stringify(g.state),slider=d.getElementById('layer-spread');slider.value='100';slider.dispatchEvent(new w.Event('input',{bubbles:true}));
      eq(stage.dataset.layerSpread,'1');eq(d.getElementById('layer-value').value,'100%');eq(JSON.stringify(g.state),before);eq(stage.dataset.layerSettled,'false');
    });
    await waitFor(()=>stage.dataset.layerSettled==='true',90000);
    test('3D: physical layer animation settles at its requested value',()=>{eq(stage.dataset.layerSettled,'true');});
    test('3D: isolation is reversible without touching game state',()=>{const before=JSON.stringify(g.state);click('#isolate-button');eq(stage.dataset.isolated,'false');click('#isolate-button');eq(stage.dataset.isolated,'true');eq(JSON.stringify(g.state),before);});
    test('3D: atlas arrows reach memory and case then wrap around',()=>{chooseAtlas('ssd');click('[data-macro-step="1"]');eq(atlas.value,'memory');click('[data-macro-step="1"]');eq(atlas.value,'chassis');click('[data-macro-step="1"]');eq(atlas.value,'io');});
    test('3D: reset clears cutaway, isolation, macro and explosion',()=>{
      chooseAtlas('memory');click('#atlas-reset');eq(atlas.value,'');eq(stage.dataset.isolated,'false');eq(stage.dataset.cutaway,'false');eq(d.getElementById('macro-hud').hidden,true);
      eq(d.getElementById('layer-spread').disabled,true);eq(d.getElementById('isolate-button').disabled,true);
      for(const name of ['exploded','thermal'])eq(d.querySelector(`[data-inspection="${name}"]`).getAttribute('aria-pressed'),'false');
    });
    test('3D: empty bench disables controls and next job restores them',()=>{
      const job=g.state.active;g.state.active=null;w.dispatchEvent(new w.Event('rig-state'));eq(atlas.disabled,true);eq(d.getElementById('layer-spread').disabled,true);
      g.state.active=job;w.dispatchEvent(new w.Event('rig-state'));eq(atlas.disabled,false);chooseAtlas('pump');eq(atlas.value,'pump');click('#atlas-reset');
    });
  } catch(e) { failed++; console.error('FAIL UI sequence: '+e.message);results.textContent+='FAIL UI sequence: '+e.message+'\n'; }
  const summary=document.getElementById('summary');summary.textContent=`${passed} passed / ${failed} failed`;summary.className=failed?'fail':'pass';summary.dataset.complete='true';summary.dataset.failed=failed;
  console.info(`TEST SUMMARY: ${passed} passed / ${failed} failed`);
})();
