"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Search as SearchIcon, 
  Compass, 
  PlayCircle, 
  Newspaper, 
  FileText, 
  Bookmark, 
  BookmarkCheck, 
  Loader2,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchBar } from "@/components/ui/SearchBar";
import { 
  fetchResources, 
  saveResource, 
  fetchSavedResources, 
  deleteSavedResource, 
  Resource 
} from "@/lib/api";

const CATEGORY_OPTIONS = [
  "Computer Science",
  "Mathematics",
  "Biology",
  "Physics",
];

const CLASS_OPTIONS = [
  "All Classes",
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
  "Undergraduate",
  "Postgraduate",
];

export default function ResourceDiscoveryPage() {
  const [query, setQuery] = useState("Binary Trees");
  const [category, setCategory] = useState("Computer Science");
  const [className, setClassName] = useState("All Classes");
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedUrls, setSavedUrls] = useState<Map<string, string>>(new Map()); // url -> savedId
  const [loading, setLoading] = useState(false);
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved bookmarks map
  const loadBookmarks = useCallback(async () => {
    try {
      const saved = await fetchSavedResources();
      const urlMap = new Map<string, string>();
      saved.forEach((item) => {
        if (item.url) {
          urlMap.set(item.url, item._id || "");
        }
      });
      setSavedUrls(urlMap);
    } catch (err) {
      console.error("Failed to load saved bookmarks", err);
    }
  }, []);

  // Search resources
  const handleSearch = useCallback(async (searchQuery = query, searchCategory = category, searchClass = className) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResources(searchQuery, searchCategory, searchClass);
      setResources(res.resources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, className]);

  // Initial load
  useEffect(() => {
    loadBookmarks();
    handleSearch("Binary Trees", "Computer Science", "All Classes");
  }, [loadBookmarks]);



  // Toggle bookmark (Save / Delete)
  const handleToggleBookmark = async (resource: Resource) => {
    setSavingUrl(resource.url);
    try {
      const savedId = savedUrls.get(resource.url);
      if (savedId) {
        // Unsave
        await deleteSavedResource(savedId);
        setSavedUrls((prev) => {
          const next = new Map(prev);
          next.delete(resource.url);
          return next;
        });
      } else {
        // Save
        const savedItem = await saveResource({
          title: resource.title,
          description: resource.description,
          url: resource.url,
          thumbnail: resource.thumbnail || "",
          publisher: resource.publisher,
          type: resource.type,
        });
        setSavedUrls((prev) => {
          const next = new Map(prev);
          next.set(resource.url, savedItem._id || "");
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    } finally {
      setSavingUrl(null);
    }
  };

  // Group resources by type
  const videos = resources.filter((r) => r.type === "video");
  const articles = resources.filter((r) => r.type === "article");
  const papers = resources.filter((r) => r.type === "paper");
  const books = resources.filter((r) => r.type === "book");

  return (
    <DashboardLayout headerTitle="Resource Discovery">
      {/* Styles for hiding scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-veda-orange" />
          <h1 className="text-2xl font-bold text-veda-dark sm:text-3xl">
            Resource Discovery
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Search educational materials and references to enrich your classroom lectures and tests.
        </p>
      </div>

      {/* Hero Search Box */}
      <section className="relative mb-10 rounded-[24px] bg-white p-8 border border-gray-100 shadow-card text-center md:p-12">
        {/* Glow wrapper with overflow-hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-veda-orange/5 blur-3xl" />
        </div>
        
        <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-[32px] font-headline">
          What are you teaching today?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500">
          Search across our curated academic database for lectures, textbooks, guides, and papers to enhance your assessments.
        </p>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row"
        >
          {/* Query Input */}
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="e.g. 'Binary Trees', 'Cellular Respiration'"
            className="flex-1"
            inputClassName="rounded-2xl py-3.5 pl-12 text-sm"
          />

          {/* Category Dropdown */}
          <Dropdown
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS.map((opt) => ({
              value: opt,
              label: opt,
            }))}
            triggerClassName="py-3.5 border-gray-200 pl-4"
            className="sm:w-52 text-left"
          />

          {/* Class Dropdown */}
          <Dropdown
            value={className}
            onChange={setClassName}
            options={CLASS_OPTIONS.map((opt) => ({
              value: opt,
              label: opt,
            }))}
            triggerClassName="py-3.5 border-gray-200 pl-4"
            className="sm:w-44 text-left"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-veda-dark px-8 py-3.5 font-semibold text-white shadow-md hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Search
          </button>
        </form>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div className="space-y-10">
          {[1, 2].map((sectionIndex) => (
            <div key={sectionIndex} className="animate-pulse">
              <div className="h-6 w-48 rounded bg-gray-200 mb-6" />
              <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                {[1, 2, 3].map((cardIndex) => (
                  <div key={cardIndex} className="h-80 w-[320px] shrink-0 rounded-2xl bg-white p-4 border border-gray-100 flex flex-col gap-4">
                    <div className="h-36 w-full rounded-xl bg-gray-100" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-5 w-full rounded bg-gray-200" />
                    <div className="h-4 w-3/4 rounded bg-gray-200 mt-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-[24px] bg-white p-12 text-center shadow-card border border-gray-100">
          <Compass className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-900">No resources found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try searching for other academic topics or using a different category/class.
          </p>
        </div>
      ) : (
        <div className="space-y-12 pb-16">
          
          {/* VIDEO LECTURES */}
          {videos.length > 0 && (
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <PlayCircle className="h-5 w-5 text-veda-orange" />
                    Video Lectures
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Curated educational video courses and demonstrations.</p>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                {videos.map((item, index) => (
                  <div
                    key={index}
                    className="group flex w-[320px] shrink-0 snap-start flex-col rounded-[20px] border border-gray-100 bg-white p-2 shadow-card hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Card Media Area */}
                    <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-gray-50">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                          <PlayCircle className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/10 transition-colors">
                        <PlayCircle className="h-12 w-12 text-white drop-shadow opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {item.publisher}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-[15px] font-bold text-gray-900 leading-snug hover:text-veda-orange transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 leading-relaxed flex-1">
                        {item.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-veda-dark py-2.5 text-center text-xs font-semibold text-white hover:bg-black transition-colors"
                        >
                          Preview
                        </a>
                        <button
                          type="button"
                          disabled={savingUrl === item.url}
                          onClick={() => handleToggleBookmark(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-veda-orange hover:text-veda-orange transition-colors"
                          aria-label="Bookmark"
                        >
                          {savedUrls.has(item.url) ? (
                            <BookmarkCheck className="h-5 w-5 text-veda-orange" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ARTICLES */}
          {articles.length > 0 && (
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Newspaper className="h-5 w-5 text-veda-orange" />
                    Technical Articles & Guides
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Written tutorials, documentation, and conceptual explanations.</p>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                {articles.map((item, index) => (
                  <div
                    key={index}
                    className="group flex w-[320px] shrink-0 snap-start flex-col rounded-[20px] border border-gray-100 bg-white p-2 shadow-card hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Media Area */}
                    <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-gray-50 flex items-center justify-center border-b border-gray-50">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-orange-50 to-orange-100/50 text-veda-orange/20">
                          <Newspaper className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {item.publisher}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-[15px] font-bold text-gray-900 leading-snug hover:text-veda-orange transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 leading-relaxed flex-1">
                        {item.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-veda-dark py-2.5 text-center text-xs font-semibold text-white hover:bg-black transition-colors"
                        >
                          Read Article
                        </a>
                        <button
                          type="button"
                          disabled={savingUrl === item.url}
                          onClick={() => handleToggleBookmark(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-veda-orange hover:text-veda-orange transition-colors"
                          aria-label="Bookmark"
                        >
                          {savedUrls.has(item.url) ? (
                            <BookmarkCheck className="h-5 w-5 text-veda-orange" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RESEARCH PAPERS */}
          {papers.length > 0 && (
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <FileText className="h-5 w-5 text-veda-orange" />
                    Research Papers
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Peer-reviewed publications, abstracts, and science journals.</p>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                {papers.map((item, index) => (
                  <div
                    key={index}
                    className="group flex w-[320px] shrink-0 snap-start flex-col rounded-[20px] border border-gray-100 bg-white p-2 shadow-card hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Media Area */}
                    <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-gray-50 flex items-center justify-center border-b border-gray-50">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-emerald-50 to-emerald-100/40 text-emerald-600/20">
                          <FileText className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {item.publisher}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-[15px] font-bold text-gray-900 leading-snug hover:text-veda-orange transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 leading-relaxed flex-1">
                        {item.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-veda-dark py-2.5 text-center text-xs font-semibold text-white hover:bg-black transition-colors"
                        >
                          View PDF
                        </a>
                        <button
                          type="button"
                          disabled={savingUrl === item.url}
                          onClick={() => handleToggleBookmark(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-veda-orange hover:text-veda-orange transition-colors"
                          aria-label="Bookmark"
                        >
                          {savedUrls.has(item.url) ? (
                            <BookmarkCheck className="h-5 w-5 text-veda-orange" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TEXTBOOKS */}
          {books.length > 0 && (
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <BookOpen className="h-5 w-5 text-veda-orange" />
                    Textbooks & References
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Reference books, syllabus textbooks, and study materials.</p>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                {books.map((item, index) => (
                  <div
                    key={index}
                    className="group flex w-[320px] shrink-0 snap-start flex-col rounded-[20px] border border-gray-100 bg-white p-2 shadow-card hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Media Area */}
                    <div className="relative h-44 w-full overflow-hidden rounded-[14px] bg-gray-50 flex items-center justify-center border-b border-gray-50">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-50 to-blue-100/40 text-blue-600/20">
                          <BookOpen className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {item.publisher}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-[15px] font-bold text-gray-900 leading-snug hover:text-veda-orange transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 leading-relaxed flex-1">
                        {item.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl bg-veda-dark py-2.5 text-center text-xs font-semibold text-white hover:bg-black transition-colors"
                        >
                          View Textbook
                        </a>
                        <button
                          type="button"
                          disabled={savingUrl === item.url}
                          onClick={() => handleToggleBookmark(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-veda-orange hover:text-veda-orange transition-colors"
                          aria-label="Bookmark"
                        >
                          {savedUrls.has(item.url) ? (
                            <BookmarkCheck className="h-5 w-5 text-veda-orange" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
