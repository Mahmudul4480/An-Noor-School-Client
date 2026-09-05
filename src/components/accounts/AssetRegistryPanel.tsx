import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Loader2,
  Building2,
  Monitor,
  Tag,
  X,
  Search,
  FolderPlus,
  MapPin,
  ArrowRight,
  Percent,
  TrendingDown,
  Trash2,
} from 'lucide-react';
import { cn, formatSignedBdt } from '../../lib/utils';
import {
  addAssetCategory,
  applyAnnualDepreciation,
  bookValue,
  canApplyDepreciation,
  changeAssetLocation,
  computeAssetStats,
  createAsset,
  fetchAssetCategories,
  fetchAssetLocationLogs,
  fetchAssetValueLogs,
  fetchAssets,
  isAssetActive,
  nextDepreciationAmount,
  removeAsset,
  revalueAsset,
  suggestCategoryPrefix,
} from '../../lib/assets';
import { fetchAccounts, ONLINE_PAYMENT_ACCOUNT_ID } from '../../lib/ledger';
import type { AssetCategory, AssetCondition, AssetLocationLog, AssetStatus, AssetValueLog, LedgerAccount, SchoolAsset } from '../../types';

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'disposed', label: 'Disposed' },
];

const CATEGORY_ICONS = [
  Monitor,
  Tag,
  Building2,
  FolderPlus,
];

function categoryIcon(index: number) {
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
  return <Icon size={18} />;
}

export function AssetRegistryPanel() {
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);
  const [assets, setAssets] = React.useState<SchoolAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filterCategoryId, setFilterCategoryId] = React.useState<string>('all');
  const [showRegister, setShowRegister] = React.useState(false);
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [movingAsset, setMovingAsset] = React.useState<SchoolAsset | null>(null);
  const [revalueAssetRow, setRevalueAssetRow] = React.useState<SchoolAsset | null>(null);
  const [depreciateAsset, setDepreciateAsset] = React.useState<SchoolAsset | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<SchoolAsset | null>(null);
  const [locationLogs, setLocationLogs] = React.useState<AssetLocationLog[]>([]);
  const [valueLogs, setValueLogs] = React.useState<AssetValueLog[]>([]);
  const [accounts, setAccounts] = React.useState<LedgerAccount[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'active' | AssetStatus | 'all'>('active');
  const [moveForm, setMoveForm] = React.useState({ toLocation: '', date: new Date().toISOString().slice(0, 10), reason: '' });
  const [revalueForm, setRevalueForm] = React.useState({ percent: '', note: '' });
  const [removeForm, setRemoveForm] = React.useState({
    mode: 'sold' as 'sold' | 'destroyed',
    saleAmount: '',
    accountId: '',
    note: '',
  });

  const [form, setForm] = React.useState({
    categoryId: '',
    assetNumber: '',
    name: '',
    description: '',
    purchaseValue: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    location: '',
    usefulLifeYears: '',
    condition: 'good' as AssetCondition,
    serialNumber: '',
    depreciationRate: '10',
  });

  const [categoryForm, setCategoryForm] = React.useState({
    name: '',
    prefix: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, assetData, logData, valueData, accountData] = await Promise.all([
        fetchAssetCategories(),
        fetchAssets(),
        fetchAssetLocationLogs(),
        fetchAssetValueLogs(),
        fetchAccounts(),
      ]);
      setCategories(categoryData);
      setAssets(assetData);
      setLocationLogs(logData);
      setValueLogs(valueData);
      setAccounts(accountData);
      setForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || categoryData[0]?.id || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const stats = computeAssetStats(assets, categories);

  const filteredAssets = assets.filter((asset) => {
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? isAssetActive(asset) : asset.status === statusFilter);
    const matchesCategory = filterCategoryId === 'all' || asset.categoryId === filterCategoryId;
    const queryText = search.trim().toLowerCase();
    const matchesSearch =
      !queryText ||
      asset.name.toLowerCase().includes(queryText) ||
      asset.assetNumber.toLowerCase().includes(queryText) ||
      asset.categoryName.toLowerCase().includes(queryText) ||
      (asset.location?.toLowerCase().includes(queryText) ?? false);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const purchaseValue = parseFloat(form.purchaseValue);
    const usefulLifeYears = form.usefulLifeYears ? parseInt(form.usefulLifeYears, 10) : undefined;

    if (!form.categoryId || !form.name.trim() || !form.assetNumber.trim() || !purchaseValue || purchaseValue <= 0) {
      setError('Category, asset name, asset number, এবং valid purchase value দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await createAsset({
        categoryId: form.categoryId,
        assetNumber: form.assetNumber,
        name: form.name,
        description: form.description || undefined,
        purchaseValue,
        purchaseDate: form.purchaseDate || undefined,
        location: form.location || undefined,
        usefulLifeYears,
        condition: form.condition,
        serialNumber: form.serialNumber || undefined,
        depreciationRate: parseFloat(form.depreciationRate) || 0,
      });
      setForm((prev) => ({
        ...prev,
        name: '',
        assetNumber: '',
        description: '',
        purchaseValue: '',
        location: '',
        usefulLifeYears: '',
        serialNumber: '',
        depreciationRate: '10',
      }));
      setShowRegister(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Asset registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryForm.name.trim()) {
      setError('Category name দিন।');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addAssetCategory({
        name: categoryForm.name,
        prefix: categoryForm.prefix || undefined,
      });
      setCategoryForm({ name: '', prefix: '' });
      setShowAddCategory(false);
      await load();
      setForm((prev) => ({ ...prev, categoryId: created.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Category add failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openMove = (asset: SchoolAsset) => {
    setError('');
    setMovingAsset(asset);
    setMoveForm({
      toLocation: '',
      date: new Date().toISOString().slice(0, 10),
      reason: '',
    });
  };

  const handleChangeLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingAsset) return;
    setError('');
    setSubmitting(true);
    try {
      await changeAssetLocation({
        asset: movingAsset,
        toLocation: moveForm.toLocation,
        date: moveForm.date,
        reason: moveForm.reason || undefined,
      });
      setMovingAsset(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location change failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const assetLogs = (assetId: string) => locationLogs.filter((log) => log.assetId === assetId);
  const assetValueHistory = (assetId: string) => valueLogs.filter((log) => log.assetId === assetId);
  const collectionAccounts = accounts.filter((account) => account.id !== ONLINE_PAYMENT_ACCOUNT_ID);

  const handleRevalue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revalueAssetRow) return;
    setError('');
    setSubmitting(true);
    try {
      await revalueAsset({
        asset: revalueAssetRow,
        percent: parseFloat(revalueForm.percent),
        note: revalueForm.note || undefined,
      });
      setRevalueAssetRow(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revaluation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepreciate = async () => {
    if (!depreciateAsset) return;
    setError('');
    setSubmitting(true);
    try {
      await applyAnnualDepreciation({ asset: depreciateAsset });
      setDepreciateAsset(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Depreciation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTarget) return;
    setError('');
    setSubmitting(true);
    try {
      await removeAsset({
        asset: removeTarget,
        mode: removeForm.mode,
        saleAmount: removeForm.mode === 'sold' ? parseFloat(removeForm.saleAmount) : undefined,
        accountId: removeForm.mode === 'sold' ? removeForm.accountId : undefined,
        note: removeForm.note || undefined,
      });
      setRemoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Asset & Property Registry</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              ANIS categories • Manual name/number • Depreciation • Revalue • {categories.length} categories • {assets.length} assets
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-100 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2"
            >
              <FolderPlus size={14} /> Add Category
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="px-6 py-2.5 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Plus size={14} /> Register Asset
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-[2rem] border border-emerald-100 bg-emerald-50">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Current Book Value</p>
            <p className="text-2xl font-black text-emerald-800">৳ {stats.totalValue.toLocaleString('en-BD')}</p>
          </div>
          <div className="p-6 rounded-[2rem] border border-blue-100 bg-blue-50">
            <p className="text-[10px] font-black text-school-blue uppercase tracking-widest mb-1">Registered Assets</p>
            <p className="text-2xl font-black text-school-blue">{assets.length}</p>
          </div>
          <div className="p-6 rounded-[2rem] border border-amber-100 bg-amber-50 md:col-span-2">
            <p className="text-[10px] font-black text-school-gold uppercase tracking-widest mb-1">Categories</p>
            <p className="text-sm font-bold text-school-blue">
              {categories.map((cat) => cat.name).join(' • ')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-school-blue mb-3" />
            <p className="text-xs font-black text-school-muted uppercase tracking-widest">Loading asset registry...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {stats.byCategory.map(({ category, count, value }, idx) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFilterCategoryId(filterCategoryId === category.id ? 'all' : category.id)}
                  className={cn(
                    'p-4 rounded-[1.5rem] border text-left transition-all hover:shadow-md',
                    filterCategoryId === category.id
                      ? 'border-school-gold bg-amber-50 shadow-md'
                      : 'border-slate-100 bg-white',
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-slate-50 text-school-blue rounded-lg">{categoryIcon(idx)}</div>
                    <span className="text-xs font-black text-school-blue">{count}</span>
                  </div>
                  <p className="text-[9px] font-black text-school-muted uppercase tracking-widest leading-tight">
                    {category.name}
                  </p>
                  <p className="text-[10px] font-black text-school-blue mt-1">৳ {value.toLocaleString('en-BD')}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-school-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, tag, category, location..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="destroyed">Destroyed</option>
                <option value="all">All</option>
              </select>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-school-muted font-black border-b border-school-border uppercase tracking-widest">
                    <th className="pb-4">Asset No</th>
                    <th className="pb-4">Asset Name</th>
                    <th className="pb-4">Category</th>
                    <th className="pb-4">Location</th>
                    <th className="pb-4">Condition</th>
                    <th className="pb-4 text-right">Purchase</th>
                    <th className="pb-4 text-right">Book Value</th>
                    <th className="pb-4 text-right">Dep %</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-school-muted font-medium">
                        কোনো asset নেই। "Register Asset" দিয়ে নতুন asset যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const active = isAssetActive(asset);
                      const due = canApplyDepreciation(asset);
                      return (
                      <tr key={asset.id} className={cn('hover:bg-slate-50 transition-colors', !active && 'opacity-60')}>
                        <td className="py-5 font-black text-school-gold tracking-tight">{asset.assetNumber}</td>
                        <td className="py-5 font-black text-school-blue uppercase">{asset.name}</td>
                        <td className="py-5 text-slate-500 font-medium">{asset.categoryName}</td>
                        <td className="py-5 text-slate-500">
                          {asset.location || '—'}
                          {assetLogs(asset.id).length > 0 && (
                            <span className="block text-[9px] font-bold text-school-muted uppercase tracking-widest mt-0.5">
                              {assetLogs(asset.id).length} location {assetLogs(asset.id).length === 1 ? 'entry' : 'entries'}
                            </span>
                          )}
                        </td>
                        <td className="py-5">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black uppercase tracking-wider text-school-blue">
                            {asset.status && asset.status !== 'active' ? asset.status : asset.condition}
                          </span>
                        </td>
                        <td className="py-5 text-right font-bold text-slate-500">
                          ৳ {asset.purchaseValue.toLocaleString('en-BD')}
                        </td>
                        <td className="py-5 text-right font-black text-school-blue">
                          {formatSignedBdt(bookValue(asset))}
                        </td>
                        <td className="py-5 text-right font-bold text-school-gold">
                          {asset.depreciationRate ? `${asset.depreciationRate}%` : '—'}
                          {due && <span className="block text-[9px] uppercase text-red-500">Due</span>}
                        </td>
                        <td className="py-5">
                          {active ? (
                            <div className="flex justify-end flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => openMove(asset)}
                                className="p-2 rounded-lg bg-amber-50 text-school-gold"
                                title="Change Location"
                              >
                                <MapPin size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setError('');
                                  setRevalueForm({ percent: '', note: '' });
                                  setRevalueAssetRow(asset);
                                }}
                                className="p-2 rounded-lg bg-blue-50 text-school-blue"
                                title="Revalue"
                              >
                                <Percent size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setError('');
                                  setDepreciateAsset(asset);
                                }}
                                className="p-2 rounded-lg bg-slate-50 text-slate-600"
                                title="Depreciate"
                              >
                                <TrendingDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setError('');
                                  setRemoveForm({
                                    mode: 'sold',
                                    saleAmount: '',
                                    accountId: collectionAccounts.find((account) => account.id === 'main-cash')?.id ?? collectionAccounts[0]?.id ?? '',
                                    note: '',
                                  });
                                  setRemoveTarget(asset);
                                }}
                                className="p-2 rounded-lg bg-red-50 text-red-500"
                                title="Remove — Sell / Destroy"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black uppercase text-school-muted">Closed</span>
                          )}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showRegister && (
          <ModalShell title="Register New Asset" onClose={() => setShowRegister(false)}>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Asset Name *"
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                  placeholder="e.g. Ceiling Fan"
                />
                <Field
                  label="Asset Number *"
                  value={form.assetNumber}
                  onChange={(value) => setForm({ ...form, assetNumber: value })}
                  placeholder="e.g. FAN-04 / 2026-015"
                />
              </div>
              <p className="text-[10px] font-bold text-school-muted -mt-2">
                Name ও number দুটোই নিজে লিখুন — auto generate হবে না। Number আগে থেকে থাকলে entry হবে না।
              </p>
              <Field
                label="Description"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Purchase Value (৳) *"
                  type="number"
                  value={form.purchaseValue}
                  onChange={(value) => setForm({ ...form, purchaseValue: value })}
                />
                <Field
                  label="Purchase Date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(value) => setForm({ ...form, purchaseDate: value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Location"
                  value={form.location}
                  onChange={(value) => setForm({ ...form, location: value })}
                  placeholder="e.g. Class 4 Room"
                />
                <Field
                  label="Useful Life (Years)"
                  type="number"
                  value={form.usefulLifeYears}
                  onChange={(value) => setForm({ ...form, usefulLifeYears: value })}
                />
              </div>
              <Field
                label="Annual Depreciation Rate (%) *"
                type="number"
                value={form.depreciationRate}
                onChange={(value) => setForm({ ...form, depreciationRate: value })}
                placeholder="e.g. 10"
              />
              <p className="text-[10px] font-bold text-school-muted -mt-2">
                ১ বছর পর Depreciate চাপলে এই percent অনুযায়ী book value auto কমে যাবে।
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value as AssetCondition })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
                  >
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Serial Number"
                  value={form.serialNumber}
                  onChange={(value) => setForm({ ...form, serialNumber: value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="px-5 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Register Asset
                </button>
              </div>
            </form>
          </ModalShell>
        )}

        {showAddCategory && (
          <ModalShell title="Add New Category" onClose={() => setShowAddCategory(false)}>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <Field
                label="Category Name *"
                value={categoryForm.name}
                onChange={(value) =>
                  setCategoryForm({
                    name: value,
                    prefix: categoryForm.prefix || suggestCategoryPrefix(value),
                  })
                }
                placeholder="e.g. Science Equipment"
              />
              <Field
                label="Prefix Code *"
                value={categoryForm.prefix}
                onChange={(value) => setCategoryForm({ ...categoryForm, prefix: value.toUpperCase().slice(0, 6) })}
                placeholder="e.g. SCI"
              />
              <p className="text-[10px] text-school-muted font-medium">
                নামের আগে ANIS নিজে থেকে যোগ হবে। Prefix শুধু category চিহ্নিত করার জন্য।
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-5 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
                  Add Category
                </button>
              </div>
            </form>
          </ModalShell>
        )}

        {movingAsset && (
          <ModalShell title="Change Asset Location" onClose={() => setMovingAsset(null)}>
            <form onSubmit={handleChangeLocation} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{movingAsset.assetNumber}</p>
                <p className="text-sm font-black text-school-blue uppercase mt-1">{movingAsset.name}</p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-school-muted uppercase tracking-widest">Current</p>
                  <p className="text-xs font-black text-school-blue truncate">{movingAsset.location || '—'}</p>
                </div>
                <ArrowRight size={16} className="text-school-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-school-muted uppercase tracking-widest">New</p>
                  <p className="text-xs font-black text-school-gold truncate">{moveForm.toLocation || '...'}</p>
                </div>
              </div>

              <Field
                label="New Location *"
                value={moveForm.toLocation}
                onChange={(value) => setMoveForm({ ...moveForm, toLocation: value })}
                placeholder="e.g. Principal Office / Class 2"
              />
              <Field
                label="Move Date"
                type="date"
                value={moveForm.date}
                onChange={(value) => setMoveForm({ ...moveForm, date: value })}
              />
              <Field
                label="Reason / Note"
                value={moveForm.reason}
                onChange={(value) => setMoveForm({ ...moveForm, reason: value })}
                placeholder="e.g. Room renovation / assigned to teacher"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">
                  {error}
                </div>
              )}

              {assetLogs(movingAsset.id).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Location History</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {assetLogs(movingAsset.id).map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                        <p className="font-black text-school-blue">
                          {log.fromLocation} <ArrowRight size={11} className="inline -mt-0.5" /> {log.toLocation}
                        </p>
                        <p className="text-[10px] font-bold text-school-muted mt-0.5">
                          {log.date}
                          {log.reason ? ` • ${log.reason}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMovingAsset(null)}
                  className="px-5 py-3 bg-slate-50 text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-school-gold text-school-blue rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                  Save Location Entry
                </button>
              </div>
            </form>
          </ModalShell>
        )}

        {revalueAssetRow && (
          <ModalShell title="Asset Revaluation" onClose={() => setRevalueAssetRow(null)}>
            <form onSubmit={handleRevalue} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">{revalueAssetRow.assetNumber}</p>
                <p className="text-sm font-black text-school-blue uppercase mt-1">{revalueAssetRow.name}</p>
                <p className="text-xs font-bold text-school-muted mt-2">
                  Current book value {formatSignedBdt(bookValue(revalueAssetRow))}
                </p>
              </div>
              <Field
                label="Revaluation Percent"
                type="number"
                value={revalueForm.percent}
                onChange={(value) => setRevalueForm({ ...revalueForm, percent: value })}
                placeholder="10 = +10%, -10 = -10%"
              />
              {revalueForm.percent !== '' && !Number.isNaN(parseFloat(revalueForm.percent)) && (
                <p className="text-[11px] font-black text-school-blue">
                  New value:{' '}
                  {formatSignedBdt(Math.round(bookValue(revalueAssetRow) * (1 + parseFloat(revalueForm.percent) / 100) * 100) / 100)}
                </p>
              )}
              <Field
                label="Note"
                value={revalueForm.note}
                onChange={(value) => setRevalueForm({ ...revalueForm, note: value })}
                placeholder="e.g. Market revaluation"
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>
              )}
              {assetValueHistory(revalueAssetRow.id).length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {assetValueHistory(revalueAssetRow.id).map((log) => (
                    <p key={log.id} className="text-[10px] font-bold text-school-muted">
                      {log.date} • {log.type} • {log.percent}% • {formatSignedBdt(log.previousValue)} → {formatSignedBdt(log.newValue)}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRevalueAssetRow(null)} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Percent size={14} />}
                  Apply Revaluation
                </button>
              </div>
            </form>
          </ModalShell>
        )}

        {depreciateAsset && (
          <ModalShell title="Annual Depreciation" onClose={() => setDepreciateAsset(null)}>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-black text-school-blue uppercase">{depreciateAsset.name}</p>
                <p className="text-[11px] font-bold text-school-muted mt-2">
                  Rate {depreciateAsset.depreciationRate || 0}% • Current {formatSignedBdt(bookValue(depreciateAsset))}
                </p>
                <p className="text-[11px] font-black text-school-gold mt-2">
                  After apply: {formatSignedBdt(Math.max(0, bookValue(depreciateAsset) - nextDepreciationAmount(depreciateAsset)))}
                  {' '}(− {formatSignedBdt(nextDepreciationAmount(depreciateAsset))})
                </p>
                {!canApplyDepreciation(depreciateAsset) && (
                  <p className="text-[11px] font-bold text-red-500 mt-3">
                    ১ বছর পূর্ণ হলে এবং register-এ depreciation rate থাকলে auto percent কমে যাবে। এখনো due হয়নি।
                  </p>
                )}
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setDepreciateAsset(null)} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDepreciate}
                  disabled={submitting || !canApplyDepreciation(depreciateAsset)}
                  className="px-6 py-3 bg-school-blue text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <TrendingDown size={14} />}
                  Apply {depreciateAsset.depreciationRate || 0}%
                </button>
              </div>
            </div>
          </ModalShell>
        )}

        {removeTarget && (
          <ModalShell title="Remove Asset" onClose={() => setRemoveTarget(null)}>
            <form onSubmit={handleRemove} className="space-y-4">
              <p className="text-sm font-black text-school-blue uppercase">{removeTarget.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['sold', 'destroyed'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRemoveForm({ ...removeForm, mode })}
                    className={cn(
                      'py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border',
                      removeForm.mode === mode
                        ? 'bg-school-blue text-white border-school-blue'
                        : 'bg-slate-50 text-school-muted border-slate-100',
                    )}
                  >
                    {mode === 'sold' ? 'Sell' : 'Destroy'}
                  </button>
                ))}
              </div>
              {removeForm.mode === 'sold' && (
                <>
                  <Field
                    label="Sale Amount ৳ *"
                    type="number"
                    value={removeForm.saleAmount}
                    onChange={(value) => setRemoveForm({ ...removeForm, saleAmount: value })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">Received In Account *</label>
                    <select
                      value={removeForm.accountId}
                      onChange={(e) => setRemoveForm({ ...removeForm, accountId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                    >
                      {collectionAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] font-bold text-school-muted">
                    Sale amount Income tab-এ "Asset Sale" হিসেবে যাবে (Principal approval-এর পর ledger-এ credit)।
                  </p>
                </>
              )}
              <Field
                label={removeForm.mode === 'sold' ? 'Buyer / Note' : 'Destroy reason'}
                value={removeForm.note}
                onChange={(value) => setRemoveForm({ ...removeForm, note: value })}
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-600">{error}</div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRemoveTarget(null)} className="px-5 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Confirm {removeForm.mode === 'sold' ? 'Sale' : 'Destroy'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-[2rem] border border-school-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-school-border flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-school-muted">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-school-muted uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-school-gold/20"
      />
    </div>
  );
}
