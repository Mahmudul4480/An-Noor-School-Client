import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentActorLabel } from './actor';
import { isDemoLoginEnabled, waitForAuthUser } from './auth';
import { omitUndefined, toIsoString } from './utils';
import { createIncomeEntry } from './income';
import type { AssetCategory, AssetCondition, AssetLocationLog, AssetStatus, AssetValueLog, SchoolAsset } from '../types';

const CATEGORIES_COLLECTION = 'assetCategories';
const ASSETS_COLLECTION = 'schoolAssets';
const LOCATION_LOGS_COLLECTION = 'assetLocationLogs';
const VALUE_LOGS_COLLECTION = 'assetValueLogs';
const LOCAL_CATEGORIES_KEY = 'an-noor-asset-categories';
const LOCAL_ASSETS_KEY = 'an-noor-school-assets';
const LOCAL_LOCATION_LOGS_KEY = 'an-noor-asset-location-logs';
const LOCAL_VALUE_LOGS_KEY = 'an-noor-asset-value-logs';

export const ANIS_LABEL = 'ANIS';
export const ASSET_SALE_INCOME_CATEGORY = 'Asset Sale';

export const DEFAULT_ASSET_CATEGORIES: Pick<AssetCategory, 'name' | 'prefix'>[] = [
  { name: 'ANIS IT & Electronics', prefix: 'IT' },
  { name: 'ANIS Furniture', prefix: 'FURN' },
  { name: 'ANIS Laboratory Equipment', prefix: 'LAB' },
  { name: 'ANIS Library & Books', prefix: 'LIB' },
  { name: 'ANIS Sports Equipment', prefix: 'SPT' },
  { name: 'ANIS Audio Visual', prefix: 'AV' },
  { name: 'ANIS Electrical Appliances', prefix: 'ELEC' },
  { name: 'ANIS Vehicles', prefix: 'VEH' },
  { name: 'ANIS Building & Property', prefix: 'PROP' },
  { name: 'ANIS Office Equipment', prefix: 'OFF' },
  { name: 'ANIS Security Equipment', prefix: 'SEC' },
  { name: 'ANIS Kitchen & Canteen', prefix: 'KIT' },
  { name: 'ANIS Playground Equipment', prefix: 'PLY' },
  { name: 'ANIS Musical Instruments', prefix: 'MUS' },
  { name: 'ANIS Classroom Materials', prefix: 'CLS' },
  { name: 'ANIS Medical & First Aid', prefix: 'MED' },
  { name: 'ANIS Cleaning Equipment', prefix: 'CLN' },
  { name: 'ANIS Others', prefix: 'OTH' },
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

export function suggestCategoryPrefix(name: string): string {
  const words = name
    .replace(/^ANIS\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
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

export function ensureAnisName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (/^ANIS\b/i.test(trimmed)) {
    return trimmed.replace(/^anis\b/i, ANIS_LABEL);
  }
  return `${ANIS_LABEL} ${trimmed}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function bookValue(asset: SchoolAsset): number {
  if (asset.status === 'sold' || asset.status === 'destroyed') return 0;
  return Number(asset.currentValue ?? asset.purchaseValue) || 0;
}

export function isAssetActive(asset: SchoolAsset): boolean {
  return (asset.status ?? 'active') === 'active';
}

function yearsBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  return (to.getTime() - from.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function depreciationAnchorDate(asset: SchoolAsset): string {
  return asset.lastDepreciatedAt || asset.purchaseDate || asset.createdAt;
}

export function canApplyDepreciation(asset: SchoolAsset): boolean {
  if (!isAssetActive(asset)) return false;
  if (!asset.depreciationRate || asset.depreciationRate <= 0) return false;
  if (bookValue(asset) <= 0) return false;
  return yearsBetween(depreciationAnchorDate(asset)) >= 1;
}

export function nextDepreciationAmount(asset: SchoolAsset): number {
  const rate = Number(asset.depreciationRate) || 0;
  return roundMoney(bookValue(asset) * (rate / 100));
}

function normalizeCategory(data: AssetCategory): AssetCategory {
  return {
    ...data,
    nextNumber: typeof data.nextNumber === 'number' ? data.nextNumber : 1,
  };
}

function normalizeAsset(data: SchoolAsset): SchoolAsset {
  const purchaseValue = Number(data.purchaseValue) || 0;
  return {
    ...data,
    purchaseValue,
    currentValue: Number(data.currentValue ?? purchaseValue) || 0,
    depreciationRate: Number(data.depreciationRate) || 0,
    status: data.status ?? 'active',
    lastDepreciatedAt: data.lastDepreciatedAt ? toIsoString(data.lastDepreciatedAt) : undefined,
    removedAt: data.removedAt ? toIsoString(data.removedAt) : undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt, toIsoString(data.createdAt)),
  };
}

async function seedDefaultCategoriesIfEmpty(): Promise<AssetCategory[]> {
  const now = new Date().toISOString();
  const seeded = DEFAULT_ASSET_CATEGORIES.map((item) => ({
    id: generateId('acat'),
    name: ensureAnisName(item.name),
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
  let categories: AssetCategory[];

  if (isDemoLoginEnabled) {
    const local = readLocal<AssetCategory[]>(LOCAL_CATEGORIES_KEY, []);
    if (local.length === 0) {
      return seedDefaultCategoriesIfEmpty();
    }
    categories = local.map(normalizeCategory);
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, CATEGORIES_COLLECTION)));
    categories = snapshot.docs.map((document) => normalizeCategory(document.data() as AssetCategory));
    if (categories.length === 0) {
      return seedDefaultCategoriesIfEmpty();
    }
  }

  const renamed = categories.map((category) => {
    const name = ensureAnisName(category.name);
    return name === category.name ? category : { ...category, name };
  });
  const changed = renamed.filter((category, index) => category.name !== categories[index].name);

  if (changed.length > 0) {
    if (isDemoLoginEnabled) {
      writeLocal(LOCAL_CATEGORIES_KEY, renamed);
    } else {
      await Promise.all(
        changed.map((category) =>
          updateDoc(doc(db, CATEGORIES_COLLECTION, category.id), { name: category.name }),
        ),
      );
    }
  }

  return renamed.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addAssetCategory(input: {
  name: string;
  prefix?: string;
}): Promise<AssetCategory> {
  const name = ensureAnisName(input.name);
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

  return assets.sort((a, b) => toIsoString(b.createdAt).localeCompare(toIsoString(a.createdAt)));
}

export interface CreateAssetInput {
  categoryId: string;
  assetNumber: string;
  name: string;
  description?: string;
  purchaseValue: number;
  purchaseDate?: string;
  location?: string;
  usefulLifeYears?: number;
  condition: AssetCondition;
  serialNumber?: string;
  depreciationRate?: number;
}

export async function createAsset(input: CreateAssetInput): Promise<SchoolAsset> {
  const name = input.name.trim();
  const assetNumber = input.assetNumber.trim();
  if (!name) throw new Error('Asset name লিখুন।');
  if (!assetNumber) throw new Error('Asset number লিখুন।');
  if (!input.categoryId) throw new Error('Category is required.');
  if (!input.purchaseValue || input.purchaseValue <= 0) {
    throw new Error('Valid purchase value is required.');
  }

  const categories = await fetchAssetCategories();
  const category = categories.find((item) => item.id === input.categoryId);
  if (!category) throw new Error('Category not found.');

  const existing = await fetchAssets();
  if (existing.some((asset) => asset.assetNumber.trim().toLowerCase() === assetNumber.toLowerCase())) {
    throw new Error(`Asset number "${assetNumber}" আগেই ব্যবহার হয়েছে।`);
  }

  const now = new Date().toISOString();
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
    currentValue: input.purchaseValue,
    depreciationRate: Number(input.depreciationRate) || 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  if (isDemoLoginEnabled) {
    const local = readLocal<SchoolAsset[]>(LOCAL_ASSETS_KEY, []);
    writeLocal(LOCAL_ASSETS_KEY, [...local, asset]);
    if (asset.location) {
      await persistLocationLog(buildLocationLog(asset, '—', asset.location, now.slice(0, 10), 'Registered'));
    }
    return asset;
  }

  await waitForAuthUser();
  const assetRef = doc(collection(db, ASSETS_COLLECTION));
  const created: SchoolAsset = { ...asset, id: assetRef.id };
  await setDoc(assetRef, omitUndefined({ ...created, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));

  if (created.location) {
    await persistLocationLog(buildLocationLog(created, '—', created.location, now.slice(0, 10), 'Registered'));
  }

  return created;
}

export function computeAssetStats(assets: SchoolAsset[], categories: AssetCategory[]) {
  const active = assets.filter(isAssetActive);
  const totalValue = active.reduce((sum, asset) => sum + bookValue(asset), 0);
  const byCategory = categories.map((category) => ({
    category,
    count: active.filter((asset) => asset.categoryId === category.id).length,
    value: active
      .filter((asset) => asset.categoryId === category.id)
      .reduce((sum, asset) => sum + bookValue(asset), 0),
  }));

  return { totalValue, byCategory };
}

function buildLocationLog(
  asset: SchoolAsset,
  fromLocation: string,
  toLocation: string,
  date: string,
  reason?: string,
  recordedBy?: string,
): AssetLocationLog {
  return {
    id: generateId('aloc'),
    assetId: asset.id,
    assetNumber: asset.assetNumber,
    assetName: asset.name,
    fromLocation: fromLocation.trim() || '—',
    toLocation: toLocation.trim(),
    date: date.slice(0, 10),
    reason: reason?.trim() || undefined,
    recordedBy: recordedBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  };
}

function normalizeLocationLog(data: AssetLocationLog, documentId?: string): AssetLocationLog {
  return {
    ...data,
    id: data.id || documentId || generateId('aloc'),
    fromLocation: data.fromLocation || '—',
    toLocation: data.toLocation || '',
    date: toIsoString(data.date, new Date().toISOString()).slice(0, 10),
    createdAt: toIsoString(data.createdAt),
  };
}

async function persistLocationLog(log: AssetLocationLog): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<AssetLocationLog[]>(LOCAL_LOCATION_LOGS_KEY, []);
    writeLocal(LOCAL_LOCATION_LOGS_KEY, [...existing, log]);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, LOCATION_LOGS_COLLECTION, log.id), omitUndefined({ ...log, createdAt: serverTimestamp() }));
}

async function persistAsset(asset: SchoolAsset): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<SchoolAsset[]>(LOCAL_ASSETS_KEY, []);
    const index = existing.findIndex((item) => item.id === asset.id);
    if (index >= 0) existing[index] = asset;
    else existing.push(asset);
    writeLocal(LOCAL_ASSETS_KEY, existing);
    return;
  }

  await waitForAuthUser();
  await setDoc(
    doc(db, ASSETS_COLLECTION, asset.id),
    omitUndefined({ ...asset, updatedAt: serverTimestamp() }),
    { merge: true },
  );
}

export async function fetchAssetLocationLogs(assetId?: string): Promise<AssetLocationLog[]> {
  let logs: AssetLocationLog[];

  if (isDemoLoginEnabled) {
    logs = readLocal<AssetLocationLog[]>(LOCAL_LOCATION_LOGS_KEY, []).map((item) => normalizeLocationLog(item));
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, LOCATION_LOGS_COLLECTION)));
    logs = snapshot.docs.map((document) => normalizeLocationLog(document.data() as AssetLocationLog, document.id));
  }

  return logs
    .filter((log) => !assetId || log.assetId === assetId)
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      return byDate !== 0 ? byDate : toIsoString(b.createdAt).localeCompare(toIsoString(a.createdAt));
    });
}

export async function changeAssetLocation(input: {
  asset: SchoolAsset;
  toLocation: string;
  date?: string;
  reason?: string;
  recordedBy?: string;
}): Promise<{ asset: SchoolAsset; log: AssetLocationLog }> {
  const toLocation = input.toLocation.trim();
  if (!toLocation) throw new Error('নতুন location লিখুন।');

  const fromLocation = input.asset.location?.trim() || '—';
  if (fromLocation.toLowerCase() === toLocation.toLowerCase()) {
    throw new Error('নতুন location আগের location-এর থেকে আলাদা হতে হবে।');
  }

  const now = new Date().toISOString();
  const updated: SchoolAsset = {
    ...input.asset,
    location: toLocation,
    updatedAt: now,
  };
  const log = buildLocationLog(
    updated,
    fromLocation,
    toLocation,
    input.date || now.slice(0, 10),
    input.reason,
    input.recordedBy,
  );

  await persistAsset(updated);
  await persistLocationLog(log);
  return { asset: updated, log };
}

function buildValueLog(input: {
  asset: SchoolAsset;
  type: AssetValueLog['type'];
  previousValue: number;
  newValue: number;
  percent: number;
  date: string;
  note?: string;
  recordedBy?: string;
}): AssetValueLog {
  return {
    id: generateId('aval'),
    assetId: input.asset.id,
    assetNumber: input.asset.assetNumber,
    assetName: input.asset.name,
    type: input.type,
    previousValue: input.previousValue,
    newValue: input.newValue,
    percent: input.percent,
    date: input.date.slice(0, 10),
    note: input.note?.trim() || undefined,
    recordedBy: input.recordedBy ?? getCurrentActorLabel('Accounts Department'),
    createdAt: new Date().toISOString(),
  };
}

function normalizeValueLog(data: AssetValueLog, documentId?: string): AssetValueLog {
  return {
    ...data,
    id: data.id || documentId || generateId('aval'),
    previousValue: Number(data.previousValue) || 0,
    newValue: Number(data.newValue) || 0,
    percent: Number(data.percent) || 0,
    date: toIsoString(data.date, new Date().toISOString()).slice(0, 10),
    createdAt: toIsoString(data.createdAt),
  };
}

async function persistValueLog(log: AssetValueLog): Promise<void> {
  if (isDemoLoginEnabled) {
    const existing = readLocal<AssetValueLog[]>(LOCAL_VALUE_LOGS_KEY, []);
    writeLocal(LOCAL_VALUE_LOGS_KEY, [...existing, log]);
    return;
  }

  await waitForAuthUser();
  await setDoc(doc(db, VALUE_LOGS_COLLECTION, log.id), omitUndefined({ ...log, createdAt: serverTimestamp() }));
}

export async function fetchAssetValueLogs(assetId?: string): Promise<AssetValueLog[]> {
  let logs: AssetValueLog[];

  if (isDemoLoginEnabled) {
    logs = readLocal<AssetValueLog[]>(LOCAL_VALUE_LOGS_KEY, []).map((item) => normalizeValueLog(item));
  } else {
    await waitForAuthUser();
    const snapshot = await getDocs(query(collection(db, VALUE_LOGS_COLLECTION)));
    logs = snapshot.docs.map((document) => normalizeValueLog(document.data() as AssetValueLog, document.id));
  }

  return logs
    .filter((log) => !assetId || log.assetId === assetId)
    .sort((a, b) => toIsoString(b.createdAt).localeCompare(toIsoString(a.createdAt)));
}

function assertActive(asset: SchoolAsset) {
  if (!isAssetActive(asset)) {
    throw new Error('Sold / destroyed asset-এ এই কাজ করা যাবে না।');
  }
}

/** Revalue current book value by a percent (10 = +10%, -10 = -10%). */
export async function revalueAsset(input: {
  asset: SchoolAsset;
  percent: number;
  date?: string;
  note?: string;
  recordedBy?: string;
}): Promise<{ asset: SchoolAsset; log: AssetValueLog }> {
  assertActive(input.asset);
  if (Number.isNaN(input.percent)) throw new Error('Revaluation percent দিন।');

  const previous = bookValue(input.asset);
  const next = roundMoney(previous * (1 + input.percent / 100));
  if (next < 0) throw new Error('Revaluation-এর পর value negative হতে পারে না।');

  const now = new Date().toISOString();
  const updated: SchoolAsset = {
    ...input.asset,
    currentValue: next,
    updatedAt: now,
  };
  const log = buildValueLog({
    asset: updated,
    type: 'revaluation',
    previousValue: previous,
    newValue: next,
    percent: input.percent,
    date: input.date || now.slice(0, 10),
    note: input.note,
    recordedBy: input.recordedBy,
  });

  await persistAsset(updated);
  await persistValueLog(log);
  return { asset: updated, log };
}

/** Manual yearly entry: registered depreciation % is applied automatically after 1 year. */
export async function applyAnnualDepreciation(input: {
  asset: SchoolAsset;
  date?: string;
  note?: string;
  recordedBy?: string;
}): Promise<{ asset: SchoolAsset; log: AssetValueLog }> {
  assertActive(input.asset);
  if (!canApplyDepreciation(input.asset)) {
    throw new Error('Depreciation ১ বছর পর apply করা যায়। Rate register-এ সেট থাকতে হবে।');
  }

  const previous = bookValue(input.asset);
  const percent = Number(input.asset.depreciationRate) || 0;
  const next = Math.max(0, roundMoney(previous * (1 - percent / 100)));
  const now = new Date().toISOString();
  const updated: SchoolAsset = {
    ...input.asset,
    currentValue: next,
    lastDepreciatedAt: now,
    updatedAt: now,
  };
  const log = buildValueLog({
    asset: updated,
    type: 'depreciation',
    previousValue: previous,
    newValue: next,
    percent,
    date: input.date || now.slice(0, 10),
    note: input.note || `Annual depreciation ${percent}%`,
    recordedBy: input.recordedBy,
  });

  await persistAsset(updated);
  await persistValueLog(log);
  return { asset: updated, log };
}

export async function removeAsset(input: {
  asset: SchoolAsset;
  mode: Exclude<AssetStatus, 'active'>;
  date?: string;
  note?: string;
  saleAmount?: number;
  accountId?: string;
  recordedBy?: string;
}): Promise<{ asset: SchoolAsset; log: AssetValueLog }> {
  assertActive(input.asset);
  const previous = bookValue(input.asset);
  const now = new Date().toISOString();
  const date = input.date || now.slice(0, 10);

  if (input.mode === 'sold') {
    const saleAmount = Number(input.saleAmount) || 0;
    if (saleAmount <= 0) throw new Error('Sale amount দিন।');
    if (!input.accountId) throw new Error('Sale amount কোন account-এ যাবে select করুন।');

    const income = await createIncomeEntry({
      date,
      category: ASSET_SALE_INCOME_CATEGORY,
      source: 'Asset Sale',
      description: `Sold ${input.asset.name} (${input.asset.assetNumber})`,
      amount: saleAmount,
      accountId: input.accountId,
      note: input.note,
      createdBy: input.recordedBy ?? getCurrentActorLabel('Accounts Department'),
    });

    const updated: SchoolAsset = {
      ...input.asset,
      currentValue: 0,
      status: 'sold',
      condition: 'disposed',
      saleAmount,
      saleIncomeId: income.id,
      removedAt: now,
      removalNote: input.note?.trim() || undefined,
      updatedAt: now,
    };
    const log = buildValueLog({
      asset: updated,
      type: 'sale',
      previousValue: previous,
      newValue: 0,
      percent: previous > 0 ? roundMoney((saleAmount / previous) * 100) : 0,
      date,
      note: `Sold for ৳ ${saleAmount.toLocaleString('en-BD')} • Income ${income.receiptNumber}`,
      recordedBy: input.recordedBy,
    });
    await persistAsset(updated);
    await persistValueLog(log);
    return { asset: updated, log };
  }

  const updated: SchoolAsset = {
    ...input.asset,
    currentValue: 0,
    status: 'destroyed',
    condition: 'disposed',
    removedAt: now,
    removalNote: input.note?.trim() || undefined,
    updatedAt: now,
  };
  const log = buildValueLog({
    asset: updated,
    type: 'destroy',
    previousValue: previous,
    newValue: 0,
    percent: 100,
    date,
    note: input.note || 'Destroyed / written off',
    recordedBy: input.recordedBy,
  });
  await persistAsset(updated);
  await persistValueLog(log);
  return { asset: updated, log };
}
