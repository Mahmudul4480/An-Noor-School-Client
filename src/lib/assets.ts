import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import type { AssetCategory, AssetCondition, SchoolAsset } from '../types';

const CATEGORIES_COLLECTION = 'assetCategories';
const ASSETS_COLLECTION = 'schoolAssets';
const LOCAL_CATEGORIES_KEY = 'an-noor-asset-categories';
const LOCAL_ASSETS_KEY = 'an-noor-school-assets';

export const DEFAULT_ASSET_CATEGORIES: Pick<AssetCategory, 'name' | 'prefix'>[] = [
  { name: 'IT & Electronics', prefix: 'IT' },
  { name: 'Furniture', prefix: 'FURN' },
  { name: 'Laboratory Equipment', prefix: 'LAB' },
  { name: 'Library & Books', prefix: 'LIB' },
  { name: 'Sports Equipment', prefix: 'SPT' },
  { name: 'Audio Visual', prefix: 'AV' },
  { name: 'Electrical Appliances', prefix: 'ELEC' },
  { name: 'Vehicles', prefix: 'VEH' },
  { name: 'Building & Property', prefix: 'PROP' },
  { name: 'Office Equipment', prefix: 'OFF' },
  { name: 'Security Equipment', prefix: 'SEC' },
  { name: 'Kitchen & Canteen', prefix: 'KIT' },
  { name: 'Playground Equipment', prefix: 'PLY' },
  { name: 'Musical Instruments', prefix: 'MUS' },
  { name: 'Classroom Materials', prefix: 'CLS' },
  { name: 'Medical & First Aid', prefix: 'MED' },
  { name: 'Cleaning Equipment', prefix: 'CLN' },
  { name: 'Others', prefix: 'OTH' },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatAssetNumber(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, '0')}`;
}

export function suggestCategoryPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 4)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  }
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return cleaned.slice(0, 4) || 'AST';
}

function normalizeCategory(data: AssetCategory): AssetCategory {
  return {
    ...data,
    nextNumber: typeof data.nextNumber === 'number' ? data.nextNumber : 1,
  };
}

function normalizeAsset(data: SchoolAsset): SchoolAsset {
  return {
    ...data,
    purchaseValue: Number(data.purchaseValue) || 0,
  };
}

async function seedDefaultCategoriesIfEmpty(): Promise<AssetCategory[]> {
  const now = new Date().toISOString();
  const seeded = DEFAULT_ASSET_CATEGORIES.map((item) => ({
    id: generateId('acat'),
    name: item.name,
    prefix: item.prefix,
    nextNumber: 1,
    createdAt: now,
  }));

  if (isDemoLoginEnabled) {
    writeLocal(LOCAL_CATEGORIES_KEY, seeded);
    return seeded;
  }

  await waitForAuthUser();
  await Promise.all(
    seeded.map((category) =>
      setDoc(doc(db, CATEGORIES_COLLECTION, category.id), {
        ...category,
        createdAt: serverTimestamp(),
      }),
    ),
  );
  return seeded;
}

export async function fetchAssetCategories(): Promise<AssetCategory[]> {
  if (isDemoLoginEnabled) {
    const local = readLocal<AssetCategory[]>(LOCAL_CATEGORIES_KEY, []);
    if (local.length === 0) {
      return seedDefaultCategoriesIfEmpty();
    }
    return local.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name));
  }

  await waitForAuthUser();
  const snapshot = await getDocs(query(collection(db, CATEGORIES_COLLECTION)));
  const categories = snapshot.docs.map((document) => normalizeCategory(document.data() as AssetCategory));

  if (categories.length === 0) {
    return seedDefaultCategoriesIfEmpty();
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addAssetCategory(input: {
  name: string;
  prefix?: string;
}): Promise<AssetCategory> {
  const name = input.name.trim();
  if (!name) throw new Error('Category name is required.');

  const categories = await fetchAssetCategories();
  if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('This category already exists.');
  }

  const prefix = (input.prefix?.trim().toUpperCase() || suggestCategoryPrefix(name)).slice(0, 6);
  if (!prefix) throw new Error('Category prefix is required.');

  if (categories.some((cat) => cat.prefix.toUpperCase() === prefix)) {
    throw new Error(`Prefix "${prefix}" is already used by another category.`);
  }

  const category: AssetCategory = {
    id: generateId('acat'),
    name,
    prefix,
    nextNumber: 1,
    createdAt: new Date().toISOString(),
  };

  if (isDemoLoginEnabled) {
    writeLocal(LOCAL_CATEGORIES_KEY, [...categories, category]);
    return category;
  }

  await waitForAuthUser();
  await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), {
    ...category,
    createdAt: serverTimestamp(),
  });
  return category;
}

export async function fetchAssets(categoryId?: string): Promise<SchoolAsset[]> {
  let assets: SchoolAsset[];

  if (isDemoLoginEnabled) {
    assets = readLocal<SchoolAsset[]>(LOCAL_ASSETS_KEY, []).map(normalizeAsset);
  } else {
    await waitForAuthUser();
    const baseQuery = categoryId
      ? query(collection(db, ASSETS_COLLECTION), where('categoryId', '==', categoryId))
      : query(collection(db, ASSETS_COLLECTION));
    const snapshot = await getDocs(baseQuery);
    assets = snapshot.docs.map((document) => normalizeAsset(document.data() as SchoolAsset));
  }

  if (categoryId && isDemoLoginEnabled) {
    assets = assets.filter((asset) => asset.categoryId === categoryId);
  }

  return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function previewNextAssetNumber(categoryId: string): Promise<string> {
  const categories = await fetchAssetCategories();
  const category = categories.find((item) => item.id === categoryId);
  if (!category) throw new Error('Category not found.');
  return formatAssetNumber(category.prefix, category.nextNumber);
}

export interface CreateAssetInput {
  categoryId: string;
  name: string;
  description?: string;
  purchaseValue: number;
  purchaseDate?: string;
  location?: string;
  usefulLifeYears?: number;
  condition: AssetCondition;
  serialNumber?: string;
}

export async function createAsset(input: CreateAssetInput): Promise<SchoolAsset> {
  const name = input.name.trim();
  if (!name) throw new Error('Asset name is required.');
  if (!input.categoryId) throw new Error('Category is required.');
  if (!input.purchaseValue || input.purchaseValue <= 0) {
    throw new Error('Valid purchase value is required.');
  }

  const now = new Date().toISOString();

  if (isDemoLoginEnabled) {
    const categories = await fetchAssetCategories();
    const categoryIndex = categories.findIndex((item) => item.id === input.categoryId);
    if (categoryIndex < 0) throw new Error('Category not found.');

    const category = categories[categoryIndex];
    const assetNumber = formatAssetNumber(category.prefix, category.nextNumber);
    const asset: SchoolAsset = {
      id: generateId('asset'),
      assetNumber,
      categoryId: category.id,
      categoryName: category.name,
      name,
      description: input.description?.trim() || undefined,
      purchaseValue: input.purchaseValue,
      purchaseDate: input.purchaseDate,
      location: input.location?.trim() || undefined,
      usefulLifeYears: input.usefulLifeYears,
      condition: input.condition,
      serialNumber: input.serialNumber?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updatedCategories = [...categories];
    updatedCategories[categoryIndex] = { ...category, nextNumber: category.nextNumber + 1 };
    writeLocal(LOCAL_CATEGORIES_KEY, updatedCategories);

    const existing = readLocal<SchoolAsset[]>(LOCAL_ASSETS_KEY, []);
    writeLocal(LOCAL_ASSETS_KEY, [...existing, asset]);
    return asset;
  }

  await waitForAuthUser();
  const categoryRef = doc(db, CATEGORIES_COLLECTION, input.categoryId);
  const assetRef = doc(collection(db, ASSETS_COLLECTION));

  const asset = await runTransaction(db, async (transaction) => {
    const categorySnap = await transaction.get(categoryRef);
    if (!categorySnap.exists()) throw new Error('Category not found.');

    const category = normalizeCategory(categorySnap.data() as AssetCategory);
    const assetNumber = formatAssetNumber(category.prefix, category.nextNumber);

    const created: SchoolAsset = {
      id: assetRef.id,
      assetNumber,
      categoryId: category.id,
      categoryName: category.name,
      name,
      description: input.description?.trim() || undefined,
      purchaseValue: input.purchaseValue,
      purchaseDate: input.purchaseDate,
      location: input.location?.trim() || undefined,
      usefulLifeYears: input.usefulLifeYears,
      condition: input.condition,
      serialNumber: input.serialNumber?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(assetRef, { ...created, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.update(categoryRef, { nextNumber: category.nextNumber + 1 });
    return created;
  });

  return asset;
}

export function computeAssetStats(assets: SchoolAsset[], categories: AssetCategory[]) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const byCategory = categories.map((category) => ({
    category,
    count: assets.filter((asset) => asset.categoryId === category.id).length,
    value: assets
      .filter((asset) => asset.categoryId === category.id)
      .reduce((sum, asset) => sum + asset.purchaseValue, 0),
  }));

  return { totalValue, byCategory };
}
