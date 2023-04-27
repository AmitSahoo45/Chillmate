import React, { useContext, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import { jsPDF } from "jspdf"
import axios from 'axios';
import { useRouter } from 'next/router'
import Modal from 'react-modal';
import { AiOutlineClose } from 'react-icons/ai'

import { ContextStore } from '../../../../constants/context/Context';
import Head from 'next/head';

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

const NewNote = () => {
    const router = useRouter()
    const { slug } = router.query

    const [header, setHeader] = useState('');
    const [desc, setDesc] = useState('');
    const [tags, setTags] = useState('');
    const [note, setNote] = useState('');
    const [renderingText, setrenderingText] = useState('');
    const [modalIsOpen, setIsOpen] = useState(false)
    const NoteRef = useRef(null);

    const { user } = useContext(ContextStore)

    const sanitizeText = (text) => {
        const allowedTags = ['b', 'i', 'u', 'span', 'br', 'code'];
        const allowedAttributes = {
            'span': ['style', 'color'],
            'b': [],
            'i': [],
            'u': [],
            'code': ['*']
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
                .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>')
                .replace(/^(#{1,6})\s*(.*?)$/gm, function (match, p1, p2) {
                    return '<h' + p1.length + '>' + p2.trim() + '</h' + p1.length + '>';
                })
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
                    "<div class='text-theme-ferrari-red'><a href='$2' target='_blank' rel='noreferrer'>$1</a></div>")
                .replace(/--b--/g, '<div class="border-t border-red-500 mx-auto w-full"></div>');


            return sanitizedText;
        } catch (error) {
            toast.error('Oops! Something went wrong.')
            sanitizedText = text;
        }
        return sanitizedText;
    }

    const DownloadContent = () => {
        try {
            const doc = new jsPDF({
                orientation: "p",
                unit: "em",
                format: [2000, 730]
            });

            doc.html(NoteRef.current, {
                callback: function (doc) {
                    doc.save("Note.pdf");
                },
                x: 30,
                y: 30,
                putOnlyUsedFonts: true,
            });
        }
        catch (err) {
            toast.error('Something went wrong');
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedText = sanitizeText(note);
        setrenderingText(sanitizedText)
    }

    const toggleModal = () => setIsOpen(!modalIsOpen)

    const SaveNote = async (e) => {
        e.preventDefault();
        try {
            if (!header || !desc || !tags || !note) {
                toast.error('Please fill all the fields')
                return;
            }

            if (user.isPresent) {
                const loadingToast = toast.info('Saving note...');

                await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/create`, {
                    header,
                    desc,
                    tags,
                    content: note,
                    userGleID: user.uid,
                    Subject: slug,
                    name: user.name,
                    photoURL: user.photoURL,
                    email: user.email,
                    googleID: user.uid
                })

                toast.dismiss(loadingToast);
                toast.success('Note saved successfully');

                router.push(`/subject/notes/${slug}`);
            }
        } catch (error) {
            toast.error(error.response.data.message)
        }
    }

    return (
        <>
            <div className='flex flex-col my-5 relative'>
                <Head>
                    <title>Create New Note</title>
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
                            className='font-poppins whitespace-pre-line'
                            ref={NoteRef}
                            dangerouslySetInnerHTML={{ __html: renderingText }}
                        >
                        </div>
                    </div>
                    {/* ------------------------------------------ */}
                </div>
                <div className="border-t-2 border-[var(--ferrari-red)] mx-auto w-full"></div>
                <div className='flex justify-center items-center flex-col'>
                    <div>
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
                    <div>
                        <button
                            className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
                            onClick={SaveNote}
                        >
                            Save Note
                        </button>
                    </div>
                </div>
                <div className="fixed right-11 bottom-11">
                    <button
                        className="bg-[var(--ferrari-red)] text-white mt-5 rounded-full h-14 w-14"
                        onClick={toggleModal}
                    >
                        Docs
                    </button>
                </div>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={toggleModal}
                style={customStyles}
                contentLabel="Example Modal"
            >
                <div className='flex flex-col w-full'>
                    <div className="flex justify-end items-center px-5 text-xl">
                        <button onClick={() => setIsOpen(false)}>
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
                                            &color&..text...&color&
                                        </td>
                                        <td class="px-6 py-2">
                                            will color the text between the two ampersands with the color specified in the first ampersand.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td scope="row" class="px-6 py-2">
                                            #heading
                                        </td>
                                        <td class="px-6 py-2">
                                            used for heading tags. The number of hashtags determines the heading tag. For eg. ###heading will be replaced with <code className='text-red-600'>h3</code> tag.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td scope="row" class="px-6 py-2">
                                            |u|..text...|u|
                                        </td>
                                        <td class="px-6 py-2">
                                            will underline the text between the two pipes.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td scope="row" class="px-6 py-2">
                                            [link](url)
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