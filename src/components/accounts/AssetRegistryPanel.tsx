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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  addAssetCategory,
  computeAssetStats,
  createAsset,
  fetchAssetCategories,
  fetchAssets,
  previewNextAssetNumber,
  suggestCategoryPrefix,
} from '../../lib/assets';
import type { AssetCategory, AssetCondition, SchoolAsset } from '../../types';

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
  const [nextNumberPreview, setNextNumberPreview] = React.useState('');

  const [form, setForm] = React.useState({
    categoryId: '',
    name: '',
    description: '',
    purchaseValue: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    location: '',
    usefulLifeYears: '',
    condition: 'good' as AssetCondition,
    serialNumber: '',
  });

  const [categoryForm, setCategoryForm] = React.useState({
    name: '',
    prefix: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, assetData] = await Promise.all([fetchAssetCategories(), fetchAssets()]);
      setCategories(categoryData);
      setAssets(assetData);
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

  React.useEffect(() => {
    if (!form.categoryId) {
      setNextNumberPreview('');
      return;
    }
    previewNextAssetNumber(form.categoryId)
      .then(setNextNumberPreview)
      .catch(() => setNextNumberPreview(''));
  }, [form.categoryId, categories, assets]);

  const stats = computeAssetStats(assets, categories);

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = filterCategoryId === 'all' || asset.categoryId === filterCategoryId;
    const queryText = search.trim().toLowerCase();
    const matchesSearch =
      !queryText ||
      asset.name.toLowerCase().includes(queryText) ||
      asset.assetNumber.toLowerCase().includes(queryText) ||
      asset.categoryName.toLowerCase().includes(queryText) ||
      (asset.location?.toLowerCase().includes(queryText) ?? false);
    return matchesCategory && matchesSearch;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const purchaseValue = parseFloat(form.purchaseValue);
    const usefulLifeYears = form.usefulLifeYears ? parseInt(form.usefulLifeYears, 10) : undefined;

    if (!form.categoryId || !form.name.trim() || !purchaseValue || purchaseValue <= 0) {
      setError('Category, asset name, এবং valid purchase value দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await createAsset({
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || undefined,
        purchaseValue,
        purchaseDate: form.purchaseDate || undefined,
        location: form.location || undefined,
        usefulLifeYears,
        condition: form.condition,
        serialNumber: form.serialNumber || undefined,
      });
      setForm((prev) => ({
        ...prev,
        name: '',
        description: '',
        purchaseValue: '',
        location: '',
        usefulLifeYears: '',
        serialNumber: '',
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 border border-school-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-school-blue uppercase tracking-tight">Asset & Property Registry</h3>
            <p className="text-[10px] text-school-muted font-bold uppercase tracking-widest mt-1">
              Category-wise auto numbering • {categories.length} categories • {assets.length} assets
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
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Asset Value</p>
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
                  <p className="text-[9px] font-bold text-school-gold mt-1">{category.prefix}-###</p>
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
                    <th className="pb-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-school-muted font-medium">
                        কোনো asset নেই। "Register Asset" দিয়ে নতুন asset যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 font-black text-school-gold tracking-tight">{asset.assetNumber}</td>
                        <td className="py-5 font-black text-school-blue uppercase">{asset.name}</td>
                        <td className="py-5 text-slate-500 font-medium">{asset.categoryName}</td>
                        <td className="py-5 text-slate-500">{asset.location || '—'}</td>
                        <td className="py-5">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black uppercase tracking-wider text-school-blue">
                            {asset.condition}
                          </span>
                        </td>
                        <td className="py-5 text-right font-black text-school-blue">
                          ৳ {asset.purchaseValue.toLocaleString('en-BD')}
                        </td>
                      </tr>
                    ))
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
                      {category.name} ({category.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] font-black text-school-muted uppercase tracking-widest">Auto Asset Number</p>
                <p className="text-lg font-black text-school-gold mt-1">{nextNumberPreview || '—'}</p>
                <p className="text-[10px] text-amber-800 mt-1">Save করলে এই number automatically assign হবে।</p>
              </div>

              <Field label="Asset Name *" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
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
                Asset number হবে: <span className="font-black text-school-gold">{categoryForm.prefix || 'XXX'}-001</span>
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
