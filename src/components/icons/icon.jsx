/* eslint-disable react/prop-types */
function SvgComponent({ width, height, fill }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 外圈：顺时针 虚线旋转 */}
            <circle cx="50" cy="50" r="44" stroke="#00f5d4" strokeWidth="3" strokeDasharray="15 10" opacity="0.8">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
            </circle>

            {/* 中圈：反向高速旋转 + 彩色断点虚线 */}
            <circle cx="50" cy="50" r="38" strokeWidth="4" strokeDasharray="8 5">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="-360 50 50" dur="5s" repeatCount="indefinite" />
                <animate attributeName="stroke" values="#00f5d4;#00a6ff;#9966ff;#00f5d4" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* 内圈：反向超高速 彩色断点虚线（超级明显）*/}
            <circle cx="50" cy="50" r="30" stroke="#66ddff" strokeWidth="2" strokeDasharray="5 3" opacity="0.8">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="-360 50 50" dur="3.5s" repeatCount="indefinite" />
            </circle>

            {/* 动态光点 */}
            <circle cx="27" cy="27" r="6">
                <animate attributeName="fill" values="#31e1f1;#00a6ff;#9966ff;#31e1f1" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="73" cy="27" r="6">
                <animate attributeName="fill" values="#00a6ff;#9966ff;#31e1f1;#00a6ff" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="80" r="6">
                <animate attributeName="fill" values="#9966ff;#31e1f1;#00a6ff;#9966ff" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.6s" repeatCount="indefinite"/>
            </circle>

            {/* Z字母 动态变色 */}
            <text x="50" y="68" fontSize="60" fontWeight="bold" textAnchor="middle" fontFamily="Arial,sans-serif">
                <animate attributeName="fill" values="#00f5d4;#00a6ff;#9966ff;#00f5d4" dur="4s" repeatCount="indefinite" />
                Z
            </text>
        </svg>
    );
}
export default SvgComponent