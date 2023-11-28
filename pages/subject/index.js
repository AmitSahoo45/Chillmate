import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from "react-redux";
import { BsPencilFill, BsEye } from 'react-icons/bs'
import { AiOutlineDelete, AiOutlineShareAlt } from 'react-icons/ai'
import moment from 'moment/moment';
import Modal from 'react-modal';

import { Loader } from '../../components';
import { getSubjects, selectSubjects, deleteSubject, selectLoadingState } from '../../store/slices/subject'
import { ContextStore } from '../../constants/context/Context';
import { toast } from 'react-toastify';

Modal.setAppElement('#__next')

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

const Subject = () => {
    const [modalIsOpen, setIsOpen] = useState(false)
    const [deleteID, setDeleteID] = useState(null)
    const [isNoteDeleted, setIsNoteDeleted] = useState(false)

    const dispatch = useDispatch()
    const router = useRouter()

    const { user } = useContext(ContextStore)
    const { subjects } = useSelector(selectSubjects)
    const loadingState = useSelector(selectLoadingState)

    const toggleModal = (id) => {
        setIsOpen(!modalIsOpen)
        setDeleteID(id)
    }

    const DeleteSubject = () => {
        try {
            dispatch(deleteSubject(deleteID))
            setIsOpen(!modalIsOpen)
            setDeleteID(null)
            setIsNoteDeleted(!isNoteDeleted)
            toast.success('Note deleted successfully')
        } catch (error) {
            toast.error(error.message)
        }
    }

    const CopyURL = (id) => {
        navigator.clipboard.writeText(`https://chillmate.vercel.app/subject/share/${id}`)
        toast.success('Copied to clipboard')
    }

    useEffect(() => {
        if (user.isPresent)
            dispatch(getSubjects(user.uid));
    }, [user.isPresent, isNoteDeleted]);

    if (!user.isPresent)
        return <div className='flex items-center flex-col justify-center min-h-screen'>
            <p className='mb-4'>Please Sign In to continue</p>
        </div>


    return (
        <>
            <Head>
                <title>Subject | {user.name || 'Loading Name'}</title>
            </Head>
            <div className='w-4/5 mx-auto my-5 min-h-screen'>
                <div className='flex flex-col'>
                    <div className='flex flex-row justify-between'>
                        <h1 className='text-3xl font-bold header-text'>Subjects</h1>
                        <button
                            className='bg-theme-ferrari-red text-white px-4 py-2 rounded-md'
                            onClick={() => router.push('/subject/new')}
                        >Add Subject</button>
                    </div>
                    <div className='flex flex-row justify-between mt-5'>
                        <div className='flex flex-col w-full'>
                            <div className='flex flex-col mt-5 w-full'>
                                {(user.isPresent && subjects?.length > 0) &&
                                    subjects.map((chapter, index) => (
                                        <div
                                            key={index}
                                            className='flex flex-col justify-between p-3 shadow-md rounded-sm mb-3 sm:flex-row'>
                                            <div>
                                                <h4 className='text-lg'>{chapter.Subname}</h4>
                                                <div className='border-b border-theme-ferrari-red my-1'></div>
                                                <p className="text-sm">
                                                    {chapter.Subdesc.substr(0, 150)}
                                                    {chapter.Subdesc.length > 150 && '...'}
                                                </p>
                                                <p>
                                                    <span className="text-xs text-gray-500">{moment(chapter.createdAt).format("dddd MMM Do YY")}</span>
                                                </p>
                                                <div className="mt-3">
                                                    {chapter.Subtags?.map((tag, index) => (
                                                        <span key={index} className="inline-block bg-orange-100 rounded-full p-1 px-2 text-xs text-black mr-2 mb-2">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className='flex justify-center items-center my-3 sm:my-0'>
                                                <BsPencilFill
                                                    onClick={() => router.push(`/subject/${chapter._id}/edit`)}
                                                    className='mr-3 hover:cursor-pointer' />
                                                <BsEye
                                                    className='mr-3 hover:cursor-pointer'
                                                    onClick={() => router.push(`/subject/notes/${chapter._id}`)}
                                                />
                                                <AiOutlineDelete
                                                    className='mr-3 hover:cursor-pointer'
                                                    onClick={() => toggleModal(chapter._id)}
                                                />
                                                <AiOutlineShareAlt
                                                    className='mr-3 hover:cursor-pointer'
                                                    onClick={() => CopyURL(chapter._id)}
                                                />
                                            </div>
                                        </div>
                                    ))
                                }

                                {loadingState && <Loader />}
                                {!loadingState && subjects?.length === 0 &&
                                    <div className='flex items-center flex-col justify-center min-h-screen'>
                                        <p className='mb-4'>
                                            Oops!!! Looks like you have not created any subject.
                                            Create to view them here.😊
                                        </p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={toggleModal}
                style={customStyles}
                contentLabel="Example Modal"
            >
                <div className='p-2'>
                    <h3 className='text-center text-2xl font-medium'>Delete Note</h3>
                    <p className='text-center text-lg'>Are you sure you want to
                        <span className='text-red-600'>&nbsp;delete this subject?</span>
                    </p>
                    <div className='flex justify-center mt-4'>
                        <button
                            onClick={toggleModal}
                            className='border-2 px-4 py-2 rounded-md mr-2'>
                            Cancel
                        </button>
                        <button
                            onClick={DeleteSubject}
                            className='bg-theme-ferrari-red text-white px-4 py-2 rounded-md'>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default Subject