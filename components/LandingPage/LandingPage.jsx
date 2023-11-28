import Image from 'next/image'
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
                        <p>The ultimate productivity tool for developers and students</p>
                    </div>
                </div>
            </section>
            <section className='w-4/5 mx-auto my-3'>
                <h1 className="sm:text-xl text-sm font-montserrat mb-1 mt text-gray-900">The Tools we provide</h1>
                <div className="h-[3px] w-32 bg-theme-ferrari-red rounded mb-4"></div>
                <section className="text-gray-600 body-font">

                    <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col">
                        <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                            <Image src='/assets/images/lofi.svg'
                                alt="Nature Sounds"
                                height={100}
                                width={100}
                            />
                        </div>
                        <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                            <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Error Sheet</h2>
                            <p className="leading-relaxed text-base">
                                Designed to assist students in monitoring and improving their DSA skills. This enables users to record solved problems, including links and notes for each. It provides a structured way for CS students to track their DSA journey, identifying areas for improvement and fostering continuous learning and growth. With this feature, students can easily manage their progress, maintain a comprehensive record of their problem-solving journey, and work on refining their DSA abilities effectively.
                            </p>
                            <button
                                className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                onClick={() => router.push('/errorsheet')}
                            >Track them</button>
                        </div>
                    </div>

                    <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col-reverse">
                        <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                            <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Threaded Notes</h2>
                            <p className="leading-relaxed text-base">
                                Introducing our chat-style note-taking feature with threaded conversations, designed to capture multiple streams of thoughts in one place. Organize ideas with ease and never lose track of your train of thought. With our innovative note-taking system, you will be able to effortlessly manage your notes and ideas, saving time and increasing productivity.
                            </p>
                            <button
                                className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                onClick={() => router.push('/subject')}
                            >Make Notes</button>
                        </div>
                        <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                            <Image src='/assets/images/notes.svg'
                                alt="Nature Sounds"
                                height={100}
                                width={100}
                            />
                        </div>
                    </div>


                    <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row-reverse flex-col-reverse">
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


                    <div className="container px-5 py-5 mx-auto">

                        <div className="flex items-center lg:w-3/5 mx-auto sm:flex-row-reverse flex-col border-b pb-10 mb-10 border-gray-200">
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

                        <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row-reverse flex-col-reverse">
                            <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                                <h2 className="text-gray-900 text-lg title-font font-medium mb-2">Job Application Tracker</h2>
                                <p className="leading-relaxed text-base">
                                    A powerful tool designed to streamline and simplify the job application process for employers. With our user-friendly interface and advanced search capabilities, employers can keeps a track of job listings, manage applications, and identify the most qualified candidates. Our app also offers a seamless experience for job seekers, providing them with a comprehensive database of job openings, personalized job recommendations, and easy application submission.
                                </p>
                                <button
                                    className='bg-theme-orange text-white font-semibold py-[6px] px-4 rounded mt-3'
                                    onClick={() => router.push('/jobtracker')}
                                >Track Now</button>
                            </div>
                            <div className="sm:w-32 sm:h-32 h-28 w-28 sm:mr-10 inline-flex items-center justify-center rounded-full flex-shrink-0 relative">
                                <Image src='/assets/images/jobhunt.svg'
                                    alt="Nature Sounds"
                                    height={100}
                                    width={100}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </section>
        </main>
    )
}

export default LandingPage