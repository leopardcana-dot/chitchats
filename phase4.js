/* Phase 4 game systems: expanded progression, economy cycles, and recovery decisions. */
(() => {
  const research = [
    ['auto4','Lights-Out Factory','automation',80,['auto3'],'+45% capacity'],['auto5','Predictive Maintenance','automation',65,['auto2'],'+15% equipment life'],['auto6','Digital Twin','automation',75,['auto5'],'+8 quality'],['auto7','Autonomous Logistics','automation',95,['auto4','auto6'],'+20% export capacity'],
    ['qual4','Total Quality Management','quality',85,['qual3'],'Quality and satisfaction'],['qual5','Customer Experience','quality',70,['qual2'],'Customer retention'],['qual6','Zero-Defect System','quality',110,['qual4','qual5'],'−30% spoilage'],
    ['mkt4','Customer Analytics','marketing',50,['mkt1'],'−20% acquisition cost'],['mkt5','Influencer Network','marketing',72,['mkt4'],'Brand and lead conversion'],['mkt6','Global Brand','marketing',100,['mkt3','mkt5'],'International demand'],
    ['hr4','Learning Academy','hr',55,['hr1'],'Training gains'],['hr5','Retention Program','hr',65,['hr2','hr4'],'Lower turnover'],['hr6','Leadership Institute','hr',90,['hr3','hr5'],'+10% productivity'],
    ['fin3','Treasury Management','finance',65,['fin1'],'Working capital'],['fin4','Investor Relations','finance',75,['fin2'],'Higher valuation'],['fin5','M&A Capability','finance',120,['fin3','fin4'],'Acquisitions'],
    ['exp3','Trade Compliance','export',70,['exp1'],'Fewer customs delays'],['exp4','International Distribution','export',85,['exp2'],'Export capacity'],['exp5','Global Supply Chain','export',110,['exp3','exp4'],'Export revenue'],
    ['inn3','R&D Partnerships','innovation',60,['inn1'],'Lower R&D cost'],['inn4','Skunkworks','innovation',80,['inn2','inn3'],'Faster innovation'],['inn5','AI Research Lab','innovation',95,['inn2'],'Research productivity'],['inn6','Breakthrough Program','innovation',130,['inn4','inn5'],'Capacity and quality'],
    ['log1','Warehouse Optimization','logistics',28,[],'More storage'],['log2','Just-in-Time','logistics',50,['log1'],'Lower inventory cost'],['log3','Route Optimization','logistics',45,['log1'],'Lower transport cost'],['log4','Cold Chain','logistics',70,['log2'],'−50% spoilage'],['log5','Real-Time Tracking','logistics',85,['log3','log4'],'Supply reliability'],
    ['cyb1','Security Basics','cyber',20,[],'Lower cyber risk'],['cyb2','Threat Detection','cyber',45,['cyb1'],'Lower cyber damage'],['cyb3','Zero Trust','cyber',70,['cyb2'],'Lower cyber risk'],['cyb4','Cyber Resilience','cyber',100,['cyb3'],'Faster recovery'],
    ['sus1','Energy Efficiency','sustainability',30,[],'Lower energy cost'],['sus2','Waste Reduction','sustainability',45,['sus1'],'Less spoilage, more reputation'],['sus3','Renewable Energy','sustainability',80,['sus1'],'Lower energy cost'],['sus4','Circular Economy','sustainability',95,['sus2'],'Reputation and efficiency'],['sus5','Net Zero Certification','sustainability',120,['sus3','sus4'],'Premium pricing']
  ];
  research.forEach(([id,name,cat,cost,req,bonus])=>{if(!RESEARCH_TREE.some(r=>r.id===id))RESEARCH_TREE.push({id,name,cat,cost,req,bonus});});
  const newAchievements=[
    ['cash_5m','Tycoon','€5M cash'],['profit_50k','High Earner','€50k quarterly profit'],['profit_200k','Profit Machine','€200k quarterly profit'],['gross_100k','Gross Player','€100k gross profit'],['mkt_60','Monopolist','60% market share'],['custsat_95','Customer Champion','95% satisfaction'],['staff_100','Industrial Giant','100 staff'],['training_10','Talent Developer','Training level 10'],['loyal_90','Loyal Team','90% average loyalty'],['research_15','Tech Leader','15 research items'],['research_30','R&D Powerhouse','30 research items'],['year_1','First Year','Survive one year'],['year_15','Empire Builder','Survive 15 years'],['locations_2','Dual Sites','Own at least one extra location'],['locations_5','National Network','Own four extra locations'],['property_1','Landlord','Own a property'],['property_5','Real Estate Mogul','Own 5 properties'],['debt_50k','Leveraged','€50k active debt'],['od_used','Living on Credit','Use an overdraft'],['missions_30','Mission Legend','Complete 30 missions'],['export_global','Global Player','Unlock global exports'],['export_contract1','Contract Signed','Complete an export mission'],['export_rev_100k','Export Empire','€100k lifetime exports'],['investor_first','First Funding','Close an investment round'],['investor_5','Serial Funded','Close 5 rounds'],['dividend_paid','Shareholder Friendly','Pay dividends'],['insurance_all','Fully Covered','Hold 3 insurance policies'],['no_claims','Risk Averse','Reach Q8 without claims']
  ];
  newAchievements.forEach(([id,name,desc])=>{if(!ACHIEVEMENTS.some(a=>a.id===id))ACHIEVEMENTS.push({id,name,desc,icon:'🏅'});});
  const newMissions=[

  // Cash & profit
  {id:'m_cash50',title:'Cash Reserve',desc:'€50k+ cash',check:g=>g.cash>=50000,reward:3000,rp:2},
  {id:'m_cash100',title:'Cash Buffer',desc:'€100k+ cash',check:g=>g.cash>=100000,reward:6000,rp:3},
  {id:'m_profit30',title:'Profit Target',desc:'€30k net profit',check:g=>g.lastQ.profit>=30000,reward:5000,rp:3},
  {id:'m_profit50',title:'Big Quarter',desc:'€50k net profit',check:g=>g.lastQ.profit>=50000,reward:8000,rp:4},
  // Quality & rep
  {id:'m_qual75',title:'Quality Drive',desc:'Quality 75+',check:g=>g.quality>=75,reward:2500,rp:4},
  {id:'m_qual90',title:'Excellence',desc:'Quality 90+',check:g=>g.quality>=90,reward:5000,rp:5},
  {id:'m_rep70',title:'Reputation Rise',desc:'Reputation 70+',check:g=>g.reputation>=70,reward:2000,rp:3},
  {id:'m_rep85',title:'Trusted Brand',desc:'Reputation 85+',check:g=>g.reputation>=85,reward:4500,rp:4},
  // Staff
  {id:'m_staff15',title:'Workforce Growth',desc:'15+ employees',check:g=>totalStaff()>=15,reward:4000,rp:2},
  {id:'m_staff30',title:'Big Employer',desc:'30+ employees',check:g=>totalStaff()>=30,reward:8000,rp:3},
  {id:'m_morale80',title:'Happy Team',desc:'Morale 80+',check:g=>g.motivation>=80,reward:2000,rp:2},
  {id:'m_loyal80',title:'Loyal Crew',desc:'Loyalty 80+',check:g=>(g.avgLoyalty||0)>=80,reward:3000,rp:3},
  // Market
  {id:'m_mkt25',title:'Market Presence',desc:'25% share',check:g=>g.marketShare>=25,reward:6000,rp:5},
  {id:'m_mkt40',title:'Market Leader',desc:'40% share',check:g=>g.marketShare>=40,reward:12000,rp:8},
  // R&D
  {id:'m_research3',title:'R&D Sprint',desc:'3 research items',check:g=>g.researchUnlocked.length>=3,reward:3500,rp:6},
  {id:'m_research8',title:'Innovation Push',desc:'8 research items',check:g=>g.researchUnlocked.length>=8,reward:8000,rp:10},
  {id:'m_research15',title:'Tech Leader',desc:'15 research items',check:g=>g.researchUnlocked.length>=15,reward:15000,rp:15},
  // Expansion
  {id:'m_2locs',title:'Expand Territory',desc:'2+ total locations',check:g=>g.locations.length>=1,reward:5000,rp:4},
  {id:'m_4locs',title:'National Footprint',desc:'4+ total locations',check:g=>g.locations.length>=3,reward:12000,rp:6},
  // Finance
  {id:'m_zeroloan',title:'Debt Clear',desc:'Zero loan balance',check:g=>g.loanPrincipal<=0,reward:4000,rp:3},
  {id:'m_dividend',title:'Shareholder Value',desc:'Pay dividends',check:g=>(g.shareholders||[]).some(s=>s.type!=='founder'),reward:5000,rp:4},
  // Customer
  {id:'m_custsat80',title:'Delight Customers',desc:'Satisfaction 80%+',check:g=>g.customerSatisfaction>=80,reward:3000,rp:3},
  {id:'m_custsat90',title:'Customer Love',desc:'Satisfaction 90%+',check:g=>g.customerSatisfaction>=90,reward:6000,rp:4},
  // Export
  {id:'m_export',title:'Go International',desc:'EU export unlocked',check:g=>g.researchUnlocked.includes('exp1'),reward:7000,rp:5},
  {id:'m_export_active',title:'Active Exporter',desc:'Have active export contract',check:g=>(g.exportContracts||[]).some(c=>c.status==='active'),reward:8000,rp:5},
  {id:'m_export_rev',title:'Export Revenue',desc:'€20k+ export revenue this Q',check:g=>(g.exportRevenue||0)>=20000,reward:10000,rp:6},
  // Insurance
  {id:'m_insured',title:'Risk Manager',desc:'2+ active policies',check:g=>(g.insurancePolicies||[]).length>=2,reward:3000,rp:3},
  // Property
  {id:'m_property',title:'Landlord',desc:'Own 1 property',check:g=>(g.ownedProperties||[]).length>=1,reward:4000,rp:3},
  {id:'m_portfolio',title:'Portfolio Builder',desc:'Own 3 properties',check:g=>(g.ownedProperties||[]).length>=3,reward:10000,rp:5},
  // Investors
  {id:'m_funding',title:'Capital Raised',desc:'Close 1 funding round',check:g=>(g.fundingRounds||0)>=1,reward:6000,rp:4},
  // Sustainability
  {id:'m_sustainable',title:'Going Green',desc:'3 sustainability research',check:g=>g.researchUnlocked.filter(r=>r.startsWith('sus')).length>=3,reward:5000,rp:5},
  // Long-term
  {id:'m_year2',title:'Survivor',desc:'2 years in business',check:g=>g.year>=3,reward:6000,rp:4},
  {id:'m_year5',title:'Veteran',desc:'5 years in business',check:g=>g.year>=6,reward:15000,rp:8},
  // Productivity
  {id:'m_efficiency',title:'Efficiency Driver',desc:'Capacity >10,000',check:g=>getTotalCapacity()>10000,reward:5000,rp:4},

  ];  newMissions.forEach(m=>{if(!MISSION_POOL.some(x=>x.id===m.id))MISSION_POOL.push(m);});
  const extraEvents=[
{id:'e_energy',icon:'⚡',title:'ENERGY PRICE SPIKE',desc:'Electricity prices surge 25% this quarter.',
    choices:[
      {text:'Absorb cost (−€3k)',cost:3000,effect:g=>{toast('Absorbed cost.','warning')}},
      {text:'Pass to customers (−5 sat.)',effect:g=>{g.customerSatisfaction=clamp(g.customerSatisfaction-5,0,100);}},
      {text:'Invest in renewables (€15k)',cost:15000,effect:g=>{if(!g.researchUnlocked.includes('sus3'))g.researchPoints+=8;toast('Renewables researched!','success')}},
    ]},
  {id:'e_labor',icon:'👷',title:'SKILLED LABOR SHORTAGE',desc:'Local talent market is dry. Hiring costs spike.',
    choices:[
      {text:'Hire from diaspora (€8k)',cost:8000,effect:g=>{g.vet+=1;toast('Experienced hire.','success')}},
      {text:'Train internally (€3k)',cost:3000,effect:g=>{g.youthSkill=clamp(g.youthSkill+0.1,0,2);}},
      {text:'Wait it out',effect:g=>{g.motivation-=5;}},
    ]},
  {id:'e_strike',icon:'✊',title:'EMPLOYEE STRIKE',desc:'Staff demand 15% raises.',
    choices:[
      {text:'Grant raises (+€5k/yr)',cost:5000,effect:g=>{g.motivation=clamp(g.motivation+15,0,100);}},
      {text:'Negotiate compromise (€2k)',cost:2000,effect:g=>{g.motivation=clamp(g.motivation+5,0,100);}},
      {text:'Refuse — hire replacements',effect:g=>{g.youth=Math.max(0,g.youth-2);g.motivation-=10;}},
    ]},
  {id:'e_bigcontract',icon:'📋',title:'MAJOR CUSTOMER CONTRACT',desc:'A regional chain wants a bulk order.',
    choices:[
      {text:'Accept — +€12k, −capacity for 1Q',effect:g=>{g.cash+=12000;g.stockLevel=Math.max(0,g.stockLevel-20);toast('Contract fulfilled!','success')}},
      {text:'Negotiate higher price',effect:g=>{if(Math.random()<0.6){g.cash+=16000;toast('Better terms!','success')}else{g.cash+=6000;toast('Moderate deal.','info')}}},
      {text:'Decline',effect:g=>{toast('Declined.','info')}},
    ]},
  {id:'e_pricewar',icon:'⚔',title:'COMPETITOR PRICE WAR',desc:'A rival is slashing prices.',
    choices:[
      {text:'Match prices (−10% margin)',effect:g=>{g.lastQ.profit=Math.round((g.lastQ.profit||0)*0.9);g.marketShare=clamp(g.marketShare+2,1,80);}},
      {text:'Hold prices, focus quality',effect:g=>{g.marketShare=clamp(g.marketShare-1.5,1,80);g.quality=clamp(g.quality+2,0,100);}},
      {text:'Exit market segment',effect:g=>{g.marketShare=clamp(g.marketShare-3,1,80);g.cash+=3000;}},
    ]},
  {id:'e_inflation',icon:'📈',title:'INFLATION SHOCK',desc:'Consumer prices jump.',
    choices:[
      {text:'Raise prices +5%',effect:g=>{g.customerSatisfaction=clamp(g.customerSatisfaction-4,0,100);g.annualInflation+=0.01;}},
      {text:'Absorb cost',effect:g=>{g.annualInflation+=0.01;g.motivation=clamp(g.motivation-3,0,100);}},
      {text:'Hedge with inventory buy',cost:6000,effect:g=>{g.rawMaterials+=50;toast('Hedged inventory.','success')}},
    ]},
  {id:'e_tourism',icon:'✈',title:'TOURISM BOOM',desc:'Record tourist season.',
    choices:[
      {text:'Scale hospitality ops',effect:g=>{g.marketShare=clamp(g.marketShare+3,1,80);g.reputation+=5;}},
      {text:'Premium pricing',effect:g=>{g.cash+=8000;g.customerSatisfaction=clamp(g.customerSatisfaction-2,0,100);}},
      {text:'Invest in marketing (€5k)',cost:5000,effect:g=>{g.brandStrength=clamp(g.brandStrength+10,0,100);}},
    ]},
  {id:'e_weather',icon:'🌧',title:'SEVERE WEATHER',desc:'Flooding damages operations.',
    choices:[
      {text:'Emergency repair (€10k)',cost:10000,effect:g=>{g.propHealth=clamp(g.propHealth-20,0,100);}},
      {text:'Insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='property'||p.id==='property');if(pol){g.cash+=FORMULAS.insuranceClaim(15000,pol.coverage,pol.deductible);toast('Claim processed.','success')}else{g.propHealth=clamp(g.propHealth-25,0,100)}}},
    ]},
  {id:'e_disease',icon:'🦠',title:'CROP DISEASE',desc:'Agricultural blight hits suppliers.',
    choices:[
      {text:'Alternative suppliers (€4k)',cost:4000,effect:g=>{g.rawMaterials=Math.max(0,g.rawMaterials-10);}},
      {text:'Halt production temporarily',effect:g=>{g.finishedGoods=Math.max(0,g.finishedGoods-30);}},
      {text:'Raise prices to offset',effect:g=>{g.customerSatisfaction=clamp(g.customerSatisfaction-6,0,100);}},
    ]},
  {id:'e_delay',icon:'⏰',title:'CONSTRUCTION DELAYS',desc:'Permits delayed.',
    choices:[
      {text:'Expedite with lawyers (€6k)',cost:6000,effect:g=>{toast('Approved.','success')}},
      {text:'Wait',effect:g=>{g.propHealth=clamp(g.propHealth-5,0,100);}},
    ]},
  {id:'e_investor2',icon:'💼',title:'INVESTOR OFFER',desc:'A VC wants a meeting.',
    choices:[
      {text:'Take the meeting',effect:g=>{const offer=generateInvestorOffer();if(offer){g._pendingInvestorOffer=offer;toast('Offer prepared — check Investors tab.','success')}else{toast('Not eligible yet.','warning')}}},
      {text:'Decline',effect:g=>{g.reputation+=2;}},
    ]},
  {id:'e_acquisition',icon:'🏢',title:'ACQUISITION OPPORTUNITY',desc:'A rival is for sale.',
    choices:[
      {text:'Acquire for €40k',cost:40000,effect:g=>{g.locations.push({city:'Acquired',capacity:500,rent:2000,health:100});g.propValue+=30000;toast('Acquired!','success')}},
      {text:'Pass',effect:g=>{toast('Passed.','info')}},
    ]},
  {id:'e_regulation',icon:'📜',title:'NEW REGULATIONS',desc:'Compliance costs rise.',
    choices:[
      {text:'Comply fully (€5k)',cost:5000,effect:g=>{g.reputation+=8;}},
      {text:'Lobby against (€3k)',cost:3000,effect:g=>{if(Math.random()<0.5){g.reputation-=5}else{g.cash+=1000}}},
      {text:'Minimal compliance',effect:g=>{g.reputation-=8;g.cash-=1000;}},
    ]},
  {id:'e_interest',icon:'🏦',title:'INTEREST RATE HIKE',desc:'Central bank raises rates.',
    choices:[
      {text:'Refinance loans',effect:g=>{g.loanAnnualRate=Math.max(0.05,g.loanAnnualRate+0.01);toast('Refinanced.','warning')}},
      {text:'Pay down debt fast',effect:g=>{if(g.cash>=5000){g.cash-=5000;g.loanPrincipal=Math.max(0,g.loanPrincipal-5000)}}},
      {text:'Accept higher cost',effect:g=>{g.loanAnnualRate=Math.max(0.05,g.loanAnnualRate+0.02);}},
    ]},
  {id:'e_tech',icon:'🔬',title:'TECHNOLOGY BREAKTHROUGH',desc:'Your team has a breakthrough!',
    choices:[
      {text:'Fast-track (€5k)',cost:5000,effect:g=>{g.researchPoints+=10;toast('+10 RP!','success')}},
      {text:'Patent it',effect:g=>{g.researchPoints+=6;g.reputation+=5;}},
      {text:'Sell to competitor',effect:g=>{g.cash+=12000;}},
    ]},
  {id:'e_export',icon:'🌐',title:'EXPORT OPPORTUNITY',desc:'A foreign buyer is interested.',
    choices:[
      {text:'Accept contract',effect:g=>{generateExportContracts();toast('Contract offered!','success')}},
      {text:'Request better terms',effect:g=>{if(Math.random()<0.6){generateExportContracts()}else{toast('Lost interest.','warning')}}},
      {text:'Decline',effect:g=>{}},
    ]},
  {id:'e_infra',icon:'🛣',title:'INFRASTRUCTURE IMPROVEMENT',desc:'New highway boosts logistics.',
    choices:[
      {text:'Expand operations',effect:g=>{g.marketShare=clamp(g.marketShare+2,1,80);g.cityRisk=Math.max(0.02,g.cityRisk-0.02);}},
      {text:'Open new location',effect:g=>{if(g.cash>=35000){g.cash-=35000;g.locations.push({city:'New branch',capacity:400,rent:1800,health:100})}}},
      {text:'Ignore',effect:g=>{}},
    ]},
  {id:'e_grant',icon:'🎁',title:'GOVERNMENT GRANT',desc:'You qualify for a business grant.',
    choices:[
      {text:'Apply (€2k fee)',cost:2000,effect:g=>{if(Math.random()<0.7){g.cash+=15000;toast('Grant awarded! +€15k','success')}else{toast('Application denied.','warning')}}},
      {text:'Skip',effect:g=>{}},
    ]},
  {id:'e_theft',icon:'🥷',title:'THEFT INCIDENT',desc:'Equipment was stolen.',
    choices:[
      {text:'Insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='equipment'||p.id==='equipment');if(pol){g.cash+=FORMULAS.insuranceClaim(6000,pol.coverage,pol.deductible);toast('Claimed.','success')}else{g.cash-=6000;g.equipmentValue=Math.max(0,g.equipmentValue-6000)}}},
      {text:'Replace yourself (€5k)',cost:5000,effect:g=>{}},
      {text:'Report to police',effect:g=>{g.cash-=3000;g.reputation+=2;}},
    ]},
  {id:'e_lawsuit',icon:'⚖',title:'LEGAL LIABILITY CLAIM',desc:'A customer is suing.',
    choices:[
      {text:'Settle (€8k)',cost:8000,effect:g=>{toast('Settled.','warning')}},
      {text:'Fight in court',effect:g=>{if(Math.random()<0.4){g.cash-=15000;g.reputation-=10;toast('Lost — €15k penalty.','error')}else{toast('Won.','success')}}},
      {text:'Liability insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='liability'||p.id==='liability');if(pol){g.cash-=FORMULAS.insuranceClaim(8000,pol.coverage,pol.deductible);toast('Partial cover.','info')}else{g.cash-=8000}}},
    ]},
  {id:'e_supplierfail',icon:'🚨',title:'SUPPLIER BANKRUPTCY',desc:'Your primary supplier filed for bankruptcy.',
    choices:[
      {text:'Emergency find new (€7k)',cost:7000,effect:g=>{g.supplierContract={id:'standard',quartersLeft:4,minOrder:0,priceMod:1};toast('New supplier.','warning')}},
      {text:'Use budget supplier',effect:g=>{g.supplierContract={id:'budget',quartersLeft:2,minOrder:0,priceMod:1};g.quality=clamp(g.quality-5,0,100);}},
      {text:'Claim supply insurance',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='supply'||p.id==='supply');if(pol){g.cash+=FORMULAS.insuranceClaim(10000,pol.coverage,pol.deductible);toast('Claim filed.','success')}}},
    ]},
  {id:'e_equipment',icon:'⚙',title:'EQUIPMENT FAILURE',desc:'Critical machine broke down.',
    choices:[
      {text:'Emergency repair (€6k)',cost:6000,effect:g=>{}},
      {text:'Insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='equipment'||p.id==='equipment');if(pol){g.cash+=FORMULAS.insuranceClaim(6000,pol.coverage,pol.deductible);toast('Covered.','success')}else{g.cash-=6000}}},
      {text:'Use outdated backup',effect:g=>{g.quality=clamp(g.quality-8,0,100);}},
    ]},
  {id:'e_demand',icon:'📈',title:'DEMAND SURGE',desc:'Unexpected order rush.',
    choices:[
      {text:'Overtime production',effect:g=>{g.finishedGoods+=30;g.motivation-=5;toast('Fulfilled via overtime.','success')}},
      {text:'Raise prices',effect:g=>{g.cash+=10000;g.customerSatisfaction=clamp(g.customerSatisfaction-5,0,100);}},
      {text:'Decline excess',effect:g=>{g.customerSatisfaction=clamp(g.customerSatisfaction-3,0,100);}},
    ]},
  {id:'e_taxchange',icon:'🧾',title:'TAX REFORM',desc:'Corporate tax rate changing.',
    choices:[
      {text:'Adapt',effect:g=>{g.taxRate=clamp(g.taxRate+rnd(-0.02,0.03),0.08,0.20);}},
      {text:'Hire tax planners (€4k)',cost:4000,effect:g=>{g.taxRate=Math.max(0.09,g.taxRate-0.02);}},
    ]},
  {id:'e_currency',icon:'💱',title:'REGIONAL CURRENCY FLUCTUATION',desc:'Export markets fluctuating.',
    choices:[
      {text:'Hedge exports',effect:g=>{g.cash-=2000;g.exportRevenue=Math.round(g.exportRevenue*1.1);}},
      {text:'Ride it out',effect:g=>{g.exportRevenue=Math.round(g.exportRevenue*rnd(0.85,1.15));}},
    ]},
  {id:'e_poach2',icon:'🎯',title:'COMPETITOR HIRING SWEEP',desc:'A rival is hiring aggressively.',
    choices:[
      {text:'Counter-offer retention (€3k)',cost:3000,effect:g=>{g.avgLoyalty=clamp(g.avgLoyalty+8,0,100);}},
      {text:'Let talent go',effect:g=>{if(Math.random()<0.5){g.vet=Math.max(0,g.vet-1)}}},
      {text:'Poach their people back (€5k)',cost:5000,effect:g=>{g.youth+=1;g.vet+=1;}},
    ]},
  {id:'e_media2',icon:'📺',title:'NEGATIVE PRESS',desc:'A story is circulating.',
    choices:[
      {text:'PR crisis team (€6k)',cost:6000,effect:g=>{g.reputation=clamp(g.reputation-3,0,100);}},
      {text:'Ignore',effect:g=>{g.reputation=clamp(g.reputation-10,0,100);g.brandStrength=clamp(g.brandStrength-8,0,100);}},
      {text:'Transparent response',effect:g=>{g.reputation=clamp(g.reputation+3,0,100);}},
    ]},
  {id:'e_expansion',icon:'🌍',title:'FOREIGN EXPANSION OFFER',desc:'Opportunity to open abroad.',
    choices:[
      {text:'Invest €30k',cost:30000,effect:g=>{g.locations.push({city:'Foreign office',capacity:300,rent:2500,health:100});g.reputation+=10;toast('International presence!','success')}},
      {text:'Pass',effect:g=>{}},
    ]},
  {id:'e_bank',icon:'🏛',title:'BANK CREDIT REVIEW',desc:'Your bank is reviewing your credit.',
    choices:[
      {text:'Provide full financials',effect:g=>{if(g.cash>0&&g.lastQ.profit>0){g.loanAnnualRate=Math.max(0.05,g.loanAnnualRate-0.01);toast('Rate reduced.','success')}else{toast('No change.','info')}}},
      {text:'Refinance at higher rate',effect:g=>{g.loanAnnualRate=Math.max(0.05,g.loanAnnualRate+0.015);g.cash+=Math.min(10000,g.loanPrincipal)}},
      {text:'Decline review',effect:g=>{g.reputation=clamp(g.reputation-2,0,100);}},
    ]},
  {id:'e_exportwin',icon:'🏆',title:'EXPORT CONTRACT WON',desc:'You won a prestigious contract.',
    choices:[
      {text:'Celebrate — market the win',effect:g=>{g.brandStrength=clamp(g.brandStrength+12,0,100);g.reputation+=8;}},
      {text:'Invest in capacity (€8k)',cost:8000,effect:g=>{g.propValue+=6000;}},
      {text:'Bank the reward',effect:g=>{g.cash+=5000;}},
    ]},
  {id:'e_cyber2',icon:'🔐',title:'DATA BREACH',desc:'Customer data exposed.',
    choices:[
      {text:'Notify + cybersecurity (€7k)',cost:7000,effect:g=>{g.reputation=clamp(g.reputation-3,0,100);g.researchPoints+=3;}},
      {text:'Quiet handling',effect:g=>{if(Math.random()<0.5){g.reputation=clamp(g.reputation-15,0,100)}else{toast('Stayed quiet.','warning')}}},
      {text:'Insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='cyber'||p.id==='cyber');if(pol){g.cash+=FORMULAS.insuranceClaim(7000,pol.coverage,pol.deductible)}}},
    ]},
  {id:'e_worker',icon:'🚑',title:'WORKPLACE ACCIDENT',desc:'An employee was injured.',
    choices:[
      {text:'Full workers comp (€4k)',cost:4000,effect:g=>{g.reputation+=5;g.motivation+=5;}},
      {text:'Minimal settlement (€1k)',cost:1000,effect:g=>{g.reputation-=5;}},
      {text:'Insurance claim',effect:g=>{const pol=(g.insurancePolicies||[]).find(p=>p.typeId==='liability'||p.id==='liability');if(pol){g.cash+=FORMULAS.insuranceClaim(4000,pol.coverage,pol.deductible);toast('Covered.','success')}else{g.cash-=4000}}},
    ]},
  {id:'e_audit2',icon:'📊',title:'INVESTOR AUDIT',desc:'An investor wants deep-dive due diligence.',
    choices:[
      {text:'Cooperate fully',effect:g=>{if(g.lastQ.profit>0){g.cash+=5000;g.reputation+=5;toast('Audit passed — bonus!','success')}}},
      {text:'Delay',effect:g=>{g.reputation=clamp(g.reputation-3,0,100);}},
    ]},
  {id:'e_bulkorder',icon:'📦',title:'BULK ORDER REQUEST',desc:'A buyer wants 50 units now.',
    choices:[
      {text:'Rush production (fulfill)',effect:g=>{if(g.finishedGoods>=50){g.cash+=15000;g.finishedGoods-=50;toast('Fulfilled!','success')}else{toast('Not enough stock!','error')}}},
      {text:'Partial fulfilment',effect:g=>{const avail=Math.min(g.finishedGoods,30);g.finishedGoods-=avail;g.cash+=avail*250;toast(`Partial: ${avail} units`,'info')}},
      {text:'Decline',effect:g=>{g.customerSatisfaction=clamp(g.customerSatisfaction-3,0,100);}},
    ]},
  {id:'e_training',icon:'🎓',title:'TRAINING GRANT',desc:'Government offers training subsidy.',
    choices:[
      {text:'Accept training program',effect:g=>{g.trainingLevel=clamp(g.trainingLevel+3,0,20);g.youthSkill=clamp(g.youthSkill+0.08,0,2);toast('Skills up!','success')}},
      {text:'Decline',effect:g=>{}},
    ]},
  ];
  FORMULAS.insuranceClaim=(damage,coverage,deductiblePct)=>Math.min(Math.max(0,damage-damage*deductiblePct),coverage);
  const eventIds=new Set(RANDOM_EVENTS.map(e=>e.id));RANDOM_EVENTS.push(...extraEvents.filter(e=>!eventIds.has(e.id)));

  function updateEconCycle(){
    if(Math.random()<.08){const i=ECON_CYCLES.indexOf(sim.econCycle);sim.econCycle=ECON_CYCLES[clamp(i+(Math.random()<.5?-1:1),0,3)];logMsg(`Economic cycle: ${sim.econCycle.toUpperCase()}`,'info');}
    const base={recession:.75,slowdown:.88,expansion:1,boom:1.25};let mod=base[sim.econCycle]||1;
    const sensitivities={Hospitality:{recession:.85,boom:1.15},Construction:{recession:.75,boom:1.25},Tech:{recession:.9,boom:1.1},Retail:{recession:.85,boom:1.1},Agriculture:{recession:.95,boom:1.05},Manufacturing:{recession:.9,boom:1.05}};
    const s=sensitivities[sim.sector];if(s&&s[sim.econCycle])mod*=s[sim.econCycle];sim.globalDemandMod=mod;
    if(sim.enableInflation){if(sim.econCycle==='boom'&&Math.random()<.1)sim.annualInflation=Math.min(.1,sim.annualInflation+.005);if(sim.econCycle==='recession'&&Math.random()<.1)sim.annualInflation=Math.max(.005,sim.annualInflation-.005);}
  }
  window.updateEconCycle=updateEconCycle;
  const checks={cash_5m:()=>sim.cash>=5e6,profit_50k:()=>sim.lastQ.profit>=50000,profit_200k:()=>sim.lastQ.profit>=200000,gross_100k:()=>sim.lastQ.grossProfit>=100000,mkt_60:()=>sim.marketShare>=60,custsat_95:()=>sim.customerSatisfaction>=95,staff_100:()=>totalStaff()>=100,training_10:()=>sim.trainingLevel>=10,loyal_90:()=>sim.avgLoyalty>=90,research_15:()=>sim.researchUnlocked.length>=15,research_30:()=>sim.researchUnlocked.length>=30,year_1:()=>sim.year>=2,year_15:()=>sim.year>=16,locations_2:()=>sim.locations.length>=1,locations_5:()=>sim.locations.length>=4,property_1:()=>(sim.ownedProperties||[]).length>=1,property_5:()=>(sim.ownedProperties||[]).length>=5,debt_50k:()=>sim.loanPrincipal>=50000,od_used:()=>sim.overdraftDrawn>0,missions_30:()=>sim.completedMissions.length>=30,export_global:()=>sim.researchUnlocked.includes('exp2'),export_contract1:()=>sim.completedMissions.filter(m=>m.id.startsWith('m_export')).length>=1,export_rev_100k:()=>(sim.totalExportRevenue||0)>=100000,investor_first:()=>(sim.fundingRounds||0)>=1,investor_5:()=>(sim.fundingRounds||0)>=5,dividend_paid:()=>(sim.shareholders||[]).some(s=>s.lastDividend>0),insurance_all:()=>(sim.insurancePolicies||[]).length>=3,no_claims:()=>sim.quarter>=8&&(sim.insuranceClaimsYTD||0)===0};
  const oldAchievements=checkAchievements;checkAchievements=function(){oldAchievements.apply(this,arguments);let changed=false;for(const a of ACHIEVEMENTS){if(sim.achievements.includes(a.id)||!checks[a.id])continue;if(checks[a.id]()){sim.achievements.push(a.id);logMsg(`🏆 ${a.name}!`,'good');toast(`🏆 ${a.name}`,'success');changed=true;}}if(changed)renderAchievements();};
  const oldQuarter=executeQuarter;executeQuarter=function(){const q=sim.quarter;oldQuarter.apply(this,arguments);if(sim.quarter!==q){updateEconCycle();if(sim.researchUnlocked.includes('hr4'))sim.trainingLevel=clamp(sim.trainingLevel+.3,0,20);if(sim.researchUnlocked.includes('qual4'))sim.customerSatisfaction=clamp(sim.customerSatisfaction+2,0,100);if(sim.researchUnlocked.includes('qual5'))sim.customerSatisfaction=clamp(sim.customerSatisfaction+3,0,100);if(sim.researchUnlocked.includes('sus2'))sim.reputation=clamp(sim.reputation+.5,0,100);if(sim.researchUnlocked.includes('sus4'))sim.reputation=clamp(sim.reputation+.7,0,100);if(sim.researchUnlocked.includes('sus5'))sim.reputation=clamp(sim.reputation+1,0,100);if(sim.researchUnlocked.includes('hr5'))sim.turnover=Math.max(2,sim.turnover*.7);if(sim.researchUnlocked.includes('log1'))sim.warehouseCapacity=260;if(sim.researchUnlocked.includes('log5'))sim.supplyReliabilityBonus=.15;}};
  const oldStart=startGame;startGame=function(){sim._bankruptcyOffered=false;sim.totalExportRevenue=0;oldStart.apply(this,arguments);};
  const oldCapacity=getTotalCapacity;getTotalCapacity=function(){let v=oldCapacity();if(sim.researchUnlocked.includes('auto4'))v*=1.12;if(sim.researchUnlocked.includes('auto7'))v*=1.08;if(sim.researchUnlocked.includes('hr6'))v*=1.1;if(sim.researchUnlocked.includes('inn6'))v*=1.25;return Math.round(v);};
  const oldDemand=getCurrentDemand;getCurrentDemand=function(){let v=oldDemand();if(sim.researchUnlocked.includes('mkt6'))v*=1.15;return Math.round(v);};

  window.showBankruptcyModal=function(){
    if(sim._bankruptcyOffered)return;sim._bankruptcyOffered=true;sim.eventPending=true;
    const modal=$('event-modal'),choices=$('evt-choices');$('evt-icon').textContent='⚠';$('evt-title').textContent='BANKRUPTCY WARNING';$('evt-desc').textContent='Cash is below zero. Choose a recovery option.';choices.innerHTML='';
    const option=(label,action)=>{const b=document.createElement('button');b.className='modal-choice';b.textContent=label;b.onclick=()=>{action();modal.style.display='none';sim.eventPending=false;sim._bankruptcyOffered=false;updateUI();};choices.appendChild(b);};
    if(sim.loanPrincipal<50000)option('Emergency financing (+€15,000)',()=>{sim.cash+=15000;sim.loanPrincipal+=15000;sim.loanAnnualRate=Math.max(.18,sim.loanAnnualRate);sim.loanQuarters=12;sim.loanPaid=0;});
    if((sim.ownedProperties||[]).length)option('Sell owned properties',()=>{sim.cash+=sim.ownedProperties.reduce((n,p)=>n+Math.round((p.marketValue||p.purchasePrice)*.6),0);sim.ownedProperties=[];});
    if(totalStaff()>2)option('Restructure workforce',()=>{let n=Math.ceil(totalStaff()*.3);while(n-->0){if(sim.youth>0)sim.youth--;else if(sim.vet>0)sim.vet--;else if(sim.managers>0)sim.managers--;}sim.motivation=clamp(sim.motivation-20,0,100);});
    option('Declare bankruptcy',()=>{$('btn-quarter').disabled=true;logMsg('Bankruptcy declared.','err');});modal.style.display='flex';
  };
})();




