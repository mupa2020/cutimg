import React, { useState, useRef, useEffect } from 'react';

const ImagePreview = ({
    imageSrc,
    cropStart, setCropStart,
    cropEnd, setCropEnd,
    cropLeft, setCropLeft,
    cropRight, setCropRight,
    naturalHeight, naturalWidth
}) => {
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    const imgRef = useRef(null);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(null); // 'start', 'end', 'left', 'right'

    if (!imageSrc) return null;

    const handleImageLoad = (e) => {
        setImgDims({ width: e.target.offsetWidth, height: e.target.offsetHeight });
    };

    // Re-measure on resize
    useEffect(() => {
        const updateDims = () => {
            if (imgRef.current) {
                setImgDims({ width: imgRef.current.offsetWidth, height: imgRef.current.offsetHeight });
            }
        };
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    const getClientPos = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handleDragStart = (type) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(type);
    };

    const handleDragMove = (e) => {
        if (!isDragging || !imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const pos = getClientPos(e);

        if (isDragging === 'start' || isDragging === 'end') {
            const offsetY = pos.y - rect.top;
            let percentage = Math.max(0, Math.min(1, offsetY / rect.height));
            let pixelVal = Math.round(percentage * naturalHeight);

            if (isDragging === 'start') {
                pixelVal = Math.min(pixelVal, cropEnd - 10);
                setCropStart(pixelVal);
            } else {
                pixelVal = Math.max(pixelVal, cropStart + 10);
                setCropEnd(pixelVal);
            }
        } else if (isDragging === 'left' || isDragging === 'right') {
            const offsetX = pos.x - rect.left;
            let percentage = Math.max(0, Math.min(1, offsetX / rect.width));
            let pixelVal = Math.round(percentage * naturalWidth);

            if (isDragging === 'left') {
                pixelVal = Math.min(pixelVal, cropRight - 10);
                setCropLeft(pixelVal);
            } else {
                pixelVal = Math.max(pixelVal, cropLeft + 10);
                setCropRight(pixelVal);
            }
        }
    };

    const handleDragEnd = () => {
        setIsDragging(null);
    };

    // Convert natural pixels to CSS percentage for display
    const startPercent = (cropStart / naturalHeight) * 100;
    const endPercent = (cropEnd / naturalHeight) * 100;
    const leftPercent = (cropLeft / naturalWidth) * 100;
    const rightPercent = (cropRight / naturalWidth) * 100;

    return (
        <div className="image-preview-container"
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            <div className="preview-header">
                <h3>Preview & Crop</h3>
                <span className="dimensions-badge">
                    {naturalWidth} x {naturalHeight} px
                </span>
            </div>

            <div className="image-wrapper" ref={containerRef}>
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Preview"
                    onLoad={handleImageLoad}
                    style={{ display: 'block' }}
                />

                {/* --- Vertical Cropping (Top/Bottom) --- */}

                {/* Overlay Top */}
                <div className="crop-overlay top" style={{ height: `${startPercent}%` }}></div>

                {/* Handle Top */}
                <div
                    className="crop-handle horizontal start-handle"
                    style={{ top: `${startPercent}%` }}
                    onMouseDown={handleDragStart('start')}
                    onTouchStart={handleDragStart('start')}
                >
                    <span className="handle-label">Y: {cropStart}px</span>
                </div>

                {/* Overlay Bottom */}
                <div className="crop-overlay bottom" style={{ height: `${100 - endPercent}%` }}></div>

                {/* Handle Bottom */}
                <div
                    className="crop-handle horizontal end-handle"
                    style={{ top: `${endPercent}%` }}
                    onMouseDown={handleDragStart('end')}
                    onTouchStart={handleDragStart('end')}
                >
                    <span className="handle-label">Y: {cropEnd}px</span>
                </div>


                {/* --- Horizontal Cropping (Left/Right) --- */}

                {/* Overlay Left */}
                <div className="crop-overlay left" style={{ width: `${leftPercent}%` }}></div>

                {/* Handle Left */}
                <div
                    className="crop-handle vertical left-handle"
                    style={{ left: `${leftPercent}%` }}
                    onMouseDown={handleDragStart('left')}
                    onTouchStart={handleDragStart('left')}
                >
                    <span className="handle-label vertical-label">X: {cropLeft}px</span>
                </div>

                {/* Overlay Right */}
                <div className="crop-overlay right" style={{ width: `${100 - rightPercent}%` }}></div>

                {/* Handle Right */}
                <div
                    className="crop-handle vertical right-handle"
                    style={{ left: `${rightPercent}%` }}
                    onMouseDown={handleDragStart('right')}
                    onTouchStart={handleDragStart('right')}
                >
                    <span className="handle-label vertical-label">X: {cropRight}px</span>
                </div>

            </div>

            <p className="hint">Drag green lines to crop. Top/Bottom for height, Left/Right for width.</p>
        </div>
    );
};

export default ImagePreview;
