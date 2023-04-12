import React, { useContext, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link';
import Head from 'next/head';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from 'next/router';
import { RiPencilFill, RiDeleteBin3Line, RiShareLine, RiEyeFill } from 'react-icons/ri'
import { toast } from 'react-toastify';

import { getNotes, selectNotes, selectError } from '../../../store/slices/Notes'
import { Loader } from '../../../components'
import { ContextStore } from '../../../constants/context/Context';

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const dispatch = useDispatch();
  const router = useRouter()

  const { TextNotes, loading, error } = useSelector(selectNotes)

  const { slug } = router.query
  const { user } = useContext(ContextStore)

  const CopyURL = (id) => {
    navigator.clipboard.writeText(`https://chillmate.vercel.app/notes/view/${id}`)
    toast.success('Copied to clipboard')
  }

  useEffect(() => {
    if (user.isPresent && slug)
      dispatch(getNotes(slug))
  }, [user.isPresent, slug])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (error)
      toast.error(error)

    if (loading)
      setIsLoading(true)
    else
      setIsLoading(false)
  }, [error, loading]);

  useEffect(() => {
    if (TextNotes)
      setNotes(TextNotes.notes)
  }, [TextNotes])

  return (
    <>
      <Head>
        <title>Threaded Notes</title>
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
            <Link href="/notes/new" aria-label='Create New Note'>
              <button
                className="bg-[var(--orange)] text-white px-4 py-2 my-5 rounded-md">
                Create New Note
              </button>
            </Link>
            <div className='mt-4 w-4/5'>
              <h3 className='text-theme-ferrari-red text-xl border-b-2 border-theme-ferrari-red text-center mb-3 font-poppins'>
                <span className='font-medium text-3xl'>Y</span>our&nbsp;
                <span className='font-medium text-3xl'>N</span>otes
              </h3>
              <div className='flex flex-col'>
                {
                  isLoading ?
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
                        <div key={note._id} className='flex rounded-md items-center justify-between p-4 my-1 sm:my-2 w-full shadow-md shadow-slate-200 transition-all hover:shadow-theme-orange hover:shadow-sm'>
                          <div>
                            <h3 className='font-montserrat text-lg'>{note.header}</h3>
                            <p className='font-montserrat text-sm'>{note.desc.substring(0, 70)}....</p>
                          </div>
                          <div className='flex'>
                            <RiPencilFill
                              className='ml-2 text-lg cursor-pointer'
                              onClick={() => router.push(`/subject/notes/edit/${note._id}`)}
                            />
                            <RiDeleteBin3Line className='ml-3 text-lg cursor-pointer' />
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
                      ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notes