import Image from 'next/legacy/image'
import React from 'react'
import { useRouter } from 'next/router';


const LandingPage = () => {
    const router = useRouter();

    return (
        <main className='mb-6'>
            <section className='relative flex flex-col sm:flex-row mt-3 mb-8'>
                <div className='flex-[1] flex items-center justify-center'>
                    <div className="relative w-[60%] h-[90%]">
                        <Image src='/assets/images/developer_activity.svg'
                            alt="Developers working on computers"
                            layout='fill'
                            objectFit='contain'
                        />
                    </div>
                </div>
                <div className='flex-[1]'>
                    <header className=''>
                        <h1 className='flex flex-col font-semibold text-[3rem] '>
                            <span className='text-theme-orange text-center sm:text-left'>Code.</span>
                            <span className='text-theme-ferrari-red ml-3 text-center sm:text-left'>Relax.</span>
                            <span className='text-theme-forest-green ml-6 text-center sm:text-left'>Innovate.</span>
                        </h1>
                    </header>
                    <div className='w-4/5 mx-auto sm:mx-0'>
                        <p>Get away from the busy world and develop your own relaxing environment.</p>
                    </div>

                </div>
            </section>
            <section className='w-4/5 mx-auto my-3'>
                <h1 className="sm:text-xl text-sm font-montserrat mb-1 mt text-gray-900">The Tools we provide</h1>
                <div className="h-[3px] w-32 bg-theme-ferrari-red rounded mb-4"></div>
                <section className="text-gray-600 body-font">
                    <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col">
                        <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                            <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Nature Sounds</h2>
                            <p className="leading-relaxed text-base">Immerse yourself in a focused and tranquil coding experience with our integrated soothing background sounds. Boost your productivity and eliminate distractions with our easy-to-use productivity tool. Say goodbye to scattered thoughts and hello to enhanced efficiency and relaxation.</p>
                            <div className="">
                                <button
                                    className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                    onClick={() => router.push('/chillSounds')}
                                >Listen Now</button>
                            </div>
                        </div>
                        <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                            <Image src='/assets/images/nature.svg'
                                alt="Nature Sounds"
                                height={100}
                                width={100}
                            />
                        </div>
                    </div>
                    <div className="flex items-center lg:w-3/5 mx-auto sm:flex-row flex-col">
                        <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                            <Image src='/assets/images/todo.svg'
                                alt="Nature Sounds"
                                height={100}
                                width={100}
                            />
                        </div>
                        <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                            <h2 className="text-gray-900 text-lg title-font font-medium mb-2">ToDo & Pomodoro</h2>
                            <p className="leading-relaxed text-base">Boost your productivity and stay on top of your tasks with our integrated Todo List and Pomodoro Timer. Prioritize your to-dos, keep track of your progress, and stay focused with timed work and rest intervals. Say goodbye to distractions and hello to a more organized and efficient work experience.</p>
                            <button
                                className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                onClick={() => router.push('/productivity')}
                            >Use Now</button>
                        </div>
                    </div>
                    <div className="container px-5 py-24 mx-auto">
                        <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col">
                            <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                                <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Threaded Notes</h2>
                                <p className="leading-relaxed text-base">
                                    Introducing our chat-style note-taking feature with threaded conversations, designed to capture multiple streams of thoughts in one place. Organize ideas with ease and never lose track of your train of thought. With our innovative note-taking system, you will be able to effortlessly manage your notes and ideas, saving time and increasing productivity.
                                </p>
                                <button
                                    className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                    onClick={() => router.push('/notes')}
                                >Make Notes</button>
                            </div>
                            <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                                <Image src='/assets/images/nature.svg'
                                    alt="Nature Sounds"
                                    height={100}
                                    width={100}
                                />
                            </div>
                        </div>
                        <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col-reverse">
                            <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                                <Image src='/assets/images/lofi.svg'
                                    alt="Nature Sounds"
                                    height={100}
                                    width={100}
                                />
                            </div>
                            <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                                <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Lofi & Chill</h2>
                                <p className="leading-relaxed text-base">Experience the soothing and calming sounds of Lofi Songs and improve your focus and productivity. Let our carefully curated selection of relaxing beats transport you to a state of mental clarity and tranquility, helping you stay on track and achieve your goals. With our integrated Pomodoro timer and convenient to-do list, you can eliminate distractions and make the most of your time. Say goodbye to stress and hello to a more productive and enjoyable workday with Lofi Songs.</p>
                                <button
                                    className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                    onClick={() => router.push('/chillSounds')}
                                >Listen Now</button>
                            </div>
                        </div>
                    </div>
                </section>
            </section>
        </main>
    )
}

export default LandingPage