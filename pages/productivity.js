import { useState, useEffect } from 'react';

const productivity = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        let timer;

        if (timerActive && timeLeft > 0)
            timer = setTimeout(() => { setTimeLeft(timeLeft - 1) }, 1000)
        else if (timerActive && timeLeft === 0)
            setTimerActive(false)

        return () => clearTimeout(timer);
    }, [timerActive, timeLeft]);

    const startTimer = () => setTimerActive(true)
    const stopTimer = () => setTimerActive(false)
    const resetTimer = () => {
        setTimeLeft(25 * 60)
        setTimerActive(false)
    }

    const handleTimeChange = value => setTime(value)

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    const Options = ({ onChange, value }) => {
        return (
            <div className="flex justify-center items-center space-x-4">
                <button
                    onClick={() => onChange(25)}
                    className={`px-4 py-2 rounded-lg focus:outline-none ${value === 25 ? "bg-blue-500 text-white" : ""}`}
                >
                    25 mins
                </button>
                <button
                    onClick={() => onChange(30)}
                    className={`px-4 py-2 rounded-lg focus:outline-none ${value === 30 ? "bg-blue-500 text-white" : ""}`}
                >
                    30 mins
                </button>
                <button
                    onClick={() => onChange(40)}
                    className={`px-4 py-2 rounded-lg focus:outline-none ${value === 40 ? "bg-blue-500 text-white" : ""}`}
                >
                    40 mins
                </button>
                <button
                    onClick={() => onChange(60)}
                    className={`px-4 py-2 rounded-lg focus:outline-none ${value === 60 ? "bg-blue-500 text-white" : ""}`}
                >
                    1 hour
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Options onChange={handleTimeChange} value={time} />
        </div>
    )
}

export default productivity