import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { toast } from 'react-toastify'
import axios from 'axios'
import moment from 'moment'

import { Loader } from '../../../components'

const ShareSubject = ({ Notes, Subject }) => {
    const router = useRouter()
    const { slug } = router.query

    const [subject, setSubject] = useState(null)
    const [notes, setNotes] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const CopyURL = (id) => {
        navigator.clipboard.writeText(`https://chillmate.vercel.app/subject/notes/view/${id}`)
        toast.success('Copied to clipboard')
    }

    useEffect(() => {
        if (!Notes || !Subject)
            setIsLoading(true)

        if (Notes && Subject) {
            setIsLoading(false)
            setSubject(Subject)
            setNotes(Notes)
        }
    }, [Notes, Subject])

    return (
        <>
            <Head>
                <title>{Subject.Subname} | ChillMate</title>
                <meta property="og:title" content={`${Subject.Subname} | Chillmate`} />
                <meta name="og:description" content={Subject.Subdesc} />
                <meta property="og:url" content={`https://chillmate.vercel.app/subject/share/${slug}`} />
                <meta property="og:type" content="website" />
            </Head>
            {
                isLoading ? <Loader /> :
                    <main className='sm:mx-auto container px-4'>
                        <div className='flex flex-col justify-center my-5'>
                            <h1 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-3 border-theme-orange font-medium'>{subject?.Subname}</h1>
                            <h3 className='whitespace-pre-line text-gray-700 mb-4'>{subject?.Subdesc}</h3>
                            <div className='mb-4 flex flex-wrap'>
                                {subject?.Subtags?.map(tag => (
                                    <span key={tag} className='bg-gray-100 px-2 py-1 rounded-sm mr-2 mt-2 sm:mt-0 text-theme-forest-green'>{tag}</span>
                                ))}
                            </div>
                            <p className='text-gray-500 flex items-center'>
                                By:
                                <div>
                                    <img src={subject?.UserRef?.photoURL} alt={subject?.UserRef?.name} className='w-8 h-8 rounded-full mx-2' />
                                </div>
                                {subject?.UserRef?.name} on {moment(subject?.createdAt).format('DD MMM YYYY')}
                            </p>
                        </div>
                        <div className='flex flex-col justify-center my-5'>
                            <h3 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-1 text-center sm:text-left sm:mx-0 mx-auto border-theme-orange font-medium'>Notes</h3>
                            <div className='flex flex-col mx-4 sm:mr-0 sm:ml-0'>
                                {notes.map(note => (
                                    <div key={note._id} className='flex flex-col justify-center my-3 border p-3 rounded shadow-lg'>
                                        <h1 className='text-xl text-gray-800 leading-loose border-b-2 w-4/5 mb-2 border-theme-orange font-medium'>{note.header}
                                        </h1>
                                        <h3 className='whitespace-pre-line text-gray-700 mb-1'>
                                            {note.desc.substr(0, 160)}
                                            {note.desc.length > 160 && '...'}
                                        </h3>
                                        <div>
                                            <button
                                                className='bg-theme-orange text-white px-2 py-1 rounded shadow-md mr-2 text-xs mb-2'
                                                onClick={() => router.push(`/subject/notes/view/${note._id}`)}
                                            >View and Download</button>
                                            <button
                                                className='bg-theme-orange text-white px-2 py-1 rounded shadow-md mr-2 text-xs mb-2'
                                                onClick={() => CopyURL(note._id)}
                                            >Share</button>
                                        </div>
                                        <p className='text-gray-500 flex items-center text-sm'>
                                            Created on {moment(note.createdAt).format('DD MMM YYYY')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
            }
        </>
    )
}

export async function getServerSideProps(context) {
    const { slug } = context.query
    try {
        const { data: { notes, subject } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/share/${slug}`)
        return { props: { Notes: notes, Subject: subject } }
    } catch (error) {
        return { props: { Notes: null, Subject: null } }
    }
}


export default ShareSubject