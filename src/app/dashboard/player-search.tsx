"use client";

import { useState, useRef, useEffect } from "react";
import { searchPlayers, addPlayer } from "./actions";

type Player = {
  id: number;
  name: string;
  team: string;
  position: string;
};

const POSITION_TAGS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX"] as const;

export default function PlayerSearch({
  usedPositionTags,
}: {
  usedPositionTags: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [positionTag, setPositionTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const availableTags = POSITION_TAGS.filter(
    (tag) => !usedPositionTags.includes(tag)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const data = await searchPlayers(value);
      setResults(data);
      setShowResults(true);
    }, 300);
  }

  function selectPlayer(player: Player) {
    setSelectedPlayer(player);
    setQuery(player.name);
    setShowResults(false);
    // Auto-suggest a position tag based on player position
    if (!positionTag) {
      const suggestion = availableTags.find((tag) =>
        tag.startsWith(player.position)
      );
      if (suggestion) setPositionTag(suggestion);
    }
  }

  async function handleSubmit() {
    if (!selectedPlayer || !positionTag) {
      setError("Select a player and a position slot");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("player_id", String(selectedPlayer.id));
    formData.set("position_tag", positionTag);

    const result = await addPlayer(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setQuery("");
      setSelectedPlayer(null);
      setPositionTag("");
      setResults([]);
    }

    setLoading(false);
  }

  if (availableTags.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        All 7 roster slots are filled. Remove a player to add a different one.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div ref={searchRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search for a player..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        {/* Autocomplete dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            {results.map((player) => (
              <button
                key={player.id}
                onClick={() => selectPlayer(player)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  {player.name}
                </span>
                <span className="text-xs text-slate-500">
                  {player.position} &middot; {player.team}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Position tag selector */}
      {selectedPlayer && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Assign to roster slot:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setPositionTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  positionTag === tag
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      {selectedPlayer && positionTag && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading
            ? "Adding..."
            : `Add ${selectedPlayer.name} as ${positionTag}`}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
