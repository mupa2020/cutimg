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

  // Quality Settings
  const [outputFormat, setOutputFormat] = useState('original');
  const [quality, setQuality] = useState(0.92);

  // Estimation
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);

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

  useEffect(() => {
    if (!previewUrl || cropEnd - cropStart <= 0 || cropRight - cropLeft <= 0) {
      setEstimatedSize(null);
      return;
    }

    setIsCalculatingSize(true);
    const timeoutId = setTimeout(async () => {
      try {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const contentWidth = cropRight - cropLeft;
        const contentHeight = cropEnd - cropStart;

        if (contentWidth <= 0 || contentHeight <= 0) {
          setEstimatedSize(null);
          setIsCalculatingSize(false);
          return;
        }

        let drawHeight = Math.min(sliceHeight, contentHeight);
        const totalSlices = Math.ceil(contentHeight / sliceHeight);

        const canvas = document.createElement('canvas');
        canvas.width = contentWidth;
        canvas.height = drawHeight;
        const ctx = canvas.getContext('2d');

        let finalType = outputFormat;
        if (finalType === 'original') {
          finalType = file ? file.type : 'image/jpeg';
        }

        if (finalType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, contentWidth, drawHeight);
        }

        ctx.drawImage(
          img,
          cropLeft, cropStart, contentWidth, drawHeight,
          0, 0, contentWidth, drawHeight
        );

        const blob = await new Promise(resolve => canvas.toBlob(resolve, finalType, quality));

        if (blob) {
          // Rough estimation: size of first slice * total slices
          const totalBytes = blob.size * totalSlices;
          setEstimatedSize(totalBytes);
        }
      } catch (e) {
        console.error("Error calculating size", e);
      } finally {
        setIsCalculatingSize(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [previewUrl, cropStart, cropEnd, cropLeft, cropRight, sliceHeight, outputFormat, quality, file]);

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

      // Determine final output type
      let finalType = outputFormat;
      if (finalType === 'original') {
        finalType = file.type;
      }

      // Map MIME type to extension
      const getExtension = (mimeType) => {
        if (mimeType === 'image/png') return 'png';
        if (mimeType === 'image/jpeg') return 'jpg';
        return 'jpg'; // fallback
      };
      const ext = getExtension(finalType);

      for (let i = 0; i < totalSlices; i++) {
        // Clear canvas (important for PNG transparency)
        ctx.clearRect(0, 0, contentWidth, sliceHeight);

        // If Output is JPG, fill white background to prevent black transparent areas
        if (finalType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, contentWidth, sliceHeight);
        }

        // Calculate source Y relative to original image
        const sourceY = cropStart + (i * sliceHeight);

        // Calculate height to draw for this slice
        const remainingHeight = cropEnd - sourceY;
        const drawHeight = Math.min(sliceHeight, remainingHeight);

        if (drawHeight <= 0) break;

        // Adjust canvas height for the last slice if needed
        if (i === totalSlices - 1) {
          canvas.height = drawHeight;
          // Re-fill background if height changed and it's JPG
          if (finalType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, contentWidth, drawHeight);
          }
        } else {
          canvas.height = sliceHeight;
        }

        ctx.drawImage(
          img,
          cropLeft, sourceY, contentWidth, drawHeight, // Source: x, y, w, h
          0, 0, contentWidth, drawHeight               // Dest: x, y, w, h
        );

        const blob = await new Promise(resolve => canvas.toBlob(resolve, finalType, quality));

        if (totalSlices === 1) {
          // Direct download if only 1 slice
          const singleFileName = `${file.name.split('.')[0]}_processed.${ext}`;
          saveAs(blob, singleFileName);
          return; // Exit early
        }

        const fileName = `${file.name.split('.')[0]}_${String(i + 1).padStart(3, '0')}.${ext}`;
        zip.file(fileName, blob);
      }

      if (totalSlices > 1) {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${file.name.split('.')[0]}_slices.zip`);
      }

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
                maxSliceHeight={cropEnd - cropStart}
                outputFormat={outputFormat}
                setOutputFormat={setOutputFormat}
                quality={quality}
                setQuality={setQuality}
                estimatedSize={estimatedSize}
                isCalculatingSize={isCalculatingSize}
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
