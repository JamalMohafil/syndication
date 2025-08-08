import { Injectable } from '@nestjs/common';

export interface Product {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  price: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  brand: string;
  gtin?: string;
  mpn?: string;
  condition: 'new' | 'used' | 'refurbished';
  google_product_category?: string;
  product_type?: string;
}

@Injectable()
export class FeedBuilderService {
  generateDemoProducts(tenantId: string): Product[] {
    const demoProducts: Product[] = [
      {
        id: `${tenantId}_001`,
        title: 'iPhone 15 Pro - 256GB',
        description:
          'Latest iPhone with advanced camera system and A17 Pro chip',
        link: `https://demo-store.com/products/iphone-15-pro-256gb`,
        image_link: `https://demo-store.com/images/iphone-15-pro.jpg`,
        price: '999.00 USD',
        availability: 'in_stock',
        brand: 'Apple',
        gtin: '194253394915',
        condition: 'new',
        google_product_category:
          'Electronics > Communications > Telephony > Mobile Phones',
        product_type: 'Smartphones > iPhone',
      },
      {
        id: `${tenantId}_002`,
        title: 'Samsung Galaxy S24 Ultra - 512GB',
        description:
          'Premium Android smartphone with S Pen and advanced AI features',
        link: `https://demo-store.com/products/galaxy-s24-ultra-512gb`,
        image_link: `https://demo-store.com/images/galaxy-s24-ultra.jpg`,
        price: '1199.00 USD',
        availability: 'in_stock',
        brand: 'Samsung',
        condition: 'new',
        google_product_category:
          'Electronics > Communications > Telephony > Mobile Phones',
        product_type: 'Smartphones > Samsung',
      },
      {
        id: `${tenantId}_003`,
        title: 'MacBook Air M3 - 13-inch',
        description: 'Ultra-thin laptop with M3 chip and all-day battery life',
        link: `https://demo-store.com/products/macbook-air-m3-13`,
        image_link: `https://demo-store.com/images/macbook-air-m3.jpg`,
        price: '1299.00 USD',
        availability: 'in_stock',
        brand: 'Apple',
        condition: 'new',
        google_product_category: 'Electronics > Computers > Laptops',
        product_type: 'Laptops > MacBook',
      },
      {
        id: `${tenantId}_004`,
        title: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise canceling wireless headphones',
        link: `https://demo-store.com/products/sony-wh-1000xm5`,
        image_link: `https://demo-store.com/images/sony-wh-1000xm5.jpg`,
        price: '399.99 USD',
        availability: 'in_stock',
        brand: 'Sony',
        condition: 'new',
        google_product_category:
          'Electronics > Audio > Audio Components > Headphones',
        product_type: 'Audio > Headphones > Wireless',
      },
      {
        id: `${tenantId}_005`,
        title: 'Nike Air Force 1 - White',
        description: 'Classic white sneakers for everyday wear',
        link: `https://demo-store.com/products/nike-air-force-1-white`,
        image_link: `https://demo-store.com/images/nike-air-force-1.jpg`,
        price: '110.00 USD',
        availability: 'in_stock',
        brand: 'Nike',
        condition: 'new',
        google_product_category: 'Apparel & Accessories > Shoes',
        product_type: 'Footwear > Sneakers',
      },
    ];

    return demoProducts;
  }

  generateGoogleFeedXML(products: Product[]): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed</title>
    <description>Demo product feed for Google Merchant Center</description>
    <link>https://demo-store.com</link>`;

    const xmlItems = products
      .map(
        (product) => `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.title}]]></g:title>
      <g:description><![CDATA[${product.description}]]></g:description>
      <g:link>${product.link}</g:link>
      <g:image_link>${product.image_link}</g:image_link>
      <g:price>${product.price}</g:price>
      <g:availability>${product.availability}</g:availability>
      <g:brand>${product.brand}</g:brand>
      <g:condition>${product.condition}</g:condition>
      ${product.gtin ? `<g:gtin>${product.gtin}</g:gtin>` : ''}
      ${product.google_product_category ? `<g:google_product_category>${product.google_product_category}</g:google_product_category>` : ''}
      ${product.product_type ? `<g:product_type>${product.product_type}</g:product_type>` : ''}
    </item>`,
      )
      .join('');

    const xmlFooter = `
  </channel>
</rss>`;

    return xmlHeader + xmlItems + xmlFooter;
  }

  generateMetaFeedCSV(products: Product[]): string {
    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
    ];

    const csvHeader = headers.join(',');
    const csvRows = products.map((product) =>
      [
        product.id,
        `"${product.title}"`,
        `"${product.description}"`,
        product.availability,
        product.condition,
        product.price,
        product.link,
        product.image_link,
        product.brand,
        `"${product.google_product_category || ''}"`,
      ].join(','),
    );

    return csvHeader + '\n' + csvRows.join('\n');
  }
}
