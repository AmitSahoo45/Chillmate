import React, { useState, useRef, useContext, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import axios from 'axios'
import jsPDF from 'jspdf'
import moment from 'moment/moment'

import { Loader } from '../../../../components'
import { ContextStore } from '../../../../constants/context/Context'

const NotesView = ({ note }) => {
    if (!note) {
        return (
            <div className="my-2 flex flex-col items-center justify-center">
                <p className="my-3">Oops!!! Something went wrong. Please refresh this page</p>
                <Loader />
            </div>
        )
    }
    const router = useRouter()
    const { slug } = router.query
    const { user } = useContext(ContextStore)

    const IsPresent = 'bg-theme-orange text-white'
    const IsNotPresent = 'bg-slate-200 cursor-not-allowed'

    const [Note, setNote] = useState({
        userGleID: note.userGleID,
        header: note.header,
        desc: note.desc,
        tags: note.tags.join(','),
        UserRef: note.UserRef,
        createdAt: note.createdAt
    })
    const [renderingText, setrenderingText] = useState(note.content);
    const NoteRef = useRef(null)

    // const getNote = async () => {
    //     try {
    //         setIsLoading(true)
    //         const { data: { note } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${slug}`)
    //         let content = note.content
    //         console.log(note)
    //         content = content
    //             .replace(/&([\w#]+)&(.*?)&\1&/g, '<span style="color:$1">$2</span>')
    //             .replace(/\$n+/g, function (match) {
    //                 return '<br>'.repeat(match.length - 1);
    //             })
    //             .replace(/\$t+/g, function (match) {
    //                 return '&nbsp;'.repeat(match.length * 4);
    //             })
    //             .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    //             .replace(/\*(.*?)\*/g, '<i>$1</i>')
    //             .replace(/~(.*?)~/g, '<s>$1</s>')
    //             .replace(/__(.*?)__/g, '<u>$1</u>')
    //             .replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>')
    //             .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>')
    //             .replace(/^(#{1,6})\s*(.*?)$/gm, function (match, p1, p2) {
    //                 return '<h' + p1.length + '>' + p2.trim() + '</h' + p1.length + '>';
    //             })
    //             .replace(/`([^`]+)`/g, '<code>$1</code>');

    //         setrenderingText(content)

    //         setNote({
    //             userGleID: note.userGleID,
    //             header: note.header,
    //             desc: note.desc,
    //             tags: note.tags.join(','),
    //             UserRef: note.UserRef,
    //             createdAt: note.createdAt
    //         })
    //         setIsLoading(false)
    //     } catch (error) {
    //         toast.error(error.response.data.message)
    //     }
    // }

    const DownloadContent = () => {
        try {
            const doc = new jsPDF({
                orientation: "l",
                unit: "px",
                format: [1200, 500],
                fontSize: 10
            });

            doc.html(NoteRef.current, {
                callback: function (doc) {
                    doc.save(`${Note.header}.pdf`);
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

    // useEffect(() => {
    //     // if (slug)
    //     //     getNote()
    // }, [user, slug]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return (
        <div className='w-4/5 mx-auto my-5'>
            <Head>
                <title>Note - Chillmate | {Note.header}</title>
                <meta property="og:title" content={`Edit Note | ${Note.header}`} />
                <meta property="og:description" content={Note.desc} />
                <meta property="og:image" content={Note.UserRef?.profilePic} />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/v1/textnotes/${slug}`} />
                <meta property="og:type" content="website" />
            </Head>
            {
                note &&
                <main>
                    <div className='flex justify-between items-center flex-col sm:flex-row'>
                        <h1 className='text-2xl font-bold'>{Note.header}</h1>
                        <div className='flex items-center my-3 sm:mt-0'>
                            <button
                                className={`px-3 py-2 rounded-md mr-4 
                            ${Note.userGleID != user?.uid ? IsNotPresent : IsPresent}`}
                                onClick={() => router.push(`/subject/notes/edit/${slug}`)}
                                disabled={Note.userGleID != user?.uid}
                            >Edit</button>
                            <button
                                disabled={Note.userGleID != user?.uid}
                                className={`px-3 py-2 rounded-md mr-4 
                            ${Note.userGleID != user?.uid ? IsNotPresent : IsPresent}`}
                            >
                                Delete
                            </button>
                            <button className='px-3 py-2 rounded-md mr-4 bg-theme-orange text-white' onClick={DownloadContent}>Download</button>
                        </div>
                    </div>
                    <div className='flex flex-col mt-2'>
                        <p className='text-sm'>{Note.desc}</p>
                        <div className='text-sm mt-3 flex flex-wrap'>
                            {Note.tags.split(',').map((tag, index) => (
                                <span key={index} className='bg-gray-100 px-2 py-1 rounded-sm mr-2 mt-2 sm:mt-0 text-theme-forest-green'>{tag}</span>
                            ))}
                        </div>
                        <div className='mt-4 flex items-center flex-wrap sm:flex-nowrap'>
                            <p className='mb-2 text-sm mr-2'>Created by : </p>
                            <div className="flex items-center">
                                <div
                                    className="inline-flex items-center justify-center rounded-full bg-gray-300 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                                    style={{ width: 35, height: 35 }}
                                >
                                    <img
                                        src={Note.UserRef.photoURL}
                                        alt={Note.UserRef.name}
                                        aria-hidden="true"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className='ml-3 text-sm'>{Note.UserRef.name}</span>
                                <span className='ml-3 text-sm'>
                                    on {moment(Note.createdAt).format('DD MMMM YYYY')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <hr className='my-5' />
                    <div
                        className='font-poppins whitespace-pre-line'
                        ref={NoteRef}
                        dangerouslySetInnerHTML={{ __html: renderingText }}
                    >
                    </div>
                </main>
            }
        </div>
    )
}

export const getServerSideProps = async (context) => {
    const { slug } = context.query;
    try {
        const { data: { note } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${slug}`)
        return { props: { note } };
    } catch (error) {
        return { props: { note: null } };
    }
};

export default NotesView