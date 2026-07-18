import React from 'react';

const SkeletonLoader = ({ height = '20px', width = '100%', style = {}, className = '' }) => {
  const baseStyle = {
    height,
    width,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '4px',
    ...style
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={baseStyle} className={className} />
    </>
  );
};

export default SkeletonLoader;
