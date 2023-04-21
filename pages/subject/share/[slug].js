import React, { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import axios from 'axios'
import { ContextStore } from '../../../constants/context/Context'

const ShareSubject = () => {
    const router = useRouter()
    const { slug } = router.query
    const { user } = useContext(ContextStore)

    const fetchSubject = async (id) => {
        try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/all/${id}`)
            console.log(data)
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user.isPresent && slug)
            fetchSubject(slug)
    }, [user.isPresent, slug])

    return (
        <main className='mx-auto container'>
            
        </main>
    )
}

export default ShareSubject