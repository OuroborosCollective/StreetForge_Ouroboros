import { useEffect, useState } from "react";

export type DeviceClass = {
  isAndroid: boolean;
  isTouch: boolean;
  isCompact: boolean;
  isPortrait: boolean;
};

function readDeviceClass(): DeviceClass {
  if (typeof window === "undefined") return { isAndroid: false, isTouch: false, isCompact: false, isPortrait: false };
  const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const isAndroid = /Android/i.test(navigator.userAgent);
  return { isAndroid, isTouch, isCompact: isTouch && window.innerWidth <= 900, isPortrait: window.matchMedia("(orientation: portrait)").matches };
}

export function useDeviceClass() {
  const [device, setDevice] = useState<DeviceClass>(readDeviceClass);
  useEffect(() => {
    const update = () => setDevice(readDeviceClass());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);
  return device;
}

