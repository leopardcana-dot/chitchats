/* Phase 2 game systems: workforce depth, production, supplier contracts, and customer funnel. */
(() => {
  const defaults = {
    fatigue: 0, avgLoyalty: 70, trainingLevel: 0, lastReviewQ: 0,
    rawMaterials: 0, workInProgress: 0, finishedGoods: 0, spoilageRate: 0.02,
    supplierContract: { id: 'standard', quartersLeft: 0, minOrder: 0, priceMod: 1 },
    customers: 100, customerAcquisitionCost: 0, customerLifetimeValue: 0,
    competitorIntel: [], supplyEvents: [], _pendingSpoilageControl: 0
  };
  Object.assign(sim, defaults);

  const recipes = {
    Tech:{rawPerUnit:.4}, Hospitality:{rawPerUnit:.7}, Manufacturing:{rawPerUnit:1},
    Retail:{rawPerUnit:.9}, Agriculture:{rawPerUnit:.8}, Construction:{rawPerUnit:1.2},
    Logistics:{rawPerUnit:.5}, Healthcare:{rawPerUnit:.6}
  };
  const contractTerms = {
    budget:{quarters:4,minOrder:0,priceMod:1,breakPenalty:500},
    standard:{quarters:8,minOrder:20,priceMod:1,breakPenalty:2000},
    premium:{quarters:12,minOrder:40,priceMod:1.25,breakPenalty:5000}
  };
  const channels = [
    {name:'Digital',costPerLead:15,convRate:.08},
    {name:'Traditional',costPerLead:35,convRate:.05},
    {name:'PR',costPerLead:60,convRate:.12}
  ];

  function ensureUI(){
    const bar=document.querySelector('.tab-bar');
    if(bar&&!document.querySelector('[data-phase2-tab]')){
      const button=document.createElement('button');
      button.className='tab-btn';button.dataset.phase2Tab='true';button.innerHTML='<i class="fas fa-industry"></i> PRODUCTION';
      button.onclick=e=>switchTab('production',e);bar.appendChild(button);
    }
    const game=document.getElementById('game-screen');
    if(game&&!document.getElementById('tab-production')){
      const tab=document.createElement('div');tab.id='tab-production';tab.className='tab-content';
      tab.innerHTML=`<div class="grid-2">
        <div class="panel"><div class="panel-hdr">PRODUCTION & INVENTORY</div><div class="panel-body">
          <div class="stat-row"><span class="stat-lbl">RAW MATERIALS</span><span id="p2-raw" class="stat-val">0</span></div>
          <div class="stat-row"><span class="stat-lbl">FINISHED GOODS</span><span id="p2-finished" class="stat-val">0</span></div>
          <div class="stat-row"><span class="stat-lbl">WAREHOUSE CAPACITY</span><span id="p2-warehouse" class="stat-val">200</span></div>
          <div class="stat-row"><span class="stat-lbl">SPOILAGE</span><span id="p2-spoilage" class="stat-val">2%</span></div>
          <label for="p2-spoilage-slider">Spoilage control investment</label>
          <input id="p2-spoilage-slider" type="range" min="0" max="5000" step="500" value="0">
          <div>Investment: <span id="p2-spoilage-cost">€0</span> per quarter</div>
          <hr><div id="p2-supply-log"></div>
        </div></div>
        <div class="panel"><div class="panel-hdr">FATIGUE & LOYALTY</div><div class="panel-body">
          <div class="stat-row"><span class="stat-lbl">FATIGUE</span><span id="p2-fatigue" class="stat-val">0%</span></div>
          <div class="bar-track"><div id="p2-fatigue-bar" class="bar-fill" style="width:0%"></div></div>
          <div class="stat-row"><span class="stat-lbl">AVERAGE LOYALTY</span><span id="p2-loyalty" class="stat-val">70%</span></div>
          <div class="bar-track"><div id="p2-loyalty-bar" class="bar-fill" style="width:70%"></div></div>
          <div class="stat-row"><span class="stat-lbl">TRAINING LEVEL</span><span id="p2-training" class="stat-val">0</span></div>
          <button onclick="giveRaise()">Give raises (€2k)</button> <button onclick="performanceReview()" class="btn-blue">Performance review</button>
          <hr><div class="panel-hdr">COMPETITOR INTELLIGENCE</div><div id="p2-competitor-intel"></div>
        </div></div></div>`;
      game.appendChild(tab);
      tab.querySelector('#p2-spoilage-slider').addEventListener('input',e=>{
        document.getElementById('p2-spoilage-cost').textContent=fmt(+e.target.value);
        sim._pendingSpoilageControl=+e.target.value;
      });
    }
  }
  function render(){
    ensureUI();
    const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    put('p2-raw',Math.floor(sim.rawMaterials||0));put('p2-finished',sim.finishedGoods||0);
    put('p2-warehouse',sim.warehouseCapacity||200);put('p2-spoilage',Math.round((sim.spoilageRate||0)*100)+'%');
    put('p2-fatigue',Math.round(sim.fatigue||0)+'%');put('p2-loyalty',Math.round(sim.avgLoyalty||0)+'%');put('p2-training',sim.trainingLevel||0);
    const fb=document.getElementById('p2-fatigue-bar'),lb=document.getElementById('p2-loyalty-bar');
    if(fb){fb.style.width=clamp(sim.fatigue||0,0,100)+'%';fb.className='bar-fill '+(sim.fatigue>70?'red':sim.fatigue>45?'amber':'');}
    if(lb){lb.style.width=clamp(sim.avgLoyalty||0,0,100)+'%';lb.className='bar-fill '+(sim.avgLoyalty<40?'red':sim.avgLoyalty<65?'amber':'');}
    const log=document.getElementById('p2-supply-log');if(log)log.innerHTML=(sim.supplyEvents||[]).map(e=>`<div>[Q${e.q}] ${e.msg}</div>`).join('')||'No supply events yet.';
    const intel=document.getElementById('p2-competitor-intel');if(intel)intel.innerHTML=(sim.competitorIntel||[]).map(e=>`<div>[${e.q}] <b>${e.competitor}</b> ${e.action}</div>`).join('')||'No competitor activity yet.';
  }
  window.giveRaise=function(){if(sim.cash<2000){toast('Need €2k','error');return;}sim.cash-=2000;sim.avgLoyalty=clamp(sim.avgLoyalty+8,0,100);sim.motivation=clamp(sim.motivation+6,0,100);logMsg('Raises improved workforce loyalty.','good');render();updateUI();};
  window.performanceReview=function(){sim.lastReviewQ=sim.quarter;sim.motivation=clamp(sim.motivation+(Math.random()<.4?5:2),0,100);sim.trainingLevel=clamp(sim.trainingLevel+1,0,20);logMsg('Performance review completed.','info');render();updateUI();};
  window.selectSupplier=function(id){const terms=contractTerms[id];if(!terms)return;const old=contractTerms[sim.supplierContract.id]||contractTerms.standard;if(sim.supplierContract.quartersLeft>0&&sim.supplierContract.id!==id){if(sim.cash<old.breakPenalty){toast(`Need ${fmt(old.breakPenalty)} break fee.`,'error');return;}sim.cash-=old.breakPenalty;}sim.supplierContract={id,quartersLeft:terms.quarters,minOrder:terms.minOrder,priceMod:terms.priceMod};sim.activeSupplier=id;toast(`Supplier contract: ${id} (${terms.quarters} quarters)`,'success');updateUI();};

  const oldStart=startGame;
  startGame=function(){Object.assign(sim,{...defaults,competitorIntel:[],supplyEvents:[],supplierContract:{...defaults.supplierContract}});oldStart.apply(this,arguments);setTimeout(render,150);};
  const oldUpdate=updateUI;
  updateUI=function(){oldUpdate.apply(this,arguments);render();};
  const oldCapacity=getTotalCapacity;
  getTotalCapacity=function(){const fatigueFactor=1-(sim.fatigue||0)/200;const loyaltyFactor=.7+(sim.avgLoyalty||70)/300;const trainingFactor=1+(sim.trainingLevel||0)/200;return Math.round(oldCapacity()*fatigueFactor*loyaltyFactor*trainingFactor);};
  const oldExecute=executeQuarter;
  executeQuarter=function(){
    const quarterBefore=sim.quarter;
    const spoilSpend=sim._pendingSpoilageControl||0;
    if(spoilSpend>0&&sim.cash>=spoilSpend){sim.cash-=spoilSpend;sim.spoilageRate=Math.max(.005,.02-spoilSpend/2000000);sim._pendingSpoilageControl=0;}
    oldExecute.apply(this,arguments);
    if(!sim.city||sim.quarter===quarterBefore)return;
    sim.fatigue=clamp((sim.fatigue||0)+($('strategy').value==='overtime'?15:$('strategy').value==='blitz'?8:-3),0,100);
    const target=sim.motivation*.9+sim.trainingLevel*5;sim.avgLoyalty=clamp(sim.avgLoyalty+(target-sim.avgLoyalty)*.15,0,100);
    sim.turnover=clamp(5+sim.fatigue*.1+(80-sim.avgLoyalty)*.15,2,35);
    const channel=channels[0],leads=+$('sl-mkt').value/channel.costPerLead;
    let gained=Math.floor(leads*channel.convRate*(1+(sim.marketingEffect||0))*(sim.researchUnlocked.includes('mkt5')?1.1:1));
    sim.customers=Math.max(1,Math.floor(((sim.customers||100)+gained)*(1-clamp((.05+(100-sim.customerSatisfaction)/500)*(sim.researchUnlocked.includes('qual5') ? .85 : 1),.02,.2))));
    sim.customerAcquisitionCost=gained?+$('sl-mkt').value/gained*(sim.researchUnlocked.includes('mkt4') ? .8 : 1):0;
    const churn=clamp((.05+(100-sim.customerSatisfaction)/500)*(sim.researchUnlocked.includes('qual5') ? .85 : 1),.02,.2);
    sim.customerLifetimeValue=((sim.lastQ.revenue||1000)/sim.customers)*Math.min(1/churn,8)*.25;
    if(sim.supplierContract.quartersLeft>0)sim.supplierContract.quartersLeft--;
    if(sim.enableCompetitors)(sim.competitors||[]).filter(c=>c.alive&&Math.random()<.35).forEach(c=>{const actions=['cutting prices','poaching skilled workers','expanding locations','launching products','running a marketing campaign'];const action=actions[Math.floor(Math.random()*actions.length)];sim.competitorIntel.unshift({q:`Q${sim.quarter-1}`,competitor:c.name,action});});
    sim.competitorIntel=sim.competitorIntel.slice(0,8);sim.supplyEvents.unshift({q:sim.quarter-1,msg:`Inventory: ${Math.floor(sim.rawMaterials)} raw units, ${sim.finishedGoods} finished units.`});sim.supplyEvents=sim.supplyEvents.slice(0,10);
    render();
  };
  const oldSwitch=switchTab;
  switchTab=function(name,event){oldSwitch.apply(this,arguments);if(name==='production')render();};
})();

