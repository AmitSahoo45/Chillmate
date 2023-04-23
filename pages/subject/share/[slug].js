import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { toast } from 'react-toastify'
import axios from 'axios'
import moment from 'moment'
import jsPDF from 'jspdf'

import { ContextStore } from '../../../constants/context/Context'

const ShareSubject = () => {
    const router = useRouter()
    const { slug } = router.query
    const { user } = useContext(ContextStore)

    const [subject, setSubject] = useState(null)
    const [notes, setNotes] = useState([])

    const fetchSubject = async (id) => {
        try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/share/${id}`)
            console.log(data)
            setSubject(data.subject)
            setNotes(data.notes)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const DownloadContent = async (id) => {
        try {
            const { data: { content: { content } } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/content/${id}`)
            // download content as a pdf using jspdf
            const doc = new jsPDF('l', 'mm', [1200, 1210]);
            doc.html(content, {
                callback: function (doc) {
                    doc.save(`${subject.Subname}.pdf`);
                },
                x: 10,
                y: 10
            });
        }
        catch (err) {
            toast.error(err.message);
        }
    }

    const CopyURL = (id) => {
        navigator.clipboard.writeText(`https://chillmate.vercel.app/subject/notes/view/${id}`)
        toast.success('Copied to clipboard')
    }

    useEffect(() => {
        if (user.isPresent || slug)
            fetchSubject(slug)
    }, [user.isPresent, slug])

    return (
        <>
            <Head>
                <title>{subject?.Subname} | ChillMate</title>
            </Head>
            <main className='mx-auto container'>
                <div className='flex flex-col justify-center my-5'>
                    <h1 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-3 border-theme-orange font-medium'>{subject?.Subname}</h1>
                    <h3 className='whitespace-pre-line text-gray-700 mb-4'>{subject?.Subdesc}</h3>
                    <p className='text-gray-500 flex items-center'>
                        By: {subject?.UserRef?.name} on {moment(subject?.createdAt).format('DD MMM YYYY')}
                    </p>
                </div>
                <div className='flex flex-col justify-center my-5'>
                    <h3 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-1 text-center sm:text-left sm:mx-0 mx-auto border-theme-orange font-medium'>Notes</h3>
                    <div className='flex flex-col mx-4 sm:mr-0 sm:ml-0'>
                        {notes.map(note => (
                            <div key={note._id} className='flex flex-col justify-center my-3 border p-3 rounded shadow-lg'>
                                <h1 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-2 border-theme-orange font-medium'>{note.header}
                                </h1>
                                <h3 className='whitespace-pre-line text-gray-700 mb-1'>{note.desc}</h3>
                                <div>
                                    <button
                                        className='bg-theme-orange text-white px-2 py-1 rounded shadow-md mr-2 text-xs mb-2'
                                        onClick={() => DownloadContent(note._id)}
                                    >Download</button>
                                    <button
                                        className='bg-theme-orange text-white px-2 py-1 rounded shadow-md mr-2 text-xs mb-2'
                                        onClick={() => router.push(`/subject/notes/view/${note._id}`)}
                                    >View</button>
                                    <button
                                        className='bg-theme-orange text-white px-2 py-1 rounded shadow-md mr-2 text-xs mb-2'
                                        onClick={() => CopyURL(note._id)}
                                    >Share</button>
                                </div>
                                <p className='text-gray-500 flex items-center text-sm'>
                                    By: {note.UserRef?.name} on {moment(note.createdAt).format('DD MMM YYYY')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}

export default ShareSubject