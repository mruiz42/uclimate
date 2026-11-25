import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import { api, type LatLng, type Place } from '../api/client';
import style from './style/LocationFormText.module.scss';

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

type Props = {
  label: string;
  value: Place | null;
  onSelect: (place: Place | null) => void;
  /** Bias search results toward this point (e.g. the user's location). */
  bias?: LatLng | null;
  placeholder?: string;
  children?: ReactNode;
};

/** Search-as-you-type place picker (combobox pattern). */
const LocationFormText = ({ label, value, onSelect, bias, placeholder, children }: Props) => {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value?.label ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const skipNextSearch = useRef(false);

  // Reflect selections made elsewhere (e.g. "Use my location") without searching for them.
  // A null value means the user is typing, so the text is left alone.
  useEffect(() => {
    if (value && value.label !== text) {
      skipNextSearch.current = true;
      setText(value.label);
      setOpen(false);
    }
  }, [value]); // deliberately not [text]: only react to new selections

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const query = text.trim();
    if (query.length < MIN_QUERY) {
      setResults([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await api
        .GET('/api/geocode/search', {
          params: {
            query: { q: query, lat: bias?.lat, lng: bias?.lng, lang: navigator.language },
          },
          signal: controller.signal,
        })
        .catch(() => ({ data: undefined })); // aborted or offline
      if (controller.signal.aborted) return;
      setLoading(false);
      setResults(data ?? []);
      setActive(-1);
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, bias?.lat, bias?.lng]);

  const choose = (place: Place) => {
    if (place.label !== text) {
      skipNextSearch.current = true;
      setText(place.label);
    }
    setOpen(false);
    onSelect(place);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + results.length) % results.length);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Form.Group className={style.field} controlId={id}>
      <Form.Label>{label}</Form.Label>
      <div className={style.inputWrap}>
        <Form.Control
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (value) onSelect(null); // typing invalidates the previous selection
          }}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {loading && <Spinner size="sm" className={style.spinner} aria-label="Searching" />}
      </div>
      {children}
      {open && (
        <ListGroup id={listId} role="listbox" className={style.results}>
          {results.length === 0 ? (
            <ListGroup.Item className={style.empty}>No places found</ListGroup.Item>
          ) : (
            results.map((place, i) => (
              <ListGroup.Item
                key={place.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                action
                active={i === active}
                // mousedown fires before the input's blur, so the click isn't lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(place);
                }}
              >
                {place.label}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}
    </Form.Group>
  );
};

export default LocationFormText;
