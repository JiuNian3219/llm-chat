/**
 * 复制信息
 * @param {string} text - 需要复制的信息
 * @param {object} messageApi - 消息API
 * @returns
 */
export async function copyText(text, messageApi) {
  let result = false;
  await navigator.clipboard
    .writeText(text)
    .then(() => {
      messageApi && messageApi.success("复制成功");
      result = true;
    })
    .catch((err) => {
      messageApi && messageApi.error("复制失败");
      result = false;
    });
  return result;
}
