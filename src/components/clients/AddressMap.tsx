import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin, AlertCircle, Loader2, Navigation, Clock, Route, Home, Building2, Banknote, ArrowLeftRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

interface Address {
  id: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  label: string | null;
  is_primary: boolean;
}

interface OriginOption {
  id: string;
  label: string;
  type: 'home' | 'company';
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
}

interface AddressMapProps {
  addresses: Address[];
}

export const AddressMap = ({ addresses }: AddressMapProps) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Route-related state
  const [originOptions, setOriginOptions] = useState<OriginOption[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [kmRate, setKmRate] = useState<number>(1.50); // default value
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(() => {
    const saved = localStorage.getItem('mapRoundTrip');
    return saved === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save round-trip preference
  useEffect(() => {
    localStorage.setItem('mapRoundTrip', isRoundTrip.toString());
  }, [isRoundTrip]);

  // Resize map when fullscreen changes
  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isFullscreen]);

  // Fetch km rate from database
  useEffect(() => {
    const fetchKmRate = async () => {
      const { data, error } = await supabase
        .from('system_numeric_settings')
        .select('setting_value')
        .eq('setting_key', 'km_rate')
        .single();

      if (!error && data) {
        setKmRate(Number(data.setting_value));
      }
    };

    fetchKmRate();
  }, []);

  // Fetch origin options (user's home address + company addresses)
  useEffect(() => {
    const fetchOriginOptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const options: OriginOption[] = [];

        // Fetch user's profile (home address)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, address, city, postal_code, country, full_name')
          .eq('id', user.id)
          .single();

        if (profile?.address) {
          options.push({
            id: 'home',
            label: t('addressMap.myHomeAddress', 'My Home Address'),
            type: 'home',
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            country: profile.country,
          });
        }

        // Fetch company addresses
        const { data: companyAddresses } = await supabase
          .from('company_addresses')
          .select('id, address, city, postal_code, country, label')
          .order('is_primary', { ascending: false });

        if (companyAddresses) {
          companyAddresses.forEach(addr => {
            options.push({
              id: addr.id,
              label: addr.label || t('addressMap.companyAddress', 'Company Address'),
              type: 'company',
              address: addr.address,
              city: addr.city,
              postal_code: addr.postal_code,
              country: addr.country,
            });
          });
        }

        setOriginOptions(options);
        
        // Set default: prefer home address, then first company address
        if (options.length > 0) {
          const saved = localStorage.getItem('preferredMapOrigin');
          if (saved && options.find(o => o.id === saved)) {
            setSelectedOrigin(saved);
          } else {
            setSelectedOrigin(options[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch origin options:', err);
      }
    };

    fetchOriginOptions();
  }, [t]);

  // Save selected origin preference
  useEffect(() => {
    if (selectedOrigin) {
      localStorage.setItem('preferredMapOrigin', selectedOrigin);
    }
  }, [selectedOrigin]);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  const geocodeAddress = useCallback(async (addr: { address: string; city: string | null; postal_code: string | null; country: string | null }): Promise<[number, number] | null> => {
    if (!mapboxToken) return null;
    
    const query = `${addr.address}, ${addr.postal_code || ''} ${addr.city || ''}, ${addr.country || 'Poland'}`;
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
  }, [mapboxToken]);

  const fetchRoute = useCallback(async (origin: [number, number], destination: [number, number]) => {
    if (!mapboxToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return {
          geometry: data.routes[0].geometry,
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        };
      }
    } catch (error) {
      console.error('Route fetch error:', error);
    }
    return null;
  }, [mapboxToken]);

  const drawRoute = useCallback((geometry: GeoJSON.Geometry) => {
    if (!map.current) return;

    // Remove existing route layer and source
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add route source and layer
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 5,
        'line-opacity': 0.75,
      },
    });
  }, []);

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
      setError('Failed to initialize map');
    }
  }, [mapboxToken]);

  // Add destination markers
  useEffect(() => {
    if (!isMapReady || !map.current || addresses.length === 0 || !mapboxToken) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;
    let primaryCoords: [number, number] | null = null;

    const addMarkers = async () => {
      for (const address of addresses) {
        const coords = await geocodeAddress(address);
        if (coords) {
          hasValidCoords = true;
          bounds.extend(coords);
          
          // Save primary address coords for route calculation
          if (address.is_primary) {
            primaryCoords = coords;
            setDestinationCoords(coords);
          }

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

      // If no primary address, use first address
      if (!primaryCoords && hasValidCoords && addresses.length > 0) {
        const firstCoords = await geocodeAddress(addresses[0]);
        if (firstCoords) {
          setDestinationCoords(firstCoords);
        }
      }

      if (hasValidCoords && map.current) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    };

    addMarkers();
  }, [isMapReady, addresses, mapboxToken, geocodeAddress]);

  // Calculate and draw route when origin changes
  useEffect(() => {
    if (!isMapReady || !map.current || !destinationCoords || !selectedOrigin || !mapboxToken) return;

    const calculateRoute = async () => {
      const originOption = originOptions.find(o => o.id === selectedOrigin);
      if (!originOption) return;

      setIsCalculatingRoute(true);
      setRouteInfo(null);

      try {
        const originCoords = await geocodeAddress(originOption);
        if (!originCoords) {
          setIsCalculatingRoute(false);
          return;
        }

        // Add origin marker
        const existingOriginMarker = markersRef.current.find(m => m.getElement().classList.contains('origin-marker'));
        if (existingOriginMarker) {
          existingOriginMarker.remove();
          markersRef.current = markersRef.current.filter(m => m !== existingOriginMarker);
        }

        const originEl = document.createElement('div');
        originEl.className = 'origin-marker flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white shadow-lg';
        originEl.innerHTML = originOption.type === 'home'
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';

        const originPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <p class="font-semibold text-sm">${originOption.label}</p>
            <p class="text-xs text-gray-600">${originOption.address}</p>
            <p class="text-xs text-gray-600">${originOption.postal_code || ''} ${originOption.city || ''}</p>
          </div>
        `);

        const originMarker = new mapboxgl.Marker(originEl)
          .setLngLat(originCoords)
          .setPopup(originPopup)
          .addTo(map.current!);

        markersRef.current.push(originMarker);

        // Fetch and draw route
        const routeData = await fetchRoute(originCoords, destinationCoords);
        if (routeData) {
          drawRoute(routeData.geometry);
          setRouteInfo({
            distance: routeData.distance,
            duration: routeData.duration,
          });

          // Fit bounds to include both origin and destination
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(originCoords);
          bounds.extend(destinationCoords);
          map.current?.fitBounds(bounds, { padding: 80, maxZoom: 12 });
        }
      } catch (err) {
        console.error('Route calculation error:', err);
      } finally {
        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [isMapReady, destinationCoords, selectedOrigin, originOptions, mapboxToken, geocodeAddress, fetchRoute, drawRoute]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading map...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Map Unavailable</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {error}. Please ensure the Mapbox token is configured in Supabase secrets.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden relative ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
          onClick={() => setIsFullscreen(false)}
        />
      )}
      
      {/* Fullscreen toggle button */}
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm ${isFullscreen ? 'z-[60]' : 'z-10'}`}
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
      
      {/* Origin selector and route info - single row */}
      {originOptions.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Origin selector */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium shrink-0">{t('addressMap.routeFrom', 'Route from')}:</span>
              <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                <SelectTrigger className="h-8 min-w-[200px] max-w-[300px]">
                  <SelectValue placeholder={t('addressMap.selectOrigin', 'Select starting point')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {originOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.type === 'home' ? (
                          <Home className="w-4 h-4 text-green-500" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-500" />
                        )}
                        <span>{option.label}{option.city && ` - ${option.city}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route info */}
            {isCalculatingRoute ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('addressMap.calculatingRoute', 'Calculating...')}</span>
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {/* Round-trip toggle */}
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('addressMap.roundTrip', 'Round-trip')}</span>
                  <Switch
                    checked={isRoundTrip}
                    onCheckedChange={setIsRoundTrip}
                    className="scale-75"
                  />
                </div>
                
                <div className="h-4 w-px bg-border" />
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {formatDuration(routeInfo.duration * (isRoundTrip ? 2 : 1))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Route className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {formatDistance(routeInfo.distance * (isRoundTrip ? 2 : 1))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Banknote className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {((routeInfo.distance / 1000) * kmRate * (isRoundTrip ? 2 : 1)).toFixed(2)} PLN
                  </span>
                  <span className="text-xs">({kmRate.toFixed(2)}/km)</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className={`w-full ${isFullscreen ? 'flex-1' : 'h-80'}`} />
    </Card>
  );
};
