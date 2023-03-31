import React, { useRef, useState } from 'react'
import Head from 'next/head';

import DOMPurify from 'dompurify';
import { jsPDF } from "jspdf"

const NewNote = () => {
    const [header, setHeader] = useState('');
    const [desc, setDesc] = useState('');
    const [note, setNote] = useState('');
    const [renderingText, setrenderingText] = useState('');

    const NoteRef = useRef(null);

    const sanitizeText = (text) => {
        const allowedTags = ['b', 'i', 'u', 'span', 'br'];
        const allowedAttributes = {
            'span': ['style', '#'],
            'b': [],
            'i': [],
            'u': []
        };

        let sanitizedText

        try {
            sanitizedText = DOMPurify.sanitize(text, {
                ALLOWED_TAGS: allowedTags,
                ALLOWED_ATTR: allowedAttributes
            });

            sanitizedText = sanitizedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>')
                .replace(/~(.*?)~/g, '<s>$1</s>')
                .replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>')
                .replace(/&([\w#]+)#(.*?)&\1#/g, '<span style="color: $1">$2</span>')
                .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>')
                .replace(/\$n/g, "<br>")
                .replace(/\$t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")

            return sanitizedText;
        } catch (error) {
            console.log(error);
            sanitizedText = text;
        }
        return sanitizedText;
    };

    const DownloadContent = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [NoteRef.current.offsetWidth, NoteRef.current.offsetHeight]
        });
        
        // Set font size to 10
        doc.setFontSize(10);
    
        doc.html(NoteRef.current, {
            callback: function (doc) {
                doc.save("Note.pdf");
            },
            x: 10,
            y: 10,
        }); 
    }
    

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedText = sanitizeText(note);
        setrenderingText(sanitizedText);

        console.log("NoteRef", NoteRef.current);
    };

    return (
        <div className='flex flex-col my-5'>
            <Head>
                Create new Note
            </Head>
            <div className="w-4/5 mx-auto ">
                <h3 className="font-montserrat text-xl">
                    Create New Note
                </h3>
                <div className="flex flex-col">
                    <label
                        htmlFor="header"
                        className="font-montserrat text-lg my-3"
                    >
                        Note Header
                    </label>
                    <input type="text" name="header" id="header"
                        value={header}
                        className="border border-[var(--ferrari-red)] rounded-md p-2 focus:outline-none"
                        onChange={(e) => setHeader(e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="desc"
                        className="font-montserrat text-lg my-3"
                    >
                        Note Description
                    </label>
                    <textarea name="desc" id="desc"
                        value={desc}
                        className="border border-[var(--ferrari-red)] rounded-md p-2 focus:outline-none w-full"
                        onChange={(e) => setDesc(e.target.value)}
                        rows={2}
                    />
                </div>
            </div>
            <div className="border-t-2 border-[var(--ferrari-red)] mx-auto w-full mt-8"></div>
            <div className='flex'>
                {/* ------------------------------------------ */}
                {/* Typing Part */}
                <div className="flex-[0.5]">
                    <div className="flex flex-col">
                        <textarea name="note" id="note"
                            rows={10}
                            value={note}
                            className="border-r-2 border-[var(--ferrari-red)] p-3 focus:outline-none overflow-y-scroll"
                            style={{ maxHeight: "500px", minHeight: "500px" }}
                            onChange={(e) => setNote(e.target.value)} />
                    </div>
                </div>
                {/* ------------------------------------------ */}

                {/* ------------------------------------------ */}
                {/* Rendering Part */}
                <div className="flex-[0.5] p-2 h-[500px] overflow-y-scroll scrollbar-hidden">
                    <div
                        ref={NoteRef}
                        dangerouslySetInnerHTML={{ __html: renderingText }}
                    >
                    </div>
                </div>
                {/* ------------------------------------------ */}
            </div>
            <div className="border-t-2 border-[var(--ferrari-red)] mx-auto w-full"></div>
            <div className='flex justify-center'>
                <button
                    className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
                    onClick={handleSubmit}
                >
                    Check Docs
                </button>
                <button
                    className={`px-4 py-2 mt-5 ml-3 rounded-md ${renderingText === '' ? 'bg-slate-300 cursor-not-allowed' : 'bg-[var(--ferrari-red)] text-white cursor-pointer'}`}
                    onClick={DownloadContent}
                    disabled={renderingText === ''}
                >
                    Download
                </button>
            </div>
        </div>
    )
}


export default NewNote

{/* <main className='flex flex-col justify-center w-11/12 mx-auto'>
<h3>Make Notes</h3>
<div className="flex flex-col">
    <label htmlFor="note">Note</label>
    <textarea name="note" id="note"
        rows={10}
        value={note}
        className="border border-[var(--ferrari-red)] rounded-md p-2 focus:outline-none"
        onChange={(e) => setNote(e.target.value)} />
</div>
<button
    className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
    onClick={handleSubmit}
>Add Note</button>
<div
    ref={NOTE}
     />

<div className="hidden">
    {note}
</div>
</main>
<button onClick={DownloadContent}>
Download
</button> */}