"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Bookmark, 
  Folder, 
  FolderHeart, 
  FolderPlus, 
  Plus, 
  Search, 
  Trash2, 
  PlayCircle, 
  Newspaper, 
  FileText, 
  BookOpen, 
  Loader2, 
  FolderSymlink, 
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dropdown } from "@/components/ui/Dropdown";
import { 
  fetchSavedResources, 
  deleteSavedResource, 
  fetchCollections, 
  createCollection, 
  addResourceToCollection, 
  Resource, 
  Collection 
} from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type FilterTab = "all" | "video" | "article" | "book" | "paper";
type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export default function LibraryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters, Search, Sort
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [colSubmitting, setColSubmitting] = useState(false);

  const [movingResource, setMovingResource] = useState<Resource | null>(null);
  const [movingSubmitting, setMovingSubmitting] = useState(false);
  const [selectedColId, setSelectedColId] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [resourcesData, collectionsData] = await Promise.all([
        fetchSavedResources(),
        fetchCollections(),
      ]);
      setResources(resourcesData);
      setCollections(collectionsData);
    } catch (err) {
      console.error("Failed to load saved resources data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    setColSubmitting(true);
    try {
      const newCol = await createCollection(newColName.trim(), newColDesc.trim());
      setCollections((prev) => [newCol, ...prev]);
      setShowCreateModal(false);
      setNewColName("");
      setNewColDesc("");
    } catch (err) {
      console.error("Failed to create collection", err);
    } finally {
      setColSubmitting(false);
    }
  };

  // Add resource to collection (Move)
  const handleMoveResource = async () => {
    if (!movingResource || !selectedColId) return;
    setMovingSubmitting(true);
    try {
      await addResourceToCollection(selectedColId, movingResource._id || "");
      // Reload collections to update counts
      const collectionsData = await fetchCollections();
      setCollections(collectionsData);
      setMovingResource(null);
      setSelectedColId("");
    } catch (err) {
      console.error("Failed to move resource to collection", err);
    } finally {
      setMovingSubmitting(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved resource?")) return;
    try {
      await deleteSavedResource(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
      // Reload collections to reflect deletions inside folders
      const collectionsData = await fetchCollections();
      setCollections(collectionsData);
    } catch (err) {
      console.error("Failed to delete saved resource", err);
    }
  };

  // Helpers for icons and styles
  const getIcon = (type: Resource["type"]) => {
    switch (type) {
      case "video":
        return <PlayCircle className="h-5 w-5" />;
      case "article":
        return <Newspaper className="h-5 w-5" />;
      case "book":
        return <BookOpen className="h-5 w-5" />;
      case "paper":
        return <FileText className="h-5 w-5" />;
    }
  };

  const getIconBg = (type: Resource["type"]) => {
    return "bg-veda-dark text-veda-orange shadow-glow border-0";
  };

  const formatAddedTime = (dateStr?: string) => {
    if (!dateStr) return "Added recently";
    try {
      return `Added ${formatDistanceToNow(new Date(dateStr), { addSuffix: true })}`;
    } catch {
      return "Added recently";
    }
  };

  // Filter and Sort Logic
  const filteredResources = resources
    .filter((r) => {
      // Tab filter
      if (activeTab !== "all" && r.type !== activeTab) return false;
      // Search filter
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(s) ||
          r.publisher.toLowerCase().includes(s) ||
          (r.description && r.description.toLowerCase().includes(s))
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  return (
    <DashboardLayout headerTitle="My Library">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-veda-orange" />
            <h1 className="text-2xl font-bold text-veda-dark sm:text-3xl">
              My Library
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Organize and access your curated academic materials.
          </p>
        </div>

        {/* Search input */}
        <div className="flex items-center bg-white rounded-full border border-gray-200 p-1 shadow-sm w-full md:w-72">
          <Search className="text-gray-400 h-5 w-5 ml-3" />
          <input
            className="border-0 focus:ring-0 bg-transparent w-full text-sm py-1.5 px-2 outline-none text-gray-900 placeholder:text-gray-400"
            placeholder="Search library"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs & Sorting */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {(() => {
            const tabLabels: Record<FilterTab, string> = {
              all: "All resources",
              video: "Videos",
              article: "Articles",
              book: "Books",
              paper: "Papers",
            };
            return (["all", "video", "article", "book", "paper"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border shadow-sm ${
                  activeTab === tab
                    ? "bg-[#181818] text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tabLabels[tab]}
              </button>
            ));
          })()}
        </div>

        {/* Sort Controls */}
        <Dropdown
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: "Sort: Newest" },
            { value: "oldest", label: "Sort: Oldest" },
            { value: "title-asc", label: "Sort: A-Z" },
            { value: "title-desc", label: "Sort: Z-A" },
          ]}
          triggerClassName="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-sm border-gray-200"
          className="self-end sm:self-auto w-36"
        />
      </div>

      {/* Collections Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-veda-dark font-headline">My Collections</h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="text-veda-orange font-semibold text-sm flex items-center gap-1 hover:underline"
          >
            <Plus className="h-4 w-4" />
            Create Collection
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse bg-white rounded-2xl border border-gray-100 shadow-card" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center shadow-card">
            <FolderHeart className="h-10 w-10 mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-600">No collections created yet</p>
            <p className="text-xs text-gray-400 mt-1">Group resources in custom folders to organize mid-terms and lectures.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col, idx) => (
              <Link
                key={col._id}
                href={`/collections/${col._id}`}
                className={`bg-white rounded-2xl p-5 shadow-card border relative group hover:border-gray-300 transition-all duration-200 flex flex-col justify-between h-40 ${
                  idx === 0 
                    ? "border-veda-orange/20 border-2 hover:border-veda-orange/30" 
                    : "border-gray-100"
                }`}
              >
                {/* Active Tag for the first collection for visual variety */}
                {idx === 0 && (
                  <div className="absolute top-4 right-4 bg-orange-50 text-veda-orange font-bold text-[10px] tracking-wider px-2 py-0.5 rounded-md uppercase">
                    Active
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all bg-veda-dark text-veda-orange shadow-glow border-0">
                    {idx === 0 ? (
                      <FolderHeart className="h-6 w-6" />
                    ) : (
                      <Folder className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1 truncate max-w-[150px]">
                      {col.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">
                      {col.description || "Custom Collection"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-500 font-semibold">
                    {col.resources?.length || 0} {col.resources?.length === 1 ? "Item" : "Items"}
                  </span>
                  <span className="text-xs text-veda-orange font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    View
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Saves Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-veda-dark font-headline">Recently Saved</h2>
          {resources.length > 5 && (
            <button
              onClick={() => setActiveTab("all")}
              className="text-gray-500 hover:text-gray-900 font-semibold text-xs flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 border border-gray-100 shadow-card text-center text-gray-500">
            <Bookmark className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm font-semibold">No saved resources found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-veda-orange/20 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(item.type)}`}>
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {item.type}
                      </span>
                      <span className="h-1 w-1 bg-gray-300 rounded-full" />
                      <span className="text-[10px] text-gray-500">
                        {formatAddedTime(item.createdAt)}
                      </span>
                      <span className="h-1 w-1 bg-gray-300 rounded-full" />
                      <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                        {item.publisher}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm text-gray-900 leading-snug hover:text-veda-orange transition-colors truncate block max-w-md sm:max-w-lg lg:max-w-2xl"
                    >
                      {item.title}
                    </a>
                  </div>
                </div>

                {/* Actions (always visible on mobile, hover-only on lg screens) */}
                <div className="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-gray-400 hover:text-veda-orange hover:bg-orange-50/20 transition-colors"
                    aria-label="Open original source"
                    title="Open Source Link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  
                  <button
                    onClick={() => setMovingResource(item)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <FolderSymlink className="h-4 w-4" />
                    Move
                  </button>
                  
                  <button
                    onClick={() => handleDeleteResource(item._id || "")}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                    aria-label="Delete resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CREATE COLLECTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create New Collection</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Mid-term"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 focus:border-veda-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Description / Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 11 • Mechanics"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 focus:border-veda-orange focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={colSubmitting || !newColName.trim()}
                  className="rounded-xl bg-veda-dark px-5 py-2.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
                >
                  {colSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TO COLLECTION (MOVE) MODAL */}
      {movingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setMovingResource(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add to Collection</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  Moving: {movingResource.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovingResource(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {collections.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  No collections available. Create one first!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {collections.map((col) => (
                    <button
                      key={col._id}
                      onClick={() => setSelectedColId(col._id || "")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        selectedColId === col._id 
                          ? "border-veda-orange bg-orange-50/20 text-veda-orange font-semibold" 
                          : "border-gray-100 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Folder className="h-4.5 w-4.5 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm leading-tight truncate">{col.name}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{col.description || "Collection"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setMovingResource(null)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={movingSubmitting || !selectedColId}
                  onClick={handleMoveResource}
                  className="rounded-xl bg-veda-dark px-5 py-2.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
                >
                  {movingSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
