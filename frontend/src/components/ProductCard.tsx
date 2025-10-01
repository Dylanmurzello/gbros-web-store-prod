import Link from 'next/link';
import Image from 'next/image'
import { formatPrice, getProductImageUrl } from '@/lib/vendure/api';

interface ProductCardProps {
  product: {
    productId: string;
    productName: string;
    slug: string;
    description: string;
    productAsset?: {
      id: string;
      preview: string;
    };
    priceWithTax: {
      min?: number;
      max?: number;
    } | number;
    currencyCode: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  // Use 'medium' preset for product cards - optimized for grid display
  const imageUrl = getProductImageUrl(product.productAsset?.preview, 'medium');

  const price = typeof product.priceWithTax === 'number'
    ? formatPrice(product.priceWithTax, product.currencyCode)
    : product.priceWithTax.min && product.priceWithTax.max
    ? `${formatPrice(product.priceWithTax.min, product.currencyCode)} - ${formatPrice(product.priceWithTax.max, product.currencyCode)}`
    : 'Price unavailable';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Link href={`/products/${product.slug}`}>
        <Image
          alt={product.productName}
          src={imageUrl}
          loading="lazy"
          className="aspect-[3/4] bg-gray-200 object-cover group-hover:opacity-75 sm:h-96"
        />
        <div className="flex flex-1 flex-col space-y-2 p-4">
          <h3 className="text-sm font-medium text-gray-900">
            <span aria-hidden="true" className="absolute inset-0" />
            {product.productName}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
          <div className="flex flex-1 flex-col justify-end">
            <p className="text-base font-medium text-gray-900">{price}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}