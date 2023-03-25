const Avatar = ({ src, alt, size = 40 }) => {
    return (
        <div
            className="inline-flex items-center justify-center rounded-full bg-gray-300 overflow-hidden shadow-md"
            style={{ width: size, height: size }}
        >
            <img
                src={src}
                alt={alt}
                className="object-cover object-center w-[50px] h-[50px] border" 
            />
        </div>
    );
};

export default Avatar;
