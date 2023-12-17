import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from "react-redux";
import { BsPencilFill, BsEye } from 'react-icons/bs'
import { AiOutlineDelete, AiOutlineSearch, AiOutlineShareAlt } from 'react-icons/ai'
import moment from 'moment/moment';
import Modal from 'react-modal';

import { Loader } from '../../components';
import { getSubjects, selectSubjects, deleteSubject, selectLoadingState, selectCurrentPage, selectTotalPages } from '../../store/slices/subject'
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
    const [deleteSubjectName, setDeleteSubjectName] = useState(null)
    const [isNoteDeleted, setIsNoteDeleted] = useState(false)
    const [deleteText, setDeleteText] = useState('')

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    const dispatch = useDispatch()
    const router = useRouter()

    const { user } = useContext(ContextStore)
    const { subjects } = useSelector(selectSubjects)
    const loadingState = useSelector(selectLoadingState)
    const currentPage = useSelector(selectCurrentPage)
    const totalPages = useSelector(selectTotalPages)

    const toggleModal = (id, name) => {
        setIsOpen(!modalIsOpen)
        setDeleteID(id)
        setDeleteSubjectName(name)
    }

    const DeleteSubject = () => {
        try {
            if (deleteText !== 'SUDO DELETE')
                return toast.error('Please type SUDO DELETE to confirm')

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
            dispatch(getSubjects({ id: user.uid, page, search }));
    }, [user.isPresent, isNoteDeleted]);

    useEffect(() => {
        const handleRightClick = (event) => event.preventDefault();
        const handleKeyDown = (event) => event.preventDefault()

        document.addEventListener('contextmenu', handleRightClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleRightClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
                        >
                            Add Subject
                        </button>
                    </div>
                    <div className='flex justify-center items-center flex-1 my-5'>
                        <input
                            type="text"
                            placeholder='Search Subject'
                            className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent w-full'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            onClick={() => dispatch(getSubjects({ id: user.uid, page: 1, search }))}
                            className='bg-theme-ferrari-red text-white px-2 py-2 text-2xl rounded-md ml-3'
                        >
                            <AiOutlineSearch />
                        </button>
                    </div>
                    <div className='flex flex-row justify-between'>
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
                                                    onClick={() => toggleModal(chapter._id, chapter.Subname)}
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

                    <div className='flex justify-between items-center mt-4 w-full'>
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page == 1}
                            className={`${currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-theme-ferrari-red'}
                             text-white px-2 py-1 rounded-md mr-2`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page == totalPages}
                            className={`${currentPage === totalPages | totalPages === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-theme-ferrari-red'} 
                            text-white px-2 py-1 rounded-md`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => toggleModal(null, null)}
                style={customStyles}
                contentLabel="Example Modal"
            >
                <div className='p-2'>
                    <h3 className='text-center text-2xl font-medium'>Delete Note</h3>
                    <p className='text-center text-lg'>Are you sure you want to
                        <span className='text-red-600'>
                            &nbsp;delete
                        </span>
                        <span className='text-red-600'>
                            &nbsp;{deleteSubjectName}
                        </span>
                    </p>
                    <p className='text-center font-medium'>All notes under this subject will be deleted.</p>
                    <div>
                        <input
                            type="text"
                            placeholder='Type SUDO DELETE to confirm'
                            className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent w-full mt-3'
                            value={deleteText}
                            onChange={(e) => setDeleteText(e.target.value)}
                            required
                        />
                    </div>
                    <div className='flex justify-center mt-4'>
                        <button
                            onClick={() => toggleModal(null, null)}
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