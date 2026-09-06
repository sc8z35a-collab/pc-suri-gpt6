/* Deterministic, framework-independent repair and economy rules. */
(function () {
  'use strict';
  const PARTS = {
    cpu: { name: 'CPU / 冷却ユニット', short: 'CPU', model: 'RYZEN 7 7800X · 8 CORE', icon: 'chip', spec: '8コア / 16スレッド', normal: '38°C / 4.2 GHz', fault: '冷却グリスが硬化。CPUが98°Cに達し、安全装置が作動しています。', fix: 'paste' },
    ram: { name: 'メモリ', short: 'RAM', model: 'VENGEANCE DDR5 · 32GB', icon: 'ram', spec: 'DDR5-5600 / 2 × 16GB', normal: '32 GB / エラー 0', fault: 'メモリセルに読み書きエラー。交換用DDR5キットが必要です。', fix: 'ram' },
    gpu: { name: 'グラフィックボード', short: 'GPU', model: 'GEFORCE RTX 4070 · 12GB', icon: 'gpu', spec: '12GB GDDR6X / PCIe 4.0', normal: '46°C / 12 GB', fault: 'VRAMテストが失敗。画面の乱れはGPUの物理故障が原因です。', fix: 'gpu' },
    ssd: { name: 'ストレージ', short: 'SSD', model: 'NOVA 980 NVMe · 1TB', icon: 'ssd', spec: 'NVMe M.2 / PCIe 4.0 / 1TB', normal: '健康度 100% / 36°C', fault: 'SMART重大警告。読み込み不良のためNVMe SSDの交換が必要です。', fix: 'ssd' },
    psu: { name: '電源ユニット', short: 'PSU', model: 'CORSAIR RM750 · GOLD', icon: 'power', spec: '750W / 80 PLUS GOLD', normal: '12.02 V / 安定', fault: '12Vレールの電圧が不安定。電源ユニットを交換してください。', fix: 'psu' },
    fan: { name: 'ケースファン', short: 'FAN', model: 'SPECTRA ARGB · 120mm', icon: 'wind', spec: '120mm × 3 / ARGB', normal: '1,200 RPM / 24 dB', fault: '軸受けが摩耗し回転が不安定。ファンキットの交換が必要です。', fix: 'fan' }
  };
  const CATALOG = {
    paste: { name: 'MX-6 サーマルグリス', description: 'CPUの熱伝導を回復 · 1回分', price: 800, icon: 'drop', category: 'supply' },
    ram: { name: 'DDR5 32GB メモリキット', description: '5600MHz · 16GB × 2 · 全依頼に適合', price: 6200, icon: 'ram', category: 'part' },
    ssd: { name: 'NVMe M.2 SSD 1TB', description: 'PCIe 4.0 · 7,000 MB/s · 全依頼に適合', price: 5800, icon: 'ssd', category: 'part' },
    psu: { name: '750W GOLD 電源', description: 'フルモジュラー · 80 PLUS GOLD', price: 7400, icon: 'power', category: 'part' },
    fan: { name: 'ARGB 120mm ファンキット', description: '静音ベアリング · 3基セット', price: 2100, icon: 'wind', category: 'part' },
    gpu: { name: 'RTX 4070 12GB GPU', description: 'GDDR6X · トリプルファン', price: 32800, icon: 'gpu', category: 'part' }
  };
  const TEMPLATES = [
    { title: 'ゲーム中に、突然落ちる。', customer: '佐藤 翔太', initial: '翔', type: 'ゲーマー / 常連のお客様', symptom: '最近、ゲームを始めて少しすると電源が落ちるんです。ファンの音も前より大きくて…。', faults: ['cpu'], reward: 8500, name: 'NEBULA G7', tier: '基本の修理', days: 2 },
    { title: 'ブルースクリーンの毎日。', customer: '高橋 美咲', initial: '美', type: 'デザイナー / はじめてのお客様', symptom: '作業中に青い画面になってしまいます。保存する前に落ちてしまうので困っています。', faults: ['ram'], reward: 15400, name: 'STUDIO X5', tier: '基本の修理', days: 2 },
    { title: '起動しなくなった相棒。', customer: '鈴木 悠人', initial: '悠', type: 'エンジニア / はじめてのお客様', symptom: '電源ランプはつくのにOSが起動しません。データはバックアップ済みなので、また使えるように！', faults: ['ssd'], reward: 14200, name: 'ORBIT S1', tier: '基本の修理', days: 2 },
    { title: 'スイッチを押しても、無反応。', customer: '伊藤 直樹', initial: '直', type: '動画編集者 / ご紹介のお客様', symptom: '昨日まで動いていたのに、今朝から電源が入りません。なるべく早めにお願いしたいです。', faults: ['psu'], reward: 17200, name: 'ECLIPSE R8', tier: '電源トラブル', days: 1 },
    { title: '静かな部屋に、異音が響く。', customer: '小林 結衣', initial: '結', type: '配信者 / はじめてのお客様', symptom: 'ケースの前からカラカラと音がします。マイクにも入ってしまって、配信ができません。', faults: ['fan'], reward: 9800, name: 'AURORA Z3', tier: '基本の修理', days: 2 },
    { title: '画面いっぱいのノイズ。', customer: '渡辺 蓮', initial: '蓮', type: '3Dアーティスト / プロ向けの依頼', symptom: 'レンダリングをすると画面にカラフルな線が出ます。グラフィック周りを確認してほしいです。', faults: ['gpu'], reward: 48700, name: 'TITAN PRO', tier: 'ハイエンド修理', days: 3 },
    { title: '大切な一台を、完全復活。', customer: '中村 葵', initial: '葵', type: '映像制作スタジオ / 法人のお客様', symptom: '負荷をかけると落ちますし、青い画面も出ます。長時間安心して使えるように整備してください。', faults: ['cpu', 'ram'], reward: 25200, name: 'FORGE ULTRA', tier: '複合トラブル', days: 2 }
  ];
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const blankJob = (template, id, day) => ({ ...clone(template), id, acceptedDay: day, due: day + template.days, diagnosed: [], repaired: [], panelOpen: false, tested: false, cleaned: false, powered: false, premium: 0, partCosts: 0, precisionBonus: 0 });
  function initialState() {
    return { version: 1, day: 1, minute: 540, cash: 32000, rep: 4.2, completed: 0, revenue: 0, expenses: 0, debt: 0, upgrades: { diagnostic: false, supplier: false, bench: false }, inventory: { paste: 2, ram: 1 }, premiumStock: {}, active: blankJob(TEMPLATES[0], '0042', 1), accepted: [], ledger: [], days: [], settings: { sound: true, labels: true }, nextId: 43 };
  }
  class RepairGame {
    constructor(state) { this.state = state && state.version === 1 ? clone(state) : initialState(); }
    get level() { return 1 + Math.floor(this.state.completed / 3); }
    logWork(action, part = null, details = '') {
      const job = this.active; job.serviceLog ||= [];
      job.serviceLog.push({ day: this.state.day, minute: this.state.minute, action, part, details });
      job.serviceLog = job.serviceLog.slice(-100);
    }
    readings(part) {
      const job=this.active,known=job.diagnosed.includes(part),faulty=job.faults.includes(part)&&!job.repaired.includes(part);
      const reference={cpu:[['CPU温度',faulty?'98°C':'38°C'],['Vcore','1.25 V'],['クロック',faulty?'0.8 GHz':'4.2 GHz']],ram:[['認識容量','32 GB'],['テストエラー',faulty?'127':'0'],['転送レート','5600 MT/s']],gpu:[['GPU温度',faulty?'87°C':'46°C'],['VRAMエラー',faulty?'64':'0'],['PCIeリンク','4.0 ×16']],ssd:[['健康度',faulty?'8%':'100%'],['読込速度',faulty?'43 MB/s':'7000 MB/s'],['NAND温度',faulty?'68°C':'36°C']],psu:[['12Vレール',faulty?'10.41 V':'12.02 V'],['5Vレール',faulty?'4.32 V':'5.01 V'],['リップル',faulty?'184 mV':'24 mV']],fan:[['回転数',faulty?'320 RPM':'1200 RPM'],['振動',faulty?'4.8 mm/s':'0.4 mm/s'],['騒音',faulty?'48 dBA':'24 dBA']]};
      return (reference[part]||[]).map(([label,value])=>({label,value:known?value:'未測定'}));
    }
    get remaining() { return 1080 - this.state.minute; }
    get reputationMultiplier() { return .6 + this.state.rep * .1; }
    get active() { if (!this.state.active) throw new Error('まず修理依頼を受けましょう。'); return this.state.active; }
    spendTime(minutes) { if (this.state.minute + minutes > 1080) throw new Error('本日の作業時間が足りません。「営業を終える」で翌日へ。'); this.state.minute += minutes; }
    get dailyTotals() {
      if (!this.state.dailyTotals || this.state.dailyTotals.day !== this.state.day) {
        const entries = this.state.ledger.filter(l => l.day === this.state.day);
        this.state.dailyTotals = { day: this.state.day, income: entries.filter(l => l.amount > 0).reduce((v,l) => v+l.amount,0), outgoing: entries.filter(l => l.amount < 0).reduce((v,l) => v-l.amount,0), revenue: entries.filter(l => l.label.startsWith('修理納品')).reduce((v,l) => v+l.amount,0) };
      }
      return this.state.dailyTotals;
    }
    transaction(label, amount) {
      if (this.state.cash + amount < 0) throw new Error('所持金が足りません。経営メニューで融資を受けられます。');
      const totals = this.dailyTotals;
      this.state.cash += amount;
      if (amount < 0) { this.state.expenses -= amount; totals.outgoing -= amount; } else totals.income += amount;
      if (label.startsWith('修理納品')) totals.revenue += amount;
      this.state.ledger.unshift({ day: this.state.day, label, amount }); this.state.ledger = this.state.ledger.slice(0, 60);
    }
    diagnose(part) { const job = this.active; const time = this.state.upgrades.diagnostic ? 15 : 40; this.spendTime(part ? Math.ceil(time / 2) : time); const keys = part ? [part] : Object.keys(PARTS); keys.forEach(k => { if (!job.diagnosed.includes(k)) job.diagnosed.push(k); }); const faults=keys.filter(k => job.faults.includes(k) && !job.repaired.includes(k)); this.logWork(part?'個別診断':'全体診断',part||null,faults.length?'異常検出：'+faults.map(k=>PARTS[k].short).join(' / '):'検査対象は正常'); return faults; }
    panel() { const job = this.active; this.spendTime(5); job.powered = false; job.panelOpen = !job.panelOpen; if (job.panelOpen) job.tested = false; this.logWork(job.panelOpen?'サイドパネル取り外し':'サイドパネル復旧',null,'電源切断・ESD対策済み'); return job.panelOpen; }
    repair(part, premium = false, precision = 0, technique = '精度ゲージ / 自動作業') {
      const job = this.active;
      if (!PARTS[part]) throw new Error('修理するパーツを選択してください。');
      if (!job.panelOpen) throw new Error('先にサイドパネルを外してください。');
      if (job.powered) throw new Error('安全のため電源を切ってください。');
      if (!job.diagnosed.includes(part)) throw new Error('先にこのパーツを診断してください。');
      if (!job.faults.includes(part) || job.repaired.includes(part)) throw new Error('このパーツは正常です。交換する必要はありません。');
      const item = PARTS[part].fix, stock = premium ? this.state.premiumStock : this.state.inventory;
      if (!(stock[item] > 0)) throw new Error('適合パーツがありません。パーツショップで仕入れてください。');
      this.spendTime(this.state.upgrades.bench ? 20 : (part === 'cpu' ? 30 : 40));
      stock[item]--; job.repaired.push(part); job.tested = false; job.premium += premium ? 1 : 0; job.precisionBonus = (job.precisionBonus || 0) + (precision >= 85 ? 800 : precision >= 60 ? 400 : 0); job.partCosts += Math.round(CATALOG[item].price * (premium ? 1.35 : 1)); this.logWork('修理・交換完了',part,`${premium?'高品質':'標準'} / ${technique} / 精度 ${Math.max(0,Math.min(100,Math.round(precision)))}%`); return PARTS[part].name;
    }
    clean() { const job = this.active; if (!job.panelOpen) throw new Error('先にサイドパネルを外してください。'); if (job.cleaned) throw new Error('すでにクリーニング済みです。'); this.spendTime(20); job.cleaned = true; job.powered = false; job.tested = false; this.logWork('内部クリーニング',null,'基板・吸気フィルター・冷却フィンの除塵'); }
    test() { const job = this.active; if (job.panelOpen) throw new Error('安全のためパネルを取り付けてからテストしてください。'); this.spendTime(30); const faults = job.faults.filter(k => !job.repaired.includes(k)); job.tested = !faults.length; job.powered = !faults.includes('psu'); this.logWork('起動・安定性テスト',null,faults.length?'FAIL：'+faults.map(k=>PARTS[k].short).join(' / '):'全5項目 PASS / OS起動・負荷テスト完了'); return { pass: !faults.length, faults }; }
    quote() { const job = this.active; const lateDays = Math.max(0, this.state.day - job.due); const penalty = Math.round(job.reward * Math.min(.6, lateDays * .15)); const cleanBonus = job.cleaned ? 500 : 0; const premiumBonus = job.premium * 2000; const precisionBonus = job.precisionBonus || 0; return { base: job.reward, cleanBonus, premiumBonus, precisionBonus, penalty, lateDays, total: job.reward + cleanBonus + premiumBonus + precisionBonus - penalty }; }
    deliver() {
      const job = this.active;
      if (!job.tested || job.panelOpen || job.faults.some(k => !job.repaired.includes(k))) throw new Error('修理を完了し、パネルを戻して起動テストを通過してください。');
      const q = this.quote(); this.transaction('修理納品 #' + job.id, q.total); this.state.revenue += q.total; this.state.completed++;
      const repChange = .08 + (job.cleaned ? .04 : 0) + job.premium * .04 - q.lateDays * .15;
      this.state.rep = Math.round(Math.max(1, Math.min(5, this.state.rep + repChange)) * 100) / 100;
      this.logWork('お客様へ納品',null,`受取 ¥${q.total.toLocaleString('ja-JP')}`);
      this.state.serviceArchives ||= [];this.state.serviceArchives.unshift({id:job.id,name:job.name,title:job.title,customer:job.customer,day:this.state.day,total:q.total,records:clone(job.serviceLog||[])});this.state.serviceArchives=this.state.serviceArchives.slice(0,25);
      this.state.active = null; return { ...q, title: job.title, repChange, materialCost: job.partCosts, profit: q.total - job.partCosts };
    }
    offers() {
      const start = (this.state.day - 1 + this.state.completed) % 5;
      const templates = this.level >= 2 ? TEMPLATES : TEMPLATES.slice(0, 5);
      const list = [];
      for (let i = 0; i < templates.length; i++) {
        const index = (start + i + 1) % templates.length, key = `${this.state.day}-${index}`;
        if (this.state.accepted.includes(key)) continue;
        list.push({ ...clone(templates[index]), reward: Math.round(templates[index].reward * this.reputationMultiplier / 100) * 100, key, index });
        if (list.length === 3) break;
      }
      return list;
    }
    accept(key) { if (this.state.active) throw new Error('作業台は1台です。現在の依頼を先に納品してください。'); const offer = this.offers().find(o => o.key === key); if (!offer) throw new Error('この依頼は現在受けられません。'); this.state.active = blankJob(offer, String(this.state.nextId++).padStart(4, '0'), this.state.day); this.state.accepted.push(key); return this.state.active; }
    price(item, premium = false) { return Math.round(CATALOG[item].price * (premium ? 1.35 : 1) * (this.state.upgrades.supplier ? .9 : 1)); }
    buy(item, premium = false) { if (!CATALOG[item]) throw new Error('商品が見つかりません。'); const price = this.price(item, premium); if (this.state.cash < price) throw new Error('所持金が足りません。経営メニューで融資を受けられます。'); this.spendTime(10); this.transaction(`${premium ? '高品質 ' : ''}${CATALOG[item].name} 仕入れ`, -price); const stock = premium ? this.state.premiumStock : this.state.inventory; stock[item] = (stock[item] || 0) + 1; }
    sell(item, premium = false) { const stock = premium ? this.state.premiumStock : this.state.inventory; if (!(stock[item] > 0)) throw new Error('在庫がありません。'); stock[item]--; const value = Math.round(this.price(item, premium) * .6); this.transaction(CATALOG[item].name + ' 売却', value); return value; }
    upgrade(key) { const prices = { diagnostic: 14000, supplier: 18000, bench: 22000 }; if (!prices[key]) throw new Error('設備が見つかりません。'); if (this.state.upgrades[key]) throw new Error('導入済みです。'); this.transaction('工房設備投資', -prices[key]); this.state.upgrades[key] = true; }
    loan() { if (this.state.debt >= 30000) throw new Error('融資上限は ¥30,000 です。不要な在庫を売却するか、依頼を完了しましょう。'); this.state.debt += 10000; this.transaction('事業融資', 10000); }
    repay() { const value = Math.min(this.state.debt, 10000); if (!value) throw new Error('借入金はありません。'); this.transaction('融資返済', -value); this.state.debt -= value; }
    abandon() { this.active; if (this.state.cash < 1000) throw new Error('キャンセル料 ¥1,000 が必要です。'); this.transaction('依頼キャンセル料', -1000); this.state.rep = Math.max(1, Math.round((this.state.rep - .3) * 100) / 100); this.state.active = null; }
    closeDay() {
      const rent = 1800, interest = Math.round(this.state.debt * .01), cost = rent + interest;
      if (this.state.cash < cost) throw new Error('固定費を支払えません。在庫の売却か融資で資金を用意してください。');
      const { revenue, income, outgoing: out } = this.dailyTotals;
      this.transaction('家賃・電気代', -rent); if (interest) this.transaction('融資利息 (1%)', -interest);
      const report = { day: this.state.day, revenue, otherIncome: income - revenue, expenses: out + cost, profit: income - out - cost, rent, interest };
      this.state.days.push(report); this.state.days = this.state.days.slice(-14); this.state.day++; this.state.minute = 540; this.state.accepted = []; return report;
    }
  }
  window.RepairCore = { RepairGame, PARTS, CATALOG, initialState, TEMPLATES };
})();
