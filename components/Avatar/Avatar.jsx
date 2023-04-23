const Avatar = ({ src, alt, size = 40 }) => {
    return (
        <div
            className="inline-flex items-center justify-center rounded-full bg-gray-300 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.1)]"
            style={{ width: size, height: size }}
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
