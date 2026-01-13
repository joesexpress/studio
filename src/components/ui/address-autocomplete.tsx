'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useLoadScript } from '@/hooks/use-load-script';

interface AddressAutocompleteProps {
  onAddressSelect: (place: google.maps.places.PlaceResult) => void;
  initialValue?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onAddressSelect, initialValue }) => {
  const [inputValue, setInputValue] = React.useState(initialValue || '');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  const isScriptLoaded = useLoadScript(
    `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
  );

  React.useEffect(() => {
    if (isScriptLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          setInputValue(place.formatted_address);
          onAddressSelect(place);
        }
      });
    }
  }, [isScriptLoaded, onAddressSelect]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };
  
  React.useEffect(() => {
    setInputValue(initialValue || '');
  }, [initialValue]);

  if (!isScriptLoaded) {
    return <Input placeholder="Loading address search..." disabled />;
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleChange}
      placeholder="Start typing an address..."
      name="address"
    />
  );
};

export default AddressAutocomplete;
