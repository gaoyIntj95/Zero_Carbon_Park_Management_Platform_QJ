import { createAnnualStore } from './annualData';
import type {
  ProductAllocationMode,
  ProductMaster,
  ProductWriteInput,
} from '../types/product';

const seedProducts: ProductMaster[] = [
  {
    productId: 'product-a',
    productName: '产品A',
    productCategory: '通用工业产品',
    unit: 't',
    linkedEnergyUnitIds: ['eu-clinker-line-1'],
    allocationMode: 'ratio',
    energyAllocations: [{ energyUnitId: 'eu-clinker-line-1', share: 60 }],
    directEnergyRecordIds: [],
    status: 'active',
  },
  {
    productId: 'product-b',
    productName: '产品B',
    productCategory: '通用工业产品',
    unit: 't',
    linkedEnergyUnitIds: ['eu-clinker-line-1', 'eu-cement-grinding-line'],
    allocationMode: 'ratio',
    energyAllocations: [
      { energyUnitId: 'eu-clinker-line-1', share: 40 },
      { energyUnitId: 'eu-cement-grinding-line', share: 100 },
    ],
    directEnergyRecordIds: [],
    status: 'active',
  },
  {
    productId: 'product-c',
    productName: '产品C',
    productCategory: '通用工业产品',
    unit: '件',
    linkedEnergyUnitIds: [],
    allocationMode: 'exclusive',
    energyAllocations: [],
    directEnergyRecordIds: [],
    status: 'active',
  },
];

const annualProducts = createAnnualStore(seedProducts);
let productSequence = 100;

function cloneProduct(product: ProductMaster): ProductMaster {
  return {
    ...product,
    linkedEnergyUnitIds: [...product.linkedEnergyUnitIds],
    energyAllocations: product.energyAllocations.map((allocation) => ({ ...allocation })),
    directEnergyRecordIds: [...product.directEnergyRecordIds],
  };
}

export function listProducts(year = 2026) {
  const products = annualProducts.get(year);
  return products.map(cloneProduct);
}

export function getProduct(productId: string, year = 2026) {
  const products = annualProducts.get(year);
  const product = products.find((item) => item.productId === productId);
  return product ? cloneProduct(product) : null;
}

export function saveProduct(input: ProductWriteInput, productId?: string, year = 2026) {
  const products = annualProducts.get(year);
  const duplicate = products.some((item) =>
    item.productId !== productId && item.productName.trim() === input.productName.trim());
  if (duplicate) return { ok: false as const, error: '产品名称不能重复。' };
  if (!input.productName.trim() || !input.unit.trim()) {
    return { ok: false as const, error: '请填写产品名称和计量单位。' };
  }
  if (productId) {
    const index = products.findIndex((item) => item.productId === productId);
    if (index < 0) return { ok: false as const, error: '产品不存在。' };
    products[index] = cloneProduct({ ...input, productId });
    return { ok: true as const, productId };
  }
  productSequence += 1;
  const nextProductId = `product-${productSequence}`;
  products.push(cloneProduct({ ...input, productId: nextProductId }));
  return { ok: true as const, productId: nextProductId };
}

export function linkProductEnergyUnit(productId: string, energyUnitId: string, year = 2026) {
  const products = annualProducts.get(year);
  const product = products.find((item) => item.productId === productId);
  if (!product) return { ok: false as const, error: '产品不存在。' };
  if (!product.linkedEnergyUnitIds.includes(energyUnitId)) {
    product.linkedEnergyUnitIds.push(energyUnitId);
    const shared = products.some((item) =>
      item.productId !== productId
      && item.status === 'active'
      && item.linkedEnergyUnitIds.includes(energyUnitId));
    if (shared) product.allocationMode = 'ratio';
    else {
      product.allocationMode = 'exclusive';
      product.energyAllocations = product.energyAllocations.filter((item) => item.energyUnitId !== energyUnitId);
    }
  }
  return { ok: true as const };
}

export function updateProductAllocation(
  productId: string,
  allocationMode: ProductAllocationMode,
  energyAllocations: ProductMaster['energyAllocations'],
  directEnergyRecordIds: string[] = [],
  year = 2026,
) {
  const products = annualProducts.get(year);
  const product = products.find((item) => item.productId === productId);
  if (!product) return { ok: false as const, error: '产品不存在。' };
  product.allocationMode = allocationMode;
  product.energyAllocations = energyAllocations.map((item) => ({ ...item }));
  product.directEnergyRecordIds = [...directEnergyRecordIds];
  return { ok: true as const };
}

export function resolveProductEnergyAllocation(productId: string, energyUnitId: string, year = 2026) {
  const products = annualProducts.get(year);
  const product = products.find((item) => item.productId === productId && item.status === 'active');
  if (!product || !product.linkedEnergyUnitIds.includes(energyUnitId)) {
    return { ok: false as const, reason: '产品未关联该生产单元。', share: 0 };
  }
  const linkedProducts = products.filter((item) =>
    item.status === 'active' && item.linkedEnergyUnitIds.includes(energyUnitId));
  if (product.allocationMode === 'metered') {
    return product.directEnergyRecordIds.length
      ? { ok: true as const, reason: '', share: 1 }
      : { ok: false as const, reason: '独立计量模式尚未关联产品级能源记录。', share: 0 };
  }
  if (linkedProducts.length === 1 && product.allocationMode === 'exclusive') {
    return { ok: true as const, reason: '', share: 1 };
  }
  if (linkedProducts.some((item) => item.allocationMode !== 'ratio')) {
    return { ok: false as const, reason: '共线生产尚未统一配置能源分摊方式。', share: 0 };
  }
  const allocations = linkedProducts.map((item) =>
    item.energyAllocations.find((allocation) => allocation.energyUnitId === energyUnitId)?.share);
  if (allocations.some((share) => share === undefined || share <= 0)) {
    return { ok: false as const, reason: '共线生产尚未配置完整的产品能源分摊比例。', share: 0 };
  }
  const total = allocations.reduce<number>((sum, share) => sum + (share ?? 0), 0);
  if (Math.abs(total - 100) > 0.001) {
    return { ok: false as const, reason: `当前生产单元的产品能源分摊比例合计为${total}%，必须等于100%。`, share: 0 };
  }
  const share = product.energyAllocations.find((item) => item.energyUnitId === energyUnitId)?.share ?? 0;
  return { ok: true as const, reason: '', share: share / 100 };
}

export function resetProductMasterStore() {
  annualProducts.reset();
  productSequence = 100;
}


