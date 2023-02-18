import Image from "next/image";

const Avatar = ({ src, alt, size = 40 }) => {
    return (
        <div
            className="inline-flex items-center justify-center rounded-full bg-gray-300 overflow-hidden"
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={alt}
                width={size}
                height={size}
                className="object-cover object-center"
            />
        </div>
    );
};

export default Avatar;
