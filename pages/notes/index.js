import Image from 'next/image'
import React, { useState } from 'react'

const Notes = () => {
  const [header, setHeader] = useState('');
  const [note, setNote] = useState('');


  return (
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
        <main className='flex flex-col justify-center items-center'>
          <div className="flex flex-col w-4/5">
            <p className=''>Enter header</p>
            <textarea
              name="header" id="header"
              cols="50" rows="2"
              className='shadow-lg p-2 rounded-md border border-[var(--ferrari-red)] w-full sm:w-1/2'
            ></textarea>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Notes