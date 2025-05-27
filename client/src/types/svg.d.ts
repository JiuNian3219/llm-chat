declare module '*.svg' {
  // 导入的 SVG 文件会被转换为 URL 字符串
  const content: string;
  export default content;
}

declare module '*.svg?react' {
  // 当作为 React 组件导入时的类型
  import { FunctionComponent, SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}