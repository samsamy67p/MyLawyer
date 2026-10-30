import React, { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Navigation, MapPin, CheckCircle2, Map } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import LocationIllustration from '../../assets/illustrations/location-tracking.svg';
import { reverseGeocode } from '../../services/mapService';
import './LocationScreen.css';

export default function LocationScreen({
  existingLocation,
  onLocationSelect,
  onLocationConfirmed,
  onViewOnMap,
  onSkip,
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(existingLocation?.coords || null);
  const [addressTitle, setAddressTitle] = useState(existingLocation?.address || '');
  const [errorText, setErrorText] = useState('');

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setIsResolvingAddress(true);
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
      setCurrentCoords({ latitude, longitude });

      // Fetch the address using central geocoding service
      const resolvedAddress = await reverseGeocode(latitude, longitude);
      setAddressTitle(resolvedAddress);
      setIsLocating(false);
      setIsResolvingAddress(false);
    } catch (err) {
      console.warn('GPS location error:', err);
      setErrorText('يرجى التأكد من الموافقة على إذن الموقع وتشغيل الـ GPS.');
      setIsLocating(false);
      setIsResolvingAddress(false);
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
        <h1 className="location-title">
          {existingLocation ? 'تأكيد موقعك' : 'تحديد موقعك'}
        </h1>
        <p className="location-sub">
          {existingLocation
            ? 'موقعك المسجل حالياً يظهر بالأسفل، يمكنك تأكيده للمتابعة أو تحديثه.'
            : 'نحتاج موقعك الفعلي لنعرض لك أقرب المحامين والمستشارين المتاحين حولك فوراً وبدقة.'}
        </p>
      </div>

      {errorText && <div className="location-error-alert">{errorText}</div>}

      {/* Detected Location Card */}
      {currentCoords && (
        <div className="detected-location-card">
          <div className="detected-lead">
            <div className="detected-pin-box">
              <MapPin size={22} className="text-[#1D4ED8]" />
            </div>
            <div className="detected-content">
              <span className="detected-badge">
                <CheckCircle2 size={13} className="text-emerald-600" /> الموقع الحالي
              </span>
              {isResolvingAddress ? (
                <div className="detected-loading-col">
                  <span className="text-xs text-[#64748B] font-medium">جاري التعرف على المدينة والمحافظة...</span>
                </div>
              ) : (
                <h4 className="detected-address">{addressTitle}</h4>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logical Action Flow */}
      <div className="location-actions-group">
        {!currentCoords ? (
          <>
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
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => {
                if (onLocationSelect) {
                  onLocationSelect(currentCoords, addressTitle);
                } else if (onViewOnMap) {
                  onViewOnMap(currentCoords, addressTitle);
                } else if (onLocationConfirmed) {
                  onLocationConfirmed(currentCoords, addressTitle);
                }
              }}
              className="w-full"
            >
              <Map size={18} />
              <span>عرض موقعي وتأكيده على الخريطة</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              isLoading={isLocating}
              onClick={handleDetectLocation}
              className="w-full"
            >
              <Navigation size={17} />
              <span>تحديث الموقع الفعلي الحالي</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
