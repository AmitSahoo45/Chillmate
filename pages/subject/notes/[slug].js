import React, { useContext, useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RiPencilFill, RiDeleteBin3Line, RiShareLine, RiEyeFill } from 'react-icons/ri'
import { MdOutlineArrowBackIos } from 'react-icons/md'
import { useSelector, useDispatch } from "react-redux";
import { toast } from 'react-toastify';
import Modal from 'react-modal';

import { getNotes, selectNotes, deleteNotes } from '../../../store/slices/Notes'
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
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalIsOpen, setIsOpen] = useState(false)
  const [deleteID, setDeleteID] = useState(null)
  const [isNoteDeleted, setIsNoteDeleted] = useState(false)

  const dispatch = useDispatch();
  const router = useRouter()
  const TextNotes = useSelector(selectNotes)

  const { slug } = router.query
  const { user } = useContext(ContextStore)

  const CopyURL = (id) => {
    navigator.clipboard.writeText(`https://chillmate.vercel.app/subject/notes/view/${id}`)
    toast.success('Copied to clipboard')
  }

  const toggleModal = (id) => {
    setIsOpen(!modalIsOpen)
    setDeleteID(id)
  }

  const DeleteNote = () => {
    try {
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
      dispatch(getNotes(slug))
  }, [user.isPresent, slug, isNoteDeleted])

  useEffect(() => {
    if (TextNotes)
      setNotes(TextNotes.notes)
  }, [TextNotes])

  return (
    <>
      <Head>
        <title>Subject Notes</title>
      </Head>
      <div className='my-5'>
        <div className="flex flex-col">
          <div className="flex flex-col items-center sm:flex-row">
            <div className="sm:w-48 sm:h-48 h-32 w-32 sm:pb-0 pb-8 inline-flex items-center justify-center rounded-full flex-shrink-0 relative flex-[0.4]">
              <Image src='/assets/images/takingNotes.svg'
                alt="Nature Sounds"
                height={200}
                width={200}
              />
            </div>
            <div className="flex-[0.6] px-5 w-4/5">
              <p className="text-[14px] sm:text-[18px] text-center sm:text-left">
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
                {isLoading ?
                  <div className="mt-5">
                    <Loader />
                    <p className='text-center text-lg'>Please wait while we load your Notes</p>
                  </div>
                  :
                  notes?.length == 0 ?
                    <div className="mt-3">
                      <p className='text-center text-theme-ferrari-red text-lg'>
                        You have no notes yet
                      </p>
                    </div> :
                    notes?.map(note => (
                      <div key={note._id} className='flex rounded-md items-center justify-between p-4 my-1 sm:my-2 w-full shadow-md shadow-slate-200 transition-all hover:shadow-theme-orange hover:shadow-sm flex-col sm:flex-row'>
                        <div>
                          <h3 className='font-montserrat text-lg'>{note.header}</h3>
                          <p className='font-montserrat text-sm'>
                            {note.desc.substring(0, 70)}
                            {note.desc.length > 70 && '...'}
                            </p>
                          <p className="text-xs mt-2">{moment(note.createdAt).format("dddd MMM Do YY")}</p>
                        </div>
                        <div className='flex my-3 sm:my-0'>
                          {note.userGleID == user.uid &&
                            <RiPencilFill
                              className='ml-2 text-lg cursor-pointer'
                              onClick={() => router.push(`/subject/notes/edit/${note._id}`)}
                            />}
                          {note.userGleID == user.uid &&
                            <RiDeleteBin3Line
                              className='ml-3 text-lg cursor-pointer'
                              onClick={() => toggleModal(note._id)}
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
          <p className='text-center text-lg'>Are you sure you want to delete this note?</p>
          <div className='flex justify-center mt-4'>
            <button
              onClick={toggleModal}
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