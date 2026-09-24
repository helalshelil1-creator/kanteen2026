import { MeiliSearch } from 'meilisearch';

let client = null;
let index = null;

export function initMeili(){
  if(!process.env.MEILI_HOST) {
    console.warn('⚠️ MEILI_HOST not set — Search disabled');
    return;
  }
  
  client = new MeiliSearch({
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_KEY
  });
  
  index = client.index('products');
  console.log('✅ Meilisearch initialized');
}

export async function syncProducts(products){
  if(!index) return;
  try {
    const docs = products.map(p => ({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      brand: p.brand,
      cat: p.cat,
      emoji: p.emoji,
      price: Number(p.price),
      discount: Number(p.discount),
      off: p.off,
      rating: p.rating,
      reviews: p.reviews,
      stock: p.stock,
      bestSeller: p.bestSeller,
      isNew: p.isNew,
      featured: p.featured,
      weight: p.weight
    }));
    
    await index.addDocuments(docs);
    console.log(`📥 Synced ${docs.length} products to Meilisearch`);
  } catch(e){
    console.error('Meili sync error:', e.message);
  }
}

export async function configureIndex(){
  if(!index) return;
  try {
    await index.updateSettings({
      searchableAttributes: ['nameAr', 'nameEn', 'brand', 'cat'],
      filterableAttributes: ['cat', 'brand', 'bestSeller', 'isNew', 'off'],
      sortableAttributes: ['price', 'discount', 'rating', 'reviews'],
      rankingRules: [
        'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
        'rating:desc', 'reviews:desc'
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 }
      },
      synonyms: {
        'كوكاكولا': ['كولا', 'coke', 'coca'],
        'بيبسي': ['pepsi', 'ببسي'],
        'لبن': ['حليب', 'milk'],
        'خبز': ['عيش', 'bread'],
        'بيض': ['eggs'],
        'جبنة': ['جبن', 'cheese'],
        'شاي': ['tea'],
        'قهوة': ['قهوه', 'coffee'],
        'مياه': ['ماء', 'water'],
        'زيت': ['oil'],
        'سكر': ['sugar'],
        'ملح': ['salt'],
        'منظف': ['منظفات', 'detergent'],
        'شامبو': ['shampoo']
      }
    });
    console.log('⚙️ Meilisearch index configured');
  } catch(e){
    console.error('Meili config error:', e.message);
  }
}

export async function searchProducts(query, options = {}){
  if(!index) return null;
  try {
    const { filter, sort, limit = 60, offset = 0 } = options;
    
    return await index.search(query, {
      filter,
      sort,
      limit,
      offset,
      attributesToHighlight: ['nameAr', 'nameEn', 'brand'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    });
  } catch(e){
    console.error('Meili search error:', e.message);
    return null;
  }
}