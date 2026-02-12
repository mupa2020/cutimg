import React from 'react';

const SlicerControls = ({ sliceHeight, setSliceHeight, onSlice, isProcessing }) => {
    return (
        <div className="controls-container">
            <div className="input-group">
                <label htmlFor="sliceHeight">Slice Height (px)</label>
                <input
                    type="number"
                    id="sliceHeight"
                    value={sliceHeight}
                    onChange={(e) => setSliceHeight(Number(e.target.value))}
                    min="1"
                    placeholder="e.g. 1000"
                />
            </div>
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
