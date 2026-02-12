import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import DropZone from './components/DropZone';
import SlicerControls from './components/SlicerControls';
import ImagePreview from './components/ImagePreview';

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sliceHeight, setSliceHeight] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropRight, setCropRight] = useState(0);

  useEffect(() => {
    // Cleanup
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setCropStart(0);
      setCropEnd(img.naturalHeight);
      setCropLeft(0);
      setCropRight(img.naturalWidth);
    };
    img.src = url;
  };

  const handleSliceAndDownload = async () => {
    if (!file || !sliceHeight) return;

    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const zip = new JSZip();

      // Calculate cropped data
      const contentWidth = cropRight - cropLeft;
      const contentHeight = cropEnd - cropStart;
      const totalSlices = Math.ceil(contentHeight / sliceHeight);

      canvas.width = contentWidth;
      canvas.height = sliceHeight;

      for (let i = 0; i < totalSlices; i++) {
        // Clear canvas
        ctx.clearRect(0, 0, contentWidth, sliceHeight);

        // Calculate source Y relative to original image
        const sourceY = cropStart + (i * sliceHeight);

        // Calculate height to draw for this slice
        const remainingHeight = cropEnd - sourceY;
        const drawHeight = Math.min(sliceHeight, remainingHeight);

        if (drawHeight <= 0) break;

        // Adjust canvas height for the last slice if needed
        if (i === totalSlices - 1) {
          canvas.height = drawHeight;
        } else {
          canvas.height = sliceHeight;
        }

        ctx.drawImage(
          img,
          cropLeft, sourceY, contentWidth, drawHeight, // Source: x, y, w, h
          0, 0, contentWidth, drawHeight               // Dest: x, y, w, h
        );

        const blob = await new Promise(resolve => canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg'));
        const fileName = `${file.name.split('.')[0]}_${String(i + 1).padStart(3, '0')}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
        zip.file(fileName, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${file.name.split('.')[0]}_slices.zip`);

    } catch (error) {
      console.error("Error slicing image:", error);
      alert("An error occurred while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Image Slicer Pro</h1>
        <p>Slice long vertical images into perfect chunks instantly.</p>
      </header>

      <main className="app-main">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} />
        ) : (
          <div className="workspace">
            <div className="sidebar">
              <SlicerControls
                sliceHeight={sliceHeight}
                setSliceHeight={setSliceHeight}
                onSlice={handleSliceAndDownload}
                isProcessing={isProcessing}
              />
              <button className="btn-secondary" onClick={() => setFile(null)}>
                Upload New Image
              </button>
            </div>
            <div className="preview-area">
              <ImagePreview
                imageSrc={previewUrl}
                cropStart={cropStart}
                setCropStart={setCropStart}
                cropEnd={cropEnd}
                setCropEnd={setCropEnd}
                cropLeft={cropLeft}
                setCropLeft={setCropLeft}
                cropRight={cropRight}
                setCropRight={setCropRight}
                naturalWidth={naturalDimensions.width}
                naturalHeight={naturalDimensions.height}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
