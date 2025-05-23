import styles from "./index.module.css";

/**
 * 三点脉冲加载动画组件
 * @param {object} props - 组件属性
 * @param {string} [props.color='#1677ff'] - 点的颜色
 * @param {number} [props.size=8] - 点的大小(px)
 * @param {number} [props.speed=1.2] - 动画速度倍率
 * @param {string} [props.className] - 额外的类名
 * @returns
 */
const DotPulseLoader = ({ color, size, speed, className }) => {
  const dotStyle = {
    width: `${size == undefined ? 8 : size}px`,
    height: `${size == undefined ? 8 : size}px`,
    backgroundColor: color || "#1677ff",
    animationDuration: `${1.4 / (speed == undefined ? 1.2 : speed)}s`,
  };

  return (
    <div className={`${styles.container} ${className || undefined}`}>
      <div
        className={styles.dot}
        style={dotStyle}
      ></div>
      <div
        className={styles.dot}
        style={{ ...dotStyle, animationDelay: "0.2s" }}
      ></div>
      <div
        className={styles.dot}
        style={{ ...dotStyle, animationDelay: "0.4s" }}
      ></div>
    </div>
  );
};

export default DotPulseLoader;
