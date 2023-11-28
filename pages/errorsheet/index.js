import React, { useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BiRightArrowAlt, BiShare } from 'react-icons/bi'

import { ContextStore } from '../../constants/context/Context'

const ErrorSheet = () => {
    const router = useRouter()
    const { user, id } = useContext(ContextStore)

    const copyURL = () => navigator.clipboard.writeText(`https://chillmate.vercel.app/errorsheet/${id}`)

    return (
        <>
            <Head>
                <title>Error Sheet | Chillmate</title>
                <meta property="og:title" content={`Error Sheet - Chillmate | ${user.name}`} />
                <meta property="og:description" content='Accelerate your tech interview preparation with an innovative error sheet. Seamlessly track and learn from your mistakes in coding problems and algorithms. Easily document the problems you encounter, including links to their sources, and note the specific mistakes made. Avoid repetition and supercharge your learning process by building a personalized repository of errors and insights. Maximize your interview success potential with this invaluable tool designed to enhance your problem-solving skills and boost your confidence. Start building your error sheet today and unleash your true coding potential' />
                <meta property="og:image" content='./assets/images/logo.png' />
                <meta property="og:url" content={`https://chillmate.vercel.app/errorsheet`} />
                <meta property="og:type" content="website" />
            </Head>
            <div className='min-h-[80vh] mx-auto px-8 py-5'>
                <header className='text-center'>
                    <h1 className='text-2xl font-thin font-montserrat uppercase tracking-widest underline underline-offset-8 text-theme-ferrari-red'>Error Sheet</h1>
                    <p className='mt-6 sm:w-3/5 w-5/6 mx-auto font-medium leading-8'>
                        Accelerate your tech interview preparation with an innovative error sheet. Seamlessly track and learn from your mistakes in coding problems and algorithms. Easily document the problems you encounter, including links to their sources, and note the specific mistakes made. Avoid repetition and supercharge your learning process by building a personalized repository of errors and insights. Maximize your interview success potential with this invaluable tool designed to enhance your problem-solving skills and boost your confidence. Start building your error sheet today and unleash your true coding potential.
                    </p>
                </header>

                {user.isPresent && (
                    <main>
                        <section
                            className='mt-5'
                            aria-label='Features'
                        >
                            <h2 className='text-xl font-thin font-montserrat uppercase tracking-widest underline underline-offset-8 text-theme-ferrari-red text-center'>Features</h2>
                            <ol type='1' className='mt-3 list-decimal list-inside mx-auto sm:w-2/3 w-full'>
                                <li className='font-light mt-1'>Track your mistakes in coding problems and algorithms</li>
                                <li className='font-light mt-1'>Document the problems you encounter, including links to their sources and problems</li>
                                <li className='font-light mt-1'>Note the specific mistakes made and add tags</li>
                                <li className='font-light mt-1'>Avoid repetition and supercharge your learning process by building a personalized repository of errors and insights</li>
                                <li className='font-light mt-1'>Maximize your interview success potential with this invaluable tool designed to enhance your problem-solving skills and boost your confidence</li>
                            </ol>
                        </section>

                        <section className='mt-5 '>
                            <h2 className='text-xl font-thin font-montserrat uppercase tracking-widest underline underline-offset-8 text-theme-ferrari-red text-center'>Accessed Sheets</h2>
                            <div
                                className='mt-5 mb-4 flex flex-col items-center justify-center w-4/5 mx-auto'
                                aria-label='Access Sheets'
                            >
                                <div className='flex items-center w-full justify-between p-5 border border-theme-ferrari-red rounded-2xl shadow-md transition-all hover:shadow-lg'>
                                    <h2 className=''>Your Error Report</h2>
                                    <div className="flex">
                                        <BiShare className='text-2xl mr-4 hover:cursor-pointer' onClick={() => copyURL()} />
                                        <BiRightArrowAlt className='text-2xl hover:cursor-pointer' onClick={() => router.push(`/errorsheet/${id}`)} />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between p-5 border border-theme-ferrari-red rounded-2xl shadow-md cursor-pointer transition-all hover:shadow-lg mt-4'>
                                    <h2 className=''>
                                        Error Reports shared with you
                                        <span className='font-bold'>(Comming soon!!!)</span>
                                    </h2>
                                    <BiRightArrowAlt className='text-2xl' />
                                </div>
                            </div>
                        </section>
                    </main>
                )}
            </div>
        </>
    )
}

export default ErrorSheet