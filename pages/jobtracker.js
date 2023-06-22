import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import { collection, getDocs, doc, addDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore'
import { ContextStore } from '../constants/context/Context';

import { Loader } from '../components'
import { database } from '../constants/Firebase/firebaseClient';
import { toast } from 'react-toastify';
import { TbPencil, TbTrash } from 'react-icons/tb';
import moment from 'moment';

const Jobtracker = () => {
    const [company, setCompany] = useState('')
    const [position, setPosition] = useState('')
    const [dateApplied, setDateApplied] = useState('')
    const [status, setStatus] = useState('')
    const [campus, setCampus] = useState('oncampus')

    const [filterStatus, setFilterStatus] = useState('all')
    const [appliedSwitch, setAppliedSwitch] = useState(false)
    const [youapps, setYouapps] = useState([])

    const [isEditing, setIsEditing] = useState(false)
    const [updateAppid, setUpdateAppid] = useState(0)

    const { user } = useContext(ContextStore)

    const getAllApplications = async () => {
        try {
            if (filterStatus === 'all') {
                const collectionRef = collection(database, "users", user.uid, "applications")
                const querySnapshot = await getDocs(collectionRef)
                const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                console.log(data)
                setYouapps(data)
                return;
            }

            const collectionRef = collection(database, "users", user.uid, "applications")
            const querySnapshot = await getDocs(query(collectionRef, where("status", "==", filterStatus)))
            const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            console.log(data)
            setYouapps(data)
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const addApplication = async () => {
        try {
            if (user.isPresent === false) {
                toast.error('Please sign in to add an application')
                return;
            }

            if (company === '' || position === '' || dateApplied === '' || status === '' || campus === '') {
                toast.error('Please fill out all fields')
                return;
            }

            const collectionRef = collection(database, "users", user.uid, "applications")
            await addDoc(collectionRef, {
                company: company,
                position: position,
                dateApplied: dateApplied,
                status: status,
                campus: campus,
                date: new Date()
            })

            toast.success('Application added')
            setCompany('')
            setPosition('')
            setDateApplied('')
            setStatus('')
            setAppliedSwitch(!appliedSwitch)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const editApplication = (youapp) => {
        setCompany(youapp.company)
        setPosition(youapp.position)
        setDateApplied(youapp.dateApplied)
        setStatus(youapp.status)
        setCampus(youapp.campus)
        setIsEditing(true)
        setUpdateAppid(youapp.id)
    }

    const deleteApplication = async (id) => {
        try {
            await deleteDoc(doc(database, "users", user.uid, "applications", id))
            toast.success('Application deleted')
            setAppliedSwitch(!appliedSwitch)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const updateApplication = async () => {
        try {
            if (company === '' || position === '' || dateApplied === '' || status === '' || campus === '') {
                toast.error('Please fill out all fields')
                return;
            }

            const docRef = doc(database, "users", user.uid, "applications", updateAppid)
            await updateDoc(docRef, {
                company: company,
                position: position,
                dateApplied: dateApplied,
                status: status,
                campus: campus,
                date: new Date()
            })

            toast.success('Application updated')
            setCompany('')
            setPosition('')
            setDateApplied('')
            setStatus('')
            setCampus('')
            setIsEditing(false)
            setUpdateAppid(0)
            setAppliedSwitch(!appliedSwitch)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user.isPresent === true)
            getAllApplications()

    }, [appliedSwitch, filterStatus, user.isPresent])

    return (
        <>
            <Head>
                <title>Track your Application</title>
            </Head>
            <div className='container my-3 mx-auto min-h-screen'>
                <h1 className='text-center text-ellipsis font-poppins uppercase text-xl font-thin'>Job Tracker</h1>
                <div className="container my-3">
                    <div className="flex flex-col justify-center items-center">
                        <div className="flex flex-col justify-center items-center flex-wrap w-11/12 mx-auto sm:w-full">
                            <div className="flex justify-center items-center flex-wrap w-full">
                                <div className="sm:my-2 my-2 sm:mr-4">
                                    <label htmlFor="company" className="text-gray-700 font-montserrat font-thin mr-2 ">Company</label>
                                    <input
                                        type="text"
                                        name="company"
                                        id="company"
                                        className="border border-gray-300 rounded-md p-2 w-80"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />
                                </div>

                                <div className="sm:my-2 my-2">
                                    <label htmlFor="position" className="text-gray-700 font-montserrat font-thin mr-2 ">Position</label>
                                    <input
                                        type="text"
                                        name="position"
                                        id="position"
                                        className="border border-gray-300 rounded-md p-2 w-80"
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sm:my-2 my-2">
                                <label htmlFor="dateApplied" className="text-gray-700 font-montserrat font-thin mr-2 ">Date Applied</label>
                                <input
                                    type="date"
                                    name="dateApplied"
                                    id="dateApplied"
                                    className="border border-gray-300 rounded-md p-2 w-80"
                                    value={dateApplied}
                                    onChange={(e) => setDateApplied(e.target.value)}
                                />
                            </div>

                            <div className="sm:my-2 my-2">
                                <label htmlFor="campus" className="text-gray-700 font-montserrat font-thin mr-2 ">Campus</label>
                                <select
                                    name="campus"
                                    id="campus"
                                    className="border border-gray-300 rounded-md p-2 w-80"
                                    value={campus}
                                    onChange={(e) => setCampus(e.target.value)}
                                >
                                    <option value="none">None</option>
                                    <option value="oncampus">On Campus</option>
                                    <option value="offcampus">Off Campus</option>
                                </select>
                            </div>

                            <div className="sm:my-2 my-2">
                                <label htmlFor="status" className="text-gray-700 font-montserrat font-thin mr-2 ">Status</label>
                                <select
                                    name="status"
                                    id="status"
                                    className="border border-gray-300 rounded-md p-2 w-80"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="none">None</option>
                                    <option value="wishlist">Wishlist</option>
                                    <option value="applied">Applied</option>
                                    <option value="review">Under Review</option>
                                    <option value="interview">Interview</option>
                                    <option value="offer">Offer</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="bg-[var(--ferrari-red)] text-white w-80 h-10 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ferrari-red)] focus:ring-opacity-50 shadow-md mt-3"
                                onClick={isEditing ? updateApplication : addApplication}
                            >
                                {isEditing ? 'Edit Application' : 'Add Application'}
                            </button>
                        </div>
                    </div>
                </div>
                {/* build a divider */}
                <div className='border-theme-orange w-4/5 my-5 mx-auto border'></div>
                <div className="container my-3 mx-auto">
                    <h3 className='text-center text-ellipsis font-poppins uppercase text-base font-thin'>Your Applications</h3>
                    <div className='mx-auto sm:w-4/5 w-full text-center mt-4'>
                        Filter By:

                        <select
                            name="status"
                            id="status"
                            className="border border-gray-300 rounded-md p-2 w-80 sm:ml-3 ml-0 sm:mt-0 mt-3"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="wishlist">Wishlist</option>
                            <option value="applied">Applied</option>
                            <option value="review">Under Review</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                <div className="container my-3 mx-auto">
                    {user.isPresent === false ? (
                        <div className="flex flex-col justify-center items-center">
                            <div className="flex justify-center items-center flex-wrap w-full">
                                <div className="flex justify-center items-center flex-wrap w-full">
                                    <h4 className='text-center text-ellipsis font-poppins uppercase text-xl font-thin'>
                                        Login to view Applications
                                    </h4>
                                </div>
                            </div>
                        </div>
                    ) :
                        <div className="flex flex-col justify-center items-center sm:mx-6 mx-3">
                            <div className="flex justify-start items-center flex-wrap w-full">
                                {youapps.map((youapp) => (
                                    <div className="border-4 border-theme-ferrari-red m-3 p-3 rounded-[10px] relative w-full sm:w-2/5" key={youapp.id}>
                                        <div className="">
                                            <h4 className='capitalize sm:text-lg text-base font-medium w-4/5 text-gray-600 mb-2'>
                                                {youapp.company}
                                            </h4>
                                            <h4 className='sm:text-lg text-base font-normal'>
                                                On <p className='text-theme-ferrari-red inline font-semibold'>{moment(youapp.dateApplied).format('MMM Do YY')}</p> you applied for <p className='text-theme-ferrari-red inline font-semibold'>{youapp.position}</p> position. <br/>
                                                This was <p className='text-theme-ferrari-red inline font-semibold'>{youapp.campus}</p> opportunity and as per your last update, the application status is <p className='text-theme-ferrari-red inline font-semibold'>{youapp.status}</p>.
                                            </h4>
                                            <div className='absolute top-3 right-3 flex justify-center items-center'>
                                                <TbPencil className='sm:h-5 sm:w-5 h-6 w-6 cursor-pointer' onClick={() => editApplication(youapp)} />
                                                <TbTrash className='sm:h-4 sm:w-4 h-6 w-6 cursor-pointer' onClick={() => deleteApplication(youapp.id)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>}
                    {youapps.length === 0 && (
                        <div className="flex justify-center items-center flex-wrap w-full">
                            <h4 className='text-center text-ellipsis font-poppins uppercase text-xl font-thin'>No Applications</h4>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Jobtracker