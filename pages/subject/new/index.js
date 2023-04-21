import React, { useContext, useState } from 'react'
import { ContextStore } from '../../../constants/context/Context'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useRouter } from 'next/router'


const CreateSubject = () => {
    const { user } = useContext(ContextStore)
    const router = useRouter()

    const [subjectDetails, setSubjectDetails] = useState({
        Subname: '',
        Subdesc: '',
        Subtags: ''
    })

    const subjectCreate = async (e) => {
        e.preventDefault()
        try {
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/create`, {
                ...subjectDetails,
                userGleID: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL
            })

            toast.success(data.message)
            router.push('/subject')
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    return (
        <main className="container mx-auto text-center my-5">
            <h1 className="text-2xl">Create Subject</h1>
            <div className="border-b-2 border-theme-ferrari-red w-1/5 mx-auto pb-2 mb-4"></div>
            <form
                className="flex flex-col w-4/5 mx-auto"
                onSubmit={subjectCreate}
            >
                <div className="flex flex-col">
                    <input
                        type="text"
                        name="Subname"
                        id="Subname"
                        className="border-2 rounded-md p-2 focus:outline-none"
                        placeholder='Subject Name'
                        value={subjectDetails.Subname}
                        onChange={(e) => setSubjectDetails({ ...subjectDetails, Subname: e.target.value })}
                    />
                </div>
                <div className="flex flex-col mt-5">
                    <textarea
                        name="Subdesc"
                        id="Subdesc"
                        cols="30"
                        rows="10"
                        className="border-2 rounded-md p-2 focus:outline-none"
                        placeholder='Subject Description'
                        value={subjectDetails.Subdesc}
                        onChange={(e) => setSubjectDetails({ ...subjectDetails, Subdesc: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex flex-col mt-5">
                    <input
                        type="text"
                        name="Subtags"
                        id="Subtags"
                        className="border-2 rounded-md p-2 focus:outline-none"
                        placeholder='Subject Tags (Comma separated)'
                        value={subjectDetails.Subtags}
                        onChange={(e) => setSubjectDetails({ ...subjectDetails, Subtags: e.target.value })}
                    />
                </div>
                <div className="flex flex-col mt-5">
                    <button
                        type="submit"
                        className="bg-theme-ferrari-red text-white px-4 py-2 rounded-md"
                    >
                        Create Subject
                    </button>
                </div>
            </form>
        </main>
    )
}

export default CreateSubject