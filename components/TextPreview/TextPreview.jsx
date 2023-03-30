import React from 'react';

function TextPreview({ text }) {
    return (
        <div dangerouslySetInnerHTML={{ __html: text }}></div>
    );
}

export default TextPreview;
