"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Folder, 
  Trash2, 
  PlayCircle, 
  Newspaper, 
  FileText, 
  BookOpen, 
  Loader2, 
  ExternalLink,
  ChevronDown,
  Search,
  ArrowLeft
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchBar } from "@/components/ui/SearchBar";
import { 
  fetchCollectionDetails, 
  deleteCollection, 
  removeResourceFromCollection, 
  deleteSavedResource, 
  Collection, 
  Resource 
} from "@/lib/api";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  const [deletingCol, setDeletingCol] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadCollection = useCallback(async () => {
    try {
      const data = await fetchCollectionDetails(id);
      setCollection(data);
    } catch (err) {
      console.error("Failed to load collection details", err);
      router.push("/library");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      loadCollection();
    }
  }, [id, loadCollection]);

  // Delete Collection
  const handleDeleteCollection = async () => {
    if (!confirm("Are you sure you want to delete this collection? Resources inside will not be deleted globally.")) return;
    setDeletingCol(true);
    try {
      await deleteCollection(id);
      router.push("/library");
    } catch (err) {
      console.error("Failed to delete collection", err);
      setDeletingCol(false);
    }
  };

  // Remove resource from collection
  const handleRemoveFromCollection = async (resourceId: string) => {
    setRemovingId(resourceId);
    try {
      await removeResourceFromCollection(id, resourceId);
      setCollection((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          resources: prev.resources.filter((r) => r._id !== resourceId),
        };
      });
    } catch (err) {
      console.error("Failed to remove resource from collection", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Delete resource globally
  const handleDeleteResourceGlobally = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource globally? It will be removed from all collections.")) return;
    setRemovingId(resourceId);
    try {
      await deleteSavedResource(resourceId);
      setCollection((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          resources: prev.resources.filter((r) => r._id !== resourceId),
        };
      });
    } catch (err) {
      console.error("Failed to delete resource globally", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Icon Helpers
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

  // Filter & Sort Logic
  const resourcesList = collection?.resources || [];
  const filteredAndSorted = resourcesList
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const s = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(s) ||
        r.publisher.toLowerCase().includes(s) ||
        (r.description && r.description.toLowerCase().includes(s))
      );
    })
    .sort((a, b) => {
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
    <DashboardLayout headerTitle={collection?.name || "Collection Details"} backHref="/library" showBack>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-veda-orange" />
        </div>
      ) : !collection ? (
        <div className="text-center text-gray-500 py-12">Collection not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Collection Banner / Details */}
          <div className="rounded-[24px] bg-white p-6 border border-gray-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-veda-dark text-veda-orange shadow-glow flex items-center justify-center flex-shrink-0">
                <Folder className="h-8 w-8 text-veda-orange" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-headline leading-tight">
                  {collection.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {collection.description || "Curated resource folder"}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-gray-400">
                  <span>
                    {collection.resources?.length || 0} {collection.resources?.length === 1 ? "Item" : "Items"} Total
                  </span>
                  <span>•</span>
                  <span>
                    Created on {new Date(collection.createdAt || "").toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeleteCollection}
              disabled={deletingCol}
              className="self-start md:self-auto rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {deletingCol ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Folder
            </button>
          </div>

          {/* Filtering and Search within Collection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search inside folder"
              className="w-full sm:w-72"
            />

            {/* Sort */}
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

          {/* Resources List / Grid */}
          {filteredAndSorted.length === 0 ? (
            <div className="rounded-[24px] bg-white p-12 text-center shadow-card border border-gray-100 text-gray-500">
              <Folder className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-bold text-gray-900">No items found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery.trim() 
                  ? "No results matching your query inside this folder." 
                  : "This folder is empty. Browse Saved Resources or search in Resource Discovery to add items here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-24">
              {filteredAndSorted.map((item) => (
                <div
                  key={item._id}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 p-4 shadow-card hover:shadow-md transition-all relative"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 truncate max-w-[120px]">
                      {item.publisher}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold text-gray-900 leading-snug group-hover:text-veda-orange transition-colors min-h-[40px]">
                    {item.title}
                  </h3>
                  
                  <p className="mt-2 line-clamp-2 text-xs text-gray-500 leading-relaxed flex-1">
                    {item.description || "Curated academic reference material."}
                  </p>

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-2 border-t border-gray-50 pt-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Link
                    </a>

                    <button
                      type="button"
                      disabled={removingId === item._id}
                      onClick={() => handleRemoveFromCollection(item._id || "")}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-red-50 hover:text-red-500 hover:border-transparent transition-colors"
                      title="Remove from Folder"
                    >
                      Remove
                    </button>

                    <button
                      type="button"
                      disabled={removingId === item._id}
                      onClick={() => handleDeleteResourceGlobally(item._id || "")}
                      className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Globally"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
