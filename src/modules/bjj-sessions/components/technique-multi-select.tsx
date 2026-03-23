"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Search, Plus } from "lucide-react";
import { requestJson } from "@/modules/core/api/http-client";

interface BjjTechniqueRead {
  id: string;
  name: string;
  category: string;
  position: string | null;
  gi_mode: string;
  active: boolean;
}

interface TechniqueMultiSelectProps {
  value: string; // The raw string value from the form (comma separated)
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TechniqueMultiSelect({ value, onChange, placeholder }: TechniqueMultiSelectProps) {
  const [techniques, setTechniques] = useState<BjjTechniqueRead[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current tags from the comma-separated string
  const currentTags = value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);

  useEffect(() => {
    // Fetch available techniques
    requestJson<BjjTechniqueRead[]>("/api/bjj-techniques")
      .then((data) => setTechniques(data))
      .catch((err) => console.error("Failed to fetch techniques:", err));
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const addTag = async (tagName: string) => {
    const cleanName = tagName.trim();
    if (!cleanName || currentTags.includes(cleanName)) {
      setInputValue("");
      return;
    }

    // Determine if it exists in DB
    const exists = techniques.some(t => t.name.toLowerCase() === cleanName.toLowerCase());
    
    // If it does not exist, fire and forget a creation to the backend (the backend handles deduplication)
    if (!exists) {
      try {
        const newTech = await requestJson<BjjTechniqueRead>("/api/bjj-techniques", {
          method: "POST",
          body: JSON.stringify({
            name: cleanName,
            category: "custom", // default assignment
            gi_mode: "both"
          })
        });
        setTechniques(prev => [...prev, newTech]);
      } catch (err) {
        console.error("Failed to auto-create technique", err);
      }
    }

    const newTags = [...currentTags, cleanName];
    onChange(newTags.join(", "));
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter((tag) => tag !== tagToRemove);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  const filteredTechniques = techniques.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !currentTags.some(tag => tag.toLowerCase() === t.name.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex min-h-[46px] w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus-within:border-primary dark:border-zinc-800 dark:bg-zinc-950"
        onClick={() => setIsOpen(true)}
      >
        {currentTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
          >
            {tag}
            <button
              type="button"
              className="mt-px flex items-center justify-center rounded-full opacity-50 outline-none transition-opacity hover:opacity-100 focus:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        
        <input
          type="text"
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={currentTags.length === 0 ? placeholder : ""}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          {filteredTechniques.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Search className="size-3" />
                Sugestoes Salvas
              </span>
              {filteredTechniques.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-800"
                  onClick={() => {
                    addTag(tech.name);
                    setIsOpen(false);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                >
                  <span className="font-medium">{tech.name}</span>
                  {tech.category !== "custom" && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-zinc-800 dark:text-slate-400">
                      {tech.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              {inputValue ? (
                <button
                  type="button"
                  onClick={() => addTag(inputValue)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="size-4" />
                  Criar tecnica &quot;<strong>{inputValue}</strong>&quot;
                </button>
              ) : (
                "Nenhuma tecnica salva. Digite para criar."
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
