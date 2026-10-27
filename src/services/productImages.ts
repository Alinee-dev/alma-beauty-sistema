import type { Product } from '../types';
import baseCorrectorDisplayImage from '../assets/base-corrector-exhibidor.png';
import baseCorrectorIndividualImage from '../assets/base-corrector-individual.png';
import cepilloAntifrizImage from '../assets/cepillo-antifriz.png';
import coleSatinImage from '../assets/cole-satin.png';
import glossMagicoDetailImage from '../assets/gloss-magico-detalle.png';
import glossMagicoVariantsImage from '../assets/gloss-magico-variantes.png';
import ruborIluminadorImage from '../assets/rubor-iluminador.png';

const normalizeProductName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s/-]+/g, '');

export const getProductImages = (product: Product, fallbackWidth: 200 | 400 = 400): string[] => {
  const normalizedName = normalizeProductName(product.name);

  if (normalizedName.includes('gloss') && normalizedName.includes('magico')) {
    return [glossMagicoDetailImage, glossMagicoVariantsImage];
  }
  if (normalizedName.includes('cole') && normalizedName.includes('satin')) {
    return [coleSatinImage];
  }
  if (normalizedName.includes('base') && normalizedName.includes('corrector')) {
    return [baseCorrectorIndividualImage, baseCorrectorDisplayImage];
  }
  if (
    (normalizedName.includes('rubor') && normalizedName.includes('iluminador')) ||
    (normalizedName.includes('blush') && normalizedName.includes('highlight'))
  ) {
    return [ruborIluminadorImage];
  }
  if (normalizedName.includes('cepillo') && normalizedName.includes('antifrizz')) {
    return [cepilloAntifrizImage];
  }

  return [
    product.imageUrl ||
      `https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=${fallbackWidth}`,
  ];
};
