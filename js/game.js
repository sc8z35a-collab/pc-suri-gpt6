(() => {
  'use strict';
  const { RepairGame, PARTS, CATALOG } = window.RepairCore;
  const $ = id => document.getElementById(id);
  const money = n => (n < 0 ? '−' : '') + '¥' + Math.abs(n).toLocaleString('ja-JP');
  const icons = {
    chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
    wallet:'<path d="M20 8V5H5a2 2 0 0 1 0-4h12v4M3 3v15a3 3 0 0 0 3 3h14V8H6"/><path d="M20 12h-5v5h5m-3-3h.01"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    moon:'<path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z"/>',
    'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 2.8c-1 .5-1 1.2-1 2.2m0 3h.01"/>',
    settings:'<path d="m9 3-.7 2.4-2.3 1L3.6 6l-1.5 3 1.8 1.8v2.5L2 15l1.5 3 2.4-.4 2.3 1L9 21h4l.8-2.4 2.3-1 2.4.4 1.5-3-1.8-1.8v-2.5L20 9l-1.5-3-2.4.4-2.3-1L13 3Z"/><circle cx="11" cy="12" r="3"/>',
    monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    rotate:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    hand:'<path d="M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8a7 7 0 0 1-12 5l-5-6a2 2 0 0 1 3-3l2 2"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    scan:'<path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M7 12h2l2-4 3 8 2-4h2"/>',
    panel:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 3v18m-2-7h.01M16 6v12"/>',
    wrench:'<path d="M14 6a6 6 0 0 0-7 7l-4 4a2.8 2.8 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 4-4-4 4-4Z"/>',
    power:'<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
    wind:'<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h4a3 3 0 1 1-3 3"/>',
    clipboard:'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="2" width="6" height="5" rx="1"/><path d="M9 11h6m-6 4h6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shop:'<path d="M3 10 5 3h14l2 7M3 10v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0v-3H3Zm2 6v5h14v-5m-9 5v-5h4v5M9 3v7m6-7v7"/>',
    inbox:'<path d="M3 14 6 4h12l3 10v6H3Zm0 0h5l2 3h4l2-3h5M9 8h6"/>',
    cart:'<path d="M2 3h3l3 13h11l3-10H6m3 14h.01M18 20h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    box:'<path d="m12 2 9 5v10l-9 5-9-5V7Zm-9 5 9 5 9-5m-9 5v10M7 4l9 5v5"/>',
    chart:'<path d="M3 3v18h18M7 16v-5m5 5V7m5 9V4"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    ram:'<rect x="3" y="6" width="18" height="10" rx="1"/><path d="M6 9h3v4H6Zm9 0h3v4h-3ZM6 16v3m4-3v3m4-3v3m4-3v3"/>',
    gpu:'<rect x="2" y="6" width="19" height="12" rx="1"/><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M5 18v3m3-3v3M2 4v16"/>',
    ssd:'<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M5 10h5v4H5Zm9 0h4m-4 3h4M3 10H1m2 4H1"/>',
    drop:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.chip}</svg>`;
  function paintIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  const qaMode = new URLSearchParams(location.search).get('qa') === '1';
  let stored = null, saveFailed = false;
  try { if (!qaMode) stored = JSON.parse(localStorage.getItem('rig-repair-save-v1')); } catch (_) { /* Start a new local game if storage is unavailable. */ }
  const game = new RepairGame(stored);
  let selected = 'cpu', modalType = '', busy = false, lastFocus = null, audioContext, specialistCleanup = null;
  const state = () => game.state;
  function sound(type = 'tap') {
    if (!state().settings.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(type === 'success' ? 660 : 420, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(type === 'success' ? 990 : 240, audioContext.currentTime + .1);
      gain.gain.setValueAtTime(.025, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .16);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .17);
    } catch (_) { /* Audio is optional. */ }
  }
  function toast(message, error = false) {
    const el = document.createElement('div'); el.className = 'toast' + (error ? ' error' : ''); el.textContent = message; $('toast-region').append(el);
    setTimeout(() => { el.classList.add('fade'); setTimeout(() => el.remove(), 350); }, 4200);
  }
  function save() {
    if (qaMode) return;
    try { localStorage.setItem('rig-repair-save-v1', JSON.stringify(state())); $('save-status').innerHTML = 'SAVED <span class="live-dot"></span>'; }
    catch (_) { $('save-status').textContent = '保存不可'; if (!saveFailed) toast('ブラウザの保存領域を利用できません。このタブを閉じると進行が失われます。', true); saveFailed = true; }
  }
  function changed() { save(); render(); window.dispatchEvent(new CustomEvent('rig-state', { detail: state() })); }
  function act(fn, onSuccess) { if (busy) return; try { const result = fn(); changed(); sound('success'); if (onSuccess) onSuccess(result); } catch (e) { toast(e.message, true); sound(); } }
  function render() {
    const s = state(), j = s.active;
    $('balance-label').textContent = money(s.cash); $('rep-label').textContent = s.rep.toFixed(1); $('completed-label').innerHTML = `${s.completed}<small> 台</small>`;
    $('day-label').textContent = 'DAY ' + String(s.day).padStart(2, '0'); $('clock-label').textContent = `${String(Math.floor(s.minute / 60)).padStart(2, '0')}:${String(s.minute % 60).padStart(2, '0')}`;
    $('level-label').textContent = game.level === 1 ? '駆け出しの工房' : game.level === 2 ? '街で評判の工房' : '頼れるプロの工房';
    $('shop-level-number').textContent = `LV.${String(game.level).padStart(2, '0')}`;
    $('xp-label').textContent = `${s.completed % 3} / 3 件`; $('xp-progress').style.width = (s.completed % 3) / 3 * 100 + '%';
    $('shop-level-title').textContent = game.level === 1 ? '小さな工房、大きな可能性。' : 'あなたの技術が、街を支えている。';
    $('shop-level-copy').textContent = game.level === 1 ? '修理を3件完了して、ハイエンド依頼を解放。' : `あと${3 - s.completed % 3}件の修理でランクアップ。`;
    const offers = game.offers(); $('available-count').textContent = offers.length; $('nav-count').textContent = offers.length;
    $('panel-tool-label').textContent = j && j.panelOpen ? 'パネルを戻す' : 'パネルを外す';
    $('labels-button').setAttribute('aria-pressed', s.settings.labels);
    $('pc-name').textContent = j ? j.name : 'WORKBENCH 01';
    $('pc-serial').textContent = j ? `CUSTOM BUILD / ATX · #${j.id}` : 'READY FOR YOUR NEXT REPAIR';
    $('machine-status').innerHTML = `<span class="${j && j.tested ? 'live-dot' : 'warning-dot'}"></span> ${!j ? '次の依頼を待っています' : j.tested ? 'テスト合格' : j.panelOpen ? 'メンテナンス中' : '修理待ち'} <span>•</span> 電源 ${j && j.powered ? 'ON' : 'OFF'}`;
    $('component-strip').innerHTML = Object.entries(PARTS).map(([key, p]) => `<button class="component-chip ${selected === key ? 'active' : ''} ${j && j.diagnosed.includes(key) && j.faults.includes(key) ? j.repaired.includes(key) ? 'repaired' : 'faulty' : ''}" data-part="${key}" aria-pressed="${selected === key}">${p.short}</button>`).join('');
    if (!j) {
      $('active-job-content').innerHTML = `<div class="empty-state job-empty"><span data-icon="check-circle"></span><h3>おつかれさまでした。</h3><p>またひとつ、誰かの日常が戻りました。<br>新しい依頼を受けて、工房を育てましょう。</p><button class="primary-button" data-action="contracts">次の依頼を探す ${icon('arrow-right')}</button></div>`;
    } else {
      const diagnosed = j.faults.every(k => j.diagnosed.includes(k)); const fixed = j.faults.every(k => j.repaired.includes(k));
      const checks = [diagnosed, fixed, j.cleaned, j.tested], count = checks.filter(Boolean).length;
      const labels = ['不具合の原因を特定する', '故障パーツを修理・交換', '内部をクリーニング（任意）', '起動・安定性テストを通過'];
      const first = checks.findIndex(v => !v); const late = s.day > j.due;
      $('active-job-content').innerHTML = `<div class="job-body"><div class="job-id-row"><span>ORDER #${j.id}</span><span class="difficulty-badge">● ${j.tier}</span></div><h2>${j.title}</h2><div class="customer"><div class="avatar">${j.initial}</div><div><p class="customer-name">${j.customer} <span style="color:var(--muted)">様</span></p><p class="customer-note">${j.type}</p></div></div><p class="symptom">${j.symptom}</p><div class="job-meta"><div><span class="meta-label">${icon('wallet')} 基本報酬 / 部品代込み</span><strong>${money(j.reward)}</strong></div><div><span class="meta-label">${icon('clock')} 納期</span><strong class="deadline">DAY ${String(j.due).padStart(2, '0')} <small>${late ? `${s.day-j.due}日超過` : j.due === s.day ? '本日中' : `あと ${j.due - s.day} 日`}</small></strong></div></div><div class="checklist-title">作業チェックリスト <span>${count} / 4</span></div><div class="checklist">${labels.map((label,i) => `<div class="check-item ${checks[i] ? 'done' : first === i ? 'current' : ''}"><span class="check-box">${checks[i] ? '✓' : ''}</span>${label}</div>`).join('')}</div><button class="deliver-button" data-action="deliver" ${j.tested ? '' : 'disabled'}><span>${j.tested ? '修理完了・お客様に納品' : 'すべて直して、納品しよう'}</span>${icon('arrow-right')}</button><p class="job-footer-note">${j.cleaned ? '✓ クリーニング特典 +¥500' : '丁寧な仕事が、次の依頼につながる。'}</p><button class="job-abandon" data-action="abandon-confirm">依頼をキャンセルする</button></div>`;
    }
    $('active-job-content').insertAdjacentHTML('beforeend', `<div style="padding:0 18px 17px"><button class="worklog-button" data-action="service-record">${icon('clipboard')} 整備カルテ・過去の修理記録</button></div>`);
    paintIcons($('active-job-content'));
  }
  function setModal(title, eyebrow, content, type = '') {
    if (specialistCleanup) { specialistCleanup(); specialistCleanup = null; }
    if ($('modal-backdrop').hidden) lastFocus = document.activeElement;
    modalType = type; $('modal-title').textContent = title; $('modal-eyebrow').textContent = eyebrow; $('modal-content').innerHTML = content;
    $('modal-backdrop').hidden = false; document.body.style.overflow = 'hidden'; $('modal').scrollTop = 0; paintIcons($('modal-content'));
    $('modal-close').focus({ preventScroll: true });
  }
  function closeModal() { if (busy) { toast('テスト実行中です。まもなく完了します。'); return; } if (specialistCleanup) { specialistCleanup(); specialistCleanup = null; } $('modal-backdrop').hidden = true; document.body.style.overflow = ''; modalType = ''; document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === 'workbench')); if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true }); }
  function setSelected(key, open = true) { if (!PARTS[key]) return; selected = key; render(); window.dispatchEvent(new CustomEvent('rig-select', { detail: key })); if (open) showPart(key); }
  function showPart(key = selected) {
    if (!state().active) { showContracts(); return; }
    selected = key; const p = PARTS[key], j = state().active, known = j.diagnosed.includes(key), faulty = j.faults.includes(key) && !j.repaired.includes(key), fixed = j.repaired.includes(key);
    setModal(p.name, 'COMPONENT / INSPECTION', `<div class="diagnostic-header"><span class="part-card-icon" data-icon="${p.icon}"></span><div><h3>${p.short} <span style="color:var(--muted);font-weight:400">${fixed ? 'REPAIRED' : known ? faulty ? 'FAULT DETECTED' : 'HEALTHY' : 'UNKNOWN'}</span></h3><p>${p.model}</p></div></div><div class="spec-grid"><div><small>規格・スペック</small><strong>${p.spec}</strong></div><div><small>測定値</small><strong>${!known ? '未診断' : faulty ? key === 'cpu' ? '98°C / THROTTLING' : 'ERROR DETECTED' : p.normal}</strong></div><div><small>ステータス</small><strong>${!known ? '検査が必要です' : faulty ? '⚠ 故障を検出' : '✓ 正常に動作'}</strong></div><div><small>ケースの状態</small><strong>${j.panelOpen ? 'パネル取り外し済み' : 'パネル取り付け済み'}</strong></div></div><div class="fault-note ${!known ? 'unknown-note' : faulty ? '' : 'success-note'}">${!known ? 'まだ診断されていません。診断を実行して、パーツの状態を確かめましょう。' : faulty ? p.fault : fixed ? '修理が完了しました。パネルを戻して起動テストを行いましょう。' : '異常は見つかりませんでした。不要な交換は利益を減らします。ほかのパーツを調べましょう。'}</div><div class="action-row"><button class="secondary-button" data-action="diagnose-part" data-key="${key}">${icon('scan')} 個別診断 · ${state().upgrades.diagnostic ? 8 : 20}分</button>${known && faulty ? `<button class="primary-button" data-action="repair-menu">修理する ${icon('wrench')}</button>` : `<button class="primary-button" data-action="diagnose-all">全体診断 · ${state().upgrades.diagnostic ? 15 : 40}分</button>`}</div><p class="small-note">診断費用は無料。ゲーム内の作業時間を消費します。<br>3Dモデルをタップ、または下のパーツ名から部品を選択できます。</p>`, 'part');
    $('modal-content').querySelector('.diagnostic-header').insertAdjacentHTML('afterend', `<div class="lab-readouts">${game.readings(key).map(r=>`<article><small>${r.label}</small><strong>${r.value}</strong></article>`).join('')}</div>`);
    $('modal-content').insertAdjacentHTML('beforeend', `<button class="secondary-button wide-button" data-action="macro-inspect">${icon('scan')} この部品を3D接写で観察</button><p class="small-note">測定値はゲーム内の診断シミュレーションです。</p>`);
  }
  function showDiagnosis() {
    const j = state().active; if (!j) return showContracts();
    setModal('システム診断', 'DIAGNOSTICS / BENCH TEST', `<p class="modal-intro">お客様の症状から、原因を切り分けます。テスト用電源を接続して<strong>全6系統を検査</strong>。修理に必要なパーツがわかります。</p><div class="card-list">${Object.entries(PARTS).map(([k,p]) => `<button class="part-card" data-action="part" data-key="${k}" style="text-align:left;width:100%"><span class="part-card-icon" data-icon="${p.icon}"></span><span class="part-card-body"><h3>${p.name}</h3><p>${p.model}</p></span><span style="font-size:10px;color:${j.diagnosed.includes(k) && j.faults.includes(k) && !j.repaired.includes(k) ? 'var(--orange)' : 'var(--green)'}">${j.diagnosed.includes(k) ? j.faults.includes(k) && !j.repaired.includes(k) ? '要修理' : '正常' : '未診断'} ${icon('arrow-right')}</span></button>`).join('')}</div><button class="primary-button wide-button" data-action="diagnose-all">${icon('scan')} 全体診断を実行 · ${state().upgrades.diagnostic ? 15 : 40}分</button><p class="small-note">電源が入らないPCも、工房の診断装置で検査できます。</p>`, 'diagnosis');
  }
  function diagnoseAll() { act(() => game.diagnose(), faults => { showDiagnosis(); toast(faults.length ? `診断完了：${faults.map(k => PARTS[k].short).join('・')} に不具合を検出。パーツを選んで修理しましょう。` : '全パーツ正常です。起動テストで最終確認しましょう。'); }); }
  function repairMenu() {
    const j = state().active; if (!j) return showContracts();
    const broken = j.faults.filter(k => j.diagnosed.includes(k) && !j.repaired.includes(k));
    if (!broken.length) { if (j.faults.every(k => j.repaired.includes(k))) toast('修理は完了しています。パネルを戻して起動テストへ。'); else { showDiagnosis(); toast('まずは診断で原因を特定しましょう。'); } return; }
    if (!j.panelOpen) { setModal('修理の前に、安全確認。', 'SAFETY FIRST', `<div class="fault-note">内部の作業には、サイドパネルを外す必要があります。電源は自動的に切断されます。</div><button class="primary-button wide-button" data-action="panel-then-repair">${icon('panel')} パネルを外す · 5分</button>`, 'repair'); return; }
    if (!broken.includes(selected)) selected = broken[0];
    const p = PARTS[selected], item = p.fix, normal = state().inventory[item] || 0, premium = state().premiumStock[item] || 0;
    setModal(selected === 'cpu' ? '熱伝導を、取り戻す。' : '新しいパーツに交換', 'REPAIR / ' + p.short, `<div class="store-filter">${broken.map(k => `<button class="filter-button ${selected === k ? 'active' : ''}" data-action="repair-select" data-key="${k}">${PARTS[k].short}</button>`).join('')}</div><div class="diagnostic-header"><span class="part-card-icon" data-icon="${p.icon}"></span><div><h3>${p.name}</h3><p>${selected === 'cpu' ? 'クーラーを外す → 古いグリスを除去 → 再塗布' : '固定を解除 → 故障部品を取り外す → 新品を装着'}</p></div></div><div class="fault-note">${p.fault}</div><p class="modal-intro">必要な部品：<strong>${CATALOG[item].name}</strong><br>作業時間 ${state().upgrades.bench ? 20 : selected === 'cpu' ? 30 : 40} 分。部品代は報酬に含まれるため、仕入れ価格が利益を左右します。</p><div class="quality-options"><div class="quality-option"><h4>スタンダード</h4><p>確実に修理できる標準部品。<br>バランスのよい利益率。</p><strong>在庫 ${normal}</strong><button class="primary-button" data-action="${normal ? 'repair' : 'store-item'}" data-key="${normal ? selected : item}">${normal ? 'この部品で修理' : 'ショップで仕入れる'}</button></div><div class="quality-option"><h4>プレミアム</h4><p>厳選された高品質部品。<br>納品ボーナス +¥2,000 / 評判UP</p><strong>在庫 ${premium}</strong><button class="primary-button" data-action="${premium ? 'repair-premium' : 'store-item'}" data-key="${premium ? selected : item}">${premium ? '高品質部品で修理' : 'ショップで仕入れる'}</button></div></div><p class="small-note">高品質部品の仕入れ値は35%増。高額パーツでは、追加報酬より原価が高くなる場合があります。</p>`, 'repair');
    render(); window.dispatchEvent(new CustomEvent('rig-select', { detail: selected }));
  }
  function showContracts() {
    const offers = game.offers();
    setModal('次の一台を、あなたの手で。', 'JOB BOARD / AVAILABLE ORDERS', `<p class="modal-intro">${state().active ? '作業台は現在使用中です。<strong>進行中の依頼を納品</strong>してから、新しい依頼を受けられます。' : '症状と報酬を見比べて、引き受ける依頼を選びましょう。'}<br>部品は報酬から実費負担。納期超過は1日につき報酬−15%（最大60%）。<br>評判による報酬係数：<strong>×${game.reputationMultiplier.toFixed(2)}</strong>（表示報酬に反映済み）。</p><div class="card-list">${offers.length ? offers.map(o => `<article class="contract-card"><div class="contract-top"><span>${o.tier}</span><span>納期：受注から${o.days}日</span></div><h3>${o.title}</h3><p>「${o.symptom}」</p><div class="contract-bottom"><div><span class="eyebrow">REWARD</span><strong style="display:block;margin-top:4px">${money(o.reward)}</strong></div><button class="primary-button" data-action="accept" data-key="${o.key}" ${state().active ? 'disabled' : ''}>${state().active ? '作業台が使用中' : '依頼を引き受ける'} ${icon('arrow-right')}</button></div></article>`).join('') : '<div class="empty-state"><h3>本日の依頼はすべて受注済みです。</h3><p>翌日になると新しい依頼が届きます。</p></div>'}</div><p class="small-note">${game.level < 2 ? '🔒 修理3件完了で、GPU・複合故障の高額依頼を解放。' : '✓ ハイエンド・法人向けの依頼が解放されています。'}</p>`, 'contracts');
  }
  let storeFilter = 'all';
  function showStore(filter = storeFilter) {
    storeFilter = filter;
    const items = Object.entries(CATALOG).filter(([k,p]) => filter === 'all' || filter === 'supply' ? filter === 'all' || p.category === 'supply' : filter === 'part' ? p.category === 'part' : k === filter);
    setModal('いい修理は、いい部品から。', 'PARTS SUPPLY / AKIBA EXPRESS', `<p class="modal-intro">所持金 <strong>${money(state().cash)}</strong> · 購入ごとに10分で即日配送。<br>${state().upgrades.supplier ? '<strong>取引契約により全品10%OFF適用中。</strong>' : 'すべてのパーツは修理中のPCに適合します。'}</p><div class="store-filter">${[['all','すべて'],['part','交換パーツ'],['supply','消耗品']].map(([k,t]) => `<button class="filter-button ${filter === k ? 'active' : ''}" data-action="store-filter" data-key="${k}">${t}</button>`).join('')}</div><div class="card-list">${items.map(([k,p]) => `<article class="part-card"><span class="part-card-icon" data-icon="${p.icon}"></span><div class="part-card-body"><h3>${p.name}</h3><p>${p.description}</p><strong>${money(game.price(k))}</strong><p>標準 ${state().inventory[k] || 0} / 高品質 ${state().premiumStock[k] || 0} 個</p></div><button class="primary-button" data-action="purchase-menu" data-key="${k}">仕入れる</button></article>`).join('')}</div><button class="secondary-button wide-button" data-action="repair-menu">作業中の修理に戻る ${icon('wrench')}</button>`, 'store');
  }
  function purchaseMenu(key) {
    const p = CATALOG[key];
    setModal(p.name, 'PROCUREMENT / SELECT QUALITY', `<p class="modal-intro">所持金 <strong>${money(state().cash)}</strong>。配達に10分を消費します。どちらも確実に修理できます。</p><div class="quality-options">${[false,true].map(premium => `<div class="quality-option"><h4>${premium ? 'プレミアム' : 'スタンダード'}</h4><p>${premium ? '納品時 +¥2,000 / 評判 +0.04' : '標準品質 / 追加報酬なし'}<br>${p.description}</p><strong>${money(game.price(key,premium))}</strong><button class="primary-button" data-action="${premium ? 'buy-premium' : 'buy'}" data-key="${key}" ${state().cash < game.price(key,premium) ? 'disabled' : ''}>1個仕入れる</button></div>`).join('')}</div><p class="small-note">購入後は在庫に追加されます。自動で取り付けは行われません。<br>仕入れた部品は在庫メニューから購入相当額の60%で売却できます。</p><button class="secondary-button wide-button" data-action="store">ショップに戻る</button>`, 'purchase');
  }
  function showInventory() {
    const rows = []; [false,true].forEach(premium => Object.entries(premium ? state().premiumStock : state().inventory).forEach(([k,q]) => { if (q > 0 && CATALOG[k]) rows.push({k,q,premium}); }));
    setModal('備えが、仕事を速くする。', 'INVENTORY / YOUR PARTS', `<p class="modal-intro">スターターキット：グリス2個・DDR5メモリ1個を支給。<br>不要な在庫は売却できます。売却価格は現在の仕入れ値の60%です。</p><div class="card-list">${rows.length ? rows.map(({k,q,premium}) => `<article class="part-card"><span class="part-card-icon" data-icon="${CATALOG[k].icon}"></span><div class="part-card-body"><h3>${CATALOG[k].name}</h3><p>${premium ? 'プレミアム' : 'スタンダード'} · 在庫 ${q} 個</p><strong>${money(Math.round(game.price(k,premium)*.6))}<small style="font-size:8px;color:var(--muted)"> / 売却</small></strong></div><button class="secondary-button" data-action="${premium ? 'sell-premium' : 'sell'}" data-key="${k}" style="padding:9px 12px;font-size:9px">1個売却</button></article>`).join('') : '<div class="empty-state"><span data-icon="box"></span><h3>在庫はありません。</h3><p>ショップで必要な部品を仕入れましょう。</p></div>'}</div><button class="primary-button wide-button" data-action="store">パーツショップへ ${icon('arrow-right')}</button>`, 'inventory');
  }
  function showBusiness() {
    const s = state(); const days = s.days.slice(-7), max = Math.max(10000,...days.map(d => d.revenue));
    setModal('直すだけじゃない。育てよう。', 'BUSINESS / WORKSHOP MANAGEMENT', `<div class="business-stats"><div class="info-card"><small>現在の所持金</small><strong>${money(s.cash)}</strong></div><div class="info-card"><small>累計修理売上</small><strong>${money(s.revenue)}</strong></div><div class="info-card"><small>累計支出（仕入・固定費等）</small><strong style="color:var(--orange)">${money(s.expenses)}</strong></div><div class="info-card"><small>借入残高 / 日利1%</small><strong style="color:${s.debt ? 'var(--orange)' : 'var(--green)'}">${money(s.debt)}</strong></div></div><div class="info-card"><p class="modal-intro" style="margin:0">家賃・電気代：<strong>¥1,800 / 日</strong><br>営業時間：09:00–18:00。作業でのみ時間が進みます。<br>評判：<strong>${s.rep.toFixed(2)} / 5.00</strong> · LV.${game.level} · 修理 ${s.completed} 件<br>納期厳守・清掃・高品質部品で評判が上がります。<br>評判が高いほど、新規依頼の報酬も増加（現在 ×${game.reputationMultiplier.toFixed(2)}）。</p></div>${days.length ? `<h3 class="section-subtitle">直近の日別売上</h3><div class="revenue-chart">${days.map(d => `<div class="revenue-bar" style="height:${Math.max(3,d.revenue/max*100)}%" title="DAY ${d.day}: ${money(d.revenue)}"><small>D${d.day}</small></div>`).join('')}</div>` : ''}<h3 class="section-subtitle">工房への投資</h3><div class="card-list">${[['diagnostic','プロ用診断装置','全体診断 40分 → 15分。個別診断 20分 → 8分。',14000],['supplier','卸業者との取引契約','すべての部品の仕入れ価格が、永久に10%OFF。',18000],['bench','精密電動ツールセット','すべての修理・交換が20分に短縮。',22000]].map(([k,t,d,p]) => `<article class="info-card upgrade-card"><div><h3>${t}</h3><p>${d}</p></div><button class="${s.upgrades[k] ? 'secondary-button' : 'primary-button'}" data-action="upgrade-confirm" data-key="${k}" ${s.upgrades[k] ? 'disabled' : ''}>${s.upgrades[k] ? '導入済み' : money(p)}</button></article>`).join('')}</div><h3 class="section-subtitle">事業融資</h3><p class="small-note">上限 ¥30,000 / 日利1%。受取・返済は ¥10,000 単位。資金難の際に利用できますが、毎日の利息に注意してください。</p><div class="action-row"><button class="secondary-button" data-action="loan-confirm" ${s.debt >= 30000 ? 'disabled' : ''}>¥10,000 借りる</button><button class="secondary-button" data-action="repay" ${!s.debt || s.cash < Math.min(s.debt,10000) ? 'disabled' : ''}>¥10,000 返済</button></div><h3 class="section-subtitle">入出金履歴</h3>${s.ledger.length ? s.ledger.slice(0,12).map(l => `<div class="ledger-item"><span><small>D${l.day}</small>${l.label}</span><strong class="${l.amount >= 0 ? 'positive' : 'negative'}">${l.amount > 0 ? '+' : ''}${money(l.amount)}</strong></div>`).join('') : '<p class="small-note">最初の修理から、あなたの物語が始まります。</p>'}`, 'business');
  }
  function showHelp() {
    setModal('おかえり、修理屋さん。', 'FIELD MANUAL / HOW TO PLAY', `<div class="brand-logo-mini">PRECISION IS EVERYTHING.</div><p class="modal-intro">あなたは秋葉原の小さなPC修理工房のオーナー。<strong>原因を見抜き、直し、利益を残す</strong>。次の一台が、工房の未来を変えます。</p>${[['01','症状を聞いて、診断する','「診断」から全体診断を実行。最初の依頼はCPUの冷却トラブルです。3Dのパーツをタップしても状態を確認できます。'],['02','パネルを外して、修理する','パネルを外す →「修理・交換」。支給されたグリスを選び、4本のネジを順にタップ。続く精度ゲージを中央で止めると最大¥800の追加報酬。自動作業も選べます。'],['03','仕上げて、起動テスト','清掃すると報酬 +¥500 と評判ボーナス。パネルを戻し「起動テスト」を通過すると納品できます。'],['04','利益を生み、工房を育てる','納品で報酬を獲得。3件完了で高額依頼が解放。毎日の固定費は¥1,800。設備投資で作業時間と仕入れコストを削減できます。']].map(([n,t,d]) => `<div class="help-step"><span class="step-number">${n}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}<div class="info-card"><h3 style="font-size:11px;margin-bottom:9px">スマートフォンの操作</h3><p class="small-note" style="margin:0">1本指ドラッグ：PCの周囲を回転<br>2本指ピンチ：ズーム / 2本指ドラッグ：移動<br>パーツをタップ：選択・診断<br>右上の3つのボタン：内部 / 正面 / 視点リセット<br>時間は作業したときだけ進行。いつでも中断できます。進行はこのブラウザに自動保存されます。</p></div><button class="primary-button wide-button" data-action="close">工房で作業を始める ${icon('arrow-right')}</button>`, 'help');
  }
  function showSettings() {
    setModal('工房の設定', 'PREFERENCES / LOCAL SAVE', `<div class="settings-row"><div><h3>操作サウンド</h3><p>修理・購入・操作時の効果音</p></div><button class="switch-button" data-action="toggle-sound">${state().settings.sound ? 'ON' : 'OFF'}</button></div><div class="settings-row"><div><h3>3Dパーツガイド</h3><p>選択中のパーツ名を3Dビューに表示</p></div><button class="switch-button" data-action="toggle-labels">${state().settings.labels ? 'ON' : 'OFF'}</button></div><div class="settings-row"><div><h3>グラフィック</h3><p>4Kシャドウ・SSAO・微細部品・金属加工痕・接写</p></div><span class="positive">ULTRA</span></div><p class="small-note">このゲームは架空の修理シミュレーターです。現実の修理手順とは異なります。<br>進行は端末・ブラウザごとのlocalStorageに保存されます。サイトデータ削除やシークレットモード終了で消失する場合があります。クラウド同期はありません。</p><button class="secondary-button wide-button" data-action="help">遊び方を見る</button><button class="danger-button wide-button" data-action="reset-confirm">セーブデータを初期化</button>`, 'settings');
  }
  function endDayConfirm() { const s = state(); setModal('今日の営業を、終えますか？', 'CLOSE WORKSHOP / END OF DAY', `<p class="modal-intro">残り作業時間 <strong>${Math.floor(game.remaining/60)}時間 ${game.remaining%60}分</strong>。作業中のPCと在庫は翌日に引き継がれます。</p><div class="receipt-line"><span>家賃・電気代</span><strong>${money(1800)}</strong></div><div class="receipt-line"><span>借入利息 / 日利1%</span><strong>${money(Math.round(s.debt*.01))}</strong></div><div class="receipt-line"><span>閉店後の残高</span><strong>${money(s.cash-1800-Math.round(s.debt*.01))}</strong></div>${s.active && s.active.due <= s.day ? '<div class="fault-note">未納品の依頼が納期を超過します。1日につき基本報酬が15%減額され、評判も下がります。</div>' : ''}<button class="primary-button wide-button" data-action="end-day">閉店して、翌日の09:00へ ${icon('moon')}</button><button class="secondary-button wide-button" data-action="close">もう少し働く</button>`, 'end-day'); }
  function runTest() {
    if (busy) return;
    let result; try { result = game.test(); changed(); } catch (e) { toast(e.message,true); return; }
    busy = true;
    setModal('起動・安定性テスト', 'SYSTEM VALIDATION / LIVE', `<p class="modal-intro">POST → OS起動 → メモリ検査 → 100%負荷テスト。<br>ゲーム内の30分間をシミュレートしています。</p><div class="terminal" id="test-terminal"></div><div class="test-progress"><span id="test-progress"></span></div><p class="small-note" id="test-note">ベンチマークを実行しています…</p>`, 'test');
    const lines = [ ['電源ユニット / 電圧チェック', !result.faults.includes('psu')], ['POST / メモリ整合性テスト', !result.faults.includes('ram')], ['NVMe / OSブートシーケンス', !result.faults.includes('ssd')], ['GPU / 3D描画ストレステスト', !result.faults.includes('gpu')], ['CPU / 温度・冷却テスト', !result.faults.includes('cpu') && !result.faults.includes('fan')] ];
    let index = 0; const timer = setInterval(() => {
      const [text,pass] = lines[index]; const el = document.createElement('div'); el.className = 'terminal-line ' + (pass ? 'pass' : 'fail'); el.textContent = `${pass ? '[ PASS ]' : '[ FAIL ]'}  ${text}`; $('test-terminal').append(el); index++; $('test-progress').style.width = index/lines.length*100+'%';
      if (index === lines.length) { clearInterval(timer); busy = false; $('test-note').textContent = result.pass ? 'すべてのテストに合格しました。お客様に納品できます。' : 'テスト失敗。未修理のパーツを診断・交換してください。'; const button = document.createElement('button'); button.className = 'primary-button wide-button'; button.dataset.action = result.pass ? 'deliver' : 'diagnosis'; button.textContent = result.pass ? '納品へ進む →' : '診断に戻る'; $('modal-content').append(button); sound(result.pass ? 'success' : 'tap'); }
    }, 650);
  }
  function deliveryPreview() {
    try { const q = game.quote(), j = game.active; if (!j.tested) throw new Error('先に起動テストを通過してください。');
      setModal('もう一度、動き出す。', 'DELIVERY / REPAIR COMPLETE', `<div class="empty-state" style="padding-bottom:0"><span data-icon="check-circle"></span><h3>すべての動作テストに合格</h3></div><div class="report-amount"><small>今回の受取金額</small><strong>${money(q.total)}</strong></div><div class="receipt-line"><span>基本報酬</span><strong>${money(q.base)}</strong></div><div class="receipt-line"><span>クリーニング特典</span><strong class="positive">+${money(q.cleanBonus)}</strong></div><div class="receipt-line"><span>高品質パーツ特典</span><strong>+${money(q.premiumBonus)}</strong></div><div class="receipt-line"><span>精密作業ボーナス</span><strong>+${money(q.precisionBonus)}</strong></div><div class="receipt-line"><span>納期超過による減額</span><strong>−${money(q.penalty)}</strong></div><div class="receipt-line"><span>使用部品の標準原価（参考）</span><strong>${money(j.partCosts)}</strong></div><p class="small-note">部品の仕入れ代は購入時に支払い済みです。支給品を使用した場合でも参考原価に含まれます。固定費は閉店時に精算します。</p><button class="primary-button wide-button" data-action="deliver-confirm">${icon('check-circle')} お客様に納品して報酬を受け取る</button>`, 'delivery');
    } catch(e) { toast(e.message,true); }
  }
  function showServiceRecord(archiveId = '') {
    const s=state(),archives=s.serviceArchives||[],archived=archives.find(a=>a.id===archiveId),job=archived||s.active;
    const logs=archived?archived.records:job?.serviceLog||[];
    const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const safe=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    setModal('一台ごとの、整備カルテ。','SERVICE RECORD / TRACEABILITY',`<p class="modal-intro">診断・交換方法・取り付け精度・テスト結果を時系列で記録します。納品後も直近25台のカルテを保存します。</p><div class="store-filter">${s.active?`<button class="filter-button ${!archived?'active':''}" data-action="service-record">作業中 #${s.active.id}</button>`:''}${archives.map(a=>`<button class="filter-button ${a===archived?'active':''}" data-action="service-record" data-key="${safe(a.id)}">納品 #${safe(a.id)}</button>`).join('')}</div>${job?`<div class="info-card"><h3 style="font-size:14px">${safe(job.name)}</h3><p class="small-note">${safe(job.customer)} 様 / ${archived?'納品済み DAY '+archived.day:'作業中'}${archived?' / '+money(archived.total):''}</p></div>`:''}${logs.length?logs.slice().reverse().map(l=>`<article class="worklog-entry"><span>DAY ${l.day}<br>${time(l.minute)}</span><div><h3>${safe(l.action)} ${l.part?' / '+safe(PARTS[l.part]?.short||l.part):''}</h3><p>${safe(l.details)}</p></div></article>`).join(''):'<div class="empty-state"><h3>まだ作業記録はありません。</h3><p>診断や修理を行うと、ここに記録されます。</p></div>'}<button class="secondary-button wide-button" data-action="close">ワークベンチに戻る</button>`,'service-record');
  }
  let precisionTask = null;
  function specialistButton(key) { return `<button class="specialist-entry" data-action="specialist">${icon(PARTS[key].icon)}<span><strong>専門整備で、もっと深く。</strong><small>${window.RigMicrobench.names[key]} · タッチ操作で実践</small></span></button>`; }
  function startSpecialist() {
    if(!precisionTask||precisionTask.finished)return;
    const {key,premium}=precisionTask;
    try { new RepairGame(state()).repair(key,premium); } catch(e) { toast(e.message,true);return; }
    setModal(window.RigMicrobench.names[key],'SPECIALIST SERVICE / '+PARTS[key].short,'<div id="specialist-root"></div>','specialist');
    specialistCleanup=window.RigMicrobench.mount($('specialist-root'),key,{complete:(value,technique)=>finishPrecision(false,value,technique),cancel:()=>startPrecision(key,premium)});
  }
  function startPrecision(key, premium = false) {
    // Validate against an isolated copy before starting; actual resources are
    // consumed exactly once when the player completes the operation.
    try { new RepairGame(state()).repair(key, premium); } catch (e) { toast(e.message, true); return; }
    precisionTask = { key, premium, released: 0, finished: false };
    setModal(key === 'cpu' ? 'クーラーを取り外そう。' : '固定パーツを解除しよう。', 'HANDS-ON REPAIR / STEP 01', `<p class="modal-intro">番号順に<strong>4か所の固定ネジ</strong>をタップ。${key === 'cpu' ? 'クーラーを外し、古いグリスを除去します。' : '固定を解除して、故障パーツを取り外します。'}</p><div class="precision-board"><div class="precision-chip">${icon(PARTS[key].icon)}<strong>${PARTS[key].short}</strong><small id="screw-progress">0 / 4 RELEASED</small></div>${[1,2,3,4].map(n => `<button class="precision-screw screw-${n}" data-action="screw" data-key="${n}" aria-label="固定ネジ ${n}"><span>+</span><small>${n}</small></button>`).join('')}</div>${specialistButton(key)}<p class="small-note">続いて取り付けの精度チャレンジ。うまく決まれば、納品時に最大 +¥800。<br>時間がないときは自動作業も選べます（精密作業ボーナスなし）。</p><button class="secondary-button wide-button" data-action="precision-auto">自動で作業を完了する</button>`, 'precision');
  }
  function releaseScrew(number) {
    if (!precisionTask || precisionTask.finished) return;
    if (Number(number) !== precisionTask.released + 1) { toast('ネジを 1 → 2 → 3 → 4 の順に解除しましょう。'); return; }
    precisionTask.released++; const button = document.querySelector(`.precision-screw[data-key="${number}"]`); if (button) { button.classList.add('released'); button.disabled = true; }
    $('screw-progress').textContent = `${precisionTask.released} / 4 RELEASED`;
    if (precisionTask.released === 4) {
      const key = precisionTask.key;
      setModal(key === 'cpu' ? 'ちょうどいい量で、熱をつなぐ。' : '確かな手応えで、装着する。', 'HANDS-ON REPAIR / STEP 02', `<p class="modal-intro">${key === 'cpu' ? '新しいグリスを塗布します。適量になる瞬間を狙ってください。' : '新品の接続・固定を行います。適正トルクになる瞬間を狙ってください。'}<br>白い針が<strong>中央の緑ゾーン</strong>に入ったら、ボタンをタップ！</p><div class="timing-display"><span>${key === 'cpu' ? 'THERMAL COMPOUND' : 'PRECISION TORQUE'}</span><strong>${key === 'cpu' ? 'APPLY' : 'INSTALL'}<em>WITH PRECISION</em></strong><div class="timing-track" id="timing-track"><div class="timing-zone"></div><div class="timing-perfect"></div><i class="timing-needle" id="timing-needle"></i></div><div class="timing-scale"><span>不足</span><span>PERFECT</span><span>過剰</span></div></div><button class="primary-button wide-button precision-tap" data-action="precision-stop">${icon('hand')} ここで止める！</button><p class="small-note">精度 85%以上：+¥800 / 60%以上：+¥400。<br>失敗しても部品を壊すことはなく、修理は完了します。</p>`, 'precision');
    }
  }
  function finishPrecision(auto = false, suppliedScore = null, technique = '精度ゲージ') {
    if (!precisionTask || precisionTask.finished) return;
    let score = suppliedScore === null ? 0 : Math.max(0,Math.min(100,Math.round(suppliedScore)));
    if (!auto && suppliedScore === null) { const needle = $('timing-needle'), track = $('timing-track'); if (!needle || !track) return; const n = needle.getBoundingClientRect(), t = track.getBoundingClientRect(); const percentage = (n.left + n.width / 2 - t.left) / t.width * 100; score = Math.max(0, Math.round(100 - Math.abs(percentage - 50) * 2)); }
    const { key, premium } = precisionTask;
    act(() => game.repair(key, premium, score, auto?'自動作業':technique), () => {
      precisionTask.finished = true; const bonus = score >= 85 ? 800 : score >= 60 ? 400 : 0;
      window.dispatchEvent(new CustomEvent('rig-repair', { detail: key }));
      setModal('修理、完了。', 'CRAFTSMANSHIP / RESULT', `<div class="report-amount"><small>${auto ? '自動作業で正常に装着しました' : '取り付け精度'}</small><strong>${auto ? 'COMPLETE' : score + '%'}</strong></div><div class="fault-note success-note">${PARTS[key].name} の修理が完了しました。${bonus ? `<br>精密作業ボーナス <strong>+${money(bonus)}</strong> を納品時に加算！` : ''}</div><p class="modal-intro">次は内部のクリーニング。終わったらパネルを戻して、起動テストを行いましょう。</p><button class="primary-button wide-button" data-action="close">ワークベンチへ戻る ${icon('arrow-right')}</button>`, 'repair-result');
    });
  }
  const actions = {
    specialist: startSpecialist, 'service-record': showServiceRecord,
    'macro-inspect': () => { closeModal(); window.dispatchEvent(new Event('rig-macro')); $('workbench-panel').scrollIntoView({behavior:'smooth',block:'start'}); },
    screw: releaseScrew, 'precision-stop': () => finishPrecision(false), 'precision-auto': () => finishPrecision(true),
    close: closeModal, help: showHelp, diagnosis: showDiagnosis, contracts: showContracts, store: () => showStore('all'), inventory: showInventory, business: showBusiness,
    part: key => setSelected(key), 'diagnose-all': diagnoseAll, 'diagnose-part': key => act(() => game.diagnose(key), () => { showPart(key); toast('個別診断が完了しました。'); }),
    'repair-menu': repairMenu, 'repair-select': key => { selected = key; repairMenu(); }, 'panel-then-repair': () => act(() => game.panel(), repairMenu),
    repair: key => startPrecision(key),
    'repair-premium': key => startPrecision(key,true),
    'store-item': key => showStore(key), 'store-filter': showStore, 'purchase-menu': purchaseMenu,
    buy: key => act(() => game.buy(key), () => { showStore(storeFilter); toast(`${CATALOG[key].name} が届きました。`); }),
    'buy-premium': key => act(() => game.buy(key,true), () => { showStore(storeFilter); toast('プレミアム部品が届きました。修理メニューから取り付けましょう。'); }),
    sell: key => act(() => game.sell(key), value => { showInventory(); toast(`${money(value)} で売却しました。`); }),
    'sell-premium': key => act(() => game.sell(key,true), value => { showInventory(); toast(`${money(value)} で売却しました。`); }),
    accept: key => act(() => game.accept(key), () => { selected = 'cpu'; closeModal(); changed(); toast('新しいPCが作業台に届きました。まず症状を確認しましょう。'); window.dispatchEvent(new Event('rig-reset-view')); $('workbench-panel').scrollIntoView({behavior:'smooth',block:'start'}); }),
    deliver: deliveryPreview, 'deliver-confirm': () => act(() => game.deliver(), report => { setModal('またひとつ、信頼が増えた。', 'THANK YOU / JOB COMPLETED', `<div class="report-amount"><small>修理報酬を受け取りました</small><strong>+${money(report.total)}</strong></div><div class="info-card"><p class="modal-intro" style="margin:0">「無事に動きました！ 本当にありがとうございます。」<br><br>評判 <strong>${report.repChange >= 0 ? '+' : ''}${report.repChange.toFixed(2)}</strong> / 修理完了 <strong>${state().completed} 台</strong></p></div>${state().completed === 3 ? '<div class="fault-note success-note">LEVEL UP! ハイエンドPC・複合故障の依頼が解放されました。</div>' : ''}<button class="primary-button wide-button" data-action="contracts">次の依頼を見る ${icon('arrow-right')}</button><button class="secondary-button wide-button" data-action="business">経営状況を見る</button>`, 'completed'); }),
    'upgrade-confirm': key => { const names = {diagnostic:['プロ用診断装置',14000],supplier:['卸業者との取引契約',18000],bench:['精密電動ツールセット',22000]}; const [name,price] = names[key]; setModal('工房に投資しますか？','INVESTMENT / CONFIRM',`<p class="modal-intro"><strong>${name}</strong> を ${money(price)} で導入します。<br>導入後は取り消しできません。残高は ${money(state().cash-price)} になります。</p><button class="primary-button wide-button" data-action="upgrade" data-key="${key}">設備を導入する</button><button class="secondary-button wide-button" data-action="business">戻る</button>`,'confirm'); },
    upgrade: key => act(() => game.upgrade(key), () => { showBusiness(); toast('工房をアップグレードしました。'); }),
    'loan-confirm': () => setModal('運転資金を借り入れ', 'FINANCE / LOAN', '<p class="modal-intro">¥10,000 を借り入れます。毎日閉店時、借入残高の<strong>1%の利息</strong>が発生します。上限は¥30,000。返済は経営メニューから行えます。</p><button class="primary-button wide-button" data-action="loan">条件に同意して ¥10,000 を借りる</button><button class="secondary-button wide-button" data-action="business">戻る</button>', 'loan'),
    loan: () => act(() => game.loan(), showBusiness), repay: () => act(() => game.repay(), showBusiness),
    'end-day': () => act(() => game.closeDay(), report => { setModal(`DAY ${String(report.day).padStart(2,'0')} の営業レポート`, 'DAILY REPORT / SEE YOU TOMORROW', `<div class="report-amount"><small>本日のキャッシュフロー（融資・売却を含む）</small><strong style="color:${report.profit < 0 ? 'var(--orange)' : 'var(--green)'}">${money(report.profit)}</strong></div><div class="receipt-line"><span>修理売上</span><strong>${money(report.revenue)}</strong></div><div class="receipt-line"><span>その他の入金 / 融資・在庫売却</span><strong>${money(report.otherIncome)}</strong></div><div class="receipt-line"><span>支出合計 / 仕入・投資・固定費等</span><strong>${money(report.expenses)}</strong></div><div class="receipt-line"><span>うち家賃・電気代・利息</span><strong>${money(report.rent+report.interest)}</strong></div><p class="small-note">新しい朝が来ました。依頼ボードが更新されています。<br>現在：DAY ${state().day} / 09:00</p><button class="primary-button wide-button" data-action="close">新しい一日を始める ${icon('arrow-right')}</button>`, 'report'); }),
    'abandon-confirm': () => setModal('この依頼をキャンセル？', 'ORDER / CANCELLATION', '<div class="fault-note">キャンセル料 ¥1,000、評判 −0.30。使用済みパーツは戻りません。</div><button class="danger-button wide-button" data-action="abandon">キャンセルを確定する</button><button class="secondary-button wide-button" data-action="close">修理を続ける</button>', 'confirm'),
    abandon: () => act(() => game.abandon(), () => { closeModal(); toast('依頼をキャンセルしました。'); }),
    'toggle-sound': () => { state().settings.sound = !state().settings.sound; changed(); showSettings(); },
    'toggle-labels': () => { state().settings.labels = !state().settings.labels; changed(); showSettings(); },
    'reset-confirm': () => setModal('すべての進行をリセット', 'SAVE DATA / DELETE', '<div class="fault-note">所持金・修理履歴・在庫・設備がすべて初期状態に戻ります。この操作は取り消せません。</div><button class="danger-button wide-button" data-action="reset">削除して最初から始める</button><button class="secondary-button wide-button" data-action="close">やめる</button>', 'confirm'),
    reset: () => { game.state = window.RepairCore.initialState(); selected = 'cpu'; changed(); closeModal(); toast('新しい工房をオープンしました。'); window.dispatchEvent(new Event('rig-reset-view')); }
  };
  document.addEventListener('click', e => {
    const actionButton = e.target.closest('[data-action]'); if (actionButton && !actionButton.disabled && !busy) { sound(); const fn = actions[actionButton.dataset.action]; if (fn) fn(actionButton.dataset.key); }
    const part = e.target.closest('[data-part]'); if (part && !busy) setSelected(part.dataset.part);
    const nav = e.target.closest('[data-nav]'); if (nav && !busy) { document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b === nav)); const key = nav.dataset.nav; if (key === 'workbench') { closeModal(); $('workbench-panel').scrollIntoView({behavior:'smooth',block:'start'}); } else actions[key](); }
  });
  $('tool-inspect').onclick = showDiagnosis; $('tool-repair').onclick = repairMenu; $('tool-test').onclick = runTest;
  $('tool-panel').onclick = () => act(() => game.panel(), open => toast(open ? '電源を切断し、サイドパネルを外しました。内部を修理できます。' : 'パネルを取り付けました。起動テストができます。'));
  $('tool-clean').onclick = () => act(() => game.clean(), () => { toast('内部のホコリを除去しました。納品時に +¥500。'); window.dispatchEvent(new Event('rig-clean')); });
  $('end-day-button').onclick = endDayConfirm; $('open-contracts-button').onclick = showContracts; $('help-button').onclick = showHelp; $('settings-button').onclick = showSettings;
  $('modal-close').onclick = closeModal; $('modal-backdrop').addEventListener('click',e => { if (e.target === $('modal-backdrop')) closeModal(); });
  $('labels-button').onclick = () => { state().settings.labels = !state().settings.labels; changed(); };
  $('view-side').onclick = () => window.dispatchEvent(new CustomEvent('rig-view', {detail:'side'}));
  $('view-front').onclick = () => window.dispatchEvent(new CustomEvent('rig-view', {detail:'front'}));
  $('view-reset').onclick = () => window.dispatchEvent(new Event('rig-reset-view'));
  document.addEventListener('keydown', e => {
    if ($('modal-backdrop').hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { const els = [...$('modal').querySelectorAll('button:not(:disabled),a,input')].filter(el => el.offsetParent !== null); const first = els[0], last = els.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  window.RigGame = { get state() { return state(); }, get selected() { return selected; }, focus: key => { if(!busy)setSelected(key,false); }, select: key => { if (!busy && $('modal-backdrop').hidden) setSelected(key); }, toast, game };
  paintIcons(); render(); save(); window.dispatchEvent(new Event('rig-ready'));
  // An unobtrusive first-session hint keeps the actual 3D workbench visible.
  if (!stored && !qaMode) setTimeout(() => toast('ようこそ。まずは「診断」で、最初のPCの不具合を調べましょう。'), 4800);
  // Persistent QA/demo entry points render the real application at its real
  // viewport. These isolated sessions never read or overwrite a player's save.
  if (qaMode) {
    state().settings.sound = false; $('save-status').textContent = 'DEMO / NO SAVE';
    const view = new URLSearchParams(location.search).get('view');
    if (view === 'precision' || view === 'timing') { game.diagnose(); game.panel(); changed(); startPrecision('cpu'); if (view === 'timing') [1,2,3,4].forEach(releaseScrew); }
    if (view === 'store') showStore('all');
    if (view === 'business') showBusiness();
    if (view === 'open') { game.panel(); changed(); }
    if (view === 'thermal') { game.diagnose(); changed(); }
    if (view === 'specialist') { const key=new URLSearchParams(location.search).get('part')||'cpu';if(PARTS[key]){selected=key;game.active.faults=[key];state().inventory[PARTS[key].fix]=1;game.diagnose();game.panel();changed();startPrecision(key);startSpecialist();} }
    if (view === 'records') { game.diagnose(); game.panel(); changed(); showServiceRecord(); }
  }
})();
