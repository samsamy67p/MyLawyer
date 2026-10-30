import React, { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import LocationIllustration from '../../assets/illustrations/location-tracking.svg';
import { reverseGeocode } from '../../services/mapService';
import './LocationScreen.css';

export default function LocationScreen({
  onLocationSelect,
  onLocationConfirmed,
  onViewOnMap,
  onSkip,
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setErrorText('');

    try {
      try {
        await Geolocation.requestPermissions();
      } catch (e) {
        console.warn('Permission request:', e);
      }

      let coordinates;
      try {
        coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
      } catch (highAccuracyErr) {
        console.warn('Fallback to standard accuracy...', highAccuracyErr);
        coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
        });
      }

      if (!coordinates || !coordinates.coords) {
        throw new Error('لم نتمكن من قراءة الإحداثيات');
      }

      const { latitude, longitude } = coordinates.coords;

      // Fetch the address using central geocoding service
      const resolvedAddress = await reverseGeocode(latitude, longitude);
      setIsLocating(false);

      // Automatically and smoothly transition live to MapScreen
      if (onLocationSelect) {
        onLocationSelect({ latitude, longitude }, resolvedAddress);
      } else if (onViewOnMap) {
        onViewOnMap({ latitude, longitude }, resolvedAddress);
      } else if (onLocationConfirmed) {
        onLocationConfirmed({ latitude, longitude }, resolvedAddress);
      }
    } catch (err) {
      console.warn('GPS location error:', err);
      setErrorText('يرجى التأكد من الموافقة على إذن الموقع وتشغيل الـ GPS.');
      setIsLocating(false);
    }
  };

  return (
    <div className="location-screen-clean">
      <div className="location-illustration-wrap">
        <img
          src={LocationIllustration}
          alt="تحديد موقع الموكل بدقة"
          className="location-svg-img"
        />
      </div>

      <div className="location-intro">
        <h1 className="location-title">تحديد موقعك</h1>
        <p className="location-sub">
          نحتاج موقعك الفعلي لنعرض لك أقرب المحامين والمستشارين المتاحين حولك فوراً وبدقة.
        </p>
      </div>

      {errorText && <div className="location-error-alert">{errorText}</div>}

      {/* Logical Action Flow */}
      <div className="location-actions-group">
        <Button
          type="button"
          isLoading={isLocating}
          onClick={handleDetectLocation}
          className="w-full"
        >
          <Navigation size={18} />
          <span>تحديد موقعي الفعلي الآن</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => onSkip && onSkip()}
          className="w-full"
        >
          تخطي وتحديد الموقع لاحقاً
        </Button>
      </div>
    </div>
  );
}
