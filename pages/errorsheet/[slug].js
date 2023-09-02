import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head';
import { useRouter } from 'next/router'
import Modal from 'react-modal'
import { useDispatch, useSelector } from 'react-redux';
import { BiCodeAlt, BiPencil } from 'react-icons/bi'
import { AiOutlineDelete, AiOutlineCloseCircle, AiOutlineSearch } from 'react-icons/ai'
import moment from 'moment';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

import { ContextStore } from '../../constants/context/Context'
import {
    getErrorSheets, addNewErrorDocument, deleteErrorDocument, updateErrorDocument,
    selectErrorSheet, selectCurrentPage, selectNumberOfPages, selectError
} from '../../store/slices/ErrorSheet'

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        minHeight: '80vh',
        maxHeight: '80vh',
        overflowY: 'auto',
    },
};

const ErrorSheetView = () => {
    const [probName, setProbName] = useState('');
    const [probLink, setProbLink] = useState('');
    const [mistake, setMistake] = useState('');
    const [improvement, setImprovement] = useState('');
    const [isMistakeCorrected, setIsMistakeCorrected] = useState(false);
    const [tags, setTags] = useState('');
    const [BeforeInterviewLookup, setBeforeInterviewLookup] = useState('Yes');
    const [revisionPriority, setRevisionPriority] = useState('High');

    const [modalIsOpen, setIsOpen] = useState(false);
    const [errorsheets, setErrorsheets] = useState([]);
    const [sheetModal, setSheetModal] = useState(false);
    const [sheet, setSheet] = useState({});

    const [isEditing, setIsEditing] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [searchBy, setSearchBy] = useState('');

    const dispatch = useDispatch()
    const router = useRouter()
    const { id, user } = useContext(ContextStore)

    const { slug } = router.query

    const eSheets = useSelector(selectErrorSheet)
    const CP = useSelector(selectCurrentPage)
    const NOP = useSelector(selectNumberOfPages)
    const Sheeterror = useSelector(selectError)

    const openModal = () => setIsOpen(true);

    const MoveToDefault = () => {
        setProbName('');
        setProbLink('');
        setMistake('');
        setImprovement('');
        setTags('');
        setIsMistakeCorrected(false);
        setBeforeInterviewLookup('Yes');
        setRevisionPriority('High');
    }

    const closeModal = () => {
        setIsOpen(false);
        setIsEditing(false);
        MoveToDefault();
    }

    const ToggleIsEdit = () => {
        setIsEditing(true);
        setProbName(sheet.probName);
        setProbLink(sheet.probLink);
        setMistake(sheet.mistake);
        setImprovement(sheet.improvement);
        setIsMistakeCorrected(sheet.isMistakeCorrected);
        setTags(sheet.tags.join(', '));
        setBeforeInterviewLookup(sheet.BeforeInterviewLookup);
        setRevisionPriority(sheet.revisionPriority);

        openModal();
        setSheetModal(false);
    }
    console.log(sheet?.UserRef?._id, id)
    const handleSheetModal = () => setSheetModal(!sheetModal)

    const isValidURL = (string) => {
        const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null)
    }

    const handleErrorSubmit = async (e) => {
        if (id != slug)
            return toast.error('You are not authorized to add error sheet for this user')

        e.preventDefault()
        try {
            if (probName === '' || probLink === '' || mistake === '' || improvement === '' || tags === '')
                return toast.error('Please fill all the fields')

            if (!isValidURL(probLink))
                return toast.error('Please enter a valid URL')

            dispatch(addNewErrorDocument({
                probName,
                probLink,
                mistake,
                improvement,
                isMistakeCorrected,
                tags,
                BeforeInterviewLookup,
                revisionPriority,
                id
            }))

            closeModal()
            toast.success('Error Sheet Added Successfully')
            MoveToDefault();
        }
        catch (error) {
            toast.error(error.message)
        }
    }

    const updateErrorSheet = () => {
        try {
            if (id != slug)
                return toast.error('You are not authorized to update error sheet for this user')

            if (probName === '' || probLink === '' || mistake === '' || improvement === '' || tags === '')
                return toast.error('Please fill all the fields')

            if (!isValidURL(probLink))
                return toast.error('Please enter a valid URL')

            dispatch(updateErrorDocument({
                probName,
                probLink,
                mistake,
                improvement,
                isMistakeCorrected,
                tags,
                BeforeInterviewLookup,
                revisionPriority,
                userid: id,
                sheetid: sheet._id
            }))

            closeModal()
            toast.success('Error Sheet Updated Successfully')
            MoveToDefault();
        } catch (rejectedValueOrSerializedError) {
            toast.error(rejectedValueOrSerializedError.message)
        }
    }

    const DeleteErrorSheet = async (errorid) => {
        try {
            if (id != slug)
                return toast.error('You are not authorized to delete error sheet for this user')

            dispatch(deleteErrorDocument({ errorid, page: CP, userid: id }))
            toast.success('Error Sheet Deleted Successfully')
            setSheetModal(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const searchForPNameTags = () => {
        try {
            if (searchText === '')
                return toast.error('Please enter a search text')

            dispatch(getErrorSheets({ id: slug, page: CP, searchBy, searchText }))

        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user.isPresent && id)
            dispatch(getErrorSheets({ id: slug, page: CP, searchBy, searchText }))
    }, [user.isPresent, id])

    useEffect(() => {
        if (eSheets)
            setErrorsheets(eSheets)
    }, [eSheets, CP, NOP])

    if (!user.isPresent) return (
        <div className='min-h-[80vh] mx-auto px-8 py-5'>
            <div className='flex flex-col items-center justify-center mt-10'>
                <p className='text-lg font-medium text-theme-ferrari-red'>Please sign in to continue</p>
            </div>
        </div>
    )

    return (
        <main className='min-h-[80vh] mx-auto px-8 py-5'>
            <Head>
                <title>{id === slug ? 'My' : 'Others'} Error Sheet</title>
                <meta name="description" content={id === slug
                    ?
                    `${user.name}'s Error Sheet}` :
                    ""} />
            </Head>
            <header className='flex justify-between items-center'>
                <h1 className='text-2xl text-theme-ferrari-red'>
                    {id === slug ? 'My' : 'Others'} Error Sheet
                </h1>
                <button
                    className='bg-theme-orange text-white px-3 py-2 rounded-md'
                    onClick={openModal}>
                    Add Errors
                </button>
            </header>

            {/* <div className='flex justify-center items-center my-5'>
                <div className='flex justify-center items-center flex-1'>
                    <input
                        type='text'
                        name='search'
                        id='search'
                        className='border border-gray-300 rounded-md px-3 py-2 mt-5 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent w-full'
                        placeholder='Search by Problem Name or Tags'
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <div
                        className='flex justify-center items-center'
                        onClick={searchForPNameTags}
                    >
                        <AiOutlineSearch
                            className='text-2xl text-theme-ferrari-red cursor-pointer hover:text-theme-orange transition duration-300 ease-in-out mt-5 ml-3'
                        />
                    </div>
                </div>
                <div className='flex justify-center items-center flex-1'>
                    Search By &nbsp;<span
                        className='font-bold text-theme-ferrari-red'
                    >Revise before Interview</span>

                    <select
                        name='BeforeInterviewLookup'
                        id='BeforeInterviewLookup'
                        className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent ml-3'
                        value={searchBy}
                        defaultValue={searchBy}
                        onChange={(e) => setSearchBy(e.target.value)}
                    >
                        <option value=''>All</option>
                        <option value='Yes'>Yes</option>
                        <option value='No'>No</option>
                        <option value='Maybe'>Maybe</option>
                    </select>
                </div>
            </div> */}

            <section className='mt-5 min-h-[70vh]'>
                <motion.div
                    transition={{ duration: 0.75, type: 'tween', stiffness: 100 }}
                    whileInView={{ y: [-100, 0], opacity: [0, 1], duration: 0.1 }}
                    className='grid grid-cols-1 sm:grid-cols-3 gap-5'
                >
                    {errorsheets?.map((sheet, index) => (
                        <div
                            key={index}
                            className='flex flex-col border border-gray-200 shadow-md rounded-md p-5'>
                            <div className="flex justify-between align-center">
                                <h3
                                    className="cursor-pointer text-base font-medium font-montserrat"
                                    onClick={() => { setSheet(sheet); handleSheetModal() }}
                                >
                                    {sheet?.probName.substring(0, 30)}
                                    {sheet?.probName.length > 30 && '...'}
                                </h3>
                                <a href={sheet?.probLink} rel="noopener noreferrer" target="_blank">
                                    <BiCodeAlt
                                        className='text-2xl text-theme-ferrari-red cursor-pointer hover:text-theme-orange transition duration-300 ease-in-out'
                                    />
                                </a>
                            </div>

                            <div className='flex flex-col mt-1'>
                                <p className='text-sm'>
                                    <span className='font-bold'>Revision</span> Priority: &nbsp;
                                    {sheet.revisionPriority === 'High' && <span className='font-bold text-red-500'>High</span>}
                                    {sheet.revisionPriority === 'Medium' && <span className='font-bold text-yellow-500'>Medium</span>}
                                    {sheet.revisionPriority === 'Low' && <span className='font-bold text-green-500'>Low</span>}
                                </p>
                            </div>

                            <div>
                                <p className='text-sm mt-1'>
                                    <span className='font-bold'>Mistake</span> Corrected:
                                    <span className={`${sheet?.isMistakeCorrected ? 'text-green-500' : 'text-red-500'} font-bold ml-1`}>
                                        {sheet?.isMistakeCorrected ? 'Yes' : 'No'}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p className='text-sm mt-1'>
                                    <span className='font-bold'>Revise before Interview</span>:
                                    <span
                                        className={
                                            `${sheet?.BeforeInterviewLookup === 'Yes' ? 'text-green-500' :
                                                sheet?.BeforeInterviewLookup === 'No' ? 'text-red-500' : 'text-yellow-500'
                                            } font-bold ml-1`
                                        }>
                                        {sheet?.BeforeInterviewLookup}
                                    </span>
                                </p>
                            </div>

                            <p className='text-[13px] font-light mt-2'>
                                Created On: {moment(sheet.createdAt).format('DD MMM YYYY')}
                            </p>
                            <p className='text-[13px] font-light mt-1'>
                                Last Updated: {moment(sheet.updatedAt).format('DD MMM YYYY')}
                            </p>
                        </div>
                    ))}
                </motion.div>
                {errorsheets?.length === 0 &&
                    <div className='flex flex-col items-center justify-center mt-10 min-h-[70vh]'>
                        <p className='text-lg font-medium text-theme-ferrari-red'>No Error Sheets Found</p>
                    </div>
                }


                {/* Pagination */}

                <div className=''>
                    <div className='flex items-center justify-between mt-5'>
                        <button
                            className={`${CP === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-theme-ferrari-red'}
                             text-white px-3 py-2 rounded-md mr-2`}
                            onClick={() => dispatch(getErrorSheets({ id, page: CP - 1, searchBy, searchText }))}
                            disabled={CP === 1}
                        >
                            Previous
                        </button>
                        <div className=''>
                            {CP} of {NOP}
                        </div>
                        <button
                            className={`${CP === NOP | NOP === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-theme-ferrari-red'} 
                            text-white px-3 py-2 rounded-md`}
                            onClick={() => dispatch(getErrorSheets({ id, page: CP + 1, searchBy, searchText }))}
                            disabled={CP === NOP || NOP === 0}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------------------------------------ */}
            {/* Modal Error */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="Add Errors Modal"
            >
                <section className='mt-5' aria-label='form'>
                    <div className='flex items-center justify-between mb-5'>
                        <h2 className='text-lg font-medium text-theme-ferrari-red'>
                            {isEditing ? 'Edit Error Sheet' : 'Add Error'}
                        </h2>
                        <button
                            type='button'
                            className='text-gray-400 hover:text-gray-500'
                            onClick={closeModal}
                        >
                            <span className='sr-only'>Close</span>
                            <svg className='h-6 w-6' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'
                                stroke='currentColor' aria-hidden='true'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'
                                    d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                    <form action='#'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='flex flex-col'>
                                <label htmlFor='probName' className='font-light'>Problem Name</label>
                                <input
                                    type='text'
                                    name='probName'
                                    id='probName'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    placeholder='Problem Name'
                                    value={probName}
                                    onChange={(e) => setProbName(e.target.value)}
                                    required
                                    autoComplete='off'
                                />
                            </div>
                            <div className='flex flex-col'>
                                <label htmlFor='probLink' className='font-light'>Problem Link</label>
                                <input
                                    type='text'
                                    name='probLink'
                                    id='probLink'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    placeholder='Problem Link'
                                    value={probLink}
                                    onChange={(e) => setProbLink(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='flex flex-col'>
                                <label htmlFor='mistake' className='font-light'>Mistake</label>
                                <textarea
                                    type='text'
                                    name='mistake'
                                    id='mistake'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    placeholder='Mistake'
                                    value={mistake}
                                    onChange={(e) => setMistake(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='flex flex-col'>
                                <label htmlFor='improvement' className='font-light'>Improvement</label>
                                <textarea
                                    type='text'
                                    name='improvement'
                                    id='improvement'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    placeholder='Improvement'
                                    value={improvement}
                                    onChange={(e) => setImprovement(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='flex flex-col'>
                                <label htmlFor='isMistakeCorrected' className='font-light'>Is Mistake Corrected?</label>
                                <select
                                    name='isMistakeCorrected'
                                    id='isMistakeCorrected'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    value={isMistakeCorrected}
                                    onChange={(e) => setIsMistakeCorrected(e.target.value)}
                                    defaultValue={isMistakeCorrected}
                                >
                                    <option value='true'>Yes</option>
                                    <option value='false'>No</option>
                                </select>
                            </div>
                            <div className='flex flex-col'>
                                <label htmlFor='tags' className='font-light'>Tags</label>
                                <input
                                    type='text'
                                    name='tags'
                                    id='tags'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    placeholder='Enter tags seperated by commas'
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>

                            <div className='flex flex-col'>
                                <label htmlFor='BeforeInterviewLookup' className='font-light'>Revise before Interview</label>
                                <select
                                    name='BeforeInterviewLookup'
                                    id='BeforeInterviewLookup'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    value={BeforeInterviewLookup}
                                    defaultValue={BeforeInterviewLookup}
                                    onChange={(e) => setBeforeInterviewLookup(e.target.value)}
                                >
                                    <option value='Yes'>Yes</option>
                                    <option value='No'>No</option>
                                    <option value='Maybe'>Maybe</option>
                                </select>
                            </div>

                            <div className='flex flex-col'>
                                <label htmlFor='revisionPriority' className='font-light'>Revision Priority</label>
                                <select
                                    name='revisionPriority'
                                    id='revisionPriority'
                                    className='border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent'
                                    value={revisionPriority}
                                    defaultValue={revisionPriority}
                                    onChange={(e) => setRevisionPriority(e.target.value)}
                                >
                                    <option value='High'>High</option>
                                    <option value='Medium'>Medium</option>
                                    <option value='Low'>Low</option>
                                </select>
                            </div>
                        </div>
                        <div className='flex justify-center mt-5'>
                            <button
                                type='submit'
                                className='bg-theme-ferrari-red text-white px-4 py-2 rounded-md hover:bg-opacity-80 transition duration-300 ease-in-out'
                                onClick={
                                    isEditing ? () => updateErrorSheet() : (e) => handleErrorSubmit(e)
                                }
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </section>
            </Modal>

            <Modal
                isOpen={sheetModal}
                onRequestClose={handleSheetModal}
                style={customStyles}
                contentLabel="Sheet Modal"
            >
                {sheet &&
                    <motion.section
                        transition={{ duration: 0.75, type: 'tween', stiffness: 100, ease: 'easeInOut' }}
                        whileInView={{ y: [20, 0], opacity: [0, 1], duration: 0.75 }}
                        className='mt-5'>
                        <div className='flex items-center justify-between mb-5'>
                            <h2 className='text-lg font-medium text-theme-ferrari-red'>{sheet.probName}</h2>
                            <div className='flex flex-col'>

                                <div>
                                    <button
                                        type='button'
                                        className='text-red-400 hover:text-red-600 mr-4'
                                        onClick={() => DeleteErrorSheet(sheet._id)}
                                        disabled={sheet?.UserRef?._id || sheet?.UserRef == id ? false : true}
                                    >
                                        <AiOutlineDelete className='text-2xl' />
                                    </button>
                                    <button
                                        type='button'
                                        className='text-blue-400 hover:text-blue-600 mr-2'
                                        onClick={() => ToggleIsEdit()}
                                        disabled={sheet?.UserRef?._id || sheet?.UserRef == id ? false : true}
                                    >
                                        <BiPencil className='text-2xl' />
                                    </button>
                                </div>

                                <div className='mt-2'>
                                    <button className='text-2xl mr-3 text-green-400 hover:text-green-600'>
                                        <a href={sheet.probLink} rel="noopener noreferrer" target="_blank">
                                            <BiCodeAlt />
                                        </a>
                                    </button>
                                    <button
                                        type='button'
                                        className='text-yellow-400 hover:text-yellow-600'
                                        onClick={handleSheetModal}
                                    >
                                        <AiOutlineCloseCircle className='text-2xl' />
                                    </button>
                                </div>

                            </div>
                        </div>

                        <div className='flex flex-col sm:flex-row'>
                            <p className='mr-2 font-medium border-r-0 sm:border-r-2'>Created On: {moment(sheet.createdAt).format("MMM Do YY")}</p>
                            <p className='ml-0 sm:ml-2 font-medium'>Last Updated: {moment(sheet.updatedAt).format("MMM Do YY")}</p>
                        </div>

                        <div className='mt-4'>
                            <div className='flex flex-col mt-1'>
                                <p className=''>
                                    <span className='font-bold'>Revision</span> Priority: &nbsp;
                                    {sheet.revisionPriority === 'High' && <span className='font-bold text-red-500'>High</span>}
                                    {sheet.revisionPriority === 'Medium' && <span className='font-bold text-yellow-500'>Medium</span>}
                                    {sheet.revisionPriority === 'Low' && <span className='font-bold text-green-500'>Low</span>}
                                </p>
                            </div>

                            <div>
                                <p className='mt-1'>
                                    <span className='font-bold'>Mistake</span> Corrected:
                                    <span className={`${sheet.isMistakeCorrected ? 'text-green-500' : 'text-red-500'} font-bold ml-1`}>
                                        {sheet.isMistakeCorrected ? 'Yes' : 'No'}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p className='mt-1'>
                                    <span className='font-bold'>Revise before Interview</span>:
                                    <span
                                        className={
                                            `${sheet.BeforeInterviewLookup === 'Yes' ? 'text-green-500' :
                                                sheet.BeforeInterviewLookup === 'No' ? 'text-red-500' : 'text-yellow-500'
                                            } font-bold ml-1`
                                        }>
                                        {sheet.BeforeInterviewLookup}
                                    </span>
                                </p>
                            </div>

                            <div className='mt-3'>
                                {sheet.tags?.map((tag, index) => (
                                    <span key={index} className='bg-gray-100 text-gray-600 px-2 py-1 rounded-md mr-2 text-sm'>{tag}</span>
                                ))}
                            </div>

                            <div className='flex sm:flex-row flex-col'>
                                <div className='flex flex-col mt-5'>
                                    <h3 className='text-lg font-medium text-theme-ferrari-red'>Mistake</h3>
                                    <p className='mt-1'>{sheet.mistake}</p>
                                </div>

                                <div className='flex flex-col mt-5 sm:ml-5'>
                                    <h3 className='text-lg font-medium text-theme-ferrari-red'>Improvement</h3>
                                    <p className='mt-1'>{sheet.improvement}</p>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                }
            </Modal>

        </main>
    )
}

export default ErrorSheetView