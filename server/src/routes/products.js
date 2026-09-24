import { searchProducts as meiliSearch } from '../utils/meili.js';

// استبدل route '/' الموجود
router.get('/', async (req, res, next) => {
  try {
    const { q, cat, brand, deals, sort, limit = 60, offset = 0 } = req.query;
    
    // ═══════ Try Meilisearch first if query exists ═══════
    if(q && q.trim().length >= 2){
      const filters = [];
      if(cat) filters.push(`cat = "${cat}"`);
      if(brand) filters.push(`brand = "${brand}"`);
      if(deals === '1') filters.push(`off > 0`);
      
      const sortMap = {
        'price_asc': ['price:asc'],
        'price_desc': ['price:desc'],
        'popular': ['reviews:desc'],
        'rating': ['rating:desc']
      };
      
      const meiliResult = await meiliSearch(q, {
        filter: filters.length ? filters.join(' AND ') : undefined,
        sort: sortMap[sort] || undefined,
        limit: +limit,
        offset: +offset
      });
      
      if(meiliResult){
        return res.json({
          items: meiliResult.hits,
          total: meiliResult.estimatedTotalHits,
          limit: +limit,
          offset: +offset,
          source: 'meilisearch',
          query: meiliResult.query,
          processingTimeMs: meiliResult.processingTimeMs
        });
      }
    }
    
    // ═══════ Fallback: Prisma ═══════
    const where = {};
    if(q){
      where.OR = [
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { brand:  { contains: q, mode: 'insensitive' } }
      ];
    }
    if(cat) where.cat = cat;
    if(brand) where.brand = brand;
    if(deals === '1') where.off = { gt: 0 };
    
    const orderBy = {
      'price_asc':  { price: 'asc' },
      'price_desc': { price: 'desc' },
      'popular':    { reviews: 'desc' },
      'rating':     { rating: 'desc' },
      'new':        { createdAt: 'desc' }
    }[sort] || { id: 'asc' };
    
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take: +limit, skip: +offset }),
      prisma.product.count({ where })
    ]);
    
    res.json({ items, total, limit: +limit, offset: +offset, source: 'prisma' });
  } catch(e){ next(e); }
});