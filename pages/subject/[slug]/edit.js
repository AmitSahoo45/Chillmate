import React, { useContext, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { selectSubjects } from '../../../store/slices/subject'
import { ContextStore } from '../../../constants/context/Context'

const EditChapter = () => {
    const router = useRouter()
    const { user } = useContext(ContextStore)
    const { slug } = router.query
    let { subjects } = useSelector(selectSubjects)
    subjects = subjects?.filter((sub) => sub._id == slug)[0]

    const [subjectDetails, setSubjectDetails] = useState({
        Subname: subjects?.Subname,
        Subdesc: subjects?.Subdesc,
        // convert the array to string seperated by comma(,) 
        Subtags: subjects?.Subtags?.join(', ')
    })

    const updateSubject = async (e) => {
        e.preventDefault()
        try {
            const { data } = await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/subject/${slug}`, {
                ...subjectDetails,
                userGleID: user.uid
            })
            toast.success('Subject Updated Successfully')
            router.push('/subject')
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <>
            <Head>
                <title>Edit Subject | ChillMate</title>
            </Head>
            <div className='container mx-auto my-5'>
                <main className="container mx-auto text-center my-5">
                    <h1 className="text-2xl">Edit Subject</h1>
                    <div className="border-b-2 border-theme-ferrari-red w-1/5 mx-auto pb-2 mb-4"></div>
                    <form
                        className="flex flex-col w-4/5 mx-auto"
                        onSubmit={updateSubject}
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
                                Edit Subject
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </>
    )
}
/*
Chapter 10 - 
Tidal Energy - 
Single basin, single effect - pg 439
Single basin, double effect scheme- pg 439

No Numericals - 
Web Energy Technology - 10.3.2
Ocean Thermal - Energy convversion technology - 10.4.2
Construction and Principle of Operation Horizontal Axis and Vertical Axis Wind Turbine and give comparision

---------------------------------
Wind Energy - 
Explain about wind energy comversion system
Derievation of the power that can be extracted from the wind turbine. Derievation imp.
Biomass conersion Tecnologies - 8.5, .6, .7, .8, .9 or even from ppt

Biamass and Geothermal - Read it out from ppt - Enough

----------------------------------------------------------------
*/

export default EditChapter