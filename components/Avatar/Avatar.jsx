import { toast } from 'react-toastify'
import { useContext } from "react";
import { ContextStore } from "../../constants/context/Context";

const Avatar = ({ src, alt, size = 40 }) => {
    const { id } = useContext(ContextStore)

    const copyId = () => {
        navigator.clipboard.writeText(id)
        toast.success('ID copied to clipboard')
    }

    return (
        <div
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gray-300 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.1)]"
            style={{ width: size, height: size }}
            onClick={copyId}
        >
            <img
                src={src}
                alt={alt}
                className="object-cover object-center"
            />
        </div>
    );
};

export default Avatar;
