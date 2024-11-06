import React, { useEffect, useRef } from "react";
import ModelViewer from "@metamask/logo";

const MetaMask: React.FC = () => {
  const logoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = logoContainerRef.current;

    if (container) {
      const viewer = ModelViewer({
        pxNotRatio: true,
        width: 500,
        height: 400,
        followMouse: true,
        slowDrift: false,
      });

      container.appendChild(viewer.container);

      return () => {
        viewer.stopAnimation();
        container.removeChild(viewer.container);
      };
    }
  }, []);

  return <div ref={logoContainerRef} id="logo-container" />;
};

export default MetaMask;
