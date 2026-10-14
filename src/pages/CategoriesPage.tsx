import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit, AlertCircle, CheckCircle2, Tag } from 'lucide-react';
import { categoriesApi, attributesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CategoriesPage: React.FC = () => {
  const { canEdit, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // New Attribute Term State
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [newTermValue, setNewTermValue] = useState('');
  const [newTermLabel, setNewTermLabel] = useState('');
  const [newTermColor, setNewTermColor] = useState('#80634D');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catsRes, attrsRes] = await Promise.all([
        categoriesApi.getAll(),
        attributesApi.getAll(),
      ]);
      setCategories(catsRes.data || []);
      setAttributes(attrsRes.data || []);
      if (!selectedAttrId && attrsRes.data?.length > 0) {
        setSelectedAttrId(attrsRes.data[0].id);
      }
    } catch (err) {
      error('Failed to load categories or attributes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await categoriesApi.create({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      success(`Created category "${newCatName}"`);
      setNewCatName('');
      setNewCatDesc('');
      setIsCreatingCat(false);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (!isAdmin) {
      error('Only administrators can delete categories');
      return;
    }
    const confirm = window.confirm(`Delete category "${cat.name}"?`);
    if (!confirm) return;

    try {
      await categoriesApi.delete(cat.id);
      success(`Deleted category "${cat.name}"`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Cannot delete category with associated products');
    }
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttrId || !newTermValue.trim()) return;

    try {
      await attributesApi.addTerm(selectedAttrId, {
        value: newTermValue.trim().toLowerCase(),
        label: newTermLabel.trim() || newTermValue.trim(),
        color_hex: newTermColor || undefined,
      });
      success(`Added attribute term "${newTermLabel || newTermValue}"`);
      setNewTermValue('');
      setNewTermLabel('');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to add attribute term');
    }
  };

  const activeAttribute = attributes.find((a) => a.id === selectedAttrId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#2A201A]">Categories & Taxonomies</h2>
        <p className="text-xs text-[#6B5B52]">
          Manage product categories and reusable attributes for variable products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Categories List */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DBCE] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-[#2A201A]">Product Categories</h3>
              <p className="text-xs text-[#6B5B52]">{categories.length} active categories</p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsCreatingCat(!isCreatingCat)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            )}
          </div>

          {/* New Category Form Dropdown */}
          {isCreatingCat && canEdit && (
            <form onSubmit={handleCreateCategory} className="p-4 bg-[#F7F3EC] border-b border-[#E5DBCE] space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#49382F] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stoneware Dining"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5DBCE] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49382F] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief category scope"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5DBCE] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(false)}
                  className="px-3 py-1 bg-white border border-[#E5DBCE] rounded text-xs text-[#49382F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#80634D] hover:bg-[#6e533e] text-white rounded text-xs font-medium"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Categories Table */}
          <div className="divide-y divide-[#E5DBCE]">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-[#F7F3EC]/50 transition-colors">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#2A201A]">{cat.name}</span>
                    <span className="text-[10px] font-mono text-[#8F7E73]">/{cat.slug}</span>
                  </div>
                  <p className="text-xs text-[#6B5B52] line-clamp-1 mt-0.5">{cat.description || 'No description provided'}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs px-2 py-0.5 bg-[#F7F3EC] border border-[#E5DBCE] rounded text-[#49382F] font-medium tabular-nums">
                    {cat.product_count} items
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Reusable Attributes & Term Values */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DBCE]">
            <h3 className="font-semibold text-sm text-[#2A201A]">Global Product Attributes</h3>
            <p className="text-xs text-[#6B5B52]">Used for variant combinations (Color, Size, Material)</p>
          </div>

          {/* Attribute Selection Tabs */}
          <div className="p-4 border-b border-[#E5DBCE] bg-[#F7F3EC]/50 flex flex-wrap gap-2">
            {attributes.map((attr) => (
              <button
                key={attr.id}
                onClick={() => setSelectedAttrId(attr.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedAttrId === attr.id
                    ? 'bg-[#49382F] text-white shadow-xs'
                    : 'bg-white border border-[#E5DBCE] text-[#49382F] hover:bg-[#F7F3EC]'
                }`}
              >
                {attr.name} ({attr.terms?.length || 0})
              </button>
            ))}
          </div>

          {/* Active Attribute Terms */}
          {activeAttribute && (
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#49382F] block">
                  Terms for {activeAttribute.name} ({activeAttribute.code})
                </span>
                <span className="text-[11px] text-[#8F7E73]">
                  {activeAttribute.is_variant_enabled ? 'Enabled for variant generation' : 'Static descriptive attribute'}
                </span>
              </div>

              {/* Term Badges */}
              <div className="flex flex-wrap gap-2">
                {activeAttribute.terms?.map((term: any) => (
                  <div
                    key={term.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F3EC] border border-[#E5DBCE] rounded-lg text-xs font-medium text-[#2A201A]"
                  >
                    {term.color_hex && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: term.color_hex }}
                      />
                    )}
                    <span>{term.label}</span>
                    <span className="text-[10px] text-[#8F7E73] font-mono">({term.value})</span>
                  </div>
                ))}
              </div>

              {/* Add New Term Form */}
              {canEdit && (
                <form onSubmit={handleAddTerm} className="pt-4 border-t border-[#E5DBCE] space-y-3">
                  <div className="text-xs font-semibold text-[#49382F]">Add Term to {activeAttribute.name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Display Label (e.g. Navy Blue)"
                      value={newTermLabel}
                      onChange={(e) => {
                        setNewTermLabel(e.target.value);
                        if (!newTermValue) setNewTermValue(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }}
                      className="px-2.5 py-1.5 bg-white border border-[#E5DBCE] rounded text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Slug / Value (e.g. navy-blue)"
                      value={newTermValue}
                      onChange={(e) => setNewTermValue(e.target.value.toLowerCase())}
                      className="px-2.5 py-1.5 bg-white border border-[#E5DBCE] rounded text-xs font-mono"
                    />
                    <div className="flex items-center gap-2">
                      {activeAttribute.type === 'color' && (
                        <input
                          type="color"
                          value={newTermColor}
                          onChange={(e) => setNewTermColor(e.target.value)}
                          className="w-8 h-8 rounded border border-[#E5DBCE] cursor-pointer"
                          title="Choose Color Swatch"
                        />
                      )}
                      <button
                        type="submit"
                        className="flex-1 px-3 py-1.5 bg-[#80634D] hover:bg-[#6e533e] text-white rounded text-xs font-medium transition-colors"
                      >
                        Add Term
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
