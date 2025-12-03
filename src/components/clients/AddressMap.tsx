import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

interface Address {
  id: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  label: string | null;
  is_primary: boolean;
}

interface AddressMapProps {
  addresses: Address[];
}

const MAPBOX_TOKEN_KEY = 'mapbox_access_token';

export const AddressMap = ({ addresses }: AddressMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem(MAPBOX_TOKEN_KEY) || '';
  });
  const [tempToken, setTempToken] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const saveToken = () => {
    if (tempToken.trim()) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, tempToken.trim());
      setMapboxToken(tempToken.trim());
    }
  };

  const geocodeAddress = async (address: Address): Promise<[number, number] | null> => {
    const query = `${address.address}, ${address.postal_code || ''} ${address.city || ''}, ${address.country || 'Poland'}`;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        zoom: 5,
        center: [19.145136, 51.919438], // Poland center
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current?.remove();
        setIsMapReady(false);
      };
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (!isMapReady || !map.current || addresses.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;

    const addMarkers = async () => {
      for (const address of addresses) {
        const coords = await geocodeAddress(address);
        if (coords) {
          hasValidCoords = true;
          bounds.extend(coords);

          const el = document.createElement('div');
          el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg';
          el.innerHTML = address.is_primary 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>';

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-semibold text-sm">${address.label || 'Address'}</p>
              <p class="text-xs text-gray-600">${address.address}</p>
              <p class="text-xs text-gray-600">${address.postal_code || ''} ${address.city || ''}</p>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      }

      if (hasValidCoords && map.current) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    };

    addMarkers();
  }, [isMapReady, addresses, mapboxToken]);

  if (!mapboxToken) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Mapbox Token Required</h4>
            <p className="text-xs text-muted-foreground mt-1">
              To view addresses on a map, please enter your Mapbox public token. 
              Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="pk.eyJ1Ijoi..."
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={saveToken} disabled={!tempToken.trim()}>
            Save Token
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div ref={mapContainer} className="h-64 w-full" />
    </Card>
  );
};
