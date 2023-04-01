import Image from 'next/image'
import React from 'react'
import Link from 'next/link';
import Head from 'next/head';

const Notes = () => {

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
          <div className="border border-[var(--ferrari-red)] mx-auto w-3/5 my-8"></div>
          <div className="flex flex-col justify-center sm:flex-row">
            {/* go to /notes/new */}
            <Link href="/notes/new" aria-label='Create New Note'>
              <button
                className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md">
                Create New Note
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notes