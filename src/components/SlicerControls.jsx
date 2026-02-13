import React from 'react';

const SlicerControls = ({
    sliceHeight, setSliceHeight,
    maxSliceHeight,
    outputFormat, setOutputFormat,
    quality, setQuality,
    onSlice, isProcessing
}) => {
    return (
        <div className="controls-container">
            <div className="input-group">
                <label htmlFor="sliceHeight">Slice Height (px)</label>
                <input
                    type="number"
                    id="sliceHeight"
                    value={sliceHeight}
                    onChange={(e) => setSliceHeight(Number(e.target.value))}
                    min="100"
                    max={maxSliceHeight}
                    placeholder="e.g. 1000"
                />
            </div>
            <div className="input-range-wrapper" style={{ marginBottom: '1.5rem', marginTop: '-1rem' }}>
                <input
                    type="range"
                    min="100"
                    max={Math.max(100, maxSliceHeight || 1000)}
                    step="10"
                    value={sliceHeight}
                    onChange={(e) => setSliceHeight(Number(e.target.value))}
                    style={{ width: '100%', display: 'block' }}
                />
            </div>

            <div className="input-group">
                <label htmlFor="outputFormat">Output Format</label>
                <select
                    id="outputFormat"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                >
                    <option value="original">Original (Same as Input)</option>
                    <option value="image/jpeg">JPG</option>
                    <option value="image/png">PNG</option>
                </select>
            </div>

            {(outputFormat === 'image/jpeg' || outputFormat === 'original') && (
                <div className="input-group">
                    <label htmlFor="quality">
                        Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                        type="range"
                        id="quality"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                    />
                </div>
            )}

            <button
                className="btn-primary"
                onClick={onSlice}
                disabled={isProcessing}
            >
                {isProcessing ? 'Processing...' : 'Slice & Download'}
            </button>
        </div>
    );
};

export default SlicerControls;
