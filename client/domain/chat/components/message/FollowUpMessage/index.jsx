import { Button } from "antd";
import styles from "./index.module.css";

const FollowUpMessage = ({ message }) => {
  return <Button className={styles.follow}>{message}</Button>;
};

export default FollowUpMessage;
