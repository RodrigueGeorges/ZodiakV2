import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlaceSuggestion {
  display_name: string;
  short_name: string;
  lat: string;
  lon: string;
}

interface BirthPlaceInputProps {
  /** Valeur stockée (au format "lat,lng" — utilisée par le backend astro) */
  value: string;
  /** Reçoit le format "lat,lng" + le label affiché */
  onChange: (latLng: string, label: string) => void;
  /** Label initial à afficher (si on relit depuis un draft) */
  initialLabel?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * Champ "Lieu de naissance" avec autocomplete géocodé.
 *
 * Utilise Nominatim (OpenStreetMap, gratuit, sans clé). On respecte le
 * fair-use en debouncing les requêtes (350 ms) et en limitant les résultats
 * (max 6 suggestions).
 *
 * Sortie : on émet le label affiché à l'utilisateur ("Paris, Île-de-France,
 * France") ET un format `"lat,lng"` que le backend de calcul natal attend.
 *
 * Important : sans coordonnées, le calcul du thème natal est impossible
 * (l'ascendant dépend de la latitude). Donc on FORCE la sélection d'une
 * suggestion : si l'utilisateur tape juste du texte sans cliquer, le
 * formulaire ne valide pas (value reste vide).
 */
export default function BirthPlaceInput({
  value,
  onChange,
  initialLabel = '',
  placeholder = 'Commence à taper ta ville…',
  required = false,
  className,
  id = 'birth-place',
  ariaLabel,
}: BirthPlaceInputProps) {
  const [query, setQuery] = useState(initialLabel);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(Boolean(value));
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reflet : si on dépose un draft (initialLabel mais value vide), on
  // demande à l'utilisateur de re-confirmer en re-cliquant.
  useEffect(() => {
    setHasSelection(Boolean(value));
  }, [value]);

  // Debounce + fetch Nominatim
  useEffect(() => {
    if (!query || query.length < 3 || hasSelection) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?' +
          new URLSearchParams({
            q: query,
            format: 'jsonv2',
            addressdetails: '1',
            'accept-language': 'fr',
            limit: '6',
          });
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        const formatted: PlaceSuggestion[] = (data as Array<{
          display_name: string;
          lat: string;
          lon: string;
          address?: Record<string, string>;
        }>).map((d) => {
          const addr = d.address ?? {};
          const parts = [
            addr.city || addr.town || addr.village || addr.hamlet || addr.county,
            addr.state,
            addr.country,
          ].filter(Boolean);
          return {
            display_name: d.display_name,
            short_name: parts.join(', ') || d.display_name,
            lat: d.lat,
            lon: d.lon,
          };
        });
        setSuggestions(formatted);
        setOpen(formatted.length > 0);
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.warn('Geocoding error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query, hasSelection]);

  // Click outside → ferme le dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const select = (s: PlaceSuggestion) => {
    setQuery(s.short_name);
    setOpen(false);
    setHasSelection(true);
    const lat = parseFloat(s.lat).toFixed(4);
    const lon = parseFloat(s.lon).toFixed(4);
    onChange(`${lat},${lon}`, s.short_name);
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
            hasSelection ? 'text-aurora-300' : 'text-ivory-400',
          )}
          aria-hidden="true"
        />
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Si on retape, on perd la sélection précédente
            if (hasSelection) {
              setHasSelection(false);
              onChange('', '');
            }
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          aria-label={ariaLabel ?? 'Lieu de naissance'}
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
          className={cn('input-cosmic !pl-9 !pr-10')}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading && (
            <Loader2 className="w-4 h-4 text-ivory-400 animate-spin" />
          )}
          {!loading && hasSelection && (
            <Check className="w-4 h-4 text-aurora-300" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-2xl border border-night-700 bg-night-900/95 backdrop-blur-md shadow-2xl divide-y divide-night-700/40"
            role="listbox"
          >
            {suggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => select(s)}
                  className="w-full text-left px-4 py-3 hover:bg-aurora-500/10 transition-colors group"
                  role="option"
                  aria-selected="false"
                >
                  <p className="text-body text-ivory-50 truncate group-hover:text-aurora-100">
                    {s.short_name}
                  </p>
                  <p className="text-micro text-ivory-400 truncate">
                    {s.display_name}
                  </p>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Hint si l'user a tapé du texte sans sélectionner */}
      {!hasSelection && query.length >= 3 && !loading && suggestions.length === 0 && (
        <p className="mt-1.5 text-micro text-magenta-300">
          Aucun lieu trouvé. Vérifie l'orthographe ou simplifie (ex : "Paris").
        </p>
      )}
      {!hasSelection && query.length >= 3 && suggestions.length > 0 && (
        <p className="mt-1.5 text-micro text-ivory-400">
          Choisis un lieu dans la liste pour calculer ton thème.
        </p>
      )}
    </div>
  );
}
