import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { id:'grocery',nameAr:'بقالة',nameEn:'Grocery',emoji:'🛒',order:1 },
  { id:'beverages',nameAr:'مشروبات',nameEn:'Beverages',emoji:'🥤',order:2 },
  { id:'dairy',nameAr:'ألبان وبيض',nameEn:'Dairy & Eggs',emoji:'🥛',order:3 },
  { id:'bakery',nameAr:'مخبوزات',nameEn:'Bakery',emoji:'🥖',order:4 },
  { id:'fruits',nameAr:'فواكه وخضروات',nameEn:'Fruits & Veg',emoji:'🥬',order:5 },
  { id:'frozen',nameAr:'مجمدات',nameEn:'Frozen',emoji:'🧊',order:6 },
  { id:'snacks',nameAr:'سناكس',nameEn:'Snacks',emoji:'🍿',order:7 },
  { id:'cleaning',nameAr:'منظفات',nameEn:'Cleaning',emoji:'🧴',order:8 },
  { id:'personal',nameAr:'عناية شخصية',nameEn:'Personal Care',emoji:'🧼',order:9 },
  { id:'home',nameAr:'مستلزمات منزلية',nameEn:'Home',emoji:'🏠',order:10 }
];

const PRODUCTS = [
  {cat:'grocery',brand:'Barilla',nameAr:'مكرونة بيني 500ج',nameEn:'Penne Pasta 500g',emoji:'🍝',price:22,off:15,weight:'500g',rating:4.6},
  {cat:'grocery',brand:'Heinz',nameAr:'كاتشب طماطم 400ج',nameEn:'Ketchup 400g',emoji:'🍅',price:35,off:0,weight:'400g',rating:4.7},
  {cat:'grocery',brand:'Al Alali',nameAr:'أرز مصري فاخر 1ك',nameEn:'Rice 1kg',emoji:'🍚',price:45,off:20,weight:'1kg',rating:4.5},
  {cat:'grocery',brand:'Al Alali',nameAr:'زيت دوار الشمس 1ل',nameEn:'Sunflower Oil 1L',emoji:'🫒',price:72,off:10,weight:'1L',rating:4.4},
  {cat:'grocery',brand:'Al Alali',nameAr:'سكر أبيض 1ك',nameEn:'White Sugar 1kg',emoji:'🧂',price:25,off:0,weight:'1kg',rating:4.6},
  {cat:'beverages',brand:'Coca-Cola',nameAr:'كوكاكولا 1.5ل',nameEn:'Coca-Cola 1.5L',emoji:'🥤',price:20,off:10,weight:'1.5L',rating:4.7},
  {cat:'beverages',brand:'Pepsi',nameAr:'بيبسي 1ل',nameEn:'Pepsi 1L',emoji:'🥤',price:18,off:0,weight:'1L',rating:4.5},
  {cat:'beverages',brand:'Lipton',nameAr:'شاي ليبتون 100 فتلة',nameEn:'Lipton Tea 100',emoji:'🍵',price:62,off:15,weight:'100 bags',rating:4.8},
  {cat:'beverages',brand:'Nestlé',nameAr:'نسكافيه جولد 200ج',nameEn:'Nescafé Gold 200g',emoji:'☕',price:145,off:20,weight:'200g',rating:4.9},
  {cat:'beverages',brand:'Juhayna',nameAr:'عصير برتقال 1ل',nameEn:'Orange Juice 1L',emoji:'🧃',price:30,off:0,weight:'1L',rating:4.6},
  {cat:'dairy',brand:'Juhayna',nameAr:'لبن كامل الدسم 1ل',nameEn:'Full Milk 1L',emoji:'🥛',price:25,off:0,weight:'1L',rating:4.8},
  {cat:'dairy',brand:'Juhayna',nameAr:'زبادي طبيعي 400ج',nameEn:'Yogurt 400g',emoji:'🥣',price:18,off:10,weight:'400g',rating:4.6},
  {cat:'dairy',brand:'Almarai',nameAr:'جبنة بيضاء 500ج',nameEn:'White Cheese 500g',emoji:'🧀',price:45,off:15,weight:'500g',rating:4.5},
  {cat:'dairy',brand:'Kanteen',nameAr:'بيض طازج ×30',nameEn:'Fresh Eggs ×30',emoji:'🥚',price:105,off:0,weight:'30 pack',rating:4.8},
  {cat:'bakery',brand:'Kanteen',nameAr:'خبز فينو ×5',nameEn:'Fino Bread ×5',emoji:'🥖',price:18,off:0,weight:'5 pack',rating:4.5},
  {cat:'bakery',brand:'Kanteen',nameAr:'توست أسمر 500ج',nameEn:'Brown Toast 500g',emoji:'🍞',price:32,off:8,weight:'500g',rating:4.6},
  {cat:'fruits',brand:'Kanteen',nameAr:'طماطم طازجة 1ك',nameEn:'Tomatoes 1kg',emoji:'🍅',price:20,off:0,weight:'1kg',rating:4.6},
  {cat:'fruits',brand:'Kanteen',nameAr:'موز 1ك',nameEn:'Bananas 1kg',emoji:'🍌',price:25,off:0,weight:'1kg',rating:4.8},
  {cat:'fruits',brand:'Kanteen',nameAr:'تفاح أحمر 1ك',nameEn:'Red Apples 1kg',emoji:'🍎',price:52,off:15,weight:'1kg',rating:4.7},
  {cat:'frozen',brand:'Americana',nameAr:'برجر لحمة ×6',nameEn:'Beef Burgers ×6',emoji:'🍔',price:105,off:20,weight:'6 pc',rating:4.6},
  {cat:'frozen',brand:'Nestlé',nameAr:'آيس كريم فانيليا 1ل',nameEn:'Ice Cream 1L',emoji:'🍦',price:95,off:0,weight:'1L',rating:4.8},
  {cat:'snacks',brand:"Lay's",nameAr:'شيبسي 170ج',nameEn:'Chips 170g',emoji:'🥔',price:28,off:0,weight:'170g',rating:4.7},
  {cat:'snacks',brand:'Cadbury',nameAr:'شوكولاتة 100ج',nameEn:'Dairy Milk 100g',emoji:'🍫',price:40,off:15,weight:'100g',rating:4.9},
  {cat:'cleaning',brand:'Persil',nameAr:'مسحوق غسيل 3ك',nameEn:'Detergent 3kg',emoji:'🧴',price:195,off:20,weight:'3kg',rating:4.7},
  {cat:'personal',brand:'Dove',nameAr:'شامبو دوف 400م',nameEn:'Dove Shampoo 400ml',emoji:'🧴',price:105,off:25,weight:'400ml',rating:4.8},
  {cat:'home',brand:'Kanteen',nameAr:'أكياس قمامة ×30',nameEn:'Trash Bags ×30',emoji:'🗑️',price:40,off:10,weight:'30 pc',rating:4.6}
];

const COUPONS = [
  { code:'KANTEEN10', type:'pct',   value:10, minOrder:100, maxDiscount:50 },
  { code:'NEW20',     type:'pct',   value:20, minOrder:150, maxDiscount:80 },
  { code:'FLAT50',    type:'fixed', value:50, minOrder:300, maxDiscount:50 },
  { code:'FREESHIP',  type:'ship',  value:0,  minOrder:200, maxDiscount:25 }
];

async function main(){
  console.log('🌱 Seeding database...');
  
  // Categories
  for(const c of CATEGORIES){
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  console.log('✅ Categories seeded');
  
  // Products
  for(const p of PRODUCTS){
    const discount = p.off > 0 ? +(p.price * (1 - p.off / 100)).toFixed(2) : 0;
    await prisma.product.create({
      data: {
        ...p,
        discount,
        stock: 50 + Math.floor(Math.random() * 100),
        bestSeller: Math.random() > 0.6,
        isNew: Math.random() > 0.85,
        featured: Math.random() > 0.7,
        reviews: 20 + Math.floor(Math.random() * 300),
        descAr: `منتج ${p.nameAr} عالي الجودة من ${p.brand}.`,
        descEn: `High quality ${p.nameEn} from ${p.brand}.`
      }
    }).catch(() => {});
  }
  console.log('✅ Products seeded');
  
  // Coupons
  for(const c of COUPONS){
    await prisma.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }
  console.log('✅ Coupons seeded');
  
  // Admin user
  const adminEmail = 'admin@kanteen.app';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if(!exists){
    await prisma.user.create({
      data: {
        name: 'Kanteen Admin',
        email: adminEmail,
        phone: '+201124169656',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        referralCode: 'KTNADMIN'
      }
    });
    console.log(`✅ Admin created: ${adminEmail} / admin123`);
  }
  
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());