import React, { useContext, useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useSelector, useDispatch } from "react-redux";
import { toast } from 'react-toastify';
import Modal from 'react-modal';

import { RiPencilFill, RiShareLine, RiEyeFill } from 'react-icons/ri'
import { MdOutlineArrowBackIos } from 'react-icons/md'
import { AiOutlineSearch, AiOutlineDelete } from 'react-icons/ai'

import { getNotes, selectNotes, deleteNotes, selectLoadingState, selectCurrentPage, selectTotalPages } from '../../../store/slices/Notes'
import { Loader } from '../../../components'
import { ContextStore } from '../../../constants/context/Context';
import moment from 'moment/moment';

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

Modal.setAppElement('#__next')

const Notes = () => {
  const [modalIsOpen, setIsOpen] = useState(false)
  const [deleteID, setDeleteID] = useState(null)
  const [deleteNoteName, setDeleteNoteName] = useState(null)
  const [deleteText, setDeleteText] = useState('')
  const [isNoteDeleted, setIsNoteDeleted] = useState(false)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const dispatch = useDispatch();
  const router = useRouter()

  const notes = useSelector(selectNotes)
  const loadingState = useSelector(selectLoadingState)
  const currentPage = useSelector(selectCurrentPage)
  const totalPages = useSelector(selectTotalPages)

  const { slug } = router.query
  const { user } = useContext(ContextStore)

  const CopyURL = (id) => {
    navigator.clipboard.writeText(`https://chillmate.vercel.app/subject/notes/view/${id}`)
    toast.success('Copied to clipboard')
  }

  const toggleModal = (id, name) => {
    setIsOpen(!modalIsOpen)
    setDeleteID(id)
    setDeleteNoteName(name)
  }

  const DeleteNote = () => {
    try {
      if (deleteText !== 'SUDO DELETE')
        return toast.error('Please type SUDO DELETE to confirm')

      dispatch(deleteNotes(deleteID))
      setIsOpen(!modalIsOpen)
      setDeleteID(null)
      setIsNoteDeleted(!isNoteDeleted)
      toast.success('Note deleted successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (user.isPresent && slug)
      dispatch(getNotes({ id: slug, search: search.trim(), page }))
  }, [user.isPresent, slug, isNoteDeleted, page])

  if (!user.isPresent)
    return <div className='flex items-center flex-col justify-center min-h-screen'>
      <p className='mb-4'>Please Sign In to continue</p>
    </div>

  return (
    <>
      <Head>
        <title>Notes | {user.name || 'Loading username'}</title>
      </Head>
      <div className='my-5 min-h-screen'>
        <div className="flex flex-col">
          <div className="flex flex-col items-center sm:flex-row">

            <div className="sm:w-48 sm:h-48 h-32 w-32 sm:pb-0 pb-8 inline-flex items-center justify-center rounded-full flex-shrink-0 relative flex-[0.4]">
              <Image src='/assets/images/takingNotes.svg'
                alt="Taking Notes"
                height={200}
                width={200}
              />
            </div>

            <div className="flex-[0.6] px-5">
              <p className="text-[14px] sm:text-[18px] text-center sm:text-left w-4/5">
                A chat style note taking feature with threads for capturing separate streams of thoughts
              </p>
            </div>

          </div>
          <div className="flex flex-col items-center ">
            <button
              onClick={() => router.push(`/subject/notes/new/${slug}`)}
              className="bg-[var(--orange)] text-white px-4 py-2 my-5 rounded-md">
              Create New Note
            </button>
            <div className='mt-4 w-4/5'>
              <div className='flex justify-between'>
                <button
                  onClick={() => router.push(`/subject`)}
                  className='text-theme-ferrari-red px-4 py-2 rounded-md flex justify-center items-center'
                >
                  <MdOutlineArrowBackIos className='inline-block mr-2' />
                  <span className='text-xl font-medium'>Back</span>
                </button>
                <h3 className='text-theme-ferrari-red text-xl text-center mb-3 font-poppins'>
                  <span className='font-medium text-3xl'>Y</span>our&nbsp;
                  <span className='font-medium text-3xl'>N</span>otes
                </h3>
              </div>
              <div className="border-b-2 border-theme-ferrari-red mb-2"></div>
              <div className='flex flex-col'>
                <div className='flex justify-center items-center flex-1 my-5'>
                  <input
                    type="text"
                    placeholder='Search notes'
                    className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-theme-ferrari-red focus:border-transparent w-full'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    className='bg-theme-ferrari-red text-white px-2 py-2 text-2xl rounded-md ml-3'
                  >
                    <AiOutlineSearch />
                  </button>
                </div>


                {loadingState && <Loader />}

                {!loadingState && notes?.length == 0 &&
                  <div className='flex flex-col items-center justify-center mt-4'>
                    <p className='text-center text-2xl font-semibold'>No notes found</p>
                  </div>
                }

                {notes?.length > 0
                  &&
                  notes.map(note => (
                    <div key={note._id} className='flex rounded-md items-center justify-between p-4 my-1 sm:my-2 w-full shadow-md shadow-slate-200 transition-all hover:shadow-theme-orange hover:shadow-sm flex-col sm:flex-row'>
                      <div>
                        <h3 className='font-montserrat text-lg'>{note.header}</h3>
                        <p className='font-montserrat text-sm'>
                          {note.desc.substring(0, 70)}
                          {note.desc.length > 70 && '...'}
                        </p>
                        <p className="text-xs mt-2 font-thin">Created at: {moment(note.createdAt).format("MMM Do YY")}</p>
                      </div>
                      <div className='flex my-3 sm:my-0'>
                        {note.userGleID == user.uid &&
                          <RiPencilFill
                            className='ml-2 text-lg cursor-pointer'
                            onClick={() => router.push(`/subject/notes/edit/${note._id}`)}
                          />}
                        {note.userGleID == user.uid &&
                          <AiOutlineDelete
                            className='ml-3 text-lg cursor-pointer'
                            onClick={() => toggleModal(note._id, note.header)}
                          />}
                        <RiShareLine
                          className='ml-3 text-lg cursor-pointer'
                          onClick={() => CopyURL(note._id)}
                        />
                        <RiEyeFill
                          className='ml-3 text-lg cursor-pointer mr-2'
                          onClick={() => router.push(`/subject/notes/view/${note._id}`)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className='flex justify-between items-center mt-4 w-4/5'>
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
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => toggleModal(null, null)}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div className='p-2'>
          <p className='text-center text-lg'>Are you sure you want to
            <span className='text-red-600'>
              &nbsp;delete
            </span>
            <span className='text-red-600 font-medium'>
              &nbsp;{deleteNoteName}
            </span>
          </p>
          <p className='text-center font-medium'>All stuff under this note will be deleted.</p>
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
              onClick={DeleteNote}
              className='bg-theme-ferrari-red text-white px-4 py-2 rounded-md'>
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Notes