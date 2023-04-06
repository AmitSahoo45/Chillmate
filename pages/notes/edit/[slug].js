import React, { useContext, useEffect, useRef, useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router'
import DOMPurify from 'dompurify';
import axios from 'axios'

import { Loader } from '../../../components';
import { ContextStore } from '../../../constants/context/Context';
import { toast } from 'react-toastify';

const EditTextNotes = () => {
    const router = useRouter()
    const { slug } = router.query

    const [header, setHeader] = useState('');
    const [desc, setDesc] = useState('');
    const [tags, setTags] = useState('');
    const [EditNote, setEditNote] = useState('');
    const [renderingText, setrenderingText] = useState('');
    const [isLoading, setIsLoading] = useState(false)
    const NoteRef = useRef(null);

    const { user } = useContext(ContextStore)

    const getNote = async () => {
        try {
            setIsLoading(true)
            const { data: { note } } = await axios.get(`https://backend-b7h6.onrender.com/v1/textnotes/${slug}`)
            console.log(note)
            setHeader(note.header)
            setDesc(note.desc)
            setTags(note.tags.join(','))
            setEditNote(note.content)
            setIsLoading(false)
        } catch (error) {
            toast.error('Failed to fetch note. Pls refresh')
        }
    }

    const sanitizeText = (text) => {
        const allowedTags = ['b', 'i', 'u', 'span', 'br'];
        const allowedAttributes = {
            'span': ['style', 'color'],
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

            sanitizedText = sanitizedText
                .replace(/&([\w#]+)&(.*?)&\1&/g, '<span style="color:$1">$2</span>')
                .replace(/\$n+/g, function (match) {
                    return '<br>'.repeat(match.length - 1);
                })
                .replace(/\$t+/g, function (match) {
                    return '&nbsp;'.repeat(match.length * 4);
                })
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>')
                .replace(/~(.*?)~/g, '<s>$1</s>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>')
                .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>');

            return sanitizedText;
        } catch (error) {
            console.log(error);
            sanitizedText = text;
            toast.error('Oops! Something went wrong.')
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedText = sanitizeText(EditNote);
        setrenderingText(sanitizedText);

        console.log("NoteRef", NoteRef.current);
    };

    const SaveNote = async () => {
        const loadingToast = toast.info('Saving note...');
        try {

            const { data: { note } } = await axios.patch(`https://backend-b7h6.onrender.com/v1/textnotes/${slug}`, {
                header,
                desc,
                tags,
                content: EditNote,
                userGleID: user?.uid,
            });

            toast.dismiss(loadingToast);
            toast.success('Note saved successfully');

            router.push('/notes');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response.data.message);
        }
    };

    useEffect(() => {
        getNote()
    }, [user]);

    return (
        <div className='flex flex-col my-5 relative'>
            <Head>
                <title>Edit Note</title>
            </Head>
            <h3 className='text-theme-ferrari-red text-xl border-b-2 border-theme-ferrari-red text-center mb-3 font-poppins w-4/5 mx-auto'>
                <span className='font-medium text-3xl'>E</span>dit&nbsp;
                <span className='font-medium text-3xl'>N</span>ote
            </h3>
            {
                isLoading ?
                    <Loader /> :
                    <>
                        <div className="w-4/5 mx-auto">
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
                            <div className="flex flex-col">
                                <label
                                    htmlFor="tags"
                                    className="font-montserrat text-lg my-3"
                                >
                                    Tags
                                </label>
                                <textarea name="tags" id="tags"
                                    value={tags}
                                    className="border border-[var(--ferrari-red)] rounded-md p-2 focus:outline-none w-full"
                                    onChange={(e) => setTags(e.target.value)}
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
                                        value={EditNote}
                                        className="border-r-2 border-[var(--ferrari-red)] p-3 focus:outline-none overflow-y-scroll"
                                        style={{ maxHeight: "500px", minHeight: "500px" }}
                                        onChange={(e) => setEditNote(e.target.value)} />
                                </div>
                            </div>
                            {/* ------------------------------------------ */}

                            {/* ------------------------------------------ */}
                            {/* Rendering Part */}
                            <div className="flex-[0.5] p-2 h-[500px] overflow-y-scroll scrollbar-hidden">
                                <div
                                    className='font-poppins'
                                    ref={NoteRef}
                                    dangerouslySetInnerHTML={{ __html: renderingText }}
                                >
                                </div>
                            </div>
                            {/* ------------------------------------------ */}
                        </div>
                        <div className="border-t-2 border-[var(--ferrari-red)] mx-auto w-full"></div>
                        <div className='flex flex-col w-2/5 items-center mx-auto'>
                            <button onClick={handleSubmit}
                                className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
                            >
                                Check Docs
                            </button>
                            <button
                                className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
                                onClick={SaveNote}
                            >
                                Save Note
                            </button>
                        </div>
                    </>
            }
        </div>
    )
}

export default EditTextNotes