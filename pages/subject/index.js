import React, { useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from "react-redux";
import { BsPencilFill, BsEye } from 'react-icons/bs'
import { AiOutlineDelete, AiOutlineShareAlt } from 'react-icons/ai'
import moment from 'moment/moment';

import { Loader } from '../../components';
import { getSubjects, selectSubjects } from '../../store/slices/subject'
import { ContextStore } from '../../constants/context/Context';

const Subject = () => {
    const [chapters, setChapters] = useState([]);

    const dispatch = useDispatch();
    const router = useRouter();

    const { user } = useContext(ContextStore);
    const subjects = useSelector(selectSubjects);

    console.log(subjects)

    useEffect(() => {
        if (user.isPresent && !subjects.isFetching && chapters?.length == 0)
            dispatch(getSubjects(user.uid));
    }, [user.isPresent]);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setChapters(subjects.subjects);
    }, [subjects]);

    return (
        <>
            <Head>
                <title>Subjects</title>
            </Head>
            <div className='w-4/5 mx-auto my-5'>
                <div className='flex flex-col'>
                    <div className='flex flex-row justify-between'>
                        <h1 className='text-3xl font-bold header-text'>Subjects</h1>
                        <button className='bg-theme-ferrari-red text-white px-4 py-2 rounded-md'>Add Subject</button>
                    </div>
                    <div className='flex flex-row justify-between mt-5'>
                        <div className='flex flex-col w-full'>
                            <h4 className='text-xl border-b-2 border-theme-orange w-2/5'>Your subjects</h4>
                            <div className='flex flex-col mt-5 w-full'>
                                {user?.isPresent ?
                                    chapters?.length > 0 ? (
                                        chapters.map((chapter, index) => (
                                            <div
                                                key={index}
                                                className='flex flex-row justify-between p-3 shadow-md rounded-sm mb-3'>
                                                <div>
                                                    <h4 className='text-lg'>{chapter.Subname}</h4>
                                                    <div className='border-b border-theme-ferrari-red my-1'></div>
                                                    <p className="text-sm">{chapter.Subdesc}</p>
                                                    <p>
                                                        <span className="text-xs text-gray-500">{moment(chapter.createdAt).format("dddd MMM Do YY")}</span>
                                                    </p>
                                                    <div className="mt-3">
                                                        {chapter.Subtags?.map((tag, index) => (
                                                            <span key={index} className="inline-block bg-orange-100 rounded-full p-1 px-2 text-xs text-black mr-2 mb-2">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className='flex justify-center items-center'>
                                                    <BsPencilFill className='mr-3 hover:cursor-pointer' />
                                                    <BsEye
                                                        className='mr-3 hover:cursor-pointer'
                                                        onClick={() => router.push(`/subject/notes/${chapter._id}`)}
                                                    />
                                                    <AiOutlineDelete className='mr-3 hover:cursor-pointer' />
                                                    <AiOutlineShareAlt className='mr-3 hover:cursor-pointer' />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className='flex items-center flex-col justify-center'>
                                            <p className='mb-4'>No notes are available</p>
                                            <Loader />
                                        </div>
                                    ) :
                                    <div className='flex items-center flex-col justify-center'>
                                        <p className='mb-4'>Please wait while we fetch your notes</p>
                                        <Loader />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Subject
