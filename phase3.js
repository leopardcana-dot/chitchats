/* Phase 3 game systems: property portfolio, investor rounds, exports, insurance, and causal reporting. */
(() => {
  const defaults = {
    ownedProperties:[], propertyListings:[], shareholders:[{name:'Founder',pct:100,type:'founder'}],
    fundingRounds:0,totalRaised:0,lastValuation:0,exportContracts:[],insurancePolicies:[],
    insuranceClaimsYTD:0,lastQuarterExplanations:[],previousSnapshot:{},_pendingInvestorOffer:null,
    totalExportRevenue:0
  };
  Object.assign(sim,defaults);
  const propertyTypes=[
    {id:'office',name:'Regional Office',basePrice:48000,capacity:7000,rentIncome:2200,maintCost:500,lifeQuarters:80},
    {id:'warehouse',name:'Warehouse',basePrice:62000,capacity:11000,rentIncome:2800,maintCost:750,lifeQuarters:100},
    {id:'retail',name:'Retail Location',basePrice:39000,capacity:5000,rentIncome:1800,maintCost:400,lifeQuarters:72}
  ];
  const investorTypes=[
    {name:'Local Angel',minRevenue:0,minProfit:0,valuationMult:3,maxPct:15},
    {name:'Regional Fund',minRevenue:25000,minProfit:0,valuationMult:5,maxPct:20},
    {name:'Growth Capital',minRevenue:100000,minProfit:15000,valuationMult:7,maxPct:25}
  ];
  const products=[
    {id:'property',name:'Property Insurance',rate:.012,coverage:100000,deductible:.1,quarters:4},
    {id:'equipment',name:'Equipment Insurance',rate:.018,coverage:50000,deductible:.05,quarters:4},
    {id:'cyber',name:'Cyber Insurance',rate:.025,coverage:40000,deductible:.15,quarters:4},
    {id:'liability',name:'Liability Insurance',rate:.01,coverage:80000,deductible:.2,quarters:4},
    {id:'supply',name:'Supply Interruption',rate:.015,coverage:30000,deductible:.1,quarters:4}
  ];
  const exportTemplates=[
    {marketId:'regional',marketName:'Regional Markets',qualityReq:50,baseUnits:120,pricePerUnit:110,minQuarters:4},
    {marketId:'eu',marketName:'EU Markets',qualityReq:70,baseUnits:90,pricePerUnit:190,minQuarters:4},
    {marketId:'global',marketName:'Global Markets',qualityReq:85,baseUnits:70,pricePerUnit:280,minQuarters:6}
  ];
  const money=n=>typeof fmt==='function'?fmt(n):`€${Math.round(n).toLocaleString()}`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureUI(){
    const bar=document.querySelector('.tab-bar');
    const tabs=[['realestate','REAL ESTATE'],['investors','INVESTORS'],['exports','EXPORTS'],['insurance','INSURANCE']];
    if(bar)tabs.forEach(([id,label])=>{if(!document.querySelector(`[data-phase3-tab="${id}"]`)){const b=document.createElement('button');b.className='tab-btn';b.dataset.phase3Tab=id;b.textContent=label;b.onclick=e=>switchTab(id,e);bar.appendChild(b);}});
    const game=document.getElementById('game-screen');if(!game)return;
    const panels={
      realestate:`<div class="grid-2"><div class="panel"><div class="panel-hdr">PROPERTY MARKET</div><div class="panel-body"><div id="p3-property-listings"></div><button onclick="refreshPropertyMarket()">Refresh listings (€500)</button></div></div><div class="panel"><div class="panel-hdr">OWNED PROPERTIES</div><div class="panel-body"><div id="p3-owned-properties"></div><hr><div class="stat-row"><span>PORTFOLIO VALUE</span><span id="p3-portfolio">€0</span></div><div class="stat-row"><span>QUARTERLY RENT</span><span id="p3-rent">€0</span></div><div class="stat-row"><span>MAINTENANCE</span><span id="p3-maint">€0</span></div></div></div></div>`,
      investors:`<div class="grid-2"><div class="panel"><div class="panel-hdr">CAPITAL RAISING</div><div class="panel-body"><div class="stat-row"><span>PRE-MONEY VALUATION</span><span id="p3-valuation">€0</span></div><div class="stat-row"><span>TOTAL RAISED</span><span id="p3-raised">€0</span></div><div class="stat-row"><span>ROUNDS</span><span id="p3-rounds">0</span></div><div id="p3-investor-offer"></div><button onclick="seekInvestor()">Seek investor</button><button onclick="payDividends()">Pay dividends</button></div></div><div class="panel"><div class="panel-hdr">SHAREHOLDERS</div><div class="panel-body"><div id="p3-shareholders"></div></div></div></div>`,
      exports:`<div class="grid-2"><div class="panel"><div class="panel-hdr">EXPORT CONTRACTS</div><div class="panel-body"><div id="p3-export-contracts"></div><button onclick="seekExportContracts()">Seek contracts</button></div></div><div class="panel"><div class="panel-hdr">EXPORT READINESS</div><div class="panel-body"><div class="stat-row"><span>QUALITY</span><span id="p3-exp-quality">0</span></div><div class="stat-row"><span>FINISHED GOODS</span><span id="p3-exp-stock">0</span></div><div class="stat-row"><span>EXPORT REVENUE</span><span id="p3-exp-revenue">€0</span></div><div id="p3-markets"></div></div></div></div>`,
      insurance:`<div class="grid-2"><div class="panel"><div class="panel-hdr">INSURANCE PRODUCTS</div><div class="panel-body"><div id="p3-insurance-products"></div></div></div><div class="panel"><div class="panel-hdr">ACTIVE POLICIES</div><div class="panel-body"><div id="p3-policies"></div><div class="stat-row"><span>CLAIMS THIS YEAR</span><span id="p3-claims">€0</span></div></div></div></div>`
    };
    Object.entries(panels).forEach(([id,html])=>{if(!document.getElementById('tab-'+id)){const el=document.createElement('div');el.id='tab-'+id;el.className='tab-content';el.innerHTML=html;game.appendChild(el);}});
  }
  function refreshPropertyMarket(free=false){
    if(!free&&sim.cash<500){toast('Need €500 to refresh listings.','error');return;}if(!free)sim.cash-=500;
    const cities=Object.keys(CITY_DATA).filter(c=>c!==sim.city).sort(()=>Math.random()-.5).slice(0,3);
    sim.propertyListings=cities.map((city,i)=>{const t=propertyTypes[Math.floor(Math.random()*propertyTypes.length)];const mod=.7+(CITY_DATA[city].purchPower||.85)*.6;return{id:`p${Date.now()}${i}`,typeName:t.name,city,purchasePrice:Math.round(t.basePrice*mod),capacity:t.capacity,rentIncome:t.rentIncome,maintCost:t.maintCost,lifeQuarters:t.lifeQuarters,condition:70+Math.floor(Math.random()*31)};});render();updateUI();
  }
  function buyProperty(id){const p=sim.propertyListings.find(x=>x.id===id);if(!p)return;if(sim.cash<p.purchasePrice){toast(`Need ${money(p.purchasePrice)}`,'error');return;}sim.cash-=p.purchasePrice;sim.ownedProperties.push({...p,marketValue:p.purchasePrice,ageQuarters:0});sim.propertyListings=sim.propertyListings.filter(x=>x.id!==id);sim.propValue+=p.purchasePrice;logMsg(`Purchased ${p.typeName} in ${p.city}.`,'good');render();updateUI();}
  function sellProperty(id){const p=sim.ownedProperties.find(x=>x.id===id);if(!p)return;const proceeds=Math.round((p.marketValue||p.purchasePrice)*.8);sim.cash+=proceeds;sim.propValue=Math.max(0,sim.propValue-p.purchasePrice);sim.ownedProperties=sim.ownedProperties.filter(x=>x.id!==id);toast(`Sold for ${money(proceeds)}.`,'success');render();updateUI();}
  function seekInvestor(){const rev=sim.totalRevenue||0,profit=sim.lastQ.profit||0;const eligible=investorTypes.filter(x=>rev>=x.minRevenue&&profit>=x.minProfit);if(!eligible.length){toast('Build revenue and profit before seeking capital.','warning');return;}const type=eligible[Math.floor(Math.random()*eligible.length)];const assets=sim.cash+sim.propValue+sim.equipmentValue;const liabilities=sim.loanPrincipal+sim.overdraftDrawn;const valuation=Math.max(sim.cash*1.5,Math.max(0,sim.lastQ.ebitda||0)*type.valuationMult+(assets-liabilities)*.5);const investment=Math.max(5000,Math.round(valuation*type.maxPct/100*(.5+Math.random()*.5)));sim._pendingInvestorOffer={name:type.name,valuation,investment,pct:investment/(valuation+investment)*100};render();}
  function acceptInvestorOffer(){const o=sim._pendingInvestorOffer;if(!o)return;sim.cash+=o.investment;sim.investorEquity+=o.pct/100;sim.totalRaised+=o.investment;sim.fundingRounds++;sim.lastValuation=o.valuation;sim.shareholders.push({name:o.name,pct:o.pct,type:'investor'});sim.shareholders[0].pct=Math.max(0,sim.shareholders[0].pct-o.pct);sim._pendingInvestorOffer=null;logMsg(`${o.name} invested ${money(o.investment)} for ${o.pct.toFixed(1)}%.`,'good');render();updateUI();}
  function declineInvestorOffer(){sim._pendingInvestorOffer=null;render();}
  function payDividends(){const amount=Math.max(0,Math.round((sim.lastQ.profit||0)*.1));if(!amount){toast('No positive profit available for dividends.','warning');return;}if(sim.cash<amount){toast('Insufficient cash for dividends.','error');return;}sim.cash-=amount;sim.shareholders.filter(s=>s.type!=='founder').forEach(s=>{s.lastDividend=amount*s.pct/100;});logMsg(`Paid ${money(amount)} in dividends.`,'info');updateUI();render();}
  function seekExportContracts(){const unlocked=['regional'];if(sim.researchUnlocked.includes('exp1'))unlocked.push('eu');if(sim.researchUnlocked.includes('exp2'))unlocked.push('global');const template=exportTemplates.filter(t=>unlocked.includes(t.marketId)&&sim.quality>=t.qualityReq*.8)[Math.floor(Math.random()*exportTemplates.filter(t=>unlocked.includes(t.marketId)&&sim.quality>=t.qualityReq*.8).length)];if(!template){toast('Improve quality or unlock more markets first.','warning');return;}if(sim.exportContracts.filter(c=>c.status==='offered').length>=3){toast('Resolve current offers first.','warning');return;}sim.exportContracts.push({id:`e${Date.now()}`, ...template,unitsPerQ:Math.round(template.baseUnits*(.7+Math.random()*.5)),quartersLeft:4+Math.floor(Math.random()*5),status:'offered'});render();}
  function acceptExportContract(id){const c=sim.exportContracts.find(x=>x.id===id);if(!c||c.status!=='offered')return;c.status='active';render();toast('Export contract accepted.','success');}
  function rejectExportContract(id){sim.exportContracts=sim.exportContracts.filter(x=>x.id!==id);render();}
  function buyInsurance(id){const p=products.find(x=>x.id===id);if(!p)return;const premium=Math.round(p.coverage*p.rate/4);if(sim.cash<premium){toast(`Need ${money(premium)} first-quarter premium.`,'error');return;}sim.cash-=premium;sim.insurancePolicies.push({id:`${id}-${Date.now()}`,typeId:id,name:p.name,coverage:p.coverage,deductible:p.deductible,quartersLeft:p.quarters,quarterlyPremium:premium});render();updateUI();}
  function cancelInsurance(id){sim.insurancePolicies=sim.insurancePolicies.filter(p=>p.id!==id);render();}
  function render(){
    ensureUI();const put=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    const listings=document.getElementById('p3-property-listings');if(listings)listings.innerHTML=(sim.propertyListings||[]).map(p=>`<div class="stat-row"><span>${esc(p.typeName)} · ${esc(p.city)} · ${money(p.purchasePrice)}</span><button onclick="buyProperty('${p.id}')">Buy</button></div>`).join('')||'No listings. Refresh the market to see properties.';
    const owned=document.getElementById('p3-owned-properties');if(owned)owned.innerHTML=(sim.ownedProperties||[]).map(p=>`<div class="stat-row"><span>${esc(p.typeName)} · ${esc(p.city)} · ${money(p.marketValue||p.purchasePrice)}</span><button onclick="sellProperty('${p.id}')">Sell</button></div>`).join('')||'No properties owned.';
    put('p3-portfolio',money((sim.ownedProperties||[]).reduce((a,p)=>a+(p.marketValue||p.purchasePrice),0)));put('p3-rent',money((sim.ownedProperties||[]).reduce((a,p)=>a+p.rentIncome,0)));put('p3-maint',money((sim.ownedProperties||[]).reduce((a,p)=>a+p.maintCost,0)));
    put('p3-valuation',money(sim.lastValuation||0));put('p3-raised',money(sim.totalRaised||0));put('p3-rounds',sim.fundingRounds||0);
    const offer=document.getElementById('p3-investor-offer');if(offer)offer.innerHTML=sim._pendingInvestorOffer?`<div>${esc(sim._pendingInvestorOffer.name)} offers ${money(sim._pendingInvestorOffer.investment)} for ${sim._pendingInvestorOffer.pct.toFixed(1)}% equity. <button onclick="acceptInvestorOffer()">Accept</button><button onclick="declineInvestorOffer()">Decline</button></div>`:'';
    const sh=document.getElementById('p3-shareholders');if(sh)sh.innerHTML=(sim.shareholders||[]).map(x=>`<div class="stat-row"><span>${esc(x.name)}</span><span>${x.pct.toFixed(1)}%</span></div>`).join('');
    const contracts=document.getElementById('p3-export-contracts');if(contracts)contracts.innerHTML=(sim.exportContracts||[]).map(c=>`<div class="stat-row"><span>${esc(c.marketName)} · ${c.unitsPerQ} units/Q · Q${c.quartersLeft} · ${c.status}</span>${c.status==='offered'?`<button onclick="acceptExportContract('${c.id}')">Accept</button><button onclick="rejectExportContract('${c.id}')">Decline</button>`:''}</div>`).join('')||'No contracts. Seek an offer.';
    put('p3-exp-quality',Math.round(sim.quality));put('p3-exp-stock',sim.finishedGoods||0);put('p3-exp-revenue',money(sim.exportRevenue||0));
    const markets=document.getElementById('p3-markets');if(markets)markets.innerHTML=exportTemplates.map(m=>`<div>${esc(m.marketName)} — quality ${m.qualityReq}+ ${m.marketId==='regional'||sim.researchUnlocked.includes(m.marketId==='eu'?'exp1':'exp2')?'UNLOCKED':'LOCKED'}</div>`).join('');
    const ins=document.getElementById('p3-insurance-products');if(ins)ins.innerHTML=products.map(p=>`<div class="stat-row"><span>${esc(p.name)} · cover ${money(p.coverage)} · ${p.quarters}Q</span><button onclick="buyInsurance('${p.id}')">Buy</button></div>`).join('');
    const policies=document.getElementById('p3-policies');if(policies)policies.innerHTML=(sim.insurancePolicies||[]).map(p=>`<div class="stat-row"><span>${esc(p.name)} · ${p.quartersLeft}Q · ${money(p.coverage)}</span><button onclick="cancelInsurance('${p.id}')">Cancel</button></div>`).join('')||'No active policies.';put('p3-claims',money(sim.insuranceClaimsYTD||0));
  }
  Object.assign(window,{refreshPropertyMarket,buyProperty,sellProperty,seekInvestor,acceptInvestorOffer,declineInvestorOffer,payDividends,seekExportContracts,acceptExportContract,rejectExportContract,buyInsurance,cancelInsurance});
  const oldStart=startGame;
  startGame=function(){Object.assign(sim,{...defaults,ownedProperties:[],propertyListings:[],shareholders:[{name:'Founder',pct:100,type:'founder'}],exportContracts:[],insurancePolicies:[],lastQuarterExplanations:[],previousSnapshot:{}});oldStart.apply(this,arguments);setTimeout(()=>{if(!sim.propertyListings.length)refreshPropertyMarket(true);render();},180);};
  const oldUpdate=updateUI;updateUI=function(){oldUpdate.apply(this,arguments);render();};
  const oldCapacity=getTotalCapacity;getTotalCapacity=function(){return oldCapacity()+(sim.ownedProperties||[]).reduce((n,p)=>n+Math.round((p.capacity||0)*(p.condition||100)/100),0);};
  const oldQuarter=executeQuarter;executeQuarter=function(){const cash0=sim.cash,q0=sim.quarter;oldQuarter.apply(this,arguments);if(!sim.city||sim.quarter===q0)return;
    let rent=0,maintenance=0;(sim.ownedProperties||[]).forEach(p=>{rent+=p.rentIncome;maintenance+=p.maintCost;p.ageQuarters=(p.ageQuarters||0)+1;p.marketValue=Math.max(p.purchasePrice*.3,p.purchasePrice*(1-.7*p.ageQuarters/p.lifeQuarters));});
    sim.cash+=rent-maintenance;let exportRev=0;for(const c of (sim.exportContracts||[]).filter(x=>x.status==='active')){if(sim.quality>=c.qualityReq&&sim.finishedGoods>0){const units=Math.min(c.unitsPerQ,sim.finishedGoods);sim.finishedGoods-=units;exportRev+=units*c.pricePerUnit;}c.quartersLeft--;}
    sim.exportContracts=sim.exportContracts.filter(c=>c.quartersLeft>0);if(sim.researchUnlocked.includes('exp4'))exportRev*=1.25;if(sim.researchUnlocked.includes('exp5'))exportRev*=1.35;if(sim.researchUnlocked.includes('auto7'))exportRev*=1.2;sim.exportRevenue=Math.round(exportRev);sim.totalExportRevenue=(sim.totalExportRevenue||0)+exportRev;sim.cash+=exportRev;
    let premiums=0;sim.insurancePolicies.forEach(p=>{premiums+=p.quarterlyPremium||0;p.quartersLeft--;});sim.insurancePolicies=sim.insurancePolicies.filter(p=>p.quartersLeft>0);sim.cash-=Math.min(Math.max(0,sim.cash),premiums);
    const extra=rent-maintenance-premiums+exportRev;sim.lastQ.revenue=(sim.lastQ.revenue||0)+exportRev;sim.lastQ.profit=(sim.lastQ.profit||0)+extra;sim.totalRevenue=(sim.totalRevenue||0)+exportRev;
    if(sim.cash<0&&cash0>=0)toast('Expansion costs have reduced available cash.','warning');render();updateUI();
  };
  const oldSwitch=switchTab;switchTab=function(name,event){oldSwitch.apply(this,arguments);if(['realestate','investors','exports','insurance'].includes(name))render();};
})();
