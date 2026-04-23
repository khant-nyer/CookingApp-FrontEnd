import { useEffect, useMemo, useState } from 'react';
import {
  nutrientCatalog,
  nutrientGroups,
  nutrientIcons,
  nutrientOptions,
  nutrientShortNames
} from '../constants/nutrients';
import { unitOptions } from '../constants/units';
import type { Ingredient, IngredientNutrition, InputChangeEvent, InputKeyboardEvent, PaginationInfo, RecipeIngredientItem } from '../types';
import { getItemId } from '../utils/ids';

interface GalleryTileProps {
  key?: string | number;
  imageUrl?: string;
  fallbackText: string;
  onClick: () => void;
  isSelected?: boolean;
  subtitle?: string;
}

export function GalleryTile({ imageUrl, fallbackText, onClick, isSelected, subtitle }: GalleryTileProps) {
  return (
    <button className={isSelected ? 'gallery-tile selected' : 'gallery-tile'} onClick={onClick}>
      {imageUrl ? <img src={imageUrl} alt={fallbackText} className="gallery-image" /> : <div className="gallery-fallback">{fallbackText}</div>}
      <div className="gallery-caption">{fallbackText}</div>
      {subtitle ? <div className="gallery-subtitle">{subtitle}</div> : null}
    </button>
  );
}


interface PaginationControlsProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({ pagination, onPageChange, disabled = false }: PaginationControlsProps) {
  const currentPage = Math.max((pagination.page || 0) + 1, 1);
  const totalPages = Math.max(pagination.totalPages || 1, 1);

  return (
    <div className="pagination-row">
      <button
        type="button"
        className="secondary"
        disabled={disabled || pagination.first}
        onClick={() => onPageChange(Math.max(pagination.page - 1, 0))}
      >
        Previous
      </button>
      <small>
        Page {currentPage} of {totalPages} • {pagination.numberOfElements} / {pagination.totalElements} items
      </small>
      <button
        type="button"
        className="secondary"
        disabled={disabled || pagination.last}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  );
}

interface TextDetailProps {
  title: string;
  imageUrl?: string;
  fields?: Array<{ label: string; value?: string | number }>;
  sections?: Array<{ title: string; items: string[] }>;
  onDelete: () => void;
  onUpdate?: () => void;
}

export function TextDetail({ title, imageUrl, fields = [], sections = [], onDelete, onUpdate }: TextDetailProps) {
  return (
    <div className="card detail-card">
      <h3>{title}</h3>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="detail-image" />
      ) : null}
      <div className="detail-content">
        {fields.map((field) => (
          <p key={field.label}><strong>{field.label}:</strong> {field.value || '-'}</p>
        ))}
        {sections.map((section) => (
          <div key={section.title} className="detail-section">
            <strong>{section.title}</strong>
            {!section.items.length ? <p className="muted">No data.</p> : null}
            {section.items.map((item, index) => (
              <p key={`${section.title}-${index}`} className="small-line">• {item}</p>
            ))}
          </div>
        ))}
      </div>
      <div className="detail-actions">
        {onUpdate ? <button className="secondary" onClick={onUpdate}>Update</button> : null}
        <button className="danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

interface NutritionIconProps {
  key?: string | number;
  nutrient: string;
  selected?: boolean;
  onClick: () => void;
}

export function NutritionIcon({ nutrient, selected, onClick }: NutritionIconProps) {
  return (
    <button className={selected ? 'nutrient-pill selected' : 'nutrient-pill'} onClick={onClick}>
      <span className="nutrient-icon">{nutrientIcons[nutrient] || '🧪'}</span>
      <small>{nutrient}</small>
    </button>
  );
}

interface NutrientPickerProps {
  value: string;
  onChange: (nutrient: string) => void;
  storageKey?: string;
}

export function NutrientPicker({ value, onChange, storageKey = 'default' }: NutrientPickerProps) {
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const groupOrder = useMemo(() => Object.keys(nutrientGroups).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  }), []);
  const [activeGroup, setActiveGroup] = useState(groupOrder[0] || 'Energy');

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return nutrientCatalog;
    return nutrientCatalog.filter((item) => {
      const name = item.key.toLowerCase();
      const noUnderscore = item.key.replace(/_/g, ' ').toLowerCase();
      const short = (item.short || '').toLowerCase();
      const aliases = (item.aliases || []).join(' ').toLowerCase();
      return name.includes(normalizedQuery)
        || noUnderscore.includes(normalizedQuery)
        || short.includes(normalizedQuery)
        || aliases.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const groupFiltered = useMemo(() => {
    const keys = nutrientGroups[activeGroup] || [];
    return filtered.filter((item) => keys.includes(item.key));
  }, [activeGroup, filtered]);

  const recent = useMemo(() => {
    try {
      const raw = localStorage.getItem(`nutrient-recent-${storageKey}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item: string) => nutrientOptions.includes(item)) : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [normalizedQuery, activeGroup]);

  useEffect(() => {
    const selectedGroup = groupOrder.find((group) => (nutrientGroups[group] || []).includes(value));
    if (selectedGroup) {
      setActiveGroup(selectedGroup);
    }
  }, [groupOrder, value]);

  useEffect(() => {
    const selectedIndex = groupFiltered.findIndex((item) => item.key === value);
    if (selectedIndex >= 0) {
      setHighlightIndex(selectedIndex);
      requestAnimationFrame(() => {
        const selectedElement = document.querySelector<HTMLButtonElement>('.picker-item.is-selected');
        selectedElement?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }
  }, [groupFiltered, value]);

  function selectNutrient(nutrient: string) {
    onChange(nutrient);
    setQuery('');
    try {
      const next = [nutrient, ...recent.filter((item) => item !== nutrient)].slice(0, 6);
      localStorage.setItem(`nutrient-recent-${storageKey}`, JSON.stringify(next));
    } catch {
      // ignore localStorage issues
    }
  }

  function onKeyDown(event: InputKeyboardEvent) {
    if (!groupFiltered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, groupFiltered.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectNutrient(groupFiltered[highlightIndex].key);
    }
  }

  return (
    <div className="nutrient-picker">
      <div className="picker-top-row">
        <div className="picker-chip-section search-block">
          <small className="picker-section-title">Search nutrition</small>
          <input
            placeholder="Search nutrient"
            value={query}
            onChange={(event: InputChangeEvent) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="picker-chip-section">
          <small className="picker-section-title">Recent picks</small>
          <div className="picker-recent-row">
            {recent.length ? recent.map((nutrient: string) => (
              <button
                type="button"
                key={nutrient}
                className={nutrient === value ? 'chip selected' : 'chip'}
                onClick={() => selectNutrient(nutrient)}
              >
                <span className="chip-icon">{nutrientIcons[nutrient] || '🧪'}</span>
                <span className="chip-main">{nutrientShortNames[nutrient] || nutrient}</span>
              </button>
            )) : <small className="muted">No recent picks</small>}
          </div>
        </div>
      </div>

      <div className="picker-list">
        <div className="nav-row nutrient-group-tabs">
          {groupOrder.map((group) => {
            const count = filtered.filter((item) => (nutrientGroups[group] || []).includes(item.key)).length;
            if (!count) return null;
            return (
              <button
                type="button"
                key={group}
                className={group === activeGroup ? 'tab active' : 'tab'}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            );
          })}
        </div>

        <strong className="picker-list-title">{activeGroup}</strong>
        <div className="picker-group">
          {groupFiltered.map((item, idx) => (
            <button
              type="button"
              key={item.key}
              className={[
                'picker-item',
                idx === highlightIndex ? 'highlighted' : '',
                item.key === value ? 'is-selected' : ''
              ].join(' ').trim()}
              onClick={() => selectNutrient(item.key)}
            >
              <span>{nutrientIcons[item.key] || '🧪'}</span>
              <span>{item.key}</span>
              <small>{nutrientShortNames[item.key]}</small>
            </button>
          ))}
        </div>
        {!groupFiltered.length ? <p className="muted">No nutrients found in this tab.</p> : null}
      </div>
    </div>
  );
}

interface NutritionSummaryCardsProps {
  items?: IngredientNutrition[];
  onRemove: (index: number) => void;
  onValueChange: (index: number, value: string) => void;
  onUnitChange: (index: number, unit: string) => void;
}

export function NutritionSummaryCards({ items = [], onRemove, onValueChange, onUnitChange }: NutritionSummaryCardsProps) {
  return (
    <div className="summary-card-grid nutrition-summary-grid">
      {items.map((nutrition, index) => (
        <div key={`${nutrition.nutrient}-${index}`} className="mini-summary-card">
          <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
          <div className="mini-summary-head nutrition-summary-head">
            <span className="nutrient-icon">{nutrientIcons[nutrition.nutrient] || '🧪'}</span>
            <small className="nutrient-full-name">{nutrition.nutrient}</small>
            <small className="nutrient-short-name">{nutrientShortNames[nutrition.nutrient] || nutrition.nutrient}</small>
          </div>
          <div className="mini-summary-fields">
            <input type="number" value={nutrition.value} onChange={(event: InputChangeEvent) => onValueChange(index, event.target.value)} placeholder="Amount" />
            <select value={nutrition.unit} onChange={(event: InputChangeEvent) => onUnitChange(index, event.target.value)}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecipeIngredientSummaryCardsProps {
  items?: RecipeIngredientItem[];
  ingredients?: Ingredient[];
  onChange: (index: number, patch: Partial<RecipeIngredientItem>) => void;
  onRemove: (index: number) => void;
}

export function RecipeIngredientSummaryCards({ items = [], ingredients = [], onChange, onRemove }: RecipeIngredientSummaryCardsProps) {
  return (
    <div className="summary-card-grid ingredient-summary-grid">
      {items.map((item, index) => {
        const ingredient = ingredients.find((ing) => String(getItemId(ing)) === String(item.ingredientId));
        return (
          <div key={`recipe-ingredient-${index}`} className="mini-summary-card ingredient-summary-card">
            <button type="button" className="mini-remove" onClick={() => onRemove(index)}>×</button>
            {ingredient?.imageUrl ? <img src={ingredient.imageUrl} alt={ingredient.name || 'Ingredient'} className="mini-ingredient-image" /> : <div className="mini-ingredient-image fallback">🥣</div>}
            <strong className="mini-ingredient-name">{item.ingredientName || ingredient?.name || 'Ingredient'}</strong>
            <div className="mini-summary-fields ingredient-summary-fields">
              <div className="ingredient-amount-row">
                <input
                  type="number"
                  min={0}
                  className="quantity-input"
                  value={item.quantity}
                  onChange={(event: InputChangeEvent) => onChange(index, { quantity: Math.max(0, Number(event.target.value) || 0) })}
                  placeholder="Amt"
                />
                <select value={item.unit} onChange={(event: InputChangeEvent) => onChange(index, { unit: event.target.value })}>{unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              </div>
              <input value={item.note || ''} onChange={(event: InputChangeEvent) => onChange(index, { note: event.target.value })} placeholder="Note" />
              <select value={item.ingredientId} onChange={(event: InputChangeEvent) => onChange(index, { ingredientId: Number(event.target.value), ingredientName: ingredients.find((ing) => String(getItemId(ing)) === String(event.target.value))?.name || '' })}>{ingredients.map((ing) => <option key={getItemId(ing)} value={getItemId(ing)}>{ing.name}</option>)}</select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
