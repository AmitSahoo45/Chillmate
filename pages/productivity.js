import { useContext, useEffect, useState } from 'react';
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import { collection, getDocs, doc, addDoc, deleteDoc } from 'firebase/firestore'
import moment from 'moment/moment';

import { Labels, Modal, TimeDisplay, ToggleButton } from '../components/Pomodoro'
import { controllers } from '../constants/Exports/Pomodoro'
import { useTimer, useCalculateTime } from '../constants/Hooks/Pomodoro';
import { database } from '../constants/Firebase/firebaseClient';
import { ContextStore } from '../constants/context/Context';

import "react-circular-progressbar/dist/styles.css";

const Productivity = () => {
    const [isSettingsOn, setIsSettingsOn] = useState(false);
    const [inputText, setInputText] = useState('')
    const [tasks, setTasks] = useState([])
    const [taskHook, setTaskHook] = useState(false)

    const { pomodoro, selectedControl, setPomodoro,
        setSelectedControl, resetTimerValues, getRemainingTimePercentage } = useTimer();
    const { minutes, seconds } = useCalculateTime({ pomodoro, selectedControl });
    const { user } = useContext(ContextStore)

    const addTask = async () => {
        if (inputText === '') {
            alert('Please enter a task')
            return
        }

        if (user.isPresent === false) {
            alert('Please sign in to add a task')
            return
        }
        try {
            const docRef = await addDoc(collection(database, "users", user.uid, "tasks"), {
                task: inputText,
                completed: false,
                date: new Date()
            });
            setTaskHook(!taskHook)
            setInputText('')
        } catch (error) {
            console.log(error)
        }
    }

    const deleteTask = async (id) => {
        if (user.isPresent === false) {
            alert('Please sign in to add a task')
            return
        }
        try {
            await deleteDoc(doc(database, "users", user.uid, "tasks", id));
            setTaskHook(!taskHook)
        } catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        if (user.isPresent) {
            const querySnapshot = getDocs(collection(database, "users", user.uid, "tasks"));
            querySnapshot.then((querySnapshot) => {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setTasks(data)
            })
        }
    }, [taskHook, user]);

    return (
        <>
            <main className="relative flex flex-col justify-center items-center mt-3">
                <h2 className="capitalize text-xl font-thin tracking-wider text-gray-700 font-montserrat my-4">Pomodoro</h2>
                <Labels
                    resetTimerValues={resetTimerValues}
                    selectedControl={selectedControl}
                    setSelectedControl={setSelectedControl}
                    setPomodoro={setPomodoro}
                />
                <div className="tw-timer-container">
                    <div className="tw-timer">
                        <div className="flex flex-col justify-center items-center font-semibold relative">
                            <CircularProgressbarWithChildren
                                strokeWidth={2}
                                trailColor="transparent"
                                value={getRemainingTimePercentage()}
                                styles={buildStyles({
                                    trailColor: "transparent",
                                    pathColor: "#000000",
                                })}>
                                <TimeDisplay
                                    pomodoro={pomodoro}
                                    selectedControl={selectedControl}
                                />
                                <ToggleButton
                                    pomodoro={pomodoro}
                                    setPomodoro={setPomodoro}
                                />
                            </CircularProgressbarWithChildren>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsSettingsOn(true)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 m-6 ">
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                        />
                    </svg>
                </button>
                <Modal
                    isSettingsOn={isSettingsOn}
                    setIsSettingsOn={setIsSettingsOn}
                    setPomodoro={setPomodoro}
                />
            </main>
            <div className="border border-[var(--ferrari-red)] mx-auto w-3/5 my-8"></div>
            <main className="flex flex-col items-center">
                <h2 className="text-xl font-thin tracking-wider text-gray-700 font-montserrat mb-3">Your Tasks</h2>
                <div className="flex w-4/5">
                    <input
                        type="text"
                        placeholder="Add a task"
                        className="w-full h-10 p-2 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--ferrari-red)] focus:ring-opacity-50 shadow-md flex-[0.7]"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <button
                        className="bg-[var(--ferrari-red)] text-white w-full h-10 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ferrari-red)] focus:ring-opacity-50 shadow-md flex-[0.3] ml-3"
                        onClick={addTask}
                    >
                        Add Task
                    </button>
                </div>
                <div className="w-4/5 h-4/5 p-2 bg-gradient-to-t to-[var(--orange)] from-[var(--ferrari-red)] mb-5 rounded-md">
                    <div>
                        {tasks.length > 0 ?
                            (tasks.map((task, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-theme-ecru-white rounded-md mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{task.task}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Added On - {moment(task.date.toDate()).format("MMM Do YY")}
                                        </p>
                                    </div>
                                    <button
                                        className="bg-theme-ecru-white p-2 rounded-full"
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-6 h-6 text-gray-700">
                                            <path
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))) :
                            (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-lg font-semibold text-theme-ecru-white">No tasks added yet</p>
                                </div>
                            )
                        }
                    </div>
                </div>
            </main>
        </>
    )
}

export default Productivity