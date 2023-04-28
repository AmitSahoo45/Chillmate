import React, { useContext, useEffect, useRef, useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router'
import DOMPurify from 'dompurify';
import axios from 'axios'
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { AiOutlineClose } from 'react-icons/ai'

import { Loader } from '../../../../components';
import { ContextStore } from '../../../../constants/context/Context';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
    },
}

Modal.setAppElement('#__next')

const EditTextNotes = () => {
    const router = useRouter()
    const { slug } = router.query

    const [header, setHeader] = useState('');
    const [desc, setDesc] = useState('');
    const [tags, setTags] = useState('');
    const [EditNote, setEditNote] = useState('');
    const [renderingText, setrenderingText] = useState('');
    const [subject, setSubject] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [modalIsOpen, setIsOpen] = useState(false)
    const NoteRef = useRef(null);

    const { user } = useContext(ContextStore)

    const getNote = async () => {
        try {
            setIsLoading(true)
            const { data: { note } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${slug}`)
            setHeader(note.header)
            setDesc(note.desc)
            setTags(note.tags.join(','))
            setEditNote(note.content)
            setSubject(note.Subject)
            setIsLoading(false)
        } catch (error) {
            toast.error('Failed to fetch note. Pls refresh')
        }
    }

    const sanitizeText = (text) => {
        const allowedTags = ['b', 'i', 'u', 'span', 'br', 'code', 'table', 'tbody', 'thead', 'tr', 'th', 'td'];
        const allowedAttributes = {
            'span': ['style', 'color'],
            'b': [],
            'i': [],
            'u': [],
            'code': ['*'],
            'table': ['class'],
            'tbody': ['class'],
            'thead': ['class'],
            'tr': ['class'],
            'th': ['class'],
            'td': ['class']
        };

        let sanitizedText

        try {
            sanitizedText = DOMPurify.sanitize(text, {
                ALLOWED_TAGS: allowedTags,
                ALLOWED_ATTR: allowedAttributes,
                ADD_TAGS: ['tbody', 'thead']
            });
            sanitizedText = text

            sanitizedText = sanitizedText
                .replace(/&r(.*?)&r/g, '<span style="color:#ff0000">$1</span>')
                .replace(/&y(.*?)&y/g, '<span style="color:#fdff32">$1</span>')
                .replace(/&g(.*?)&g/g, '<span style="color:#39FF14">$1</span>')
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
                .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>')
                .replace(/^(#{1,6})\s*(.*?)$/gm, function (match, p1, p2) {
                    const size = p1.length * 0.5;
                    return `<h${p1.length} style="font-size: ${size}rem">${p2.trim()}</h${p1.length}>`;
                })
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
                    "<div class='text-theme-ferrari-red'><a href='$2' target='_blank' rel='noreferrer'>$1</a></div>")
                .replace(/--b--/g, '<div class="border-t border-red-500 mx-auto w-full mt-3"></div>')
                .replace(/\|([^|]+)\|/g, '<u>$1</u>');

            // .replace(/&([\w#]+)&(.*?)&\1&/g, '<span style="color:$1">$2</span>')
            // .replace(/\|(.+)\|/g, (_, p1) => `<tr>${p1.trim().split('|').map(cell => `<td>${cell.trim()}</td>`).join('')}</tr>`)
            // .replace(/<tr>/g, '<tbody>').replace(/<\/td>\s*<\/tr>/g, '</td></tr></tbody>')
            // .replace(/<td>/g, '<td class="border border-gray-300 px-2 py-1">')

            return sanitizedText;
        } catch (error) {
            toast.error('Oops! Something went wrong.')
            sanitizedText = text;
            toast.error('Oops! Something went wrong.')
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedText = sanitizeText(EditNote);
        setrenderingText(sanitizedText);
    };

    const SaveNote = async () => {
        const loadingToast = toast.info('Saving note...');
        try {

            const { data: { note } } = await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${slug}`, {
                header,
                desc,
                tags,
                content: EditNote,
                userGleID: user?.uid,
            });

            toast.dismiss(loadingToast);
            toast.success('Note saved successfully');

            router.push(`/subject/notes/${subject}`);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response.data.message);
        }
    };

    const toggleModal = () => setIsOpen(!modalIsOpen)

    useEffect(() => {
        if (slug)
            getNote()
    }, [slug]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return (
        <div className='flex flex-col my-5 relative'>
            <Head>
                <title>Edit Note | {header}</title>
                <meta property="og:title" content={`Edit Note | ${header}`} />
                <meta property="og:description" content={desc} />
                <meta property="og:image" content={EditNote} />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/subject/notes/${slug}`} />
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
                            <p className="text-red-500 mt-3">
                                For documentation on how to create notes, please click on the docs button on the bottom right of your screen
                            </p>
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
                                    className='font-poppins whitespace-pre-line'
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
                        <div className="fixed right-11 bottom-11">
                            <button
                                className="bg-[var(--ferrari-red)] text-white mt-5 rounded-full h-14 w-14"
                                onClick={toggleModal}
                            >
                                Docs
                            </button>
                        </div>
                        <Modal
                            isOpen={modalIsOpen}
                            onRequestClose={toggleModal}
                            style={customStyles}
                            contentLabel="Example Modal"
                        >
                            <div className='flex flex-col w-full'>
                                <div className="flex justify-end items-center px-5 text-xl">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <AiOutlineClose />
                                    </button>
                                </div>
                                <div>
                                    <div class="relative overflow-x-auto">
                                        <table class="w-full text-sm text-left">
                                            <thead>
                                                <tr>
                                                    <td scope="col" class="px-6 py-2">
                                                        Syntax
                                                    </td>
                                                    <td scope="col" class="px-6 py-2">
                                                        Meaning
                                                    </td>
                                                </tr>
                                            </thead>
                                            <tbody className='text-xs'>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        $t+
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        Replaces all instances of `$t+` with <code className='text-red-600'>4 tabular space</code> tags, where `t+` is any number. For eg. $tt will be replaced with <code className='text-red-600'>8 tabular space</code> tags twice.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        **bold**
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will bold the text between the two asterisks.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        *italic*
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will italicize the text between the two asterisks.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        ***bold and italics***
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will bold and italicize the text between the three asterisks.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        ~strikethrough~
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will strikethrough the text between the two tildes.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        &rtext&r or &gtext&g or &ytext&y
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will color the text between the ampersand and the letter with the color of the letter. For eg. &rtext&r will color the text red.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        #heading
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        used for headers. The number of #s will determine the font size of the header.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        |text| or |u|text|u|
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will underline the text between the two pipes.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        [Text](url link)
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will create a link with the text between the square brackets and the url between the parentheses.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        --b--
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will create a horizontal line.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td scope="row" class="px-6 py-2">
                                                        `code`
                                                    </td>
                                                    <td class="px-6 py-2">
                                                        will create a code block.
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                    </>
            }
        </div>
    )
}

export default EditTextNotes