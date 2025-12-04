/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from 'react';
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
  distance: number;
  duration: number;
}

interface AddressMapProps {
  addresses: Address[];
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export const AddressMap = ({ addresses }: AddressMapProps) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const [originOptions, setOriginOptions] = useState<OriginOption[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<google.maps.LatLng | null>(null);
  const [kmRate, setKmRate] = useState<number>(1.50);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(() => {
    const saved = localStorage.getItem('mapRoundTrip');
    return saved === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mapRoundTrip', isRoundTrip.toString());
  }, [isRoundTrip]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        google.maps.event.trigger(mapRef.current!, 'resize');
      }, 100);
    }
  }, [isFullscreen]);

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

  useEffect(() => {
    const fetchOriginOptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const options: OriginOption[] = [];

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

  useEffect(() => {
    if (selectedOrigin) {
      localStorage.setItem('preferredMapOrigin', selectedOrigin);
    }
  }, [selectedOrigin]);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fnError } = await supabase.functions.invoke('get-google-maps-key');
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    // If Google Maps is already available
    if (window.google?.maps) {
      setIsGoogleLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    
    if (existingScript) {
      // Script exists but Google isn't ready yet - wait for it
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          setIsGoogleLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
      return;
    }

    // Create callback before adding script
    window.initGoogleMaps = () => {
      setIsGoogleLoaded(true);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key configuration.');
    };
    
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !isGoogleLoaded || !window.google) return;

    try {
      mapRef.current = new google.maps.Map(mapContainer.current, {
        zoom: 6,
        center: { lat: 51.919438, lng: 19.145136 }, // Poland center
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.75,
        },
      });

      setIsMapReady(true);

      return () => {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map');
    }
  }, [isGoogleLoaded]);

  const geocodeAddress = useCallback(async (addr: { address: string; city: string | null; postal_code: string | null; country: string | null }): Promise<google.maps.LatLng | null> => {
    if (!window.google) return null;
    
    const geocoder = new google.maps.Geocoder();
    const query = `${addr.address}, ${addr.postal_code || ''} ${addr.city || ''}, ${addr.country || 'Poland'}`;
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          console.error('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  }, []);

  // Add destination markers
  useEffect(() => {
    if (!isMapReady || !mapRef.current || addresses.length === 0 || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    let primaryCoords: google.maps.LatLng | null = null;

    const addMarkers = async () => {
      for (const address of addresses) {
        const coords = await geocodeAddress(address);
        if (coords) {
          hasValidCoords = true;
          bounds.extend(coords);
          
          if (address.is_primary) {
            primaryCoords = coords;
            setDestinationCoords(coords);
          }

          const marker = new google.maps.Marker({
            position: coords,
            map: mapRef.current!,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: address.is_primary ? 12 : 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: address.label || 'Address',
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <p style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${address.label || 'Address'}</p>
                <p style="font-size: 12px; color: #666; margin: 0;">${address.address}</p>
                <p style="font-size: 12px; color: #666; margin: 0;">${address.postal_code || ''} ${address.city || ''}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapRef.current!, marker);
          });

          markersRef.current.push(marker);
        }
      }

      if (!primaryCoords && hasValidCoords && addresses.length > 0) {
        const firstCoords = await geocodeAddress(addresses[0]);
        if (firstCoords) {
          setDestinationCoords(firstCoords);
        }
      }

      if (hasValidCoords && mapRef.current) {
        mapRef.current.fitBounds(bounds, 50);
      }
    };

    addMarkers();
  }, [isMapReady, addresses, geocodeAddress]);

  // Calculate and draw route
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !destinationCoords || !selectedOrigin || !window.google) return;

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

        // Remove existing origin marker
        const existingOriginMarker = markersRef.current.find(m => (m as any).isOrigin);
        if (existingOriginMarker) {
          existingOriginMarker.setMap(null);
          markersRef.current = markersRef.current.filter(m => m !== existingOriginMarker);
        }

        // Add origin marker
        const originMarker = new google.maps.Marker({
          position: originCoords,
          map: mapRef.current!,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: originOption.label,
        });
        (originMarker as any).isOrigin = true;

        const originInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <p style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${originOption.label}</p>
              <p style="font-size: 12px; color: #666; margin: 0;">${originOption.address}</p>
              <p style="font-size: 12px; color: #666; margin: 0;">${originOption.postal_code || ''} ${originOption.city || ''}</p>
            </div>
          `,
        });

        originMarker.addListener('click', () => {
          originInfoWindow.open(mapRef.current!, originMarker);
        });

        markersRef.current.push(originMarker);

        // Calculate route
        const directionsService = new google.maps.DirectionsService();
        
        directionsService.route(
          {
            origin: originCoords,
            destination: destinationCoords,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRendererRef.current?.setDirections(result);
              
              const route = result.routes[0];
              if (route && route.legs[0]) {
                setRouteInfo({
                  distance: route.legs[0].distance?.value || 0,
                  duration: route.legs[0].duration?.value || 0,
                });
              }

              // Fit bounds to show full route
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(originCoords);
              bounds.extend(destinationCoords);
              mapRef.current?.fitBounds(bounds, 80);
            } else {
              console.error('Directions request failed:', status);
            }
            setIsCalculatingRoute(false);
          }
        );
      } catch (err) {
        console.error('Route calculation error:', err);
        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [isMapReady, destinationCoords, selectedOrigin, originOptions, geocodeAddress]);

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
              {error}. Please ensure the Google Maps API key is configured.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden relative ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
          onClick={() => setIsFullscreen(false)}
        />
      )}
      
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm ${isFullscreen ? 'z-[60]' : 'z-10'}`}
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
      
      {originOptions.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium shrink-0">{t('addressMap.routeFrom', 'Route from')}:</span>
              <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder={t('addressMap.selectOrigin', 'Select starting point')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {originOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.type === 'home' ? (
                          <Home className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate">{option.label}{option.city && ` - ${option.city}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCalculatingRoute ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('addressMap.calculatingRoute', 'Calculating...')}</span>
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-4 text-sm flex-wrap">
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
            ) : destinationCoords ? (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>--</span>
                <Route className="w-4 h-4" />
                <span>--</span>
                <Banknote className="w-4 h-4" />
                <span>--</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                {t('addressMap.noAddressForRoute', 'Add an address to calculate route')}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className={`w-full ${isFullscreen ? 'flex-1' : 'h-80'}`} />
    </Card>
  );
};
