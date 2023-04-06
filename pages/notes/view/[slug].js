import React, { useState, useRef, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'

import { ContextStore } from '../../../constants/context/Context'
import axios from 'axios'

const NotesView = () => {
    const router = useRouter()
    const { slug } = router.query

    const [Note, setNote] = useState({
        header: '',
        desc: '',
        tags: ''
    })
    const [renderingText, setrenderingText] = useState('');
    const NoteRef = useRef(null)

    const { user } = useContext(ContextStore)

    const getNote = async () => {
        try {
            if (slug) {
                const { data: { note } } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/textnotes/${slug}`)
                let content = note.content

                content = content
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

                setrenderingText(content)

                setNote({
                    header: note.header,
                    desc: note.desc,
                    tags: note.tags.join(','),
                })
            }
        } catch (error) {
            toast.error(error.response.data.message)
        }
    }

    useEffect(() => {
        getNote()
    }, [user, slug]);

    return (
        <div className='w-4/5 mx-auto my-5'>
            <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold'>{Note.header}</h1>
                <div className='flex items-center'>
                    <button className='px-4 py-2 rounded-md mr-4 border border-theme-ferrari-red bg-transparent'>Edit</button>
                    <button className='bg-red-500 text-white px-4 py-2 rounded-md'>Delete</button>
                </div>
            </div>
            <div className='flex flex-col mt-2'>
                <p className='text-sm'>{Note.desc}</p>
                <div className='text-sm mt-3'>
                    {Note.tags.split(',').map((tag, index) => (
                        <span key={index} className='bg-gray-100 px-2 py-1 rounded-sm mr-2 text-theme-forest-green'>{tag}</span>
                    ))}
                </div>
            </div>
            <hr className='my-5' />
            <div
                className='font-poppins'
                ref={NoteRef}
                dangerouslySetInnerHTML={{ __html: renderingText }}
            >
            </div>
        </div>
    )
}

export default NotesView