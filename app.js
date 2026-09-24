/* ═══════════════════════════════════════════════════════════
   كانتِين | Kanteen — Main Application v3.1
   GPS improvements + Performance optimization
   ═══════════════════════════════════════════════════════════ */

var $ = function(s, r){ r = r || document; return r.querySelector(s); };
var $$ = function(s, r){ r = r || document; return Array.from(r.querySelectorAll(s)); };
var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
var money = function(n){ return Number(n || 0).toFixed(0) + ' <small>' + (typeof t === 'function' ? t('general_egp') : 'ج.م') + '</small>'; };
var uid = function(){ return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); };

var LS = {
  get: function(k, d){ try { var v = localStorage.getItem('kanteen:' + k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
  set: function(k, v){ try { localStorage.setItem('kanteen:' + k, JSON.stringify(v)); } catch(e){} },
  del: function(k){ try { localStorage.removeItem('kanteen:' + k); } catch(e){} }
};

function refreshIcons(){
  if(window.lucide && typeof lucide.createIcons === 'function'){
    requestAnimationFrame(function(){ lucide.createIcons(); });
  }
}
function ktToast(msg, type){
  var wrap = $('#k-toasts'); if(!wrap) return;
  var el = document.createElement('div');
  el.className = 'k-toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function(){
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0'; el.style.transform = 'translateY(12px)';
    setTimeout(function(){ el.remove(); }, 300);
  }, 2600);
}
function ktShowFbStatus(text, isError){
  var el = document.getElementById('kFbStatus'); if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  if (isError) el.classList.add('err'); else el.classList.remove('err');
  setTimeout(function(){ el.classList.remove('show'); }, 3000);
}

var KT_MED_IMG = {
  tablets_white:'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=600',
  tablets_round:'https://images.pexels.com/photos/51929/medications-cure-tablets-pharmacy-51929.jpeg?auto=compress&cs=tinysrgb&w=600',
  tablets_yellow:'https://images.pexels.com/photos/977860/pexels-photo-977860.jpeg?auto=compress&cs=tinysrgb&w=600',
  tablets_multi:'https://images.pexels.com/photos/2085187/pexels-photo-2085187.jpeg?auto=compress&cs=tinysrgb&w=600',
  blister_pack:'https://images.pexels.com/photos/139398/pexels-photo-139398.jpeg?auto=compress&cs=tinysrgb&w=600',
  capsules_red:'https://images.pexels.com/photos/1389103/pexels-photo-1389103.jpeg?auto=compress&cs=tinysrgb&w=600',
  capsules_green:'https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?auto=compress&cs=tinysrgb&w=600',
  capsules_blue:'https://images.pexels.com/photos/3873148/pexels-photo-3873148.jpeg?auto=compress&cs=tinysrgb&w=600',
  cream_tube:'https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg?auto=compress&cs=tinysrgb&w=600',
  cream_jar:'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=600',
  ointment:'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=600',
  nasal_spray:'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=600',
  inhaler:'https://images.pexels.com/photos/4210606/pexels-photo-4210606.jpeg?auto=compress&cs=tinysrgb&w=600',
  bottle_solution:'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=600',
  vitamins_gold:'https://images.pexels.com/photos/139398/pexels-photo-139398.jpeg?auto=compress&cs=tinysrgb&w=600',
  vitamins_soft:'https://images.pexels.com/photos/977860/pexels-photo-977860.jpeg?auto=compress&cs=tinysrgb&w=600',
  thermometer:'https://images.pexels.com/photos/4047186/pexels-photo-4047186.jpeg?auto=compress&cs=tinysrgb&w=600',
  bp_monitor:'https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=600',
  glucose_meter:'https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=600',
  mask:'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=600',
  gloves:'https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=600',
  bandage:'https://images.pexels.com/photos/5938565/pexels-photo-5938565.jpeg?auto=compress&cs=tinysrgb&w=600',
  syringe:'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=600',
  pharmacy_hero:'https://images.pexels.com/photos/5910953/pexels-photo-5910953.jpeg?auto=compress&cs=tinysrgb&w=1200'
};

var KT_PHARMACY = {
  id:'pharmacy_dr_hesham',
  name:'صيدلية الدكتور هشام',
  emoji:'⚕️',
  phone:'01124169656',
  address:'فرع رئيسي — القاهرة',
  hours:'يومياً 9 ص — 2 ص',
  delivery:'توصيل خلال 45 دقيقة'
};

var KT_MED_CATS = [
  {id:'med_all',name:'كل الأدوية',emoji:'💊'},
  {id:'med_pain',name:'مسكنات وخوافض',emoji:'💊'},
  {id:'med_antibio',name:'مضادات حيوية',emoji:'🦠'},
  {id:'med_cold',name:'برد وحساسية',emoji:'🤧'},
  {id:'med_digest',name:'جهاز هضمي',emoji:'🫃'},
  {id:'med_chronic',name:'أمراض مزمنة',emoji:'❤️'},
  {id:'med_resp',name:'جهاز تنفسي',emoji:'🫁'},
  {id:'med_skin',name:'جلدية ومطهرات',emoji:'🧴'},
  {id:'med_vit',name:'فيتامينات',emoji:'🍊'},
  {id:'med_supplies',name:'مستلزمات طبية',emoji:'🩺'}
];

var KT_MEDICINES = [
  {id:'med_001',name:'بانادول إكسترا 24 قرص',price:45,cat:'med_pain',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_002',name:'بانادول أدفانس 20 قرص',price:52,cat:'med_pain',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_round},
  {id:'med_003',name:'كتافلام 50 مجم — 20 قرص',price:38,cat:'med_pain',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_004',name:'بروفين 400 مجم — 30 قرص',price:42,cat:'med_pain',emoji:'💊',unit:'علبة',image:KT_MED_IMG.blister_pack},
  {id:'med_005',name:'أسبرين بروتكت 100 مجم',price:28,cat:'med_pain',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_006',name:'فولتارين جل 50 جم',price:75,cat:'med_pain',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.ointment},
  {id:'med_007',name:'فولتارين أمبول 3 أمبولات',price:60,cat:'med_pain',emoji:'💉',unit:'علبة',image:KT_MED_IMG.syringe},
  {id:'med_010',name:'أوجمنتين 1 جم — 14 قرص',price:135,cat:'med_antibio',emoji:'💊',unit:'علبة',image:KT_MED_IMG.blister_pack},
  {id:'med_011',name:'أموكسيل 500 مجم — 20 كبسولة',price:85,cat:'med_antibio',emoji:'💊',unit:'علبة',image:KT_MED_IMG.capsules_green},
  {id:'med_012',name:'زيثروماكس 500 مجم — 6 أقراص',price:110,cat:'med_antibio',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_multi},
  {id:'med_013',name:'فلاجيل 500 مجم — 20 قرص',price:48,cat:'med_antibio',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_014',name:'أنتينال 12 كبسولة',price:35,cat:'med_antibio',emoji:'💊',unit:'علبة',image:KT_MED_IMG.capsules_red},
  {id:'med_020',name:'كونجستال 20 قرص',price:30,cat:'med_cold',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_021',name:'تلفاست 180 مجم — 20 قرص',price:95,cat:'med_cold',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_round},
  {id:'med_022',name:'زيرتك 10 مجم — 20 قرص',price:65,cat:'med_cold',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_023',name:'كلاريتين 10 مجم — 20 قرص',price:70,cat:'med_cold',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_024',name:'أوتريفين بخاخ أنف',price:55,cat:'med_cold',emoji:'🧴',unit:'بخاخ',image:KT_MED_IMG.nasal_spray},
  {id:'med_025',name:'نازونكس بخاخ أنف',price:88,cat:'med_cold',emoji:'🧴',unit:'بخاخ',image:KT_MED_IMG.nasal_spray},
  {id:'med_030',name:'نيكسيوم 40 مجم — 14 قرص',price:145,cat:'med_digest',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_round},
  {id:'med_031',name:'موتيليوم 10 مجم — 30 قرص',price:58,cat:'med_digest',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_032',name:'بوسكوبان 10 مجم — 20 قرص',price:52,cat:'med_digest',emoji:'💊',unit:'علبة',image:KT_MED_IMG.blister_pack},
  {id:'med_033',name:'كونترولوك 20 مجم — 14 قرص',price:78,cat:'med_digest',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_040',name:'كونكور 5 مجم — 30 قرص',price:62,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_round},
  {id:'med_041',name:'كابوتن 25 مجم — 30 قرص',price:48,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_042',name:'جلوكوفاج 850 مجم — 30 قرص',price:55,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.blister_pack},
  {id:'med_043',name:'جانوفيا 100 مجم — 28 قرص',price:320,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_044',name:'ليبيتور 20 مجم — 30 قرص',price:180,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_multi},
  {id:'med_045',name:'كريستور 10 مجم — 30 قرص',price:165,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_round},
  {id:'med_046',name:'بلافيكس 75 مجم — 30 قرص',price:210,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_white},
  {id:'med_047',name:'يوتيروكس 50 مجم — 30 قرص',price:75,cat:'med_chronic',emoji:'💊',unit:'علبة',image:KT_MED_IMG.blister_pack},
  {id:'med_050',name:'فنتولين بخاخ',price:85,cat:'med_resp',emoji:'🧴',unit:'بخاخ',image:KT_MED_IMG.inhaler},
  {id:'med_051',name:'سيمبيكورت بخاخ',price:220,cat:'med_resp',emoji:'🧴',unit:'بخاخ',image:KT_MED_IMG.inhaler},
  {id:'med_060',name:'بيتادين محلول 120 مل',price:42,cat:'med_skin',emoji:'🧴',unit:'زجاجة',image:KT_MED_IMG.bottle_solution},
  {id:'med_061',name:'فيوسيدين مرهم 15 جم',price:38,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.cream_tube},
  {id:'med_062',name:'ميبو مرهم 25 جم',price:55,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.ointment},
  {id:'med_063',name:'بينتانين كريم 30 جم',price:48,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.cream_tube},
  {id:'med_064',name:'سودو كريم 125 جم',price:95,cat:'med_skin',emoji:'🧴',unit:'برطمان',image:KT_MED_IMG.cream_jar},
  {id:'med_065',name:'داكتارين كريم 30 جم',price:52,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.ointment},
  {id:'med_066',name:'كانستن كريم 20 جم',price:45,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.cream_tube},
  {id:'med_067',name:'زوفيراكس كريم 5 جم',price:60,cat:'med_skin',emoji:'🧴',unit:'أنبوب',image:KT_MED_IMG.ointment},
  {id:'med_070',name:'فيتامين د 50000 وحدة',price:65,cat:'med_vit',emoji:'💊',unit:'علبة',image:KT_MED_IMG.vitamins_gold},
  {id:'med_071',name:'فيتامين سي 1000 مجم',price:75,cat:'med_vit',emoji:'💊',unit:'علبة',image:KT_MED_IMG.vitamins_soft},
  {id:'med_072',name:'حديد فيروجلوبين',price:80,cat:'med_vit',emoji:'💊',unit:'علبة',image:KT_MED_IMG.capsules_red},
  {id:'med_073',name:'أوميجا 3 — 30 كبسولة',price:120,cat:'med_vit',emoji:'💊',unit:'علبة',image:KT_MED_IMG.capsules_blue},
  {id:'med_074',name:'زنك 50 مجم — 30 قرص',price:55,cat:'med_vit',emoji:'💊',unit:'علبة',image:KT_MED_IMG.tablets_yellow},
  {id:'med_080',name:'كمامات طبية — 50 قطعة',price:35,cat:'med_supplies',emoji:'😷',unit:'علبة',image:KT_MED_IMG.mask},
  {id:'med_081',name:'قفازات لاتكس — 100 قطعة',price:65,cat:'med_supplies',emoji:'🧤',unit:'علبة',image:KT_MED_IMG.gloves},
  {id:'med_082',name:'شاش طبي معقم 10 سم',price:15,cat:'med_supplies',emoji:'🩹',unit:'لفة',image:KT_MED_IMG.bandage},
  {id:'med_083',name:'جهاز قياس ضغط رقمي',price:850,cat:'med_supplies',emoji:'🩺',unit:'جهاز',image:KT_MED_IMG.bp_monitor},
  {id:'med_084',name:'جهاز قياس سكر رقمي',price:420,cat:'med_supplies',emoji:'🩸',unit:'جهاز',image:KT_MED_IMG.glucose_meter},
  {id:'med_085',name:'ترمومتر رقمي',price:95,cat:'med_supplies',emoji:'🌡️',unit:'جهاز',image:KT_MED_IMG.thermometer}
];

function ktBuildMedicineProducts(){
  return KT_MEDICINES.map(function(m){
    return {
      id: m.id, cat: 'pharmacy', brand: KT_PHARMACY.name,
      nameAr: m.name, nameEn: m.name, emoji: m.emoji, price: m.price,
      discount: 0, off: 0, weight: m.unit || '', rating: 4.7,
      reviews: 50 + Math.floor(Math.random()*200), stock: 100,
      bestSeller: false, isNew: false, featured: false, barcode: null,
      image: m.image || null, medCat: m.cat, isMedicine: true
    };
  });
}

var CATEGORIES = [
  {id:'grocery',ar:'بقالة',en:'Grocery',ic:'🛒',img:'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400'},
  {id:'beverages',ar:'مشروبات',en:'Beverages',ic:'🥤',img:'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'dairy',ar:'ألبان وبيض',en:'Dairy & Eggs',ic:'🥛',img:'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'bakery',ar:'مخبوزات',en:'Bakery',ic:'🥖',img:'https://images.pexels.com/photos/1387070/pexels-photo-1387070.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'fruits',ar:'فواكه وخضروات',en:'Fruits & Veggies',ic:'🥬',img:'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'frozen',ar:'مجمدات',en:'Frozen',ic:'🧊',img:'https://images.pexels.com/photos/4033324/pexels-photo-4033324.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'snacks',ar:'سناكس',en:'Snacks',ic:'🍿',img:'https://images.pexels.com/photos/1660030/pexels-photo-1660030.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'cleaning',ar:'منظفات',en:'Cleaning',ic:'🧴',img:'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'personal',ar:'عناية شخصية',en:'Personal Care',ic:'🧼',img:'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'home',ar:'مستلزمات منزلية',en:'Home',ic:'🏠',img:'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=400'},
  {id:'pharmacy',ar:'صيدلية الدكتور هشام',en:'Dr. Hesham Pharmacy',ic:'⚕️',img:'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400'}
];
var BRANDS = ['Juhayna','Almarai','Nada','Americana','Coca-Cola','Pepsi','Nestlé','Lipton','Al Alali','Persil','Dove',"Lay's",'Cadbury','Heinz','Barilla','Kanteen'];

var IMG = {
  pasta:'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=600',
  spaghetti:'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600',
  rice:'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=600',
  basmati:'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=600',
  flour:'https://images.pexels.com/photos/7030132/pexels-photo-7030132.jpeg?auto=compress&cs=tinysrgb&w=600',
  lentils:'https://images.pexels.com/photos/5128637/pexels-photo-5128637.jpeg?auto=compress&cs=tinysrgb&w=600',
  beans:'https://images.pexels.com/photos/4033324/pexels-photo-4033324.jpeg?auto=compress&cs=tinysrgb&w=600',
  chickpeas:'https://images.pexels.com/photos/5128637/pexels-photo-5128637.jpeg?auto=compress&cs=tinysrgb&w=600',
  honey:'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600',
  jam:'https://images.pexels.com/photos/4226881/pexels-photo-4226881.jpeg?auto=compress&cs=tinysrgb&w=600',
  tahini:'https://images.pexels.com/photos/4198020/pexels-photo-4198020.jpeg?auto=compress&cs=tinysrgb&w=600',
  ketchup:'https://images.pexels.com/photos/4198020/pexels-photo-4198020.jpeg?auto=compress&cs=tinysrgb&w=600',
  mayo:'https://images.pexels.com/photos/4198020/pexels-photo-4198020.jpeg?auto=compress&cs=tinysrgb&w=600',
  oil:'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=600',
  oliveoil:'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=600',
  sugar:'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=600',
  salt:'https://images.pexels.com/photos/235901/pexels-photo-235901.jpeg?auto=compress&cs=tinysrgb&w=600',
  soup:'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
  tuna:'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=600',
  corn:'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=600',
  coke:'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=600',
  pepsi:'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=600',
  sprite:'https://images.pexels.com/photos/8679784/pexels-photo-8679784.jpeg?auto=compress&cs=tinysrgb&w=600',
  fanta:'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600',
  redbull:'https://images.pexels.com/photos/3050476/pexels-photo-3050476.jpeg?auto=compress&cs=tinysrgb&w=600',
  tea:'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=600',
  greentea:'https://images.pexels.com/photos/1793035/pexels-photo-1793035.jpeg?auto=compress&cs=tinysrgb&w=600',
  coffee:'https://images.pexels.com/photos/2074122/pexels-photo-2074122.jpeg?auto=compress&cs=tinysrgb&w=600',
  juice:'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600',
  mango:'https://images.pexels.com/photos/6056944/pexels-photo-6056944.jpeg?auto=compress&cs=tinysrgb&w=600',
  applejuice:'https://images.pexels.com/photos/1543394/pexels-photo-1543394.jpeg?auto=compress&cs=tinysrgb&w=600',
  water:'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=600',
  sparkwater:'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=600',
  milk:'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=600',
  yogurt:'https://images.pexels.com/photos/373882/pexels-photo-373882.jpeg?auto=compress&cs=tinysrgb&w=600',
  greekyog:'https://images.pexels.com/photos/373882/pexels-photo-373882.jpeg?auto=compress&cs=tinysrgb&w=600',
  cheese:'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=600',
  cheddar:'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=600',
  mozzarella:'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600',
  cream:'https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?auto=compress&cs=tinysrgb&w=600',
  butter:'https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?auto=compress&cs=tinysrgb&w=600',
  eggs:'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=600',
  milkpowder:'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=600',
  rayeb:'https://images.pexels.com/photos/373882/pexels-photo-373882.jpeg?auto=compress&cs=tinysrgb&w=600',
  bread:'https://images.pexels.com/photos/1387070/pexels-photo-1387070.jpeg?auto=compress&cs=tinysrgb&w=600',
  toast:'https://images.pexels.com/photos/165537/pexels-photo-165537.jpeg?auto=compress&cs=tinysrgb&w=600',
  croissant:'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600',
  cake:'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
  donut:'https://images.pexels.com/photos/867452/pexels-photo-867452.jpeg?auto=compress&cs=tinysrgb&w=600',
  muffin:'https://images.pexels.com/photos/2127901/pexels-photo-2127901.jpeg?auto=compress&cs=tinysrgb&w=600',
  cookie:'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=600',
  finobread:'https://images.pexels.com/photos/209194/pexels-photo-209194.jpeg?auto=compress&cs=tinysrgb&w=600',
  tomato:'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=600',
  potato:'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=600',
  cucumber:'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=600',
  onion:'https://images.pexels.com/photos/115988/onions-onion-vegetables-vegetable-115988.jpeg?auto=compress&cs=tinysrgb&w=600',
  garlic:'https://images.pexels.com/photos/139259/garlic-food-vegetables-vegetable-139259.jpeg?auto=compress&cs=tinysrgb&w=600',
  carrot:'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=600',
  pepper:'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=600',
  eggplant:'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&cs=tinysrgb&w=600',
  zucchini:'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=600',
  okra:'https://images.pexels.com/photos/5778811/pexels-photo-5778811.jpeg?auto=compress&cs=tinysrgb&w=600',
  spinach:'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=600',
  lettuce:'https://images.pexels.com/photos/1199562/pexels-photo-1199562.jpeg?auto=compress&cs=tinysrgb&w=600',
  banana:'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&cs=tinysrgb&w=600',
  apple:'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=600',
  orange:'https://images.pexels.com/photos/691166/pexels-photo-691166.jpeg?auto=compress&cs=tinysrgb&w=600',
  lemon:'https://images.pexels.com/photos/1531908/pexels-photo-1531908.jpeg?auto=compress&cs=tinysrgb&w=600',
  strawberry:'https://images.pexels.com/photos/70746/strawberries-red-fruit-royalty-free-70746.jpeg?auto=compress&cs=tinysrgb&w=600',
  grapes:'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=600',
  watermelon:'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=600',
  melon:'https://images.pexels.com/photos/2907428/pexels-photo-2907428.jpeg?auto=compress&cs=tinysrgb&w=600',
  burger:'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600',
  nuggets:'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=600',
  icecream:'https://images.pexels.com/photos/1352281/pexels-photo-1352281.jpeg?auto=compress&cs=tinysrgb&w=600',
  mixedveg:'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=600',
  peas:'https://images.pexels.com/photos/428321/pexels-photo-428321.jpeg?auto=compress&cs=tinysrgb&w=600',
  fries:'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600',
  fish:'https://images.pexels.com/photos/3296277/pexels-photo-3296277.jpeg?auto=compress&cs=tinysrgb&w=600',
  shrimp:'https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&cs=tinysrgb&w=600',
  chips:'https://images.pexels.com/photos/1660030/pexels-photo-1660030.jpeg?auto=compress&cs=tinysrgb&w=600',
  doritos:'https://images.pexels.com/photos/4783228/pexels-photo-4783228.jpeg?auto=compress&cs=tinysrgb&w=600',
  chocolate:'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=600',
  cornflakes:'https://images.pexels.com/photos/96399/cereal-cornflakes-grain-breakfast-96399.jpeg?auto=compress&cs=tinysrgb&w=600',
  oreo:'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=600',
  nuts:'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=600',
  peanuts:'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=600',
  cashew:'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=600',
  crackers:'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=600',
  popcorn:'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=600',
  detergent:'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auto=compress&cs=tinysrgb&w=600',
  dishsoap:'https://images.pexels.com/photos/5217926/pexels-photo-5217926.jpeg?auto=compress&cs=tinysrgb&w=600',
  floorclean:'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=600',
  tissues:'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=600',
  bleach:'https://images.pexels.com/photos/5217926/pexels-photo-5217926.jpeg?auto=compress&cs=tinysrgb&w=600',
  airfresh:'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=600',
  glassclean:'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auto=compress&cs=tinysrgb&w=600',
  shampoo:'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=600',
  antidand:'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=600',
  conditioner:'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=600',
  toothpaste:'https://images.pexels.com/photos/298611/pexels-photo-298611.jpeg?auto=compress&cs=tinysrgb&w=600',
  soap:'https://images.pexels.com/photos/4202345/pexels-photo-4202345.jpeg?auto=compress&cs=tinysrgb&w=600',
  deodorant:'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=600',
  facewash:'https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg?auto=compress&cs=tinysrgb&w=600',
  cream2:'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=600',
  razors:'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
  pads:'https://images.pexels.com/photos/4047186/pexels-photo-4047186.jpeg?auto=compress&cs=tinysrgb&w=600',
  diaper:'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=600',
  trash:'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auto=compress&cs=tinysrgb&w=600',
  foil:'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=600',
  clingfilm:'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=600',
  waxpaper:'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=600',
  batteries:'https://images.pexels.com/photos/40747/batteries-battery-accumulator-40747.jpeg?auto=compress&cs=tinysrgb&w=600',
  candle:'https://images.pexels.com/photos/2782720/pexels-photo-2782720.jpeg?auto=compress&cs=tinysrgb&w=600',
  matches:'https://images.pexels.com/photos/844244/pexels-photo-844244.jpeg?auto=compress&cs=tinysrgb&w=600',
  toothpicks:'https://images.pexels.com/photos/3737597/pexels-photo-3737597.jpeg?auto=compress&cs=tinysrgb&w=600',
  ziplock:'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=600',
  food:'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600',
  flowers:'https://images.pexels.com/photos/1083822/pexels-photo-1083822.jpeg?auto=compress&cs=tinysrgb&w=600',
  mart:'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=600'
};

function P(id, cat, brand, nameAr, nameEn, emoji, price, off, weight, rating, barcode, imageUrl){
  var discount = off > 0 ? Math.round(price * (1 - off / 100)) : 0;
  return { id: id, cat: cat, brand: brand, nameAr: nameAr, nameEn: nameEn, emoji: emoji, price: price, discount: discount, off: off, weight: weight, rating: rating, barcode: barcode || null, image: imageUrl || null, reviews: 20 + Math.floor(Math.random() * 300), stock: 30 + Math.floor(Math.random() * 150), bestSeller: Math.random() > 0.6, isNew: Math.random() > 0.85, featured: Math.random() > 0.7 };
}

var PRODUCTS = [
  P(1,'grocery','Barilla','مكرونة بيني 500ج','Penne Pasta','🍝',22,15,'500g',4.6,'8076800105056',IMG.pasta),
  P(2,'grocery','Heinz','كاتشب طماطم 400ج','Ketchup','🍅',35,0,'400g',4.7,'8715700110872',IMG.ketchup),
  P(3,'grocery','Al Alali','أرز مصري فاخر 1ك','Rice 1kg','🍚',45,20,'1kg',4.5,'6291108730045',IMG.rice),
  P(4,'grocery','Gallina','شوربة دجاج','Chicken Soup','🍲',15,0,'60g',4.3,null,IMG.soup),
  P(5,'grocery','Al Alali','زيت دوار الشمس 1ل','Sunflower Oil','🫒',72,10,'1L',4.4,'6291108730083',IMG.oil),
  P(6,'grocery','Al Alali','سكر أبيض 1ك','Sugar 1kg','🧂',25,0,'1kg',4.6,null,IMG.sugar),
  P(53,'grocery','Barilla','سباجيتي 500ج','Spaghetti','🍝',24,10,'500g',4.7,null,IMG.spaghetti),
  P(54,'grocery','Al Alali','أرز بسمتي 1ك','Basmati Rice','🍚',65,15,'1kg',4.6,null,IMG.basmati),
  P(55,'grocery','Kanteen','دقيق فاخر 1ك','Flour 1kg','🌾',18,0,'1kg',4.5,null,IMG.flour),
  P(56,'grocery','Kanteen','عدس أصفر 500ج','Lentils','🥣',32,0,'500g',4.6,null,IMG.lentils),
  P(57,'grocery','Kanteen','فاصوليا بيضاء 500ج','White Beans','🫘',28,10,'500g',4.5,null,IMG.beans),
  P(58,'grocery','Kanteen','حمص حب 500ج','Chickpeas','🟡',25,0,'500g',4.6,null,IMG.chickpeas),
  P(59,'grocery','Langnese','عسل نحل 500ج','Honey','🍯',145,20,'500g',4.9,null,IMG.honey),
  P(60,'grocery','Hero','مربى فراولة 340ج','Jam','🍓',48,10,'340g',4.6,null,IMG.jam),
  P(61,'grocery','Al Wadi','طحينة 400ج','Tahini','🥣',62,5,'400g',4.7,null,IMG.tahini),
  P(62,'grocery','Hellmanns','مايونيز 400ج','Mayonnaise','🥚',55,0,'400g',4.6,null,IMG.mayo),
  P(63,'grocery','Al Alali','زيت زيتون 750م','Olive Oil','🫒',185,15,'750ml',4.8,null,IMG.oliveoil),
  P(64,'grocery','Kanteen','ملح طعام 500ج','Salt','🧂',8,0,'500g',4.5,null,IMG.salt),
  P(65,'grocery','John West','تونة معلبة 140ج','Tuna','🐟',35,10,'140g',4.6,null,IMG.tuna),
  P(66,'grocery','Green Giant','ذرة معلبة 340ج','Corn','🌽',28,0,'340g',4.5,null,IMG.corn),
  P(7,'beverages','Coca-Cola','كوكاكولا 1.5ل','Coca-Cola 1.5L','🥤',20,10,'1.5L',4.7,'5449000000439',IMG.coke),
  P(8,'beverages','Pepsi','بيبسي 1ل','Pepsi 1L','🥤',18,0,'1L',4.5,'4062108003044',IMG.pepsi),
  P(9,'beverages','Lipton','شاي ليبتون 100 فتلة','Lipton Tea','🍵',62,15,'100 bags',4.8,'8714100772222',IMG.tea),
  P(10,'beverages','Nestlé','نسكافيه جولد 200ج','Nescafé Gold','☕',145,20,'200g',4.9,'7613036992364',IMG.coffee),
  P(11,'beverages','Juhayna','عصير برتقال 1ل','Orange Juice','🧃',30,0,'1L',4.6,null,IMG.juice),
  P(12,'beverages','Nestlé','مياه معدنية ×6','Water ×6','💧',52,5,'6 bot',4.7,null,IMG.water),
  P(67,'beverages','Sprite','سبرايت 1.5ل','Sprite','🥤',20,0,'1.5L',4.6,null,IMG.sprite),
  P(68,'beverages','Fanta','فانتا برتقال 1.5ل','Fanta','🍊',20,10,'1.5L',4.7,null,IMG.fanta),
  P(69,'beverages','Red Bull','ريد بُل 250م','Red Bull','⚡',95,0,'250ml',4.8,null,IMG.redbull),
  P(70,'beverages','Lipton','شاي أخضر 25 فتلة','Green Tea','🍃',42,10,'25 bags',4.7,null,IMG.greentea),
  P(71,'beverages','Juhayna','عصير مانجو 1ل','Mango Juice','🥭',32,0,'1L',4.8,null,IMG.mango),
  P(72,'beverages','Juhayna','عصير تفاح 1ل','Apple Juice','🍎',30,5,'1L',4.6,null,IMG.applejuice),
  P(73,'beverages','Schweppes','مياه فوارة 1ل','Sparkling Water','💧',25,0,'1L',4.5,null,IMG.sparkwater),
  P(74,'beverages','Nescafé','نسكافيه كلاسيك 100ج','Nescafé Classic','☕',85,15,'100g',4.7,null,IMG.coffee),
  P(75,'beverages','Kanteen','شاي بالنعناع 20 فتلة','Mint Tea','🌿',28,0,'20 bags',4.6,null,IMG.greentea),
  P(13,'dairy','Juhayna','لبن كامل الدسم 1ل','Full Milk','🥛',25,0,'1L',4.8,null,IMG.milk),
  P(14,'dairy','Juhayna','زبادي طبيعي 400ج','Yogurt','🥣',18,10,'400g',4.6,null,IMG.yogurt),
  P(15,'dairy','Almarai','جبنة بيضاء 500ج','White Cheese','🧀',45,15,'500g',4.5,null,IMG.cheese),
  P(16,'dairy','Almarai','زبدة 100ج','Butter','🧈',38,0,'100g',4.7,null,IMG.butter),
  P(17,'dairy','Kanteen','بيض طازج ×30','Eggs ×30','🥚',105,0,'30 pack',4.8,null,IMG.eggs),
  P(18,'dairy','Nada','لبن بودرة 400ج','Milk Powder','🥛',72,12,'400g',4.4,null,IMG.milkpowder),
  P(76,'dairy','Almarai','لبن رايب 1ل','Rayeb Milk','🥛',28,0,'1L',4.7,null,IMG.rayeb),
  P(77,'dairy','Juhayna','زبادي يوناني 150ج','Greek Yogurt','🥣',22,5,'150g',4.8,null,IMG.greekyog),
  P(78,'dairy','Almarai','جبنة شيدر 200ج','Cheddar','🧀',58,10,'200g',4.7,null,IMG.cheddar),
  P(79,'dairy','Galbani','جبنة موزاريلا 200ج','Mozzarella','🧀',65,0,'200g',4.8,null,IMG.mozzarella),
  P(80,'dairy','Puck','قشطة 170ج','Cream','🥛',28,5,'170g',4.7,null,IMG.cream),
  P(81,'dairy','Nada','زبادي فراولة 140ج','Strawberry Yogurt','🍓',10,0,'140g',4.6,null,IMG.yogurt),
  P(82,'dairy','Lurpak','زبدة فاخرة 200ج','Premium Butter','🧈',95,15,'200g',4.9,null,IMG.butter),
  P(83,'dairy','Kiri','جبنة كريمي ×8','Cream Cheese','🧀',45,0,'8 pc',4.7,null,IMG.cream),
  P(84,'dairy','Juhayna','لبن خالي الدسم 1ل','Skim Milk','🥛',26,0,'1L',4.5,null,IMG.milk),
  P(19,'bakery','Kanteen','خبز فينو ×5','Fino Bread','🥖',18,0,'5 pack',4.5,null,IMG.finobread),
  P(20,'bakery','Kanteen','خبز بلدي','Baladi Bread','🥯',4,0,'1 loaf',4.7,null,IMG.bread),
  P(21,'bakery','Kanteen','توست أسمر 500ج','Brown Toast','🍞',32,8,'500g',4.6,null,IMG.toast),
  P(22,'bakery','Kanteen','كرواسون شوكولاتة','Croissant','🥐',22,0,'1 pc',4.8,null,IMG.croissant),
  P(23,'bakery','Kanteen','كيك إسفنجي 400ج','Sponge Cake','🍰',72,15,'400g',4.6,null,IMG.cake),
  P(85,'bakery','Dunkin','دونات شوكولاتة','Donut','🍩',25,0,'1 pc',4.8,null,IMG.donut),
  P(86,'bakery','Kanteen','مافن فانيليا','Muffin','🧁',22,10,'1 pc',4.7,null,IMG.muffin),
  P(87,'bakery','Kanteen','بسكويت شوفان 250ج','Oatmeal Cookies','🍪',42,0,'250g',4.7,null,IMG.cookie),
  P(88,'bakery','Kanteen','توست أبيض 500ج','White Toast','🍞',28,5,'500g',4.5,null,IMG.toast),
  P(89,'bakery','Kanteen','كرواسون بالجبن','Cheese Croissant','🥐',25,0,'1 pc',4.7,null,IMG.croissant),
  P(90,'bakery','Kanteen','كيك شوكولاتة 400ج','Chocolate Cake','🍫',78,15,'400g',4.8,null,IMG.cake),
  P(91,'bakery','Kanteen','خبز صمول ×6','Sesame Bread','🥯',20,0,'6 pack',4.6,null,IMG.bread),
  P(24,'fruits','Kanteen','طماطم طازجة 1ك','Tomatoes','🍅',20,0,'1kg',4.6,null,IMG.tomato),
  P(25,'fruits','Kanteen','بطاطس 1ك','Potatoes','🥔',17,0,'1kg',4.5,null,IMG.potato),
  P(26,'fruits','Kanteen','خيار 1ك','Cucumbers','🥒',14,10,'1kg',4.6,null,IMG.cucumber),
  P(27,'fruits','Kanteen','موز 1ك','Bananas','🍌',25,0,'1kg',4.8,null,IMG.banana),
  P(28,'fruits','Kanteen','تفاح أحمر 1ك','Red Apples','🍎',52,15,'1kg',4.7,null,IMG.apple),
  P(29,'fruits','Kanteen','برتقال 1ك','Oranges','🍊',32,0,'1kg',4.6,null,IMG.orange),
  P(30,'fruits','Kanteen','ليمون 500ج','Lemons','🍋',20,0,'500g',4.5,null,IMG.lemon),
  P(92,'fruits','Kanteen','بصل أحمر 1ك','Red Onions','🧅',18,0,'1kg',4.6,null,IMG.onion),
  P(93,'fruits','Kanteen','ثوم 250ج','Garlic','🧄',22,0,'250g',4.7,null,IMG.garlic),
  P(94,'fruits','Kanteen','جزر 1ك','Carrots','🥕',15,10,'1kg',4.6,null,IMG.carrot),
  P(95,'fruits','Kanteen','فلفل ألوان 500ج','Peppers','🫑',35,0,'500g',4.7,null,IMG.pepper),
  P(96,'fruits','Kanteen','باذنجان 1ك','Eggplant','🍆',16,0,'1kg',4.5,null,IMG.eggplant),
  P(97,'fruits','Kanteen','كوسة 1ك','Zucchini','🥒',14,0,'1kg',4.6,null,IMG.zucchini),
  P(98,'fruits','Kanteen','بامية 500ج','Okra','🟢',28,10,'500g',4.5,null,IMG.okra),
  P(99,'fruits','Kanteen','سبانخ 500ج','Spinach','🥬',20,0,'500g',4.6,null,IMG.spinach),
  P(100,'fruits','Kanteen','خس 1 رأس','Lettuce','🥬',12,0,'1 head',4.5,null,IMG.lettuce),
  P(101,'fruits','Kanteen','فراولة 500ج','Strawberries','🍓',65,15,'500g',4.9,null,IMG.strawberry),
  P(102,'fruits','Kanteen','عنب أحمر 1ك','Red Grapes','🍇',85,0,'1kg',4.8,null,IMG.grapes),
  P(103,'fruits','Kanteen','بطيخ كامل','Watermelon','🍉',55,10,'1 pc',4.7,null,IMG.watermelon),
  P(104,'fruits','Kanteen','كنتالوب','Cantaloupe','🍈',35,0,'1 pc',4.6,null,IMG.melon),
  P(31,'frozen','Americana','برجر لحمة ×6','Burgers ×6','🍔',105,20,'6 pc',4.6,null,IMG.burger),
  P(32,'frozen','Americana','ناجتس دجاج 500ج','Nuggets','🍗',85,15,'500g',4.5,null,IMG.nuggets),
  P(33,'frozen','Nestlé','آيس كريم فانيليا 1ل','Ice Cream','🍦',95,0,'1L',4.8,null,IMG.icecream),
  P(34,'frozen','Kanteen','خضار مشكلة 400ج','Mixed Veg','🥦',32,10,'400g',4.4,null,IMG.mixedveg),
  P(35,'frozen','Kanteen','بسلة مجمدة 400ج','Peas','🟢',25,0,'400g',4.5,null,IMG.peas),
  P(105,'frozen','McCain','بطاطس مقلية 750ج','Fries','🍟',55,10,'750g',4.7,null,IMG.fries),
  P(106,'frozen','Kanteen','سمك فيليه 500ج','Fish Fillet','🐟',125,15,'500g',4.6,null,IMG.fish),
  P(107,'frozen','Kanteen','جمبري مجمد 500ج','Shrimp','🦐',185,10,'500g',4.7,null,IMG.shrimp),
  P(108,'frozen','Americana','كفتة لحمة 500ج','Kofta','🥩',95,0,'500g',4.7,null,IMG.burger),
  P(109,'frozen','Kanteen','بامية مجمدة 400ج','Frozen Okra','🟢',35,0,'400g',4.5,null,IMG.okra),
  P(110,'frozen','Nestlé','آيس كريم شوكولاتة 1ل','Choc Ice Cream','🍫',98,10,'1L',4.9,null,IMG.icecream),
  P(111,'frozen','Kanteen','ملوخية مجمدة 400ج','Molokhia','🌿',28,0,'400g',4.6,null,IMG.spinach),
  P(36,'snacks',"Lay's",'شيبسي 170ج','Chips','🥔',28,0,'170g',4.7,null,IMG.chips),
  P(37,'snacks','Doritos','دوريتوس 200ج','Doritos','🌮',32,10,'200g',4.6,null,IMG.doritos),
  P(38,'snacks','Cadbury','شوكولاتة 100ج','Dairy Milk','🍫',40,15,'100g',4.9,null,IMG.chocolate),
  P(39,'snacks',"Kellogg's",'كورن فليكس 375ج','Corn Flakes','🥣',75,20,'375g',4.5,null,IMG.cornflakes),
  P(40,'snacks','Kanteen','أوريو 150ج','Oreo','🍪',25,0,'150g',4.7,null,IMG.oreo),
  P(112,'snacks','Kanteen','لوز نيء 250ج','Almonds','🌰',135,10,'250g',4.8,null,IMG.nuts),
  P(113,'snacks','Kanteen','فول سوداني 250ج','Peanuts','🥜',45,0,'250g',4.6,null,IMG.peanuts),
  P(114,'snacks','Kanteen','كاجو محمص 200ج','Cashew','🥜',185,15,'200g',4.9,null,IMG.cashew),
  P(115,'snacks','Ritz','بسكويت مالح 200ج','Crackers','🍘',35,0,'200g',4.5,null,IMG.crackers),
  P(116,'snacks','Kanteen','فشار 100ج','Popcorn','🍿',18,10,'100g',4.6,null,IMG.popcorn),
  P(117,'snacks','Snickers','سنيكرز 50ج','Snickers','🍫',25,0,'50g',4.8,null,IMG.chocolate),
  P(118,'snacks','Twix','تويكس 50ج','Twix','🍫',25,0,'50g',4.7,null,IMG.chocolate),
  P(119,'snacks','Kinder','كيندر بوينو','Kinder Bueno','🍫',45,10,'2 pc',4.9,null,IMG.chocolate),
  P(120,'snacks','Pringles','برينجلز 200ج','Pringles','🥔',55,0,'200g',4.7,null,IMG.chips),
  P(121,'snacks','KitKat','كيت كات','KitKat','🍫',35,5,'4 pc',4.8,null,IMG.chocolate),
  P(41,'cleaning','Persil','مسحوق غسيل 3ك','Detergent','🧴',195,20,'3kg',4.7,null,IMG.detergent),
  P(42,'cleaning','Kanteen','سائل أطباق 1ل','Dish Soap','🧼',38,0,'1L',4.5,null,IMG.dishsoap),
  P(43,'cleaning','Kanteen','مطهر أرضيات 2ل','Floor Cleaner','🧽',50,15,'2L',4.6,null,IMG.floorclean),
  P(44,'cleaning','Kanteen','مناديل ×6','Tissues','🧻',62,0,'6 rolls',4.7,null,IMG.tissues),
  P(122,'cleaning','Clorox','كلور 1ل','Bleach','🧴',32,10,'1L',4.6,null,IMG.bleach),
  P(123,'cleaning','Glade','معطر جو 300م','Air Freshener','🌸',65,0,'300ml',4.7,null,IMG.airfresh),
  P(124,'cleaning','Ajax','منظف زجاج 500م','Glass Cleaner','🪟',45,10,'500ml',4.6,null,IMG.glassclean),
  P(125,'cleaning','Dettol','مطهر 1ل','Antiseptic','🧴',85,0,'1L',4.8,null,IMG.floorclean),
  P(126,'cleaning','Vanish','مبيض ملابس 1ل','Stain Remover','👕',95,15,'1L',4.7,null,IMG.detergent),
  P(127,'cleaning','Pril','سائل أطباق 750م','Dish Soap 750ml','🧼',48,0,'750ml',4.6,null,IMG.dishsoap),
  P(128,'cleaning','Comfort','منعم أقمشة 1ل','Fabric Softener','🌸',75,10,'1L',4.7,null,IMG.detergent),
  P(129,'cleaning','Finish','أقراص غسالة ×30','Dishwasher Tablets','💊',185,0,'30 pc',4.8,null,IMG.dishsoap),
  P(45,'personal','Dove','شامبو دوف 400م','Dove Shampoo','🧴',105,25,'400ml',4.8,null,IMG.shampoo),
  P(46,'personal','Head&Shoulders','ضد القشرة 400م','Anti-Dandruff','🧴',125,20,'400ml',4.7,null,IMG.antidand),
  P(47,'personal','Kanteen','معجون أسنان 100م','Toothpaste','🪥',32,0,'100ml',4.6,null,IMG.toothpaste),
  P(48,'personal','Kanteen','صابون استحمام 120ج','Bath Soap','🧼',18,0,'120g',4.5,null,IMG.soap),
  P(130,'personal','Sunsilk','بلسم شعر 400م','Conditioner','🧴',95,15,'400ml',4.6,null,IMG.conditioner),
  P(131,'personal','Nivea','كريم بشرة 200م','Body Cream','🧴',125,10,'200ml',4.8,null,IMG.cream2),
  P(132,'personal','Rexona','مزيل عرق 150م','Deodorant','💨',85,0,'150ml',4.7,null,IMG.deodorant),
  P(133,'personal','Garnier','غسول وجه 200م','Face Wash','🧼',95,20,'200ml',4.7,null,IMG.facewash),
  P(134,'personal','Gillette','شفرات حلاقة ×4','Razors ×4','🪒',75,0,'4 pc',4.6,null,IMG.razors),
  P(135,'personal','Always','فوط صحية ×10','Pads ×10','🌷',42,10,'10 pc',4.8,null,IMG.pads),
  P(136,'personal','Pampers','حفاضات أطفال ×50','Diapers ×50','👶',285,15,'50 pc',4.9,null,IMG.diaper),
  P(137,'personal','Oral-B','فرشاة أسنان','Toothbrush','🪥',35,0,'1 pc',4.7,null,IMG.toothpaste),
  P(49,'home','Kanteen','أكياس قمامة ×30','Trash Bags','🗑️',40,10,'30 pc',4.6,null,IMG.trash),
  P(50,'home','Kanteen','قصدير مطبخ 30م','Alum Foil','✨',32,0,'30m',4.5,null,IMG.foil),
  P(51,'home','Kanteen','بلاستيك تغليف 30م','Cling Film','📦',25,15,'30m',4.4,null,IMG.clingfilm),
  P(52,'home','Kanteen','ورق مشمع 50م','Wax Paper','📄',20,0,'50m',4.3,null,IMG.waxpaper),
  P(138,'home','Energizer','بطاريات AA ×4','Batteries ×4','🔋',65,10,'4 pc',4.7,null,IMG.batteries),
  P(139,'home','Kanteen','شمع ×6','Candles ×6','🕯️',28,0,'6 pc',4.5,null,IMG.candle),
  P(140,'home','Kanteen','أعواد كبريت ×10','Matches ×10','🔥',12,0,'10 pc',4.4,null,IMG.matches),
  P(141,'home','Kanteen','أعواد أسنان 250ج','Toothpicks','🥢',15,0,'250g',4.5,null,IMG.toothpicks),
  P(142,'home','Kanteen','أكياس حفظ ×50','Ziplock Bags','📦',45,10,'50 pc',4.7,null,IMG.ziplock),
  P(143,'home','Kanteen','دفاية صغيرة','Small Heater','🔥',385,20,'1 pc',4.6,null,IMG.batteries),
  P(144,'home','Kanteen','مكنسة يد','Hand Vacuum','🧹',650,15,'1 pc',4.7,null,IMG.batteries),
  P(145,'home','Kanteen','علاقة ملابس ×10','Hangers ×10','👕',55,0,'10 pc',4.5,null,IMG.ziplock),
  P(146,'grocery','Nutella','نوتيلا 350ج','Nutella 350g','🍫',125,10,'350g',4.9,null,IMG.chocolate),
  P(147,'grocery','Kelloggs','شوكولاتة كورن فليكس','Choco Flakes','🥣',85,15,'375g',4.7,null,IMG.cornflakes),
  P(148,'beverages','Starbucks','قهوة سريعة','Instant Coffee','☕',195,10,'100g',4.8,null,IMG.coffee),
  P(149,'snacks','Ferrero','فيريرو روشيه ×16','Ferrero ×16','🍫',385,20,'16 pc',4.9,null,IMG.chocolate),
  P(150,'snacks','Toblerone','توبليرون 100ج','Toblerone','🍫',65,0,'100g',4.8,null,IMG.chocolate),
  P(151,'personal','Vaseline','فازلين 100م','Vaseline','🧴',48,10,'100ml',4.7,null,IMG.cream2),
  P(152,'dairy','Activia','أكتيفيا زبادي 4×','Activia 4pk','🥣',35,0,'4 pc',4.7,null,IMG.yogurt)
];

var SERVICE_CATEGORIES = [
  {id:'food', title:'اطلب الطعام', titleEn:'Order Food', desc:'توصيل مجاني وعروض حصرية وأكثر لدى شركائنا من المطاعم', descEn:'Free delivery and exclusive offers from our restaurant partners', img:IMG.food, btnText:'اطلب الآن', btnTextEn:'Order Now'},
  {id:'grocery', title:'اطلب البقالة', titleEn:'Order Groceries', desc:'لا تضيع وقتك في الانتظار. نوصل لك كل ما تحتاجه من أفضل متاجر البقالة', descEn:'Don\'t waste time waiting. We deliver everything you need from the best grocery stores', img:IMG.tomato, btnText:'اشترِ الآن', btnTextEn:'Buy Now'},
  {id:'flowers', title:'اطلب الورود', titleEn:'Order Flowers', desc:'نقوم بتوصيل الورد لحبايبك — القسم قريباً جداً', descEn:'We deliver flowers to your loved ones — Coming very soon', img:IMG.flowers, btnText:'قريباً 💐', btnTextEn:'Coming 💐'},
  {id:'medicine', title:'صيدلية الدكتور هشام', titleEn:'Dr. Hesham Pharmacy', desc:'كل أصناف الدواء في السوق — توصيل سريع لجميع الأدوية', descEn:'All medicines in the market — fast delivery for all medications', img:KT_MED_IMG.pharmacy_hero, btnText:'اطلب الدواء', btnTextEn:'Order Medicine'},
  {id:'mart', title:'شليل مارت', titleEn:'Shleil Mart', desc:'توصيل سريع في أقل من 20 دقيقة', descEn:'Fast delivery in less than 20 minutes', img:IMG.mart, btnText:'اطلب الآن', btnTextEn:'Order Now'}
];

var QUICK_SERVICES = [
  {id:'all', label:'الكل', labelEn:'All', emoji:'🏪'},
  {id:'food', label:'الطعام', labelEn:'Food', emoji:'🍔'},
  {id:'grocery', label:'البقالة', labelEn:'Grocery', emoji:'🛒'},
  {id:'flowers', label:'الورود', labelEn:'Flowers', emoji:'💐'},
  {id:'medicine', label:'صيدلية د. هشام', labelEn:'Dr. Hesham Pharmacy', emoji:'⚕️'},
  {id:'mart', label:'شليل مارت', labelEn:'Shleil Mart', emoji:'⚡'}
];

var SEARCH_SUGGESTIONS = [
  {q:'كوكاكولا', qEn:'Coca-Cola', cat:'beverages'}, {q:'بيبسي', qEn:'Pepsi', cat:'beverages'}, {q:'لبن', qEn:'Milk', cat:'dairy'},
  {q:'جبنة', qEn:'Cheese', cat:'dairy'}, {q:'بيض', qEn:'Eggs', cat:'dairy'}, {q:'خبز', qEn:'Bread', cat:'bakery'},
  {q:'أرز', qEn:'Rice', cat:'grocery'}, {q:'مكرونة', qEn:'Pasta', cat:'grocery'}, {q:'زيت', qEn:'Oil', cat:'grocery'},
  {q:'سكر', qEn:'Sugar', cat:'grocery'}, {q:'شاي', qEn:'Tea', cat:'beverages'}, {q:'قهوة', qEn:'Coffee', cat:'beverages'},
  {q:'عصير', qEn:'Juice', cat:'beverages'}, {q:'موز', qEn:'Bananas', cat:'fruits'}, {q:'تفاح', qEn:'Apples', cat:'fruits'},
  {q:'طماطم', qEn:'Tomatoes', cat:'fruits'}, {q:'بطاطس', qEn:'Potatoes', cat:'fruits'}, {q:'شيبسي', qEn:'Chips', cat:'snacks'},
  {q:'شوكولاتة', qEn:'Chocolate', cat:'snacks'}, {q:'بسكويت', qEn:'Biscuits', cat:'snacks'}, {q:'منظف', qEn:'Detergent', cat:'cleaning'},
  {q:'صابون', qEn:'Soap', cat:'cleaning'}, {q:'شامبو', qEn:'Shampoo', cat:'personal'}, {q:'معجون أسنان', qEn:'Toothpaste', cat:'personal'},
  {q:'بانادول', qEn:'Panadol', cat:'pharmacy'}, {q:'أوجمنتين', qEn:'Augmentin', cat:'pharmacy'}, {q:'دواء', qEn:'Medicine', cat:'pharmacy'}
];

var COUPONS = [
  {code:'KANTEEN10', type:'pct', value:10, min:100, max:50},
  {code:'NEW20', type:'pct', value:20, min:150, max:80},
  {code:'FLAT50', type:'fixed', value:50, min:300, max:50},
  {code:'FREESHIP', type:'ship', value:0, min:200, max:0}
];
var WA_NUMBER = '201124169656';
var FB_URL = 'https://www.facebook.com/share/1d75yqdVA9/';
var INSTAPAY_NUMBER = '01124169656';
var VODAFONE_NUMBER = '01124169656';

var EGYPT_GOVS = {
  "القاهرة":["مدينة نصر","مصر الجديدة","المعادي","حلوان","شبرا","الزمالك","وسط البلد","التبين","البساتين","السيدة زينب","مصر القديمة","المقطم","عين شمس","المرج","السلام","النزهة","شرابية","روض الفرج","الساحل","الزاوية الحمراء","الأميرية","حدائق القبة","الوايلي","عابدين","بولاق","منشية ناصر","15 مايو","الرحاب","مدينتي"],
  "الجيزة":["الدقي","العجوزة","المهندسين","الهرم","فيصل","إمبابة","الوراق","أوسيم","كرداسة","البدرشين","العياط","الصف","أطفيح","الواحات البحرية","6 أكتوبر","الشيخ زايد","حدائق الأهرام","الحوامدية","منشأة القناطر"],
  "الإسكندرية":["المنتزه","شرق","وسط","غرب","الجمرك","العطارين","محرم بك","كرموز","المكس","الدخيلة","العامرية","برج العرب","العجمي","سيدي جابر","سموحة","سيدي بشر","المنارة","أبو قير","البيطاش"],
  "الدقهلية":["المنصورة","ميت غمر","دكرنس","طلخا","بلقاس","منية النصر","تمي الأمديد","الجمالية","شربين","المطرية","بني عبيد"],
  "الشرقية":["الزقازيق","بلبيس","العاشر من رمضان","منيا القمح","أبو حماد","ههيا","ديرب نجم","فاقوس","أبو كبير","كفر صقر","أولاد صقر","الإبراهيمية","مشتول السوق","القنايات","صان الحجر","الحسينية"],
  "القليوبية":["بنها","القناطر الخيرية","قليوب","شبرا الخيمة","الخانكة","طوخ","كفر شكر","قها"],
  "كفر الشيخ":["كفر الشيخ","دسوق","فوه","مطوبس","سيدي سالم","قلين","الرياض","بيلا","الحامول","بلطيم"],
  "البحيرة":["دمنهور","كفر الدوار","إيتاي البارود","أبو حمص","الدلنجات","كوم حمادة","رشيد","إدكو","أبو المطامير","حوش عيسى","شبراخيت","المحمودية","الرحمانية","بدر","النوبارية"],
  "الغربية":["طنطا","المحلة الكبرى","كفر الزيات","زفتى","السنطة","بسيون","قطور","سمنود"],
  "المنوفية":["شبين الكوم","منوف","السادات","أشمون","الباجور","قويسنا","بركة السبع","تلا","الشهداء"],
  "أسيوط":["أسيوط","ديروط","منفلوط","القوصية","أبنوب","الفتح","ساحل سليم","البداري","صدفا","الغنايم","أبوتيج"],
  "سوهاج":["سوهاج","طهطا","طما","المنشاة","جرجا","البلينا","المراغة","أخميم","ساقلته","جهينة"],
  "قنا":["قنا","نجع حمادي","قفط","دشنا","أبو تشت","فرشوط","الوقف","نقادة","قنا الجديدة"],
  "الأقصر":["الأقصر","إسنا","أرمنت","الطود","البياضية","القرنة","طيبة"],
  "أسوان":["أسوان","كوم أمبو","إدفو","دراو","نصر النوبة","أبو سمبل"],
  "البحر الأحمر":["الغردقة","سفاجا","القصير","مرسى علم","رأس غارب","الشلاتين","حلايب"],
  "الوادي الجديد":["الخارجة","الداخلة","الفرافرة","باريس","بلاط"],
  "مطروح":["مرسى مطروح","الحمام","العلمين","الضبعة","سيدي براني","السلوم","النجيلة","سيوة"],
  "شمال سيناء":["العريش","الشيخ زويد","رفح","بئر العبد","الحسنة","نخل"],
  "جنوب سيناء":["الطور","شرم الشيخ","دهب","نويبع","طابا","سانت كاترين","أبو رديس","رأس سدر"],
  "بورسعيد":["بورسعيد","بورفؤاد"],
  "السويس":["السويس","الأربعين","عتاقة","الجناين","فيصل"],
  "الإسماعيلية":["الإسماعيلية","فايد","القنطرة شرق","القنطرة غرب","التل الكبير","أبو صوير","القصاصين"],
  "دمياط":["دمياط","رأس البر","فارسكور","كفر سعد","الزرقا","كفر البطيخ"],
  "بني سويف":["بني سويف","الواسطى","ناصر","إهناسيا","ببا","سمسطا","الفشن"],
  "الفيوم":["الفيوم","سنورس","إطسا","طامية","يوسف الصديق","أبشواي"],
  "المنيا":["المنيا","ملوي","سمالوط","بني مزار","مطاي","مغاغة","أبو قرقاص","دير مواس","العدوة"]
};

var ktMerchantProducts = [];
var ktMerchantsCache = [];

function ktApplyMerchantProductsToProducts(){
  for (var j = PRODUCTS.length - 1; j >= 0; j--){
    if (PRODUCTS[j] && PRODUCTS[j].merchantId) PRODUCTS.splice(j, 1);
  }
  ktMerchantProducts.forEach(function(mp){
    if (mp.status && mp.status !== 'approved') return;
    var fullId = mp.fullId;
    var exists = PRODUCTS.findIndex(function(p){ return String(p.id) === String(fullId); });
    if (exists >= 0) return;
    PRODUCTS.push({
      id: fullId, cat: mp.cat || 'grocery',
      brand: mp.brand || mp.merchantName || 'متجر',
      nameAr: mp.name, nameEn: mp.name || '',
      emoji: mp.emoji || '🛒', price: parseFloat(mp.price) || 0,
      discount: 0, off: 0, weight: mp.weight || '',
      rating: 4.5, reviews: 0, stock: 100,
      bestSeller: false, isNew: true, featured: false,
      barcode: mp.barcode || null, image: mp.image || null,
      merchantName: mp.merchantName, merchantId: mp.merchantId,
      merchantPhone: mp.merchantPhone, merchantWhatsapp: mp.merchantWhatsapp,
      addedAt: mp.addedAt || new Date().toISOString()
    });
  });
}

function ktSyncFromFirebase(){
  if (!window.KT_FB){ setTimeout(ktSyncFromFirebase, 1000); return; }
  KT_FB.listenMerchants(function(merchants){
    ktMerchantsCache = merchants || [];
    ktMerchantProducts = [];
    ktMerchantsCache.forEach(function(m){
      var isApproved = (m.status === 'approved') || !m.status;
      if (!isApproved) return;
      (m.products || []).forEach(function(mp){
        ktMerchantProducts.push({
          fullId: 'merchant_' + (m._fbId || m.id) + '_' + mp.id,
          id: mp.id, name: mp.name,
          brand: mp.brand || m.name,
          cat: mp.cat || 'grocery',
          price: mp.price, weight: mp.weight || '',
          emoji: mp.emoji || '🛒', image: mp.image || null,
          barcode: mp.barcode || null,
          merchantId: m._fbId || m.id,
          merchantName: m.name,
          merchantPhone: m.phone,
          merchantWhatsapp: m.whatsapp,
          addedAt: mp.addedAt || m.approvedAt || new Date().toISOString(),
          status: m.status || 'approved'
        });
      });
    });
    ktApplyMerchantProductsToProducts();
    if (!PRODUCTS.some(function(p){ return p.isMedicine; })){
      ktBuildMedicineProducts().forEach(function(p){ PRODUCTS.push(p); });
    }
    if (typeof render === 'function') render();
  });
}

var state = {
  cart: LS.get('cart', []),
  wishlist: LS.get('wishlist', []),
  user: LS.get('user', null),
  users: LS.get('users', []),
  orders: LS.get('orders', []),
  coupon: LS.get('coupon', null),
  recent: LS.get('recent', []),
  route: null
};

if (window.KT_FB){
  ktSyncFromFirebase();
  setTimeout(function(){
    KT_FB.test().then(function(ok){
      if (ok) ktShowFbStatus('🔥 Firebase متصل', false);
      else ktShowFbStatus('⚠️ Firebase فشل', true);
    });
  }, 1500);
}

var KT_LANG = LS.get('lang', 'ar');
document.documentElement.lang = KT_LANG;
document.documentElement.dir = KT_LANG === 'ar' ? 'rtl' : 'ltr';

var KT_T = {
  ar: {
    hero_word_1: 'شبيك', hero_word_2: 'لبيك...', hero_word_3: 'كانتِين', hero_word_4: 'بين ايدك',
    hero_lead: 'كل احتياجاتك اليومية — <span class="hl">توصيل فوري</span> لباب بيتك.',
    hero_cta: 'اطلب الآن', hero_secondary: '🎁 شاهد العروض', hero_tag: 'توصيل خلال 10 دقائق',
    hero_feat_1: 'توصيل فوري', hero_feat_2: 'طازج يومياً', hero_feat_3: 'أسعار منافسة', hero_feat_4: 'ضمان الاسترجاع',
    sec_shop_now: '🛍️ اطلب احتياجاتك الآن', sec_by_category: 'تسوّق حسب القسم',
    sec_offers: '🔥 عروض اليوم', sec_new_from_stores: '🔥 جديد من المتاجر',
    sec_best_sellers: '⭐ الأكثر مبيعاً', sec_new_arrivals: '🆕 وصل حديثاً',
    sec_brands: 'العلامات التجارية', sec_similar: 'منتجات مشابهة', sec_view_all: 'عرض الكل',
    action_add_to_cart: 'أضف للسلة', action_buy_now: 'اشترِ الآن', action_checkout: 'إتمام الطلب',
    action_view_cart: 'عرض السلة', action_continue: 'التالي', action_back: 'رجوع',
    action_close: 'إغلاق', action_save: 'حفظ', action_cancel: 'إلغاء', action_delete: 'حذف',
    action_confirm: 'تأكيد', action_call: 'اتصال', action_whatsapp: 'واتساب', action_apply: 'تطبيق',
    cart_title: 'سلة التسوق', cart_empty: 'سلتك فارغة', cart_start_shopping: 'ابدأ التسوق',
    cart_browse_products: 'تصفح المنتجات', cart_subtotal: 'المجموع الفرعي', cart_delivery: 'التوصيل',
    cart_discount: 'الخصم', cart_total: 'الإجمالي', cart_free: 'مجاناً',
    cart_coupon: 'كود الخصم', cart_summary: 'ملخص الطلب', cart_qty: 'الكمية',
    co_title: 'إتمام الطلب', co_step_1: 'بياناتك', co_step_2: 'العنوان', co_step_3: 'الوقت',
    co_step_4: 'الدفع', co_step_5: 'الملخص', co_step_6: 'تأكيد',
    co_name: 'الاسم الكامل', co_phone: 'رقم الهاتف', co_email: 'البريد الإلكتروني',
    co_gov: 'المحافظة', co_city: 'المركز / المدينة', co_area: 'المنطقة', co_street: 'الشارع',
    co_building: 'رقم المبنى', co_floor: 'الدور', co_notes: 'ملاحظات للمندوب',
    co_select_gov: '— اختر المحافظة —', co_select_city: '— اختر المركز —',
    co_asap: 'في أقرب وقت', co_asap_desc: 'خلال 10-20 دقيقة', co_later: 'جدولة الطلب', co_later_desc: 'اختر وقت مناسب',
    co_pay_cod: 'الدفع عند الاستلام', co_pay_cod_desc: 'ادفع للمندوب عند التسليم',
    co_pay_insta: 'InstaPay — إنستاباي', co_pay_insta_desc: 'تحويل فوري',
    co_pay_voda: 'فودافون كاش', co_pay_voda_desc: 'تحويل من محفظة فودافون',
    co_pay_paypal: 'PayPal', co_pay_paypal_desc: 'دفع دولي آمن',
    co_pay_fawry: 'فوري', co_pay_fawry_desc: 'ادفع من أي منفذ فوري',
    co_ready: 'جاهز للتأكيد', co_confirm_order: '✓ تأكيد الطلب',
    co_fill_data: 'املأ البيانات', co_autofill: '⚡ معبأ تلقائياً',
    prod_brand: 'العلامة', prod_size: 'الحجم', prod_rating: 'التقييم',
    prod_available: 'متوفر', prod_save: 'وفّر', prod_desc_prefix: 'منتج', prod_desc_suffix: 'عالي الجودة من',
    auth_welcome: 'مرحباً بك في كانتِين', auth_choose: 'اختر نوع الحساب للمتابعة',
    auth_customer: 'عميل — تسجيل دخول', auth_customer_desc: 'تسوّق، اطلب، وتابع طلباتك بسهولة',
    auth_merchant: 'تاجر — سجّل متجرك', auth_merchant_desc: 'أضف منتجاتك وابدأ استقبال الطلبات',
    auth_driver: 'مندوب توصيل', auth_driver_desc: 'استلم طلبات ووصّلها واكسب من 15 ج.م لكل طلب',
    auth_new: 'جديد', auth_note: '💡 التسجيل برقم الهاتف أو البريد — كود OTP تجريبي: <b>1234</b>',
    auth_settings: '⚙️ الإعدادات',
    otp_login: 'تسجيل الدخول / إنشاء حساب', otp_subtitle: 'اختر طريقة التسجيل',
    otp_phone: 'رقم الهاتف', otp_send: 'إرسال الكود',
    otp_note: '🔒 كود تجريبي للتطوير: <b style="color:var(--gold);font-size:16px">1234</b>',
    otp_code: 'كود التحقق (4 أرقام)', otp_verify: 'تحقق ودخول', otp_change: '← تغيير',
    otp_resend_in: 'يمكنك إعادة الإرسال بعد 60 ثانية', otp_resend: 'إعادة إرسال الكود',
    otp_sent_to: 'تم إرسال الكود إلى', otp_invalid: '❌ الكود غير صحيح', otp_invalid_phone: '❌ اكتب رقم هاتف صحيح',
    acc_welcome: 'مرحباً بك', acc_login_desc: 'سجّل دخولك للوصول لحسابك',
    acc_login_phone: '📱 تسجيل برقم الهاتف / الإيميل', acc_orders: 'طلباتي', acc_wishlist: 'المفضلة',
    acc_logout: 'خروج', acc_customer: 'عميل كانتِين',
    ord_title: 'طلباتي', ord_empty: 'لا توجد طلبات بعد', ord_browse: 'تصفح المنتجات', ord_items: 'منتج',
    ord_status_placed: 'تم استلام الطلب', ord_status_pending: 'بانتظار تأكيد الدفع',
    ord_status_confirmed: 'تم التأكيد', ord_status_preparing: 'جاري التحضير',
    ord_status_out: 'خرج للتوصيل', ord_status_delivered: 'تم التسليم ✓',
    ord_track: 'تتبع الطلب', ord_track_live: '🗺️ تتبع مباشر', ord_driver_on_way: 'المندوب في الطريق',
    search_all: 'كل المنتجات', search_results: 'نتائج', search_deals: '🔥 عروض اليوم',
    search_sort: 'ترتيب', search_sort_default: 'افتراضي', search_sort_price_asc: 'السعر تصاعدي',
    search_sort_price_desc: 'السعر تنازلي', search_sort_popular: 'الأكثر شعبية',
    search_sort_rating: 'الأعلى تقييماً', search_filter_cat: 'الأقسام', search_filter_all: 'الكل',
    search_filter_deals: 'عروض فقط', search_no_results: 'لا نتائج', search_try_other: 'جرّب البحث بكلمة أخرى',
    search_clear: 'مسح الكل', search_products: 'منتج',
    near_title: 'المتاجر القريبة', near_your_loc: '📍 موقعك الحالي',
    near_can_deliver: 'متجر يوصّل لك في نطاق 10 كم', near_inside: '✅ يوصّل لك',
    near_outside: '❌ خارج النطاق', near_no_stores: 'لا توجد متاجر مسجلة',
    near_register: 'سجّل متجرك', near_km: 'كم', near_products: 'منتج',
    loc_current: '📍 موقعي الحالي', loc_detecting: 'جاري تحديد موقعك...',
    loc_enter_address: 'ادخل عنوان التوصيل', loc_nearby_stores: '🏪 المتاجر القريبة',
    loc_search_placeholder: 'ابحث عن منطقة، شارع، معلم...',
    chat_title: 'مساعد كانتِين', chat_online: 'متصل — يرد فوراً', chat_input: 'اسألني...',
    chat_greeting: 'أهلاً وسهلاً! 👋 كيف أقدر أساعدك؟',
    chat_quick_1: 'كيف أتتبع طلبي؟', chat_quick_2: 'أسعار التوصيل؟', chat_quick_3: 'كوبونات الخصم؟', chat_quick_4: 'طرق الدفع؟',
    bot_track: '📦 <b>آخر طلب:</b>', bot_status: 'الحالة:', bot_no_orders: 'لم تقم بأي طلبات بعد.',
    bot_delivery: '⚡ التوصيل يستغرق <b>10-20 دقيقة</b>.<br>الطلبات فوق <b>500 ج.م</b> توصيل مجاني!',
    bot_coupons: '🎁 الكوبونات:', bot_pay: '💳 طرق الدفع:', bot_contact: '📞 <b>تواصل:</b>',
    bot_drivers: '🛵 للمناديب:', bot_register_driver: 'سجّل كمندوب من هنا', bot_earn: 'واكسب من 15 ج.م لكل طلب!',
    bot_hello: 'أهلاً وسهلاً! 👋 كيف أقدر أساعدك؟', bot_not_understood: 'آسف، لم أفهم 🤔',
    footer_desc: 'بقالة ومشروبات ومستلزمات يومية — توصيل سريع لباب بيتك في دقائق.',
    footer_slogan: '"شبيك لبيك... كانتين بين ايدك"',
    footer_pwa_install: '📲 ثبّت التطبيق على موبايلك', footer_pwa_installed: '✅ التطبيق مثبّت',
    footer_shop: 'تسوّق', footer_links: 'روابط', footer_contact: 'تواصل',
    footer_account: 'حسابي', footer_orders: 'طلباتي', footer_wishlist: 'المفضلة',
    footer_for_merchants: '🏪 للتجار', footer_for_drivers: '🛵 للمناديب', footer_admin: '⚙️ الإدارة',
    footer_whatsapp: 'واتساب', footer_facebook: 'فيسبوك', footer_copyright: 'جميع الحقوق محفوظة.',
    footer_developed_by: '💻 تم التطوير بواسطة', footer_developer_name: 'المهندس هلال شليل',
    theme_dark: '🟠 وضع داكن', theme_light: '⚪ وضع فاتح', theme_toggle: 'تبديل المظهر',
    lang_toggle: 'English', lang_switch_to: 'English',
    general_egp: 'ج.م', general_km: 'كم', general_loading: 'جاري التحميل...',
    general_welcome: 'مرحباً', general_good_morning: 'صباح الخير', general_good_evening: 'مساء الخير',
    general_added: 'تمت الإضافة', general_removed: 'تم الحذف', general_error: 'حدث خطأ',
    general_success: 'تم بنجاح', general_gps_not_supported: 'المتصفح لا يدعم GPS',
    general_location_error: 'لم نتمكن من تحديد موقعك',
    payment_instapay: 'InstaPay — إنستاباي', payment_vodafone: 'فودافون كاش',
    payment_paypal: 'PayPal', payment_fawry: 'فوري',
    payment_number: '📱 رقم التحويل', payment_send_receipt: 'أرسل صورة الإيصال',
    payment_receipt_desc: 'اضغط الزر ده لفتح واتساب مباشرة برسالة جاهزة',
    payment_send_wa: 'أرسل الإيصال على واتساب',
    payment_electronic: 'الدفع الإلكتروني', payment_follow_steps: 'اتبع 3 خطوات لتأكيد طلبك',
    payment_amount: 'المبلغ المطلوب', payment_order_code: 'رقم الطلب',
    payment_step_1: 'حوّل المبلغ', payment_step_2: 'صوّر الإيصال', payment_step_3: 'أرسل الإيصال على واتساب',
    payment_step_1_desc: 'افتح تطبيق الدفع وحوّل المبلغ', payment_step_2_desc: 'خد سكرين شوت أو صورة لرسالة التحويل',
    payment_step_3_desc: 'هيتأكد طلبك فوراً وهيظهر في لوحة التحكم',
    track_live_title: '🗺️ تتبع مباشر', track_driver: 'المندوب', track_live_map: 'موقع المندوب الآن',
    track_live_update: '🛰️ تحديث مباشر', track_last_update: 'آخر تحديث:',
    track_no_driver: 'لم يتم تعيين مندوب بعد', track_no_driver_desc: 'سيتم تعيين مندوب قريباً',
    track_show_status: 'عرض حالة الطلب', track_delivery_addr: 'عنوان التسليم',
    track_building: '🏢 مبنى:', track_floor: 'الدور:',
    order_not_found: 'الطلب غير موجود'
  },
  en: {
    hero_word_1: 'Order', hero_word_2: 'Anytime!', hero_word_3: 'Kanteen', hero_word_4: 'is here',
    hero_lead: 'Everything you need daily — <span class="hl">instant delivery</span> to your door.',
    hero_cta: 'Order Now', hero_secondary: '🎁 See Offers', hero_tag: 'Delivered in 10 minutes',
    hero_feat_1: 'Instant delivery', hero_feat_2: 'Fresh daily', hero_feat_3: 'Best prices', hero_feat_4: 'Return guarantee',
    sec_shop_now: '🛍️ Order Your Needs Now', sec_by_category: 'Shop by Category',
    sec_offers: '🔥 Today\'s Offers', sec_new_from_stores: '🔥 New from Stores',
    sec_best_sellers: '⭐ Best Sellers', sec_new_arrivals: '🆕 New Arrivals',
    sec_brands: 'Brands', sec_similar: 'Similar Products', sec_view_all: 'View All',
    action_add_to_cart: 'Add to Cart', action_buy_now: 'Buy Now', action_checkout: 'Checkout',
    action_view_cart: 'View Cart', action_continue: 'Next', action_back: 'Back',
    action_close: 'Close', action_save: 'Save', action_cancel: 'Cancel', action_delete: 'Delete',
    action_confirm: 'Confirm', action_call: 'Call', action_whatsapp: 'WhatsApp', action_apply: 'Apply',
    cart_title: 'Shopping Cart', cart_empty: 'Your cart is empty', cart_start_shopping: 'Start Shopping',
    cart_browse_products: 'Browse Products', cart_subtotal: 'Subtotal', cart_delivery: 'Delivery',
    cart_discount: 'Discount', cart_total: 'Total', cart_free: 'Free',
    cart_coupon: 'Coupon code', cart_summary: 'Order Summary', cart_qty: 'Quantity',
    co_title: 'Checkout', co_step_1: 'Your Info', co_step_2: 'Address', co_step_3: 'Time',
    co_step_4: 'Payment', co_step_5: 'Summary', co_step_6: 'Confirm',
    co_name: 'Full Name', co_phone: 'Phone Number', co_email: 'Email',
    co_gov: 'Governorate', co_city: 'City', co_area: 'Area', co_street: 'Street',
    co_building: 'Building No.', co_floor: 'Floor', co_notes: 'Notes for Driver',
    co_select_gov: '— Select Governorate —', co_select_city: '— Select City —',
    co_asap: 'As soon as possible', co_asap_desc: 'Within 10-20 minutes', co_later: 'Schedule Order', co_later_desc: 'Choose a suitable time',
    co_pay_cod: 'Cash on Delivery', co_pay_cod_desc: 'Pay the driver on delivery',
    co_pay_insta: 'InstaPay', co_pay_insta_desc: 'Instant transfer',
    co_pay_voda: 'Vodafone Cash', co_pay_voda_desc: 'Vodafone wallet transfer',
    co_pay_paypal: 'PayPal', co_pay_paypal_desc: 'Secure international payment',
    co_pay_fawry: 'Fawry', co_pay_fawry_desc: 'Pay from any Fawry outlet',
    co_ready: 'Ready to confirm', co_confirm_order: '✓ Confirm Order',
    co_fill_data: 'Fill in the data', co_autofill: '⚡ Auto-filled',
    prod_brand: 'Brand', prod_size: 'Size', prod_rating: 'Rating',
    prod_available: 'Available', prod_save: 'Save', prod_desc_prefix: 'Product', prod_desc_suffix: 'premium quality from',
    auth_welcome: 'Welcome to Kanteen', auth_choose: 'Choose account type to continue',
    auth_customer: 'Customer — Sign In', auth_customer_desc: 'Shop, order, and track your orders easily',
    auth_merchant: 'Merchant — Register Your Store', auth_merchant_desc: 'Add your products and start receiving orders',
    auth_driver: 'Delivery Driver', auth_driver_desc: 'Take orders, deliver them, and earn 15 EGP per order',
    auth_new: 'New', auth_note: '💡 Phone or Email registration — Demo OTP: <b>1234</b>',
    auth_settings: '⚙️ Settings',
    otp_login: 'Sign In / Create Account', otp_subtitle: 'Choose registration method',
    otp_phone: 'Phone Number', otp_send: 'Send Code',
    otp_note: '🔒 Demo code for development: <b style="color:var(--gold);font-size:16px">1234</b>',
    otp_code: 'Verification Code (4 digits)', otp_verify: 'Verify & Sign In', otp_change: '← Change',
    otp_resend_in: 'You can resend in 60 seconds', otp_resend: 'Resend Code',
    otp_sent_to: 'Code sent to', otp_invalid: '❌ Invalid code', otp_invalid_phone: '❌ Enter a valid phone number',
    acc_welcome: 'Welcome', acc_login_desc: 'Sign in to access your account',
    acc_login_phone: '📱 Sign in with Phone / Email', acc_orders: 'My Orders', acc_wishlist: 'Wishlist',
    acc_logout: 'Logout', acc_customer: 'Kanteen Customer',
    ord_title: 'My Orders', ord_empty: 'No orders yet', ord_browse: 'Browse Products', ord_items: 'items',
    ord_status_placed: 'Order Received', ord_status_pending: 'Awaiting Payment',
    ord_status_confirmed: 'Confirmed', ord_status_preparing: 'Preparing',
    ord_status_out: 'Out for Delivery', ord_status_delivered: 'Delivered ✓',
    ord_track: 'Track Order', ord_track_live: '🗺️ Live Track', ord_driver_on_way: 'Driver is on the way',
    search_all: 'All Products', search_results: 'Results', search_deals: '🔥 Today\'s Deals',
    search_sort: 'Sort', search_sort_default: 'Default', search_sort_price_asc: 'Price: Low to High',
    search_sort_price_desc: 'Price: High to Low', search_sort_popular: 'Most Popular',
    search_sort_rating: 'Top Rated', search_filter_cat: 'Categories', search_filter_all: 'All',
    search_filter_deals: 'Deals only', search_no_results: 'No results', search_try_other: 'Try another keyword',
    search_clear: 'Clear All', search_products: 'products',
    near_title: 'Nearby Stores', near_your_loc: '📍 Your Location',
    near_can_deliver: 'stores can deliver within 10 km', near_inside: '✅ Can deliver',
    near_outside: '❌ Out of range', near_no_stores: 'No registered stores',
    near_register: 'Register your store', near_km: 'km', near_products: 'products',
    loc_current: '📍 My Location', loc_detecting: 'Detecting location...',
    loc_enter_address: 'Enter delivery address', loc_nearby_stores: '🏪 Nearby Stores',
    loc_search_placeholder: 'Search area, street, landmark...',
    chat_title: 'Kanteen Assistant', chat_online: 'Online — replies instantly', chat_input: 'Ask me...',
    chat_greeting: 'Welcome! 👋 How can I help you?',
    chat_quick_1: 'How to track my order?', chat_quick_2: 'Delivery prices?', chat_quick_3: 'Discount coupons?', chat_quick_4: 'Payment methods?',
    bot_track: '📦 <b>Last order:</b>', bot_status: 'Status:', bot_no_orders: 'You haven\'t made any orders yet.',
    bot_delivery: '⚡ Delivery takes <b>10-20 minutes</b>.<br>Orders over <b>500 EGP</b> get free delivery!',
    bot_coupons: '🎁 Coupons:', bot_pay: '💳 Payment methods:', bot_contact: '📞 <b>Contact:</b>',
    bot_drivers: '🛵 For drivers:', bot_register_driver: 'Register as driver here', bot_earn: 'and earn 15 EGP per order!',
    bot_hello: 'Welcome! 👋 How can I help you?', bot_not_understood: 'Sorry, I didn\'t understand 🤔',
    footer_desc: 'Groceries, drinks and daily essentials — fast delivery to your door in minutes.',
    footer_slogan: '"Order anytime... Kanteen is here"',
    footer_pwa_install: '📲 Install app on your phone', footer_pwa_installed: '✅ App installed',
    footer_shop: 'Shop', footer_links: 'Links', footer_contact: 'Contact',
    footer_account: 'My Account', footer_orders: 'My Orders', footer_wishlist: 'Wishlist',
    footer_for_merchants: '🏪 For Merchants', footer_for_drivers: '🛵 For Drivers', footer_admin: '⚙️ Admin',
    footer_whatsapp: 'WhatsApp', footer_facebook: 'Facebook', footer_copyright: 'All rights reserved.',
    footer_developed_by: '💻 Developed by', footer_developer_name: 'Eng. Helal Shleil',
    theme_dark: '🟠 Dark Mode', theme_light: '⚪ Light Mode', theme_toggle: 'Toggle Theme',
    lang_toggle: 'عربي', lang_switch_to: 'العربية',
    general_egp: 'EGP', general_km: 'km', general_loading: 'Loading...',
    general_welcome: 'Welcome', general_good_morning: 'Good morning', general_good_evening: 'Good evening',
    general_added: 'Added', general_removed: 'Removed', general_error: 'Error occurred',
    general_success: 'Success', general_gps_not_supported: 'Browser doesn\'t support GPS',
    general_location_error: 'Could not detect location',
    payment_instapay: 'InstaPay', payment_vodafone: 'Vodafone Cash',
    payment_paypal: 'PayPal', payment_fawry: 'Fawry',
    payment_number: '📱 Transfer Number', payment_send_receipt: 'Send Receipt Photo',
    payment_receipt_desc: 'Click the button to open WhatsApp with a ready message',
    payment_send_wa: 'Send Receipt on WhatsApp',
    payment_electronic: 'Electronic Payment', payment_follow_steps: 'Follow 3 steps to confirm your order',
    payment_amount: 'Amount Due', payment_order_code: 'Order Code',
    payment_step_1: 'Transfer the amount', payment_step_2: 'Photograph the receipt', payment_step_3: 'Send receipt on WhatsApp',
    payment_step_1_desc: 'Open the payment app and transfer the amount', payment_step_2_desc: 'Take a screenshot of the transfer message',
    payment_step_3_desc: 'Your order will be confirmed instantly',
    track_live_title: '🗺️ Live Tracking', track_driver: 'Driver', track_live_map: 'Driver location now',
    track_live_update: '🛰️ Live update', track_last_update: 'Last update:',
    track_no_driver: 'No driver assigned yet', track_no_driver_desc: 'A driver will be assigned soon',
    track_show_status: 'Show order status', track_delivery_addr: 'Delivery Address',
    track_building: '🏢 Building:', track_floor: 'Floor:',
    order_not_found: 'Order not found'
  }
};

function t(key){
  return (KT_T[KT_LANG] && KT_T[KT_LANG][key]) || (KT_T.ar && KT_T.ar[key]) || key;
}

function ktToggleLang(){
  KT_LANG = KT_LANG === 'ar' ? 'en' : 'ar';
  LS.set('lang', KT_LANG);
  applyLang();
  ktToast(KT_LANG === 'ar' ? '🇪🇬 العربية' : '🇬🇧 English', 'success');
}

function applyLang(){
  document.documentElement.lang = KT_LANG;
  document.documentElement.dir = KT_LANG === 'ar' ? 'rtl' : 'ltr';
  var langBtn = document.getElementById('ktLangBtn');
  if (langBtn){ langBtn.innerHTML = '<span id="ktLangLabel">EN</span>'; }
  var searchInput = document.getElementById('ktAddressInput');
  if (searchInput) searchInput.placeholder = t('loc_search_placeholder');
  var headerSearch = document.getElementById('k-search-input');
  if (headerSearch) headerSearch.placeholder = KT_LANG === 'en' ? 'Search products...' : 'ابحث عن منتج...';
  var chatInput = document.getElementById('kt-chat-input');
  if (chatInput) chatInput.placeholder = t('chat_input');
  var chatTitle = document.querySelector('.kt-chat-info b');
  if (chatTitle) chatTitle.textContent = t('chat_title');
  var chatStatus = document.querySelector('.kt-chat-info span');
  if (chatStatus) chatStatus.textContent = t('chat_online');
  var locBarBtn = document.querySelector('.kt-locbar-btn');
  if (locBarBtn) locBarBtn.textContent = t('loc_current');
  var nearbyBtn = document.querySelectorAll('.kt-locbar-submit')[1];
  if (nearbyBtn) nearbyBtn.textContent = t('loc_nearby_stores');
  var submitBtn = document.querySelectorAll('.kt-locbar-submit')[0];
  if (submitBtn) submitBtn.textContent = t('loc_enter_address');
  var zoneText = document.getElementById('ktZoneText');
  if (zoneText && ktZoneStatus === 'checking') zoneText.textContent = KT_LANG === 'en' ? 'Checking...' : 'جاري التحقق...';
  var nearbyPill = document.querySelector('.kt-fab-pill.nearby .txt');
  if (nearbyPill) nearbyPill.textContent = KT_LANG === 'en' ? 'Nearby Stores' : 'متاجر قريبة';
  var chatPill = document.querySelector('.kt-fab-pill.chat .txt');
  if (chatPill) chatPill.textContent = KT_LANG === 'en' ? 'Kanteen Assistant' : 'مساعد كانتِين';
  var menuLinks = document.querySelectorAll('.k-menu a');
  if (menuLinks.length === 4){
    menuLinks[0].textContent = KT_LANG === 'en' ? 'Categories' : 'الأقسام';
    menuLinks[1].textContent = KT_LANG === 'en' ? 'Offers' : 'العروض';
    menuLinks[2].textContent = KT_LANG === 'en' ? 'Best Sellers' : 'الأكثر مبيعاً';
    menuLinks[3].textContent = KT_LANG === 'en' ? 'My Orders' : 'طلباتي';
  }
  var shopNow = document.getElementById('ktShopNowBtn');
  if (shopNow) shopNow.textContent = KT_LANG === 'en' ? 'Shop Now' : 'تسوّق الآن';
  var bnavTexts = {
    home: KT_LANG === 'en' ? 'Home' : 'الرئيسية',
    cats: KT_LANG === 'en' ? 'Categories' : 'الأقسام',
    mega: KT_LANG === 'en' ? 'Menu' : 'قائمة',
    cart: KT_LANG === 'en' ? 'Cart' : 'السلة',
    account: KT_LANG === 'en' ? 'Account' : 'حسابي'
  };
  Object.keys(bnavTexts).forEach(function(nav){
    var el = document.querySelector('.k-bnav[data-nav="' + nav + '"]');
    if (!el) return;
    var spans = Array.from(el.children).filter(function(child){
      return child.tagName === 'SPAN'
        && !child.classList.contains('k-badge')
        && !child.classList.contains('kt-mega-icon')
        && !child.classList.contains('kt-mega-status');
    });
    spans.forEach(function(sp){ sp.textContent = bnavTexts[nav]; });
  });
  if (typeof render === 'function') render();
  refreshIcons();
}

var KT_THEMES = ['dark', 'light'];
var currentTheme = LS.get('theme', 'dark');

function applyTheme(theme){
  if (KT_THEMES.indexOf(theme) === -1) theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  LS.set('theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  var colors = { dark:'#02060f', light:'#f7f8fb' };
  if (meta) meta.setAttribute('content', colors[theme] || '#02060f');
}
function ktToggleTheme(){
  var next = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  ktToast(t('theme_' + next), 'success');
  refreshIcons();
}
applyTheme(currentTheme);

function persist(k){ LS.set(k, state[k]); }
function productName(p){
  if (!p) return '';
  return (KT_LANG === 'en' && p.nameEn) ? p.nameEn : (p.nameAr || p.name || '');
}
function findBy(id){
  var p = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
  if (p) return p;
  var cartItem = state.cart.find(function(i){ return String(i.id) === String(id); });
  if (cartItem && cartItem._storeProduct){
    return { id: id, nameAr: cartItem._storeProduct.name, nameEn: cartItem._storeProduct.name, price: cartItem._storeProduct.price, discount: 0, off: 0, emoji: cartItem._storeProduct.emoji || '🛒', image: cartItem._storeProduct.image, brand: cartItem._storeProduct.storeName, stock: 999, rating: 4.5, reviews: 0, cat: 'grocery', weight: '' };
  }
  return undefined;
}
var catById = function(id){ return CATEGORIES.find(function(c){ return c.id === id; }); };
var catName = function(c){ return c ? (KT_LANG === 'en' ? (c.en || c.ar) : c.ar) : ''; };
var finalPrice = function(p){ return p.discount > 0 ? p.discount : p.price; };
var cartCount = function(){ return state.cart.reduce(function(n, i){ return n + i.qty; }, 0); };
var cartTotal = function(){ return state.cart.reduce(function(s, i){ var p = findBy(i.id); return p ? s + finalPrice(p) * i.qty : s; }, 0); };
var deliveryFee = function(){ var sub = cartTotal(); if(sub === 0) return 0; if(state.coupon && state.coupon.type === 'ship') return 0; if(sub >= 500) return 0; return 25; };
var discountAmt = function(){ if(!state.coupon) return 0; var sub = cartTotal(), c = state.coupon; if(sub < c.min) return 0; if(c.type === 'pct') return Math.min(sub * c.value / 100, c.max); if(c.type === 'fixed') return Math.min(c.value, c.max); return 0; };
var grandTotal = function(){ return Math.max(0, cartTotal() + deliveryFee() - discountAmt()); };
function searchProducts(q){ if(!q) return PRODUCTS; q = q.toLowerCase().trim(); return PRODUCTS.filter(function(p){ return productName(p).toLowerCase().indexOf(q) !== -1 || (p.nameAr || '').toLowerCase().indexOf(q) !== -1 || (p.nameEn || '').toLowerCase().indexOf(q) !== -1 || (p.brand || '').toLowerCase().indexOf(q) !== -1; }); }

function ktRenderPriceComparison(product){
  var name = product.nameEn || product.nameAr;
  var brand = product.brand || '';
  var q = encodeURIComponent(name + ' ' + brand);
  var cfPrice = product.lowestOnlinePrice || null;
  return '<div class="kt-price-box"><div class="kt-price-head"><span class="icon">💰</span><div><b>' + (KT_LANG === 'en' ? 'Online Price Comparison' : 'مقارنة الأسعار أونلاين') + '</b><span>' + (KT_LANG === 'en' ? 'Click any store' : 'اضغط على أي متجر') + '</span></div></div>' + (cfPrice ? '<div class="kt-price-low"><span class="fresh-c bold">✓ ' + (KT_LANG === 'en' ? 'Lowest price' : 'أقل سعر') + '</span><b class="fresh-c" style="font-size:20px">' + money(cfPrice) + '</b></div>' : '') + '<div class="kt-price-grid"><a href="https://www.carrefouregypt.com/mafegy/en/v4/search?keyword=' + q + '" target="_blank" rel="noopener" class="kt-price-store"><span class="em">🛒</span><span>' + (KT_LANG === 'en' ? 'Carrefour' : 'كارفور') + '</span></a><a href="https://www.spinneys-egypt.com/search?q=' + q + '" target="_blank" rel="noopener" class="kt-price-store"><span class="em">🥬</span><span>' + (KT_LANG === 'en' ? 'Spinneys' : 'سبينس') + '</span></a><a href="https://www.talabat.com/egypt/grocery/search?q=' + q + '" target="_blank" rel="noopener" class="kt-price-store"><span class="em">🛵</span><span>' + (KT_LANG === 'en' ? 'Talabat' : 'طلبات') + '</span></a><a href="https://www.instashop.com.eg/en-eg/search?q=' + q + '" target="_blank" rel="noopener" class="kt-price-store"><span class="em">📱</span><span>InstaShop</span></a></div><a href="https://www.google.com/search?q=' + q + '+سعر+مصر&tbm=shop" target="_blank" rel="noopener" class="kt-price-search">' + (KT_LANG === 'en' ? '🔍 Search on Google Shopping' : '🔍 ابحث على Google Shopping') + '</a></div>';
}

function ktSendOrderToWhatsApp(order){
  var lines = [];
  lines.push(KT_LANG === 'en' ? '🛒 *New Order from Kanteen*' : '🛒 *طلب جديد من كانتِين*');
  lines.push('');
  lines.push((KT_LANG === 'en' ? '📦 *Order:* ' : '📦 *رقم الطلب:* ') + order.id);
  lines.push((KT_LANG === 'en' ? '🕐 *Date:* ' : '🕐 *التاريخ:* ') + new Date(order.createdAt).toLocaleString(KT_LANG === 'en' ? 'en-US' : 'ar-EG'));
  lines.push('');
  lines.push(KT_LANG === 'en' ? '👤 *Customer:*' : '👤 *بيانات العميل:*');
  lines.push((KT_LANG === 'en' ? '• Name: ' : '• الاسم: ') + (order.customer.name || '—'));
  lines.push((KT_LANG === 'en' ? '• Phone: ' : '• الهاتف: ') + (order.customer.phone || '—'));
  if (order.customer.email) lines.push((KT_LANG === 'en' ? '• Email: ' : '• الإيميل: ') + order.customer.email);
  lines.push('');
  lines.push(KT_LANG === 'en' ? '📍 *Address:*' : '📍 *العنوان:*');
  lines.push('• ' + (order.customer.gov || '') + ' - ' + (order.customer.city || ''));
  if (order.customer.area) lines.push((KT_LANG === 'en' ? '• Area: ' : '• المنطقة: ') + order.customer.area);
  lines.push((KT_LANG === 'en' ? '• Street: ' : '• الشارع: ') + (order.customer.street || '—'));
  if (order.customer.building) lines.push((KT_LANG === 'en' ? '• Building: ' : '• المبنى: ') + order.customer.building);
  if (order.customer.floor) lines.push((KT_LANG === 'en' ? '• Floor: ' : '• الدور: ') + order.customer.floor);
  if (order.customer.notes) lines.push((KT_LANG === 'en' ? '• Notes: ' : '• ملاحظات: ') + order.customer.notes);
  lines.push('');
  lines.push(KT_LANG === 'en' ? '🛍️ *Items:*' : '🛍️ *المنتجات:*');
  order.items.forEach(function(it){ lines.push('• ' + it.nameAr + ' × ' + it.qty + ' = ' + it.price * it.qty + (KT_LANG === 'en' ? ' EGP' : ' ج.م')); });
  lines.push('');
  lines.push(KT_LANG === 'en' ? '💰 *Summary:*' : '💰 *الملخص:*');
  lines.push((KT_LANG === 'en' ? '• Subtotal: ' : '• المجموع: ') + order.subtotal + (KT_LANG === 'en' ? ' EGP' : ' ج.م'));
  lines.push((KT_LANG === 'en' ? '• Delivery: ' : '• التوصيل: ') + (order.delivery === 0 ? (KT_LANG === 'en' ? 'Free' : 'مجاني') : order.delivery + (KT_LANG === 'en' ? ' EGP' : ' ج.م')));
  if (order.discount > 0) lines.push((KT_LANG === 'en' ? '• Discount: -' : '• الخصم: -') + order.discount + (KT_LANG === 'en' ? ' EGP' : ' ج.م'));
  lines.push('• *' + (KT_LANG === 'en' ? 'Total: ' : 'الإجمالي: ') + order.total + (KT_LANG === 'en' ? ' EGP*' : ' ج.م*'));
  lines.push('');
  lines.push((KT_LANG === 'en' ? '💳 *Payment:* ' : '💳 *طريقة الدفع:* ') + (order.payment === 'cod' ? (KT_LANG === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام') : order.payment));
  if (order.coupon) lines.push((KT_LANG === 'en' ? '🎁 Coupon: ' : '🎁 الكوبون: ') + order.coupon);
  var msg = encodeURIComponent(lines.join('\n'));
  return 'https://wa.me/' + WA_NUMBER + '?text=' + msg;
}

var KT_DELIVERY_RADIUS_KM = 10;
var ktUserLocation = null, ktNearestStore = null, ktZoneStatus = 'checking';
function ktCalcDistance(lat1, lng1, lat2, lng2){ var R = 6371; var dLat = (lat2-lat1)*Math.PI/180; var dLng = (lng2-lng1)*Math.PI/180; var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2); return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); }
function ktGetMerchantStores(){ return ktMerchantsCache.filter(function(m){ return m.status === 'approved' || !m.status; }); }

function ktUpdateZoneBadge(status, storeName, distance){
  var megaItem = document.getElementById('ktMegaZone');
  var megaStatus = document.getElementById('ktMegaStatus');
  var text = document.getElementById('ktZoneText');

  if (megaItem){
    megaItem.className = 'kt-mega-menu-item zone ' + status;
  }
  if (megaStatus){
    megaStatus.className = 'kt-mega-status ' + status;
  }
  if (text){
    if (status === 'checking') text.textContent = 'جاري التحقق...';
    else if (status === 'inside') text.textContent = 'متاح التوصيل ✓';
    else if (status === 'outside') text.textContent = 'خارج النطاق';
    else if (status === 'nostores') text.textContent = 'لا توجد متاجر';
  }
}

function ktCheckDeliveryZone(){
  if(!navigator.geolocation){ ktUpdateZoneBadge('nostores'); return; }
  navigator.geolocation.getCurrentPosition(function(pos){
    ktUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    var stores = ktGetMerchantStores();
    if(!stores.length){ ktZoneStatus = 'nostores'; ktUpdateZoneBadge('nostores'); return; }
    var nearest = null, minDist = Infinity;
    stores.forEach(function(store){ if(!store.lat || !store.lng) return; var d = ktCalcDistance(ktUserLocation.lat, ktUserLocation.lng, store.lat, store.lng); if(d < minDist){ minDist = d; nearest = store; } });
    if(!nearest){ ktUpdateZoneBadge('nostores'); return; }
    ktNearestStore = nearest;
    if(minDist <= KT_DELIVERY_RADIUS_KM){ ktZoneStatus = 'inside'; ktUpdateZoneBadge('inside', nearest.name, minDist); }
    else { ktZoneStatus = 'outside'; ktUpdateZoneBadge('outside', nearest.name, minDist); }
  }, function(){ ktUpdateZoneBadge('nostores'); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
}

function ktCheckZoneDetails(){
  if(ktZoneStatus === 'checking'){ ktToast('⏳'); return; }
  if(ktZoneStatus === 'nostores'){
    window.openModal('<div style="text-align:center;padding:20px 0"><div style="font-size:64px;margin-bottom:16px">⚠️</div><h2 class="h2" style="margin-bottom:12px">' + (KT_LANG === 'en' ? 'No stores registered' : 'لا توجد متاجر مسجلة') + '</h2><p class="muted" style="margin-bottom:20px">' + (KT_LANG === 'en' ? 'No merchant has registered yet' : 'لم يتم تسجيل أي تاجر بعد') + '</p><a href="merchant.html" class="btn btn-primary">🏪 ' + (KT_LANG === 'en' ? 'Register your store' : 'سجّل متجرك الآن') + '</a></div>');
    return;
  }
  if(ktZoneStatus === 'inside'){
    var store = ktNearestStore;
    var dist = ktCalcDistance(ktUserLocation.lat, ktUserLocation.lng, store.lat, store.lng);
    var storeProducts = (store.products || []);
    var productsHTML = storeProducts.length
      ? '<div class="kt-store-products">' + storeProducts.map(function(p){
          var media = p.image ? '<img src="' + esc(p.image) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="emoji" style="display:none">' + (p.emoji || '🛒') + '</span>' : '<span class="emoji">' + (p.emoji || '🛒') + '</span>';
          return '<div class="kt-store-product" onclick="navigate(\'/p/merchant_' + (store._fbId || store.id) + '_' + p.id + '\')"><div class="kt-store-product-img">' + media + '</div><div class="kt-store-product-name">' + esc(p.name) + '</div><div class="kt-store-product-price">' + p.price + ' ' + (KT_LANG === 'en' ? 'EGP' : 'ج.م') + '</div><button class="kt-store-product-btn" onclick="event.stopPropagation();ktAddStoreProductToCart(\'' + (store._fbId || store.id) + '\',\'' + p.id + '\')"><svg data-lucide="plus"></svg> ' + (KT_LANG === 'en' ? 'Add' : 'أضف') + '</button></div>';
        }).join('') + '</div>'
      : '<div style="text-align:center;padding:30px;color:var(--ink-3)">' + (KT_LANG === 'en' ? 'No products available' : 'لا توجد منتجات معروضة حالياً') + '</div>';
    window.openModal(
      '<div style="text-align:center;padding:12px 0"><div style="font-size:56px;margin-bottom:12px">✅</div><h2 class="h2" style="margin-bottom:6px;color:#22c55e">' + (KT_LANG === 'en' ? 'You are within delivery zone!' : 'أنت داخل نطاق التوصيل!') + '</h2><p class="muted" style="font-size:13.5px">' + esc(store.name) + ' • ' + dist.toFixed(2) + ' ' + (KT_LANG === 'en' ? 'km' : 'كم') + '</p></div>' +
      '<div class="card" style="padding:16px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:grid;place-items:center;font-size:24px">🏪</div><div style="flex:1"><b style="font-size:15px;display:block">' + esc(store.name) + '</b><span style="font-size:12px;color:var(--ink-3)">' + esc(store.address || '') + '</span></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a href="tel:' + esc(store.phone) + '" class="btn btn-gold btn-sm" style="flex:1">📞 ' + esc(store.phone) + '</a>' + (store.whatsapp ? '<a href="https://wa.me/2' + String(store.whatsapp).replace(/\D/g,'') + '" target="_blank" class="btn btn-glass btn-sm">💬 ' + (KT_LANG === 'en' ? 'WhatsApp' : 'واتساب') + '</a>' : '') + '</div></div>' +
      '<h3 style="font-size:15px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:8px"><svg data-lucide="package" style="width:18px;height:18px;color:var(--brand)"></svg>' + (KT_LANG === 'en' ? 'Store Products' : 'منتجات المتجر') + ' (' + storeProducts.length + ')</h3>' + productsHTML +
      '<div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-primary" style="flex:1" onclick="closeModal();ktOpenNearbyStores()">🏪 ' + (KT_LANG === 'en' ? 'All Stores' : 'كل المتاجر') + '</button><button class="btn btn-glass" onclick="closeModal()">' + (KT_LANG === 'en' ? 'Close' : 'إغلاق') + '</button></div>'
    );
    refreshIcons();
    return;
  }
  if(ktZoneStatus === 'outside'){
    var dist2 = ktCalcDistance(ktUserLocation.lat, ktUserLocation.lng, ktNearestStore.lat, ktNearestStore.lng);
    window.openModal('<div style="text-align:center;padding:16px 0"><div style="font-size:64px;margin-bottom:12px">❌</div><h2 class="h2" style="margin-bottom:8px;color:#f87171">' + (KT_LANG === 'en' ? 'Out of delivery zone' : 'خارج نطاق التوصيل') + '</h2><p class="muted">' + (KT_LANG === 'en' ? 'Nearest store: ' : 'أقرب متجر على بعد ') + dist2.toFixed(2) + ' ' + (KT_LANG === 'en' ? 'km' : 'كم') + '</p></div><a href="merchant.html" class="btn btn-primary btn-block">🏪 ' + (KT_LANG === 'en' ? 'Register your store' : 'سجّل متجرك') + '</a>');
  }
}

function ktAddStoreProductToCart(storeId, productId){
  var store = ktMerchantsCache.find(function(s){ return String(s._fbId || s.id) === String(storeId); });
  if (!store) return;
  var product = (store.products || []).find(function(p){ return String(p.id) === String(productId); });
  if (!product) return;
  var cartId = 'merchant_' + storeId + '_' + productId;
  var existing = state.cart.find(function(i){ return String(i.id) === String(cartId); });
  if (existing){ existing.qty++; }
  else { state.cart.push({ id: cartId, qty: 1, _storeProduct: { name: product.name, price: parseFloat(product.price), image: product.image, storeName: store.name, storeId: storeId, emoji: product.emoji || '🛒' } }); }
  persist('cart'); ktUpdateBadges();
  if (window.KT_SOUND) KT_SOUND.message();
  ktToast((KT_LANG === 'en' ? '✅ Added: ' : '✅ تمت الإضافة: ') + product.name, 'success');
  ktRenderDrawer();
}

function renderServiceCategories(){
  return '<section class="k-sec" style="padding-top:40px;padding-bottom:0"><div class="wrap">' +
    '<div class="k-sec-head"><h2 class="h2">' + t('sec_shop_now') + '</h2></div>' +
    '<div class="kt-services">' +
      SERVICE_CATEGORIES.map(function(s){
        var title = KT_LANG === 'en' ? s.titleEn : s.title;
        var desc = KT_LANG === 'en' ? s.descEn : s.desc;
        var btn = KT_LANG === 'en' ? s.btnTextEn : s.btnText;
        return '<div class="kt-service ' + s.id + '" onclick="ktOpenService(\'' + s.id + '\')">' +
          '<img class="kt-service-img" src="' + s.img + '" alt="' + title + '" loading="lazy" onerror="this.style.display=\'none\'">' +
          '<div class="kt-service-overlay"></div>' +
          '<div class="kt-service-content">' +
            '<div class="kt-service-title">' + title + '</div>' +
            '<div class="kt-service-desc">' + desc + '</div>' +
            '<button class="kt-service-btn" onclick="event.stopPropagation();ktOpenService(\'' + s.id + '\')">' + btn + '<svg data-lucide="arrow-left"></svg></button>' +
          '</div></div>';
      }).join('') +
    '</div></div></section>';
}
function ktOpenService(id){
  if (id === 'grocery' || id === 'mart'){ navigate('/categories'); ktToast(KT_LANG === 'en' ? '🛒 Browse products' : '🛒 تصفح منتجاتنا الآن', 'success'); }
  else if (id === 'food'){ navigate('/search?cat=snacks'); ktToast(KT_LANG === 'en' ? '🍔 Food ready' : '🍔 الطعام جاهز', 'success'); }
  else if (id === 'flowers'){ ktShowFlowersComingSoon(); }
  else if (id === 'medicine'){ ktOpenPharmacy(); }
}
function renderQuickServices(){
  return '<div class="kt-quick-services">' + QUICK_SERVICES.map(function(s){
    var label = KT_LANG === 'en' ? s.labelEn : s.label;
    return '<button class="kt-quick-service" onclick="ktOpenService(\'' + s.id + '\')"><span class="emoji">' + s.emoji + '</span>' + label + '</button>';
  }).join('') + '</div>';
}

function ktOpenPharmacy(){
  var meds = PRODUCTS.filter(function(p){ return p.isMedicine; });
  if (!meds.length){
    ktToast(KT_LANG === 'en' ? '⏳ Loading...' : '⏳ جاري تحميل أدوية الصيدلية...');
    ktBuildMedicineProducts().forEach(function(p){ PRODUCTS.push(p); });
    meds = PRODUCTS.filter(function(p){ return p.isMedicine; });
  }
  var catButtons = KT_MED_CATS.map(function(c){
    return '<button class="kt-quick-service" onclick="ktFilterPharmacy(\'' + c.id + '\',this)"><span class="emoji">' + c.emoji + '</span>' + c.name + '</button>';
  }).join('');
  var medsHTML = meds.map(function(p){
    return '<div class="kt-store-product" onclick="navigate(\'/p/' + p.id + '\')">' +
      '<div class="kt-store-product-img"><img src="' + esc(p.image) + '" alt="' + esc(p.nameAr) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="emoji" style="display:none">' + p.emoji + '</span></div>' +
      '<div class="kt-store-product-name">' + esc(p.nameAr) + '</div>' +
      '<div class="kt-store-product-price">' + money(p.price) + '</div>' +
      '<button class="kt-store-product-btn" onclick="event.stopPropagation();ktQuickAdd(\'' + p.id + '\',this)"><svg data-lucide="plus"></svg> ' + (KT_LANG === 'en' ? 'Add' : 'أضف') + '</button>' +
    '</div>';
  }).join('');
  window.openModal(
    '<div class="k-pharmacy-banner">' +
      '<div class="k-pharmacy-banner-icon">⚕️</div>' +
      '<div class="k-pharmacy-banner-info">' +
        '<h3>' + KT_PHARMACY.name + '</h3>' +
        '<p>' + KT_PHARMACY.address + ' — ' + KT_PHARMACY.delivery + '</p>' +
        '<span class="hours">🕒 ' + KT_PHARMACY.hours + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="k-pharmacy-badge"><svg data-lucide="check-circle-2"></svg> ' + meds.length + ' ' + (KT_LANG === 'en' ? 'Medicines available' : 'دواء متوفر') + '</div>' +
    '<div class="kt-quick-services" style="margin-top:10px">' + catButtons + '</div>' +
    '<div class="kt-store-products" id="ktPharmGrid">' + medsHTML + '</div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
      '<a href="tel:' + KT_PHARMACY.phone + '" class="btn btn-primary" style="flex:1">📞 ' + (KT_LANG === 'en' ? 'Call Pharmacy' : 'اتصل بالصيدلية') + '</a>' +
      '<button class="btn btn-glass" onclick="closeModal()">' + (KT_LANG === 'en' ? 'Close' : 'إغلاق') + '</button>' +
    '</div>'
  );
  refreshIcons();
}
function ktFilterPharmacy(catId, btn){
  var meds = PRODUCTS.filter(function(p){ return p.isMedicine; });
  if (catId !== 'med_all') meds = meds.filter(function(p){ return p.medCat === catId; });
  var grid = document.getElementById('ktPharmGrid');
  if (!grid) return;
  grid.innerHTML = meds.map(function(p){
    return '<div class="kt-store-product" onclick="navigate(\'/p/' + p.id + '\')">' +
      '<div class="kt-store-product-img"><img src="' + esc(p.image) + '" alt="' + esc(p.nameAr) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="emoji" style="display:none">' + p.emoji + '</span></div>' +
      '<div class="kt-store-product-name">' + esc(p.nameAr) + '</div>' +
      '<div class="kt-store-product-price">' + money(p.price) + '</div>' +
      '<button class="kt-store-product-btn" onclick="event.stopPropagation();ktQuickAdd(\'' + p.id + '\',this)"><svg data-lucide="plus"></svg> ' + (KT_LANG === 'en' ? 'Add' : 'أضف') + '</button>' +
    '</div>';
  }).join('');
  if (btn){ document.querySelectorAll('.kt-quick-services .kt-quick-service').forEach(function(b){ b.classList.remove('on'); }); btn.classList.add('on'); }
  refreshIcons();
}

function ktShowFlowersComingSoon(){
  window.openModal(
    '<div class="kt-coming-soon">' +
      '<span class="kt-coming-soon-icon">💐</span>' +
      '<span class="flower-badge"><svg data-lucide="clock"></svg> ' + (KT_LANG === 'en' ? 'Coming soon' : 'قريباً جداً') + '</span>' +
      '<h2>' + (KT_LANG === 'en' ? 'Flowers & Bouquets' : 'قسم الورود والبوكيهات') + '</h2>' +
      '<p>' + (KT_LANG === 'en' ? 'Flower shop is coming soon — we\'ll deliver the best flowers to your loved ones 🌹' : 'يتم إضافة متجر الورود قريباً — هنوصّلك أحلى الورد لأغلى الناس 🌹') + '</p>' +
      '<a href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('💐 عايز أطلب ورد من كانتين') + '" target="_blank" rel="noopener" class="kt-wa-send-btn">' +
        '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
        (KT_LANG === 'en' ? 'Ask about flowers 💐' : 'اسأل عن الورد 💐') +
      '</a>' +
      '<div style="margin-top:16px"><button class="btn btn-glass" onclick="closeModal()">' + (KT_LANG === 'en' ? 'OK' : 'حسناً، في انتظاركم') + '</button></div>' +
    '</div>'
  );
  refreshIcons();
}

function ktShowSearchSuggestions(query){
  var suggest = document.getElementById('ktSearchSuggest');
  if (!suggest) return;
  query = (query || '').trim().toLowerCase();
  if (!query){
    suggest.innerHTML = '<div class="kt-loc-suggest-item" onclick="ktPickSearchSuggestion(\'عروض\')"><svg data-lucide="flame"></svg><div class="kt-loc-suggest-info"><div class="kt-loc-suggest-title">🔥 ' + (KT_LANG === 'en' ? 'Today\'s Deals' : 'عروض اليوم') + '</div><div class="kt-loc-suggest-sub">' + (KT_LANG === 'en' ? 'Up to 25% off' : 'خصومات حتى 25%') + '</div></div></div>' +
      SEARCH_SUGGESTIONS.slice(0, 6).map(function(s){
        var q = KT_LANG === 'en' ? s.qEn : s.q;
        return '<div class="kt-loc-suggest-item" onclick="ktPickSearchSuggestion(\'' + q + '\')"><svg data-lucide="search"></svg><div class="kt-loc-suggest-info"><div class="kt-loc-suggest-title">' + q + '</div><div class="kt-loc-suggest-sub">' + (KT_LANG === 'en' ? 'in ' : 'في ') + (catById(s.cat) ? catName(catById(s.cat)) : s.cat) + '</div></div></div>';
      }).join('');
    suggest.classList.add('open');
    refreshIcons();
    return;
  }
  var matches = PRODUCTS.filter(function(p){
    return productName(p).toLowerCase().indexOf(query) !== -1 || (p.nameAr || '').toLowerCase().indexOf(query) !== -1 || (p.nameEn || '').toLowerCase().indexOf(query) !== -1 || (p.brand || '').toLowerCase().indexOf(query) !== -1;
  }).slice(0, 8);
  if (!matches.length){ suggest.innerHTML = '<div class="kt-loc-suggest-loading">' + (KT_LANG === 'en' ? 'No results found' : 'لا توجد نتائج مطابقة') + '</div>'; suggest.classList.add('open'); return; }
  suggest.innerHTML = matches.map(function(p){
    return '<div class="kt-loc-suggest-item" onclick="ktPickSearchProduct(\'' + p.id + '\')"><span style="font-size:22px;width:24px;text-align:center">' + (p.emoji || '🛒') + '</span><div class="kt-loc-suggest-info"><div class="kt-loc-suggest-title">' + esc(productName(p)) + '</div><div class="kt-loc-suggest-sub">' + esc(p.brand) + ' · ' + money(finalPrice(p)) + '</div></div></div>';
  }).join('');
  suggest.classList.add('open');
  refreshIcons();
}
function ktPickSearchSuggestion(q){
  var input = document.getElementById('ktAddressInput');
  if (input) input.value = q;
  document.getElementById('ktSearchSuggest').classList.remove('open');
  if (q === 'عروض' || q === 'Deals') navigate('/search?deals=1');
  else ktSearchAddress();
}
function ktPickSearchProduct(pid){
  document.getElementById('ktSearchSuggest').classList.remove('open');
  navigate('/p/' + pid);
}
function ktHideSearchSuggestions(){
  var s = document.getElementById('ktSearchSuggest');
  if (s) setTimeout(function(){ s.classList.remove('open'); }, 200);
}

function ktToggleSearchBar(){
  var locBar = document.getElementById('ktLocBar');
  if (!locBar) return;
  var isHidden = locBar.classList.contains('k-hidden');
  if (isHidden){
    locBar.classList.remove('k-hidden');
    setTimeout(function(){
      var inp = document.getElementById('ktAddressInput');
      if (inp) inp.focus();
    }, 350);
  } else {
    locBar.classList.add('k-hidden');
    var inp = document.getElementById('ktAddressInput');
    if (inp) inp.blur();
  }
}
function ktCloseSearchBar(){
  var locBar = document.getElementById('ktLocBar');
  if (locBar) locBar.classList.add('k-hidden');
}

function ktShowNearbyStoresModal(lat, lng){
  var stores = ktGetMerchantStores();
  var withDistance = stores.filter(function(s){ return s.lat && s.lng; }).map(function(s){ var d = ktCalcDistance(lat, lng, s.lat, s.lng); return Object.assign({}, s, {_distance: d}); }).sort(function(a, b){ return a._distance - b._distance; });
  var insideCount = withDistance.filter(function(s){ return s._distance <= KT_DELIVERY_RADIUS_KM; }).length;
  var storesHTML = withDistance.length
    ? withDistance.slice(0, 15).map(function(s){
        var inside = s._distance <= KT_DELIVERY_RADIUS_KM;
        var productCount = (s.products || []).length;
        var sid = s._fbId || s.id;
        return '<div class="kt-nearby-store" onclick="ktPickStore(\'' + sid + '\')"><div class="kt-nearby-store-ic">🏪</div><div class="kt-nearby-store-info"><div class="kt-nearby-store-name">' + esc(s.name) + ' <span class="pill ' + (inside ? 'pill-fresh' : 'pill-danger') + '">' + (inside ? (KT_LANG === 'en' ? '✅ Can deliver' : '✅ يوصّل لك') : (KT_LANG === 'en' ? '❌ Out of range' : '❌ خارج النطاق')) + ' • ' + s._distance.toFixed(1) + ' ' + (KT_LANG === 'en' ? 'km' : 'كم') + '</span></div><div class="kt-nearby-store-meta">📍 ' + esc(s.address || (KT_LANG === 'en' ? 'No address' : 'بدون عنوان')) + '</div><div class="kt-nearby-store-meta">📞 ' + esc(s.phone) + ' · 📦 ' + productCount + ' ' + (KT_LANG === 'en' ? 'products' : 'منتج') + '</div></div><div class="kt-nearby-store-actions"><a href="tel:' + esc(s.phone) + '" class="btn btn-gold btn-sm" onclick="event.stopPropagation()">📞</a>' + (s.whatsapp ? '<a href="https://wa.me/2' + String(s.whatsapp).replace(/\D/g,'') + '" target="_blank" class="btn btn-glass btn-sm" onclick="event.stopPropagation()">💬</a>' : '') + '</div></div>';
      }).join('')
    : '<div class="k-empty" style="padding:40px;text-align:center"><div style="font-size:64px;margin-bottom:12px">🏪</div><h3 style="margin-bottom:8px">' + (KT_LANG === 'en' ? 'No stores registered' : 'لا توجد متاجر مسجلة') + '</h3><p class="muted">' + (KT_LANG === 'en' ? 'Stores will be added soon' : 'سيتم إضافة المتاجر قريباً') + '</p><a href="merchant.html" class="btn btn-primary" style="margin-top:16px">' + (KT_LANG === 'en' ? 'Register' : 'سجّل متجرك') + '</a></div>';
  window.openModal(
    '<div class="k-modal-head"><h3><svg data-lucide="map-pin"></svg> ' + (KT_LANG === 'en' ? 'Nearby Stores' : 'المتاجر القريبة') + ' (' + withDistance.length + ')</h3><button class="k-modal-close" onclick="closeModal()"><svg data-lucide="x"></svg></button></div>' +
    '<div style="background:linear-gradient(135deg,rgba(255,107,53,.1),rgba(255,184,0,.06));border:1px solid rgba(255,107,53,.3);border-radius:16px;padding:18px;margin-bottom:16px;text-align:center"><div style="font-size:13px;color:var(--ink-3);margin-bottom:6px">' + t('near_your_loc') + '</div><div style="font-size:13px;font-family:monospace;color:var(--gold)">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div><div style="font-size:12.5px;color:var(--fresh);margin-top:8px;font-weight:700">✅ ' + insideCount + ' ' + t('near_can_deliver') + '</div></div>' +
    '<div class="kt-nearby-stores">' + storesHTML + '</div>' +
    '<button class="btn btn-glass btn-block" style="margin-top:16px" onclick="closeModal()">' + (KT_LANG === 'en' ? 'Close' : 'إغلاق') + '</button>'
  );
  refreshIcons();
}

/* ✅ محسّن — GPS سريع + fallback لآخر موقع */
function ktOpenNearbyStores(){
  if (!navigator.geolocation){
    ktToast(KT_LANG === 'en' ? '❌ Browser does not support GPS' : '❌ المتصفح لا يدعم GPS');
    return;
  }
  ktToast(KT_LANG === 'en' ? '📍 Detecting location...' : '📍 جاري تحديد موقعك...');

  var ok = function(pos){
    ktUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    ktShowNearbyStoresModal(pos.coords.latitude, pos.coords.longitude);
  };
  var err = function(){
    var savedLat = LS.get('delivery_lat', null);
    var savedLng = LS.get('delivery_lng', null);
    if (savedLat && savedLng){
      ktToast(KT_LANG === 'en' ? '📍 Using last known location' : '📍 بنستخدم آخر موقع محفوظ');
      ktShowNearbyStoresModal(savedLat, savedLng);
    } else {
      ktToast(KT_LANG === 'en' ? '❌ Could not detect location' : '❌ لم نتمكن من تحديد موقعك');
    }
  };

  navigator.geolocation.getCurrentPosition(
    ok,
    function(){
      navigator.geolocation.getCurrentPosition(ok, err, {
        enableHighAccuracy: true, timeout: 12000, maximumAge: 60000
      });
    },
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
  );
}
function ktPickStore(storeId){
  var store = ktMerchantsCache.find(function(s){ return String(s._fbId || s.id) === String(storeId); });
  if (!store) return;
  var products = (store.products || []);
  var productsHTML = products.length
    ? '<div class="kt-store-products">' + products.map(function(p){
        var media = p.image ? '<img src="' + esc(p.image) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="emoji" style="display:none">' + (p.emoji || '🛒') + '</span>' : '<span class="emoji">' + (p.emoji || '🛒') + '</span>';
        return '<div class="kt-store-product" onclick="navigate(\'/p/merchant_' + storeId + '_' + p.id + '\')"><div class="kt-store-product-img">' + media + '</div><div class="kt-store-product-name">' + esc(p.name) + '</div><div class="kt-store-product-price">' + p.price + ' ' + (KT_LANG === 'en' ? 'EGP' : 'ج.م') + '</div><button class="kt-store-product-btn" onclick="event.stopPropagation();ktAddStoreProductToCart(\'' + storeId + '\',\'' + p.id + '\')"><svg data-lucide="plus"></svg> ' + (KT_LANG === 'en' ? 'Add' : 'أضف') + '</button></div>';
      }).join('') + '</div>'
    : '<p class="muted" style="padding:20px;text-align:center">' + (KT_LANG === 'en' ? 'No products available' : 'لا توجد منتجات معروضة') + '</p>';
  window.openModal(
    '<div class="k-modal-head"><h3><svg data-lucide="store"></svg> ' + esc(store.name) + '</h3><button class="k-modal-close" onclick="closeModal()"><svg data-lucide="x"></svg></button></div>' +
    '<div style="background:var(--bg-3);border-radius:16px;padding:20px;margin-bottom:16px">' +
      '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)"><span style="color:var(--ink-3)">' + (KT_LANG === 'en' ? 'Owner:' : 'المالك:') + '</span><b>' + esc(store.owner || '-') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)"><span style="color:var(--ink-3)">' + (KT_LANG === 'en' ? 'Phone:' : 'الهاتف:') + '</span><a href="tel:' + esc(store.phone) + '" style="color:var(--gold)">' + esc(store.phone) + '</a></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 0"><span style="color:var(--ink-3)">' + (KT_LANG === 'en' ? 'Address:' : 'العنوان:') + '</span><b style="text-align:end;font-size:13px">' + esc(store.address || '-') + '</b></div>' +
    '</div>' +
    '<h4 style="margin-bottom:8px">📦 ' + (KT_LANG === 'en' ? 'Products' : 'المنتجات') + ' (' + products.length + ')</h4>' + productsHTML +
    '<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">' +
      (store.whatsapp ? '<a href="https://wa.me/2' + String(store.whatsapp).replace(/\D/g,'') + '" target="_blank" class="btn btn-primary" style="flex:1">💬 ' + (KT_LANG === 'en' ? 'WhatsApp' : 'تواصل واتساب') + '</a>' : '<a href="tel:' + esc(store.phone) + '" class="btn btn-primary" style="flex:1">📞 ' + (KT_LANG === 'en' ? 'Call' : 'اتصل') + '</a>') +
      '<button class="btn btn-glass" onclick="closeModal()">' + (KT_LANG === 'en' ? 'Close' : 'إغلاق') + '</button>' +
    '</div>'
  );
  refreshIcons();
}

function ktUpdateLocStatus(status, text){
  var el = document.getElementById('ktLocStatus'), txt = document.getElementById('ktLocText');
  if(!el || !txt) return;
  el.className = 'kt-locbar-location ' + status;
  txt.textContent = text;
}

/* ✅ محسّن — GPS سريع ثم دقيق */
function ktUseCurrentLocation(){
  if (!navigator.geolocation){
    ktUpdateLocStatus('err', t('general_gps_not_supported'));
    return;
  }
  ktUpdateLocStatus('loading', t('loc_detecting'));

  var ok = function(pos){
    var lat = pos.coords.latitude, lng = pos.coords.longitude;
    LS.set('delivery_lat', lat);
    LS.set('delivery_lng', lng);

    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=' + KT_LANG)
      .then(function(r){ return r.json(); })
      .then(function(data){
        var addr = (data.address && (data.address.suburb || data.address.neighbourhood || data.address.city || data.address.town)) || data.display_name || (lat.toFixed(4) + ', ' + lng.toFixed(4));
        LS.set('delivery_address', addr);
        ktUpdateLocStatus('ok', String(addr).substring(0, 30));
        ktToast(KT_LANG === 'en' ? '✅ Location detected' : '✅ تم تحديد موقعك', 'success');
        if (typeof ktCheckDeliveryZone === 'function') ktCheckDeliveryZone();
      })
      .catch(function(){ ktUpdateLocStatus('ok', lat.toFixed(3) + ', ' + lng.toFixed(3)); });
  };

  navigator.geolocation.getCurrentPosition(
    ok,
    function(){
      navigator.geolocation.getCurrentPosition(ok, function(){
        ktUpdateLocStatus('err', t('general_location_error'));
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    },
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
  );
}
function ktFocusAddressInput(){ var inp = document.getElementById('ktAddressInput'); if(inp) inp.focus(); }
function ktSearchAddress(){
  var q = document.getElementById('ktAddressInput').value.trim();
  if(!q){ ktFocusAddressInput(); return; }
  ktUpdateLocStatus('loading', KT_LANG === 'en' ? 'Searching...' : 'جاري البحث...');
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&limit=1&accept-language=' + KT_LANG)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.length){
        var r = data[0];
        LS.set('delivery_lat', parseFloat(r.lat)); LS.set('delivery_lng', parseFloat(r.lon));
        LS.set('delivery_address', r.display_name);
        ktUpdateLocStatus('ok', String(r.display_name || '').substring(0, 30));
        ktToast(KT_LANG === 'en' ? '✅ Address found' : '✅ تم العثور على العنوان', 'success');
        if(typeof ktCheckDeliveryZone === 'function') ktCheckDeliveryZone();
      } else { ktUpdateLocStatus('err', KT_LANG === 'en' ? 'Address not found' : 'لم نجد هذا العنوان'); }
    })
    .catch(function(){ ktUpdateLocStatus('err', KT_LANG === 'en' ? 'Search error' : 'خطأ في البحث'); });
}
function ktSubmitAddress(){ var q = document.getElementById('ktAddressInput').value.trim(); if(q) ktSearchAddress(); else ktUseCurrentLocation(); }

function ktAddToCart(pid, qty){
  qty = qty || 1;
  var p = findBy(pid); if(!p || p.stock <= 0) return;
  var existing = state.cart.find(function(i){ return String(i.id) === String(pid); });
  if(existing) existing.qty = Math.min(existing.qty + qty, p.stock);
  else state.cart.push({id: pid, qty: qty});
  persist('cart'); ktUpdateBadges();
  ktToast(KT_LANG === 'en' ? 'Added to cart ✓' : 'تمت الإضافة إلى السلة ✓', 'success');
  ktRenderDrawer();
}
function ktRemoveFromCart(pid){ state.cart = state.cart.filter(function(i){ return String(i.id) !== String(pid); }); persist('cart'); ktUpdateBadges(); ktToast(KT_LANG === 'en' ? 'Removed' : 'تم الحذف'); ktRenderDrawer(); if(state.route && state.route.view === 'cart') render(); }
function ktUpdateQty(pid, qty){ var item = state.cart.find(function(i){ return String(i.id) === String(pid); }); var p = findBy(pid); if(!item || !p) return; item.qty = Math.max(1, Math.min(qty, p.stock)); persist('cart'); ktUpdateBadges(); ktRenderDrawer(); if(state.route && state.route.view === 'cart') render(); }
function ktToggleFav(pid){
  var idx = state.wishlist.findIndex(function(id){ return String(id) === String(pid); });
  if(idx >= 0){ state.wishlist.splice(idx, 1); ktToast(KT_LANG === 'en' ? 'Removed' : 'تمت الإزالة'); }
  else { state.wishlist.push(pid); ktToast(KT_LANG === 'en' ? 'Added to wishlist ♥' : 'تمت الإضافة للمفضلة ♥', 'success'); }
  persist('wishlist'); ktUpdateBadges();
  $$('[data-fav="' + pid + '"]').forEach(function(el){ el.classList.toggle('on'); });
  if(state.route && state.route.view === 'wishlist') render();
}
function ktQuickAdd(pid, btn){
  ktAddToCart(pid, 1);
  if(btn){ btn.classList.add('added'); setTimeout(function(){ btn.classList.remove('added'); }, 1100); }
  if (window.KT_SOUND) KT_SOUND.message();
  var cartItem = state.cart.find(function(i){ return String(i.id) === String(pid); });
  var qty = cartItem ? cartItem.qty : 0;
  var badge = document.querySelector('[data-qty-for="' + pid + '"]');
  if (badge){
    badge.textContent = qty;
    badge.classList.toggle('zero', qty === 0);
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = '';
  }
}
function ktUpdateBadges(){
  var n = cartCount();
  ['k-cart-badge', 'k-cart-badge-b'].forEach(function(id){ var el = document.getElementById(id); if(el){ el.textContent = n; el.classList.toggle('show', n > 0); } });
  var w = $('#k-wish-badge'); if(w){ w.textContent = state.wishlist.length; w.classList.toggle('show', state.wishlist.length > 0); }
}
function ktOpenDrawer(){ var d = $('#k-drawer'); if(!d) return; ktRenderDrawer(); requestAnimationFrame(function(){ d.classList.add('open'); }); document.body.style.overflow = 'hidden'; }
function ktCloseDrawer(){ var d = $('#k-drawer'); if(d) d.classList.remove('open'); document.body.style.overflow = ''; }
function ktRenderDrawer(){
  var body = $('#drawer-body'), foot = $('#drawer-foot'); if(!body || !foot) return;
  if(!state.cart.length){
    body.innerHTML = '<div class="k-empty" style="padding:40px 20px;border:none;background:none"><div class="k-empty-ic">🛒</div><h3>' + t('cart_empty') + '</h3><p>' + t('cart_start_shopping') + '</p><button class="btn btn-primary" onclick="ktCloseDrawer();navigate(\'/categories\')">' + t('cart_browse_products') + '</button></div>';
    foot.innerHTML = ''; refreshIcons(); return;
  }
  var items = state.cart.map(function(i){ return {item: i, p: findBy(i.id)}; }).filter(function(x){ return x.p; });
  body.innerHTML = items.map(function(x){
    var item = x.item, p = x.p;
    var img = p.image ? '<img src="' + esc(p.image) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span style="display:none;font-size:32px;place-items:center;width:100%;height:100%">' + p.emoji + '</span>' : '<span style="font-size:32px">' + p.emoji + '</span>';
    return '<div style="display:grid;grid-template-columns:auto 1fr auto;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);align-items:center"><div style="width:70px;height:70px;border-radius:16px;background:#fff;display:grid;place-items:center;overflow:hidden">' + img + '</div><div style="min-width:0"><div style="font-weight:700;font-size:14.5px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(productName(p)) + '</div><div class="muted tiny">' + esc(p.brand || '') + ' · ' + esc(p.weight || '') + '</div><div style="display:inline-flex;align-items:center;background:var(--glass);border:1px solid var(--line-2);border-radius:999px;padding:3px;margin-top:8px"><button onclick="ktUpdateQty(\'' + p.id + '\',' + (item.qty - 1) + ')" style="width:32px;height:32px;border-radius:50%;font-weight:700">−</button><span style="width:40px;text-align:center;font-weight:700;font-size:14px">' + item.qty + '</span><button onclick="ktUpdateQty(\'' + p.id + '\',' + (item.qty + 1) + ')" style="width:32px;height:32px;border-radius:50%;font-weight:700">+</button></div></div><div style="text-align:end"><div style="font-weight:800;color:var(--gold);font-size:16px">' + money(finalPrice(p) * item.qty) + '</div><button onclick="ktRemoveFromCart(\'' + p.id + '\')" style="color:var(--ink-4);font-size:12px;margin-top:8px">' + t('action_delete') + '</button></div></div>';
  }).join('');
  var sub = cartTotal(), fee = deliveryFee(), disc = discountAmt(), total = grandTotal();
  foot.innerHTML = '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14.5px"><span class="muted">' + t('cart_subtotal') + '</span><span>' + money(sub) + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14.5px"><span class="muted">' + t('cart_delivery') + '</span><span>' + (fee === 0 ? '<span class="fresh-c">' + t('cart_free') + '</span>' : money(fee)) + '</span></div>' + (disc > 0 ? '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14.5px"><span class="fresh-c">' + t('cart_discount') + '</span><span class="fresh-c">-' + money(disc) + '</span></div>' : '') + '<div style="display:flex;justify-content:space-between;padding:16px 0;border-top:1px solid var(--line);margin-top:10px;font-size:19px;font-weight:800"><span>' + t('cart_total') + '</span><span style="color:var(--gold)">' + money(total) + '</span></div><button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="ktCloseDrawer();navigate(\'/checkout\')">' + t('action_checkout') + '</button><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="ktCloseDrawer();navigate(\'/cart\')">' + t('action_view_cart') + '</button>';
  refreshIcons();
}

function parseHash(){ var h = (location.hash || '#/').slice(2); var split = h.split('?'); var parts = split[0].split('/').filter(Boolean); var params = {}; if(split[1]){ split[1].split('&').forEach(function(kv){ var kvs = kv.split('='); params[decodeURIComponent(kvs[0])] = decodeURIComponent(kvs[1] || ''); }); } return {parts: parts, params: params}; }
function navigate(path){ location.hash = '#' + path; }
function route(){
  var parsed = parseHash(); var parts = parsed.parts, params = parsed.params;
  var view = 'home', arg = null;
  if(parts[0] === 'categories') view = 'categories';
  else if(parts[0] === 'c' && parts[1]){ view = 'category'; arg = parts[1]; }
  else if(parts[0] === 'p' && parts[1]){ view = 'product'; arg = parts[1]; }
  else if(parts[0] === 'search') view = 'search';
  else if(parts[0] === 'cart') view = 'cart';
  else if(parts[0] === 'wishlist') view = 'wishlist';
  else if(parts[0] === 'checkout') view = 'checkout';
  else if(parts[0] === 'orders') view = 'orders';
  else if(parts[0] === 'track' && parts[1]){ view = 'track'; arg = parts[1]; }
  else if(parts[0] === 'track-live' && parts[1]){ view = 'track-live'; arg = parts[1]; }
  else if(parts[0] === 'account') view = 'account';
  else if(parts[0] === 'auth') view = 'auth';

  if (view !== 'track-live' && typeof ktStopDriverListener === 'function') ktStopDriverListener();
  if (view !== 'track' && typeof ktStopOrderListener === 'function') ktStopOrderListener();

  state.route = {view: view, arg: arg, params: params};
  var locBar = document.getElementById('ktLocBar');
  if (locBar){
    if (view === 'home') locBar.classList.add('k-hidden');
    else locBar.classList.add('k-hidden');
  }
  if (view === 'home'){ document.body.classList.add('kt-home-page'); }
  else { document.body.classList.remove('kt-home-page'); }
  document.body.classList.toggle('kt-checkout-page', view === 'checkout');
  render(); window.scrollTo({top: 0, behavior: 'auto'});
}
window.addEventListener('hashchange', route);

function ktBackBtn(label){ return '<button class="kt-back" onclick="history.back()"><svg data-lucide="arrow-right"></svg> ' + (label || t('action_back')) + '</button>'; }
function productImageHTML(p){
  if(p.image) return '<img src="' + esc(p.image) + '" alt="' + esc(productName(p)) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><div class="k-prod-emoji" style="display:none">' + p.emoji + '</div>';
  return '<div class="k-prod-emoji">' + p.emoji + '</div>';
}
function productCard(p){
  var wish = state.wishlist.findIndex(function(id){ return String(id) === String(p.id); }) >= 0;
  var fp = finalPrice(p);
  var cat = catById(p.cat);
  var cartItem = state.cart.find(function(i){ return String(i.id) === String(p.id); });
  var qty = cartItem ? cartItem.qty : 0;
  var tag = p.off >= 20 ? '<span class="k-prod-tag">-' + p.off + '%</span>' : p.bestSeller ? '<span class="k-prod-tag gold">' + (KT_LANG === 'en' ? 'Best Seller' : 'الأكثر مبيعاً') + '</span>' : p.isNew ? '<span class="k-prod-tag fresh">' + (KT_LANG === 'en' ? 'New' : 'جديد') + '</span>' : '';
  return '<article class="k-prod" data-pid="' + p.id + '"><div class="k-prod-media">' + tag + '<button class="k-prod-fav ' + (wish ? 'on' : '') + '" data-fav="' + p.id + '" onclick="event.stopPropagation();ktToggleFav(\'' + p.id + '\')" aria-label="Wishlist"><svg data-lucide="heart"></svg></button>' + productImageHTML(p) + '</div><div class="k-prod-body"><div class="k-prod-brand">' + esc(catName(cat)) + ' · ' + esc(p.brand || '') + '</div><h3 class="k-prod-name">' + esc(productName(p)) + '</h3><div class="k-prod-rate"><svg data-lucide="star"></svg><span>' + p.rating + ' (' + (p.reviews || 0) + ')</span></div><div class="k-prod-foot"><div class="k-prod-price"><span class="cur">' + money(fp) + '</span>' + (p.discount > 0 ? '<span class="old">' + money(p.price) + '</span>' : '') + '</div><div class="k-prod-actions"><span class="k-prod-qty' + (qty === 0 ? ' zero' : '') + '" data-qty-for="' + p.id + '">' + (qty > 0 ? qty : '') + '</span><button class="k-prod-add" onclick="event.stopPropagation();ktQuickAdd(\'' + p.id + '\',this)" aria-label="Add"><svg data-lucide="plus"></svg></button></div></div></div></article>';
}
function categoryCard(c){
  var count = PRODUCTS.filter(function(p){ return p.cat === c.id; }).length;
  var img = c.img ? '<img src="' + c.img + '" alt="' + esc(catName(c)) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span style="display:none;font-size:28px">' + c.ic + '</span>' : '<span>' + c.ic + '</span>';
  return '<a class="k-cat" href="#/c/' + c.id + '"><span class="k-cat-ic">' + img + '</span><span class="k-cat-name">' + esc(catName(c)) + '</span><span class="k-cat-count">' + count + ' ' + (KT_LANG === 'en' ? 'products' : 'منتج') + '</span></a>';
}
function secHead(title, seeAllLink){
  return '<div class="k-sec-head"><h2 class="h2">' + title + '</h2>' + (seeAllLink ? '<a class="k-see-all" href="' + seeAllLink + '">' + t('sec_view_all') + '<svg data-lucide="arrow-left"></svg></a>' : '') + '</div>';
}
function viewHome(){
  var offers = PRODUCTS.filter(function(p){ return p.off >= 15; }).slice(0, 8);
  var best = PRODUCTS.filter(function(p){ return p.bestSeller; }).slice(0, 8);
  var newArr = PRODUCTS.filter(function(p){ return p.isNew && !p.merchantId; }).slice(0, 8);
  var NOW = Date.now();
  var recentMerchant = PRODUCTS.filter(function(p){
    if (!p.merchantId || !p.addedAt) return false;
    var hours = (NOW - new Date(p.addedAt).getTime()) / 3600000;
    return hours < 24;
  }).sort(function(a, b){ return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(); }).slice(0, 8);

  return '<section class="k-hero"><div class="k-hero-inner">' +
    '<img src="welcome.png" alt="كانتِين - Kanteen" class="k-hero-main-img" loading="eager" onerror="this.style.display=\'none\'">' +
    '<span class="k-hero-tag"><span class="dot"></span>' + t('hero_tag') + '</span>' +
    '<h1><span class="line"><span class="k-word blue">' + t('hero_word_1') + '</span><span class="k-word gold">' + t('hero_word_2') + '</span></span><span class="line"><span class="k-word gold">' + t('hero_word_3') + '</span><span class="k-word blue">' + t('hero_word_4') + '</span></span></h1>' +
    '<p class="lead">' + t('hero_lead') + '</p>' +
    '<div class="k-hero-actions"><a class="k-hero-cta" href="#/categories">' + t('hero_cta') + ' <svg data-lucide="arrow-left"></svg></a><a class="k-hero-secondary" href="#/search?deals=1">' + t('hero_secondary') + '</a></div>' +
    '<ul class="k-hero-feats"><li class="k-hero-feat"><svg data-lucide="chevron-left"></svg>' + t('hero_feat_1') + '</li><li class="k-hero-feat"><svg data-lucide="chevron-left"></svg>' + t('hero_feat_2') + '</li><li class="k-hero-feat"><svg data-lucide="chevron-left"></svg>' + t('hero_feat_3') + '</li><li class="k-hero-feat"><svg data-lucide="chevron-left"></svg>' + t('hero_feat_4') + '</li></ul>' +
    '</div></section>'
  + renderServiceCategories()
  + '<section class="k-sec" style="padding-top:20px;padding-bottom:0"><div class="wrap">' + renderQuickServices() + '</div></section>'
  + '<section class="k-sec"><div class="wrap">' + secHead(t('sec_by_category'), '#/categories') + '<div class="k-cats">' + CATEGORIES.map(categoryCard).join('') + '</div></div></section>'
  + (offers.length ? '<section class="k-sec"><div class="wrap">' + secHead(t('sec_offers'), '#/search?deals=1') + '<div class="k-prods">' + offers.map(productCard).join('') + '</div></div></section>' : '')
  + (recentMerchant.length ? '<section class="k-sec"><div class="wrap">' + secHead(t('sec_new_from_stores'), '#/search?sort=new') + '<div class="k-prods">' + recentMerchant.map(productCard).join('') + '</div></div></section>' : '')
  + (best.length ? '<section class="k-sec"><div class="wrap">' + secHead(t('sec_best_sellers'), '#/search?sort=popular') + '<div class="k-prods">' + best.map(productCard).join('') + '</div></div></section>' : '')
  + (newArr.length ? '<section class="k-sec"><div class="wrap">' + secHead(t('sec_new_arrivals'), '#/search?sort=new') + '<div class="k-prods">' + newArr.map(productCard).join('') + '</div></div></section>' : '');
}
function viewCategories(){
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn(KT_LANG === 'en' ? 'Home' : 'الرئيسية') + '<h1 class="h1" style="margin-bottom:28px">' + (KT_LANG === 'en' ? 'Browse Categories' : 'تصفح الأقسام') + '</h1><div class="k-cats">' + CATEGORIES.map(categoryCard).join('') + '</div></div></section><section class="k-sec" style="padding-top:0"><div class="wrap"><h2 class="h2" style="margin-bottom:24px">' + t('sec_brands') + '</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">' + BRANDS.map(function(b){ return '<a href="#/search?brand=' + encodeURIComponent(b) + '" class="card" style="padding:20px;text-align:center;font-weight:700;color:var(--ink)">' + esc(b) + '</a>'; }).join('') + '</div></div></section>';
}
function viewCategory(catId){
  var c = catById(catId);
  if(!c) return '<div class="wrap k-sec" style="padding-top:200px"><div class="k-empty"><h3>' + (KT_LANG === 'en' ? 'Category not found' : 'القسم غير موجود') + '</h3><a href="#/categories" class="btn btn-primary" style="margin-top:16px">' + (KT_LANG === 'en' ? 'Categories' : 'الأقسام') + '</a></div></div>';
  var prods = PRODUCTS.filter(function(p){ return p.cat === catId; });
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn(KT_LANG === 'en' ? 'Categories' : 'الأقسام') + '<div style="text-align:center;margin-bottom:40px"><div style="width:130px;height:130px;border-radius:26px;overflow:hidden;background:#fff;margin:0 auto 18px;display:grid;place-items:center"><img src="' + c.img + '" alt="' + esc(catName(c)) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"></div><h1 class="h1">' + esc(catName(c)) + '</h1><p class="muted" style="margin-top:10px">' + prods.length + ' ' + (KT_LANG === 'en' ? 'products' : 'منتج') + '</p></div>' + (prods.length ? '<div class="k-prods">' + prods.map(productCard).join('') + '</div>' : '<div class="k-empty"><div class="k-empty-ic">📦</div><h3>' + (KT_LANG === 'en' ? 'No products' : 'لا منتجات') + '</h3></div>') + '</div></section>';
}
function viewProduct(pid){
  var p = findBy(pid);
  if(!p) return '<div class="wrap k-sec" style="padding-top:200px"><div class="k-empty"><h3>' + (KT_LANG === 'en' ? 'Product not found' : 'المنتج غير موجود') + '</h3><a href="#/categories" class="btn btn-primary" style="margin-top:16px">' + t('cart_browse_products') + '</a></div></div>';
  state.recent = [p.id].concat(state.recent.filter(function(id){ return String(id) !== String(p.id); })).slice(0, 20);
  persist('recent');
  var cat = catById(p.cat);
  var wish = state.wishlist.findIndex(function(id){ return String(id) === String(p.id); }) >= 0;
  var fp = finalPrice(p);
  var savings = p.price - fp;
  var related = PRODUCTS.filter(function(x){ return x.cat === p.cat && String(x.id) !== String(p.id); }).slice(0, 4);
  var imgBig = p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(productName(p)) + '" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-xl)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span style="display:none;font-size:min(28vw,200px);place-items:center;width:100%;height:100%">' + p.emoji + '</span>' : '<span>' + p.emoji + '</span>';
  var name = productName(p);
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<div class="row" style="margin-bottom:24px;font-size:14px;color:var(--ink-3);gap:10px"><a href="#/">' + (KT_LANG === 'en' ? 'Home' : 'الرئيسية') + '</a><span>/</span><a href="#/c/' + p.cat + '">' + esc(catName(cat)) + '</a><span>/</span><span style="color:var(--ink)">' + esc(name) + '</span></div><style>@media(min-width:900px){[data-pdp]{grid-template-columns:1fr 1fr !important;gap:52px !important}}</style><div data-pdp style="display:grid;gap:32px"><div class="card" style="padding:0;border-radius:var(--r-xl);aspect-ratio:1;position:relative;overflow:hidden;background:#fff">' + imgBig + (p.off >= 15 ? '<span class="pill pill-gold" style="position:absolute;top:22px;inset-inline-start:22px;padding:10px 16px;font-size:14px;z-index:5">-' + p.off + '%</span>' : '') + '</div><div><div class="row" style="margin-bottom:16px;gap:10px;flex-wrap:wrap"><span class="pill pill-gold">' + esc(p.brand) + '</span>' + (p.bestSeller ? '<span class="pill pill-gold">' + (KT_LANG === 'en' ? 'Best Seller' : 'الأكثر مبيعاً') + '</span>' : '') + (p.isNew ? '<span class="pill pill-fresh">' + (KT_LANG === 'en' ? 'New' : 'جديد') + '</span>' : '') + '</div><h1 class="h1" style="margin-bottom:16px">' + esc(name) + '</h1>' + (p.merchantName ? '<p class="muted small" style="margin-bottom:16px">🏪 ' + (KT_LANG === 'en' ? 'From store: ' : 'من متجر: ') + '<b style="color:var(--gold)">' + esc(p.merchantName) + '</b></p>' : '') + '<div class="row" style="margin-bottom:24px;color:var(--ink-3);font-size:15px;gap:20px;flex-wrap:wrap"><span><span style="color:var(--gold)">★</span> ' + p.rating + ' (' + (p.reviews || 0) + ')</span><span style="color:var(--fresh)">✓ ' + t('prod_available') + ' ' + (p.stock || 100) + '</span></div><div style="display:flex;align-items:baseline;gap:14px;margin-bottom:28px;flex-wrap:wrap"><span style="font-size:42px;font-weight:800;color:var(--gold);letter-spacing:-.02em">' + money(fp) + '</span>' + (p.discount > 0 ? '<span style="font-size:22px;color:var(--ink-4);text-decoration:line-through">' + money(p.price) + '</span><span class="pill pill-fresh">' + (KT_LANG === 'en' ? 'Save ' : 'وفّر ') + money(savings) + '</span>' : '') + '</div><p style="color:var(--ink-2);line-height:1.75;margin-bottom:28px;font-size:15.5px">' + t('prod_desc_prefix') + ' ' + esc(name) + ' ' + t('prod_desc_suffix') + ' ' + esc(p.brand || '') + '.</p><div class="row" style="margin-bottom:24px;gap:14px"><span class="bold small">' + t('cart_qty') + ':</span><div style="display:inline-flex;align-items:center;background:var(--glass);border:1px solid var(--line-2);border-radius:999px;padding:4px"><button onclick="var i=document.getElementById(\'pdp-qty\');i.value=Math.max(1,+i.value-1)" style="width:40px;height:40px;border-radius:50%;font-size:20px;font-weight:700">−</button><input id="pdp-qty" type="number" value="1" min="1" max="' + (p.stock || 100) + '" style="width:50px;text-align:center;background:none;border:none;font-weight:800;font-size:18px"><button onclick="var i=document.getElementById(\'pdp-qty\');i.value=Math.min(' + (p.stock || 100) + ',+i.value+1)" style="width:40px;height:40px;border-radius:50%;font-size:20px;font-weight:700">+</button></div></div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px"><button class="btn btn-primary btn-lg" style="flex:1;min-width:200px" onclick="ktAddToCart(\'' + p.id + '\',+document.getElementById(\'pdp-qty\').value)"><svg data-lucide="shopping-bag" style="width:20px;height:20px"></svg>' + t('action_add_to_cart') + '</button><button class="btn btn-gold btn-lg" style="flex:1;min-width:200px" onclick="ktAddToCart(\'' + p.id + '\',+document.getElementById(\'pdp-qty\').value);navigate(\'/checkout\')">' + t('action_buy_now') + '</button><button class="btn btn-glass btn-icon" onclick="ktToggleFav(\'' + p.id + '\')" style="width:58px;height:58px;color:' + (wish ? 'var(--danger)' : '') + '"><svg data-lucide="heart" style="width:24px;height:24px;' + (wish ? 'fill:currentColor;' : '') + '"></svg></button></div><dl style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:24px;background:var(--glass);border-radius:var(--r-lg);border:1px solid var(--line)"><div><dt class="tiny muted">' + t('prod_brand') + '</dt><dd style="font-weight:700;font-size:15px">' + esc(p.brand || '-') + '</dd></div><div><dt class="tiny muted">' + t('prod_size') + '</dt><dd style="font-weight:700;font-size:15px">' + esc(p.weight || '-') + '</dd></div><div><dt class="tiny muted">SKU</dt><dd style="font-weight:700;font-size:15px">KTN-' + String(p.id).slice(-6) + '</dd></div><div><dt class="tiny muted">' + t('prod_rating') + '</dt><dd style="font-weight:700;font-size:15px">' + p.rating + ' / 5</dd></div></dl>' + ktRenderPriceComparison(p) + '</div></div>' + (related.length ? '<div style="margin-top:70px">' + secHead(t('sec_similar')) + '<div class="k-prods">' + related.map(productCard).join('') + '</div></div>' : '') + '</div></section>';
}
function viewSearch(){
  var params = state.route.params || {};
  var q = params.q || '', cat = params.cat || '', brand = params.brand || '', deals = params.deals || '', sort = params.sort || '';
  var list = q ? searchProducts(q) : PRODUCTS.slice();
  if(cat) list = list.filter(function(p){ return p.cat === cat; });
  if(brand) list = list.filter(function(p){ return p.brand === brand; });
  if(deals === '1') list = list.filter(function(p){ return p.discount > 0; });
  if(sort === 'price_asc') list.sort(function(a, b){ return finalPrice(a) - finalPrice(b); });
  if(sort === 'price_desc') list.sort(function(a, b){ return finalPrice(b) - finalPrice(a); });
  if(sort === 'popular') list.sort(function(a, b){ return (b.reviews || 0) - (a.reviews || 0); });
  if(sort === 'rating') list.sort(function(a, b){ return b.rating - a.rating; });
  if(sort === 'new') list = list.filter(function(p){ return p.isNew; }).concat(list.filter(function(p){ return !p.isNew; }));
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<h1 class="h1" style="margin-bottom:24px">' + (deals === '1' ? t('search_deals') : q ? t('search_results') + ': "' + esc(q) + '"' : t('search_all')) + '</h1><style>@media(min-width:1000px){[data-sg]{grid-template-columns:280px 1fr !important;gap:36px !important}}</style><div data-sg style="display:grid;gap:28px"><aside class="card" style="padding:24px;position:sticky;top:200px;align-self:start;max-height:calc(100vh - 220px);overflow-y:auto"><div style="margin-bottom:20px"><div class="tiny muted bold" style="margin-bottom:12px">' + t('search_sort') + '</div><select onchange="filterBy(\'sort\',this.value)" style="width:100%;padding:12px;border-radius:12px;background:var(--glass);border:1px solid var(--line-2);font-size:14px"><option value="">' + t('search_sort_default') + '</option><option value="price_asc" ' + (sort === 'price_asc' ? 'selected' : '') + '>' + t('search_sort_price_asc') + '</option><option value="price_desc" ' + (sort === 'price_desc' ? 'selected' : '') + '>' + t('search_sort_price_desc') + '</option><option value="popular" ' + (sort === 'popular' ? 'selected' : '') + '>' + t('search_sort_popular') + '</option><option value="rating" ' + (sort === 'rating' ? 'selected' : '') + '>' + t('search_sort_rating') + '</option></select></div><div style="padding:20px 0;border-top:1px solid var(--line)"><div class="tiny muted bold" style="margin-bottom:12px">' + t('search_filter_cat') + '</div><label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:14px"><input type="radio" name="cat" ' + (!cat ? 'checked' : '') + ' onchange="filterBy(\'cat\',\'\')"><span>' + t('search_filter_all') + '</span></label>' + CATEGORIES.map(function(c){ return '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:14px"><input type="radio" name="cat" ' + (cat === c.id ? 'checked' : '') + ' onchange="filterBy(\'cat\',\'' + c.id + '\')"><span>' + c.ic + ' ' + esc(catName(c)) + '</span></label>'; }).join('') + '</div><div style="padding-top:20px;border-top:1px solid var(--line)"><label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px"><input type="checkbox" ' + (deals === '1' ? 'checked' : '') + ' onchange="filterBy(\'deals\',this.checked?\'1\':\'\')"><span>' + t('search_filter_deals') + '</span></label></div></aside><div><div class="row-between" style="margin-bottom:24px;font-size:14.5px"><span class="muted"><b class="gold-c">' + list.length + '</b> ' + t('search_products') + '</span>' + ((cat || brand || deals || q) ? '<button class="btn btn-ghost btn-sm" onclick="navigate(\'/search\')">' + t('search_clear') + '</button>' : '') + '</div>' + (list.length ? '<div class="k-prods">' + list.map(productCard).join('') + '</div>' : '<div class="k-empty"><div class="k-empty-ic">🔍</div><h3>' + t('search_no_results') + '</h3><p>' + t('search_try_other') + '</p></div>') + '</div></div></div></section>';
}
function viewCart(){
  if(!state.cart.length){ return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<div class="k-empty"><div class="k-empty-ic">🛒</div><h3>' + t('cart_empty') + '</h3><p>' + t('cart_start_shopping') + '</p><a class="btn btn-primary" href="#/categories">' + t('cart_browse_products') + '</a></div></div></section>'; }
  var items = state.cart.map(function(i){ return {item: i, p: findBy(i.id)}; }).filter(function(x){ return x.p; });
  var sub = cartTotal(), fee = deliveryFee(), disc = discountAmt(), total = grandTotal();
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<h1 class="h1" style="margin-bottom:32px">' + t('cart_title') + '</h1><style>@media(min-width:900px){[data-cg]{grid-template-columns:1.6fr 1fr !important;gap:36px !important}}</style><div data-cg style="display:grid;gap:28px;align-items:start"><div class="col">' + items.map(function(x){ var item = x.item, p = x.p; var img = p.image ? '<img src="' + esc(p.image) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span style="display:none;font-size:40px;place-items:center;width:100%;height:100%">' + p.emoji + '</span>' : '<span style="font-size:40px">' + p.emoji + '</span>'; return '<div class="card" style="padding:20px;display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center"><a href="#/p/' + p.id + '" style="width:90px;height:90px;border-radius:18px;background:#fff;display:grid;place-items:center;overflow:hidden">' + img + '</a><div style="min-width:0"><a href="#/p/' + p.id + '"><div style="font-weight:700;font-size:16px;margin-bottom:6px">' + esc(productName(p)) + '</div></a><div class="muted tiny">' + esc(p.brand || '') + ' · ' + esc(p.weight || '') + '</div><div style="display:inline-flex;align-items:center;background:var(--glass);border:1px solid var(--line-2);border-radius:999px;padding:3px;margin-top:12px"><button onclick="ktUpdateQty(\'' + p.id + '\',' + (item.qty - 1) + ')" style="width:36px;height:36px;border-radius:50%;font-weight:700">−</button><span style="width:44px;text-align:center;font-weight:800;font-size:15px">' + item.qty + '</span><button onclick="ktUpdateQty(\'' + p.id + '\',' + (item.qty + 1) + ')" style="width:36px;height:36px;border-radius:50%;font-weight:700">+</button></div></div><div style="text-align:end"><div style="font-weight:800;color:var(--gold);font-size:19px">' + money(finalPrice(p) * item.qty) + '</div><button onclick="ktRemoveFromCart(\'' + p.id + '\')" style="color:var(--ink-4);font-size:13px;margin-top:10px">' + t('action_delete') + '</button></div></div>'; }).join('') + '</div><aside class="card" style="padding:28px;position:sticky;top:200px"><h3 class="h4" style="margin-bottom:20px">' + t('cart_summary') + '</h3><div style="display:flex;justify-content:space-between;padding:10px 0;font-size:15px"><span class="muted">' + t('cart_subtotal') + '</span><span>' + money(sub) + '</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;font-size:15px"><span class="muted">' + t('cart_delivery') + '</span><span>' + (fee === 0 ? '<span class="fresh-c">' + t('cart_free') + '</span>' : money(fee)) + '</span></div>' + (disc > 0 ? '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:15px"><span class="fresh-c">' + t('cart_discount') + '</span><span class="fresh-c">-' + money(disc) + '</span></div>' : '') + '<div style="display:flex;justify-content:space-between;padding:18px 0 0;margin-top:14px;border-top:1px solid var(--line);font-size:22px;font-weight:800"><span>' + t('cart_total') + '</span><span style="color:var(--gold)">' + money(total) + '</span></div><div style="display:flex;gap:10px;margin:20px 0"><input type="text" id="coupon-input" value="' + (state.coupon ? state.coupon.code : '') + '" placeholder="' + t('cart_coupon') + '" style="flex:1;padding:13px 16px;border-radius:14px;border:1px solid var(--line-2);background:var(--glass);font-size:14px;text-transform:uppercase"><button class="btn btn-glass" onclick="applyCoupon()" style="padding:13px 20px">' + t('action_apply') + '</button></div><button class="btn btn-primary btn-block btn-lg" onclick="navigate(\'/checkout\')">' + t('action_checkout') + '</button></aside></div></div></section>';
}
function viewWishlist(){
  var items = state.wishlist.map(findBy).filter(Boolean);
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<h1 class="h1" style="margin-bottom:32px">' + t('acc_wishlist') + ' ♥</h1>' + (items.length ? '<div class="k-prods">' + items.map(productCard).join('') + '</div>' : '<div class="k-empty"><div class="k-empty-ic">❤️</div><h3>' + (KT_LANG === 'en' ? 'Wishlist is empty' : 'المفضلة فارغة') + '</h3><p>' + (KT_LANG === 'en' ? 'Add your favorite products' : 'أضف منتجاتك المفضلة') + '</p><a class="btn btn-primary" href="#/categories">' + t('cart_browse_products') + '</a></div>') + '</div></section>';
}

var checkoutStep = 1;
var checkoutData = {name:'', phone:'', email:'', gov:'', city:'', area:'', street:'', building:'', floor:'', notes:'', time:'asap', payment:'cod'};
function onGovChange(){
  var gov = $('#co-gov').value;
  var citySelect = $('#co-city');
  if (!citySelect) return;
  citySelect.innerHTML = '<option value="">' + t('co_select_city') + '</option>';
  if (EGYPT_GOVS[gov]){ EGYPT_GOVS[gov].forEach(function(center){ citySelect.innerHTML += '<option value="' + center + '">' + center + '</option>'; }); }
}
function ktAutoFillCheckout(){
  if (!state.user) return;
  if (!checkoutData.name && state.user.name) checkoutData.name = state.user.name;
  if (!checkoutData.email && state.user.email) checkoutData.email = state.user.email;
  if (!checkoutData.phone && state.user.phone) checkoutData.phone = state.user.phone;
}
function viewCheckout(){
  if(!state.cart.length) return viewCart();
  ktAutoFillCheckout();
  var total = grandTotal();
  var steps = [t('co_step_1'), t('co_step_2'), t('co_step_3'), t('co_step_4'), t('co_step_5'), t('co_step_6')];
  var body = '';
  var autofillBadge = state.user ? '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:var(--fresh);font-size:10.5px;font-weight:800;margin-inline-start:8px">' + t('co_autofill') + '</span>' : '';
  if(checkoutStep === 1){ body = '<div class="k-form-row"><div class="k-field"><label>' + t('co_name') + ' <span class="req">*</span>' + autofillBadge + '</label><input id="co-name" value="' + esc(checkoutData.name) + '"></div><div class="k-field"><label>' + t('co_phone') + ' <span class="req">*</span></label><input id="co-phone" type="tel" value="' + esc(checkoutData.phone) + '"></div></div><div class="k-field"><label>' + t('co_email') + '</label><input id="co-email" type="email" value="' + esc(checkoutData.email) + '"></div>'; }
  else if(checkoutStep === 2){
    var govOptions = Object.keys(EGYPT_GOVS).map(function(g){ return '<option value="' + g + '"' + (checkoutData.gov === g ? ' selected' : '') + '>' + g + '</option>'; }).join('');
    var cityOptions = '<option value="">' + t('co_select_city') + '</option>';
    if (checkoutData.gov && EGYPT_GOVS[checkoutData.gov]){ cityOptions += EGYPT_GOVS[checkoutData.gov].map(function(c){ return '<option value="' + c + '"' + (checkoutData.city === c ? ' selected' : '') + '>' + c + '</option>'; }).join(''); }
    body = '<div class="k-form-row"><div class="k-field"><label>' + t('co_gov') + ' <span class="req">*</span></label><select id="co-gov" onchange="onGovChange()" style="padding:14px 16px;border-radius:14px;background:var(--bg-3);border:1px solid var(--line-2);color:var(--ink);font-size:15px;width:100%"><option value="">' + t('co_select_gov') + '</option>' + govOptions + '</select></div><div class="k-field"><label>' + t('co_city') + ' <span class="req">*</span></label><select id="co-city" style="padding:14px 16px;border-radius:14px;background:var(--bg-3);border:1px solid var(--line-2);color:var(--ink);font-size:15px;width:100%">' + cityOptions + '</select></div></div><div class="k-form-row"><div class="k-field"><label>' + t('co_area') + '</label><input id="co-area" value="' + esc(checkoutData.area) + '"></div><div class="k-field"><label>' + t('co_street') + ' <span class="req">*</span></label><input id="co-street" value="' + esc(checkoutData.street) + '"></div></div><div class="k-form-row"><div class="k-field"><label>' + t('co_building') + '</label><input id="co-building" value="' + esc(checkoutData.building) + '"></div><div class="k-field"><label>' + t('co_floor') + '</label><input id="co-floor" value="' + esc(checkoutData.floor) + '"></div></div><div class="k-field"><label>' + t('co_notes') + '</label><textarea id="co-notes">' + esc(checkoutData.notes) + '</textarea></div>';
  } else if(checkoutStep === 3){
    body = '<label style="display:flex;align-items:center;gap:18px;padding:20px;border:2px solid ' + (checkoutData.time === 'asap' ? 'var(--gold)' : 'var(--line-2)') + ';border-radius:var(--r-lg);cursor:pointer;margin-bottom:14px" onclick="checkoutData.time=\'asap\';render()"><span style="font-size:36px">⚡</span><div style="flex:1"><b style="display:block;margin-bottom:6px;font-size:16px">' + t('co_asap') + '</b><span class="muted tiny">' + t('co_asap_desc') + '</span></div></label><label style="display:flex;align-items:center;gap:18px;padding:20px;border:2px solid ' + (checkoutData.time === 'later' ? 'var(--gold)' : 'var(--line-2)') + ';border-radius:var(--r-lg);cursor:pointer" onclick="checkoutData.time=\'later\';render()"><span style="font-size:36px">📅</span><div style="flex:1"><b style="display:block;margin-bottom:6px;font-size:16px">' + t('co_later') + '</b><span class="muted tiny">' + t('co_later_desc') + '</span></div></label>';
  } else if(checkoutStep === 4){
    var payMethods = [
      {id:'cod', ic:'💵', t:t('co_pay_cod'), s:t('co_pay_cod_desc')},
      {id:'instapay', ic:'🏦', t:t('co_pay_insta'), s:t('co_pay_insta_desc') + ' · ' + INSTAPAY_NUMBER},
      {id:'vodafone', ic:'📱', t:t('co_pay_voda'), s:t('co_pay_voda_desc') + ' · ' + VODAFONE_NUMBER},
      {id:'paypal', ic:'💳', t:t('co_pay_paypal'), s:t('co_pay_paypal_desc')},
      {id:'fawry', ic:'🏪', t:t('co_pay_fawry'), s:t('co_pay_fawry_desc')}
    ];
    body = payMethods.map(function(o){ return '<label style="display:flex;align-items:center;gap:18px;padding:20px;border:2px solid ' + (checkoutData.payment === o.id ? 'var(--gold)' : 'var(--line-2)') + ';border-radius:var(--r-lg);cursor:pointer;margin-bottom:14px;background:' + (checkoutData.payment === o.id ? 'rgba(255,184,0,.08)' : 'transparent') + ';transition:all .2s" onclick="checkoutData.payment=\'' + o.id + '\';render()"><span style="font-size:36px">' + o.ic + '</span><div style="flex:1"><b style="display:block;margin-bottom:6px;font-size:15.5px">' + o.t + '</b><span class="muted tiny">' + o.s + '</span></div><div style="width:24px;height:24px;border-radius:50%;border:2px solid ' + (checkoutData.payment === o.id ? 'var(--gold)' : 'var(--line-2)') + ';background:' + (checkoutData.payment === o.id ? 'var(--gold)' : 'transparent') + '"></div></label>'; }).join('');
  } else if(checkoutStep === 5){
    var items5 = state.cart.map(function(i){ return {item:i, p:findBy(i.id)}; }).filter(function(x){ return x.p; });
    body = '<h3 class="h4" style="margin-bottom:18px">' + (KT_LANG === 'en' ? 'Items' : 'المنتجات') + ' (' + items5.length + ')</h3>' + items5.map(function(x){ var item = x.item, p = x.p; return '<div style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)"><span style="font-size:30px">' + p.emoji + '</span><div style="flex:1"><div style="font-weight:700;font-size:14.5px">' + esc(productName(p)) + '</div><div class="muted tiny">' + item.qty + ' × ' + money(finalPrice(p)) + '</div></div><div style="font-weight:800;color:var(--gold);font-size:15px">' + money(finalPrice(p) * item.qty) + '</div></div>'; }).join('');
  } else {
    body = '<div style="text-align:center;padding:12px 0"><div style="font-size:52px;margin-bottom:10px;line-height:1">✅</div><h2 style="font-size:18px;font-weight:800;margin-bottom:12px;font-family:\'Reem Kufi\',serif">' + t('co_ready') + '</h2><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;font-size:19px;font-weight:800;background:var(--glass);border:1px solid var(--line-2);border-radius:14px"><span>' + t('cart_total') + '</span><span style="color:var(--gold)">' + money(total) + '</span></div></div>';
  }
  var stepsHTML = '<div style="display:flex;gap:0;margin-bottom:36px;overflow-x:auto;padding-bottom:10px">' + steps.map(function(s, i){ var n = i + 1, cls = n < checkoutStep ? 'done' : n === checkoutStep ? 'on' : ''; return '<div style="flex:1;min-width:110px;text-align:center"><div style="width:36px;height:36px;border-radius:50%;display:inline-grid;place-items:center;margin-bottom:10px;font-weight:700;font-size:14px;background:' + (cls === 'done' ? 'var(--fresh)' : cls === 'on' ? 'var(--gold)' : 'var(--glass)') + ';color:' + (cls ? '#1a1206' : 'inherit') + '">' + (cls === 'done' ? '✓' : n) + '</div><div style="font-size:12.5px;color:' + (cls === 'on' ? 'var(--gold)' : cls === 'done' ? 'var(--fresh)' : 'var(--ink-3)') + ';font-weight:600">' + s + '</div></div>'; }).join('') + '</div>';
  var navBtns = checkoutStep > 1 ? '<button class="btn btn-glass" onclick="checkoutStep--;render()">← ' + t('action_back') + '</button>' : '';
  var nextBtn = checkoutStep < 6
    ? '<button class="btn btn-primary" onclick="checkoutNext()">' + t('action_continue') + '</button>'
    : '<button class="btn btn-gold" style="flex:1;padding:15px 24px;font-size:15px" onclick="placeOrder()">' + t('co_confirm_order') + '</button>';
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap" style="max-width:780px">' + ktBackBtn() + '<h1 class="h1" style="margin-bottom:32px">' + t('co_title') + '</h1>' + stepsHTML + '<div class="card" style="padding:22px">' + body + '<div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">' + navBtns + '<div style="flex:1;display:flex">' + nextBtn + '</div></div></div></div></section>';
}
function checkoutNext(){
  if(checkoutStep === 1){ var n = $('#co-name').value.trim(), p = $('#co-phone').value.trim(); if(!n || !p){ ktToast(t('co_fill_data'), 'error'); return; } checkoutData.name = n; checkoutData.phone = p; checkoutData.email = $('#co-email').value.trim(); }
  else if(checkoutStep === 2){ var g = $('#co-gov').value, c = $('#co-city').value, s = $('#co-street').value.trim(); if(!g || !c || !s){ ktToast(t('co_fill_data'), 'error'); return; } checkoutData.gov = g; checkoutData.city = c; checkoutData.area = $('#co-area').value.trim(); checkoutData.street = s; checkoutData.building = $('#co-building').value.trim(); checkoutData.floor = $('#co-floor').value.trim(); checkoutData.notes = $('#co-notes').value.trim(); }
  checkoutStep++; render();
}
function ktClearCartAfterOrder(){ state.cart = []; state.coupon = null; persist('cart'); persist('coupon'); ktUpdateBadges(); }
function placeOrder(){
  if (checkoutData.payment !== 'cod'){
    var total = grandTotal();
    var year = new Date().getFullYear();
    var seq = LS.get('orderSeq', 0) + 1;
    var orderCode = 'KTN-' + year + '-' + String(seq).padStart(6, '0');
    var methodNames = { instapay:t('payment_instapay'), vodafone:t('payment_vodafone'), paypal:t('payment_paypal'), fawry:t('payment_fawry') };
    var payNumbers = { instapay: INSTAPAY_NUMBER, vodafone: VODAFONE_NUMBER };
    var currentNumber = payNumbers[checkoutData.payment];
    var waMsg = (KT_LANG === 'en' ? '🧾 *Payment Confirmation — Kanteen*\n\n📦 Order: ' : '🧾 *تأكيد دفع — كانتِين*\n\n📦 رقم الطلب: ') + orderCode + (KT_LANG === 'en' ? '\n💰 Amount: ' : '\n💰 المبلغ: ') + total + ' ' + t('general_egp') + (KT_LANG === 'en' ? '\n💳 Payment Method: ' : '\n💳 طريقة الدفع: ') + methodNames[checkoutData.payment] + (KT_LANG === 'en' ? '\n👤 Customer: ' : '\n👤 العميل: ') + (checkoutData.name || (KT_LANG === 'en' ? 'Guest' : 'زائر')) + (KT_LANG === 'en' ? '\n📞 Phone: ' : '\n📞 الهاتف: ') + (checkoutData.phone || '') + (KT_LANG === 'en' ? '\n\n📸 *Receipt attached* 👇\nPlease confirm order receipt.' : '\n\n📸 *مرفق صورة الإيصال* 👇\nمن فضلكم أكدوا استلام الطلب.');
    var waLink = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMsg);
    window.openModal(
      '<div style="text-align:center;padding:16px 0"><div style="font-size:64px;margin-bottom:12px">💳</div><h2 class="h2" style="margin-bottom:8px">' + t('payment_electronic') + '</h2><p class="muted" style="margin-bottom:16px">' + t('payment_follow_steps') + '</p></div>' +
      '<div class="kt-payment-info-box"><div class="muted tiny" style="margin-bottom:6px">' + t('payment_amount') + '</div><span class="amount">' + money(total) + '</span><span class="order-code">' + t('payment_order_code') + ': ' + orderCode + '</span></div>' +
      '<div class="kt-payment-flow"><div class="kt-payment-step"><div class="kt-payment-step-num">1</div><div class="kt-payment-step-info"><b>' + t('payment_step_1') + '</b><p>' + t('payment_step_1_desc') + '</p></div></div><div class="kt-payment-step"><div class="kt-payment-step-num">2</div><div class="kt-payment-step-info"><b>' + t('payment_step_2') + '</b><p>' + t('payment_step_2_desc') + '</p></div></div><div class="kt-payment-step"><div class="kt-payment-step-num">3</div><div class="kt-payment-step-info"><b>' + t('payment_step_3') + '</b><p>' + t('payment_step_3_desc') + '</p></div></div></div>' +
      (currentNumber ? '<div class="kt-payment-number"><span class="label">' + t('payment_number') + '</span><span class="number">' + currentNumber + '</span><button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + currentNumber + '\');ktToast(\'' + (KT_LANG === 'en' ? '✅ Copied' : '✅ تم النسخ') + '\',\'success\')"><svg data-lucide="copy"></svg></button></div>' : '') +
      '<div class="kt-receipt-upload"><span class="icon">📸</span><h4>' + t('payment_send_receipt') + '</h4><p>' + t('payment_receipt_desc') + '</p><a href="' + waLink + '" target="_blank" rel="noopener" class="kt-wa-send-btn" onclick="ktFinalizePendingOrder(\'' + orderCode + '\',' + total + ',\'' + methodNames[checkoutData.payment] + '\')"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' + t('payment_send_wa') + '</a></div>' +
      '<button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">' + t('action_close') + '</button>'
    );
    refreshIcons();
    return;
  }
  var seqOrder = LS.get('orderSeq', 0) + 1;
  LS.set('orderSeq', seqOrder);
  var orderCode2 = 'KTN-' + new Date().getFullYear() + '-' + String(seqOrder).padStart(6, '0');
  var items = state.cart.map(function(i){ var p = findBy(i.id); return {id: p.id, nameAr: p.nameAr, nameEn: p.nameEn || p.nameAr, emoji: p.emoji, price: finalPrice(p), qty: i.qty}; });
  var order = { id: orderCode2, user: state.user ? state.user.id : 'guest', customer: Object.assign({}, checkoutData), items: items, subtotal: cartTotal(), delivery: deliveryFee(), discount: discountAmt(), total: grandTotal(), coupon: state.coupon ? state.coupon.code : null, payment: checkoutData.payment, paymentStatus: 'cod', status: 'placed', createdAt: new Date().toISOString() };
  state.orders.unshift(order); persist('orders');
  if (window.KT_FB){
    try {
      if (typeof KT_FB.saveOrder === 'function'){
        KT_FB.saveOrder(order).then(function(id){
          if (id) ktShowFbStatus(KT_LANG === 'en' ? '✅ Order saved' : '✅ تم حفظ الطلب', false);
          else ktShowFbStatus(KT_LANG === 'en' ? '⚠️ Save failed' : '⚠️ فشل الحفظ', true);
        }).catch(function(e){ console.warn('saveOrder:', e); });
      }
      if (typeof KT_FB.saveNotification === 'function'){
        KT_FB.saveNotification({ type: 'new_order', orderId: orderCode2, customer: order.customer, total: order.total, method: 'cash', createdAt: order.createdAt, read: false });
      }
    } catch(e){ console.warn('KT_FB call failed:', e); }
  }
  if (window.KT_SOUND) KT_SOUND.success();
  try { window.open(ktSendOrderToWhatsApp(order), '_blank'); } catch(e){}
  ktClearCartAfterOrder();
  ktToast(KT_LANG === 'en' ? '✅ Order received — awaiting confirmation' : '✅ تم استلام الطلب — في انتظار التأكيد', 'success');
  checkoutStep = 1;
  navigate('/track/' + orderCode2);
}
function ktFinalizePendingOrder(orderCode, total, methodLabel){
  var seqOrder = LS.get('orderSeq', 0) + 1;
  LS.set('orderSeq', seqOrder);
  var items = state.cart.map(function(i){ var p = findBy(i.id); return {id: p.id, nameAr: p.nameAr, nameEn: p.nameEn || p.nameAr, emoji: p.emoji, price: finalPrice(p), qty: i.qty}; });
  var order = { id: orderCode, user: state.user ? state.user.id : 'guest', customer: Object.assign({}, checkoutData), items: items, subtotal: cartTotal(), delivery: deliveryFee(), discount: discountAmt(), total: total, coupon: state.coupon ? state.coupon.code : null, payment: checkoutData.payment, paymentStatus: 'pending', paymentMethod: methodLabel, status: 'pending_payment', createdAt: new Date().toISOString() };
  var all = LS.get('orders', []) || []; all.unshift(order); LS.set('orders', all);
  if (window.KT_FB){
    try {
      if (typeof KT_FB.saveOrder === 'function') KT_FB.saveOrder(order);
      if (typeof KT_FB.saveNotification === 'function'){
        KT_FB.saveNotification({ type: 'payment_pending', orderId: orderCode, customer: order.customer, total: total, method: methodLabel, createdAt: order.createdAt, read: false });
      }
    } catch(e){ console.warn('KT_FB call failed:', e); }
  }
  if (window.KT_SOUND) KT_SOUND.success();
  ktClearCartAfterOrder();
  ktToast(KT_LANG === 'en' ? '✅ Order sent — awaiting receipt confirmation' : '✅ تم إرسال طلبك — في انتظار تأكيد الإيصال', 'success');
  closeModal();
  checkoutStep = 1;
  setTimeout(function(){ navigate('/track/' + orderCode); }, 500);
}
function viewOrders(){
  var mine = state.orders;
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<h1 class="h1" style="margin-bottom:32px">' + t('ord_title') + '</h1>' + (mine.length ? '<div class="col">' + mine.map(orderRow).join('') + '</div>' : '<div class="k-empty"><div class="k-empty-ic">📦</div><h3>' + t('ord_empty') + '</h3><a class="btn btn-primary" href="#/categories">' + t('ord_browse') + '</a></div>') + '</div></section>';
}
function orderRow(o){ var st = statusInfo(o.status); return '<a href="#/track/' + o.id + '" class="card" style="padding:22px;display:block"><div class="row-between" style="margin-bottom:16px"><div><div style="font-weight:800;font-size:15.5px">' + o.id + '</div><div class="muted tiny">' + new Date(o.createdAt).toLocaleString(KT_LANG === 'en' ? 'en-US' : 'ar-EG') + '</div></div><span class="pill ' + st.pill + '">' + st.label + '</span></div><div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">' + o.items.slice(0, 5).map(function(i){ return '<span style="font-size:26px">' + i.emoji + '</span>'; }).join('') + '</div><div class="row-between"><span class="muted small">' + o.items.length + ' ' + t('ord_items') + '</span><span style="font-weight:800;color:var(--gold);font-size:19px">' + money(o.total) + '</span></div></a>'; }
function statusInfo(st){ var map = {placed:{label:t('ord_status_placed'),pill:'pill-gold'},pending_payment:{label:t('ord_status_pending'),pill:'pill-gold'},confirmed:{label:t('ord_status_confirmed'),pill:'pill-gold'},preparing:{label:t('ord_status_preparing'),pill:'pill-info'},out:{label:t('ord_status_out'),pill:'pill-info'},delivered:{label:t('ord_status_delivered'),pill:'pill-fresh'}}; return map[st] || map.placed; }
function viewTrack(oid){
  var o = state.orders.find(function(x){ return x.id === oid; });
  if(!o) return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<div class="k-empty"><h3>' + t('order_not_found') + '</h3><a class="btn btn-primary" href="#/orders" style="margin-top:16px">' + t('ord_title') + '</a></div></div></section>';

  setTimeout(function(){ ktListenToOrder(oid); }, 100);

  var steps = [{id:'placed',label:t('ord_status_placed'),ic:'clipboard-check'},{id:'confirmed',label:t('ord_status_confirmed'),ic:'check-circle-2'},{id:'preparing',label:t('ord_status_preparing'),ic:'package'},{id:'out',label:t('ord_status_out'),ic:'truck'},{id:'delivered',label:t('ord_status_delivered'),ic:'home'}];
  var idx = steps.findIndex(function(s){ return s.id === o.status; });
  var payStatus = (o.paymentStatus === 'pending' ? '<div style="background:rgba(255,184,0,.12);border:1px solid rgba(255,184,0,.35);border-radius:12px;padding:14px;margin-top:14px;text-align:center;color:var(--gold);font-size:14px;font-weight:700">⏳ ' + t('ord_status_pending') + '</div>' : '') + (o.paymentStatus === 'confirmed' ? '<div style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);border-radius:12px;padding:14px;margin-top:14px;text-align:center;color:var(--fresh);font-size:14px;font-weight:700">✅ ' + (KT_LANG === 'en' ? 'Payment confirmed' : 'تم تأكيد الدفع') + '</div>' : '');
  var driverTrack = (o.driver && (o.status === 'out' || o.status === 'preparing'))
    ? '<div class="card" style="padding:20px;margin-top:16px"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#60a5fa);display:grid;place-items:center;font-size:26px;flex:none">🛵</div><div style="flex:1;min-width:150px"><b style="font-size:15.5px;display:block;margin-bottom:4px">' + t('ord_driver_on_way') + '</b><div class="muted tiny">' + esc(o.driver.name || t('track_driver')) + ' · ' + esc(o.driver.phone || '') + '</div></div><a href="#/track-live/' + o.id + '" class="btn btn-primary btn-sm" style="flex:none">' + t('ord_track_live') + '</a></div></div>'
    : '';
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap" style="max-width:780px">' + ktBackBtn() + '<div class="row-between" style="margin-bottom:28px"><h1 class="h1">' + t('ord_track') + '</h1><a class="btn btn-glass btn-sm" href="#/orders">' + t('ord_title') + '</a></div><div class="card" style="padding:28px;margin-bottom:28px"><div class="row-between" style="margin-bottom:20px"><div><div class="muted tiny">' + (KT_LANG === 'en' ? 'Order ID' : 'رقم الطلب') + '</div><div class="h3" style="color:var(--gold)">' + o.id + '</div></div><span class="pill ' + statusInfo(o.status).pill + '">' + statusInfo(o.status).label + '</span></div>' + payStatus + driverTrack + '<div class="row-between" style="font-size:14.5px;margin-top:18px"><span class="muted">' + t('cart_total') + '</span><span style="font-weight:800;color:var(--gold)">' + money(o.total) + '</span></div></div><div class="card" style="padding:28px">' + steps.map(function(s, i){ var done = i < idx, current = i === idx; return '<div style="display:grid;grid-template-columns:60px 1fr;gap:18px;position:relative;padding-bottom:' + (i === steps.length - 1 ? '0' : '32px') + '">' + (i < steps.length - 1 ? '<div style="position:absolute;top:60px;inset-inline-start:30px;width:2px;height:calc(100% - 60px);background:' + (done ? 'var(--fresh)' : 'var(--line)') + '"></div>' : '') + '<div style="width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:' + (done ? 'var(--fresh)' : current ? 'var(--gold)' : 'var(--glass)') + ';border:2px solid ' + (done ? 'var(--fresh)' : current ? 'var(--gold)' : 'var(--line-2)') + ';color:' + (done || current ? '#1a1206' : 'var(--ink-3)') + '"><svg data-lucide="' + s.ic + '" style="width:26px;height:26px"></svg></div><div style="padding-top:12px"><b style="font-size:16px">' + s.label + '</b></div></div>'; }).join('') + '</div></div></section>';
}

var ktTrackUnsub = null;

function ktStopOrderListener(){
  if (ktTrackUnsub){
    try { ktTrackUnsub(); } catch(e){}
    ktTrackUnsub = null;
    console.log('📴 Order listener stopped');
  }
}

function ktListenToOrder(orderId){
  ktStopOrderListener();
  if (!window.KT_FB || !firebase || !firebase.firestore) return;

  try {
    var db = firebase.firestore();
    ktTrackUnsub = db.collection('orders')
      .where('id', '==', orderId)
      .limit(1)
      .onSnapshot(function(snap){
        if (snap.empty) return;
        var doc = snap.docs[0];
        var data = doc.data();
        var localOrder = state.orders.find(function(x){ return x.id === orderId; });
        if (!localOrder) return;

        var oldStatus = localOrder.status;

        localOrder.status = data.status || localOrder.status;
        localOrder.paymentStatus = data.paymentStatus || localOrder.paymentStatus;
        if (data.driver) localOrder.driver = data.driver;
        if (data.driverId) localOrder.driverId = data.driverId;
        if (data.confirmedAt) localOrder.confirmedAt = data.confirmedAt;
        if (data.acceptedAt) localOrder.acceptedAt = data.acceptedAt;
        if (data.pickedAt) localOrder.pickedAt = data.pickedAt;
        if (data.deliveredAt) localOrder.deliveredAt = data.deliveredAt;
        persist('orders');

        if (oldStatus !== data.status){
          if (data.status === 'confirmed'){
            if (window.KT_SOUND) KT_SOUND.success();
            ktToast('✅ تم تأكيد طلبك من المتجر', 'success');
          } else if (data.status === 'preparing'){
            if (window.KT_SOUND) KT_SOUND.message();
            ktToast('📦 جاري تجهيز طلبك الآن', 'success');
          } else if (data.status === 'out'){
            if (window.KT_SOUND) KT_SOUND.chime();
            ktToast('🛵 المندوب في الطريق إليك!', 'success');
          } else if (data.status === 'delivered'){
            if (window.KT_SOUND) KT_SOUND.cash();
            ktToast('🎉 تم تسليم طلبك — بالهنا والشفا', 'success');
          } else if (data.status === 'cancelled'){
            if (window.KT_SOUND) KT_SOUND.alert();
            ktToast('❌ تم إلغاء الطلب', 'error');
          }
        }

        if (state.route && state.route.view === 'track' && state.route.arg === orderId){
          render();
        } else if (state.route && state.route.view === 'orders'){
          render();
        }
      }, function(err){ console.warn('order listener:', err); });
  } catch(e){ console.warn(e); }
}

var liveDriverUnsub = null;
var liveDriverData = null;
function ktStartDriverListener(driverId){
  ktStopDriverListener();
  if (!window.KT_FB || !driverId) return;
  if (!firebase || !firebase.firestore) return;
  try {
    var db = firebase.firestore();
    liveDriverUnsub = db.collection('drivers').doc(driverId).onSnapshot(function(doc){
      if (!doc.exists) return;
      var d = doc.data();
      liveDriverData = d;
      ktUpdateDriverMap(d.lat, d.lng, d);
    }, function(err){ console.warn('driver live error:', err); });
  } catch(e){ console.warn('listener:', e); }
}
function ktStopDriverListener(){
  if (liveDriverUnsub){
    try { liveDriverUnsub(); } catch(e){}
    liveDriverUnsub = null;
    liveDriverData = null;
  }
}
function ktUpdateDriverMap(lat, lng, driver){
  if (!lat || !lng) return;
  var mapEl = document.getElementById('driverLiveMap');
  if (!mapEl) return;
  var d = 0.008;
  var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (lng-d) + ',' + (lat-d) + ',' + (lng+d) + ',' + (lat+d) + '&layer=mapnik&marker=' + lat + ',' + lng;
  var iframe = mapEl.querySelector('iframe');
  if (iframe){
    var oldSrc = iframe.src || '';
    if (oldSrc.indexOf(lat.toFixed(4)) === -1){
      iframe.style.transition = 'opacity .4s';
      iframe.style.opacity = '0.5';
      setTimeout(function(){ iframe.src = src; iframe.style.opacity = '1'; }, 200);
    }
  } else {
    mapEl.innerHTML = '<iframe src="' + src + '" style="width:100%;height:100%;border:0" loading="lazy"></iframe>';
  }
  var coordsEl = document.getElementById('driverCoords');
  if (coordsEl) coordsEl.textContent = lat.toFixed(4) + ', ' + lng.toFixed(4);
  var timeEl = document.getElementById('driverLastSeen');
  if (timeEl) timeEl.textContent = KT_LANG === 'en' ? 'Now' : 'الآن';
}
function viewTrackLive(oid){
  var o = state.orders.find(function(x){ return x.id === oid; });
  if (!o){
    return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<div class="k-empty"><div class="k-empty-ic">📦</div><h3>' + t('order_not_found') + '</h3><a class="btn btn-primary" href="#/orders" style="margin-top:20px">' + t('ord_title') + '</a></div></div></section>';
  }
  if (!o.driver && !o.driverId){
    return '<section class="k-sec" style="padding-top:200px"><div class="wrap">' + ktBackBtn() + '<div class="k-empty"><div class="k-empty-ic">🛵</div><h3>' + t('track_no_driver') + '</h3><p>' + t('track_no_driver_desc') + '</p><a class="btn btn-glass" href="#/track/' + oid + '" style="margin-top:20px">' + t('track_show_status') + '</a></div></div></section>';
  }
  setTimeout(function(){ ktStartDriverListener(o.driverId); }, 150);
  var driver = o.driver || {};
  var c = o.customer || {};
  var statusMsg = KT_LANG === 'en' ? '⏳ Awaiting update' : '⏳ في انتظار التحديث';
  var statusColor = 'var(--gold)';
  if (o.status === 'out'){ statusMsg = KT_LANG === 'en' ? '🛵 Driver is on the way' : '🛵 المندوب في الطريق إليك الآن'; statusColor = 'var(--fresh)'; }
  else if (o.status === 'preparing'){ statusMsg = KT_LANG === 'en' ? '📦 Preparing your order' : '📦 جاري تجهيز طلبك'; statusColor = 'var(--info)'; }
  else if (o.status === 'confirmed'){ statusMsg = KT_LANG === 'en' ? '✅ Order confirmed' : '✅ تم تأكيد طلبك'; statusColor = 'var(--gold)'; }
  else if (o.status === 'delivered'){ statusMsg = KT_LANG === 'en' ? '🎉 Delivered' : '🎉 تم التسليم — بالهنا والشفا'; statusColor = 'var(--fresh)'; }
  var mapHTML;
  if (driver.lat && driver.lng){
    var d = 0.008;
    mapHTML = '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=' + (driver.lng-d) + ',' + (driver.lat-d) + ',' + (driver.lng+d) + ',' + (driver.lat+d) + '&layer=mapnik&marker=' + driver.lat + ',' + driver.lng + '" style="width:100%;height:100%;border:0" loading="lazy"></iframe>';
  } else {
    mapHTML = '<div style="display:grid;place-items:center;height:100%;color:var(--ink-3);text-align:center;padding:20px"><div><div style="font-size:52px;margin-bottom:12px;animation:ktPulseDot 1.5s infinite">📍</div><div style="font-size:14.5px;font-weight:600">' + (KT_LANG === 'en' ? 'Detecting driver location...' : 'جاري تحديد موقع المندوب...') + '</div><div style="font-size:12.5px;margin-top:6px;opacity:.75">' + (KT_LANG === 'en' ? 'Will appear in seconds' : 'هيظهر خلال ثواني') + '</div></div></div>';
  }
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap" style="max-width:820px">' +
    ktBackBtn() +
    '<h1 class="h1" style="margin-bottom:24px;text-align:center">' + t('track_live_title') + '</h1>' +
    '<div class="card" style="padding:22px;margin-bottom:22px;text-align:center;background:linear-gradient(135deg,rgba(255,107,53,.1),rgba(255,184,0,.05));border-color:rgba(255,107,53,.35)">' +
      '<div style="font-size:44px;margin-bottom:10px">🛵</div>' +
      '<div style="font-size:18px;font-weight:900;color:' + statusColor + '">' + statusMsg + '</div>' +
      '<div style="font-size:12.5px;color:var(--ink-3);margin-top:8px;font-family:monospace">#' + esc(o.id) + '</div>' +
    '</div>' +
    '<div class="card" style="padding:22px;margin-bottom:22px">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#60a5fa);display:grid;place-items:center;font-size:32px;color:#fff;flex:none;box-shadow:0 8px 24px rgba(59,130,246,.4)">🛵</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:11.5px;color:var(--ink-3);font-weight:700;text-transform:uppercase;letter-spacing:.06em">' + t('track_driver') + '</div>' +
          '<b style="font-size:17px;display:block;margin:4px 0">' + esc(driver.name || (KT_LANG === 'en' ? 'Kanteen Driver' : 'مندوب كانتِين')) + '</b>' +
          '<span style="font-size:13px;color:var(--ink-2)">📞 ' + esc(driver.phone || '—') + '</span>' +
        '</div>' +
      '</div>' +
      (driver.phone ?
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<a href="tel:' + esc(driver.phone) + '" class="btn btn-primary" style="flex:1;min-width:130px"><svg data-lucide="phone" style="width:18px;height:18px"></svg> ' + t('action_call') + '</a>' +
          '<a href="https://wa.me/2' + String(driver.phone).replace(/\D/g,'') + '" target="_blank" class="btn btn-gold" style="flex:1;min-width:130px"><svg data-lucide="message-circle" style="width:18px;height:18px"></svg> ' + t('action_whatsapp') + '</a>' +
        '</div>'
      : '') +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;margin-bottom:22px">' +
      '<div style="padding:16px 20px;background:linear-gradient(135deg,rgba(59,130,246,.12),transparent);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' +
        '<b style="font-size:15px;display:flex;align-items:center;gap:10px"><span style="width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 14px #22c55e;display:inline-block;animation:ktPulseDot 1.5s infinite"></span> ' + t('track_live_map') + '</b>' +
        '<span id="driverCoords" style="font-family:\'Courier New\',monospace;font-size:12.5px;color:var(--info);font-weight:800">— , —</span>' +
      '</div>' +
      '<div id="driverLiveMap" style="width:100%;height:380px;background:var(--bg-3);position:relative;overflow:hidden">' + mapHTML + '</div>' +
      '<div style="padding:12px 20px;background:var(--bg-2);border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-3)">' +
        '<span>' + t('track_live_update') + '</span>' +
        '<span>' + t('track_last_update') + ' <b id="driverLastSeen" style="color:var(--fresh)">—</b></span>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:22px">' +
      '<h3 style="font-size:15.5px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:10px"><svg data-lucide="map-pin" style="width:20px;height:20px;color:var(--brand)"></svg> ' + t('track_delivery_addr') + '</h3>' +
      '<p style="font-size:14.5px;line-height:1.7;color:var(--ink-2);padding:14px;background:var(--bg-3);border-radius:12px;border:1px solid var(--line)">' + esc((c.gov||'') + ' — ' + (c.city||'') + ' — ' + (c.area||'') + ' — ' + (c.street||'')) + '</p>' +
      (c.building ? '<p style="font-size:13.5px;color:var(--ink-3);margin-top:10px">' + t('track_building') + ' <b>' + esc(c.building) + '</b>' + (c.floor ? ' · ' + t('track_floor') + ' <b>' + esc(c.floor) + '</b>' : '') + '</p>' : '') +
    '</div>' +
  '</div></section>';
}

var otpState = { method:'phone', phone:'', email:'', pendingName:'', sent:false, timer:null };

function openOtpModal(){
  otpState.method = 'phone';
  otpState.phone = '';
  otpState.email = '';
  window.openModal(
    '<div style="text-align:center;padding:8px 0 20px">' +
      '<div style="font-size:64px;margin-bottom:12px">👤</div>' +
      '<h2 class="h2" style="margin-bottom:8px">' + t('otp_login') + '</h2>' +
      '<p class="muted" style="font-size:14px">' + (KT_LANG === 'en' ? 'Sign up with phone or email' : 'سجّل برقم الهاتف أو البريد الإلكتروني') + '</p>' +
    '</div>' +
    '<div class="kt-auth-tabs" id="otpTabs">' +
      '<button type="button" class="kt-auth-tab on" data-m="phone" onclick="ktSwitchOtpMethod(\'phone\')">📱 ' + (KT_LANG === 'en' ? 'Phone' : 'رقم الهاتف') + '</button>' +
      '<button type="button" class="kt-auth-tab" data-m="email" onclick="ktSwitchOtpMethod(\'email\')">✉️ ' + (KT_LANG === 'en' ? 'Email' : 'البريد الإلكتروني') + '</button>' +
    '</div>' +
    '<div id="otpStep1">' +
      '<div class="k-field" id="otpPhoneField"><label>' + t('otp_phone') + ' <span class="req">*</span></label><input type="tel" id="otpPhone" placeholder="01xxxxxxxxx" autocomplete="off" style="text-align:center;letter-spacing:2px;font-size:18px;font-weight:700"></div>' +
      '<div class="k-field" id="otpEmailField" style="display:none"><label>' + (KT_LANG === 'en' ? 'Email Address' : 'البريد الإلكتروني') + ' <span class="req">*</span></label><input type="email" id="otpEmail" placeholder="you@example.com" autocomplete="off" style="text-align:center;font-size:16px;font-weight:600"></div>' +
      '<div class="k-field" id="otpNameField" style="display:none"><label>' + (KT_LANG === 'en' ? 'Your Name' : 'اسمك') + ' <span class="req">*</span></label><input type="text" id="otpName" placeholder="' + (KT_LANG === 'en' ? 'Full name' : 'الاسم الكامل') + '" autocomplete="off"></div>' +
      '<button class="btn btn-primary btn-block btn-lg" onclick="ktSendOtp()"><svg data-lucide="send" style="width:20px;height:20px"></svg> ' + t('otp_send') + '</button>' +
      '<div class="kt-auth-note" style="margin-top:20px">' + t('otp_note') + '</div>' +
    '</div>' +
    '<div id="otpStep2" style="display:none">' +
      '<div style="text-align:center;margin-bottom:20px">' +
        '<p class="muted" style="font-size:14px;margin-bottom:6px">' + t('otp_sent_to') + '</p>' +
        '<b style="font-size:18px;color:var(--gold)" id="otpTargetDisplay"></b>' +
      '</div>' +
      '<div class="k-field"><label style="text-align:center">' + t('otp_code') + '</label><input type="tel" id="otpCode" placeholder="— — — —" maxlength="4" inputmode="numeric" autocomplete="one-time-code" style="text-align:center;letter-spacing:20px;font-size:28px;font-weight:800;padding:20px"></div>' +
      '<button class="btn btn-primary btn-block btn-lg" onclick="ktVerifyOtp()"><svg data-lucide="check" style="width:20px;height:20px"></svg> ' + t('otp_verify') + '</button>' +
      '<div style="display:flex;justify-content:space-between;margin-top:16px;align-items:center">' +
        '<button class="btn btn-ghost btn-sm" onclick="ktBackToPhone()">' + t('otp_change') + '</button>' +
        '<span class="muted tiny" id="otpResendTimer">' + t('otp_resend_in') + '</span>' +
      '</div>' +
      '<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="ktSendOtp()" id="otpResendBtn" disabled>' + t('otp_resend') + '</button>' +
    '</div>'
  );
  setTimeout(function(){ var el = $('#otpPhone'); if(el) el.focus(); }, 300);
  refreshIcons();
}

function ktSwitchOtpMethod(m){
  otpState.method = m;
  document.querySelectorAll('.kt-auth-tab').forEach(function(b){ b.classList.toggle('on', b.dataset.m === m); });
  var pf = $('#otpPhoneField'), ef = $('#otpEmailField'), nf = $('#otpNameField');
  if (m === 'phone'){ if(pf) pf.style.display=''; if(ef) ef.style.display='none'; if(nf) nf.style.display='none'; }
  else { if(pf) pf.style.display='none'; if(ef) ef.style.display=''; if(nf) nf.style.display=''; }
  refreshIcons();
}

function ktSendOtp(){
  if (otpState.method === 'email'){
    var email = $('#otpEmail').value.trim();
    var name = $('#otpName').value.trim();
    if (!email || email.indexOf('@') === -1){ ktToast(KT_LANG === 'en' ? '❌ Invalid email' : '❌ اكتب بريد إلكتروني صحيح', 'error'); return; }
    if (!name){ ktToast(KT_LANG === 'en' ? '❌ Enter your name' : '❌ اكتب اسمك', 'error'); return; }
    otpState.email = email;
    otpState.phone = '';
    otpState.pendingName = name;
    ktToast('📩 ' + (KT_LANG === 'en' ? 'Code sent (Demo: 1234)' : 'تم إرسال الكود (تجريبي: 1234)'), 'success');
    $('#otpStep1').style.display = 'none';
    $('#otpStep2').style.display = 'block';
    $('#otpTargetDisplay').textContent = email;
    setTimeout(function(){ var el = $('#otpCode'); if(el) el.focus(); }, 300);
    refreshIcons();
    ktStartResendTimer();
    return;
  }
  var phone = $('#otpPhone').value.trim().replace(/\s/g,'');
  if (!phone || phone.length < 10){ ktToast(t('otp_invalid_phone'), 'error'); return; }
  if (phone.startsWith('0')) phone = '+20' + phone.slice(1);
  else if (!phone.startsWith('+')) phone = '+20' + phone;
  otpState.phone = phone;
  otpState.email = '';
  ktToast('📩 ' + (KT_LANG === 'en' ? 'Code sent (Demo: 1234)' : 'تم إرسال الكود (تجريبي: 1234)'), 'success');
  $('#otpStep1').style.display = 'none';
  $('#otpStep2').style.display = 'block';
  $('#otpTargetDisplay').textContent = phone;
  setTimeout(function(){ var el = $('#otpCode'); if(el) el.focus(); }, 300);
  refreshIcons();
  ktStartResendTimer();
}

function ktStartResendTimer(){
  var seconds = 60;
  var timer = $('#otpResendTimer');
  var btn = $('#otpResendBtn');
  if (btn) btn.disabled = true;
  if (otpState.timer) clearInterval(otpState.timer);
  otpState.timer = setInterval(function(){
    seconds--;
    if (timer) timer.textContent = (KT_LANG === 'en' ? 'You can resend in ' : 'يمكنك إعادة الإرسال بعد ') + seconds + (KT_LANG === 'en' ? ' seconds' : ' ثانية');
    if (seconds <= 0){
      clearInterval(otpState.timer);
      if (timer) timer.textContent = KT_LANG === 'en' ? 'You can resend now' : 'يمكنك إعادة الإرسال الآن';
      if (btn) btn.disabled = false;
    }
  }, 1000);
}

function ktVerifyOtp(){
  var code = $('#otpCode').value.trim();
  if (!code || code.length !== 4){ ktToast(KT_LANG === 'en' ? '❌ Enter 4-digit code' : '❌ اكتب الكود المكوّن من 4 أرقام', 'error'); return; }
  if (code !== '1234'){ ktToast(t('otp_invalid'), 'error'); return; }
  var existing;
  if (otpState.method === 'email'){
    existing = (state.users || []).find(function(u){ return u.email === otpState.email; });
    if (existing){
      state.user = existing;
      ktToast(KT_LANG === 'en' ? '✅ Welcome back' : '✅ مرحباً بعودتك', 'success');
    } else {
      var newUser = { id: uid(), name: otpState.pendingName || t('acc_customer'), phone: '', email: otpState.email, loginMethod:'email', createdAt: new Date().toISOString() };
      state.users = state.users || [];
      state.users.push(newUser);
      state.user = newUser;
      persist('users');
      ktToast(KT_LANG === 'en' ? '🎉 Account created' : '🎉 تم إنشاء حسابك', 'success');
    }
  } else {
    existing = (state.users || []).find(function(u){ return u.phone === otpState.phone; });
    if (existing){
      state.user = existing;
      ktToast(KT_LANG === 'en' ? '✅ Welcome back' : '✅ مرحباً بعودتك', 'success');
    } else {
      var newUser2 = { id: uid(), name: t('acc_customer'), phone: otpState.phone, email: '', loginMethod:'phone', createdAt: new Date().toISOString() };
      state.users = state.users || [];
      state.users.push(newUser2);
      state.user = newUser2;
      persist('users');
      ktToast(KT_LANG === 'en' ? '🎉 Account created' : '🎉 تم إنشاء حسابك', 'success');
    }
  }
  persist('user');
  if (window.KT_SOUND) KT_SOUND.success();
  closeModal();
  render();
}
function ktBackToPhone(){
  $('#otpStep1').style.display = 'block';
  $('#otpStep2').style.display = 'none';
  if (otpState.timer) clearInterval(otpState.timer);
  refreshIcons();
}

function ktShowDriverRegistration(){
  closeModal();
  window.openModal(
    '<div style="text-align:center;padding:8px 0 20px">' +
      '<div style="font-size:64px;margin-bottom:12px">🛵</div>' +
      '<h2 class="h2" style="margin-bottom:8px">' + (KT_LANG === 'en' ? 'Driver Registration' : 'تسجيل مندوب جديد') + '</h2>' +
      '<p class="muted" style="font-size:14px">' + (KT_LANG === 'en' ? 'Your request will be reviewed by admin' : 'سيتم مراجعة طلبك من الإدارة قبل التفعيل') + '</p>' +
    '</div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'Full Name' : 'الاسم الكامل') + ' <span class="req">*</span></label><input id="drvName" placeholder="' + (KT_LANG === 'en' ? 'Your name' : 'اسمك') + '"></div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'Phone' : 'رقم الهاتف') + ' <span class="req">*</span></label><input type="tel" id="drvPhone" placeholder="01xxxxxxxxx" maxlength="11"></div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'Email' : 'البريد الإلكتروني') + ' <span class="req">*</span></label><input type="email" id="drvEmail" placeholder="you@example.com"></div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'WhatsApp (optional)' : 'واتساب (اختياري)') + '</label><input type="tel" id="drvWhatsapp" placeholder="01xxxxxxxxx" maxlength="11"></div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'Vehicle Type' : 'نوع المركبة') + ' <span class="req">*</span></label><select id="drvVehicle" style="padding:14px 16px;border-radius:13px;background:var(--bg-3);border:1px solid var(--line-2);color:var(--ink);font-size:15px;width:100%"><option value="motorcycle">🛵 موتوسيكل</option><option value="car">🚗 سيارة</option><option value="bicycle">🚲 دراجة</option><option value="van">🚐 فان</option></select></div>' +
    '<div class="k-field"><label>' + (KT_LANG === 'en' ? 'Area' : 'المنطقة') + ' <span class="req">*</span></label><input id="drvArea" placeholder="' + (KT_LANG === 'en' ? 'Cairo - Nasr City' : 'القاهرة - مدينة نصر') + '"></div>' +
    '<div style="display:flex;gap:10px;margin-top:20px">' +
      '<button class="btn btn-ghost" onclick="closeModal()" style="flex:1">' + (KT_LANG === 'en' ? 'Cancel' : 'إلغاء') + '</button>' +
      '<button class="btn btn-primary" style="flex:2" onclick="ktSubmitDriverRegistration()">' + (KT_LANG === 'en' ? 'Submit Request' : 'إرسال الطلب') + '</button>' +
    '</div>' +
    '<div class="kt-auth-note" style="margin-top:16px">💡 ' + (KT_LANG === 'en' ? 'Admin will review your request' : 'سيتم مراجعة طلبك وإشعارك قريباً') + '</div>'
  );
  refreshIcons();
}

function ktSubmitDriverRegistration(){
  var name = $('#drvName').value.trim();
  var phone = $('#drvPhone').value.trim().replace(/\s/g,'');
  var email = $('#drvEmail').value.trim().toLowerCase();
  var whatsapp = $('#drvWhatsapp').value.trim().replace(/\s/g,'');
  var vehicle = $('#drvVehicle').value;
  var area = $('#drvArea').value.trim();

  if (!name || !phone || !email || !area){ ktToast(KT_LANG === 'en' ? '❌ Fill all required fields' : '❌ املأ كل الحقول المطلوبة', 'error'); return; }
  if (phone.length < 10){ ktToast(KT_LANG === 'en' ? '❌ Invalid phone' : '❌ رقم هاتف غير صحيح', 'error'); return; }
  if (email.indexOf('@') === -1){ ktToast(KT_LANG === 'en' ? '❌ Invalid email' : '❌ بريد غير صحيح', 'error'); return; }

  if (phone.startsWith('0')) phone = '+20' + phone.slice(1);
  if (whatsapp && whatsapp.startsWith('0')) whatsapp = '+20' + whatsapp.slice(1);

  if (!window.KT_FB){ ktToast('⏳ Loading...'); return; }
  var init = KT_FB.init();
  if (!init){ ktToast('⚠️ Firebase غير متاح', 'error'); return; }

  var driverData = {
    id: 'driver_' + phone.replace(/\D/g,''),
    name: name, phone: phone, email: email, whatsapp: whatsapp,
    vehicle: vehicle, area: area,
    status: 'pending', online: false,
    rating: 5.0, completedToday: 0, earnings: 0, commissionPerOrder: 15,
    createdAt: new Date().toISOString(),
    _serverCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  init.db.collection('drivers').doc(driverData.id).set(driverData, { merge: true })
    .then(function(){
      if (KT_FB.saveNotification){
        KT_FB.saveNotification({
          type: 'new_driver', driverName: name, phone: phone, email: email,
          area: area, vehicle: vehicle,
          createdAt: new Date().toISOString(), read: false
        });
      }
      closeModal();
      ktToast(KT_LANG === 'en' ? '✅ Request sent — waiting approval' : '✅ تم إرسال الطلب — في انتظار الموافقة', 'success');
    })
    .catch(function(e){ console.warn(e); ktToast('❌ ' + (KT_LANG === 'en' ? 'Failed' : 'فشل'), 'error'); });
}

function ktShowMerchantRegistration(){
  closeModal();
  window.location.href = 'merchant.html#register';
}

function ktShowAuthChoice(){
  if (state.user){ navigate('/account'); return; }
  window.openModal(
    '<div class="kt-auth-modal-header">' +
      '<span class="icon">👋</span>' +
      '<h2>' + t('auth_welcome') + '</h2>' +
      '<p>' + t('auth_choose') + '</p>' +
    '</div>' +
    '<div class="kt-auth-choice">' +
      '<div class="kt-auth-option" onclick="closeModal();openOtpModal()">' +
        '<div class="kt-auth-option-icon customer">🛒</div>' +
        '<div class="kt-auth-option-info"><b>' + t('auth_customer') + '</b><span>' + t('auth_customer_desc') + '</span></div>' +
        '<span class="kt-auth-option-arrow">←</span>' +
      '</div>' +
      '<div class="kt-auth-option" onclick="ktShowMerchantRegistration()">' +
        '<div class="kt-auth-option-icon merchant">🏪</div>' +
        '<div class="kt-auth-option-info"><b>' + t('auth_merchant') + '</b><span>' + t('auth_merchant_desc') + '</span></div>' +
        '<span class="kt-auth-option-arrow">←</span>' +
      '</div>' +
      '<div class="kt-auth-option" onclick="ktShowDriverRegistration()" style="border-color:rgba(59,130,246,.5);background:linear-gradient(135deg,rgba(59,130,246,.08),transparent);position:relative">' +
        '<div class="kt-auth-option-icon driver">🛵</div>' +
        '<div class="kt-auth-option-info"><b style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + t('auth_driver') + ' <span style="font-size:10px;padding:3px 10px;border-radius:999px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;letter-spacing:.5px">' + t('auth_new') + '</span></b><span>' + t('auth_driver_desc') + '</span></div>' +
        '<span class="kt-auth-option-arrow" style="color:#3b82f6">←</span>' +
      '</div>' +
    '</div>' +
    '<div class="kt-auth-note">' + t('auth_note') + '</div>' +
    '<div class="kt-modal-settings">' +
      '<button onclick="ktToggleTheme()" type="button"><svg data-lucide="sun-moon"></svg> ' + t('theme_toggle') + '</button>' +
      '<button onclick="ktToggleLang()" type="button"><svg data-lucide="languages"></svg> ' + t('lang_switch_to') + '</button>' +
    '</div>'
  );
  refreshIcons();
}

function viewAccount(){
  if(!state.user){
    return '<section class="k-sec" style="padding-top:200px"><div class="wrap" style="max-width:480px">' + ktBackBtn() + '<div class="card" style="padding:44px;text-align:center"><div style="font-size:72px;margin-bottom:24px">👤</div><h2 class="h2" style="margin-bottom:12px">' + t('acc_welcome') + '</h2><p class="muted" style="margin-bottom:28px">' + t('acc_login_desc') + '</p><button class="btn btn-primary btn-block btn-lg" onclick="openOtpModal()">' + t('acc_login_phone') + '</button></div></div></section>';
  }
  var u = state.user;
  var contactLine = u.email ? '✉️ ' + esc(u.email) : '📱 ' + esc(u.phone || '');
  return '<section class="k-sec" style="padding-top:200px"><div class="wrap" style="max-width:640px">' + ktBackBtn() + '<div class="card" style="padding:32px"><div style="display:flex;align-items:center;gap:20px;margin-bottom:28px"><div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:grid;place-items:center;font-size:36px;color:#fff">👤</div><div style="flex:1"><h1 class="h2" style="margin-bottom:6px">' + esc(u.name || t('acc_customer')) + '</h1><p class="muted small">' + contactLine + '</p></div></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a href="#/orders" class="btn btn-glass" style="flex:1"><svg data-lucide="package" style="width:16px;height:16px"></svg> ' + t('acc_orders') + '</a><a href="#/wishlist" class="btn btn-glass" style="flex:1"><svg data-lucide="heart" style="width:16px;height:16px"></svg> ' + t('acc_wishlist') + '</a><button class="btn btn-ghost" onclick="logout()" style="color:var(--danger)">' + t('acc_logout') + '</button></div></div></div></section>';
}
function logout(){ state.user = null; LS.del('user'); ktToast(KT_LANG === 'en' ? 'Logged out' : 'تم الخروج'); navigate('/'); }

function render(){
  var r = state.route || {view: 'home'};
  var html = '';
  switch(r.view){
    case 'home': html = viewHome(); break;
    case 'categories': html = viewCategories(); break;
    case 'category': html = viewCategory(r.arg); break;
    case 'product': html = viewProduct(r.arg); break;
    case 'search': html = viewSearch(); break;
    case 'cart': html = viewCart(); break;
    case 'wishlist': html = viewWishlist(); break;
    case 'checkout': html = viewCheckout(); break;
    case 'orders': html = viewOrders(); break;
    case 'track': html = viewTrack(r.arg); break;
    case 'track-live': html = viewTrackLive(r.arg); break;
    case 'account': html = viewAccount(); break;
    default: html = viewHome();
  }
  var main = $('#k-main');
  if(main) main.innerHTML = html;
  renderFooter();
  updateActiveNav();
  ktUpdateBadges();
  attachProductClicks();
  refreshIcons();
}
function renderFooter(){
  var footer = $('#k-footer'); if(!footer) return;
  var SVG_WA = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  var SVG_FB = '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  var SVG_IG = '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>';
  var SVG_PHONE = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>';
  var SVG_MAIL = '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>';
  footer.innerHTML = '<div class="wrap"><div class="k-footer-grid"><div><a class="k-logo" href="#/"><img src="logo.png" alt="Kanteen" class="k-footer-logo" onerror="this.style.display=\'none\'"></a><p class="muted small" style="margin-top:8px;line-height:1.7;max-width:340px">' + t('footer_desc') + '</p><p class="muted tiny" style="margin-top:14px">' + t('footer_slogan') + '</p><button type="button" class="k-pwa-footer-btn" id="ktPwaFooterBtn" onclick="ktInstallPwa()"><svg data-lucide="download"></svg><span id="ktPwaFooterText">' + t('footer_pwa_install') + '</span></button></div><div><h4>' + t('footer_shop') + '</h4><ul>' + CATEGORIES.slice(0, 6).map(function(c){ return '<li><a href="#/c/' + c.id + '">' + esc(catName(c)) + '</a></li>'; }).join('') + '</ul></div><div><h4>' + t('footer_links') + '</h4><ul><li><a href="#/account">' + t('footer_account') + '</a></li><li><a href="#/orders">' + t('footer_orders') + '</a></li><li><a href="#/wishlist">' + t('footer_wishlist') + '</a></li><li><a href="merchant.html">' + t('footer_for_merchants') + '</a></li><li><a href="driver.html">' + t('footer_for_drivers') + '</a></li><li><a href="admin.html">' + t('footer_admin') + '</a></li></ul></div><div><h4>' + t('footer_contact') + '</h4><div class="k-contact-list"><a class="phone-c" href="tel:01124169656">' + SVG_PHONE + '<span>01124169656</span></a><a class="wa-c" href="https://wa.me/' + WA_NUMBER + '" target="_blank" rel="noopener">' + SVG_WA + '<span>' + t('footer_whatsapp') + '</span></a><a class="fb-c" href="' + FB_URL + '" target="_blank" rel="noopener">' + SVG_FB + '<span>' + t('footer_facebook') + '</span></a><a class="mail-c" href="mailto:hello@kanteen.app">' + SVG_MAIL + '<span>hello@kanteen.app</span></a></div><div class="k-socials"><a class="wa" href="https://wa.me/' + WA_NUMBER + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + SVG_WA + '</a><a class="fb" href="' + FB_URL + '" target="_blank" rel="noopener" aria-label="Facebook">' + SVG_FB + '</a><a class="ig" href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">' + SVG_IG + '</a><a class="call" href="tel:01124169656" aria-label="Call">' + SVG_PHONE + '</a></div></div></div><div class="k-footer-bottom"><span>© ' + new Date().getFullYear() + ' Kanteen | كانتِين. ' + t('footer_copyright') + '</span><span class="muted tiny">kanteen2026.vercel.app</span><span style="font-size:12.5px;color:var(--ink-3);text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--line);width:100%">' + t('footer_developed_by') + ' <b style="color:var(--gold);font-weight:800">' + t('footer_developer_name') + '</b></span></div></div>';
  setTimeout(ktUpdatePwaFooterBtn, 100);
}
function updateActiveNav(){ var map = {home:'home', categories:'cats', category:'cats', search:'search', cart:'cart', wishlist:'cart', checkout:'cart', orders:'account', track:'account', 'track-live':'account', account:'account'}; var active = map[state.route ? state.route.view : 'home'] || 'home'; $$('.k-bnav').forEach(function(a){ a.classList.toggle('active', a.dataset.nav === active); }); }
function attachProductClicks(){ $$('.k-prod').forEach(function(el){ el.addEventListener('click', function(e){ if(e.target.closest('button')) return; navigate('/p/' + el.dataset.pid); }); }); }
function filterBy(key, val){ var params = new URLSearchParams(state.route.params || {}); if(val) params.set(key, val); else params.delete(key); navigate('/search?' + params.toString()); }
function applyCoupon(){
  var input = $('#coupon-input'); if(!input) return;
  var code = input.value.trim().toUpperCase(); if(!code) return;
  var c = COUPONS.find(function(x){ return x.code === code; });
  if(!c){ ktToast(KT_LANG === 'en' ? 'Invalid coupon' : 'كود غير صحيح', 'error'); return; }
  if(cartTotal() < c.min){ ktToast((KT_LANG === 'en' ? 'Minimum ' : 'الحد الأدنى ') + money(c.min), 'error'); return; }
  state.coupon = c; persist('coupon');
  ktToast(KT_LANG === 'en' ? 'Coupon applied ✓' : 'تم تطبيق الكود ✓', 'success');
  render();
}

var CHAT = {open: false};
function ktAddMsg(role, text){ var body = $('#kt-chat-body'); if(!body) return; var el = document.createElement('div'); el.className = 'kt-msg ' + role; el.innerHTML = text; body.appendChild(el); body.scrollTop = body.scrollHeight; refreshIcons(); }
function ktAnswer(q){
  var s = q.toLowerCase().trim();
  var has = function(){ for(var i = 0; i < arguments.length; i++){ if(s.indexOf(arguments[i]) !== -1) return true; } return false; };
  if(has('تتبع','track','طلبي','order')){ var lastOrder = state.orders[0]; if(lastOrder) return t('bot_track') + ' ' + lastOrder.id + '<br>' + t('bot_status') + ' <b style="color:var(--gold)">' + statusInfo(lastOrder.status).label + '</b>'; return t('bot_no_orders'); }
  if(has('توصيل','delivery')) return t('bot_delivery');
  if(has('كوبون','خصم','coupon','discount')) return t('bot_coupons') + '<br>• <b>KANTEEN10</b> — 10%<br>• <b>NEW20</b> — 20%<br>• <b>FLAT50</b> — 50<br>• <b>FREESHIP</b>';
  if(has('دفع','payment')) return t('bot_pay') + '<br>• 💵 ' + t('co_pay_cod') + '<br>• 🏦 InstaPay<br>• 📱 ' + t('co_pay_voda') + '<br>• 💳 PayPal<br>• 🏪 ' + t('co_pay_fawry');
  if(has('تواصل','اتصل','واتس','contact','call')) return t('bot_contact') + '<br>• 📱 <a href="tel:01124169656" style="color:var(--gold)">01124169656</a><br>• 💬 <a href="https://wa.me/' + WA_NUMBER + '" target="_blank" style="color:#25D366">' + t('footer_whatsapp') + '</a>';
  if(has('مندوب','driver')) return t('bot_drivers') + ' <a href="driver.html" style="color:#3b82f6;font-weight:700">' + t('bot_register_driver') + '</a> ' + t('bot_earn');
  if(has('سلام','مرحبا','اهلا','hi','hello')) return t('bot_hello');
  return t('bot_not_understood');
}
function ktSendChat(){ var input = $('#kt-chat-input'); if(!input) return; var v = input.value.trim(); if(!v) return; ktAddMsg('user', esc(v)); input.value = ''; setTimeout(function(){ ktAddMsg('bot', ktAnswer(v)); }, 500); }
function ktOpenChat(){ var panel = $('#kt-chat-panel'); if(panel) panel.classList.add('open'); CHAT.open = true; setTimeout(function(){ var input = $('#kt-chat-input'); if(input) input.focus(); }, 300); }
function ktCloseChat(){ var panel = $('#kt-chat-panel'); if(panel) panel.classList.remove('open'); CHAT.open = false; }

/* ✅ محسّن — يوقف الفيديو على الموبايل */
function ktInitVideo(){
  var v = document.getElementById('k-bg-video'); if(!v) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var isSlow = (navigator.connection && navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g'));

  if (isMobile || isSlow || reduce.matches){
    v.pause();
    v.removeAttribute('src');
    v.style.display = 'none';
    return;
  }

  function sync(){
    if (reduce.matches || document.hidden){ v.pause(); }
    else { var p = v.play(); if(p && p.catch) p.catch(function(){}); }
  }
  sync();
  if(reduce.addEventListener) reduce.addEventListener('change', sync);
  v.addEventListener('loadeddata', function(){ v.play().catch(function(){}); });
  document.addEventListener('visibilitychange', sync);
}

var ktDeferredPrompt = null;
function ktUpdatePwaFooterBtn(){
  var btn = document.getElementById('ktPwaFooterBtn');
  var txt = document.getElementById('ktPwaFooterText');
  if (!btn || !txt) return;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  var isInstalled = LS.get('pwa_installed', false) || isStandalone;
  if (isInstalled){ btn.classList.add('installed'); txt.textContent = t('footer_pwa_installed'); }
  else { btn.classList.remove('installed'); txt.textContent = t('footer_pwa_install'); }
}
function ktInitPWA(){
  if ('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').then(function(reg){ console.log('✅ SW:', reg.scope); }).catch(function(err){ console.warn('SW fail:', err); });
    });
  }
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    ktDeferredPrompt = e;
    if (!LS.get('pwa_dismissed', false)){
      setTimeout(function(){ var b = document.getElementById('kPwaBanner'); if (b) b.classList.add('show'); }, 3000);
    }
  });
  window.addEventListener('appinstalled', function(){
    ktToast(KT_LANG === 'en' ? '🎉 App installed' : '🎉 تم تثبيت التطبيق', 'success');
    var b = document.getElementById('kPwaBanner'); if (b) b.classList.remove('show');
    LS.set('pwa_installed', true);
    ktUpdatePwaFooterBtn();
  });
  ktUpdatePwaFooterBtn();
}
function ktInstallPwa(){
  if (window.matchMedia('(display-mode: standalone)').matches || LS.get('pwa_installed', false)){
    ktToast(KT_LANG === 'en' ? '✅ Already installed' : '✅ التطبيق مثبّت بالفعل'); ktUpdatePwaFooterBtn(); return;
  }
  if (!ktDeferredPrompt){ ktToast(KT_LANG === 'en' ? '📱 Use browser menu → Add to Home Screen' : '📱 استخدم قائمة المتصفح → إضافة إلى الشاشة الرئيسية'); return; }
  ktDeferredPrompt.prompt();
  ktDeferredPrompt.userChoice.then(function(choice){
    if (choice.outcome === 'accepted') ktToast(KT_LANG === 'en' ? '🎉 Installing...' : '🎉 جاري التثبيت...', 'success');
    ktDeferredPrompt = null;
    var b = document.getElementById('kPwaBanner'); if (b) b.classList.remove('show');
    setTimeout(ktUpdatePwaFooterBtn, 1000);
  });
}
function ktDismissPwa(){ var b = document.getElementById('kPwaBanner'); if (b) b.classList.remove('show'); LS.set('pwa_dismissed', true); }

function ktInit(){
  var header = $('#k-header');
  if(header){
    var _headerTicking = false;
    var onScroll = function(){
      if (_headerTicking) return;
      _headerTicking = true;
      requestAnimationFrame(function(){
        header.classList.toggle('scrolled', window.scrollY > 20);
        _headerTicking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
  }
  var locBar = $('#ktLocBar');
  if (locBar){
    var _lastScrollY = 0;
    var _locTicking = false;
    window.addEventListener('scroll', function(){
      if (_locTicking) return;
      _locTicking = true;
      requestAnimationFrame(function(){
        if (state.route && state.route.view === 'home'){ locBar.classList.add('k-hidden'); _locTicking = false; return; }
        if (locBar.classList.contains('k-hidden')){ _locTicking = false; return; }
        var y = window.scrollY;
        locBar.classList.toggle('scrolled', y > 100);
        if (y > 200 && y > _lastScrollY + 5){ locBar.classList.add('k-hidden'); }
        else if (y < _lastScrollY - 15 || y < 100){ locBar.classList.remove('k-hidden'); }
        _lastScrollY = y;
        _locTicking = false;
      });
    }, {passive: true});
  }

  var headerSearchBtn = $('#k-search-btn');
  if (headerSearchBtn){
    headerSearchBtn.addEventListener('click', function(e){
      e.preventDefault();
      ktToggleSearchBar();
    });
  }
  var searchFab = $('#kt-search-fab');
  if (searchFab){
    searchFab.addEventListener('click', function(){
      ktToggleSearchBar();
    });
  }

  document.addEventListener('click', function(e){
    var locBarEl = document.getElementById('ktLocBar');
    var searchBtnEl = document.getElementById('k-search-btn');
    var searchFabEl = document.getElementById('kt-search-fab');
    if (!locBarEl || !searchBtnEl) return;
    if (!locBarEl.classList.contains('k-hidden')){
      var insideLocBar = locBarEl.contains(e.target);
      var insideSearchBtn = searchBtnEl.contains(e.target);
      var insideSearchFab = searchFabEl && searchFabEl.contains(e.target);
      if (!insideLocBar && !insideSearchBtn && !insideSearchFab){
        locBarEl.classList.add('k-hidden');
      }
    }
  });

  var cartBtn = $('#k-cart-btn');
  if(cartBtn) cartBtn.addEventListener('click', ktOpenDrawer);
  var wishBtn = $('#k-wish-btn');
  if(wishBtn) wishBtn.addEventListener('click', function(){ navigate('/wishlist'); });
  var userBtn = $('#k-user-btn');
  if(userBtn) userBtn.addEventListener('click', function(){ ktShowAuthChoice(); });
  var searchInput = $('#k-search-input');
  if(searchInput) searchInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ navigate('/search?q=' + encodeURIComponent(e.target.value.trim())); e.target.blur(); } });
  var chatFab = $('#kt-chat-fab');
  if(chatFab) chatFab.addEventListener('click', function(){ CHAT.open ? ktCloseChat() : ktOpenChat(); });
  var chatClose = $('#kt-chat-close');
  if(chatClose) chatClose.addEventListener('click', ktCloseChat);

  var chatBody = document.getElementById('kt-chat-body');
  if (chatBody && chatBody.children.length === 0){
    var hour = new Date().getHours();
    var greet = hour < 12 ? t('general_good_morning') : t('general_good_evening');
    ktAddMsg('bot', greet + '! 👋 ' + (KT_LANG === 'en' ? 'How can I help you?' : 'أنا مساعد كانتِين.<br><br>كيف أقدر أساعدك؟'));
  }
  var quick = [t('chat_quick_1'), t('chat_quick_2'), t('chat_quick_3'), t('chat_quick_4')];
  var quickEl = $('#kt-chat-quick');
  if(quickEl){
    quickEl.innerHTML = quick.map(function(q){ return '<button type="button">' + q + '</button>'; }).join('');
    quickEl.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){ var input = $('#kt-chat-input'); if(input){ input.value = b.textContent; ktSendChat(); } }); });
  }
  var overlay = $('#k-overlay');
  if(overlay) overlay.addEventListener('click', function(e){ if(e.target.id === 'k-overlay'){ e.currentTarget.classList.remove('open'); document.body.style.overflow = ''; } });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ ktCloseMegaMenu(); ktCloseChat(); ktCloseDrawer(); closeModal(); ktCloseSearchBar(); } });
  var addrInput = document.getElementById('ktAddressInput');
  if(addrInput) addrInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') ktSubmitAddress(); });

  applyLang();
  ktInitVideo();
  ktInitPWA();
  if(!location.hash) location.hash = '#/';
  route();
  ktUpdateBadges();
  setTimeout(ktUseCurrentLocation, 800);
  setTimeout(ktCheckDeliveryZone, 1500);
  setTimeout(ktUpdatePwaFooterBtn, 800);

  if (window.KT_SOUND && !LS.get('welcomed', false)){
    setTimeout(function(){
      KT_SOUND.welcome();
      LS.set('welcomed', true);
    }, 2500);
  }
}
window.openModal = function(html){
  var o = $('#k-overlay'); if(!o) return;
  o.classList.add('open');
  o.innerHTML = '<div class="k-modal">' + html + '<button class="k-modal-close" onclick="closeModal()" aria-label="Close"><svg data-lucide="x"></svg></button></div>';
  o.onclick = function(e){ if(e.target === o) closeModal(); };
  document.body.style.overflow = 'hidden';
  refreshIcons();
};
window.closeModal = function(){ var o = $('#k-overlay'); if(!o) return; o.classList.remove('open'); document.body.style.overflow = ''; };

function ktToggleMegaMenu(){
  var menu = document.getElementById('ktMegaMenu');
  var backdrop = document.getElementById('ktMegaBackdrop');
  var btn = document.querySelector('.kt-mega-btn');
  if (!menu) return;

  var isOpen = menu.classList.contains('open');
  if (isOpen){
    ktCloseMegaMenu();
  } else {
    menu.classList.add('open');
    backdrop.classList.add('open');
    btn.classList.add('open');
    if (window.KT_SOUND) KT_SOUND.message();
  }
}

function ktCloseMegaMenu(){
  var menu = document.getElementById('ktMegaMenu');
  var backdrop = document.getElementById('ktMegaBackdrop');
  var btn = document.querySelector('.kt-mega-btn');
  if (menu) menu.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  if (btn) btn.classList.remove('open');
}

Object.assign(window, {
  navigate: navigate, ktAddToCart: ktAddToCart, ktRemoveFromCart: ktRemoveFromCart,
  ktUpdateQty: ktUpdateQty, ktQuickAdd: ktQuickAdd, ktToggleFav: ktToggleFav,
  ktOpenDrawer: ktOpenDrawer, ktCloseDrawer: ktCloseDrawer, ktRenderDrawer: ktRenderDrawer,
  filterBy: filterBy, applyCoupon: applyCoupon, checkoutNext: checkoutNext, placeOrder: placeOrder,
  logout: logout, ktSendChat: ktSendChat, ktCloseChat: ktCloseChat,
  render: render, ktToast: ktToast, ktSendOrderToWhatsApp: ktSendOrderToWhatsApp,
  ktUseCurrentLocation: ktUseCurrentLocation, ktSearchAddress: ktSearchAddress,
  ktSubmitAddress: ktSubmitAddress, ktFocusAddressInput: ktFocusAddressInput,
  ktCheckDeliveryZone: ktCheckDeliveryZone, ktCheckZoneDetails: ktCheckZoneDetails,
  ktAddStoreProductToCart: ktAddStoreProductToCart, onGovChange: onGovChange,
  ktOpenService: ktOpenService, ktShowSearchSuggestions: ktShowSearchSuggestions,
  ktPickSearchSuggestion: ktPickSearchSuggestion, ktPickSearchProduct: ktPickSearchProduct,
  ktHideSearchSuggestions: ktHideSearchSuggestions, ktOpenNearbyStores: ktOpenNearbyStores,
  ktShowNearbyStoresModal: ktShowNearbyStoresModal, ktPickStore: ktPickStore,
  ktOpenPharmacy: ktOpenPharmacy, ktFilterPharmacy: ktFilterPharmacy,
  ktShowFlowersComingSoon: ktShowFlowersComingSoon,
  ktFinalizePendingOrder: ktFinalizePendingOrder,
  ktInstallPwa: ktInstallPwa, ktDismissPwa: ktDismissPwa,
  ktUpdatePwaFooterBtn: ktUpdatePwaFooterBtn,
  ktSyncFromFirebase: ktSyncFromFirebase,
  ktToggleTheme: ktToggleTheme, applyTheme: applyTheme,
  ktShowAuthChoice: ktShowAuthChoice,
  openOtpModal: openOtpModal, ktSendOtp: ktSendOtp, ktVerifyOtp: ktVerifyOtp, ktBackToPhone: ktBackToPhone,
  ktSwitchOtpMethod: ktSwitchOtpMethod,
  ktShowDriverRegistration: ktShowDriverRegistration,
  ktSubmitDriverRegistration: ktSubmitDriverRegistration,
  ktShowMerchantRegistration: ktShowMerchantRegistration,
  ktStartDriverListener: ktStartDriverListener, ktStopDriverListener: ktStopDriverListener,
  ktListenToOrder: ktListenToOrder, ktStopOrderListener: ktStopOrderListener,
  viewTrackLive: viewTrackLive,
  ktToggleSearchBar: ktToggleSearchBar, ktCloseSearchBar: ktCloseSearchBar,
  ktToggleLang: ktToggleLang, applyLang: applyLang, t: t,
  ktToggleMegaMenu: ktToggleMegaMenu,
  ktCloseMegaMenu: ktCloseMegaMenu,
  openModal: window.openModal, closeModal: window.closeModal
});

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ktInit);
else ktInit();
console.log('%cكانتِين | Kanteen ✨', 'background:linear-gradient(135deg,#ff6b35,#ffb800);color:#fff;padding:6px 14px;border-radius:6px;font-weight:800;font-size:13px', 'شليل مارت — تطوير: م. هلال شليل');