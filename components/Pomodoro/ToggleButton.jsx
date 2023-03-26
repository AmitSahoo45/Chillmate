const ToggleButton = ({ pomodoro, setPomodoro }) => {
    function togglePausePlay() {
        setPomodoro((prevPomodoro) => {
            return {
                ...prevPomodoro,
                isPaused: !prevPomodoro.isPaused,
            };
        });
    }

    return (
        <button
            onClick={togglePausePlay}
            className="text-base uppercase tracking-[0.5rem]">
            {pomodoro.isPaused ? "START" : "STOP"}
        </button>
    );
};

export default ToggleButton;  