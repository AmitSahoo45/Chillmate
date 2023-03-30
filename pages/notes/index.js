import Image from 'next/image'
import React, { useState } from 'react'
import DOMPurify from 'dompurify';

const Notes = () => {
  const [header, setHeader] = useState('');
  const [note, setNote] = useState('');

  const sanitizeText = (text) => {
    const allowedTags = ['b', 'i', 'u', 'span'];
    const allowedAttributes = {
      'span': ['style', '#'],
      'b': [],
      'i': [],
      'u': []
    };

    let sanitizedText

    try {
      sanitizedText = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttributes
      });

      sanitizedText = sanitizedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/~(.*?)~/g, '<s>$1</s>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>')
        .replace(/#&(\w+)#&([\w\s]+)#&\1#&/g, '<span style="color: $1">$2</span>')
        .replace(/\|u\|(.*?)\|u\|/g, '<u>$1</u>')
    } catch (error) {
      console.log(error);
      sanitizedText = text;
    }
    return sanitizedText;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedText = sanitizeText(note);
    console.log(sanitizedText);
  };

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
        <main className='flex flex-col justify-center w-11/12 mx-auto'>
          <h3>Make Notes</h3>
          <div className="flex flex-col">
            <label htmlFor="note">Note</label>
            <textarea name="note" id="note"
              rows={10}
              value={note}
              // remove outline when focused
              className="border border-[var(--ferrari-red)] rounded-md p-2 focus:outline-none"
              onChange={(e) => setNote(e.target.value)} />
          </div>
          <button
            className="bg-[var(--ferrari-red)] text-white px-4 py-2 mt-5 rounded-md"
            onClick={handleSubmit}
          >Add Note</button>

          <div dangerouslySetInnerHTML={{ __html: sanitizeText(note) }} />
        </main>
      </div>
    </div>
  )
}

export default Notes