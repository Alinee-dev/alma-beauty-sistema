import { useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import { getProductImages } from '../services/productImages';

interface ProductImageGalleryProps {
  product: Product;
  containerStyle?: CSSProperties;
  imageStyle?: CSSProperties;
  children?: ReactNode;
  fallbackWidth?: 200 | 400;
  showControls?: boolean;
}

export const ProductImageGallery = ({
  product,
  containerStyle,
  imageStyle,
  children,
  fallbackWidth = 400,
  showControls = true,
}: ProductImageGalleryProps) => {
  const images = getProductImages(product, fallbackWidth);
  const [activeImage, setActiveImage] = useState(0);
  const canNavigate = showControls && images.length > 1;
  const isColeSatin = product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('cole satin');
  const showPrevious = () => setActiveImage((index) => (index - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((index) => (index + 1) % images.length);
  const {
    width = '100%',
    height,
    borderRadius,
    marginBottom,
    ...imageContainerStyle
  } = containerStyle ?? {};

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width,
        height,
        marginBottom,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          margin: '0 auto',
          borderRadius,
          overflow: 'hidden',
          ...imageContainerStyle,
        }}
      >
        <img
          src={images[activeImage] ?? images[0]}
          alt={product.name}
          style={{
            width: isColeSatin ? '78%' : '100%',
            height: isColeSatin ? '78%' : '100%',
            objectFit: isColeSatin ? 'contain' : 'cover',
            ...(isColeSatin ? { position: 'absolute', inset: '11%', margin: 'auto' } : {}),
            ...imageStyle,
          }}
        />
        {children}
      </div>
      {canNavigate && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            onClick={showPrevious}
            aria-label={`Foto anterior de ${product.name}`}
            style={galleryButtonStyle}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label={`Foto siguiente de ${product.name}`}
            style={galleryButtonStyle}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const galleryButtonStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.95)',
  color: 'var(--primary-hover)',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(51, 26, 36, 0.14)',
  pointerEvents: 'auto',
};
