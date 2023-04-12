import React, { useContext, useEffect, useRef } from "react";

import { stages } from "../../constants/Exports/Pomodoro";
import { ContextStore } from "../../constants/context/Context";
import ModalInput from './ModalInput'

const Modal = ({ isSettingsOn, setIsSettingsOn, setPomodoro }) => {
    const { formData, setFormData } = useContext(ContextStore);
    const modalRef = useRef();

    function handleSubmit(e) {
        e.preventDefault();
        setPomodoro((prevPomodoro) => ({
            ...prevPomodoro,
            pomodoroTime: formData.pomodoroTime * 60,
            shortBreakTime: formData.shortBreakTime * 60,
            longBreakTime: formData.longBreakTime * 60,
        }));
        setIsSettingsOn(false);
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    }

    function handleOutsideClick(e) {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            setIsSettingsOn(false);
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    return (
        <>
            {isSettingsOn && (
                <div
                    className={`block modal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] md:w-[28rem] rounded-2xl text-pmd-blue-800 px-6 pt-6 pb-6 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)] z-50`}
                    ref={modalRef}>
                    <div className=" flex pb-6 border-b justify-between items-center">
                        <h2 className="font-bold text-xl">Settings</h2>
                        <button onClick={() => setIsSettingsOn(false)}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <h3 className="uppercase tracking-wider font-bold text-sm py-1">Time (minutes)</h3>
                        <form
                            className="flex flex-col"
                            onSubmit={handleSubmit}>
                            <div className="flex">
                                <ModalInput
                                    label={"pomodoro"}
                                    name={"pomodoroTime"}
                                    defaultValue={formData.pomodoroTime}
                                    setFormData={setFormData}
                                    onChange={handleInputChange}
                                />
                                <ModalInput
                                    label={"short break"}
                                    name={"shortBreakTime"}
                                    defaultValue={formData.shortBreakTime}
                                    setFormData={setFormData}
                                    onChange={handleInputChange}
                                />
                                <ModalInput
                                    label={"long break"}
                                    name={"longBreakTime"}
                                    defaultValue={formData.longBreakTime}
                                    setFormData={setFormData}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mt-4 flex justify-center">
                                <button
                                    type="submit"
                                    className="-bottom-5 bg-[var(--orange)] text-theme-ecru-white font-semibold text-sm rounded-full px-8 py-3 cursor-pointer">
                                    Apply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Modal;