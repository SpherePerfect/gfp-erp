export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'macOS Dynamic' | 'Architectural' | 'Dark Executive';
  url: string;
  thumbnail: string;
  description: string;
}

export const PRESET_WALLPAPERS: WallpaperPreset[] = [
  {
    id: 'sonoma_horizon',
    name: 'macOS Sonoma Horizon',
    category: 'macOS Dynamic',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
    description: 'Golden sunset over rolling mountain ridges and atmospheric cloud layers.',
  },
  {
    id: 'sequoia_dusk',
    name: 'macOS Sequoia Dusk',
    category: 'macOS Dynamic',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=400&auto=format&fit=crop',
    description: 'Serene towering evergreens bathed in warm ambient evening light.',
  },
  {
    id: 'ventura_waves',
    name: 'macOS Ventura Sculptural',
    category: 'macOS Dynamic',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    description: 'Smooth acrylic fluid ribbons inspired by modern macOS design.',
  },
  {
    id: 'monterey_titanium',
    name: 'Dark Titanium Architecture',
    category: 'Dark Executive',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    description: 'Deep navy and titanium geometric facets with subtle contrast.',
  },
  {
    id: 'pacific_coast',
    name: 'Pacific Azure Coast',
    category: 'Architectural',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
    description: 'Clean coastal waters and expansive negative space.',
  },
  {
    id: 'high_sierra_snow',
    name: 'High Sierra Dawn',
    category: 'macOS Dynamic',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    description: 'Sharp alpine peaks catching first morning light.',
  },
];

export const DEFAULT_WALLPAPER = PRESET_WALLPAPERS[0].url;
