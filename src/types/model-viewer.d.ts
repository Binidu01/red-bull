// src/types/model-viewer.d.ts
import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src: string;
        alt?: string;
        'camera-controls'?: boolean;
        'disable-zoom'?: boolean;
        'disable-pan'?: boolean;
        'camera-orbit'?: string;
        'environment-image'?: string;
        'auto-rotate'?: boolean;
        ar?: boolean;
        'ar-modes'?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<any>;
        children?: React.ReactNode;
      };
    }
  }
}