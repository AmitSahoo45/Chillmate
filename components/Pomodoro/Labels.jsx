import { controllers } from "../../constants/Exports/Pomodoro";

const Labels = ({ selectedControl, setSelectedControl, resetTimerValues, setPomodoro }) => {
    function handleSelectedControl(index) {
        setSelectedControl(index);
        resetTimerValues();
        setPomodoro((prevPomodoro) => ({
            ...prevPomodoro,
            isPaused: true,
        }));
    }

    return (
        <div>
            <ul className="tw-infoContainer">
                {controllers.map((controller, index) => (
                    <li
                        key={index}
                        className={`font-poppins uppercase font-thin tracking-wide tw-infoItem ${selectedControl === index && "active"}`}
                        onClick={() => handleSelectedControl(index)}>
                        {controller.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Labels;